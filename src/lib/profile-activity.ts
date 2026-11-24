import type { ContributionWeek } from "@/interfaces/profile-insights";

const dayMs = 86_400_000;

export function contributionRange(now: Date) {
  const today = Date.parse(`${now.toISOString().slice(0, 10)}T00:00:00Z`);
  return {
    from: new Date(today - 364 * dayMs).toISOString(),
    to: now.toISOString(),
  };
}

export function summarizeActivity(weeks: ContributionWeek[], through: string) {
  const days = weeks
    .flatMap((week) => week.contributionDays)
    .toSorted((a, b) => a.date.localeCompare(b.date));
  const today = Date.parse(through);
  let activeDays = 0;
  let longestStreak = 0;
  let streak = 0;
  let lastActiveDate = 0;
  let recent30 = 0;
  let previous30 = 0;
  let total = 0;

  for (const day of days) {
    const date = Date.parse(day.date);
    const distance = (today - date) / dayMs;
    if (distance < 0 || distance > 364) continue;
    const count = day.contributionCount;
    total += count;
    if (distance >= 1 && distance <= 30) recent30 += count;
    if (distance >= 31 && distance <= 60) previous30 += count;
    if (count > 0) {
      activeDays++;
      streak = date - lastActiveDate === dayMs ? streak + 1 : 1;
      lastActiveDate = date;
      longestStreak = Math.max(longestStreak, streak);
    }
  }

  return {
    total,
    activeDays,
    longestStreak,
    currentStreak: today - lastActiveDate <= dayMs ? streak : 0,
    recent30,
    previous30,
  };
}
