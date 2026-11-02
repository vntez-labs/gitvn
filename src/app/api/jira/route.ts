import fs from "fs/promises";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import path from "path";
import type { JiraBoardData, JiraSprint, JiraTask } from "@/interfaces/jira";

// Lưu trữ chính tại thư mục .gitvn trong repo (hoặc local cache)
const GITVN_DIR = path.join(process.cwd(), ".gitvn");

function getPrimaryTasksFilePath(): string {
  return path.join(GITVN_DIR, "tasks.json");
}

function getRepoTasksFilePath(owner: string, repo: string): string {
  const safeOwner = owner.replace(/[^a-zA-Z0-9._-]/g, "_");
  const safeRepo = repo.replace(/[^a-zA-Z0-9._-]/g, "_");
  return path.join(GITVN_DIR, `${safeOwner}__${safeRepo}.tasks.json`);
}

function getLegacyRepoFilePath(owner: string, repo: string): string {
  const safeOwner = owner.replace(/[^a-zA-Z0-9._-]/g, "_");
  const safeRepo = repo.replace(/[^a-zA-Z0-9._-]/g, "_");
  return path.join(GITVN_DIR, `${safeOwner}__${safeRepo}.json`);
}

function getDataJiraRepoFilePath(owner: string, repo: string): string {
  const safeOwner = owner.replace(/[^a-zA-Z0-9._-]/g, "_");
  const safeRepo = repo.replace(/[^a-zA-Z0-9._-]/g, "_");
  return path.join(
    process.cwd(),
    "data",
    "jira",
    `${safeOwner}__${safeRepo}.json`,
  );
}

// Hàm ghi file an toàn, không bao giờ làm crash request trên Vercel/Serverless read-only filesystem
async function safeWriteFile(
  filePath: string,
  content: string,
): Promise<boolean> {
  try {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, content, "utf-8");
    return true;
  } catch {
    // Trên Vercel (AWS Lambda), filesystem ngoài /tmp là read-only (EROFS) -> bỏ qua an toàn
    return false;
  }
}

// Hàm đọc file an toàn
async function safeReadFile(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch {
    return null;
  }
}

async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get("github_access_token")?.value;
}

