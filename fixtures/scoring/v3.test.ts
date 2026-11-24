import assert from "node:assert/strict";
import { test } from "node:test";
import {
  githubSnapshot,
  type ScoringCollection,
} from "../../src/lib/scoring/github";
import type { Metric, ScoreResult } from "../../src/lib/scoring/models";
import { DAY, utcDay } from "../../src/lib/scoring/normalize";
import {
  defaultConfig,
  rankScore,
  scoreActivity,
} from "../../src/lib/scoring/score";
import { evaluatedAt, event, repo, scenarios, snapshot } from "./scenarios";

const metric = (result: ScoreResult, id: Metric) =>
  result.categories
    .flatMap((category) => category.metrics)
    .find((item) => item.id === id);

test("bounds, complete zero, provisional and maximum", () => {
  for (const input of Object.values(scenarios)) {
    const result = scoreActivity(input);
    assert.ok(result.totalScore >= 0 && result.totalScore <= 100);
    for (const category of result.categories) {
      assert.ok(category.points >= 0 && category.points <= category.maximum);
    }
    assert.deepEqual(scoreActivity(input), result);
  }
  const empty = scoreActivity(scenarios.empty);
  assert.equal(empty.totalScore, 0);
  assert.equal(empty.completeness.status, "complete");
  assert.equal(metric(empty, "commits")?.adjusted, 0);
  assert.equal(scoreActivity(scenarios.maxScore).totalScore, 100);
  assert.equal(scoreActivity(scenarios.maxScore).nextRank, null);
  assert.equal(scoreActivity(scenarios.maxScore).pointsToNextRank, 0);
  assert.equal(
    scoreActivity(scenarios.restricted).completeness.status,
    "insufficient",
  );
  assert.equal(
    metric(scoreActivity(scenarios.restricted), "commits")?.adjusted,
    null,
  );
  assert.equal(
    metric(scoreActivity(scenarios.partialAggregate), "commits")?.adjusted,
    27,
  );
  assert.equal(
    metric(scoreActivity(scenarios.partialAggregate), "issues")?.adjusted,
    null,
  );
});

test("deduplicates stable commit hashes, filters empty commits and known automation", () => {
  const commit = event("commits", 0);
  const score = scoreActivity(
    snapshot({
      repositories: [repo, { ...repo, id: "copy", fork: true }],
      events: [
        commit,
        { ...commit, id: commit.id.toUpperCase(), repo: "copy" },
        commit,
        event("commits", 1, 0, { empty: true }),
        event("commits", 2, 0, { bot: true }),
      ],
    }),
  );
  assert.equal(metric(score, "commits")?.raw, 3);
  assert.equal(metric(score, "commits")?.adjusted, 1);
  assert.deepEqual(
    score.adjustments.map((adjustment) => adjustment.rule),
    ["duplicate-events", "automated-actors", "confirmed-empty-commits"],
  );
});

test("sustainable days score higher than a burst with the same volume", () => {
  const score = scoreActivity(scenarios.burst);
  assert.equal(metric(score, "commits")?.adjusted, 67);
  assert.equal(metric(score, "qualified")?.adjusted, 0);
  assert.ok(scoreActivity(scenarios.spread).totalScore > score.totalScore);
});

test("self-merged and independently merged PRs earn volume credit and only independent interactions earn collaboration", () => {
  const score = scoreActivity(
    snapshot({
      events: [
        event("pulls", 0, 0, { state: "MERGED", merger: "subject" }),
        event("pulls", 1, 0, {
          state: "MERGED",
          merger: "another",
          independentReview: true,
        }),
        event("pulls", 2, 0, { state: "CLOSED" }),
        event("issues", 1, 1, { resolvedByPr: "external-pr" }),
        event("reviews", 1, 0, { pr: "same", prAuthor: "another" }),
        event("reviews", 2, 0, { pr: "same", prAuthor: "another" }),
        event("reviews", 3, 0, { pr: "self", prAuthor: "subject" }),
      ],
    }),
  );
  assert.equal(metric(score, "pulls")?.adjusted, 3);
  assert.equal(metric(score, "merged")?.adjusted, 1);
  assert.equal(metric(score, "reviewed")?.adjusted, 1);
  assert.equal(metric(score, "reviews")?.adjusted, 1);
  assert.equal(metric(score, "otherReviews")?.adjusted, 1);
  assert.equal(metric(score, "linkedIssues")?.adjusted, 1);
});

test("empty repositories and forks without original evidence earn no coverage", () => {
  assert.equal(
    metric(scoreActivity(scenarios.emptyFarms), "qualified")?.adjusted,
    0,
  );
  const input = snapshot({
    repositories: [{ ...repo, fork: true }],
    events: [event("pulls", 0, 1, { state: "MERGED" })],
  });
  assert.equal(metric(scoreActivity(input), "qualified")?.adjusted, 0);
  input.events[0].original = true;
  assert.equal(metric(scoreActivity(input), "qualified")?.adjusted, 1);
});

