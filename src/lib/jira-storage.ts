import fs from "fs/promises";
import path from "path";
import type { JiraBoardData, JiraSprint, JiraTask } from "@/interfaces/jira";
import { commitFileToGitHub, commitMultipleFilesToGitHub } from "./github-api";
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
        const mdItems = items.filter(
          (item: any) => item.type === "file" && item.name.endsWith(".md"),
        );

        const fetchSingleTask = async (item: any): Promise<JiraTask | null> => {
          try {
            const fileRes = await fetch(item.download_url, {
              cache: "no-store",
              signal: AbortSignal.timeout(6000),
            });
            if (fileRes.ok) {
              const text = await fileRes.text();
              const taskId = item.name.replace(/\.md$/, "");
              return parseTaskMarkdown(text, taskId);
            }
          } catch {}
          return null;
        };

        // Tải song song theo batch 10 tasks để không bị nghẽn tuần tự
        const individualTasks: JiraTask[] = [];
        const BATCH_SIZE = 10;
        for (let i = 0; i < mdItems.length; i += BATCH_SIZE) {
          const batch = mdItems.slice(i, i + BATCH_SIZE);
          const results = await Promise.all(batch.map(fetchSingleTask));
          for (const task of results) {
            if (task) individualTasks.push(task);
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
 * Gộp tất cả thay đổi trong 1 commit duy nhất qua Git Data Tree API để tránh commit rác
 */
export async function syncBoardToGitHub(
  owner: string,
  repo: string,
  data: JiraBoardData,
  token: string,
  branch?: string | null,
): Promise<{ ok: boolean; error?: string }> {
  const filesToCommit = [
    {
      path: ".gitvn/tasks.json",
      content: JSON.stringify(data, null, 2),
    },
  ];

  if (Array.isArray(data.tasks)) {
    data.tasks.forEach((t) => {
      filesToCommit.push({
        path: `.gitvn/tasks/${t.id}.md`,
        content: taskToMarkdown(t),
      });
    });
  }

  const res = await commitMultipleFilesToGitHub(
    owner,
    repo,
    filesToCommit,
    token,
    `chore(gitvn): sync tasks board (${data.tasks?.length || 0} tasks)`,
    branch || undefined,
  );

  return { ok: res.ok, error: res.error };
}
