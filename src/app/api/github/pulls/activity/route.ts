import { NextResponse } from "next/server";
import { getValidAuthToken } from "@/lib/auth-token";
import { pullRepositoryUrl } from "@/lib/pull-request";

async function githubContext(owner: unknown, repo: unknown, number: unknown) {
  const repository = pullRepositoryUrl(owner, repo);
  if (!repository || !/^[1-9]\d*$/.test(String(number))) return null;
  const token = await getValidAuthToken();
  if (!token) return "unauthorized" as const;
  const pull = `${repository}/pulls/${number}`;
  const read = (url: string, init?: RequestInit) =>
    fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
  return { read, pull, comments: `${repository}/issues/${number}/comments` };
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const context = await githubContext(
    params.get("owner"),
    params.get("repo"),
    params.get("pull_number"),
  );
  if (context === "unauthorized")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!context)
    return NextResponse.json(
      { error: "Phiên hoặc PR không hợp lệ." },
      { status: 400 },
    );

  const { read } = context;
  async function fetchPages(url: string) {
    const entries: unknown[] = [];
    for (let page = 1; ; page++) {
      const res = await read(`${url}?per_page=100&page=${page}`);
      if (!res?.ok) throw new Error();
      entries.push(...(await res.json()));
      if (!res.headers.get("link")?.includes('rel="next"')) return entries;
    }
  }

  try {
    const [comments, reviews] = await Promise.all([
      fetchPages(context.comments),
      fetchPages(`${context.pull}/reviews`),
    ]);
    return NextResponse.json({ comments, reviews });
  } catch {
    return NextResponse.json(
      { error: "Không thể tải hội thoại PR từ GitHub." },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  const input = await request.json().catch(() => null);
  const context = await githubContext(
    input?.owner,
    input?.repo,
    input?.pullNumber,
  );
  if (context === "unauthorized")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!context)
    return NextResponse.json(
      { error: "Phiên hoặc PR không hợp lệ." },
      { status: 400 },
    );
  const { action, sha } = input;
  const message = typeof input.body === "string" ? input.body.trim() : "";
  const hasSha = typeof sha === "string" && /^[a-f0-9]{40}$/i.test(sha);

  try {
    let res: Response;
    switch (action) {
      case "comment":
        if (!message) break;
        res = await context.read(context.comments, {
          method: "POST",
          body: JSON.stringify({ body: message }),
        });
        return githubResult(res);
      case "APPROVE":
      case "REQUEST_CHANGES": {
        if (!hasSha || (action === "REQUEST_CHANGES" && !message)) break;
        const currentResponse = await context.read(context.pull);
        if (!currentResponse.ok) return githubResult(currentResponse);
        const current = await currentResponse.json();
        if (current.head.sha !== sha)
          return NextResponse.json(
            {
              error: "PR đã có commit mới. Hãy xem lại diff trước khi review.",
            },
            { status: 409 },
          );
        res = await context.read(`${context.pull}/reviews`, {
          method: "POST",
          body: JSON.stringify({
            event: action,
            body: message || undefined,
            commit_id: sha,
          }),
        });
        return githubResult(res);
      }
      case "update":
        if (!hasSha) break;
        res = await context.read(`${context.pull}/update-branch`, {
          method: "PUT",
          body: JSON.stringify({ expected_head_sha: sha }),
        });
        return githubResult(res);
      case "ready": {
        const pr = await context.read(context.pull);
        if (!pr.ok) return githubResult(pr);
        const { node_id: id } = await pr.json();
        const response = await context.read("https://api.github.com/graphql", {
          method: "POST",
          body: JSON.stringify({
            query:
              "mutation($id: ID!) { markPullRequestReadyForReview(input: {pullRequestId: $id}) { pullRequest { isDraft } } }",
            variables: { id },
          }),
        });
        const result = await response.json();
        if (
          !response.ok ||
          result.errors?.length ||
          result.data?.markPullRequestReadyForReview?.pullRequest?.isDraft !==
            false
        ) {
          return NextResponse.json(
            {
              error:
                result.errors?.[0]?.message ||
                result.message ||
                "GitHub chưa xác nhận PR sẵn sàng để review.",
            },
            { status: response.ok ? 422 : response.status },
          );
        }
        return NextResponse.json({ success: true });
      }
    }
    return NextResponse.json(
      { error: "Thông tin thao tác PR không hợp lệ." },
      { status: 400 },
    );
  } catch {
    return NextResponse.json(
      { error: "Không thể gửi yêu cầu đến GitHub." },
      { status: 502 },
    );
  }
}

async function githubResult(res: Response) {
  if (res.ok)
    return NextResponse.json(
      { success: true },
      { status: res.status === 202 ? 202 : 200 },
    );
  const data = await res.json().catch(() => null);
  return NextResponse.json(
    { error: data?.message || "GitHub từ chối thao tác." },
    { status: res.status },
  );
}
