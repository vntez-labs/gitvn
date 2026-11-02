import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Hàm bóc tách tổng số trang từ header 'link' chuẩn RFC 5988 của GitHub
function parseTotalPages(
  linkHeader: string | null,
  currentPage: number,
): number {
  if (!linkHeader) return 1;

  const parts = linkHeader.split(",");
  for (const part of parts) {
    const [urlPart, relPart] = part.split(";");
    if (relPart && relPart.includes('rel="last"')) {
      const match = urlPart.match(/[?&]page=(\d+)/);
      if (match) return parseInt(match[1], 10);
    }
  }

  // Nếu có rel="prev" nhưng không có rel="next" -> đang ở trang cuối cùng
  if (linkHeader.includes('rel="prev"') && !linkHeader.includes('rel="next"')) {
    return currentPage;
  }

  return 1;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  const state = searchParams.get("state") || "all";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const perPage = parseInt(searchParams.get("per_page") || "15", 10);

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

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
  };

  try {
    const statesMap: Record<string, string[]> = {
      open: ["OPEN"],
      closed: ["CLOSED", "MERGED"],
      all: ["OPEN", "CLOSED", "MERGED"],
    };

    const targetStates = statesMap[state] || ["OPEN", "CLOSED", "MERGED"];

    const [res, gqlRes] = await Promise.all([
      fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls?state=${state}&page=${page}&per_page=${perPage}&sort=created&direction=desc`,
        { headers, cache: "no-store" },
      ),
      fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            query($owner: String!, $name: String!, $states: [PullRequestState!]) {
              repository(owner: $owner, name: $name) {
                pullRequests(states: $states) {
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
      return NextResponse.json(
        { error: "Lỗi tải PRs từ GitHub" },
        { status: res.status },
      );
    }

    const pulls = await res.json();
    const linkHeader = res.headers.get("link");

    const gqlCount = gqlRes?.data?.repository?.pullRequests?.totalCount;
    let totalCount = typeof gqlCount === "number" ? gqlCount : pulls.length;
    let totalPages = 1;

    if (typeof gqlCount === "number") {
      totalPages = Math.max(1, Math.ceil(gqlCount / perPage));
    } else {
      totalPages = parseTotalPages(linkHeader, page);
      totalCount = totalPages * perPage;
    }

    return NextResponse.json({ pulls, totalPages, totalCount });
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
