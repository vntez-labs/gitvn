import fs from "fs/promises";
import path from "path";
import type { GitvnConfig } from "@/interfaces/gitvn";
import { commitFileToGitHub } from "./github-api";
import {
  configToYaml,
  createDefaultConfig,
  LATEST_GITVN_VERSION,
} from "./gitvn-config";
import {
  createDefaultDocArchitecture,
  createDefaultDocIndex,
  createDefaultReadme,
  createDefaultTasks,
} from "./gitvn-templates";
import { taskToMarkdown } from "./task-file";

const LOCAL_GITVN_DIR = path.join(process.cwd(), ".gitvn");

/**
 * Khởi tạo workspace chuẩn GitVN v2.0
 */
export async function initializeGitvnRepo(
  owner: string,
  repo: string,
  currentUserLogin: string,
  token?: string,
  branch?: string,
): Promise<{ success: boolean; syncedToGitHub: boolean; config: GitvnConfig }> {
  const defaultConfig = createDefaultConfig(repo);
  const defaultTasks = createDefaultTasks(owner, repo, currentUserLogin);
  const defaultIndexDoc = createDefaultDocIndex(repo);
  const defaultArchDoc = createDefaultDocArchitecture(repo);
  const defaultReadme = createDefaultReadme();
  const configYaml = configToYaml(defaultConfig);

  // Local write
  try {
    await fs.mkdir(LOCAL_GITVN_DIR, { recursive: true });
    await fs.mkdir(path.join(LOCAL_GITVN_DIR, "docs"), { recursive: true });
    await fs.mkdir(path.join(LOCAL_GITVN_DIR, "tasks"), { recursive: true });

    await fs.writeFile(
      path.join(LOCAL_GITVN_DIR, "config.yml"),
      configYaml,
      "utf-8",
    );
    await fs.writeFile(
      path.join(LOCAL_GITVN_DIR, "README.md"),
      defaultReadme,
      "utf-8",
    );
    await fs.writeFile(
      path.join(LOCAL_GITVN_DIR, "tasks.json"),
      JSON.stringify(defaultTasks, null, 2),
      "utf-8",
    );
    for (const t of defaultTasks.tasks) {
      await fs.writeFile(
        path.join(LOCAL_GITVN_DIR, "tasks", `${t.id}.md`),
        taskToMarkdown(t),
        "utf-8",
      );
    }
    await fs.writeFile(
      path.join(LOCAL_GITVN_DIR, "docs", "index.mdx"),
      defaultIndexDoc,
      "utf-8",
    );
    await fs.writeFile(
      path.join(LOCAL_GITVN_DIR, "docs", "architecture.mdx"),
      defaultArchDoc,
      "utf-8",
    );
  } catch {}

  // GitHub commit
  let syncedToGitHub = false;
  if (token) {
    const msg = `chore(gitvn): init canonical v${LATEST_GITVN_VERSION} workspace`;
    await commitFileToGitHub(
      owner,
      repo,
      ".gitvn/config.yml",
      configYaml,
      token,
      `${msg} config`,
      branch,
    );
    await commitFileToGitHub(
      owner,
      repo,
      ".gitvn/README.md",
      defaultReadme,
      token,
      `${msg} AI guide`,
      branch,
    );
    await commitFileToGitHub(
      owner,
      repo,
      ".gitvn/tasks.json",
      JSON.stringify(defaultTasks, null, 2),
      token,
      `${msg} tasks`,
      branch,
    );
    await commitFileToGitHub(
      owner,
      repo,
      ".gitvn/docs/index.mdx",
      defaultIndexDoc,
      token,
      `${msg} docs index`,
      branch,
    );
    await commitFileToGitHub(
      owner,
      repo,
      ".gitvn/docs/architecture.mdx",
      defaultArchDoc,
      token,
      `${msg} docs arch`,
      branch,
    );
    for (const t of defaultTasks.tasks) {
      await commitFileToGitHub(
        owner,
        repo,
        `.gitvn/tasks/${t.id}.md`,
        taskToMarkdown(t),
        token,
        `${msg} task ${t.id}`,
        branch,
      );
    }
    syncedToGitHub = true;
  }

  return {
    success: true,
    syncedToGitHub,
    config: defaultConfig,
  };
}
