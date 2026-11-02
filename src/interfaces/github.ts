export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name: string | null;
  html_url: string;
}

export interface GitHubOrg {
  login: string;
  id: number;
  avatar_url: string;
  description: string | null;
  isUser?: boolean;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  clone_url?: string;
  stargazers_count?: number;
  forks_count?: number;
  language?: string | null;
  default_branch?: string;
  owner: {
    login: string;
    avatar_url: string;
  };
}
