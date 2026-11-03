import fs from "fs/promises";
import path from "path";
import type { JiraBoardData, JiraSprint, JiraTask } from "@/interfaces/jira";
import { commitFileToGitHub } from "./github-api";
import { parseTaskMarkdown, taskToMarkdown } from "./task-file";

const GITVN_DIR = path.join(process.cwd(), ".gitvn");

export function getPrimaryTasksFilePath(): string {
  return path.join(GITVN_DIR, "tasks.json");
}

export function getRepoTasksFilePath(owner: string, repo: string): string {
  const safeOwner = owner.replace(/[^a-zA-Z0-9._-]/g, "_");
  const safeRepo = repo.replace(/[^a-zA-Z0-9._-]/g, "_");
  return path.join(GITVN_DIR, `${safeOwner}__${safeRepo}.tasks.json`);
}

export function getLegacyRepoFilePath(owner: string, repo: string): string {
  const safeOwner = owner.replace(/[^a-zA-Z0-9._-]/g, "_");
  const safeRepo = repo.replace(/[^a-zA-Z0-9._-]/g, "_");
  return path.join(GITVN_DIR, `${safeOwner}__${safeRepo}.json`);
}

export async function safeWriteFile(
  filePath: string,
  content: string,
): Promise<boolean> {
  try {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, content, "utf-8");
    return true;
  } catch {
    return false;
  }
}

export async function safeReadFile(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch {
    return null;
  }
}

export function createCleanDefaultBoard(
  owner: string,
  repo: string,
  currentUserLogin: string,
): JiraBoardData {
  const now = new Date().toISOString();
  const prefix =
    repo
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 5) || "TASK";

  const defaultSprint: JiraSprint = {
    id: "sprint-1",
    name: "Sprint 1 - Bắt đầu dự án",
    goal: `Kế hoạch phát triển cho ${repo}`,
    startDate: now.slice(0, 10),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
    status: "active",
    createdAt: now,
  };

  const initialTask: JiraTask = {
    id: `${prefix}-1`,
    title: `Khởi tạo dự án ${repo} & cấu trúc công việc`,
    description: `### Mục tiêu ban đầu\n\n- Khởi tạo dự án và thiết lập môi trường phát triển\n- Lên danh sách các tính năng cốt lõi\n- Cập nhật file \`.gitvn/tasks.json\` và \`.gitvn/tasks/*.md\``,
    status: "in_progress",
    priority: "high",
    assignee: { login: currentUserLogin, name: currentUserLogin },
    reporter: { login: currentUserLogin, name: currentUserLogin },
    sprintId: "sprint-1",
    storyPoints: 3,
    createdAt: now,
    updatedAt: now,
  };

  return {
    owner,
    repo,
    taskSeq: 1,
    tasks: [initialTask],
    sprints: [defaultSprint],
    permissions: {
      userRoles: {
        [currentUserLogin]: "admin",
        [owner]: "admin",
      },
      defaultRole: "member",
      canManageSprint: ["admin", "pm"],
      canCreateBacklog: ["admin", "pm", "member"],
    },
  };
}

/**
 * Đọc tasks từ GitHub (thử tasks.json trước, fallback folder .gitvn/tasks/)
 */
export async function fetchBoardFromGitHub(
  owner: string,
  repo: string,
  token?: string,
  branch?: string | null,
): Promise<JiraBoardData | null> {
  const refQuery = branch ? `?ref=${encodeURIComponent(branch)}` : "";
  const headers: Record<string, string> = {
    "User-Agent": "GitVN-App",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  // 1. Thử đọc .gitvn/tasks.json
  try {
    const rawRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/.gitvn/tasks.json${refQuery}`,
      {
        headers: { ...headers, Accept: "application/vnd.github.raw" },
        cache: "no-store",
      },
    );
    if (rawRes.ok) {
      const parsed = JSON.parse(await rawRes.text());
      if (parsed?.tasks || parsed?.sprints) return parsed;
    }
  } catch {}

  // 2. Fallback: Đọc thư mục .gitvn/tasks/ (kiến trúc file rời)
  try {
    const folderRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/.gitvn/tasks${refQuery}`,
      {
        headers: { ...headers, Accept: "application/vnd.github+json" },
        cache: "no-store",
      },
    );
    if (folderRes.ok) {
      const items = await folderRes.json();
      if (Array.isArray(items) && items.length > 0) {
        const individualTasks: JiraTask[] = [];
        for (const item of items) {
          if (item.type === "file" && item.name.endsWith(".md")) {
            try {
              const fileRes = await fetch(item.download_url, {
                cache: "no-store",
              });
              if (fileRes.ok) {
                const text = await fileRes.text();
                const taskId = item.name.replace(/\.md$/, "");
                individualTasks.push(parseTaskMarkdown(text, taskId));
              }
            } catch {}
          }
        }
        if (individualTasks.length > 0) {
          return {
            owner,
            repo,
            taskSeq: individualTasks.length + 1,
            tasks: individualTasks,
            sprints: [],
            permissions: {
              userRoles: { [owner]: "admin" },
              defaultRole: "member",
              canManageSprint: ["admin", "pm"],
              canCreateBacklog: ["admin", "pm", "member"],
            },
          };
        }
      }
    }
  } catch {}

  return null;
}

/**
 * Đồng bộ dữ liệu Board lên GitHub (ghi tasks.json và các file rời .gitvn/tasks/*.md)
 */
export async function syncBoardToGitHub(
  owner: string,
  repo: string,
  data: JiraBoardData,
  token: string,
  branch?: string | null,
): Promise<{ ok: boolean; error?: string }> {
  // Commit tasks.json
  const resTasksJson = await commitFileToGitHub(
    owner,
    repo,
    ".gitvn/tasks.json",
    JSON.stringify(data, null, 2),
    token,
    "chore(gitvn): update tasks.json board",
    branch || undefined,
  );

  // Commit individual task markdown files
  if (Array.isArray(data.tasks)) {
    for (const t of data.tasks) {
      await commitFileToGitHub(
        owner,
        repo,
        `.gitvn/tasks/${t.id}.md`,
        taskToMarkdown(t),
        token,
        `chore(gitvn): sync task ${t.id}`,
        branch || undefined,
      );
    }
  }

  return { ok: resTasksJson.ok, error: resTasksJson.error };
}
