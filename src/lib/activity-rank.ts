import type { ContributionWeek } from "@/interfaces/profile-insights";

export interface ActivityRankTier {
  name: string;
  minScore: number;
  color: string;
  badge: string;
  description: string;
}

export const activityRanks: readonly ActivityRankTier[] = [
  {
    name: "Người mới",
    minScore: 0,
    color: "#64748b",
    badge: "nguoi-moi",
    description: "Khởi đầu hành trình đóng góp mã nguồn.",
  },
  {
    name: "Tập sự",
    minScore: 15,
    color: "#9a5b37",
    badge: "tap-su",
    description: "Đã hình thành thói quen commit và đóng góp cơ bản.",
  },
  {
    name: "Chiến binh",
    minScore: 30,
    color: "#0f766e",
    badge: "chien-binh",
    description: "Đóng góp đều đặn, tham gia giải quyết nhiều tác vụ.",
  },
  {
    name: "Cao thủ",
    minScore: 50,
    color: "#b7791f",
    badge: "cao-thu",
    description: "Chuyên cần bền bỉ, tạo giá trị thực tế trên nhiều dự án.",
  },
  {
    name: "Huyền thoại",
    minScore: 70,
    color: "#7c3aed",
    badge: "huyen-thoai",
    description: "Đóng góp xuất sắc cả chiều sâu, tần suất và phối hợp.",
  },
  {
    name: "Chúa tể mã nguồn",
    minScore: 90,
    color: "#6d28d9",
    badge: "chua-te",
    description:
      "Đỉnh cao cống hiến mã nguồn với sức bền và tầm ảnh hưởng lớn.",
  },
] as const;

export interface GetActivityRankOptions {
  weeks: ContributionWeek[];
  contributions: number;
  repositories: number;
  currentStreak?: number;
  longestStreak?: number;
  activeDays?: number;
  pulls?: number;
  reviews?: number;
  issues?: number;
  commits?: number;
}

const MAX_CONTRIBUTIONS_FOR_SCORE = 500;
const MAX_CONSISTENT_WEEKS = 44; // 44/52 tuần (~85%) là đủ điểm tối đa (cho phép nghỉ ngơi/lễ tết hợp lý)
const MAX_STREAK_DAYS = 30;

export function getActivityRank({
  weeks,
  contributions,
  repositories,
  currentStreak = 0,
  longestStreak = 0,
  pulls = 0,
  reviews = 0,
  issues = 0,
}: GetActivityRankOptions) {
  const activeWeeks = weeks.filter((week) =>
    week.contributionDays.some((day) => day.contributionCount > 0),
  ).length;

  // 1. Khối lượng & Tác động (Activity & Impact) - Tối đa 35 điểm
  // Base đóng góp (tối đa 25 điểm trên 500 contributions)
  const baseContributions =
    (Math.min(contributions, MAX_CONTRIBUTIONS_FOR_SCORE) /
      MAX_CONTRIBUTIONS_FOR_SCORE) *
    25;

  // Thưởng chất lượng phối hợp kỹ thuật (PRs x2, Reviews x2, Issues x1 - tối đa 10 điểm)
  const collaborationVolume = pulls * 2 + reviews * 2 + issues;
  const collaborationBonus = (Math.min(collaborationVolume, 40) / 40) * 10;

  const activityPoints = Math.min(
    35,
    collaborationVolume > 0
      ? baseContributions + collaborationBonus
      : (Math.min(contributions, MAX_CONTRIBUTIONS_FOR_SCORE) /
          MAX_CONTRIBUTIONS_FOR_SCORE) *
          35,
  );

  // 2. Độ chuyên cần theo tuần (Consistency) - Tối đa 30 điểm
  // Đạt 44/52 tuần (~85% số tuần trong năm) là đạt trọn 30 điểm
  const consistencyPoints =
    (Math.min(activeWeeks, MAX_CONSISTENT_WEEKS) / MAX_CONSISTENT_WEEKS) * 30;

  // 3. Độ phủ & Chiều sâu dự án (Repositories) - Tối đa 20 điểm
  // Đánh giá lũy tiến công bằng: 1 repo = 8đ, 2 repo = 13đ, 3 repo = 17đ, >= 4 repo = 20đ
  let repoPoints = 0;
  if (repositories >= 4) repoPoints = 20;
  else if (repositories === 3) repoPoints = 17;
  else if (repositories === 2) repoPoints = 13;
  else if (repositories === 1) repoPoints = 8;

  // 4. Kỷ luật & Phong độ (Streak & Discipline) - Tối đa 15 điểm
  // Kỷ lục chuỗi trong năm (tối đa 10 điểm) - bảo vệ thành quả cả năm, không bị mất trắng khi nghỉ 1 ngày
  const recordStreak = Math.max(longestStreak, currentStreak);
  const recordStreakPoints =
    (Math.min(recordStreak, MAX_STREAK_DAYS) / MAX_STREAK_DAYS) * 10;
  // Phong độ duy trì gần đây (tối đa 5 điểm)
  const recentStreakPoints = (Math.min(currentStreak, 15) / 15) * 5;
  const streakPoints = Math.min(15, recordStreakPoints + recentStreakPoints);

  // Tổng điểm trên thang 100
  const rawScore =
    activityPoints + consistencyPoints + repoPoints + streakPoints;
  const score = Math.min(100, Math.round(rawScore * 10) / 10);

  const index = activityRanks.findLastIndex((rank) => rank.minScore <= score);
  const rank = activityRanks[Math.max(0, index)];
  const next = activityRanks[index + 1];

  return {
    activeWeeks,
    contributions,
    repositories,
    currentStreak,
    longestStreak: recordStreak,
    activityPoints,
    consistencyPoints,
    repoPoints,
    streakPoints,
    score,
    rank,
    next,
    ranks: activityRanks,
  };
}
