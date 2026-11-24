import { type AdjustedActivity, adjust } from "./adjust";
import defaults from "./defaults.json";
import metricLabels from "./labels.json";
import type {
  Category,
  Config,
  Metric,
  RawActivitySnapshot,
  ScoreResult,
  Settings,
} from "./models";
import {
  type NormalizedActivity,
  normalize,
  ScoringInputError,
} from "./normalize";
import roleDefaults from "./role-defaults.json";
import { scoreRoles, validRoleConfig } from "./roles";

export const defaultConfig = defaults as unknown as Config;

export const aggregateConfig: Config = { ...defaultConfig, version: "3.1.0" };

export const roleConfig: Config = {
  ...aggregateConfig,
  version: "3.2.0",
  role: roleDefaults as unknown as NonNullable<Config["role"]>,
};

const categoryIds = Object.keys(defaults.categories) as Category[];
const metricIds = (category: Category) =>
  Object.keys(defaults.categories[category]) as Metric[];

function round(value: number) {
  return Math.round(value * 100) / 100;
}

export function rankScore(value: number, thresholds: readonly number[]) {
  const totalScore = round(
    Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0)),
  );
  const rank = thresholds.findLastIndex((threshold) => totalScore >= threshold);
  const nextRank = rank + 1 < thresholds.length ? rank + 1 : null;
  return {
    totalScore,
    rank,
    nextRank,
    pointsToNextRank:
      nextRank === null ? 0 : round(thresholds[nextRank] - totalScore),
  };
}

export function validateConfig(config: Config) {
  if (config?.version === "3.2.0" && !validRoleConfig(config.role))
    throw new ScoringInputError("config");
  const validWeight = (value: number) =>
    Number.isFinite(value) && value >= 0 && value <= 1;
  if (
    !config ||
    typeof config.version !== "string" ||
    !config.version ||
    !Array.isArray(config.rankThresholds) ||
    config.rankThresholds.length !== 7 ||
    config.rankThresholds[0] !== 0 ||
    config.rankThresholds.some(
      (value, i, all) =>
        !Number.isFinite(value) ||
        value > 100 ||
        round(value) !== value ||
        (i > 0 && value <= all[i - 1]),
    ) ||
    !Array.isArray(config.burst) ||
    config.burst.length !== 4 ||
    !config.burst
      .slice(0, 2)
      .every((value) => Number.isSafeInteger(value) && value >= 0) ||
    !config.burst.slice(2).every(validWeight) ||
    config.burst[3] > config.burst[2] ||
    !Array.isArray(config.qualification) ||
    config.qualification.length !== 3 ||
    !config.qualification.every(
      (value) => Number.isSafeInteger(value) && value > 0,
    )
  ) {
    throw new ScoringInputError("config");
  }
  let maximum = 0;
  let collaborationMaximum = 0;
  for (const category of categoryIds) {
    const settings = config.categories?.[category] as
      | Record<Metric, Settings>
      | undefined;
    for (const id of metricIds(category)) {
      const item = settings?.[id];
      if (
        !Array.isArray(item) ||
        item.length !== 3 ||
        !Number.isFinite(item[0]) ||
        item[0] < 0 ||
        round(item[0]) !== item[0] ||
        !Number.isFinite(item[1]) ||
        item[1] <= 0 ||
        !["log", "linear", "piecewise"].includes(item[2])
      ) {
        throw new ScoringInputError("config");
      }
      maximum += item[0];
      if (category === "collaboration") collaborationMaximum += item[0];
    }
  }
  if (
    (config.version === "3.2.0" &&
      Math.abs(collaborationMaximum - 15) > 1e-9) ||
    Math.abs(maximum - 100) > 1e-9
  )
    throw new ScoringInputError("config");
}

function scale(value: number, [maximum, threshold, method]: Settings) {
  const ratio = Math.min(1, value / threshold);
  if (method === "log")
    return (
      maximum * (Math.log1p(Math.min(value, threshold)) / Math.log1p(threshold))
    );
  if (method === "piecewise")
    return maximum * (ratio <= 0.5 ? ratio * 1.5 : 0.75 + (ratio - 0.5) * 0.5);
  return maximum * ratio;
}

