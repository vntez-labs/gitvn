import type { AdjustedActivity } from "./adjust";
import type {
  Availability,
  CollaborationScore,
  Config,
  Measurement,
  RoleComponent,
  RoleMetricId,
  Settings,
} from "./models";
import type { NormalizedActivity } from "./normalize";

const groups = [
  ["review", ["reviewPrs", "reviewAuthors"], 5],
  ["contributor", ["contributorMerges", "contributorReviews"], 7],
  ["maintainer", ["maintainerMerges", "maintainerAuthors"], 7],
  ["issues", ["resolvedIssues"], 3],
] as const;

export function validRoleConfig(role: Config["role"]) {
  return (
    role &&
    groups.every(
      ([, ids, ceiling]) =>
        ids.reduce<number>((sum, id) => {
          const item = role[id];
          if (
            !Array.isArray(item) ||
            item.length !== 3 ||
            !Number.isFinite(item[0]) ||
            item[0] < 0 ||
            Math.round(item[0] * 100) / 100 !== item[0] ||
            !Number.isFinite(item[1]) ||
            item[1] <= 0 ||
            !["linear", "log", "piecewise"].includes(item[2])
          )
            return NaN;
          return sum + item[0];
        }, 0) === ceiling,
    )
  );
}

export function scoreRoles(
  normalized: NormalizedActivity,
  adjusted: AdjustedActivity,
  role: NonNullable<Config["role"]>,
  scale: (value: number, model: Settings) => number,
  round: (value: number) => number,
): CollaborationScore {
  const { snapshot, from, repositories } = normalized;
  const { subject, evaluatedAt, collaboration } = snapshot;
  const contributorIds = new Set<string>();
  for (const event of normalized.events.values())
    if (
      event.kind === "pulls" &&
      !event.bot &&
      event.state === "MERGED" &&
      event.merger &&
      event.merger !== subject
    )
      contributorIds.add(event.id);
  const integrated = new Map<string, string>();
  const issues = new Set<string>();
  const inWindow = (at: number) =>
    Number.isSafeInteger(at) && at >= from && at <= evaluatedAt;
  for (const entry of collaboration?.integrations ?? []) {
    if (
      !entry.id ||
      !entry.author ||
      !inWindow(entry.mergedAt) ||
      repositories.get(entry.repo)?.visibility !== "public"
    )
      continue;
    if (entry.author === subject && entry.merger && entry.merger !== subject)
      contributorIds.add(entry.id);
    const maintained = entry.author !== subject && entry.merger === subject;
    if (maintained) {
      const prior = integrated.get(entry.id);
      if (!prior || entry.author < prior)
        integrated.set(entry.id, entry.author);
    }
    if (maintained || entry.author === subject) {
      for (const issue of entry.issues ?? []) {
        if (
          issue.id &&
          issue.author &&
          issue.author !== subject &&
          inWindow(issue.closedAt) &&
          issue.closedAt >= entry.mergedAt
        ) {
          issues.add(issue.id);
        }
      }
    }
  }
  const measure = (
    n: number,
    availability: Availability = "unavailable",
  ): Measurement =>
    availability === "unavailable"
      ? { raw: null, adjusted: null, availability }
      : { raw: n, adjusted: n, availability };
  const unavailable = measure(0);
  const values: Record<RoleMetricId, Measurement> = {
    reviewPrs: adjusted.metrics.otherReviews ?? unavailable,
    reviewAuthors: measure(
      adjusted.reviewedAuthors,
      adjusted.metrics.otherReviews?.availability,
    ),
    contributorMerges: measure(
      contributorIds.size,
      adjusted.metrics.merged?.availability ??
        (contributorIds.size ? "partial" : "unavailable"),
    ),
    contributorReviews: adjusted.metrics.reviewed ?? unavailable,
    maintainerMerges: measure(integrated.size, collaboration?.maintainer),
    maintainerAuthors: measure(
      new Set(integrated.values()).size,
      collaboration?.maintainer,
    ),
    resolvedIssues: measure(issues.size, collaboration?.issues),
  };
  const components = {} as Record<(typeof groups)[number][0], RoleComponent>;
  for (const [name, ids, ceiling] of groups) {
    const metrics = ids.map((id) => {
      const value = values[id];
      const model = role[id];
      const [maximum, threshold, method] = model;
      return {
        ...value,
        id,
        maximum,
        threshold,
        scale: method,
        points: round(scale(value.adjusted ?? 0, model)),
        scoreResolved:
          value.availability === "complete" ||
          (value.adjusted ?? 0) >= threshold,
      };
    });
    const points = round(metrics.reduce((sum, item) => sum + item.points, 0));
    components[name] = {
      metrics,
      points,
      minimum: points,
      ceiling,
      maximum: round(
        metrics.reduce(
          (sum, item) =>
            sum + (item.scoreResolved ? item.points : item.maximum),
          0,
        ),
      ),
    };
  }
  const { review, contributor, maintainer, issues: resolution } = components;
  const sharedRole = {
    points: Math.max(contributor.points, maintainer.points),
    minimum: Math.max(contributor.minimum, maintainer.minimum),
    maximum: Math.max(contributor.maximum, maintainer.maximum),
  };
  const missing: RoleMetricId[] = [];
  for (const component of [review, resolution, contributor, maintainer]) {
    if (
      (component === contributor || component === maintainer) &&
      component.maximum <= sharedRole.minimum
    )
      continue;
    missing.push(
      ...component.metrics
        .filter((item) => !item.scoreResolved)
        .map((item) => item.id),
    );
  }
  return {
    ...components,
    sharedRole,
    missing,
    sources: [...(collaboration?.sources ?? [])],
    points: round(review.points + sharedRole.points + resolution.points),
    minimum: round(review.minimum + sharedRole.minimum + resolution.minimum),
    maximum: round(review.maximum + sharedRole.maximum + resolution.maximum),
  };
}
