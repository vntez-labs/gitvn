import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { setTimeout } from "node:timers/promises";

const cookie = "github_access_token=synthetic-insights-token";

function installProvider() {
  const original = globalThis.fetch;
  let historyReads = 0;
  let maintainerSearches = 0;
  let splitReads = 0;
  let aggregateVisits = 0;
  let annualEvaluation;
  const realNow = Date.now;
  let shift = 0;
  Date.now = () => realNow() + shift;
  globalThis.fetch = async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : input);
    if (url.hostname === "github.com")
      return new Response(
        '<img src="https://example.test/badge.png" alt="Achievement: Synthetic Badge">',
      );
    if (url.hostname !== "api.github.com") return original(input, init);
    if (url.pathname.endsWith("/orgs")) return Response.json([]);
    if (url.pathname.startsWith("/users/"))
      return Response.json({ email: null });
    assert.equal(url.pathname, "/graphql");
    const authorization = new Headers(init.headers).get("authorization");
    assert.ok(
      [
        "Bearer synthetic-insights-token",
        "Bearer synthetic-alternate-token",
      ].includes(authorization),
    );
    const {
      query,
      variables: { login, from, to, after },
    } = JSON.parse(init.body);
    assert.doesNotMatch(query, /\bemail\b/);
    if (query.includes("query GitvnMaintainerCandidates")) {
      assert.equal(process.env.GITVN_SCORING_ROLE, "1");
      const { query0 } = JSON.parse(init.body).variables;
      assert.match(query0, /is:pr is:merged is:public merged:/);
      const mergedAt = new Date(Date.now() - 86_400_000).toISOString();
      const candidate = {
        id: "maintained-search",
        merged: true,
        mergedAt,
        author: { __typename: "User", id: "another" },
        mergedBy: { __typename: "User", id: "user" },
        repository: {
          id: "org-public",
          visibility: "PUBLIC",
          isFork: false,
          isArchived: false,
          owner: { id: "org" },
          nameWithOwner: "org/project",
        },
      };
      const alternate = authorization === "Bearer synthetic-alternate-token";
      if (!alternate && ++maintainerSearches > 1)
        return new Response(null, { status: 429 });
      return Response.json({
        data: {
          rateLimit: { cost: 1, remaining: 900, resetAt: mergedAt },
          candidates0: {
            issueCount: 200,
            pageInfo: { hasNextPage: true },
            nodes: alternate
              ? []
              : [
                  candidate,
                  candidate,
                  {
                    ...candidate,
                    id: "bot",
                    mergedBy: { __typename: "Bot", id: "user" },
                  },
                ],
          },
        },
      });
    }
    if (query.includes("query GitvnCommitBuckets")) {
      splitReads++;
      assert.equal(authorization, "Bearer synthetic-insights-token");
      assert.equal(aggregateVisits, 1);
      if (splitReads === 1) return new Response(null, { status: 503 });
      const contains = annualEvaluation >= from && annualEvaluation <= to;
      return Response.json({
        data: {
          rateLimit: { cost: 1, remaining: 990, resetAt: to },
          user: {
            id: "user",
            contributionsCollection: {
              startedAt: from,
              endedAt: to,
              restrictedContributionsCount: 0,
              totalCommitContributions: contains ? 40 : 0,
              totalRepositoriesWithContributedCommits: Number(contains),
              commitContributionsByRepository: contains
                ? [
                    {
                      repository: {
                        id: "repo-aggregate",
                        visibility: "PUBLIC",
                        owner: { id: "user" },
                        isFork: false,
                        isArchived: false,
                      },
                      contributions: {
                        totalCount: 1,
                        pageInfo: { hasNextPage: false },
                        nodes: [
                          {
                            occurredAt: annualEvaluation,
                            commitCount: 40,
                            isRestricted: false,
                          },
                        ],
                      },
                    },
                  ]
                : [],
            },
          },
        },
      });
    }
    const split = login === "aggregate-pages";
    if (split && !query.includes("query GitvnContributionPages")) {
      aggregateVisits++;
      annualEvaluation ??= to;
      if (aggregateVisits === 3) shift = 6 * 60_000;
    }
    const commitDay = (daysAgo) =>
      new Date(Date.parse(to) - daysAgo * 86_400_000).toISOString();
    const dayRows = [0, 1, 2].map((offset) => ({
      occurredAt: commitDay(offset),
      commitCount: 2,
    }));
    const historyRows = Array.from({ length: 6 }, (_, i) => ({
      oid: (i + 1).toString(16).padStart(40, "0"),
      authoredDate: commitDay(Math.floor(i / 2)),
      tree: { oid: "tree" },
      parents: { totalCount: 1, nodes: [{ tree: { oid: "parent" } }] },
    }));
    if (query.includes("query GitvnCommitHistoryPages")) {
      const { tip0, after0 } = JSON.parse(init.body).variables;
      assert.equal(tip0, "tip");
      assert.equal(after0, "history-next");
      return Response.json({
        data: {
          page0: {
            history: {
              nodes: historyRows.slice(2),
              pageInfo: { hasNextPage: false, endCursor: "end" },
            },
          },
        },
      });
    }
    if (query.includes("query GitvnCommitHistory")) {
      assert.equal(process.env.GITVN_COLLECTOR_VERSION, "3.0");
      const { repos } = JSON.parse(init.body).variables;
      if (repos[0] === "repo-paginated") {
        historyReads++;
        if (historyReads > 1) return new Response(null, { status: 429 });
        return Response.json({
          data: {
            nodes: [
              {
                id: repos[0],
                visibility: "PUBLIC",
                defaultBranchRef: {
                  target: {
                    id: "tip",
                    history: {
                      nodes: historyRows.slice(0, 2),
                      pageInfo: {
                        hasNextPage: true,
                        endCursor: "history-next",
                      },
                    },
                  },
                },
              },
            ],
          },
        });
      }
      assert.deepEqual(JSON.parse(init.body).variables.repos, ["repo"]);
      return new Response(null, { status: 429 });
    }
    if (login === "rate-limited")
      return new Response(null, {
        status: 403,
        headers: { "Retry-After": "120" },
      });
    assert.equal(
      query.includes("commitContributionsByRepository") ||
        query.includes("query GitvnReviewPage") ||
        query.includes("query GitvnContributionPages"),
      process.env.GITVN_SCORING_V3 !== "0",
    );
    const date = to.slice(0, 10);
    const paginated = login === "commit-pages";
    const page = { nodes: [], pageInfo: { hasNextPage: false } };
    const repository = {
      id: split ? "repo-aggregate" : paginated ? "repo-paginated" : "repo",
      visibility: "PUBLIC",
      owner: { id: "user" },
      isFork: false,
      isArchived: false,
    };
    const n = after || query.includes("query GitvnContributionPages") ? 2 : 1;
    const reviews = {
      nodes: [
        {
          occurredAt: to,
          isRestricted: false,
          pullRequest: {
            id: `pr-${n}`,
            repository,
            author: { __typename: "User", id: "other" },
          },
          pullRequestReview: {
            id: `review-${n}`,
            submittedAt: to,
            state: "APPROVED",
            author: { __typename: "User", id: "user" },
          },
        },
      ],
      pageInfo: {
        hasNextPage: n === 1,
        endCursor: n === 1 ? "next-page" : null,
      },
    };
    if (
      query.includes("query GitvnReviewPage") ||
      query.includes("query GitvnContributionPages")
    ) {
      assert.equal(
        after ?? JSON.parse(init.body).variables.cursor0,
        "next-page",
      );
      if (login === "review-page-error")
        return new Response(null, { status: 429 });
      return Response.json({
        data: {
          user: {
            id: "user",
            contributionsCollection: {
              pullRequestReviewContributions: reviews,
            },
          },
        },
      });
    }
    return Response.json({
      data: {
        rateLimit: {
          cost: 3,
          remaining: split && aggregateVisits >= 3 ? 99 : 1000,
          resetAt: to,
        },
        viewer: { login: "viewer" },
        user: {
          id: "user",
          login,
          email: "",
          followers: { totalCount: 0 },
          following: { totalCount: 0 },
          repositories: { totalCount: 0, nodes: [] },
          contributionsCollection: {
            restrictedContributionsCount: 0,
            totalCommitContributions: paginated ? 6 : 40,
            totalPullRequestContributions: 0,
            totalIssueContributions: 0,
            totalPullRequestReviewContributions: 2,
            totalRepositoriesWithContributedCommits: split ? 2 : 1,
            commitContributionsByRepository: [
              {
                repository,
                contributions: {
                  ...page,
                  nodes: (paginated
                    ? dayRows
                    : [
                        {
                          occurredAt: split ? annualEvaluation : to,
                          commitCount: 40,
                        },
                      ]
                  ).map((row) => ({ ...row, isRestricted: false })),
                },
              },
            ],
            pullRequestContributions: page,
            issueContributions: page,
            pullRequestReviewContributions: reviews,
            contributionCalendar: {
              weeks: [
                {
                  contributionDays: split
                    ? Array.from({ length: 365 }, (_, i) => ({
                        date: commitDay(i).slice(0, 10),
                        contributionCount: i === 0 ? 40 : 0,
                        contributionLevel: "NONE",
                        weekday: 0,
                      }))
                    : [
                        {
                          date,
                          contributionCount: 40,
                          contributionLevel: "FOURTH_QUARTILE",
                          weekday: 0,
                        },
                      ],
                },
              ],
            },
          },
        },
      },
    });
  };
}

