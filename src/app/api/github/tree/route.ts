import { NextResponse } from "next/server";
import { getValidAuthToken } from "@/lib/auth-token";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  const branch = searchParams.get("branch") || "HEAD"; // Mặc định là HEAD nếu không truyền

  if (!owner || !repo) {
    return NextResponse.json(
      { error: "Thiếu owner hoặc repo" },
      { status: 400 },
    );
  }

  const token = await getValidAuthToken();

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // GitHub Trees API cho phép truyền thẳng tên branch vào vị trí tree_sha
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
        cache: "no-store", // Không cache tĩnh để khi đổi branch là có dữ liệu mới
      },
    );

    if (!res.ok) {
      // 409 hoặc 404 xảy ra khi repo rỗng (chưa có commit/branch nào)
      if (res.status === 409 || res.status === 404) {
        return NextResponse.json({ tree: [], empty: true });
      }
      return NextResponse.json(
        { error: "Lỗi tải tree từ GitHub" },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json({ tree: data.tree || [] });
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
