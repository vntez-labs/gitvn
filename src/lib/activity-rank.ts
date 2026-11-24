import type { ContributionWeek } from "@/interfaces/profile-insights";

export const activityRanks = [
  { name: "Người mới", minScore: 0, color: "#64748b", badge: "nguoi-moi" },
  { name: "Tập sự", minScore: 100, color: "#9a5b37", badge: "tap-su" },
  { name: "Chiến binh", minScore: 400, color: "#0f766e", badge: "chien-binh" },
  { name: "Cao thủ", minScore: 1_000, color: "#b7791f", badge: "cao-thu" },
  { name: "Huyền thoại", minScore: 2_000, color: "#7c3aed", badge: "huyen-thoai" },
  { name: "Chúa tể mã nguồn", minScore: 4_000, color: "#6d28d9", badge: "chua-te" },
] as const;

export function getActivityRank({
  weeks,
  contributions,
  repositories,
  currentStreak,
}: {
  weeks: ContributionWeek[];
  contributions: number;
  repositories: number;
  currentStreak: number;
}) {
  const activeWeeks = weeks.filter((week) =>
    week.contributionDays.some((day) => day.contributionCount > 0),
  ).length;
  const repoPoints = Math.min(repositories, 12) * 25;
  const streakPoints = currentStreak * 3;
  const score = contributions + repoPoints + streakPoints;
  const index = activityRanks.findLastIndex((rank) => rank.minScore <= score);
  const rank = activityRanks[index];
  const next = activityRanks[index + 1];
  return { activeWeeks, contributions, repositories, currentStreak, repoPoints, streakPoints, score, rank, next, ranks: activityRanks };
}
