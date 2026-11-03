import type { TaskStatus } from "@/interfaces/jira";

export interface KanbanColumnDef {
  status: TaskStatus;
  title: string;
  color: string;
}

export const DEFAULT_KANBAN_COLUMNS: KanbanColumnDef[] = [
  { status: "todo", title: "To Do", color: "#3b82f6" },
  { status: "in_progress", title: "In Progress", color: "#eab308" },
  { status: "review", title: "In Review", color: "#a855f7" },
  { status: "done", title: "Done", color: "#22c55e" },
];
