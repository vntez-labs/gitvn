import { NextResponse } from "next/server";
import { getValidAuthToken } from "@/lib/auth-token";
import { pullRepositoryUrl } from "@/lib/pull-request";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const repository = pullRepositoryUrl(
    searchParams.get("owner"),
    searchParams.get("repo"),
  );
  if (!repository)
    return NextResponse.json({ error: "Repo không hợp lệ." }, { status: 400 });
  const token = await getValidAuthToken();
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const branches: { name: string; commit: { sha: string } }[] = [];
    for (let page = 1; ; page++) {
      const res = await fetch(
        `${repository}/branches?per_page=100&page=${page}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
          },
          cache: "no-store",
        },
      );
      if (!res.ok)
        return NextResponse.json(
          { error: "Không tải được danh sách nhánh." },
          { status: res.status },
        );
      branches.push(...(await res.json()));
      if (!res.headers.get("link")?.includes('rel="next"')) break;
    }
    return NextResponse.json({ branches });
  } catch {
    return NextResponse.json(
      { error: "Không thể kết nối GitHub." },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  const token = await getValidAuthToken();
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { owner, repo, name, from } =
    (await request.json().catch(() => ({}))) ?? {};
  const repository = pullRepositoryUrl(owner, repo);
  if (
    !repository ||
    typeof name !== "string" ||
    !name.trim() ||
    typeof from !== "string" ||
    !from
  ) {
    return NextResponse.json(
      { error: "Thiếu thông tin nhánh." },
      { status: 400 },
    );
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };
  try {
    const base = await fetch(
      `${repository}/branches/${encodeURIComponent(from)}`,
      { headers, cache: "no-store" },
    );
    const branch = await base.json();
    if (!base.ok)
      return NextResponse.json(
        { error: branch.message },
        { status: base.status },
      );
    const result = await fetch(`${repository}/git/refs`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        ref: `refs/heads/${name.trim()}`,
        sha: branch.commit.sha,
      }),
    });
    const created = await result.json();
    return result.ok
      ? NextResponse.json({ name: name.trim() }, { status: 201 })
      : NextResponse.json(
          { error: created.message },
          { status: result.status },
        );
  } catch {
    return NextResponse.json(
      { error: "Không thể tạo nhánh trên GitHub." },
      { status: 502 },
    );
  }
}