test("UTC window is inclusive through the supplied time and spans 365 dates across leap day", () => {
  const beginning = (utcDay(evaluatedAt) - 364) * DAY;
  const score = scoreActivity(
    snapshot({
      events: [
        event("commits", 0, 0, { at: beginning - 1 }),
        event("commits", 1, 0, { at: beginning }),
        event("commits", 2, 0, { at: Date.parse("2024-03-01T00:10:00+01:00") }),
        event("commits", 3, 0, { at: evaluatedAt }),
        event("commits", 4, 0, { at: evaluatedAt + 1 }),
      ],
    }),
  );
  assert.equal(score.window.from, beginning);
  assert.equal(metric(score, "commits")?.raw, 3);
  assert.equal(metric(score, "streak")?.adjusted, 2);
});

test("rank and next-point arithmetic use the displayed precision", () => {
  const ranks = defaultConfig.rankThresholds;
  for (let i = 1; i < ranks.length; i++) {
    assert.equal(rankScore(ranks[i], ranks).rank, i);
    assert.equal(rankScore(ranks[i] - 0.01, ranks).rank, i - 1);
    assert.equal(rankScore(ranks[i] - 0.01, ranks).pointsToNextRank, 0.01);
    assert.equal(rankScore(ranks[i] - 0.004, ranks).rank, i);
  }
  assert.equal(rankScore(101, ranks).totalScore, 100);
  assert.equal(rankScore(-1, ranks).totalScore, 0);
});

test("rejects invalid input and config, does not convert invalid counts to zero", () => {
  assert.throws(() => scoreActivity(snapshot({ evaluatedAt: Number.NaN })), {
    code: "snapshot",
  });
  assert.throws(
    () =>
      scoreActivity(
        snapshot({ events: [event("commits", 0)], dailyCommits: [] }),
      ),
    { code: "aggregate" },
  );
  assert.throws(
    () =>
      scoreActivity(
        snapshot({ events: [event("issues", 0, 0, { repo: "unknown" })] }),
      ),
    { code: "event" },
  );
  assert.throws(
    () =>
      scoreActivity(snapshot(), {
        ...defaultConfig,
        burst: [10, 20, 0.1, 0.5],
      }),
    { code: "config" },
  );
  const invalid = snapshot({ impact: { stars: -1, followers: Number.NaN } });
  assert.equal(metric(scoreActivity(invalid), "stars")?.adjusted, null);
  assert.equal(
    metric(scoreActivity(invalid), "followers")?.availability,
    "unavailable",
  );
});

test("deterministic generated activity is monotone and duplication cannot increase the score", () => {
  const input = snapshot();
  let seed = 101;
  let previous = 0;
  for (let i = 0; i < 180; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    input.events.push(event("commits", i, seed % 365));
    const result = scoreActivity(input);
    const points = metric(result, "commits")?.points ?? -1;
    assert.ok(points >= previous);
    previous = points;
    assert.equal(
      scoreActivity({
        ...input,
        events: [...input.events, ...input.events].reverse(),
      }).totalScore,
      result.totalScore,
    );
  }
});

test("GitHub adapter excludes private and restricted data and surfaces truncation", () => {
  const publicRepo = {
    id: "public",
    visibility: "PUBLIC",
    isFork: false,
    isArchived: false,
    owner: { id: "subject" },
  } as const;
  const occurredAt = new Date(evaluatedAt).toISOString();
  const collection: ScoringCollection = {
    restrictedContributionsCount: 7,
    totalRepositoriesWithContributedCommits: 2,
    totalCommitContributions: 55,
    commitContributionsByRepository: [
      {
        repository: publicRepo,
        contributions: {
          pageInfo: { hasNextPage: true },
          nodes: [{ occurredAt, commitCount: 10 }],
        },
      },
      {
        repository: { ...publicRepo, id: "private", visibility: "PRIVATE" },
        contributions: {
          pageInfo: { hasNextPage: false },
          nodes: [{ occurredAt, commitCount: 45 }],
        },
      },
    ],
    issueContributions: {
      pageInfo: { hasNextPage: false },
      nodes: [
        {
          occurredAt,
          isRestricted: false,
          issue: {
            id: "issue-1",
            repository: publicRepo,
            author: { __typename: "User", id: "subject" },
            state: "CLOSED",
            closedAt: occurredAt,
            timelineItems: {
              nodes: [
                {
                  createdAt: occurredAt,
                  closer: {
                    __typename: "PullRequest",
                    id: "pr-1",
                    state: "MERGED",
                    author: { __typename: "User", id: "someone" },
                    repository: { visibility: "PUBLIC" },
                  },
                },
              ],
            },
          },
        },
      ],
    },
  };
  const input = githubSnapshot(
    "subject",
    evaluatedAt,
    undefined,
    null,
    collection,
    false,
  );
  assert.equal(input.repositories.length, 1);
  assert.equal(input.dailyCommits?.length, 1);
  const score = scoreActivity(input);
  assert.equal(metric(score, "commits")?.raw, 10);
  assert.equal(metric(score, "commits")?.availability, "partial");
  assert.equal(metric(score, "linkedIssues")?.adjusted, 1);
  assert.equal(metric(score, "followers")?.raw, null);
  assert.equal(score.provisional, true);
});

