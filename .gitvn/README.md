# 🤖 GitVN Workspace — Quy chuẩn Cấu trúc Dữ liệu & AI Prompting Guide

> **Dành cho AI Agents (Cursor, Claude, ChatGPT, Gemini, Copilot, Antigravity) và Developers**:  
> Thư mục `.gitvn/` là Single Source of Truth (SSOT) cho toàn bộ quy trình Agile Sprint, Kanban Task Board và Tài liệu Kỹ thuật (Docs) được lưu trữ theo chuẩn Git-Native.

---

## 1. Cấu trúc thư mục `.gitvn/`

```bash
.gitvn/
├── README.md           # Tài liệu quy chuẩn này (dành cho AI & Developers)
├── config.json         # Cấu hình tính năng & danh sách các cột Kanban
├── tasks.json          # Toàn bộ Task, Sprint và Phân quyền thành viên (SSOT)
└── docs/               # Thư mục chứa tài liệu dự án (.md / .mdx)
    ├── index.mdx       # Tổng quan dự án
    └── architecture.mdx# Kiến trúc kỹ thuật
```

---

## 2. Quy chuẩn Schema File `.gitvn/tasks.json`

File `.gitvn/tasks.json` lưu trữ toàn bộ công việc theo mô hình Agile/Scrum. Khi AI sinh hoặc sửa file này, **BẮT BUỘC** phải tuân thủ đúng định dạng JSON sau:

```json
{
  "owner": "tên_owner_hoặc_org",
  "repo": "tên_repository",
  "taskSeq": 10,
  "tasks": [
    {
      "id": "TASK-1",
      "title": "Tiêu đề công việc ngắn gọn, rõ ràng",
      "description": "Mô tả chi tiết bằng Markdown, bao gồm mục tiêu, giải pháp và Acceptance Criteria.",
      "status": "todo",
      "priority": "high",
      "assignee": {
        "login": "octocat",
        "name": "The Octocat",
        "avatar_url": "https://avatars.githubusercontent.com/u/583231"
      },
      "reporter": {
        "login": "admin_username",
        "name": "Admin"
      },
      "sprintId": "sprint-1",
      "storyPoints": 3,
      "createdAt": "2026-11-02T12:00:00.000Z",
      "updatedAt": "2026-11-02T12:00:00.000Z"
    }
  ],
  "sprints": [
    {
      "id": "sprint-1",
      "name": "Sprint 1 - Nền tảng & Cấu trúc",
      "goal": "Hoàn thiện kiến trúc cơ bản và luồng xác thực",
      "startDate": "2026-11-01",
      "endDate": "2026-11-14",
      "status": "active",
      "createdAt": "2026-11-01T00:00:00.000Z"
    }
  ],
  "permissions": {
    "userRoles": {
      "username1": "admin",
      "username2": "member"
    },
    "defaultRole": "member",
    "canManageSprint": ["admin", "pm"],
    "canCreateBacklog": ["admin", "pm", "member"]
  }
}
```

### Các ràng buộc giá trị (Enum Constraints)
* **`status`** (Bắt buộc): Chỉ được là một trong các giá trị sau:
  * `"backlog"`: Nằm trong danh sách chờ, chưa đưa vào sprint.
  * `"todo"`: Đã sẵn sàng thực hiện trong Sprint.
  * `"in_progress"`: Đang tiến hành làm.
  * `"review"`: Đang code review hoặc chờ QA duyệt.
  * `"done"`: Đã hoàn thành và nghiệm thu.
* **`priority`** (Bắt buộc): Chỉ gồm 4 mức:
  * `"low"`, `"medium"`, `"high"`, `"urgent"`
* **`sprintId`**:
  * Nếu task thuộc một sprint cụ thể: điền `id` của sprint đó (vd: `"sprint-1"`).
  * Nếu task nằm trong **Backlog**: đặt giá trị là `null`.
