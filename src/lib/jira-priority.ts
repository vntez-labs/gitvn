import type { TaskPriority } from "@/interfaces/jira";

export const PRIORITY_TO_POINTS: Record<TaskPriority, number> = {
  urgent: 8,
  high: 5,
  medium: 3,
  low: 1,
};

export const PRIORITY_OPTIONS = [
  { value: "urgent", label: "🔴 Khẩn cấp (Urgent) — 8 SP" },
  { value: "high", label: "🟠 Cao (High) — 5 SP" },
  { value: "medium", label: "🔵 Trung bình (Medium) — 3 SP" },
  { value: "low", label: "⚪ Thấp (Low) — 1 SP" },
];

export function pointsToPriority(points: number): TaskPriority {
  if (points >= 8) return "urgent";
  if (points >= 5) return "high";
  if (points >= 2) return "medium";
  return "low";
}

export function getStoryPointsForTask(
  task?: {
    storyPoints?: number;
    priority?: TaskPriority;
  } | null,
): number {
  if (!task) return 3;
  if (typeof task.storyPoints === "number" && task.storyPoints > 0) {
    return task.storyPoints;
  }
  if (task.priority && PRIORITY_TO_POINTS[task.priority]) {
    return PRIORITY_TO_POINTS[task.priority];
  }
  return 3;
}