test("GitHub impact ignores private repositories and unpublished releases", () => {
  const publicRepo = {
    id: "public",
    visibility: "PUBLIC",
    isPrivate: false,
    stargazerCount: 15,
    forkCount: 3,
  } as const;
  const impact = {
    totalCount: 3,
    nodes: [
      {
        ...publicRepo,
        releases: {
          totalCount: 2,
          nodes: [
            { isDraft: true, publishedAt: null },
            {
              isDraft: false,
              publishedAt: new Date(evaluatedAt).toISOString(),
            },
          ],
        },
      },
      {
        ...publicRepo,
        id: "truncated",
        releases: {
          totalCount: 2,
          nodes: [{ isDraft: true, publishedAt: null }],
        },
      },
      {
        ...publicRepo,
        id: "private",
        visibility: "PRIVATE" as const,
        isPrivate: true,
        stargazerCount: 900,
      },
    ],
  };
  const result = scoreActivity(
    githubSnapshot("subject", evaluatedAt, 0, impact, null, false),
  );
  assert.equal(metric(result, "stars")?.raw, 30);
  assert.equal(metric(result, "releases")?.raw, 1);
  assert.equal(metric(result, "releases")?.availability, "partial");
});

test("verified commit history improves coverage without double-counting aggregate commits", () => {
  const githubRepo = (id: string) => ({
    id,
    visibility: "PUBLIC" as const,
    owner: { id: "subject" },
    isFork: false,
    isArchived: false,
  });
  const day = (index: number) =>
    new Date(evaluatedAt - index * DAY).toISOString();
  const pages = { nodes: [], pageInfo: { hasNextPage: false } };
  const collection: ScoringCollection = {
    totalRepositoriesWithContributedCommits: 2,
    totalCommitContributions: 8,
    commitContributionsByRepository: [
      {
        repository: githubRepo("repo-one"),
        contributions: {
          ...pages,
          nodes: [0, 1, 2].map((index) => ({
            occurredAt: day(index),
            commitCount: 2,
          })),
        },
      },
      {
        repository: githubRepo("repo-two"),
        contributions: {
          ...pages,
          nodes: [{ occurredAt: day(0), commitCount: 2 }],
        },
      },
    ],
    pullRequestContributions: pages,
    pullRequestReviewContributions: pages,
    issueContributions: pages,
  };
  const history = {
    nodes: [
      {
        id: "repo-one",
        visibility: "PUBLIC",
        defaultBranchRef: {
          target: {
            history: {
              ...pages,
              nodes: Array.from({ length: 6 }, (_, index) => ({
                oid: (index + 1).toString(16).padStart(40, "0"),
                authoredDate: day(Math.floor(index / 2)),
                tree: { oid: "tree" },
                parents: {
                  totalCount: 1,
                  nodes: [{ tree: { oid: index ? "parent" : "tree" } }],
                },
              })),
            },
          },
        },
      },
    ],
  };
  const score = scoreActivity(
    githubSnapshot("subject", evaluatedAt, 0, null, collection, false, history),
  );
  assert.equal(metric(score, "commits")?.raw, 8);
  assert.equal(metric(score, "commits")?.adjusted, 7);
  assert.equal(metric(score, "commits")?.availability, "partial");
  assert.equal(metric(score, "activeDays")?.availability, "complete");
  assert.equal(metric(score, "qualified")?.adjusted, 1);
  assert.equal(metric(score, "qualified")?.availability, "complete");

  collection.commitContributionsByRepository?.pop();
  collection.totalRepositoriesWithContributedCommits = 1;
  const reconciled = scoreActivity(
    githubSnapshot("subject", evaluatedAt, 0, null, collection, false, history),
  );
  assert.equal(metric(reconciled, "commits")?.raw, 6);
  assert.equal(metric(reconciled, "commits")?.adjusted, 5);
  assert.equal(metric(reconciled, "commits")?.availability, "complete");
});
