import assert from "node:assert/strict";
import { test } from "node:test";
import {
  collaborationInputs,
  type RolePull,
} from "../../src/lib/scoring/github-collaboration";
import type { IntegrationEvidence } from "../../src/lib/scoring/models";
import { DAY } from "../../src/lib/scoring/normalize";
import {
  aggregateConfig,
  roleConfig,
  scoreActivity,
} from "../../src/lib/scoring/score";
import { integration, roleScenarios } from "./role-scenarios";
import { evaluatedAt, event, repo, snapshot } from "./scenarios";

test("equivalent role ceilings, shared maximum, and unchanged non-collaboration scores", () => {
  const contributor = scoreActivity(roleScenarios.contributorOnly, roleConfig);
  const maintainer = scoreActivity(roleScenarios.maintainerOnly, roleConfig);
  assert.equal(contributor.collaboration?.sharedRole.points, 7);
  assert.equal(maintainer.collaboration?.sharedRole.points, 7);
  assert.equal(contributor.collaboration?.sharedRole.maximum, 7);
  assert.equal(
    contributor.collaboration?.missing.includes("maintainerMerges"),
    false,
  );
  assert.equal(
    contributor.collaboration?.maintainer.metrics[0].availability,
    "partial",
  );
  assert.equal(
    scoreActivity(roleScenarios.bothRoles, roleConfig).collaboration?.points,
    15,
  );
  for (const input of Object.values(roleScenarios)) {
    const result = scoreActivity(input, roleConfig);
    assert.ok(result.totalScore <= 100 && result.totalScore >= 0);
    assert.ok((result.collaboration?.points ?? -1) <= 15);
    assert.deepEqual(
      result.categories.slice(0, 4),
      scoreActivity(input, aggregateConfig).categories.slice(0, 4),
    );
    assert.deepEqual(result, scoreActivity(input, roleConfig));
  }
});

test("maintainer identity, date, duplicate PRs, issue deduplication, and review overlap", () => {
  const caseA = {
    ...integration("maintained"),
    issues: [{ id: "issue", author: "other", closedAt: evaluatedAt }],
  };
  const entries: IntegrationEvidence[] = [
    caseA,
    caseA,
    integration("self", "subject"),
    integration("bot-authored", ""),
    { ...integration("missing-merger"), merger: undefined },
    { ...integration("missing-author"), author: undefined },
    { ...integration("outside"), mergedAt: evaluatedAt - 366 * DAY },
    {
      ...integration("somebody-else", "other", "another"),
      issues: caseA.issues,
    },
    { ...integration("authored", "subject", "other"), issues: caseA.issues },
  ];
  const input = snapshot({
    repositories: [{ ...repo, owned: false }],
    events: [
      event("reviews", 0, 0, { pr: "maintained", prAuthor: "other" }),
      event("reviews", 1, 0, { pr: "maintained", prAuthor: "other" }),
      event("reviews", 2, 0, { pr: "self", prAuthor: "subject" }),
      event("reviews", 3, 0, { pr: "bot", prAuthor: "other", bot: true }),
    ],
    collaboration: {
      integrations: entries,
      maintainer: "partial",
      issues: "partial",
      sources: [],
    },
  });
  const role = scoreActivity(input, roleConfig).collaboration;
  assert.equal(role?.maintainer.metrics[0].raw, 1);
  assert.equal(role?.maintainer.metrics[1].raw, 1);
  assert.equal(role?.review.metrics[0].raw, 1);
  assert.equal(role?.issues.metrics[0].raw, 1);
  assert.ok((role?.maximum ?? 0) > (role?.minimum ?? 0));
  assert.equal(
    scoreActivity(snapshot(), roleConfig).collaboration?.maintainer.metrics[0]
      .raw,
    null,
  );
  const solo = scoreActivity(roleScenarios.solo, roleConfig);
  assert.equal(
    solo.categories[1].metrics.find((metric) => metric.id === "pulls")?.raw,
    1,
  );
  assert.equal(solo.collaboration?.contributor.metrics[0].raw, 0);
});

test("candidate links require the actual closing PR, a closed issue and known human actors", () => {
  const human = (id: string) => ({ id, __typename: "User" });
  const candidate: RolePull = {
    id: "pr",
    merged: true,
    mergedAt: new Date(evaluatedAt - DAY).toISOString(),
    repository: { id: repo.id, visibility: "PUBLIC" },
    author: human("other"),
    mergedBy: human("subject"),
  };
  const issue = {
    id: "issue",
    closed: true,
    author: human("another"),
    repository: { visibility: "PUBLIC" },
    timelineItems: {
      nodes: [
        {
          createdAt: new Date(evaluatedAt).toISOString(),
          closer: { id: candidate.id },
        },
      ],
    },
  };
  candidate.closingIssuesReferences = {
    nodes: [
      issue,
      { ...issue, id: "open", closed: false },
      {
        ...issue,
        id: "manually-closed",
        timelineItems: { nodes: [{ closer: null }] },
      },
    ],
  };
  const botMerge = {
    ...candidate,
    id: "bot",
    mergedBy: { id: "subject", __typename: "Bot" },
    closingIssuesReferences: undefined,
  };
  const input = collaborationInputs(snapshot(), null, {
    pulls: [candidate, candidate, botMerge],
    sources: ["search"],
  });
  const role = scoreActivity(input, roleConfig).collaboration;
  assert.equal(role?.issues.metrics[0].raw, 1);
  assert.equal(role?.maintainer.metrics[0].raw, 1);
  assert.equal(role?.maintainer.metrics[0].availability, "partial");
});

test("self-merging can retain independent review credit without gaining an independent merge", () => {
  const input = snapshot({
    events: [
      event("pulls", 8, 0, {
        state: "MERGED",
        merger: "subject",
        independentReview: true,
      }),
    ],
  });
  const result = scoreActivity(input, roleConfig);
  assert.equal(result.collaboration?.contributor.metrics[0].raw, 0);
  assert.equal(result.collaboration?.contributor.metrics[1].raw, 1);
});
