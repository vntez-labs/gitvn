import { NextResponse } from "next/server";
import { getValidAuthToken } from "@/lib/auth-token";

export async function PUT(request: Request) {
  const token = await getValidAuthToken();

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { owner, repo, pullNumber, mergeMethod } = await request.json();

    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/merge`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          merge_method: mergeMethod || "merge", // 'merge' | 'squash' | 'rebase'
        }),
      },
    );

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data.message || "Merge thất bại" },
        { status: res.status },
      );
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { error: "Lỗi server khi merge" },
      { status: 500 },
    );
  }
}