async function getAuthUser(): Promise<{
  login: string;
  name?: string;
  avatar_url?: string;
} | null> {
  const token = await getAuthToken();
  if (!token) return null;

  try {
    const res = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "GitVN-App",
        Accept: "application/vnd.github+json",
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Cố gắng lấy .gitvn/tasks.json (hoặc fallback .gitvn/jira.json) từ GitHub repo
async function fetchFromGitHub(
  owner: string,
  repo: string,
  token?: string,
  branch?: string | null,
): Promise<JiraBoardData | null> {
  const filesToTry = [".gitvn/tasks.json", ".gitvn/jira.json"];
  const refQuery = branch ? `?ref=${encodeURIComponent(branch)}` : "";

  for (const filePath of filesToTry) {
    try {
      const headers: Record<string, string> = {
        "User-Agent": "GitVN-App",
        "X-GitHub-Api-Version": "2022-11-28",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // 1. Thử lấy raw JSON trực tiếp (nhanh, chuẩn xác, không bị giới hạn 1MB Base64)
      const rawRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}${refQuery}`,
        {
          headers: {
            ...headers,
            Accept:
              "application/vnd.github.raw+json, application/vnd.github.raw",
          },
          cache: "no-store",
        },
      );

      if (rawRes.ok) {
        const rawText = await rawRes.text();
        const parsed = JSON.parse(rawText);
        if (
          parsed &&
          typeof parsed === "object" &&
          (parsed.tasks || parsed.sprints)
        ) {
          return parsed;
        }
      }

      // 2. Fallback: Lấy standard JSON object (base64 hoặc download_url)
      const jsonRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}${refQuery}`,
        {
          headers: {
            ...headers,
            Accept: "application/vnd.github+json",
          },
          cache: "no-store",
        },
      );

      if (jsonRes.ok) {
        const fileData = await jsonRes.json();
        if (fileData.content) {
          const decoded = Buffer.from(fileData.content, "base64").toString(
            "utf-8",
          );
          const parsed = JSON.parse(decoded);
          if (
            parsed &&
            typeof parsed === "object" &&
            (parsed.tasks || parsed.sprints)
          ) {
            return parsed;
          }
        } else if (fileData.download_url) {
          const dlRes = await fetch(fileData.download_url, {
            headers,
            cache: "no-store",
          });
          if (dlRes.ok) {
            const dlParsed = await dlRes.json();
            if (
              dlParsed &&
              typeof dlParsed === "object" &&
              (dlParsed.tasks || dlParsed.sprints)
            ) {
              return dlParsed;
            }
          }
        }
      }
    } catch (err) {
      console.warn(`[fetchFromGitHub error for ${filePath}]:`, err);
    }
  }

  return null;
}

// Cố gắng commit .gitvn/tasks.json lên GitHub repo
async function syncToGitHub(
  owner: string,
  repo: string,
  data: JiraBoardData,
  token: string,
  branch?: string | null,
): Promise<{ ok: boolean; error?: string; sha?: string }> {
  const targetFile = ".gitvn/tasks.json";
  const refQuery = branch ? `?ref=${encodeURIComponent(branch)}` : "";

  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "GitVN-App",
      "X-GitHub-Api-Version": "2022-11-28",
    };

    // 1. Lấy SHA hiện tại nếu file đã tồn tại trên repo
    let sha: string | undefined;
    const getRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${targetFile}${refQuery}`,
      {
        headers,
        cache: "no-store",
      },
    );

    if (getRes.ok) {
      const existing = await getRes.json();
      sha = existing.sha;
    }

    // 2. Commit file mới lên GitHub repo
    const putRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${targetFile}`,
      {
        method: "PUT",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `chore(gitvn): update ${targetFile} kanban board`,
          content: Buffer.from(JSON.stringify(data, null, 2)).toString(
            "base64",
          ),
          sha,
          branch: branch || undefined,
        }),
      },
    );

    if (!putRes.ok) {
      const errData = await putRes.json().catch(() => ({}));
      return {
        ok: false,
        error: errData.message || `GitHub error status ${putRes.status}`,
      };
    }

    const putData = await putRes.json();
    return { ok: true, sha: putData.content?.sha };
  } catch (err: any) {
    console.error("Không thể sync lên GitHub .gitvn/tasks.json:", err);
    return { ok: false, error: err?.message || "Network error sync to GitHub" };
  }
}

