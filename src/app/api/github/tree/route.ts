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
      if (res.status === 409) {
        return NextResponse.json({ tree: [], empty: true });
      }
      return NextResponse.json(
        {
          error:
            res.status === 404
              ? "Không tìm thấy branch hoặc bạn không có quyền truy cập repository."
              : "Không thể tải danh sách file từ GitHub.",
        },
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
