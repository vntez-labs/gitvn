import "server-only";

import { createHash } from "node:crypto";
import {
  type CollectionWindow,
  type CommitAggregateResult,
  collectorVersion,
  readCommitAggregates,
  refineCommitAggregates,
} from "./aggregate-planner";
import {
  commitBucketFields,
  contributionPageFields,
  type ScoringCollection,
} from "./github";
import { aggregateConfig } from "./score";

export interface QueryBudget {
  requests: number;
  points: number;
  depth: number;
  enrichment: number;
  durationMs: number;
  concurrency: number;
  minRemaining: number;
  maxRepos: number;
  pageSize: number;
  minDays: number;
}

export const collectionBudget: QueryBudget = {
  requests: 5,
  points: 50,
  depth: 2,
  enrichment: 4,
  durationMs: 13_000,
  concurrency: 1,
  minRemaining: 100,
  maxRepos: 50,
  pageSize: 100,
  minDays: 30,
};

type GraphQL<T> = {
  data?: T;
  errors?: { type?: string; path?: (string | number)[] }[];
};
export type RateLimit = { cost: number; remaining: number; resetAt: string };
export const rateLimitFields = "rateLimit { cost remaining resetAt }";
type Connection = keyof typeof contributionPageFields;

export function createCollectionBudget(
  token: string,
  budget = collectionBudget,
) {
  const started = performance.now();
  const diagnostics = {
    graphqlRequests: 0,
    graphqlPoints: 0,
    pointsKnown: true,
    payloadBytes: 0,
    networkMs: 0,
    planningMs: 0,
    normalizationMs: 0,
    scoringMs: 0,
    cache: "miss",
    searchRequests: 0,
    candidatePrs: 0,
    maintainerMergesBeforeSearch: 0,
    candidateSearchTruncated: false,
    maintainerCache: "miss",
    aggregateBuckets: 0,
    individualCommitRecords: 0,
  };
  let remaining = Infinity;
  let reserve = 5;
  let blocked = false;
  let unknownPointReserve = 0;
  let active = 0;
  let enrichments = 0;
  let resetAt: string | undefined;
  function observe(response: Response, info?: RateLimit) {
    if (Number.isFinite(info?.cost) && info) {
      diagnostics.graphqlPoints += info.cost;
      reserve = Math.max(reserve, info.cost);
    } else {
      diagnostics.pointsKnown = false;
      unknownPointReserve += reserve;
    }
    const header = response.headers.get("x-ratelimit-remaining");
    remaining =
      info?.remaining ?? (header === null ? remaining : Number(header));
    resetAt = info?.resetAt ?? resetAt;
    blocked ||=
      response.status === 429 ||
      response.status === 403 ||
      response.headers.has("retry-after") ||
      remaining <= budget.minRemaining;
  }
  function canRequest() {
    return (
      !blocked &&
      diagnostics.graphqlRequests < budget.requests &&
      enrichments < budget.enrichment &&
      remaining - reserve >= budget.minRemaining &&
      diagnostics.graphqlPoints + unknownPointReserve + reserve <=
        budget.points &&
      active < budget.concurrency &&
      performance.now() - started < budget.durationMs
    );
  }
  async function request<T extends { rateLimit?: RateLimit }>(
    query: string,
    variables: object,
    search = false,
  ) {
    for (let attempt = 0; attempt < 2 && canRequest(); attempt++) {
      if (attempt)
        await new Promise((resolve) =>
          setTimeout(resolve, 150 * 2 ** (attempt - 1)),
        );
      if (!canRequest()) return;
      active++;
      diagnostics.graphqlRequests++;
      enrichments++;
      if (search) diagnostics.searchRequests++;
      const start = performance.now();
      try {
        const response = await fetch("https://api.github.com/graphql", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
          signal: AbortSignal.timeout(
            Math.max(1, Math.floor(budget.durationMs - (start - started))),
          ),
          body: JSON.stringify({ query, variables }),
        });
        const body = await response.text();
        diagnostics.payloadBytes += Buffer.byteLength(body);
        const graph = response.ok
          ? (JSON.parse(body) as GraphQL<T>)
          : undefined;
        observe(response, graph?.data?.rateLimit);
        blocked ||= Boolean(
          graph?.errors?.some((error) => error.type === "RATE_LIMITED"),
        );
        if (response.ok || response.status < 500 || blocked) return graph;
      } catch {
        // A failed optional query leaves the annual snapshot usable.
        diagnostics.pointsKnown = false;
        unknownPointReserve += reserve;
      } finally {
        active--;
        diagnostics.networkMs += performance.now() - start;
      }
    }
  }
  return {
    request,
    canRequest,
    observe,
    primary(bodyBytes: number, networkMs: number) {
      diagnostics.graphqlRequests++;
      diagnostics.payloadBytes += bodyBytes;
      diagnostics.networkMs += networkMs;
    },
    diagnostics,
    finish() {
      return {
        ...diagnostics,
        rateLimitRemaining: Number.isFinite(remaining) ? remaining : null,
        resetAt,
        endToEndMs: performance.now() - started,
      };
    },
  };
}

type DetailNode = NonNullable<
  NonNullable<ScoringCollection[Connection]>["nodes"]
>[number];

function detailIdentity(entry: DetailNode) {
  if (!entry) return;
  if ("issue" in entry) return entry.issue?.id;
  return entry.pullRequest?.id;
}

