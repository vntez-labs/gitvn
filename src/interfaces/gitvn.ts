import type { ProjectPermissions, ProjectRole } from "./jira";
export type { ProjectPermissions, ProjectRole };

export interface GitvnColumnConfig {
  id: string; // e.g. "backlog" | "todo" | "in_progress" | "review" | "done"
  title: string;
  color: string;
}

export interface GitvnDocItem {
  id: string;
  name: string;
  path: string;
  title: string;
  description?: string;
  content?: string;
  updatedAt?: string;
}

export interface GitvnStorageConfig {
  format: "decoupled" | "monolith";
  tasks_dir?: string;
  docs_dir?: string;
}

export interface GitvnConfig {
  version: string;
  name: string;
  description?: string;
  storage?: GitvnStorageConfig;
  modules: {
    kanban: boolean;
    docs: boolean;
  };
  kanban: {
    columns: GitvnColumnConfig[];
  };
  docs: {
    entry: string;
    files: string[];
  };
  permissions?: ProjectPermissions;
}

export interface GitvnRepoStatus {
  hasGitvn: boolean;
  hasConfig: boolean;
  hasTasks: boolean;
  hasDocs: boolean;
  config?: GitvnConfig;
  docs?: GitvnDocItem[];
  source: "github" | "local" | "none";
  isOutdated?: boolean;
  currentVersion?: string;
  latestVersion?: string;
  hasDecoupledTasks?: boolean;
  configFormat?: "yaml" | "json";
  reason?: string;
}
