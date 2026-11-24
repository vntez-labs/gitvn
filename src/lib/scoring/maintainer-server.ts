import "server-only";
import { createHash } from "node:crypto";
import type { createCollectionBudget, RateLimit } from "./collection-server";
import { rateLimitFields } from "./collection-server";
import type { ScoringCollection } from "./github";
import {
  candidateFields,
  type RolePull,
  reviewedRepositoryNames,
} from "./github-collaboration";

type Result = {
  pulls: RolePull[];
  sources: string[];
  stale?: boolean;
  truncated: boolean;
};
type SearchPage = {
  nodes?: (RolePull | null)[] | null;
  issueCount?: number;
  pageInfo?: { hasNextPage: boolean };
};
const cache = new Map<string, { result: Result; at: number }>();
const pending = new Map<string, Promise<Result | undefined>>();

export async function discoverMaintainerEvidence(
  ledger: ReturnType<typeof createCollectionBudget>,
  collection: ScoringCollection | null,
  token: string,
  subject: string,
  login: string,
  from: string,
  to: string,
  needMaintainer: boolean,
  needIssues: boolean,
): Promise<Result | undefined> {
  if (!needMaintainer && !needIssues) return;
  const filter = `is:pr is:merged is:public merged:${from.slice(0, 10)}..${to.slice(0, 10)}`;
  const searches = [
    [
      `${needMaintainer ? "involves" : "author"}:${login} ${filter}`,
      needMaintainer ? "github-search-involvement" : "github-search-authored",
    ],
    ...(!needMaintainer
      ? []
      : reviewedRepositoryNames(collection).map((name) => [
          `repo:${name} ${filter}`,
          "github-search-reviewed-repository",
        ])),
  ];
  const key = createHash("sha256")
    .update(
      JSON.stringify([
        token,
        subject,
        from,
        to.slice(0, 10),
        "3.2.0",
        searches,
      ]),
    )
    .digest("hex");
  const cached = cache.get(key);
  const age = cached ? Date.now() - cached.at : Infinity;
  if (cached && age < 5 * 60_000) {
    ledger.diagnostics.maintainerCache = "hit";
    ledger.diagnostics.candidatePrs = cached.result.pulls.length;
    return cached.result;
  }
  const inFlight = pending.get(key);
  if (inFlight) {
    ledger.diagnostics.maintainerCache = "coalesced";
    const result = await inFlight;
    ledger.diagnostics.candidatePrs = result?.pulls.length ?? 0;
    return result;
  }
  const fallback = () => {
    if (!cached || age >= 30 * 60_000) return;
    ledger.diagnostics.maintainerCache = "stale";
    return { ...cached.result, stale: true };
  };
  if (!ledger.canRequest()) return fallback();
  const request = (async () => {
    const declarations = searches
      .map((_, i) => `$query${i}: String!`)
      .join(", ");
    const fields = searches
      .map(
        (
          _,
          i,
        ) => `candidates${i}: search(query: $query${i}, type: ISSUE, first: ${i ? 12 : 30}) {
      issueCount pageInfo { hasNextPage } nodes { ... on PullRequest { ${candidateFields} } }
    }`,
      )
      .join("\n");
    const variables = Object.fromEntries(
      searches.map(([query], i) => [`query${i}`, query]),
    );
    const response = await ledger.request<
      { rateLimit?: RateLimit } & Record<
        `candidates${number}`,
        SearchPage | undefined
      >
    >(
      `query GitvnMaintainerCandidates(${declarations}) { ${rateLimitFields} ${fields} }`,
      variables,
      true,
    );
    if (!response?.data || response.errors?.length) return fallback();
    const pulls: RolePull[] = [];
    const sources = new Set<string>();
    let truncated = false;
    for (const [, source] of searches) sources.add(source);
    for (let i = 0; i < searches.length; i++) {
      const page = response.data[`candidates${i}`];
      truncated ||=
        !page?.nodes ||
        page.pageInfo?.hasNextPage !== false ||
        (page.issueCount ?? Infinity) > (page.nodes?.length ?? 0);
      for (const pr of page?.nodes ?? [])
        if (pr?.id && pr.repository?.visibility === "PUBLIC") pulls.push(pr);
    }
    const result = { pulls, sources: [...sources], truncated };
    ledger.diagnostics.candidatePrs = pulls.length;
    ledger.diagnostics.candidateSearchTruncated = truncated;
    cache.delete(key);
    cache.set(key, { result, at: Date.now() });
    if (cache.size > 48) {
      const oldest = cache.keys().next().value;
      if (oldest !== undefined) cache.delete(oldest);
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
