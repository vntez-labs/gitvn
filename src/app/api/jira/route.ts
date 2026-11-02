import fs from "fs/promises";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import path from "path";
import type { JiraBoardData, JiraSprint, JiraTask } from "@/interfaces/jira";

// Lưu trữ chính tại thư mục .gitvn trong repo
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
      headers: { Authorization: `Bearer ${token}` },
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
  token: string,
): Promise<JiraBoardData | null> {
  const filesToTry = [".gitvn/tasks.json", ".gitvn/jira.json"];

  for (const filePath of filesToTry) {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
          },
          cache: "no-store",
        },
      );

      if (!res.ok) continue;
      const fileData = await res.json();
      if (fileData.content) {
        const decoded = Buffer.from(fileData.content, "base64").toString(
          "utf-8",
        );
        const parsed = JSON.parse(decoded);
        if (parsed && typeof parsed === "object") {
          return parsed;
        }
      }
    } catch {
      // Tiếp tục thử file kế tiếp
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
): Promise<{ ok: boolean; error?: string; sha?: string }> {
  const targetFile = ".gitvn/tasks.json";
  try {
    // 1. Lấy SHA hiện tại nếu file đã tồn tại trên repo
    let sha: string | undefined;
    const getRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${targetFile}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
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
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `chore(gitvn): update ${targetFile} kanban board`,
          content: Buffer.from(JSON.stringify(data, null, 2)).toString(
            "base64",
          ),
          sha,
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
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");

  if (!owner || !repo) {
    return NextResponse.json(
      { error: "Thiếu owner hoặc repo" },
      { status: 400 },
    );
  }

  const token = await getAuthToken();
  const user = await getAuthUser();
  const currentUserLogin = user?.login || "anonymous";

  await fs.mkdir(GITVN_DIR, { recursive: true });

  const primaryTasksPath = getPrimaryTasksFilePath();
  const repoTasksPath = getRepoTasksFilePath(owner, repo);
  const legacyRepoPath = getLegacyRepoFilePath(owner, repo);
  const dataJiraPath = getDataJiraRepoFilePath(owner, repo);

  // 1. Thử đọc từ GitHub nếu có token
  if (token) {
    const remoteData = await fetchFromGitHub(owner, repo, token);
    if (remoteData) {
      remoteData.owner = owner;
      remoteData.repo = repo;

      // Lưu lại local bản mới nhất
      await fs.writeFile(
        repoTasksPath,
        JSON.stringify(remoteData, null, 2),
        "utf-8",
      );
      if (repo.toLowerCase() === "gitvn") {
        await fs.writeFile(
          primaryTasksPath,
          JSON.stringify(remoteData, null, 2),
          "utf-8",
        );
      }

      return NextResponse.json({
        data: remoteData,
        source: "github",
        syncedToGitHub: true,
        file: ".gitvn/tasks.json",
      });
    }
  }

  // 2. Thử đọc từ file local theo thứ tự ưu tiên chính xác cho ĐÚNG repo
  const localCandidates = [
    repoTasksPath,
    primaryTasksPath,
    dataJiraPath,
    legacyRepoPath,
  ];

  for (const candidatePath of localCandidates) {
    try {
      const content = await fs.readFile(
        /*turbopackIgnore: true*/ candidatePath,
        "utf-8",
      );
      const data: JiraBoardData = JSON.parse(content);

      // QUAN TRỌNG: Chỉ chấp nhận nếu file thực sự thuộc repo này
      // (hoặc nếu là primaryTasksPath khi repo là gitvn)
      const matchesRepo =
        (data.owner?.toLowerCase() === owner.toLowerCase() &&
          data.repo?.toLowerCase() === repo.toLowerCase()) ||
        (candidatePath === primaryTasksPath && repo.toLowerCase() === "gitvn");

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

        // Migrate/Cập nhật chuẩn vào file tasks.json
        await fs.writeFile(
          repoTasksPath,
          JSON.stringify(data, null, 2),
          "utf-8",
        );
        if (repo.toLowerCase() === "gitvn") {
          await fs.writeFile(
            primaryTasksPath,
            JSON.stringify(data, null, 2),
            "utf-8",
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
      // File không tồn tại hoặc parse lỗi, tiếp tục ứng viên kế tiếp
    }
  }

  // 3. Nếu chưa có bất kỳ dữ liệu nào cho repo này -> Tạo bảng mới sạch sẽ
  const defaultData = createCleanDefaultBoard(owner, repo, currentUserLogin);
  await fs.writeFile(
    repoTasksPath,
    JSON.stringify(defaultData, null, 2),
    "utf-8",
  );
  if (repo.toLowerCase() === "gitvn") {
    await fs.writeFile(
      primaryTasksPath,
      JSON.stringify(defaultData, null, 2),
      "utf-8",
    );
  }

  // Thử sync luôn lên GitHub nếu có token
  let synced = false;
  if (token) {
    const syncRes = await syncToGitHub(owner, repo, defaultData, token);
    synced = syncRes.ok;
  }

  return NextResponse.json({
    data: defaultData,
    source: "initialized",
    file: ".gitvn/tasks.json",
    syncedToGitHub: synced,
  });
}

export async function POST(request: Request) {
  try {
    const { owner, repo, data, forceGitHubSync = true } = await request.json();

    if (!owner || !repo || !data) {
      return NextResponse.json(
        { error: "Thiếu dữ liệu cập nhật" },
        { status: 400 },
      );
    }

    // Bảo đảm owner và repo đúng
    data.owner = owner;
    data.repo = repo;

    await fs.mkdir(GITVN_DIR, { recursive: true });
    const primaryTasksPath = getPrimaryTasksFilePath();
    const repoTasksPath = getRepoTasksFilePath(owner, repo);
    const legacyPath = path.join(GITVN_DIR, "jira.json");

    // 1. Lưu local vào file .gitvn/tasks.json
    await fs.writeFile(repoTasksPath, JSON.stringify(data, null, 2), "utf-8");

    // Nếu repo đang thao tác là gitvn (workspace hiện tại), cập nhật trực tiếp .gitvn/tasks.json
    if (repo.toLowerCase() === "gitvn" || !process.env.VERCEL) {
      await fs.writeFile(
        primaryTasksPath,
        JSON.stringify(data, null, 2),
        "utf-8",
      );
      // Cũng lưu vào jira.json cho backward-compat
      await fs.writeFile(legacyPath, JSON.stringify(data, null, 2), "utf-8");
    }

    // 2. Cố gắng đồng bộ lên GitHub repo nếu có token
    let syncedToGitHub = false;
    let githubError: string | undefined;

    const token = await getAuthToken();
    if (token && forceGitHubSync) {
      const syncResult = await syncToGitHub(owner, repo, data, token);
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
