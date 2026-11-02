import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("github_access_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description } = body;
    const isPrivate =
      body.private !== undefined
        ? Boolean(body.private)
        : body.is_private !== undefined
          ? Boolean(body.is_private)
          : true;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Tên repository không được để trống" },
        { status: 400 },
      );
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "GitVN-App",
    };

    // Xác định người dùng hiện tại để phân biệt repo cá nhân hay org
    let currentUserLogin = "";
    try {
      const userRes = await fetch("https://api.github.com/user", {
        headers,
        cache: "no-store",
      });
      if (userRes.ok) {
        const u = await userRes.json();
        currentUserLogin = u.login || "";
      }
    } catch {}

    const targetOwner = body.owner?.trim() || body.org?.trim();
    const isOrg = Boolean(
      targetOwner &&
        currentUserLogin &&
        targetOwner.toLowerCase() !== currentUserLogin.toLowerCase(),
    );

    const endpoint = isOrg
      ? `https://api.github.com/orgs/${encodeURIComponent(targetOwner)}/repos`
      : "https://api.github.com/user/repos";

    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: name.trim(),
        description: description?.trim() || "",
        private: isPrivate,
        auto_init: false, // Để trống repo để người dùng tự push hoặc khởi tạo
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      let errorMsg = data.message || "Tạo repo thất bại";
      if (data.message === "Resource not accessible by integration") {
        errorMsg = isOrg
          ? "GitHub App chưa có quyền tạo repo trên Organization (Organization permissions: Administration -> Read and write). Vui lòng cấu hình trên GitHub Developer Settings và đăng nhập lại."
          : "GitHub App chưa có quyền tạo repo (Repository permissions: Administration -> Read and write). Vui lòng cấu hình trên GitHub Developer Settings và đăng nhập lại.";
      }
      return NextResponse.json(
        { error: errorMsg },
        { status: res.status },
      );
    }

    return NextResponse.json({ repo: data });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("github_access_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { owner, repo, ...fields } = await request.json();

    if (!owner || !repo) {
      return NextResponse.json(
        { error: "Thiếu owner hoặc repo" },
        { status: 400 },
      );
    }

    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fields),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data.message || "Cập nhật thất bại" },
        { status: res.status },
      );
    }

    return NextResponse.json({ repo: data });
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("github_access_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { owner, repo } = await request.json();

    if (!owner || !repo) {
      return NextResponse.json(
        { error: "Thiếu owner hoặc repo" },
        { status: 400 },
      );
    }

    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: data.message || "Xóa repo thất bại" },
        { status: res.status },
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