async function checkServer(flag, collector = "3.0", role = false) {
  const portProbe = createServer();
  portProbe.listen(0, "127.0.0.1");
  await once(portProbe, "listening");
  const { port } = portProbe.address();
  await new Promise((resolve) => portProbe.close(resolve));
  const server = spawn(
    process.execPath,
    [
      "--import",
      import.meta.url,
      "node_modules/next/dist/bin/next",
      "start",
      "-H",
      "127.0.0.1",
      "-p",
      String(port),
    ],
    {
      env: {
        ...process.env,
        GITVN_SCORING_SMOKE_MOCK: "1",
        GITVN_SCORING_V3: flag,
        GITVN_SCORING_ROLE: role ? "1" : "0",
        GITVN_COLLECTOR_VERSION: collector,
      },
      stdio: "inherit",
    },
  );
  const exited = once(server, "exit");
  const root = `http://127.0.0.1:${port}`;
  const endpoint = `${root}/api/github/user/synthetic`;
  try {
    let response;
    for (let i = 0; i < 80 && !response; i++) {
      response = await fetch(endpoint).catch(() => null);
      if (!response) await setTimeout(100);
    }
    assert.equal(response?.status, 401);
    const authenticated = await fetch(endpoint, {
      headers: { Cookie: cookie },
    });
    assert.equal(authenticated.status, 200);
    assert.equal(
      authenticated.headers.get("cache-control"),
      "private, no-store",
    );
    const body = await authenticated.json();
    assert.equal(body.activity.commits, 40);
    assert.equal(body.achievements[0].name, "Synthetic Badge");
    assert.equal(
      JSON.stringify(body).includes("synthetic-insights-token"),
      false,
    );
    if (flag === "0") {
      assert.equal("score" in body, false);
    } else if (role) {
      assert.equal(body.score.scoringVersion, "3.2.0");
      assert.equal(body.score.collaboration.maintainer.metrics[0].raw, 1);
      assert.equal(
        body.score.collaboration.maintainer.metrics[0].availability,
        "partial",
      );
      assert.ok(
        body.score.completeness.limitations.some((line) =>
          line.includes("Kết quả tìm PR"),
        ),
      );
      for (const [headers, expected] of [
        [{ Cookie: cookie }, 1],
        [{ Cookie: "github_access_token=synthetic-alternate-token" }, 0],
      ]) {
        const next = await fetch(endpoint, { headers });
        const refreshed = await next.json();
        assert.equal(
          refreshed.score.collaboration.maintainer.metrics[0].raw,
          expected,
        );
        assert.equal(refreshed.achievements.length, 1);
      }
    } else {
      assert.equal(
        body.score.scoringVersion,
        collector === "3.0" ? "3.0.0" : "3.1.0",
      );
      assert.equal(body.score.provisional, true);
      assert.equal(body.score.categories.length, 5);
      const commitScore = body.score.categories
        .flatMap((category) => category.metrics)
        .find((metric) => metric.id === "commits");
      assert.equal(commitScore.adjusted, 21);
      assert.equal(
        commitScore.availability,
        collector === "3.0" ? "partial" : "complete",
      );
      const review = (score) =>
        score.categories
          .flatMap((category) => category.metrics)
          .find((metric) => metric.id === "reviews");
      assert.equal(review(body.score).raw, 2);
      assert.equal(review(body.score).availability, "complete");
      const partial = await fetch(`${root}/api/github/user/review-page-error`, {
        headers: { Cookie: cookie },
      });
      assert.equal(partial.status, 200);
      const fallback = await partial.json();
      assert.equal(review(fallback.score).raw, 1);
      assert.equal(review(fallback.score).availability, "partial");
      assert.equal(fallback.achievements[0].name, "Synthetic Badge");
      for (let attempt = 0; attempt < 2; attempt++) {
        const response = await fetch(`${root}/api/github/user/commit-pages`, {
          headers: { Cookie: cookie },
        });
        assert.equal(response.status, 200);
        const result = await response.json();
        const metrics = result.score.categories.flatMap(
          (category) => category.metrics,
        );
        assert.equal(
          metrics.find((metric) => metric.id === "qualified").adjusted,
          1,
        );
        assert.equal(
          metrics.find((metric) => metric.id === "commits").availability,
          "complete",
        );
        assert.equal(result.achievements[0].name, "Synthetic Badge");
      }
    }
    if (collector === "3.1" && !role) {
      const aggregateEndpoint = `${root}/api/github/user/aggregate-pages`;
      for (const [stage, expected, credential] of [
        ["adaptive", "complete", cookie],
        ["warm", "complete", cookie],
        ["stale", "stale", cookie],
        [
          "isolated",
          "partial",
          "github_access_token=synthetic-alternate-token",
        ],
      ]) {
        const started = performance.now();
        const response = await fetch(aggregateEndpoint, {
          headers: { Cookie: credential },
        });
        assert.equal(response.status, 200);
        const result = await response.json();
        assert.equal(result.score.collection.status, expected);
        assert.equal(result.achievements.length, 1);
        console.log(
          JSON.stringify({
            stage,
            milliseconds: Math.round(performance.now() - started),
          }),
        );
      }
    }
    const limited = await fetch(`${root}/api/github/user/rate-limited`, {
      headers: { Cookie: cookie },
    });
    assert.equal(limited.status, 429);
    assert.equal(limited.headers.get("retry-after"), "120");
  } finally {
    server.kill();
    await exited;
  }
}

if (process.env.GITVN_SCORING_SMOKE_MOCK === "1") {
  installProvider();
} else {
  await checkServer("1");
  await checkServer("1", "3.1");
  await checkServer("1", "3.1", true);
  await checkServer("0");
  console.log(
    "Production Insights route smoke tests passed with a synthetic GitHub provider.",
  );
}
