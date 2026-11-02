import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  const branch = searchParams.get("branch") || "main";
  const path = searchParams.get("path");
  const page = searchParams.get("page") || "1";
  const perPage = searchParams.get("per_page") || "30";

  if (!owner || !repo) {
    return NextResponse.json(
      { error: "Thiếu owner hoặc repo" },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("github_access_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let url = `https://api.github.com/repos/${owner}/${repo}/commits?sha=${encodeURIComponent(branch)}&page=${page}&per_page=${perPage}`;
    if (path) {
      url += `&path=${encodeURIComponent(path)}`;
    }

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
      cache: "no-store",
    });

    // 409 hoặc 404 khi repo rỗng chưa có commit nào
    if (res.status === 409 || res.status === 404) {
      return NextResponse.json({ commits: [], total: 0 });
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: data.message || "Lỗi tải commits" },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json({ commits: Array.isArray(data) ? data : [] });
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
