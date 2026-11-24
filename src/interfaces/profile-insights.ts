import type { ScoreResult } from "@/lib/scoring/models";

export interface ContributionDay {
  date: string;
  contributionCount: number;
  contributionLevel: string;
  weekday: number;
}

export interface ContributionWeek {
  contributionDays: ContributionDay[];
}

export interface ProfileRepository {
  nameWithOwner: string;
  description: string | null;
  url: string;
  stargazerCount: number;
  forkCount: number;
  primaryLanguage: { name: string; color: string | null } | null;
}

export interface ProfileInsights {
  score?: ScoreResult;
  user: {
    name: string | null;
    login: string;
    avatarUrl: string;
    bio: string | null;
    email: string | null;
    pronouns: string | null;
    socialAccounts?: { nodes: { displayName: string; url: string }[] };
    company: string | null;
    location: string | null;
    websiteUrl: string | null;
    createdAt: string;
    url: string;
    followers: { totalCount: number };
    following: { totalCount: number };
  };
  activity: {
    from: string;
    through: string;
    weeks: ContributionWeek[];
    total: number;
    commits: number;
    pulls: number;
    issues: number;
    reviews: number;
    activeDays: number;
    activeRepositories: number;
    currentStreak: number;
    longestStreak: number;
    recent30: number;
    previous30: number;
    stars: number;
    releases: number;
    forks: number;
  } | null;
  codeChanges: {
    additions: number;
    deletions: number;
    commits: number;
    repositories: number;
    partial: boolean;
  } | null;
  pinnedRepositories: ProfileRepository[] | null;
  isOwnProfile: boolean;
  organizations: { login: string; avatar_url: string }[];
  isPro: boolean;
  achievements: { name: string; iconUrl: string; tier?: string }[];
  readme: string | null;
}
