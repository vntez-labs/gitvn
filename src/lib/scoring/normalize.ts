import type {
  ActivityEvent,
  Kind,
  RawActivitySnapshot,
  Repository,
} from "./models";

export const DAY = 86_400_000;
export const kinds: readonly Kind[] = ["commits", "pulls", "issues", "reviews"];

export function utcDay(timestamp: number) {
  return Math.floor(timestamp / DAY);
}

export function utcWeek(day: number) {
  // Unix day zero was Thursday. ISO weeks start Monday.
  return Math.floor((day + 3) / 7);
}

export class ScoringInputError extends Error {
  constructor(
    readonly code: "snapshot" | "event" | "repository" | "aggregate" | "config",
  ) {
    super(`Invalid scoring ${code}`);
    this.name = "ScoringInputError";
  }
}

export const count = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;

const validId = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0 && /^[!-~]+$/.test(value);

function validEvent(event: ActivityEvent, subject: string) {
  return (
    event &&
    kinds.includes(event.kind) &&
    validId(event.id) &&
    validId(event.repo) &&
    event.actor === subject &&
    Number.isSafeInteger(event.at) &&
    [
      event.bot,
      event.empty,
      event.projectEvidenceOnly,
      event.original,
      event.independentReview,
    ].every((flag) => flag === undefined || typeof flag === "boolean") &&
    [event.pr, event.prAuthor, event.merger, event.resolvedByPr].every(
      (id) => id === undefined || validId(id),
    ) &&
    (event.state === undefined ||
      ["OPEN", "CLOSED", "MERGED"].includes(event.state))
  );
}

export interface NormalizedActivity {
  snapshot: RawActivitySnapshot;
  from: number;
  lastDay: number;
  repositories: Map<string, Repository>;
  events: Map<string, ActivityEvent>;
  dailyCommits: Map<
    string,
    NonNullable<RawActivitySnapshot["dailyCommits"]>[number]
  >;
  duplicates: number;
}

/** Stable identity uses global node IDs and commit OIDs across renamed repositories. */
export function normalize(snapshot: RawActivitySnapshot): NormalizedActivity {
  if (
    !snapshot ||
    !Number.isSafeInteger(snapshot.evaluatedAt) ||
    Math.abs(snapshot.evaluatedAt) > 8_640_000_000_000_000 ||
    !validId(snapshot.subject) ||
    !Array.isArray(snapshot.repositories) ||
    !Array.isArray(snapshot.events) ||
    !snapshot.coverage ||
    typeof snapshot.coverage !== "object" ||
    Array.isArray(snapshot.coverage) ||
    Object.values(snapshot.coverage).some(
      (value) => !["complete", "partial", "unavailable"].includes(value),
    ) ||
    (snapshot.limitations !== undefined &&
      (!Array.isArray(snapshot.limitations) ||
        snapshot.limitations.some((entry) => typeof entry !== "string")))
  ) {
    throw new ScoringInputError("snapshot");
  }
  const lastDay = utcDay(snapshot.evaluatedAt);
  const from = (lastDay - 364) * DAY;
  const repositories = new Map<string, Repository>();
  for (const repo of snapshot.repositories) {
    if (
      !repo ||
      !validId(repo.id) ||
      repositories.has(repo.id) ||
      !["public", "private", "restricted"].includes(repo.visibility) ||
      typeof repo.owned !== "boolean" ||
      typeof repo.fork !== "boolean" ||
      (repo.archived !== undefined && typeof repo.archived !== "boolean")
    ) {
      throw new ScoringInputError("repository");
    }
    repositories.set(repo.id, repo);
  }
  const events = new Map<string, ActivityEvent>();
  let duplicates = 0;
  for (const event of snapshot.events) {
    if (!validEvent(event, snapshot.subject) || !repositories.has(event.repo)) {
      throw new ScoringInputError("event");
    }
    if (
      (event.projectEvidenceOnly && event.kind !== "commits") ||
      (event.kind === "commits" &&
        Boolean(event.projectEvidenceOnly) !==
          (snapshot.dailyCommits !== undefined))
    ) {
      throw new ScoringInputError("aggregate");
    }
    if (
      event.at < from ||
      event.at > snapshot.evaluatedAt ||
      repositories.get(event.repo)?.visibility !== "public"
    )
      continue;
    const key = `${event.kind}:${event.kind === "commits" ? event.id.toLowerCase() : event.id}`;
    const previous = events.get(key);
    if (previous) {
      duplicates++;
      // Duplicate observations of the same event must agree. A copied commit can
      // appear in multiple repos. Prefer explicitly original evidence, then stable ID.
      if (previous.repo === event.repo && !sameEvent(previous, event)) {
        throw new ScoringInputError("event");
      }
      if (previous.repo !== event.repo && event.kind !== "commits") {
        throw new ScoringInputError("event");
      }
      if (
        Number(Boolean(event.original)) < Number(Boolean(previous.original)) ||
        (Boolean(event.original) === Boolean(previous.original) &&
          event.repo >= previous.repo)
      )
        continue;
    }
    events.set(key, event);
  }
  const dailyCommits: NormalizedActivity["dailyCommits"] = new Map();
  if (
    snapshot.dailyCommits !== undefined &&
    !Array.isArray(snapshot.dailyCommits)
  ) {
    throw new ScoringInputError("aggregate");
  }
  for (const row of snapshot.dailyCommits ?? []) {
    const repo = row && repositories.get(row.repo);
    if (
      !repo ||
      !Number.isSafeInteger(row.day) ||
      !count(row.count) ||
      row.count > 2_147_483_647
    ) {
      throw new ScoringInputError("aggregate");
    }
    if (
      repo.visibility !== "public" ||
      row.day < lastDay - 364 ||
      row.day > lastDay
    )
      continue;
    const key = `${row.repo}:${row.day}`;
    const previous = dailyCommits.get(key);
    if (previous) {
      if (previous.count !== row.count)
        throw new ScoringInputError("aggregate");
      duplicates++;
    }
    dailyCommits.set(key, row);
  }
  return {
    snapshot,
    from,
    lastDay,
    repositories,
    events,
    dailyCommits,
    duplicates,
  };
}

function sameEvent(a: ActivityEvent, b: ActivityEvent) {
  return (
    a.at === b.at &&
    a.actor === b.actor &&
    a.bot === b.bot &&
    a.empty === b.empty &&
    a.projectEvidenceOnly === b.projectEvidenceOnly &&
    a.original === b.original &&
    a.pr === b.pr &&
    a.prAuthor === b.prAuthor &&
    a.state === b.state &&
    a.merger === b.merger &&
    a.independentReview === b.independentReview &&
    a.resolvedByPr === b.resolvedByPr
  );
}
