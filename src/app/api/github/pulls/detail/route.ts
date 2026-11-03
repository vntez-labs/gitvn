import { NextResponse } from "next/server";
import { getValidAuthToken } from "@/lib/auth-token";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  const pullNumber = searchParams.get("pull_number");

  if (!owner || !repo || !pullNumber) {
    return NextResponse.json(
      { error: "Thiếu thông tin query" },
      { status: 400 },
    );
  }

  const token = await getValidAuthToken();

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    };

    // Gọi đồng thời PR detail, Files changed và Commits
    const [detailRes, filesRes, commitsRes] = await Promise.all([
      fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}`,
        { headers, cache: "no-store" },
      ),
      fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/files`,
        { headers, cache: "no-store" },
      ),
      fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/commits?per_page=100`,
        { headers, cache: "no-store" },
      ),
    ]);

    if (!detailRes.ok) {
      return NextResponse.json(
        { error: "Không thể tải chi tiết PR" },
        { status: detailRes.status },
      );
    }

    const pull = await detailRes.json();
    const files = filesRes.ok ? await filesRes.json() : [];
    const commits = commitsRes.ok ? await commitsRes.json() : [];

    return NextResponse.json({ pull, files, commits });
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
