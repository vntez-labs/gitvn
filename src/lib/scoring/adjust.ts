import type {
  ActivityAdjustment,
  ActivityEvent,
  Availability,
  Config,
  Measurement,
  Metric,
} from "./models";
import { count, type NormalizedActivity, utcDay, utcWeek } from "./normalize";

export interface AdjustedActivity {
  reviewedAuthors: number;
  metrics: Partial<Record<Metric, Measurement>>;
  adjustments: ActivityAdjustment[];
}

type RepoActivity = {
  commits: number;
  days: Set<number>;
  weeks: Set<number>;
  merged: boolean;
};

export function adjust(
  normalized: NormalizedActivity,
  config: Config,
): AdjustedActivity {
  const { snapshot, repositories, events, dailyCommits, lastDay, duplicates } =
    normalized;
  const metrics: AdjustedActivity["metrics"] = {};
  const adjustments: ActivityAdjustment[] = [];
  const days = new Set<number>();
  const weeks = new Set<number>();
  const perRepo = new Map<string, RepoActivity>();
  const commitsByDay = new Map<number, number>();
  const reviewsByPr = new Map<string, ActivityEvent>();
  const raw = { commits: 0, pulls: 0, issues: 0, reviews: 0 };
  const accepted = { pulls: 0, issues: 0, reviews: 0 };
  let automated = 0;
  let empty = 0;
  let selfReviews = 0;
  let repeatReviews = 0;
  let merged = 0;
  let reviewed = 0;
  let linkedIssues = 0;

  function measure(id: Metric, original: number, adjusted = original) {
    const availability = snapshot.coverage[id] ?? "unavailable";
    if (availability !== "unavailable")
      metrics[id] = { raw: original, adjusted, availability };
  }

  function record(
    rule: string,
    original: number,
    adjusted: number,
    explanation: string,
    evidence: Record<string, number>,
    availability: Availability = "partial",
  ) {
    if (original === adjusted) return;
    adjustments.push({
      rule,
      original,
      adjusted,
      explanation,
      evidence,
      availability,
      weight: original ? adjusted / original : 0,
    });
  }

  function mark(
    repoId: string,
    day: number,
    commitCount: number,
    mergedPr: boolean,
    original: boolean,
  ) {
    const week = utcWeek(day);
    days.add(day);
    weeks.add(week);
    const repo = repositories.get(repoId);
    if (!repo || (repo.fork && !original)) return;
    let project = perRepo.get(repoId);
    if (!project) {
      project = {
        commits: 0,
        days: new Set(),
        weeks: new Set(),
        merged: false,
      };
      perRepo.set(repoId, project);
    }
    project.days.add(day);
    project.weeks.add(week);
    project.commits += commitCount;
    project.merged ||= mergedPr;
  }

  function commit(day: number, amount: number) {
    commitsByDay.set(day, (commitsByDay.get(day) ?? 0) + amount);
  }

  const verifiedEmptyByRepoDay = new Map<string, number>();
  for (const event of events.values()) {
    if (
      (config.version === "3.1.0" || config.version === "3.2.0") &&
      event.projectEvidenceOnly
    )
      continue;
    if (!event.projectEvidenceOnly) raw[event.kind]++;
    if (event.bot) {
      automated++;
      continue;
    }
    const day = utcDay(event.at);
    switch (event.kind) {
      case "commits":
        if (event.empty) {
          if (event.projectEvidenceOnly) {
            const key = `${event.repo}:${day}`;
            verifiedEmptyByRepoDay.set(
              key,
              (verifiedEmptyByRepoDay.get(key) ?? 0) + 1,
            );
          } else {
            empty++;
          }
          continue;
        }
        if (!event.projectEvidenceOnly) commit(day, 1);
        mark(event.repo, day, 1, false, event.original === true);
        break;
      case "reviews": {
        if (event.prAuthor === snapshot.subject) {
          selfReviews++;
          continue;
        }
        // Require a stable PR ID to cap repeated credit.
        if (!event.pr) continue;
        const previous = reviewsByPr.get(event.pr);
        if (previous) repeatReviews++;
        if (
          !previous ||
          event.at < previous.at ||
          (event.at === previous.at && event.id < previous.id)
        )
          reviewsByPr.set(event.pr, event);
        break;
      }
      case "pulls":
        accepted.pulls++;
        if (event.state === "MERGED") {
          if (event.merger && event.merger !== snapshot.subject) merged++;
        }
        if (event.independentReview) reviewed++;
        mark(
          event.repo,
          day,
          0,
          event.state === "MERGED",
          event.original === true,
        );
        break;
      case "issues":
        accepted.issues++;
        if (event.resolvedByPr) linkedIssues++;
        mark(event.repo, day, 0, false, event.original === true);
        break;
    }
  }

  let otherReviews = 0;
  const reviewedAuthors = new Set<string>();
  for (const event of reviewsByPr.values()) {
    accepted.reviews++;
    if (event.prAuthor) {
      otherReviews++;
      reviewedAuthors.add(event.prAuthor);
    }
    mark(event.repo, utcDay(event.at), 0, false, event.original === true);
  }
  for (const [key, row] of dailyCommits) {
    if (!row.count) continue;
    raw.commits += row.count;
    const excluded = Math.min(row.count, verifiedEmptyByRepoDay.get(key) ?? 0);
    empty += excluded;
    commit(row.day, row.count - excluded);
    // Daily totals establish dates, while verified OIDs establish distinct commits.
    mark(
      row.repo,
      row.day,
      config.version === "3.1.0" || config.version === "3.2.0"
        ? row.count - excluded
        : 0,
      false,
      false,
    );
  }

  const [first, next, middleWeight, tailWeight] = config.burst;
  let weightedCommits = 0;
  let eligibleCommits = 0;
  let burstDays = 0;
  for (let day = lastDay - 364; day <= lastDay; day++) {
    const n = commitsByDay.get(day) ?? 0;
    eligibleCommits += n;
    if (n > first) burstDays++;
    weightedCommits +=
      Math.min(n, first) +
      Math.min(Math.max(n - first, 0), next) * middleWeight +
      Math.max(n - first - next, 0) * tailWeight;
  }

  const [minimumCommits, minimumDays, sustainedWeeks] = config.qualification;
  let qualified = 0;
  let sustained = 0;
  let external = 0;
  for (const [id, repo] of perRepo) {
    if (
      repo.merged ||
      (repo.commits >= minimumCommits && repo.days.size >= minimumDays)
    ) {
      qualified++;
      if (repo.weeks.size >= sustainedWeeks) sustained++;
      if (repositories.get(id)?.owned === false) external++;
    }
  }

  if (
    (config.version === "3.1.0" || config.version === "3.2.0") &&
    snapshot.calendarDays
  ) {
    days.clear();
    weeks.clear();
    for (const day of snapshot.calendarDays) {
      if (!Number.isSafeInteger(day) || day < lastDay - 364 || day > lastDay)
        continue;
      days.add(day);
      weeks.add(utcWeek(day));
    }
  }

  let streak = 0;
  let longest = 0;
  for (let day = lastDay - 364; day <= lastDay; day++) {
    streak = days.has(day) ? streak + 1 : 0;
    longest = Math.max(longest, streak);
  }

  for (const id of ["stars", "followers", "forks", "releases"] as const) {
    const value = snapshot.impact?.[id];
    if (count(value)) measure(id, value);
  }
  measure("commits", raw.commits, weightedCommits);
  measure("pulls", raw.pulls, accepted.pulls);
  measure("issues", raw.issues, accepted.issues);
  measure("reviews", raw.reviews, accepted.reviews);
  measure("activeWeeks", weeks.size);
  measure("activeDays", days.size);
  measure("streak", longest);
  measure("qualified", perRepo.size, qualified);
  measure("sustained", sustained);
  measure("external", external);
  measure("merged", merged);
  measure("reviewed", reviewed);
  measure("otherReviews", otherReviews);
  measure("linkedIssues", linkedIssues);

  record(
    "duplicate-events",
    events.size + dailyCommits.size + duplicates,
    events.size + dailyCommits.size,
    "Gộp các bản ghi trùng theo định danh ổn định.",
    { duplicates },
  );
  record(
    "automated-actors",
    automated,
    0,
    "Loại hoạt động của bot đã xác định.",
    { automated },
  );
  record(
    "confirmed-empty-commits",
    empty,
    0,
    "Loại commit được xác nhận không có thay đổi.",
    { empty },
  );
  record(
    "daily-commit-burst",
    eligibleCommits,
    weightedCommits,
    "Giảm trọng số cho phần commit vượt ngưỡng trong cùng ngày UTC.",
    { burstDays },
    snapshot.coverage.commits ?? "unavailable",
  );
  record(
    "review-per-pr",
    raw.reviews,
    raw.reviews - selfReviews - repeatReviews,
    "Giới hạn một lượt đánh giá mỗi PR và bỏ qua tự đánh giá.",
    { selfReviews, repeatReviews },
    snapshot.coverage.reviews ?? "unavailable",
  );
  record(
    "repository-qualification",
    perRepo.size,
    qualified,
    "Dự án cần đủ commit và ngày hoạt động hoặc có PR đã hợp nhất.",
    { minimumCommits, minimumDays },
    snapshot.coverage.qualified ?? "unavailable",
  );
  return { metrics, adjustments, reviewedAuthors: reviewedAuthors.size };
}
