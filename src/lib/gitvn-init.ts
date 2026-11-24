import fs from "fs/promises";
import path from "path";
import type { GitvnConfig } from "@/interfaces/gitvn";
import { commitMultipleFilesToGitHub } from "./github-api";
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

  const files = [
    { path: ".gitvn/config.yml", content: configYaml },
    { path: ".gitvn/README.md", content: defaultReadme },
    {
      path: ".gitvn/tasks.json",
      content: JSON.stringify(defaultTasks, null, 2),
    },
    { path: ".gitvn/docs/index.mdx", content: defaultIndexDoc },
    { path: ".gitvn/docs/architecture.mdx", content: defaultArchDoc },
    ...defaultTasks.tasks.map((task) => ({
      path: `.gitvn/tasks/${task.id}.md`,
      content: taskToMarkdown(task),
    })),
  ];

  try {
    for (const file of files) {
      const destination = path.join(
        LOCAL_GITVN_DIR,
        file.path.slice(".gitvn/".length),
      );
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.writeFile(destination, file.content, "utf-8");
    }
  } catch {}

  const commit = token
    ? await commitMultipleFilesToGitHub(
        owner,
        repo,
        files,
        token,
        `chore(gitvn): initialize workspace v${LATEST_GITVN_VERSION}`,
        branch,
        { atomic: true },
      )
    : undefined;

  return {
    success: true,
    syncedToGitHub: commit?.ok ?? false,
    config: defaultConfig,
  };
}