function createCleanDefaultBoard(
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
    description: `### Mục tiêu ban đầu\n\n- Khởi tạo dự án và thiết lập môi trường phát triển\n- Lên danh sách các tính năng cốt lõi\n- Cập nhật file \`.gitvn/tasks.json\``,
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get("owner");
    const repo = searchParams.get("repo");
    const branch = searchParams.get("branch");

    if (!owner || !repo) {
      return NextResponse.json(
        { error: "Thiếu owner hoặc repo" },
        { status: 400 },
      );
    }

    const token = await getAuthToken();
    const user = await getAuthUser();
    const currentUserLogin = user?.login || "anonymous";

    const primaryTasksPath = getPrimaryTasksFilePath();
    const repoTasksPath = getRepoTasksFilePath(owner, repo);
    const legacyRepoPath = getLegacyRepoFilePath(owner, repo);
    const dataJiraPath = getDataJiraRepoFilePath(owner, repo);

    // 1. Thử đọc từ GitHub (có token hoặc không có token nếu public)
    const remoteData = await fetchFromGitHub(owner, repo, token, branch);
    if (remoteData) {
      remoteData.owner = owner;
      remoteData.repo = repo;

      // Lưu lại local cache an toàn (không crash trên Vercel)
      await safeWriteFile(repoTasksPath, JSON.stringify(remoteData, null, 2));
      if (repo.toLowerCase() === "gitvn") {
        await safeWriteFile(
          primaryTasksPath,
          JSON.stringify(remoteData, null, 2),
        );
      }

      return NextResponse.json({
        data: remoteData,
        source: "github",
        syncedToGitHub: true,
        file: ".gitvn/tasks.json",
      });
    }

    // 2. Thử đọc từ file local cache theo thứ tự ưu tiên
    const localCandidates = [
      repoTasksPath,
      primaryTasksPath,
      dataJiraPath,
      legacyRepoPath,
    ];

    for (const candidatePath of localCandidates) {
      const content = await safeReadFile(candidatePath);
      if (!content) continue;

      try {
        const data: JiraBoardData = JSON.parse(content);
        const matchesRepo =
          (data.owner?.toLowerCase() === owner.toLowerCase() &&
            data.repo?.toLowerCase() === repo.toLowerCase()) ||
          (candidatePath === primaryTasksPath &&
            repo.toLowerCase() === "gitvn");

        if (matchesRepo && data.tasks && data.sprints) {
          data.owner = owner;
          data.repo = repo;

          if (
            user &&
            data.permissions?.userRoles &&
            !data.permissions.userRoles[user.login]
          ) {
            data.permissions.userRoles[user.login] =
              user.login.toLowerCase() === owner.toLowerCase()
                ? "admin"
                : data.permissions.defaultRole || "member";
          }

          await safeWriteFile(repoTasksPath, JSON.stringify(data, null, 2));
          if (repo.toLowerCase() === "gitvn") {
            await safeWriteFile(
              primaryTasksPath,
              JSON.stringify(data, null, 2),
            );
          }

          return NextResponse.json({
            data,
            source: "local",
            file: ".gitvn/tasks.json",
            syncedToGitHub: false,
          });
        }
      } catch {
        // file parse lỗi, tiếp tục
      }
    }

    // 3. Nếu chưa có bất kỳ dữ liệu nào cho repo này -> Tạo bảng mới sạch sẽ
    const defaultData = createCleanDefaultBoard(owner, repo, currentUserLogin);
    await safeWriteFile(repoTasksPath, JSON.stringify(defaultData, null, 2));
    if (repo.toLowerCase() === "gitvn") {
      await safeWriteFile(
        primaryTasksPath,
        JSON.stringify(defaultData, null, 2),
      );
    }

    let synced = false;
    if (token) {
      const syncRes = await syncToGitHub(
        owner,
        repo,
        defaultData,
        token,
        branch,
      );
      synced = syncRes.ok;
    }

    return NextResponse.json({
      data: defaultData,
      source: "initialized",
      file: ".gitvn/tasks.json",
      syncedToGitHub: synced,
    });
  } catch (err: any) {
    console.error("Error in GET /api/jira:", err);
    return NextResponse.json(
      { error: err?.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const {
      owner,
      repo,
      branch,
      data,
      forceGitHubSync = true,
    } = await request.json();

    if (!owner || !repo || !data) {
      return NextResponse.json(
        { error: "Thiếu dữ liệu cập nhật" },
        { status: 400 },
      );
    }

    data.owner = owner;
    data.repo = repo;

    const primaryTasksPath = getPrimaryTasksFilePath();
    const repoTasksPath = getRepoTasksFilePath(owner, repo);
    const legacyPath = path.join(GITVN_DIR, "jira.json");

    // 1. Lưu local cache an toàn (không crash trên Vercel)
    await safeWriteFile(repoTasksPath, JSON.stringify(data, null, 2));
    if (repo.toLowerCase() === "gitvn" || !process.env.VERCEL) {
      await safeWriteFile(primaryTasksPath, JSON.stringify(data, null, 2));
      await safeWriteFile(legacyPath, JSON.stringify(data, null, 2));
    }

    // 2. Đồng bộ lên GitHub repo nếu có token
    let syncedToGitHub = false;
    let githubError: string | undefined;

    const token = await getAuthToken();
    if (token && forceGitHubSync) {
      const syncResult = await syncToGitHub(owner, repo, data, token, branch);
      syncedToGitHub = syncResult.ok;
      githubError = syncResult.error;
    }

    return NextResponse.json({
      success: true,
      data,
      file: ".gitvn/tasks.json",
      syncedToGitHub,
      githubError,
    });
  } catch (err: any) {
    console.error("Error in POST /api/jira:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
