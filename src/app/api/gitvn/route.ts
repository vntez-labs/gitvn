import fs from "fs/promises";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import path from "path";
import type {
  GitvnConfig,
  GitvnDocItem,
  GitvnRepoStatus,
} from "@/interfaces/gitvn";
import type { JiraBoardData, JiraSprint, JiraTask } from "@/interfaces/jira";

const LOCAL_GITVN_DIR = path.join(process.cwd(), ".gitvn");

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

// Hàm chuẩn tạo cấu hình config.json mặc định
function createDefaultConfig(repo: string): GitvnConfig {
  return {
    version: "1.0.0",
    name: repo,
    description: `Cấu hình chuẩn GitVN Workspace cho ${repo}`,
    modules: {
      kanban: true,
      docs: true,
    },
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
  };
}

// Hàm chuẩn tạo tasks.json khởi tạo
function createDefaultTasks(
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

  const tasks: JiraTask[] = [
    {
      id: `${prefix}-1`,
      title: `Khởi tạo dự án ${repo} & thiết lập môi trường`,
      description: `### Mục tiêu\n\n- Khởi tạo repo và thiết lập thư mục \`.gitvn\`\n- Cấu hình các cột Kanban và tài liệu dự án\n- Kiểm tra khả năng đồng bộ với GitHub`,
      status: "in_progress",
      priority: "high",
      assignee: { login: currentUserLogin, name: currentUserLogin },
      reporter: { login: currentUserLogin, name: currentUserLogin },
      sprintId: "sprint-1",
      storyPoints: 3,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: `${prefix}-2`,
      title: "Soạn thảo tài liệu kiến trúc & hướng dẫn trong docs/index.mdx",
      description: `### Yêu cầu\n\n- Bổ sung hướng dẫn cài đặt và sử dụng\n- Mô tả luồng hoạt động chính\n- Sử dụng cú pháp callout alert và bảng biểu MDX`,
      status: "todo",
      priority: "medium",
      assignee: { login: currentUserLogin, name: currentUserLogin },
      reporter: { login: currentUserLogin, name: currentUserLogin },
      sprintId: "sprint-1",
      storyPoints: 2,
      createdAt: now,
      updatedAt: now,
    },
  ];

  return {
    owner,
    repo,
    taskSeq: 2,
    tasks,
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

// Mẫu tài liệu docs/index.mdx mặc định
function createDefaultDocIndex(repo: string): string {
  return `# Tài liệu Dự án ${repo}

Chào mừng bạn đến với tài liệu hướng dẫn được quản lý bởi **GitVN** trực tiếp trong thư mục \`.gitvn/docs\`.

> [!NOTE]
> Tài liệu này được đồng bộ trực tiếp với GitHub và được cập nhật theo thời gian thực.

## 🚀 Các tính năng chính

- **Kanban Board tích hợp**: Quản lý task theo quy chuẩn: \`Backlog\`, \`To Do\`, \`In Progress\`, \`In Review\`, \`Done\`.
- **Live MDX Docs**: Hỗ trợ Markdown nâng cao, Callouts, Bảng biểu và Code syntax highlighting.
- **Git Native**: Mọi thay đổi đều được lưu thành các commit chuẩn trong repository.

## 📦 Cấu trúc quy chuẩn

\`\`\`bash
.gitvn/
├── config.json         # Cấu hình tính năng & danh sách các cột Kanban
├── tasks.json          # Danh sách task, sprint và phân quyền
└── docs/               # Tài liệu dự án
    ├── index.mdx       # Tài liệu tổng quan
    └── architecture.mdx# Kiến trúc kỹ thuật
\`\`\`
`;
}

// Mẫu tài liệu docs/architecture.mdx mặc định
function createDefaultDocArchitecture(repo: string): string {
  return `# Kiến trúc Kỹ thuật - ${repo}

Tài liệu mô tả chi tiết kiến trúc và luồng xử lý dữ liệu của dự án.

> [!TIP]
> Bạn có thể chỉnh sửa file này trực tiếp từ tab **Docs (MDX)** và nhấn nút **Lưu & Đồng bộ lên GitHub**.

## 1. Luồng Hoạt Động

1. Người dùng thao tác trên bảng Kanban hoặc trình soạn thảo MDX.
2. Ứng dụng cập nhật dữ liệu cục bộ và tạo commit lên nhánh hiện tại của GitHub.
3. Khi thành viên khác clone hoặc pull repo, mọi tài liệu và trạng thái task đều đồng bộ.
`;
}

// Commit 1 file lên GitHub
async function commitFileToGitHub(
  owner: string,
  repo: string,
  filePath: string,
  content: string,
  token: string,
  message: string,
  branch?: string,
): Promise<{ ok: boolean; sha?: string; error?: string }> {
  try {
    let sha: string | undefined;
    const getUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}${branch ? `?ref=${encodeURIComponent(branch)}` : ""}`;
    const getRes = await fetch(getUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
      cache: "no-store",
    });

    if (getRes.ok) {
      const existing = await getRes.json();
      sha = existing.sha;
    }

    const putRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          content: Buffer.from(content).toString("base64"),
          sha,
          branch,
        }),
      },
    );

    if (!putRes.ok) {
      const errData = await putRes.json().catch(() => ({}));
      return {
        ok: false,
        error: errData.message || `GitHub status ${putRes.status}`,
      };
    }

    const putData = await putRes.json();
    return { ok: true, sha: putData.content?.sha };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

// GET: Kiểm tra và lấy thông tin trạng thái .gitvn của repo
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  const branch = searchParams.get("branch") || undefined;

  if (!owner || !repo) {
    return NextResponse.json(
      { error: "Thiếu owner hoặc repo" },
      { status: 400 },
    );
  }

  const token = await getAuthToken();
  const isCurrentWorkspaceRepo = repo.toLowerCase() === "gitvn";

  // 1. Kiểm tra trên GitHub nếu có token
  if (token) {
    try {
      const checkRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/.gitvn${branch ? `?ref=${encodeURIComponent(branch)}` : ""}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
          },
          cache: "no-store",
        },
      );

      if (checkRes.ok) {
        const contents = await checkRes.json();
        const items = Array.isArray(contents) ? contents : [contents];
        const hasConfig = items.some((item) => item.name === "config.json");
        const hasTasks = items.some(
          (item) => item.name === "tasks.json" || item.name === "jira.json",
        );

        // Đọc nội dung config.json nếu có
        let config: GitvnConfig | null = null;
        if (hasConfig) {
          try {
            const configRes = await fetch(
              `https://api.github.com/repos/${owner}/${repo}/contents/.gitvn/config.json${branch ? `?ref=${encodeURIComponent(branch)}` : ""}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  Accept: "application/vnd.github.raw",
                },
                cache: "no-store",
              },
            );
            if (configRes.ok) {
              config = await configRes.json();
            }
          } catch {
            // bỏ qua lỗi parse
          }
        }

        // Lấy danh sách tài liệu từ thư mục docs/ nếu có
        const docsList: GitvnDocItem[] = [];
        try {
          const docsRes = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/contents/.gitvn/docs${branch ? `?ref=${encodeURIComponent(branch)}` : ""}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github+json",
              },
              cache: "no-store",
            },
          );
          if (docsRes.ok) {
            const docFiles = await docsRes.json();
            if (Array.isArray(docFiles)) {
              for (const f of docFiles) {
                if (f.name.endsWith(".md") || f.name.endsWith(".mdx")) {
                  // Đọc nội dung text raw
                  let content = "";
                  try {
                    const cRes = await fetch(f.download_url || f.url, {
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    if (cRes.ok) content = await cRes.text();
                  } catch {}

                  const headingMatch = content.match(/^#\s+(.+)$/m);
                  const docTitle =
                    f.name === "index.mdx"
                      ? "Tổng quan dự án"
                      : f.name === "architecture.mdx"
                        ? "Kiến trúc hệ thống"
                        : headingMatch
                          ? headingMatch[1].trim()
                          : f.name;

                  docsList.push({
                    id: f.name.replace(/\.[^/.]+$/, ""),
                    name: f.name,
                    path: f.path,
                    title: docTitle,
                    content,
                  });
                }
              }
            }
          }
        } catch {}

        return NextResponse.json<GitvnRepoStatus>({
          hasGitvn: true,
          hasConfig: Boolean(config),
          hasTasks,
          hasDocs: docsList.length > 0,
          config: config || createDefaultConfig(repo),
          docs: docsList,
          source: "github",
        });
      }
    } catch {
      // Tiếp tục fallback kiểm tra local
    }
  }

  // 2. Fallback: Kiểm tra trên hệ thống file local
  try {
    const configPath = path.join(LOCAL_GITVN_DIR, "config.json");
    const tasksPath = path.join(LOCAL_GITVN_DIR, "tasks.json");
    const docsDir = path.join(LOCAL_GITVN_DIR, "docs");

    let hasLocalConfig = false;
    let localConfig: GitvnConfig | null = null;
    let hasLocalTasks = false;
    const docsList: GitvnDocItem[] = [];

    try {
      const configRaw = await fs.readFile(configPath, "utf-8");
      localConfig = JSON.parse(configRaw);
      hasLocalConfig = true;
    } catch {}

    try {
      await fs.access(tasksPath);
      hasLocalTasks = true;
    } catch {}

    try {
      const files = await fs.readdir(docsDir);
      for (const fileName of files) {
        if (fileName.endsWith(".md") || fileName.endsWith(".mdx")) {
          const filePath = path.join(docsDir, fileName);
          const content = await fs.readFile(filePath, "utf-8");
          const headingMatch = content.match(/^#\s+(.+)$/m);
          const docTitle =
            fileName === "index.mdx"
              ? "Tổng quan dự án"
              : fileName === "architecture.mdx"
                ? "Kiến trúc hệ thống"
                : headingMatch
                  ? headingMatch[1].trim()
                  : fileName;

          docsList.push({
            id: fileName.replace(/\.[^/.]+$/, ""),
            name: fileName,
            path: `.gitvn/docs/${fileName}`,
            title: docTitle,
            content,
          });
        }
      }
    } catch {}

    if (
      isCurrentWorkspaceRepo &&
      (hasLocalConfig || hasLocalTasks || docsList.length > 0)
    ) {
      return NextResponse.json<GitvnRepoStatus>({
        hasGitvn: true,
        hasConfig: hasLocalConfig,
        hasTasks: hasLocalTasks,
        hasDocs: docsList.length > 0,
        config: localConfig || createDefaultConfig(repo),
        docs: docsList,
        source: "local",
      });
    }
  } catch {}

  // 3. Không tìm thấy .gitvn
  return NextResponse.json<GitvnRepoStatus>({
    hasGitvn: false,
    hasConfig: false,
    hasTasks: false,
    hasDocs: false,
    source: "none",
  });
}

