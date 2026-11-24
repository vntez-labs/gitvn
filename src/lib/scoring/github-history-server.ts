import "server-only";

import { createHash } from "node:crypto";
import defaults from "./defaults.json";
import {
  type CommitHistoryResponse,
  commitHistoryFields,
  projectHistoryCandidates,
  reconcileCommitHistory,
  scoringCommitHistoryQuery,
  selectCommitHistoryRepos,
} from "./github-commits";
import type { RawActivitySnapshot } from "./models";

type Repo = NonNullable<NonNullable<CommitHistoryResponse["nodes"]>[number]>;
type History = NonNullable<
  NonNullable<NonNullable<Repo["defaultBranchRef"]>["target"]>["history"]
>;
type Entry = { history: CommitHistoryResponse; checkedAt: number };
const cache = new Map<string, Entry>();
const pending = new Map<string, Promise<CommitHistoryResponse | undefined>>();
const freshFor = 5 * 60_000;
const fallbackFor = 30 * 60_000;

async function graphql<T>(
  token: string,
  query: string,
  variables: object,
  signal: AbortSignal,
) {
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
    signal,
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) return {};
  const result: { data?: T; errors?: unknown[] } = await response.json();
  return {
    data: result.data,
    canContinue:
      !response.headers.get("retry-after") &&
      response.headers.get("x-ratelimit-remaining") !== "0" &&
      !result.errors?.length,
  };
}

async function readHistory(
  snapshot: RawActivitySnapshot,
  repos: string[],
  token: string,
  from: string,
  to: string,
) {
  const signal = AbortSignal.timeout(6500);
  const variables = { author: snapshot.subject, from, to };
  const initial = await graphql<CommitHistoryResponse>(
    token,
    scoringCommitHistoryQuery,
    { ...variables, repos },
    signal,
  );
  if (!Array.isArray(initial.data?.nodes)) return;
  const nodes = initial.data.nodes.filter((repo): repo is Repo =>
    Boolean(repo && repo.visibility === "PUBLIC" && repos.includes(repo.id)),
  );
  const history = { nodes };
  if (!initial.canContinue) return history;

  const unresolved = projectHistoryCandidates(snapshot);
  const observed: RawActivitySnapshot = {
    ...snapshot,
    events: [],
    coverage: {},
    limitations: [],
  };
  reconcileCommitHistory(observed, history, false, false);
  const verified = new Map<string, Set<string>>();
  for (const event of observed.events) {
    if (event.empty) continue;
    const ids = verified.get(event.repo) ?? new Set<string>();
    ids.add(event.id);
    verified.set(event.repo, ids);
  }
  const candidates = nodes
    .flatMap((repo) => {
      const target = repo.defaultBranchRef?.target;
      if (
        !unresolved.has(repo.id) ||
        (verified.get(repo.id)?.size ?? 0) >= defaults.qualification[0] ||
        !target?.id ||
        !target.history?.nodes ||
        !target.history.pageInfo.hasNextPage ||
        !target.history.pageInfo.endCursor
      )
        return [];
      return [
        { target, cursor: target.history.pageInfo.endCursor, tip: target.id },
      ];
    })
    .slice(0, 5);
  if (!candidates.length) return history;

  // Aliases are generated from array indices. GitHub IDs and cursors are variables.
  const parameters = candidates
    .map((_, i) => `$tip${i}: ID!, $after${i}: String!`)
    .join(", ");
  const fields = candidates
    .map(
      (_, i) => `page${i}: node(id: $tip${i}) {
    ... on Commit {
      history(first: 100, after: $after${i}, author: { id: $author }, since: $from, until: $to) {
        ${commitHistoryFields}
      }
    }
  }`,
    )
    .join("\n");
  const cursors = Object.fromEntries(
    candidates.flatMap(({ tip, cursor }, i) => [
      [`tip${i}`, tip],
      [`after${i}`, cursor],
    ]),
  );
  try {
    const result = await graphql<Record<string, { history?: History } | null>>(
      token,
      `query GitvnCommitHistoryPages($author: ID!, $from: GitTimestamp!, $to: GitTimestamp!, ${parameters}) { ${fields} }`,
      { ...variables, ...cursors },
      signal,
    );
    candidates.forEach(({ target, cursor }, i) => {
      const next = result.data?.[`page${i}`]?.history;
      if (
        !target.history?.nodes ||
        !Array.isArray(next?.nodes) ||
        typeof next.pageInfo?.hasNextPage !== "boolean" ||
        next.pageInfo.endCursor === cursor ||
        (!next.nodes.length && next.pageInfo.hasNextPage)
      )
        return;
      target.history = {
        nodes: [...target.history.nodes, ...next.nodes],
        pageInfo: next.pageInfo,
      };
    });
  } catch {
    // The first page remains useful when the shared deadline expires.
  }
  return history;
}

export async function loadScoringHistory(
  snapshot: RawActivitySnapshot,
  token: string,
  from: string,
  to: string,
  canFetch: boolean,
) {
  const repos = selectCommitHistoryRepos(snapshot);
  if (!repos.length) return;
  const key = createHash("sha256")
    .update(
      JSON.stringify([
        token,
        snapshot.subject,
        from,
        repos,
        snapshot.dailyCommits
          ?.map(({ repo, day, count }) => [repo, day, count])
          .sort(),
      ]),
    )
    .digest("hex");
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && now - cached.checkedAt < freshFor) return cached.history;
  const fallback =
    cached && now - cached.checkedAt < fallbackFor ? cached.history : undefined;
  if (!canFetch) return fallback;
  const active = pending.get(key);
  if (active) return active;
  const request = (async () => {
    try {
      const history = await readHistory(snapshot, repos, token, from, to);
      if (!history?.nodes?.length) return fallback;
      const previous = new Map(
        fallback?.nodes?.flatMap((repo) => (repo ? [[repo.id, repo]] : [])),
      );
      const combined = new Map<string, Repo>();
      for (const repo of history.nodes) {
        const current = repo.defaultBranchRef?.target;
        const prior = previous.get(repo.id)?.defaultBranchRef?.target;
        // A successful refresh with a new tip replaces old data. If the same
        // tip lost a continuation page, keep the previously observed superset.
        if (
          current?.id &&
          current.id === prior?.id &&
          (prior.history?.nodes?.length ?? 0) >
            (current.history?.nodes?.length ?? 0)
        )
          combined.set(repo.id, previous.get(repo.id) ?? repo);
        else combined.set(repo.id, repo);
      }
      const result = { nodes: [...combined.values()] };
      cache.delete(key);
      cache.set(key, { history: result, checkedAt: Date.now() });
      if (cache.size > 32) {
        const oldest = cache.keys().next().value;
        if (oldest !== undefined) cache.delete(oldest);
      }
      return result;
    } catch {
      return fallback;
    }
  })();
  pending.set(key, request);
  try {
    return await request;
  } finally {
    pending.delete(key);
  }
}
