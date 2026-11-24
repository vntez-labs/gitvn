import defaults from "./defaults.json";
import type { ActivityEvent, RawActivitySnapshot } from "./models";
import { count, DAY, utcDay } from "./normalize";

type Tree = { oid: string };
type Commit = {
  oid: string;
  authoredDate: string;
  tree: Tree | null;
  parents: {
    totalCount: number;
    nodes: ({ tree: Tree | null } | null)[] | null;
  };
};

export interface CommitHistoryResponse {
  nodes?: ({
    id: string;
    visibility: string;
    defaultBranchRef?: {
      target?: {
        id?: string;
        history?: {
          pageInfo: { hasNextPage: boolean; endCursor?: string | null };
          nodes: (Commit | null)[] | null;
        };
      };
    } | null;
  } | null)[];
}

export const commitHistoryFields = `
  pageInfo { hasNextPage endCursor }
  nodes { oid authoredDate tree { oid } parents(first: 1) { totalCount nodes { tree { oid } } } }
`;

export const scoringCommitHistoryQuery = `
  query GitvnCommitHistory($repos: [ID!]!, $author: ID!, $from: GitTimestamp!, $to: GitTimestamp!) {
    nodes(ids: $repos) {
      ... on Repository {
        id visibility
        defaultBranchRef {
          target {
            ... on Commit {
              id
              history(first: 100, author: { id: $author }, since: $from, until: $to) {
                ${commitHistoryFields}
              }
            }
          }
        }
      }
    }
  }
`;

/** Prioritize repos likely to gain verified project credit, within one bounded query. */
export function selectCommitHistoryRepos(snapshot: RawActivitySnapshot) {
  const candidates = projectHistoryCandidates(snapshot);
  const totals = new Map<string, number>();
  for (const row of snapshot.dailyCommits ?? []) {
    if (row.count > 0)
      totals.set(row.repo, (totals.get(row.repo) ?? 0) + row.count);
  }
  return [...totals]
    .sort(
      ([a], [b]) =>
        Number(candidates.has(b)) - Number(candidates.has(a)) ||
        (a < b ? -1 : 1),
    )
    .slice(0, 25)
    .map(([id]) => id);
}

export function projectHistoryCandidates(snapshot: RawActivitySnapshot) {
  const nonForks = new Set(
    snapshot.repositories
      .filter((repo) => repo.visibility === "public" && !repo.fork)
      .map((repo) => repo.id),
  );
  const merged = new Set(
    snapshot.events
      .filter(
        (event) =>
          event.kind === "pulls" && event.state === "MERGED" && !event.bot,
      )
      .map((event) => event.repo),
  );
  const totals = new Map<string, number>();
  for (const row of snapshot.dailyCommits ?? []) {
    if (nonForks.has(row.repo) && !merged.has(row.repo))
      totals.set(row.repo, (totals.get(row.repo) ?? 0) + row.count);
  }
  return new Set(
    [...totals]
      .filter(([, total]) => total >= defaults.qualification[0])
      .map(([id]) => id),
  );
}

