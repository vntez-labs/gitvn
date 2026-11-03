import type { JiraBoardData, JiraSprint, JiraTask } from "@/interfaces/jira";
export {
  LATEST_GITVN_VERSION,
  createDefaultConfig,
  configToYaml,
  parseGitvnConfig,
  detectOutdated,
} from "./gitvn-config";

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
├── config.yml          # Cấu hình v2.0 (hoặc config.json tương thích cũ)
├── tasks/              # Kiến trúc File rời chống xung đột Git Merge Conflicts (SSOT)
│   ├── PROJ-1.md       # Task chi tiết dạng Markdown + Frontmatter (hoặc PROJ-1.json)
│   ├── PROJ-2.md
│   └── ...
├── tasks.json          # File cache tổng hợp (tương thích ngược)
└── docs/               # Thư mục chứa tài liệu dự án (.md / .mdx)
    ├── index.mdx       # Tổng quan dự án
    └── architecture.mdx# Kiến trúc kỹ thuật
\`\`\`

---

## 2. Giải pháp chống Xung đột Git (Merge Conflicts) với Kiến trúc File Rời

* **Vấn đề**: Khi team 4–5 người hoặc nhiều AI Agents cùng làm việc trên các branch khác nhau, cùng kéo thả task hoặc cập nhật mô tả task, việc merge branch sẽ gây ra conflict JSON liên tục nếu dùng 1 file \`tasks.json\` tập trung.
* **Cách khắc phục**: Lưu trữ dạng file rời (tương tự Astro / Docusaurus content collections). Mỗi task là 1 file riêng biệt \`.gitvn/tasks/{TASK_ID}.md\` hoặc \`.gitvn/tasks/{TASK_ID}.json\`. Khi đó mỗi người sửa một task sẽ **không bao giờ chạm vào file của nhau**, merge branch hoàn toàn an toàn và trơn tru.

### Quy chuẩn Task File dạng Markdown (\`.gitvn/tasks/PROJ-1.md\`):

\`\`\`markdown
---
id: PROJ-1
title: "Khởi tạo dự án & cấu hình môi trường"
status: in_progress
priority: high
assignee: octocat
reporter: admin
sprintId: sprint-1
storyPoints: 3
createdAt: 2026-11-03T00:00:00.000Z
updatedAt: 2026-11-03T00:00:00.000Z
---

### Mục tiêu
- Thiết lập thư mục \`.gitvn/\` theo chuẩn Git-Native.
- Phân chia công việc và kết nối CI/CD.

### Acceptance Criteria
- [x] Cấu hình file rời trong \`.gitvn/tasks/\`
- [ ] Build dự án thành công không lỗi
\`\`\`

---

## 3. Quy chuẩn Schema File \`.gitvn/tasks.json\` (Tổng hợp)

\`\`\`json
{
  "owner": "tên_owner_hoặc_org",
  "repo": "tên_repository",
  "taskSeq": 10,
  "tasks": [
    {
      "id": "PROJ-1",
      "title": "Tiêu đề công việc ngắn gọn",
      "description": "Mô tả chi tiết bằng Markdown...",
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

### Git-Agile Automation (Đồng bộ PR với Kanban):
* Khi có PR đang mở (\`state: "open"\`) liên kết với Task ID trong tiêu đề hoặc nhánh: Task \`"in_progress"\` tự động chuyển sang \`"review"\` kèm badge PR.
* Khi PR được merge (\`merged_at\`): Task \`"review"\` tự động chuyển sang \`"done"\`.
`;
}

// Mẫu prompt chuẩn cho người dùng copy gửi AI sinh Task Kanban
export const AI_TASKS_PROMPT_TEMPLATE = `Bạn là một Technical Product Manager và Agile Scrum Master chuyên nghiệp.
Hãy phân tích yêu cầu phần mềm / tài liệu PRD dưới đây và sinh cấu trúc Task Kanban cho GitVN theo đúng quy chuẩn sau:
1. Đầu ra CHỈ TRẢ VỀ DUY NHẤT 1 JSON object hợp lệ (dùng để import hoặc lưu vào .gitvn/tasks/ và .gitvn/tasks.json).
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
6. Khi làm việc đa nhánh (multi-branch), ưu tiên lưu từng task thành file rời .gitvn/tasks/{ID}.md để tránh Git Merge Conflicts.

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
