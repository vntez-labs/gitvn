import { NextResponse } from "next/server";
import { pullRepositoryUrl } from "@/lib/pull-request";

export async function searchGitHubWork(
  params: URLSearchParams,
  headers: HeadersInit,
  kind: "pr" | "issue",
) {
  const owner = params.get("owner");
  const repo = params.get("repo");
  const repository = pullRepositoryUrl(owner, repo);
  if (!repository)
    return NextResponse.json({ error: "Repo không hợp lệ." }, { status: 400 });

  const state = params.get("state");
  const query = (params.get("q") || "").trim().slice(0, 120);
  const view = params.get("view");
  const login = params.get("login");
  const page = Number(params.get("page") ?? 1);
  const perPage = 25;
  if (!Number.isInteger(page) || page < 1 || page > 1000 / perPage) {
    return NextResponse.json(
      { error: "Trang tìm kiếm không hợp lệ." },
      { status: 400 },
    );
  }
  if (/^#?\d+$/.test(query) && !view) {
    const result = await fetch(
      `${repository}/${kind === "pr" ? "pulls" : "issues"}/${query.replace("#", "")}`,
      { headers, cache: "no-store" },
    );
    if (!result.ok && result.status !== 404)
      return NextResponse.json(
        { error: "Không thể tìm mục trên GitHub." },
        { status: result.status },
      );
    const item = result.ok ? await result.json() : null;
    const matches =
      item &&
      (kind === "pr" || !item.pull_request) &&
      (!state || state === "all" || item.state === state);
    return NextResponse.json({
      items: matches ? [item] : [],
      totalCount: matches ? 1 : 0,
      totalPages: 1,
    });
  }

  const terms = [`repo:${owner}/${repo}`, `is:${kind}`];
  if (state === "open" || state === "closed") terms.push(`is:${state}`);
  if (login && /^[a-z0-9-]+$/i.test(login)) {
    if (view === "mine") terms.push(`author:${login}`);
    if (view === "review") terms.push(`review-requested:${login}`);
  }
  const title = query.replace(/["\\]/g, "");
  if (title) terms.push(`"${title}" in:title`);
  const search = new URLSearchParams({
    q: terms.join(" "),
    per_page: String(perPage),
    page: String(page),
    sort: "created",
    order: "desc",
  });
  const res = await fetch(`https://api.github.com/search/issues?${search}`, {
    headers,
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok)
    return NextResponse.json(
      { error: data.message || "Không thể tìm kiếm trên GitHub." },
      { status: res.status },
    );
  return NextResponse.json({
    items: data.items,
    totalCount: data.total_count,
    totalPages: Math.max(
      1,
      Math.ceil(Math.min(1000, data.total_count) / perPage),
    ),
    incomplete: data.incomplete_results || data.total_count > 1000,
  });
}
