import { NextResponse } from "next/server";
import { getValidAuthToken } from "@/lib/auth-token";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  const branch = searchParams.get("branch");
  const path = searchParams.get("path");
  const page = searchParams.get("page") || "1";
  const perPage = searchParams.get("per_page") || "100";
  const author = searchParams.get("author");

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

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
  };

  try {
    const params = new URLSearchParams({ page, per_page: perPage });
    if (branch) params.set("sha", branch);
    if (author && author !== "all") params.set("author", author);
    if (path) params.set("path", path);
    const url = `https://api.github.com/repos/${owner}/${repo}/commits?${params}`;

    const res = await fetch(url, { headers, cache: "no-store" });

    if (res.status === 409) {
      return NextResponse.json({ commits: [], hasMore: false });
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: data.message || "Lỗi tải commits" },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json({
      commits: Array.isArray(data) ? data : [],
      hasMore: res.headers.get("link")?.includes('rel="next"') ?? false,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
