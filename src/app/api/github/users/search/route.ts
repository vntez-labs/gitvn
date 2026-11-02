import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");

  if (!q) {
    return NextResponse.json({ users: [] });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("github_access_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
  };

  try {
    // 1. Tìm kiếm người dùng GitHub
    const res = await fetch(
      `https://api.github.com/search/users?q=${encodeURIComponent(q)}&per_page=8`,
      { headers, cache: "no-store" },
    );

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: errData.message || "Lỗi tìm kiếm người dùng GitHub" },
        { status: res.status },
      );
    }

    const data = await res.json();
    const rawUsers = data.items || [];

    // 2. Nếu có owner và repo, kiểm tra xem user nào đã là collaborator
    let existingCollabs = new Set<string>();
    if (owner && repo) {
      try {
        const collabRes = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/collaborators?per_page=100`,
          { headers, cache: "no-store" },
        );
        if (collabRes.ok) {
          const collabs = await collabRes.json();
          if (Array.isArray(collabs)) {
            existingCollabs = new Set(
              collabs.map((c: any) => c.login?.toLowerCase()),
            );
          }
        }
      } catch {
        // Bỏ qua lỗi collaborators nếu user không có quyền admin
      }
    }

    const users = rawUsers.map((u: any) => ({
      id: u.id,
      login: u.login,
      avatar_url: u.avatar_url,
      html_url: u.html_url,
      isCollaborator: existingCollabs.has(u.login?.toLowerCase()),
    }));

    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
