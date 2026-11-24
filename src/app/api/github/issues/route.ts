import { NextResponse } from "next/server";
import { getValidAuthToken } from "@/lib/auth-token";
import { searchGitHubWork } from "@/lib/github-work-search";

export async function GET(request: Request) {
  const token = await getValidAuthToken();
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const result = await searchGitHubWork(
      new URL(request.url).searchParams,
      {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
      "issue",
    );
    if (!result.ok) return result;
    const { items, ...pagination } = await result.json();
    return NextResponse.json({ issues: items, ...pagination });
  } catch {
    return NextResponse.json(
      { error: "Không thể tải Issues từ GitHub." },
      { status: 502 },
    );
  }
}