export function reconcileCommitHistory(
  snapshot: RawActivitySnapshot,
  history: CommitHistoryResponse | undefined,
  daysComplete: boolean,
  projectInputComplete: boolean,
) {
  const rows = snapshot.dailyCommits;
  if (!rows) return;
  const expected = new Map<string, Map<number, number>>();
  const lastDay = utcDay(snapshot.evaluatedAt);
  for (const row of rows) {
    if (!row.count || row.day < lastDay - 364 || row.day > lastDay) continue;
    const repo = expected.get(row.repo) ?? new Map<number, number>();
    const prior = repo.get(row.day);
    if (prior !== undefined && prior !== row.count) return;
    repo.set(row.day, row.count);
    expected.set(row.repo, repo);
  }
  if (!expected.size) return;

  const evidence: ActivityEvent[] = [];
  const matchedRepos = new Set<string>();
  const seenRepos = new Set<string>();
  for (const repo of history?.nodes ?? []) {
    if (!repo || repo.visibility !== "PUBLIC") continue;
    const dates = expected.get(repo.id);
    const observed = repo.defaultBranchRef?.target?.history;
    if (!dates || !observed?.nodes || seenRepos.has(repo.id)) continue;

    seenRepos.add(repo.id);
    const commitsByDate = new Map<number, Map<string, ActivityEvent>>();
    let usable = true;
    for (const node of observed.nodes) {
      const at = Date.parse(node?.authoredDate ?? "");
      const day = utcDay(at);
      if (
        !node ||
        !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i.test(node.oid) ||
        !Number.isFinite(at) ||
        at < (lastDay - 364) * DAY ||
        at > snapshot.evaluatedAt ||
        !node.tree?.oid ||
        !count(node.parents?.totalCount) ||
        (node.parents.totalCount === 1 && !node.parents.nodes?.[0]?.tree?.oid)
      ) {
        usable = false;
        continue;
      }
      const commits =
        commitsByDate.get(day) ?? new Map<string, ActivityEvent>();
      const id = node.oid.toLowerCase();
      commits.set(id, {
        kind: "commits",
        id,
        at,
        actor: snapshot.subject,
        repo: repo.id,
        empty:
          node.parents.totalCount === 1 &&
          node.tree.oid === node.parents.nodes?.[0]?.tree?.oid,
        projectEvidenceOnly: true,
      });
      commitsByDate.set(day, commits);
    }
    let matched = 0;
    for (const [day, total] of dates) {
      const commits = commitsByDate.get(day);
      if (commits?.size !== total) continue;
      evidence.push(...commits.values());
      matched++;
    }
    if (
      usable &&
      observed.pageInfo?.hasNextPage === false &&
      matched === dates.size &&
      commitsByDate.size === dates.size
    )
      matchedRepos.add(repo.id);
  }

  if (daysComplete && matchedRepos.size === expected.size) {
    delete snapshot.dailyCommits;
    for (const event of evidence) delete event.projectEvidenceOnly;
    snapshot.coverage.commits = "complete";
  } else {
    snapshot.limitations?.push(
      evidence.length
        ? `Đã xác minh ${evidence.length} bản ghi commit và đối chiếu đầy đủ ${matchedRepos.size}/${expected.size} kho công khai có commit. Điểm commit vẫn dựa trên tổng theo ngày, sau khi loại các commit rỗng đã xác minh.`
        : "Chưa đối chiếu được SHA từ lịch sử nhánh mặc định. Điểm commit đang dùng tổng theo ngày của GitHub.",
    );
  }
  if (projectInputComplete) {
    const forkIds = new Set(
      snapshot.repositories.filter((repo) => repo.fork).map((repo) => repo.id),
    );
    const merged = new Set(
      snapshot.events
        .filter(
          (event) =>
            event.kind === "pulls" &&
            event.state === "MERGED" &&
            !event.bot &&
            (!forkIds.has(event.repo) || event.original),
        )
        .map((event) => event.repo),
    );
    const [minimumCommits, minimumDays] = defaults.qualification;
    const canonical = new Map<string, ActivityEvent>();
    for (const event of evidence) {
      const prior = canonical.get(event.id);
      if (!prior || event.repo < prior.repo) canonical.set(event.id, event);
    }
    const verified = new Map<string, number>();
    for (const event of canonical.values()) {
      if (!event.empty && !forkIds.has(event.repo))
        verified.set(event.repo, (verified.get(event.repo) ?? 0) + 1);
    }
    const unresolved = [...expected].some(
      ([id, days]) =>
        !merged.has(id) &&
        !matchedRepos.has(id) &&
        !(
          (verified.get(id) ?? 0) >= minimumCommits && days.size >= minimumDays
        ) &&
        [...days.values()].reduce((sum, count) => sum + count, 0) >=
          minimumCommits,
    );
    if (!unresolved) {
      for (const id of ["qualified", "sustained", "external"] as const)
        snapshot.coverage[id] = "complete";
    }
  }
  snapshot.events.push(...evidence);
}
