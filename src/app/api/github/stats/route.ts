import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import type {
  CommitWeek,
  RepoContributor,
  RepoOverviewStats,
} from "@/interfaces/repo-overview";
import { getValidAuthToken } from "@/lib/auth-token";

const cache = new Map<string, { data: RepoOverviewStats; expires: number }>();
const cacheTtl = 5 * 60 * 1000;
const weekSeconds = 7 * 24 * 60 * 60;
const sundayEpoch = 3 * 24 * 60 * 60;

interface CommitNode {
  committedDate: string;
  additions: number;
  deletions: number;
  parents: { totalCount: number };
  author: {
    name: string;
    avatarUrl: string;
    user: { login: string } | null;
  } | null;
}

interface RepositoryStats {
  totalPulls: { totalCount: number };
  openPulls: { totalCount: number };
  mergedPulls: { totalCount: number };
  closedPulls: { totalCount: number };
  totalIssues: { totalCount: number };
  openIssues: { totalCount: number };
  closedIssues: { totalCount: number };
  defaultBranchRef: {
    target: { history: { totalCount: number; nodes: CommitNode[] } };
  } | null;
}

async function fetchJson(url: string, options: RequestInit) {
  try {
    const response = await fetch(url, { ...options, cache: "no-store" });
    return response.status === 200 ? await response.json() : null;
  } catch {
    return null;
  }
}

function getWeeklyActivity(nodes: CommitNode[], now: number): CommitWeek[] {
  const seconds = Math.floor(now / 1000);
  const currentWeek =
    Math.floor((seconds - sundayEpoch) / weekSeconds) * weekSeconds +
    sundayEpoch;
  const firstWeek = currentWeek - 51 * weekSeconds;
  const weeks = Array.from({ length: 52 }, (_, index) => ({
    week: firstWeek + index * weekSeconds,
    total: 0,
  }));

  for (const node of nodes) {
    if (node.parents.totalCount > 1) continue;
    const date = Math.floor(Date.parse(node.committedDate) / 1000);
    if (date < firstWeek || date > seconds) continue;
    const week = weeks[Math.floor((date - firstWeek) / weekSeconds)];
    if (week) week.total++;
  }
  return weeks;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");

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

  const now = Date.now();
  const key = createHash("sha256")
    .update(token)
    .update("\0")
    .update(`${owner}/${repo}`.toLowerCase())
    .digest("hex");
  for (const [cacheKey, entry] of cache) {
    if (entry.expires <= now) cache.delete(cacheKey);
  }
  const cached = cache.get(key);
  if (cached && searchParams.get("refresh") !== "true") {
    return NextResponse.json(cached.data);
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
  };

  const [graph, rawActivity] = await Promise.all([
    fetchJson("https://api.github.com/graphql", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          query($owner: String!, $name: String!) {
            repository(owner: $owner, name: $name) {
              totalPulls: pullRequests { totalCount }
              openPulls: pullRequests(states: OPEN) { totalCount }
              mergedPulls: pullRequests(states: MERGED) { totalCount }
              closedPulls: pullRequests(states: CLOSED) { totalCount }
              totalIssues: issues { totalCount }
              openIssues: issues(states: OPEN) { totalCount }
              closedIssues: issues(states: CLOSED) { totalCount }
              defaultBranchRef {
                target {
                  ... on Commit {
                    history(first: 100) {
                      totalCount
                      nodes {
                        committedDate
                        additions
                        deletions
                        parents { totalCount }
                        author { name avatarUrl user { login } }
                      }
                    }
                  }
                }
              }
            }
          }
        `,
        variables: { owner, name: repo },
      }),
    }),
    fetchJson(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/stats/commit_activity`,
      { headers },
    ),
  ]);

  const repository: RepositoryStats | undefined = graph?.data?.repository;
  if (!repository && !Array.isArray(rawActivity)) {
    return cached
      ? NextResponse.json(cached.data)
      : NextResponse.json(
          { error: "Không tải được thống kê GitHub" },
          { status: 502 },
        );
  }

  const history = repository?.defaultBranchRef?.target?.history;
  const commits = history?.nodes ?? [];
  const people = new Map<string, RepoContributor>();
  for (const node of commits) {
    const author = node.author;
    const login = author?.user?.login;
    if (!author || !login || node.parents.totalCount > 1) continue;
    const key = login.toLowerCase();
    const contributor = people.get(key) ?? {
      login,
      name: author.name || login,
      avatarUrl: author.avatarUrl,
      commits: 0,
      additions: 0,
      deletions: 0,
    };
    contributor.commits++;
    contributor.additions += node.additions;
    contributor.deletions += node.deletions;
    people.set(key, contributor);
  }

  const activity: CommitWeek[] | null =
    Array.isArray(rawActivity) && rawActivity.length > 0
      ? rawActivity
      : history && history.totalCount === commits.length
        ? getWeeklyActivity(commits, now)
        : repository && !repository.defaultBranchRef
          ? []
          : null;

  const data: RepoOverviewStats = {
    activity,
    totalCommits:
      history?.totalCount ??
      (repository && !repository.defaultBranchRef ? 0 : undefined),
    contributors: repository ? Array.from(people.values()) : null,
    sampledCommits: commits.length,
    pulse: repository
      ? {
          pulls: {
            total: repository.totalPulls.totalCount,
            open: repository.openPulls.totalCount,
            merged: repository.mergedPulls.totalCount,
            closed: repository.closedPulls.totalCount,
          },
          issues: {
            total: repository.totalIssues.totalCount,
            open: repository.openIssues.totalCount,
            closed: repository.closedIssues.totalCount,
          },
        }
      : null,
  };

  if (activity !== null && repository) {
    cache.set(key, { data, expires: now + cacheTtl });
  }
  return NextResponse.json(data);
}
