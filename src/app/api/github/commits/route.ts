import { NextResponse } from "next/server";
import { getValidAuthToken } from "@/lib/auth-token";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  const branch = searchParams.get("branch") || "all";
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
    // Nếu yêu cầu "all", lấy danh sách commits từ các nhánh hoạt động và gộp lại
    if (branch === "all") {
      const branchesRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/branches?per_page=12`,
        { headers, cache: "no-store" },
      );

      const branchesData = branchesRes.ok ? await branchesRes.json() : [];
      const branchNames = Array.isArray(branchesData)
        ? branchesData.map((b: any) => b.name)
        : ["main"];

      if (branchNames.length === 0) {
        branchNames.push("main");
      }

      // Tải commits từ các nhánh song song (tối đa 8 nhánh phổ biến nhất)
      const targetBranches = branchNames.slice(0, 8);
      const commitLists = await Promise.all(
        targetBranches.map(async (bName) => {
          let bUrl = `https://api.github.com/repos/${owner}/${repo}/commits?sha=${encodeURIComponent(
            bName,
          )}&per_page=${perPage}&page=${page}`;
          if (author && author !== "all") {
            bUrl += `&author=${encodeURIComponent(author)}`;
          }
          if (path) {
            bUrl += `&path=${encodeURIComponent(path)}`;
          }
          const res = await fetch(bUrl, { headers, cache: "no-store" });
          if (!res.ok) return [];
          const data = await res.json();
          return Array.isArray(data) ? data : [];
        }),
      );

      // Gộp và khử trùng lặp theo SHA
      const commitMap = new Map<string, any>();
      commitLists.flat().forEach((c) => {
        if (c?.sha && !commitMap.has(c.sha)) {
          commitMap.set(c.sha, c);
        }
      });

      // Sắp xếp theo ngày commit mới nhất lên đầu
      const mergedCommits = Array.from(commitMap.values()).sort(
        (a, b) =>
          new Date(
            b.commit?.author?.date || b.commit?.committer?.date || 0,
          ).getTime() -
          new Date(
            a.commit?.author?.date || a.commit?.committer?.date || 0,
          ).getTime(),
      );

      return NextResponse.json({
        commits: mergedCommits,
        total: mergedCommits.length,
        branches: branchNames,
      });
    }

    // Trường hợp yêu cầu nhánh cụ thể
    let url = `https://api.github.com/repos/${owner}/${repo}/commits?sha=${encodeURIComponent(
      branch,
    )}&page=${page}&per_page=${perPage}`;
    if (author && author !== "all") {
      url += `&author=${encodeURIComponent(author)}`;
    }
    if (path) {
      url += `&path=${encodeURIComponent(path)}`;
    }

    const res = await fetch(url, { headers, cache: "no-store" });

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