type Ledger = ReturnType<typeof createCollectionBudget>;
type CollectionData = {
  rateLimit?: RateLimit;
  user?: { id: string; contributionsCollection?: ScoringCollection };
};

export async function collectDetailPages(
  ledger: Ledger,
  collection: ScoringCollection,
  subject: string,
  login: string,
  from: string,
  to: string,
  connections: Connection[],
  role = false,
) {
  const keys = connections.filter(
    (key) =>
      collection[key]?.pageInfo.hasNextPage &&
      collection[key]?.pageInfo.endCursor,
  );
  if (!keys.length || !ledger.canRequest()) return collection;
  const cursorVariables = Object.fromEntries(
    keys.map((key, i) => [`cursor${i}`, collection[key]?.pageInfo.endCursor]),
  );
  const declarations = keys.map((_, i) => `$cursor${i}: String!`).join(", ");
  const fields = keys
    .map((key, i) => contributionPageFields[key](`, after: $cursor${i}`, role))
    .join("\n");
  const result = await ledger.request<CollectionData>(
    `query GitvnContributionPages($login: String!, $from: DateTime!, $to: DateTime!, ${declarations}) {
    ${rateLimitFields}
    user(login: $login) { id contributionsCollection(from: $from, to: $to) { ${fields} } }
  }`,
    { login, from, to, ...cursorVariables },
  );
  const user = result?.data?.user;
  if (
    user?.id !== subject ||
    !user.contributionsCollection ||
    result?.errors?.length
  )
    return collection;
  const next = user.contributionsCollection;
  const merged = { ...collection };
  function append<K extends Connection>(key: K) {
    const first: ScoringCollection[K] = collection[key];
    const second: ScoringCollection[K] = next[key];
    if (
      !first?.nodes ||
      !second?.nodes ||
      !second.pageInfo ||
      first.pageInfo.endCursor === second.pageInfo.endCursor ||
      (!second.nodes.length && second.pageInfo.hasNextPage)
    )
      return;
    const seen = new Set<string>();
    // Key is used for both reads, so the two node arrays have the same type.
    merged[key] = {
      ...second,
      nodes: [...first.nodes, ...second.nodes].filter((node) => {
        const identity = detailIdentity(node);
        if (!identity) return true;
        if (seen.has(identity)) return false;
        seen.add(identity);
        return true;
      }),
    } as ScoringCollection[K];
  }
  for (const key of keys) append(key);
  return merged;
}

const cache = new Map<string, { value: CommitAggregateResult; at: number }>();
const pending = new Map<string, Promise<CommitAggregateResult>>();
const freshFor = 5 * 60_000;
const staleFor = 30 * 60_000;

export async function collectCommits(
  ledger: Ledger,
  token: string,
  subject: string,
  login: string,
  window: CollectionWindow,
  initial: CommitAggregateResult,
  shouldRefine: (observed: CommitAggregateResult) => boolean,
  budget = collectionBudget,
) {
  if (initial.complete || !shouldRefine(initial)) return initial;
  const key = createHash("sha256")
    .update(
      JSON.stringify([
        subject,
        token,
        window.from,
        new Date(window.to).toISOString().slice(0, 10),
        collectorVersion,
        aggregateConfig.version,
        budget,
        initial,
      ]),
    )
    .digest("hex");
  const cached = cache.get(key);
  const age = cached ? Date.now() - cached.at : Infinity;
  if (cached && age < freshFor) {
    ledger.diagnostics.cache = "hit";
    return cached.value;
  }
  const existing = pending.get(key);
  if (existing) {
    ledger.diagnostics.cache = "coalesced";
    return existing;
  }
  const request = (async () => {
    let readCount = 0;
    const result = await refineCommitAggregates(
      initial,
      window,
      async (range) => {
        const from = new Date(range.from).toISOString();
        const to = new Date(range.to).toISOString();
        const graph = await ledger.request<CollectionData>(
          `query GitvnCommitBuckets($login: String!, $from: DateTime!, $to: DateTime!, $maxRepos: Int!, $pageSize: Int!) {
        ${rateLimitFields} user(login: $login) { id contributionsCollection(from: $from, to: $to) {
          startedAt endedAt restrictedContributionsCount totalCommitContributions totalRepositoriesWithContributedCommits
          ${commitBucketFields("$maxRepos", "$pageSize")}
        } }
      }`,
          {
            login,
            from,
            to,
            maxRepos: budget.maxRepos,
            pageSize: budget.pageSize,
          },
        );
        const user = graph?.data?.user;
        if (
          user?.id !== subject ||
          !user.contributionsCollection?.commitContributionsByRepository
        )
          return;
        readCount++;
        return readCommitAggregates(
          user.contributionsCollection,
          range,
          Boolean(graph?.errors?.length),
        );
      },
      (observed) => ledger.canRequest() && shouldRefine(observed),
      budget.depth,
      budget.minDays,
    );
    if (
      cached &&
      age < staleFor &&
      (!readCount || (!result.complete && cached.value.complete))
    ) {
      ledger.diagnostics.cache = "stale";
      return cached.value;
    }
    if (readCount) {
      cache.delete(key);
      cache.set(key, { value: result, at: Date.now() });
      if (cache.size > 64) {
        const oldest = cache.keys().next().value;
        if (oldest !== undefined) cache.delete(oldest);
      }
    }
    return result;
  })();
  pending.set(key, request);
  try {
    return await request;
  } finally {
    pending.delete(key);
  }
}
