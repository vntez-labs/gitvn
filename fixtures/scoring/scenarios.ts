import type {
  ActivityEvent,
  RawActivitySnapshot,
  Repository,
} from "../../src/lib/scoring/models";
import { DAY } from "../../src/lib/scoring/normalize";
import { defaultConfig } from "../../src/lib/scoring/score";

export const evaluatedAt = Date.parse("2024-03-01T12:00:00Z");
export const repo: Repository = {
  id: "repo-0",
  owned: true,
  visibility: "public",
  fork: false,
};
export const completeCoverage = Object.fromEntries(
  Object.values(defaultConfig.categories).flatMap((category) =>
    Object.keys(category).map((key) => [key, "complete"]),
  ),
) as RawActivitySnapshot["coverage"];

export function snapshot(
  overrides: Partial<RawActivitySnapshot> = {},
): RawActivitySnapshot {
  return {
    subject: "subject",
    evaluatedAt,
    repositories: [repo],
    events: [],
    coverage: { ...completeCoverage },
    impact: { stars: 0, followers: 0, forks: 0, releases: 0 },
    ...overrides,
  };
}

export function event(
  kind: ActivityEvent["kind"],
  index: number,
  daysAgo = 0,
  fields: Partial<ActivityEvent> = {},
): ActivityEvent {
  return {
    kind,
    id: `${kind}-${index}`,
    at: evaluatedAt - daysAgo * DAY,
    actor: "subject",
    repo: repo.id,
    ...fields,
  };
}

interface Volume {
  commits: number;
  pulls: number;
  issues: number;
  reviews: number;
  days: number;
  repositories: number;
  collaboration: boolean;
}

export function profile(volume: Volume): RawActivitySnapshot {
  const repositories = Array.from({ length: volume.repositories }, (_, i) => ({
    ...repo,
    id: `repo-${i}`,
    owned: i % 3 === 0,
  }));
  const events: ActivityEvent[] = [];
  for (const kind of ["commits", "pulls", "issues", "reviews"] as const) {
    for (let i = 0; i < volume[kind]; i++) {
      const fields: Partial<ActivityEvent> = {
        repo: repositories[i % repositories.length].id,
      };
      if (kind === "pulls") {
        fields.state = i % 3 === 0 || volume.collaboration ? "MERGED" : "OPEN";
        fields.merger = volume.collaboration ? "maintainer" : "subject";
        fields.independentReview = volume.collaboration;
      }
      if (kind === "reviews") {
        fields.pr = `review-target-${i}`;
        fields.prAuthor = "maintainer";
      }
      if (kind === "issues" && volume.collaboration)
        fields.resolvedByPr = `resolver-${i}`;
      events.push(event(kind, i, i % volume.days, fields));
    }
  }
  return snapshot({ repositories, events });
}

const corporate = profile({
  commits: 55,
  pulls: 5,
  issues: 2,
  reviews: 4,
  days: 45,
  repositories: 2,
  collaboration: false,
});
corporate.coverage = Object.fromEntries(
  Object.keys(completeCoverage).map((key) => [key, "partial"]),
);
corporate.limitations = ["Synthetic limited public visibility."];

export const scenarios = {
  empty: snapshot(),
  newDeveloper: snapshot({
    events: [event("commits", 0), event("issues", 0, 2)],
  }),
  student: profile({
    commits: 160,
    pulls: 8,
    issues: 6,
    reviews: 7,
    days: 115,
    repositories: 3,
    collaboration: false,
  }),
  individual: profile({
    commits: 420,
    pulls: 21,
    issues: 13,
    reviews: 14,
    days: 140,
    repositories: 4,
    collaboration: true,
  }),
  corporate,
  focusedMaintainer: profile({
    commits: 1500,
    pulls: 80,
    issues: 30,
    reviews: 50,
    days: 250,
    repositories: 1,
    collaboration: true,
  }),
  manyProjects: profile({
    commits: 400,
    pulls: 42,
    issues: 20,
    reviews: 35,
    days: 120,
    repositories: 20,
    collaboration: true,
  }),
  openSourceMaintainer: {
    ...profile({
      commits: 1000,
      pulls: 100,
      issues: 55,
      reviews: 160,
      days: 280,
      repositories: 12,
      collaboration: true,
    }),
    impact: { stars: 700, followers: 240, forks: 115, releases: 6 },
  },
  burst: profile({
    commits: 500,
    pulls: 0,
    issues: 0,
    reviews: 0,
    days: 1,
    repositories: 1,
    collaboration: false,
  }),
  spread: profile({
    commits: 500,
    pulls: 0,
    issues: 0,
    reviews: 0,
    days: 50,
    repositories: 1,
    collaboration: false,
  }),
  emptyFarms: profile({
    commits: 0,
    pulls: 0,
    issues: 0,
    reviews: 0,
    days: 1,
    repositories: 100,
    collaboration: false,
  }),
  maxScore: {
    ...profile({
      commits: 3500,
      pulls: 150,
      issues: 80,
      reviews: 200,
      days: 350,
      repositories: 18,
      collaboration: true,
    }),
    impact: { stars: 500, followers: 200, forks: 100, releases: 10 },
  },
  partialAggregate: snapshot({
    coverage: {
      commits: "partial",
      activeDays: "partial",
      activeWeeks: "partial",
    },
    dailyCommits: [
      { repo: repo.id, day: Math.floor(evaluatedAt / DAY), count: 100 },
    ],
  }),
  restricted: snapshot({
    repositories: [{ ...repo, visibility: "restricted" }],
    coverage: {},
    events: [event("commits", 1)],
    limitations: ["Restricted contributions excluded."],
  }),
};
