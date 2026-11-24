import assert from "node:assert/strict";
import { test } from "node:test";
import {
  readCommitAggregates,
  refineCommitAggregates,
  splitWindow,
} from "../../src/lib/scoring/aggregate-planner";
import type { ScoringCollection } from "../../src/lib/scoring/github";
import { DAY, utcDay } from "../../src/lib/scoring/normalize";
import { aggregateConfig, scoreActivity } from "../../src/lib/scoring/score";
import { evaluatedAt, repo, snapshot } from "./scenarios";

const window = { from: (utcDay(evaluatedAt) - 364) * DAY, to: evaluatedAt };
const day = utcDay(evaluatedAt);
const repository = {
  id: "repo",
  visibility: "PUBLIC" as const,
  owner: { id: "subject" },
  isFork: false,
  isArchived: false,
};
function collection(): ScoringCollection {
  return {
    totalCommitContributions: 40,
    totalRepositoriesWithContributedCommits: 1,
    restrictedContributionsCount: 0,
    commitContributionsByRepository: [
      {
        repository,
        contributions: {
          pageInfo: { hasNextPage: false },
          nodes: [
            {
              occurredAt: new Date(evaluatedAt).toISOString(),
              commitCount: 40,
              isRestricted: false,
            },
          ],
        },
      },
    ],
  };
}

test("daily buckets count commits and detect truncation without guessing restricted totals", () => {
  const data = collection();
  const groups = data.commitContributionsByRepository ?? [];
  const group = groups[0];
  data.startedAt = new Date(window.from).toISOString();
  data.endedAt = new Date(window.to).toISOString().replace(".000Z", "Z");
  assert.equal(
    readCommitAggregates(data, { ...window, to: window.to + 999 }, false)
      .complete,
    true,
  );
  assert.equal(readCommitAggregates(data, window, false).complete, true);
  assert.equal(readCommitAggregates(data, window, false).buckets[0].count, 40);
  assert.equal(readCommitAggregates(data, window, true).complete, false);
  data.totalRepositoriesWithContributedCommits = 2;
  assert.equal(readCommitAggregates(data, window, false).complete, false);
  data.totalRepositoriesWithContributedCommits = 1;
  if (!group.contributions?.nodes) throw new Error("fixture");
  group.contributions.totalCount = 40;
  assert.equal(readCommitAggregates(data, window, false).complete, true);
  group.contributions.totalCount = 41;
  assert.equal(readCommitAggregates(data, window, false).complete, false);
  group.contributions.totalCount = 40;
  group.contributions.pageInfo.hasNextPage = true;
  assert.equal(readCommitAggregates(data, window, false).complete, false);
  group.contributions.pageInfo.hasNextPage = false;
  group.contributions.nodes.push(group.contributions.nodes[0]);
  assert.equal(readCommitAggregates(data, window, false).buckets.length, 1);
  group.contributions.nodes[0] = {
    occurredAt: new Date(evaluatedAt).toISOString(),
    commitCount: 40,
    isRestricted: true,
  };
  data.totalCommitContributions = 80;
  const restricted = readCommitAggregates(data, window, false);
  assert.equal(restricted.restricted, true);
  assert.equal(restricted.complete, true);
  assert.equal(restricted.buckets[0].count, 40);
});

test("partitions use adjacent inclusive boundaries, preserve stable repo identity, and replace corrected days", async () => {
  const [left, right] = splitWindow(window);
  assert.equal(left.to + 1, right.from);
  assert.equal(utcDay(left.to) + 1, utcDay(right.from));
  const initial = readCommitAggregates(collection(), window, true);
  let requests = 0;
  const final = await refineCommitAggregates(
    initial,
    window,
    async (range) => {
      requests++;
      return {
        ...initial,
        complete: true,
        buckets:
          range.from === left.from
            ? []
            : [{ repo: repository.id, day, count: 30 }],
        repositories: [{ ...repository, nameWithOwner: "renamed/repo" }],
      };
    },
    () => true,
    2,
    30,
  );
  assert.equal(requests, 2);
  assert.equal(final.complete, true);
  assert.deepEqual(final.buckets, [{ repo: repository.id, day, count: 30 }]);
  assert.equal(final.repositories.length, 1);
  requests = 0;
  await refineCommitAggregates(
    initial,
    window,
    async () => {
      requests++;
      return initial;
    },
    () => requests < 2,
    8,
    30,
  );
  assert.equal(requests, 2);
});

test("V3.1 weights all repositories together and uses provider dates for cadence", () => {
  const input = snapshot({
    repositories: [repo, { ...repo, id: "second" }],
    dailyCommits: [
      { repo: repo.id, day, count: 20 },
      { repo: "second", day, count: 20 },
      { repo: repo.id, day: day - 1, count: 1 },
      { repo: repo.id, day: day - 2, count: 1 },
    ],
    calendarDays: [day - 14, day - 7, day - 7],
  });
  const metrics = scoreActivity(input, aggregateConfig).categories.flatMap(
    (item) => item.metrics,
  );
  const get = (id: string) =>
    metrics.find((metric) => metric.id === id)?.adjusted;
  assert.equal(get("commits"), 23);
  assert.equal(get("qualified"), 1);
  assert.equal(get("activeDays"), 2);
  assert.equal(get("activeWeeks"), 2);
});

test("a stable saturated metric resolves while rank and total can differ in completeness", () => {
  const input = snapshot({
    dailyCommits: [{ repo: repo.id, day, count: 20_000 }],
    impact: { stars: 20, followers: 0, forks: 0, releases: 0 },
    coverage: { ...snapshot().coverage, commits: "partial", issues: "partial" },
  });
  const result = scoreActivity(input, aggregateConfig);
  assert.equal(result.categories[1].metrics[0].scoreResolved, true);
  assert.ok(result.bounds.maximum > result.bounds.minimum);
  assert.equal(result.bounds.rankResolved, true);
  assert.equal(result.bounds.scoreResolved, false);
});
