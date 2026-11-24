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
    description: "Có sản phẩm và đóng góp giá trị cho cộng đồng.",
  },
  {
    name: "Chúa tể mã nguồn",
    minScore: 90,
    color: "#6d28d9",
    badge: "chua-te",
    description:
      "Đỉnh cao cống hiến mã nguồn với sức bền và tầm ảnh hưởng xã hội lớn.",
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
  stars?: number;
  releases?: number;
  forks?: number;
  followers?: number;
}

const MAX_CONTRIBUTIONS_FOR_SCORE = 500;
const MAX_CONSISTENT_WEEKS = 44; // 44/52 tuần (~85%) là đủ điểm tối đa
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
  stars = 0,
  releases = 0,
  followers = 0,
}: GetActivityRankOptions) {
  const activeWeeks = weeks.filter((week) =>
    week.contributionDays.some((day) => day.contributionCount > 0),
  ).length;

  // 1. TÁC ĐỘNG XÃ HỘI & ĐÓNG GÓP CỘNG ĐỒNG (Community & Social Impact) - Tối đa 30 điểm
  // a) Stars nhận được (tối đa 12 điểm)
  let starPoints = 0;
  if (stars >= 50) starPoints = 12;
  else if (stars >= 20) starPoints = 9;
  else if (stars >= 5) starPoints = 6;
  else if (stars >= 1) starPoints = 3;

  // b) Releases phần mềm chính thức (tối đa 10 điểm)
  let releasePoints = 0;
  if (releases >= 5) releasePoints = 10;
  else if (releases >= 2) releasePoints = 7;
  else if (releases >= 1) releasePoints = 4;

  // c) Followers uy tín cộng đồng (tối đa 8 điểm)
  let followerPoints = 0;
  if (followers >= 20) followerPoints = 8;
  else if (followers >= 5) followerPoints = 6;
  else if (followers >= 1) followerPoints = 3;

  const impactPoints = starPoints + releasePoints + followerPoints;

  // 2. NĂNG SUẤT & KHỐI LƯỢNG ĐÓNG GÓP (Productivity) - Tối đa 30 điểm
  // Base đóng góp (tối đa 20 điểm trên 500 contributions)
  const baseContributions =
    (Math.min(contributions, MAX_CONTRIBUTIONS_FOR_SCORE) /
      MAX_CONTRIBUTIONS_FOR_SCORE) *
    20;

  // Thưởng chất lượng tương tác (PRs x2, Reviews x2, Issues x1 - tối đa 10 điểm)
  const collaborationVolume = pulls * 2 + reviews * 2 + issues;
  const collaborationBonus = (Math.min(collaborationVolume, 40) / 40) * 10;

  const activityPoints = Math.min(
    30,
    collaborationVolume > 0
      ? baseContributions + collaborationBonus
      : (Math.min(contributions, MAX_CONTRIBUTIONS_FOR_SCORE) /
          MAX_CONTRIBUTIONS_FOR_SCORE) *
          30,
  );

  // 3. ĐỘ CHUYÊN CẦN & KỶ LUẬT (Consistency & Cadence) - Tối đa 25 điểm
  // Độ đều các tuần (tối đa 15 điểm, 44/52 tuần là trọn điểm)
  const weekPoints =
    (Math.min(activeWeeks, MAX_CONSISTENT_WEEKS) / MAX_CONSISTENT_WEEKS) * 15;
  // Kỷ lục chuỗi bền bỉ trong năm (tối đa 10 điểm)
  const recordStreak = Math.max(longestStreak, currentStreak);
  const streakPoints =
    (Math.min(recordStreak, MAX_STREAK_DAYS) / MAX_STREAK_DAYS) * 10;
  const consistencyPoints = weekPoints + streakPoints;

  // 4. ĐỘ PHỦ DỰ ÁN (Project Scope) - Tối đa 15 điểm
  let repoPoints = 0;
  if (repositories >= 6) repoPoints = 15;
  else if (repositories >= 4) repoPoints = 13;
  else if (repositories === 3) repoPoints = 11;
  else if (repositories === 2) repoPoints = 8;
  else if (repositories === 1) repoPoints = 5;

  // TỔNG ĐIỂM: 30 + 30 + 25 + 15 = 100 điểm
  const rawScore =
    impactPoints + activityPoints + consistencyPoints + repoPoints;
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
    impactPoints,
    activityPoints,
    consistencyPoints,
    repoPoints,
    score,
    rank,
    next,
    ranks: activityRanks,
    stars,
    releases,
    followers,
  };
}
