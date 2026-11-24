import type defaults from "./defaults.json";
import type roleDefaults from "./role-defaults.json";

export type Category = keyof typeof defaults.categories;
type Keys<T> = T extends T ? keyof T : never;
export type Metric = Keys<(typeof defaults.categories)[Category]>;
export type Kind = "commits" | "pulls" | "issues" | "reviews";
export type Availability = "complete" | "partial" | "unavailable";
export type Visibility = "public" | "private" | "restricted";
export type Scale = "log" | "linear" | "piecewise";
export type Settings = readonly [
  maximum: number,
  threshold: number,
  scale: Scale,
];

export interface Config {
  version: string;
  role?: Record<RoleMetricId, Settings>;
  rankThresholds: readonly number[];
  burst: readonly [
    first: number,
    next: number,
    nextWeight: number,
    tailWeight: number,
  ];
  qualification: readonly [
    commits: number,
    days: number,
    sustainedWeeks: number,
  ];
  categories: {
    [C in Category]: { [M in keyof (typeof defaults.categories)[C]]: Settings };
  };
}

export interface Repository {
  id: string;
  visibility: Visibility;
  owned: boolean;
  fork: boolean;
  archived?: boolean;
}

export interface ActivityEvent {
  kind: Kind;
  id: string;
  /** Unix milliseconds. Commit IDs are lowercase object hashes. */
  at: number;
  actor: string;
  repo: string;
  bot?: boolean;
  empty?: boolean;
  /** Verified commit identity used for project qualification only while volume uses daily totals. */
  projectEvidenceOnly?: boolean;
  original?: boolean;
  pr?: string;
  prAuthor?: string;
  state?: "OPEN" | "CLOSED" | "MERGED";
  merger?: string;
  independentReview?: boolean;
  resolvedByPr?: string;
}

export interface DailyCommitBucket {
  day: number;
  repo: string;
  count: number;
}

export type RoleMetricId = keyof typeof roleDefaults;

export interface IntegrationEvidence {
  id: string;
  repo: string;
  /** Only confirmed GitHub User actors are represented by IDs. */
  author?: string;
  merger?: string;
  mergedAt: number;
  issues?: { id: string; author: string; closedAt: number }[];
}

export interface CollaborationEvidence {
  integrations: IntegrationEvidence[];
  maintainer: Availability;
  issues: Availability;
  sources: string[];
}

export interface RoleMetric extends Measurement {
  id: RoleMetricId;
  points: number;
  maximum: number;
  threshold: number;
  scale: Scale;
  scoreResolved: boolean;
}

export interface RoleComponent {
  points: number;
  minimum: number;
  maximum: number;
  ceiling: number;
  metrics: RoleMetric[];
}

export interface CollaborationScore {
  review: RoleComponent;
  contributor: RoleComponent;
  maintainer: RoleComponent;
  issues: RoleComponent;
  sharedRole: { points: number; minimum: number; maximum: number };
  points: number;
  minimum: number;
  maximum: number;
  missing: RoleMetricId[];
  sources: string[];
}

export interface RawActivitySnapshot {
  collaboration?: CollaborationEvidence;
  /** GitHub-visible calendar dates, as UTC date ordinals. */
  calendarDays?: number[];
  evaluatedAt: number;
  subject: string;
  repositories: Repository[];
  events: ActivityEvent[];
  coverage: Partial<Record<Metric, Availability>>;
  impact?: Partial<
    Record<"stars" | "followers" | "forks" | "releases", number>
  >;
  /** Mutually exclusive with detailed volume commits. These rows are never activity events. */
  dailyCommits?: DailyCommitBucket[];
  limitations?: string[];
}

export interface Measurement {
  raw: number | null;
  adjusted: number | null;
  availability: Availability;
}

export interface ActivityAdjustment {
  rule: string;
  original: number;
  adjusted: number;
  weight: number;
  explanation: string;
  availability: Availability;
  evidence: Record<string, number>;
}

export interface MetricScore extends Measurement {
  id: Metric;
  points: number;
  scoreResolved: boolean;
  maximum: number;
  threshold: number;
  scale: Scale;
  window: "lifetime" | "365-days";
  source: string;
  explanation: string;
}

export interface ScoreResult {
  scoringVersion: string;
  evaluatedAt: number;
  window: { from: number; to: number };
  totalScore: number;
  maximumScore: number;
  rank: number;
  nextRank: number | null;
  rankThresholds: readonly number[];
  pointsToNextRank: number;
  categories: {
    id: Category;
    points: number;
    maximum: number;
    metrics: MetricScore[];
  }[];
  adjustments: ActivityAdjustment[];
  completeness: {
    status: "complete" | "partial" | "insufficient";
    missingMetrics: (Metric | RoleMetricId)[];
    limitations: string[];
  };
  provisional: boolean;
  collaboration?: CollaborationScore;
  bounds: {
    minimum: number;
    maximum: number;
    scoreResolved: boolean;
    rankResolved: boolean;
  };
  collection?: {
    version: string;
    restricted?: boolean;
    status: "complete" | "partial" | "restricted" | "stale" | "unavailable";
  };
}