export function calculate(
  normalized: NormalizedActivity,
  adjusted: AdjustedActivity,
  config: Config,
): ScoreResult {
  const { snapshot, from } = normalized;
  const role =
    config.version === "3.2.0" && config.role
      ? scoreRoles(normalized, adjusted, config.role, scale, round)
      : undefined;
  const missingMetrics: ScoreResult["completeness"]["missingMetrics"] = [];
  const aggregateMode =
    config.version === "3.1.0" || config.version === "3.2.0";
  let observed = 0;
  const categories = categoryIds.map((category) => {
    if (category === "collaboration" && role) {
      missingMetrics.push(...role.missing);
      observed += [role.review, role.contributor, role.maintainer, role.issues]
        .flatMap((component) => component.metrics)
        .filter((metric) => metric.raw !== null).length;
      return { id: category, metrics: [], points: role.points, maximum: 15 };
    }
    const settings = config.categories[category] as Record<Metric, Settings>;
    const metrics = metricIds(category).map((id) => {
      const m = adjusted.metrics[id] ?? {
        raw: null,
        adjusted: null,
        availability: "unavailable" as const,
      };
      const monotonic =
        aggregateMode &&
        ((id === "commits" && snapshot.dailyCommits !== undefined) ||
          category === "coverage");
      const scoreResolved =
        m.availability === "complete" ||
        (m.availability === "partial" &&
          monotonic &&
          (m.adjusted ?? 0) >= settings[id][1]);
      if (!scoreResolved) missingMetrics.push(id);
      if (m.adjusted !== null) observed++;
      const [maximum, threshold, method] = settings[id];
      return {
        ...m,
        id,
        scoreResolved,
        maximum,
        threshold,
        scale: method,
        points: round(scale(m.adjusted ?? 0, settings[id])),
        window:
          category === "impact" ? ("lifetime" as const) : ("365-days" as const),
        source:
          category === "impact"
            ? "github-impact-snapshot"
            : id === "commits" && snapshot.dailyCommits !== undefined
              ? "github-daily-commit-aggregate"
              : category === "consistency" && snapshot.calendarDays
                ? "github-contribution-calendar"
                : "github-activity-evidence",
        explanation: metricLabels[id],
      };
    });
    return {
      id: category,
      metrics,
      points: round(metrics.reduce((sum, m) => sum + m.points, 0)),
      maximum: round(metrics.reduce((sum, m) => sum + m.maximum, 0)),
    };
  });
  const limitations = [...(snapshot.limitations ?? [])];
  if (missingMetrics.length)
    limitations.push(
      "Chỉ tính điểm từ dữ liệu quan sát được. Phần điểm thiếu không được phân bổ lại.",
    );
  const metrics = categories.flatMap((category) => category.metrics);
  const minimum = round(
    metrics.reduce(
      (sum, m) =>
        sum +
        (m.scoreResolved ||
        (aggregateMode &&
          ((m.id === "commits" && snapshot.dailyCommits !== undefined) ||
            ["qualified", "sustained", "external"].includes(m.id)))
          ? m.points
          : 0),
      0,
    ),
  );
  const maximum = round(
    metrics.reduce(
      (sum, m) => sum + (m.scoreResolved ? m.points : m.maximum),
      0,
    ),
  );
  const bounds = {
    minimum: round(minimum + (role?.minimum ?? 0)),
    maximum: round(maximum + (role?.maximum ?? 0)),
    scoreResolved:
      minimum === maximum && (!role || role.minimum === role.maximum),
    rankResolved:
      rankScore(minimum + (role?.minimum ?? 0), config.rankThresholds).rank ===
      rankScore(maximum + (role?.maximum ?? 0), config.rankThresholds).rank,
  };
  const provisional = aggregateMode
    ? !bounds.scoreResolved
    : missingMetrics.length > 0 || limitations.length > 0;
  return {
    scoringVersion: config.version,
    evaluatedAt: snapshot.evaluatedAt,
    window: { from, to: snapshot.evaluatedAt },
    maximumScore: 100,
    ...rankScore(
      categories.reduce((sum, c) => sum + c.points, 0),
      config.rankThresholds,
    ),
    rankThresholds: [...config.rankThresholds],
    categories,
    adjustments: adjusted.adjustments,
    completeness: {
      status: !observed ? "insufficient" : provisional ? "partial" : "complete",
      missingMetrics,
      limitations,
    },
    provisional,
    bounds,
    ...(role && { collaboration: role }),
  };
}

export function scoreActivity(
  snapshot: RawActivitySnapshot,
  config = defaultConfig,
) {
  validateConfig(config);
  const normalized = normalize(snapshot);
  return calculate(normalized, adjust(normalized, config), config);
}
