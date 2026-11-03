import fs from "fs/promises";
import path from "path";
import type {
  GitvnConfig,
  GitvnDocItem,
  GitvnRepoStatus,
} from "@/interfaces/gitvn";
import type { JiraBoardData, JiraTask } from "@/interfaces/jira";
import {
  commitFileToGitHub,
  commitMultipleFilesToGitHub,
  fetchFileFromGitHub,
  fetchFolderContents,
} from "./github-api";
import {
  configToYaml,
  detectOutdated,
  LATEST_GITVN_VERSION,
  parseGitvnConfig,
} from "./gitvn-config";
import {
  createDefaultDocArchitecture,
  createDefaultDocIndex,
  createDefaultReadme,
  createDefaultTasks,
} from "./gitvn-templates";
import { parseTaskMarkdown, taskToMarkdown } from "./task-file";

export const LOCAL_GITVN_DIR = path.join(process.cwd(), ".gitvn");

/**
 * Đọc trạng thái .gitvn từ GitHub repo
 */
export async function inspectGitHubGitvn(
  owner: string,
  repo: string,
  token?: string,
  branch?: string,
): Promise<GitvnRepoStatus | null> {
  const root = await fetchFolderContents(owner, repo, ".gitvn", token, branch);
  if (!root.ok) return null;

  const items = root.items;
  const yamlItem = items.find(
    (i) => i.name === "config.yml" || i.name === "config.yaml",
  );
  const jsonItem = items.find((i) => i.name === "config.json");
  const hasTasksJson = items.some(
    (i) => i.name === "tasks.json" || i.name === "jira.json",
  );
  const tasksFolderItem = items.find(
    (i) => i.name === "tasks" && i.type === "dir",
  );

  let hasDecoupledTasks = false;
  if (tasksFolderItem) {
    const tasksDir = await fetchFolderContents(
      owner,
      repo,
      ".gitvn/tasks",
      token,
      branch,
    );
    if (tasksDir.ok && tasksDir.items.length > 0) {
      hasDecoupledTasks = true;
    }
  }

  let config: GitvnConfig | null = null;
  let configFormat: "yaml" | "json" = "yaml";

  if (yamlItem) {
    const res = await fetchFileFromGitHub(
      owner,
      repo,
      `.gitvn/${yamlItem.name}`,
      token,
      branch,
    );
    if (res.ok && res.content) {
      config = parseGitvnConfig(res.content, true);
      configFormat = "yaml";
    }
  } else if (jsonItem) {
    const res = await fetchFileFromGitHub(
      owner,
      repo,
      ".gitvn/config.json",
      token,
      branch,
    );
    if (res.ok && res.content) {
      config = parseGitvnConfig(res.content, false);
      configFormat = "json";
    }
  }

  // Đọc danh sách docs
  const docsList: GitvnDocItem[] = [];
  const docsDir = await fetchFolderContents(
    owner,
    repo,
    ".gitvn/docs",
    token,
    branch,
  );
  if (docsDir.ok) {
    for (const f of docsDir.items) {
      if (f.name.endsWith(".md") || f.name.endsWith(".mdx")) {
        const fileRes = await fetchFileFromGitHub(
          owner,
          repo,
          f.path,
          token,
          branch,
        );
        const content = fileRes.content || "";
        const heading = content.match(/^#\s+(.+)$/m);
        const title =
          f.name === "index.mdx"
            ? "Tổng quan dự án"
            : f.name === "architecture.mdx"
              ? "Kiến trúc hệ thống"
              : heading
                ? heading[1].trim()
                : f.name;

        docsList.push({
          id: f.name.replace(/\.[^/.]+$/, ""),
          name: f.name,
          path: f.path,
          title,
          content,
        });
      }
    }
  }

  const { isOutdated, reason } = detectOutdated(
    config,
    hasDecoupledTasks,
    hasTasksJson,
  );

  return {
    hasGitvn: true,
    hasConfig: Boolean(config),
    hasTasks: hasTasksJson || hasDecoupledTasks,
    hasDocs: docsList.length > 0,
    config: config || undefined,
    docs: docsList,
    source: "github",
    isOutdated,
    currentVersion: config?.version || (hasTasksJson ? "1.0.0" : undefined),
    latestVersion: LATEST_GITVN_VERSION,
    hasDecoupledTasks,
    configFormat,
    reason,
  };
}

/**
 * Nâng cấp repo từ v1 lên v2: tách tasks.json thành .gitvn/tasks/*.md và tạo config.yml
 */
export async function upgradeGitvnRepo(
  owner: string,
  repo: string,
  token?: string,
  branch?: string,
): Promise<{ success: boolean; migratedTasksCount: number; error?: string }> {
  // 1. Tìm đọc tasks hiện có (từ tasks.json trên GitHub hoặc local)
  let tasksData: JiraBoardData | null = null;
  if (token) {
    const rawTasks = await fetchFileFromGitHub(
      owner,
      repo,
      ".gitvn/tasks.json",
      token,
      branch,
    );
    if (rawTasks.ok && rawTasks.content) {
      try {
        tasksData = JSON.parse(rawTasks.content);
      } catch {}
    }
  }

  // Fallback đọc local
  if (!tasksData) {
    try {
      const localRaw = await fs.readFile(
        path.join(LOCAL_GITVN_DIR, "tasks.json"),
        "utf-8",
      );
      tasksData = JSON.parse(localRaw);
    } catch {}
  }

  if (!tasksData) {
    tasksData = createDefaultTasks(owner, repo, "admin");
  }

  const tasksList: JiraTask[] = Array.isArray(tasksData.tasks)
    ? tasksData.tasks
    : [];

  // 2. Tạo config.yml v2
  const v2Config: GitvnConfig = {
    version: LATEST_GITVN_VERSION,
    name: repo,
    description: `Cấu hình chuẩn GitVN Workspace v2 cho ${repo}`,
    storage: {
      format: "decoupled",
      tasks_dir: ".gitvn/tasks",
      docs_dir: ".gitvn/docs",
    },
    modules: { kanban: true, docs: true },
    kanban: {
      columns: [
        { id: "todo", title: "To Do", color: "#3b82f6" },
        { id: "in_progress", title: "In Progress", color: "#eab308" },
        { id: "review", title: "In Review", color: "#a855f7" },
        { id: "done", title: "Done", color: "#22c55e" },
      ],
    },
    docs: {
      entry: "docs/index.mdx",
      files: ["index.mdx", "architecture.mdx"],
    },
    permissions: tasksData.permissions,
  };
  const configYamlStr = configToYaml(v2Config);
  const readmeStr = createDefaultReadme();

  // 3. Ghi cục bộ nếu được phép
  try {
    const tasksDir = path.join(LOCAL_GITVN_DIR, "tasks");
    await fs.mkdir(tasksDir, { recursive: true });
    await fs.writeFile(
      path.join(LOCAL_GITVN_DIR, "config.yml"),
      configYamlStr,
      "utf-8",
    );
    await fs.writeFile(
      path.join(LOCAL_GITVN_DIR, "README.md"),
      readmeStr,
      "utf-8",
    );
    for (const task of tasksList) {
      await fs.writeFile(
        path.join(tasksDir, `${task.id}.md`),
        taskToMarkdown(task),
        "utf-8",
      );
    }
  } catch {}

  // 4. Commit lên GitHub thành 1 commit duy nhất (tránh spam hàng chục commit rác)
  if (token) {
    const filesToCommit = [
      { path: ".gitvn/config.yml", content: configYamlStr },
      { path: ".gitvn/README.md", content: readmeStr },
      ...tasksList.map((task) => ({
        path: `.gitvn/tasks/${task.id}.md`,
        content: taskToMarkdown(task),
      })),
    ];

    await commitMultipleFilesToGitHub(
      owner,
      repo,
      filesToCommit,
      token,
      `chore(gitvn): upgrade to v${LATEST_GITVN_VERSION} decoupled task architecture (${tasksList.length} tasks)`,
      branch,
    );
  }

  return { success: true, migratedTasksCount: tasksList.length };
}
