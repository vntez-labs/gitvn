export interface CommitWeek {
  week: number;
  total: number;
}

export interface RepoContributor {
  login: string;
  name: string;
  avatarUrl: string;
  commits: number;
  additions: number;
  deletions: number;
}

export interface RepoPulse {
  pulls: { total: number; open: number; merged: number; closed: number };
  issues: { total: number; open: number; closed: number };
}

export interface RepoOverviewStats {
  activity: CommitWeek[] | null;
  totalCommits?: number;
  contributors: RepoContributor[] | null;
  sampledCommits: number;
  pulse: RepoPulse | null;
}
