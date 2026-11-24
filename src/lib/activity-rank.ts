import type { ContributionWeek } from "@/interfaces/profile-insights";

export interface ActivityRankTier {
  name: string;
  minScore: number;
  color: string;
  gradient: string;
  badge: string;
  description: string;
}

export const activityRanks: readonly ActivityRankTier[] = [
  {
    name: "Người mới",
    minScore: 0,
    color: "#64748b",
    gradient: "linear-gradient(135deg, #94a3b8 0%, #64748b 50%, #475569 100%)",
    badge: "nguoi-moi",
    description: "Khởi đầu hành trình đóng góp mã nguồn.",
  },
  {
    name: "Tập sự",
    minScore: 15,
    color: "#b45309",
    gradient: "linear-gradient(135deg, #d97706 0%, #b45309 50%, #78350f 100%)",
    badge: "tap-su",
    description: "Đã hình thành thói quen commit và đóng góp cơ bản.",
  },
  {
    name: "Chiến binh",
    minScore: 30,
    color: "#0d9488",
    gradient: "linear-gradient(135deg, #2dd4bf 0%, #0d9488 50%, #0f766e 100%)",
    badge: "chien-binh",
    description: "Đóng góp đều đặn, tham gia giải quyết nhiều tác vụ.",
  },
  {
    name: "Cao thủ",
    minScore: 50,
    color: "#d97706",
    gradient: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 45%, #d97706 100%)",
    badge: "cao-thu",
    description: "Chuyên cần bền bỉ, tạo giá trị thực tế trên nhiều dự án.",
  },
  {
    name: "Huyền thoại",
    minScore: 70,
    color: "#7c3aed",
    gradient: "linear-gradient(135deg, #c084fc 0%, #8b5cf6 50%, #6d28d9 100%)",
    badge: "huyen-thoai",
    description: "Có sản phẩm và đóng góp giá trị cho cộng đồng.",
  },
  {
    name: "Chúa tể mã nguồn",
    minScore: 85,
    color: "#6d28d9",
    gradient: "linear-gradient(135deg, #a855f7 0%, #7c3aed 50%, #581c87 100%)",
    badge: "chua-te",
    description:
      "Đỉnh cao cống hiến mã nguồn với sức bền và tầm ảnh hưởng xã hội lớn.",
  },
  {
    name: "Chiến thần",
    minScore: 92,
    color: "#ef4444",
    gradient: "linear-gradient(135deg, #f87171 0%, #ef4444 50%, #b91c1c 100%)",
    badge: "chien-than",
    description:
      "Cấp bậc vinh danh tối cao, biểu tượng nhiệt huyết rực lửa và cống hiến vĩ đại.",
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

const MAX_CONTRIBUTIONS_FOR_SCORE = 2000;
const MAX_COLLABORATION_VOLUME = 120;
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
  // Base đóng góp (tối đa 20 điểm trên mục tiêu 2.000 contributions)
  const baseContributions =
    (Math.min(contributions, MAX_CONTRIBUTIONS_FOR_SCORE) /
      MAX_CONTRIBUTIONS_FOR_SCORE) *
    20;

  // Thưởng chất lượng tương tác (PRs x2, Reviews x2, Issues x1 - tối đa 10 điểm trên mục tiêu 120 volume)
  const collaborationVolume = pulls * 2 + reviews * 2 + issues;
  const collaborationBonus =
    (Math.min(collaborationVolume, MAX_COLLABORATION_VOLUME) /
      MAX_COLLABORATION_VOLUME) *
    10;

  // Cần vừa có số lượng đóng góp lớn (mục tiêu 2.000) vừa có cộng tác (PR/Review) để đạt trọn vẹn 30đ
  const activityPoints = Math.min(
    30,
    Math.round((baseContributions + collaborationBonus) * 10) / 10,
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
  // Nâng mức chuẩn: lũy tiến đến 20 repo để đạt tối đa 15 điểm
  let repoPoints = 0;
  if (repositories >= 20) repoPoints = 15;
  else if (repositories >= 16) repoPoints = 14;
  else if (repositories >= 12) repoPoints = 12;
  else if (repositories >= 8) repoPoints = 10;
  else if (repositories >= 5) repoPoints = 8;
  else if (repositories >= 3) repoPoints = 6;
  else if (repositories >= 2) repoPoints = 4;
  else if (repositories === 1) repoPoints = 2;

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

export function resolveUserRank({
  scoreV3,
  weeks,
  contributions,
  repositories,
  currentStreak,
  longestStreak,
  pulls,
  reviews,
  issues,
  commits,
  stars,
  releases,
  forks,
  followers,
}: Partial<GetActivityRankOptions> & {
  scoreV3?: {
    totalScore: number;
    rank?: number | null;
    rankThresholds: readonly number[] | number[];
  } | null;
}): ActivityRankTier {
  if (scoreV3) {
    const ranks = activityRanks.map((tier, index) => ({
      ...tier,
      minScore: scoreV3.rankThresholds[index] ?? tier.minScore,
    }));
    const score = scoreV3.totalScore ?? 0;
    const rankIndex =
      scoreV3.rank ?? ranks.findLastIndex((tier) => tier.minScore <= score);
    return ranks[Math.max(0, rankIndex)];
  }
  if (weeks) {
    return getActivityRank({
      weeks,
      contributions: contributions ?? 0,
      repositories: repositories ?? 0,
      currentStreak: currentStreak ?? 0,
      longestStreak: longestStreak ?? 0,
      pulls: pulls ?? 0,
      reviews: reviews ?? 0,
      issues: issues ?? 0,
      commits: commits ?? 0,
      stars: stars ?? 0,
      releases: releases ?? 0,
      forks: forks ?? 0,
      followers: followers ?? 0,
    }).rank;
  }
  return activityRanks[0];
}
