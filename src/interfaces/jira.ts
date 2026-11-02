export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "backlog" | "todo" | "in_progress" | "review" | "done";

export interface TaskAssignee {
  login: string;
  name?: string;
  avatar_url?: string;
}

export interface JiraTask {
  id: string; // e.g. "GITVN-1"
  title: string;
  description: string; // Markdown supported
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: TaskAssignee;
  reporter: TaskAssignee;
  sprintId: string | null; // null = Backlog
  storyPoints?: number;
  createdAt: string;
  updatedAt: string;
}

export type SprintStatus = "planned" | "active" | "completed";

export interface JiraSprint {
  id: string;
  name: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
  status: SprintStatus;
  createdAt: string;
}

export type ProjectRole = "admin" | "pm" | "member" | "viewer";

export interface ProjectPermissions {
  // Mapping username => role
  userRoles: Record<string, ProjectRole>;
  // Default role cho người dùng mới
  defaultRole: ProjectRole;
  // Danh sách role có quyền tạo/quản lý Sprint
  canManageSprint: ProjectRole[];
  // Danh sách role có quyền tạo/sắp xếp Backlog
  canCreateBacklog: ProjectRole[];
}

export interface JiraBoardData {
  owner: string;
  repo: string;
  taskSeq: number; // Đếm số thứ tự task, ví dụ 1, 2, 3...
  tasks: JiraTask[];
  sprints: JiraSprint[];
  permissions: ProjectPermissions;
}
