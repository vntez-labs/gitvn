export type MergeMethod = "merge" | "squash" | "rebase";

export const mergeMethods: Record<MergeMethod, string> = {
  merge: "Create merge commit",
  squash: "Squash and merge",
  rebase: "Rebase and merge",
};

export interface PullCheck {
  id: string;
  name: string;
  source?: string;
  status: string;
  url?: string;
}

export interface PullChecks {
  items: PullCheck[];
  incomplete: boolean;
  sha: string;
  testMerge: boolean;
}

interface PullBranch {
  ref: string;
  label: string;
  sha: string;
}

export interface PullRequestDetails {
  number: number;
  title: string;
  state: string;
  draft: boolean;
  body: string | null;
  created_at: string;
  merged: boolean;
  mergeable: boolean | null;
  mergeable_state: string;
  merge_commit_sha: string | null;
  html_url: string;
  user: { login: string; avatar_url: string } | null;
  base: PullBranch;
  head: PullBranch;
  commits: number;
  changed_files: number;
  additions: number;
  deletions: number;
}

export interface PullCommit {
  sha: string;
  author: { avatar_url: string } | null;
  commit: { message: string; author: { name: string; date: string } };
}

export function pullRepositoryUrl(owner: unknown, repo: unknown) {
  const segment = /^[a-zA-Z0-9_.-]{1,100}$/;
  if (
    typeof owner !== "string" ||
    typeof repo !== "string" ||
    !segment.test(owner) ||
    !segment.test(repo) ||
    [".", ".."].includes(owner) ||
    [".", ".."].includes(repo)
  ) {
    return null;
  }
  return `https://api.github.com/repos/${owner}/${repo}`;
}
