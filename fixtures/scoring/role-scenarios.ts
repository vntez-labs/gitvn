import type { IntegrationEvidence } from "../../src/lib/scoring/models";
import { DAY } from "../../src/lib/scoring/normalize";
import { evaluatedAt, event, repo, snapshot } from "./scenarios";

export function integration(
  id: string,
  author = "other",
  merger = "subject",
): IntegrationEvidence {
  return { id, repo: repo.id, author, merger, mergedAt: evaluatedAt - DAY };
}

const roleEvidence = (integrations: IntegrationEvidence[] = []) => ({
  integrations,
  maintainer: "partial" as const,
  issues: "complete" as const,
  sources: ["fixture"],
});
const contributorEvents = Array.from({ length: 50 }, (_, i) =>
  event("pulls", i, i % 10, {
    state: "MERGED",
    merger: "other",
    independentReview: i < 30,
  }),
);
const integrationEvents = Array.from({ length: 50 }, (_, i) =>
  integration(`maintainer-${i}`, `human-${i % 20}`),
);
const reviews = Array.from({ length: 100 }, (_, i) =>
  event("reviews", i, i % 10, {
    pr: `reviewed-${i}`,
    prAuthor: `human-${i % 20}`,
  }),
);
const issues = Array.from({ length: 30 }, (_, i) => ({
  id: `issue-${i}`,
  author: "other",
  closedAt: evaluatedAt - DAY,
}));

export const roleScenarios = {
  contributorOnly: snapshot({
    events: contributorEvents,
    collaboration: roleEvidence(),
  }),
  maintainerOnly: snapshot({ collaboration: roleEvidence(integrationEvents) }),
  reviewerOnly: snapshot({ events: reviews, collaboration: roleEvidence() }),
  smallTeam: snapshot({
    events: reviews.map((event) => ({ ...event, prAuthor: "teammate" })),
    collaboration: roleEvidence(
      integrationEvents.map((entry) => ({ ...entry, author: "teammate" })),
    ),
  }),
  organizationMaintainer: snapshot({
    repositories: [{ ...repo, owned: false }],
    collaboration: roleEvidence(integrationEvents),
  }),
  bothRoles: snapshot({
    events: [...contributorEvents, ...reviews],
    collaboration: roleEvidence([
      ...integrationEvents,
      { ...integration("resolution", "subject", "other"), issues },
    ]),
  }),
  solo: snapshot({
    events: [event("pulls", 0, 0, { state: "MERGED", merger: "subject" })],
    collaboration: roleEvidence([integration("self", "subject")]),
  }),
};
