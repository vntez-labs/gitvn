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
  const throughDate = through.slice(0, 10);
  const today = Date.parse(`${throughDate}T00:00:00Z`);
  const start = today - 364 * dayMs;
  let activeDays = 0;
  let longestStreak = 0;
  let streak = 0;
  let lastActiveDate: number | null = null;
  let recent30 = 0;
  let previous30 = 0;
  let total = 0;
  const activeDates = new Set<number>();

  for (const day of days) {
    const date = Date.parse(`${day.date}T00:00:00Z`);
    if (date < start || date > today) continue;
    const distance = (today - date) / dayMs;
    const count = day.contributionCount;
    total += count;
    if (distance >= 1 && distance <= 30) recent30 += count;
    if (distance >= 31 && distance <= 60) previous30 += count;
    if (count > 0) {
      activeDays++;
      activeDates.add(date);
      streak =
        lastActiveDate !== null && date - lastActiveDate === dayMs
          ? streak + 1
          : 1;
      lastActiveDate = date;
      longestStreak = Math.max(longestStreak, streak);
    }
  }

  const streakAnchor =
    lastActiveDate !== null && today - lastActiveDate <= dayMs
      ? lastActiveDate
      : null;
  let currentStreak = 0;
  if (streakAnchor !== null) {
    for (let date = streakAnchor; activeDates.has(date); date -= dayMs) {
      currentStreak++;
    }
  }

  return {
    total,
    activeDays,
    longestStreak,
    currentStreak,
    recent30,
    previous30,
  };
}
