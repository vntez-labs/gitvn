import type { ContributionRepository, ScoringCollection } from "./github";
import type { DailyCommitBucket } from "./models";
import { count, DAY, utcDay } from "./normalize";

export const collectorVersion = "1.0.0";

export interface CommitAggregateResult {
  repositories: ContributionRepository[];
  buckets: DailyCommitBucket[];
  complete: boolean;
  restricted: boolean;
}

export interface CollectionWindow {
  from: number;
  to: number;
}

export function splitWindow({ from, to }: CollectionWindow) {
  const days = utcDay(to) - utcDay(from) + 1;
  if (days < 2) return [];
  const boundary = (utcDay(from) + Math.floor(days / 2)) * DAY;
  return [
    { from, to: boundary - 1 },
    { from: boundary, to },
  ];
}

export function readCommitAggregates(
  collection: ScoringCollection | undefined,
  window: CollectionWindow,
  partial: boolean,
): CommitAggregateResult {
  const groups = collection?.commitContributionsByRepository;
  const repositories = new Map<string, ContributionRepository>();
  const buckets = new Map<string, DailyCommitBucket>();
  const conflicts = new Set<string>();
  let restricted = (collection?.restrictedContributionsCount ?? 0) > 0;
  let comparable = collection?.restrictedContributionsCount === 0;
  let complete =
    !partial &&
    count(collection?.totalCommitContributions) &&
    count(collection?.totalRepositoriesWithContributedCommits) &&
    Boolean(groups) &&
    groups?.length === collection?.totalRepositoriesWithContributedCommits;
  // GitHub returns these boundaries at whole-second precision. Daily buckets
  // retain their provider dates, including the final second of a split day.
  const seconds = (at: number) => Math.floor(at / 1000);
  if (
    (collection?.startedAt &&
      !(seconds(Date.parse(collection.startedAt)) <= seconds(window.from))) ||
    (collection?.endedAt &&
      !(seconds(Date.parse(collection.endedAt)) >= seconds(window.to)))
  )
    complete = false;
  for (const group of groups ?? []) {
    const repo = group?.repository;
    if (
      repo &&
      (repo.visibility === "PRIVATE" ||
        repo.visibility === "INTERNAL" ||
        repo.isPrivate)
    ) {
      comparable = false;
      restricted = true;
      continue;
    }
    if (
      !repo?.id ||
      repo.visibility !== "PUBLIC" ||
      !repo.owner?.id ||
      typeof repo.isFork !== "boolean" ||
      typeof repo.isArchived !== "boolean" ||
      repositories.has(repo.id)
    ) {
      complete = false;
      continue;
    }
    repositories.set(repo.id, repo);
    const page = group.contributions;
    if (!page?.nodes || page.pageInfo?.hasNextPage !== false) complete = false;
    let observedGroupCount = 0;
    let restrictedGroup = false;
    for (const node of page?.nodes ?? []) {
      if (node?.isRestricted) {
        restricted = true;
        restrictedGroup = true;
        comparable = false;
        continue;
      }
      const day = utcDay(Date.parse(node?.occurredAt ?? ""));
      if (
        !Number.isSafeInteger(day) ||
        day < utcDay(window.from) ||
        day > utcDay(window.to) ||
        !count(node?.commitCount) ||
        node?.isRestricted !== false ||
        node.commitCount > 2_147_483_647
      ) {
        complete = false;
        continue;
      }
      const key = `${repo.id}:${day}`;
      const prior = buckets.get(key);
      if (!prior) observedGroupCount += node.commitCount;
      if (prior && prior.count !== node.commitCount) {
        conflicts.add(key);
        complete = false;
      }
      buckets.set(key, { repo: repo.id, day, count: node.commitCount });
    }
    // The live API can return the sum of commitCount rather than the number
    // of daily nodes here. A cursor reporting more pages always wins.
    if (
      !restrictedGroup &&
      page?.totalCount !== undefined &&
      page.totalCount !== page.nodes?.length &&
      page.totalCount !== observedGroupCount
    )
      complete = false;
  }
  for (const key of conflicts) buckets.delete(key);
  const records = [...buckets.values()];
  if (
    comparable &&
    count(collection?.totalCommitContributions) &&
    records.reduce((sum, bucket) => sum + bucket.count, 0) !==
      collection.totalCommitContributions
  )
    complete = false;
  return {
    buckets: records,
    repositories: [...repositories.values()],
    complete,
    restricted,
  };
}

function merge(
  parent: CommitAggregateResult,
  child: CommitAggregateResult,
  window: CollectionWindow,
) {
  const buckets = new Map(
    parent.buckets
      .filter(
        (bucket) =>
          !child.complete ||
          bucket.day < utcDay(window.from) ||
          bucket.day > utcDay(window.to),
      )
      .map((bucket) => [`${bucket.repo}:${bucket.day}`, bucket]),
  );
  for (const bucket of child.buckets) {
    const key = `${bucket.repo}:${bucket.day}`;
    const existing = buckets.get(key);
    // An incomplete refinement cannot replace a conflicting annual observation.
    if (!existing || existing.count === bucket.count) buckets.set(key, bucket);
  }
  const repositories = new Map(
    parent.repositories.map((repo) => [repo.id, repo]),
  );
  for (const repo of child.repositories) repositories.set(repo.id, repo);
  return {
    buckets: [...buckets.values()],
    repositories: [...repositories.values()],
    complete: false,
    restricted: parent.restricted || child.restricted,
  };
}

export async function refineCommitAggregates(
  initial: CommitAggregateResult,
  window: CollectionWindow,
  read: (
    window: CollectionWindow,
  ) => Promise<CommitAggregateResult | undefined>,
  shouldContinue: (observed: CommitAggregateResult) => boolean,
  maxDepth: number,
  minimumDays: number,
) {
  const canSplit = (range: CollectionWindow, depth: number) =>
    depth < maxDepth &&
    utcDay(range.to) - utcDay(range.from) + 1 >= minimumDays * 2;
  if (initial.complete || !canSplit(window, 0)) return initial;

  let accumulated = initial;
  const queue = splitWindow(window).map((range) => ({ range, depth: 1 }));
  let unresolved = queue.length;
  for (const { range, depth } of queue) {
    if (!shouldContinue(accumulated)) break;
    const observed = await read(range);
    if (!observed) continue;
    accumulated = merge(accumulated, observed, range);
    if (observed.complete) {
      unresolved--;
    } else if (canSplit(range, depth)) {
      const children = splitWindow(range).map((child) => ({
        range: child,
        depth: depth + 1,
      }));
      unresolved += children.length - 1;
      queue.push(...children);
    }
  }
  return { ...accumulated, complete: unresolved === 0 };
}
