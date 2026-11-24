import { NextResponse } from "next/server";
import { getValidAuthToken } from "@/lib/auth-token";
import {
  type PullCheck,
  type PullChecks,
  pullRepositoryUrl,
} from "@/lib/pull-request";

interface GitHubCheckRun {
  id: number;
  name: string;
  app: { name: string } | null;
  status: string;
  conclusion: string | null;
  details_url?: string;
}

interface GitHubStatus {
  id: number;
  context: string;
  state: string;
  target_url?: string;
}

function githubReader(token: string) {
  return (url: string) =>
    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
      cache: "no-store",
    });
}

async function readPages<T, Item>(
  read: ReturnType<typeof githubReader>,
  url: string,
  itemsFrom: (data: T) => Item[],
) {
  const items: Item[] = [];
  const endpoint = new URL(url);
  for (let page = 1; ; page++) {
    endpoint.searchParams.set("per_page", "100");
    endpoint.searchParams.set("page", String(page));
    const res = await read(endpoint.href);
    if (!res.ok) throw new Error(`GitHub API: ${res.status}`);
    items.push(...itemsFrom(await res.json()));
    if (!res.headers.get("link")?.includes('rel="next"')) return items;
  }
}

async function readChecks(
  read: ReturnType<typeof githubReader>,
  repository: string,
  sha: string,
  testMerge: boolean,
): Promise<PullChecks> {
  const commit = `${repository}/commits/${encodeURIComponent(sha)}`;
  const [runs, statuses] = await Promise.allSettled([
    readPages(
      read,
      `${commit}/check-runs?filter=latest`,
      (data: { check_runs: GitHubCheckRun[] }) =>
        data.check_runs.map(
          (run): PullCheck => ({
            id: `run-${run.id}`,
            name: run.name,
            source: run.app?.name,
            status:
              run.status === "completed"
                ? (run.conclusion ?? "unknown")
                : run.status,
            url: run.details_url,
          }),
        ),
    ),
    readPages(read, `${commit}/status`, (data: { statuses: GitHubStatus[] }) =>
      data.statuses.map(
        (status): PullCheck => ({
          id: `status-${status.id}`,
          name: status.context,
          status: status.state,
          url: status.target_url,
        }),
      ),
    ),
  ]);

  return {
    items: [runs, statuses].flatMap((result) =>
      result.status === "fulfilled" ? result.value : [],
    ),
    incomplete: runs.status === "rejected" || statuses.status === "rejected",
    sha,
    testMerge,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const repository = pullRepositoryUrl(
    searchParams.get("owner"),
    searchParams.get("repo"),
  );
  const pullNumber = searchParams.get("pull_number");
  const view = searchParams.get("view");

  if (!repository || !pullNumber || !/^[1-9]\d*$/.test(pullNumber)) {
    return NextResponse.json(
      { error: "Thông tin Pull Request không hợp lệ." },
      { status: 400 },
    );
  }

  const token = await getValidAuthToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const read = githubReader(token);
  const url = `${repository}/pulls/${pullNumber}`;
  try {
    if (view === "files" || view === "commits") {
      const items = await readPages(
        read,
        `${url}/${view}`,
        (page: unknown[]) => page,
      );
      return NextResponse.json(items);
    }

    if (view !== "checks") {
      const response = await read(url);
      const pull = await response.json().catch(() => null);
      if (!response.ok || !pull) {
        return NextResponse.json(
          { error: pull?.message || "Không thể tải Pull Request." },
          { status: response.ok ? 502 : response.status },
        );
      }
      return NextResponse.json({ pull });
    }

    const sha = searchParams.get("sha");
    const testSha = searchParams.get("test_sha");
    const commit = /^[a-f0-9]{40}$/i;
    if (!sha || !commit.test(sha) || (testSha && !commit.test(testSha))) {
      return NextResponse.json(
        { error: "Commit kiểm tra không hợp lệ." },
        { status: 400 },
      );
    }
    const [headChecks, testChecks] = await Promise.all([
      readChecks(read, repository, sha, false),
      testSha && testSha !== sha
        ? readChecks(read, repository, testSha, true)
        : null,
    ]);
    const checks = testChecks?.items.length
      ? testChecks
      : {
          ...headChecks,
          incomplete: headChecks.incomplete || Boolean(testChecks?.incomplete),
        };

    return NextResponse.json(checks);
  } catch {
    return NextResponse.json(
      { error: "Không thể tải dữ liệu Pull Request từ GitHub." },
      { status: 502 },
    );
  }
}