* **`sprints[].status`**:
  * `"planned"`: Sprint dự kiến trong tương lai.
  * `"active"`: Sprint đang chạy hiện tại.
  * `"completed"`: Sprint đã hoàn thành.
* **`storyPoints`**: Số nguyên hoặc float (vd: `1`, `2`, `3`, `5`, `8`, `13`).
* **`taskSeq`**: Số nguyên đếm tăng dần mã ID công việc (vd: task cuối cùng là `TASK-10` thì `taskSeq` là `11`).

---

## 3. Quy chuẩn Schema Tài liệu `.gitvn/docs`

Khi nhập xuất hàng loạt tài liệu (Bulk Docs Import/Export) dưới dạng JSON, cấu trúc chuẩn:

```json
{
  "version": "1.0.0",
  "repo": "tên_repo",
  "exportedAt": "2026-11-02T12:00:00.000Z",
  "docs": [
    {
      "filename": "architecture.mdx",
      "title": "Kiến trúc Kỹ thuật",
      "content": "# Kiến trúc Kỹ thuật\n\nNội dung chi tiết viết bằng chuẩn Markdown / MDX..."
    },
    {
      "filename": "api-spec.mdx",
      "title": "Đặc tả REST API",
      "content": "# Đặc tả REST API\n\nDanh sách các endpoint..."
    }
  ]
}
```

---

## 4. Prompt Mẫu dành cho AI để sinh dữ liệu JSON chuẩn

Khi làm việc với các LLM (ChatGPT, Claude, Cursor Composer...), hãy copy đoạn prompt dưới đây:

### Prompt sinh Task Kanban (`.gitvn/tasks.json`):
```text
Bạn là một Technical Product Manager và Agile Scrum Master chuyên nghiệp.
Hãy phân tích yêu cầu phần mềm / tài liệu PRD dưới đây và sinh file JSON cấu trúc cho GitVN theo đúng quy chuẩn sau:
1. Đầu ra chỉ trả về duy nhất 1 JSON object hợp lệ, không bọc markdown hay chú thích thừa.
2. Cấu trúc JSON phải chứa đầy đủ 2 mảng: "tasks" và "sprints".
3. "status" của task chỉ được là: "todo", "in_progress", "review", "done", "backlog".
4. "priority" của task chỉ được là: "low", "medium", "high", "urgent".
5. ID task có định dạng [MÃ_DỰ_ÁN]-[SỐ], ví dụ: "PROJ-1", "PROJ-2".
6. Mỗi task có storyPoints (1, 2, 3, 5, 8) và mô tả chi tiết bằng Markdown gồm Mục tiêu, Tiêu chí hoàn thành (Acceptance Criteria).
7. "sprints" chứa ít nhất 1 sprint đang "active".

[DÁN YÊU CẦU DỰ ÁN / TÍNH NĂNG TẠI ĐÂY]
```

### Prompt sinh Bộ Tài liệu (`.gitvn/docs`):
```text
Bạn là một Software Architect và Technical Writer chuyên nghiệp.
Hãy tạo bộ tài liệu kỹ thuật chuẩn cho dự án phần mềm dưới đây dưới dạng JSON để import trực tiếp vào GitVN:
1. Đầu ra chỉ trả về duy nhất 1 JSON object hợp lệ với cấu trúc:
   {
     "version": "1.0.0",
     "docs": [
       {
         "filename": "tên-file.mdx",
         "title": "Tiêu đề tài liệu",
         "content": "# Tiêu đề\n\nNội dung Markdown chi tiết..."
       }
     ]
   }
2. Tạo tối thiểu 3 tài liệu: 
   - "architecture.mdx": Sơ đồ kiến trúc, luồng dữ liệu, công nghệ.
   - "api-spec.mdx": Danh sách API endpoints, request, response.
   - "database.mdx": Thiết kế Schema cơ sở dữ liệu, các bảng và quan hệ.

[DÁN MÔ TẢ DỰ ÁN TẠI ĐÂY]
```
