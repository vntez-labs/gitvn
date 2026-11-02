import axios from "axios";
import type { GitvnConfig } from "@/interfaces/gitvn";
import type { JiraBoardData, TaskAssignee } from "@/interfaces/jira";

export interface BoardFetchResult {
  data: JiraBoardData;
  syncedToGitHub: boolean;
  hasGitvn: boolean;
  config?: GitvnConfig;
  members: TaskAssignee[];
}

export const jiraService = {
  async fetchBoardData(
    owner: string,
    repo: string,
    branch: string,
  ): Promise<BoardFetchResult> {
    const [jiraRes, gitvnRes, collabRes] = await Promise.all([
      axios.get(`/api/jira?owner=${owner}&repo=${repo}`),
      axios.get(
        `/api/gitvn?owner=${owner}&repo=${repo}&branch=${encodeURIComponent(branch)}`,
      ),
      axios
        .get(`/api/github/collaborators?owner=${owner}&repo=${repo}`)
        .catch(() => ({ data: { members: [] } })),
    ]);

    return {
      data: jiraRes.data.data,
      syncedToGitHub: Boolean(jiraRes.data.syncedToGitHub),
      hasGitvn: Boolean(gitvnRes.data.hasGitvn),
      config: gitvnRes.data.config,
      members: collabRes?.data?.members || [],
    };
  },

  async saveBoardData(
    owner: string,
    repo: string,
    branch: string,
    data: JiraBoardData,
    syncToGitHub = true,
  ) {
    return axios.post("/api/jira", {
      owner,
      repo,
      branch,
      data,
      syncToGitHub,
    });
  },

  async initializeGitvn(owner: string, repo: string, branch: string) {
    return axios.post("/api/gitvn", {
      owner,
      repo,
      branch,
      action: "init",
    });
  },

  async saveConfig(
    owner: string,
    repo: string,
    branch: string,
    config: GitvnConfig,
  ) {
    return axios.post("/api/gitvn", {
      owner,
      repo,
      branch,
      action: "saveConfig",
      config,
    });
  },
};
