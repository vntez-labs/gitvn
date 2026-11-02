import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");

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
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
        next: { revalidate: 60 },
      },
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Lỗi tải branches từ GitHub" },
        { status: res.status },
      );
    }

    const branches = await res.json();
    return NextResponse.json(
      { branches },
      {
        headers: {
          "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
