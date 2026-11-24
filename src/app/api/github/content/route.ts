import { NextResponse } from "next/server";
import { getValidAuthToken } from "@/lib/auth-token";
import { documentMimeTypes, getDocumentFormat } from "@/lib/document-format";

const imageMimeTypes = new Map([
  ["avif", "image/avif"],
  ["bmp", "image/bmp"],
  ["gif", "image/gif"],
  ["ico", "image/x-icon"],
  ["jpeg", "image/jpeg"],
  ["jpg", "image/jpeg"],
  ["png", "image/png"],
  ["svg", "image/svg+xml"],
  ["webp", "image/webp"],
]);

function contentsUrl(owner: string, repo: string, path: string) {
  return new URL(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${path.split("/").map(encodeURIComponent).join("/")}`,
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  const path = searchParams.get("path");
  const ref = searchParams.get("ref") || searchParams.get("branch");

  if (!owner || !repo || !path) {
    return NextResponse.json(
      { error: "Thiếu thông tin file" },
      { status: 400 },
    );
  }

  const binary = searchParams.get("binary");
  const format = getDocumentFormat(path);
  const image = binary === "image";
  const extension = /\.([a-z0-9]+)$/i.exec(path)?.[1].toLowerCase() ?? "";
  const mimeType = image
    ? imageMimeTypes.get(extension)
    : format && documentMimeTypes[format];
  if (binary && !mimeType) {
    return NextResponse.json(
      { error: "Định dạng không được hỗ trợ" },
      { status: 400 },
    );
  }

  const token = await getValidAuthToken();

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = contentsUrl(owner, repo, path);
    if (ref) url.searchParams.set("ref", ref);

    const pdf = binary && format === "pdf";
    const range = pdf ? request.headers.get("Range") : null;
    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: binary
          ? "application/vnd.github.raw+json"
          : "application/vnd.github.object+json",
        ...(pdf ? { "Accept-Encoding": "identity" } : {}),
        ...(range ? { Range: range } : {}),
      },
      cache: "no-store",
    });

    if (pdf && res.status === 416) {
      const contentRange = res.headers.get("Content-Range");
      return new Response(null, {
        status: 416,
        headers: {
          "Cache-Control": "private, no-store",
          ...(contentRange ? { "Content-Range": contentRange } : {}),
        },
      });
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: "Lỗi tải nội dung file" },
        { status: res.status },
      );
    }

    if (binary && mimeType) {
      const headers = new Headers({
        "Content-Type": mimeType,
        "Content-Disposition": image ? "inline" : "attachment",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      });
      if (image) {
        headers.set(
          "Content-Security-Policy",
          "sandbox; default-src 'none'; style-src 'unsafe-inline'; img-src data:",
        );
      }
      const encoding = res.headers.get("Content-Encoding");
      if (pdf && (!encoding || encoding === "identity")) {
        for (const name of [
          "Accept-Ranges",
          "Content-Range",
          "Content-Length",
        ]) {
          const value = res.headers.get(name);
          if (value) headers.set(name, value);
        }
      }
      return new Response(res.body, { headers, status: res.status });
    }

    const file = await res.json();
    if (file.type !== "file" || typeof file.sha !== "string") {
      return NextResponse.json(
        { error: "Đường dẫn không phải file." },
        { status: 422 },
      );
    }
    if (file.encoding === "base64" && typeof file.content === "string") {
      const bytes = Buffer.from(file.content, "base64");
      const content = bytes.toString("utf8");
      const editable = !bytes.includes(0) && Buffer.from(content).equals(bytes);
      return NextResponse.json({ content, sha: editable ? file.sha : null });
    }
    const raw = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.raw+json",
      },
      cache: "no-store",
    });
    if (!raw.ok)
      return NextResponse.json(
        { error: "Lỗi tải nội dung file" },
        { status: raw.status },
      );
    return NextResponse.json({ content: await raw.text(), sha: null });
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const token = await getValidAuthToken();

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { owner, repo, path, branch, content, message, sha } = body;

    if (
      typeof owner !== "string" ||
      !owner ||
      typeof repo !== "string" ||
      !repo ||
      typeof path !== "string" ||
      path.split("/").some((part) => !part || part === "." || part === "..") ||
      typeof branch !== "string" ||
      !branch ||
      typeof content !== "string" ||
      (sha !== null &&
        (typeof sha !== "string" || !/^[a-f0-9]{40}$/i.test(sha)))
    ) {
      return NextResponse.json(
        { error: "Thông tin commit không hợp lệ." },
        { status: 400 },
      );
    }

    const url = contentsUrl(owner, repo, path);
    const commitMessage =
      (typeof message === "string" && message.trim()) ||
      (sha ? `chore(code): update ${path}` : `chore(code): create ${path}`);
    const encodedContent = Buffer.from(content, "utf-8").toString("base64");

    const putRes = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: commitMessage,
        content: encodedContent,
        branch,
        ...(sha ? { sha } : {}),
      }),
    });

    const data = await putRes.json();
    if (!putRes.ok) {
      return NextResponse.json(
        { error: data.message || "Lỗi lưu file lên GitHub" },
        { status: putRes.status },
      );
    }

    return NextResponse.json({
      success: true,
      commit: data.commit,
      content: data.content,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 },
    );
  }
}
