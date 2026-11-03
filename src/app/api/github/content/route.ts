import { NextResponse } from "next/server";
import { getValidAuthToken } from "@/lib/auth-token";

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

  const token = await getValidAuthToken();

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    );
    if (ref) url.searchParams.set("ref", ref);

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.raw", // Trả thẳng text raw, không cần giải mã base64
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Lỗi tải nội dung file" },
        { status: res.status },
      );
    }

    const content = await res.text();
    return NextResponse.json({ content });
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

    if (!owner || !repo || !path || content === undefined) {
      return NextResponse.json(
        { error: "Thiếu thông tin bắt buộc (owner, repo, path, content)" },
        { status: 400 },
      );
    }

    let fileSha = sha;
    // Nếu chưa có sha, thử tìm sha của file hiện tại trên GitHub
    if (!fileSha) {
      try {
        const checkUrl = new URL(
          `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
        );
        if (branch) checkUrl.searchParams.set("ref", branch);
        const checkRes = await fetch(checkUrl.toString(), {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
          },
          cache: "no-store",
        });
        if (checkRes.ok) {
          const fileInfo = await checkRes.json();
          fileSha = fileInfo.sha;
        }
      } catch {
        // File chưa từng tồn tại, tạo mới
      }
    }

    const commitMessage =
      message?.trim() ||
      (fileSha ? `chore(code): update ${path}` : `chore(code): create ${path}`);
    const encodedContent = Buffer.from(content, "utf-8").toString("base64");

    const putRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: commitMessage,
          content: encodedContent,
          branch: branch || "main",
          ...(fileSha ? { sha: fileSha } : {}),
        }),
      },
    );

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
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
