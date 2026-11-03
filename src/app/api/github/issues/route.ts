import { NextResponse } from "next/server";
import { getValidAuthToken } from "@/lib/auth-token";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  const state = searchParams.get("state") || "open";

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
    const issueStatesMap: Record<string, string[]> = {
      open: ["OPEN"],
      closed: ["CLOSED"],
      all: ["OPEN", "CLOSED"],
    };

    const targetStates = issueStatesMap[state] || ["OPEN"];

    const [res, gqlRes] = await Promise.all([
      fetch(
        `https://api.github.com/repos/${owner}/${repo}/issues?state=${state}&per_page=50&sort=created&direction=desc`,
        {
          headers,
          cache: "no-store",
        },
      ),
      fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            query($owner: String!, $name: String!, $states: [IssueState!]) {
              repository(owner: $owner, name: $name) {
                issues(states: $states) {
                  totalCount
                }
              }
            }
          `,
          variables: { owner, name: repo, states: targetStates },
        }),
        cache: "no-store",
      })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ]);

    if (!res.ok) {
      return NextResponse.json({ issues: [], totalCount: 0 }, { status: 200 });
    }

    const rawData = await res.json();
    if (!Array.isArray(rawData)) {
      return NextResponse.json({ issues: [], totalCount: 0 }, { status: 200 });
    }

    // Lọc bỏ Pull Request ra khỏi Issues
    const issues = rawData.filter((item: any) => !item.pull_request);
    const totalCount =
      gqlRes?.data?.repository?.issues?.totalCount ?? issues.length;

    return NextResponse.json({ issues, totalCount });
  } catch (error) {
    console.error("Lỗi lấy issues:", error);
    return NextResponse.json({ issues: [], totalCount: 0 }, { status: 200 });
  }
}
