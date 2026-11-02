import type { GitvnConfig } from "@/interfaces/gitvn";
import type { JiraBoardData, JiraSprint, JiraTask } from "@/interfaces/jira";

// Cấu hình config.json mặc định
export function createDefaultConfig(repo: string): GitvnConfig {
  return {
    version: "1.0.0",
    name: repo,
    description: `Cấu hình chuẩn GitVN Workspace cho ${repo}`,
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
  };
}

// Dữ liệu tasks.json mặc định
export function createDefaultTasks(
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
      title: "Thiết kế kiến trúc hệ thống và luồng dữ liệu",
      description: `Xem chi tiết trong tài liệu \`.gitvn/docs/architecture.mdx\`\n\n- Xác định các module cốt lõi\n- Định nghĩa API contracts`,
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
    taskSeq: 3,
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

export function createDefaultDocIndex(repo: string): string {
  return `# Tài liệu Dự án ${repo}

Chào mừng bạn đến với tài liệu hướng dẫn được quản lý bởi **GitVN** trực tiếp trong thư mục \`.gitvn/docs\`.

> [!NOTE]
> Tài liệu này được đồng bộ trực tiếp với GitHub và được cập nhật theo thời gian thực.

## 🚀 Các tính năng chính

- **Kanban Board tích hợp**: Quản lý task theo quy chuẩn: \`Backlog\`, \`To Do\`, \`In Progress\`, \`In Review\`, \`Done\`.
- **Live MDX Docs**: Hỗ trợ Markdown nâng cao, Callouts, Bảng biểu và Code syntax highlighting.
- **Git Native**: Mọi thay đổi đều được lưu thành các commit chuẩn trong repository.
`;
}

export function createDefaultDocArchitecture(repo: string): string {
  return `# Kiến trúc Kỹ thuật - ${repo}

Tài liệu mô tả chi tiết kiến trúc và luồng xử lý dữ liệu của dự án.

> [!TIP]
> Bạn có thể chỉnh sửa file này trực tiếp từ tab **Docs (MDX)** và nhấn nút **Lưu & Đồng bộ lên GitHub**.
`;
}

// File README.md SSOT cho AI và Developers
export function createDefaultReadme(): string {
  return `# 🤖 GitVN Workspace — Quy chuẩn Cấu trúc Dữ liệu & AI Prompting Guide

> **Dành cho AI Agents (Cursor, Claude, ChatGPT, Gemini, Copilot, Antigravity) và Developers**:
> Thư mục \`.gitvn/\` là Single Source of Truth (SSOT) cho toàn bộ quy trình Agile Sprint, Kanban Task Board và Tài liệu Kỹ thuật (Docs) được lưu trữ theo chuẩn Git-Native.

---

## 1. Cấu trúc thư mục \`.gitvn/\`

\`\`\`bash
.gitvn/
├── README.md           # Tài liệu quy chuẩn này (dành cho AI & Developers)
├── config.json         # Cấu hình tính năng & danh sách các cột Kanban
├── tasks.json          # Toàn bộ Task, Sprint và Phân quyền thành viên (SSOT)
└── docs/               # Thư mục chứa tài liệu dự án (.md / .mdx)
    ├── index.mdx       # Tổng quan dự án
    └── architecture.mdx# Kiến trúc kỹ thuật
\`\`\`

---

## 2. Quy chuẩn Schema File \`.gitvn/tasks.json\`

\`\`\`json
{
  "owner": "tên_owner_hoặc_org",
  "repo": "tên_repository",
  "taskSeq": 10,
  "tasks": [
    {
      "id": "TASK-1",
      "title": "Tiêu đề công việc ngắn gọn",
      "description": "Mô tả chi tiết bằng Markdown, bao gồm mục tiêu và Acceptance Criteria.",
      "status": "todo",
      "priority": "high",
      "assignee": { "login": "octocat", "name": "The Octocat" },
      "reporter": { "login": "admin", "name": "Admin" },
      "sprintId": "sprint-1",
      "storyPoints": 3,
      "createdAt": "2026-11-02T12:00:00.000Z",
      "updatedAt": "2026-11-02T12:00:00.000Z"
    }
  ],
  "sprints": [
    {
      "id": "sprint-1",
      "name": "Sprint 1 - Nền tảng",
      "goal": "Hoàn thiện kiến trúc cơ bản",
      "startDate": "2026-11-01",
      "endDate": "2026-11-14",
      "status": "active",
      "createdAt": "2026-11-01T00:00:00.000Z"
    }
  ]
}
\`\`\`

### Enum Constraints:
* **status**: \`"backlog" | "todo" | "in_progress" | "review" | "done"\`
* **priority**: \`"low" | "medium" | "high" | "urgent"\`
* **sprintId**: chuỗi sprint ID (vd: \`"sprint-1"\`) hoặc \`null\` nếu là Backlog.
* **sprints[].status**: \`"planned" | "active" | "completed"\`
`;
}

// Mẫu prompt chuẩn cho người dùng copy gửi AI sinh Task Kanban
export const AI_TASKS_PROMPT_TEMPLATE = `Bạn là một Technical Product Manager và Agile Scrum Master chuyên nghiệp.
Hãy phân tích yêu cầu phần mềm / tài liệu PRD dưới đây và sinh file JSON cấu trúc cho GitVN theo đúng quy chuẩn sau:
1. Đầu ra CHỈ TRẢ VỀ DUY NHẤT 1 JSON object hợp lệ, không bọc markdown hay chú thích thừa.
2. Cấu trúc JSON phải chứa đầy đủ 2 mảng: "tasks" và "sprints":
{
  "tasks": [
    {
      "id": "PROJ-1",
      "title": "Tiêu đề việc ngắn gọn",
      "description": "Mô tả chi tiết Markdown (Mục tiêu, Acceptance Criteria)",
      "status": "todo",
      "priority": "high",
      "sprintId": "sprint-1",
      "storyPoints": 3
    }
  ],
  "sprints": [
    {
      "id": "sprint-1",
      "name": "Sprint 1 - Khởi động",
      "goal": "Mục tiêu sprint",
      "startDate": "2026-11-01",
      "endDate": "2026-11-14",
      "status": "active"
    }
  ]
}
3. "status" của task CHỈ ĐƯỢC LÀ: "todo", "in_progress", "review", "done", "backlog".
4. "priority" của task CHỈ ĐƯỢC LÀ: "low", "medium", "high", "urgent".
5. Mỗi task có storyPoints (1, 2, 3, 5, 8).

[DÁN YÊU CẦU DỰ ÁN / TÍNH NĂNG TẠI ĐÂY]`;

// Mẫu prompt chuẩn cho người dùng copy gửi AI sinh Bộ Docs
export const AI_DOCS_PROMPT_TEMPLATE = `Bạn là một Software Architect và Technical Writer chuyên nghiệp.
Hãy tạo bộ tài liệu kỹ thuật chuẩn cho dự án phần mềm dưới đây dưới dạng JSON để import trực tiếp vào GitVN:
1. Đầu ra CHỈ TRẢ VỀ DUY NHẤT 1 JSON object hợp lệ:
{
  "version": "1.0.0",
  "docs": [
    {
      "filename": "architecture.mdx",
      "title": "Kiến trúc Kỹ thuật",
      "content": "# Kiến trúc Kỹ thuật\\n\\nSơ đồ kiến trúc, luồng xử lý..."
    },
    {
      "filename": "api-spec.mdx",
      "title": "Đặc tả API",
      "content": "# Đặc tả API\\n\\nDanh sách endpoints, payload..."
    }
  ]
}
2. Tạo tối thiểu các tài liệu: "architecture.mdx", "api-spec.mdx", "database.mdx".

[DÁN MÔ TẢ DỰ ÁN TẠI ĐÂY]`;