// POST: Khởi tạo .gitvn chuẩn hoặc lưu tài liệu / config
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, owner, repo, branch, docName, docContent, config } = body;

    if (!owner || !repo) {
      return NextResponse.json(
        { error: "Thiếu owner hoặc repo" },
        { status: 400 },
      );
    }

    const token = await getAuthToken();
    const user = await getAuthUser();
    const currentUserLogin = user?.login || "admin";

    // ACTION: KHỞI TẠO .gitvn CHUẨN (INITIALIZE)
    if (action === "init") {
      const defaultConfig = createDefaultConfig(repo);
      const defaultTasks = createDefaultTasks(owner, repo, currentUserLogin);
      const defaultIndexDoc = createDefaultDocIndex(repo);
      const defaultArchDoc = createDefaultDocArchitecture(repo);

      // 1. Lưu vào thư mục local .gitvn
      await fs.mkdir(LOCAL_GITVN_DIR, { recursive: true });
      await fs.mkdir(path.join(LOCAL_GITVN_DIR, "docs"), { recursive: true });

      await fs.writeFile(
        path.join(LOCAL_GITVN_DIR, "config.json"),
        JSON.stringify(defaultConfig, null, 2),
        "utf-8",
      );
      await fs.writeFile(
        path.join(LOCAL_GITVN_DIR, "tasks.json"),
        JSON.stringify(defaultTasks, null, 2),
        "utf-8",
      );
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

      // 2. Commit lên GitHub nếu có token
      let syncedToGitHub = false;
      const errors: string[] = [];

      if (token) {
        const commitMsg = `chore(gitvn): initialize canonical .gitvn workspace`;
        const resConfig = await commitFileToGitHub(
          owner,
          repo,
          ".gitvn/config.json",
          JSON.stringify(defaultConfig, null, 2),
          token,
          `${commitMsg} config`,
          branch,
        );
        const resTasks = await commitFileToGitHub(
          owner,
          repo,
          ".gitvn/tasks.json",
          JSON.stringify(defaultTasks, null, 2),
          token,
          `${commitMsg} tasks`,
          branch,
        );
        const resIndex = await commitFileToGitHub(
          owner,
          repo,
          ".gitvn/docs/index.mdx",
          defaultIndexDoc,
          token,
          `${commitMsg} docs index`,
          branch,
        );
        const resArch = await commitFileToGitHub(
          owner,
          repo,
          ".gitvn/docs/architecture.mdx",
          defaultArchDoc,
          token,
          `${commitMsg} docs architecture`,
          branch,
        );

        syncedToGitHub =
          resConfig.ok && resTasks.ok && resIndex.ok && resArch.ok;
        if (!syncedToGitHub) {
          if (!resConfig.ok) errors.push(`config: ${resConfig.error}`);
          if (!resTasks.ok) errors.push(`tasks: ${resTasks.error}`);
        }
      }

      return NextResponse.json({
        success: true,
        message: "Khởi tạo cấu trúc .gitvn chuẩn thành công!",
        syncedToGitHub,
        errors: errors.length > 0 ? errors : undefined,
        config: defaultConfig,
        tasks: defaultTasks,
      });
    }

    // ACTION: LƯU / CẬP NHẬT TÀI LIỆU MDX
    if (action === "save-doc" || action === "saveDoc") {
      const targetDocName = docName || body.filename;
      const targetDocContent =
        docContent !== undefined ? docContent : body.content;

      if (!targetDocName || typeof targetDocContent !== "string") {
        return NextResponse.json(
          { error: "Thiếu tên hoặc nội dung tài liệu" },
          { status: 400 },
        );
      }

      const safeDocName =
        targetDocName.endsWith(".mdx") || targetDocName.endsWith(".md")
          ? targetDocName
          : `${targetDocName}.mdx`;
      const docsDir = path.join(LOCAL_GITVN_DIR, "docs");
      await fs.mkdir(docsDir, { recursive: true });
      await fs.writeFile(
        path.join(docsDir, safeDocName),
        targetDocContent,
        "utf-8",
      );

      let syncedToGitHub = false;
      let error: string | undefined;

      if (token) {
        const commitRes = await commitFileToGitHub(
          owner,
          repo,
          `.gitvn/docs/${safeDocName}`,
          targetDocContent,
          token,
          `docs(gitvn): update .gitvn/docs/${safeDocName}`,
          branch,
        );
        syncedToGitHub = commitRes.ok;
        error = commitRes.error;
      }

      return NextResponse.json({
        success: true,
        file: `.gitvn/docs/${safeDocName}`,
        syncedToGitHub,
        error,
      });
    }

    // ACTION: LƯU CẤU HÌNH CONFIG.JSON
    if (action === "save-config") {
      if (!config) {
        return NextResponse.json(
          { error: "Thiếu dữ liệu config" },
          { status: 400 },
        );
      }

      const configStr = JSON.stringify(config, null, 2);
      await fs.mkdir(LOCAL_GITVN_DIR, { recursive: true });
      await fs.writeFile(
        path.join(LOCAL_GITVN_DIR, "config.json"),
        configStr,
        "utf-8",
      );

      let syncedToGitHub = false;
      let error: string | undefined;

      if (token) {
        const commitRes = await commitFileToGitHub(
          owner,
          repo,
          ".gitvn/config.json",
          configStr,
          token,
          `chore(gitvn): update .gitvn/config.json`,
          branch,
        );
        syncedToGitHub = commitRes.ok;
        error = commitRes.error;
      }

      return NextResponse.json({
        success: true,
        syncedToGitHub,
        error,
      });
    }

    return NextResponse.json(
      { error: "Hành động không hợp lệ" },
      { status: 400 },
    );
  } catch (err: any) {
    console.error("Lỗi API /api/gitvn:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
