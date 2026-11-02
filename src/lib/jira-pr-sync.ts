import type { JiraBoardData, JiraTask, TaskStatus } from "@/interfaces/jira";

export interface GitHubPullItem {
  number: number;
  title: string;
  body?: string | null;
  state: "open" | "closed" | string;
  merged_at?: string | null;
  html_url: string;
  head?: {
    ref: string;
  };
}

export interface TaskPrSyncChange {
  taskId: string;
  taskTitle: string;
  fromStatus: TaskStatus;
  toStatus: TaskStatus;
  prNumber: number;
  prTitle: string;
  reason: string;
}

export interface PrSyncResult {
  updatedBoard: JiraBoardData;
  hasChanges: boolean;
  changes: TaskPrSyncChange[];
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Kiểm tra xem Pull Request có liên kết với Task hay không
 * Dựa trên:
 * 1. task.pullNumber trùng với pr.number
 * 2. task.branch trùng với pr.head.ref
 * 3. task.id xuất hiện trong pr.head.ref, pr.title, hoặc pr.body
 */
export function isPrLinkedToTask(task: JiraTask, pr: GitHubPullItem): boolean {
  if (task.pullNumber && task.pullNumber === pr.number) {
    return true;
  }

  const headRef = pr.head?.ref || "";
  if (
    task.branch &&
    headRef &&
    task.branch.toLowerCase() === headRef.toLowerCase()
  ) {
    return true;
  }

  if (!task.id) return false;

  // Tìm task.id trong nhánh, tiêu đề hoặc nội dung PR (không phân biệt hoa thường, ranh giới từ)
  const escapedId = escapeRegExp(task.id);
  const regex = new RegExp(`(^|[^a-zA-Z0-9])${escapedId}([^a-zA-Z0-9]|$)`, "i");

  if (headRef && regex.test(headRef)) return true;
  if (pr.title && regex.test(pr.title)) return true;
  if (pr.body && regex.test(pr.body)) return true;

  return false;
}

/**
 * Quét toàn bộ Task và Pull Requests để đồng bộ trạng thái:
 * - Nếu có PR đang Open mà task đang là "in_progress" (hoặc "todo") -> chuyển sang "review"
 * - Nếu PR đã Merged mà task đang là "review" (hoặc "in_progress") -> chuyển sang "done"
 */
export function syncBoardTasksWithPulls(
  boardData: JiraBoardData,
  pulls: GitHubPullItem[],
): PrSyncResult {
  if (!boardData?.tasks || !pulls || pulls.length === 0) {
    return { updatedBoard: boardData, hasChanges: false, changes: [] };
  }

  const changes: TaskPrSyncChange[] = [];
  const updatedTasks: JiraTask[] = boardData.tasks.map((task) => {
    // Tìm các PR liên kết với task này, ưu tiên PR đang Open trước, sau đó là PR đã Merged
    const matchingPulls = pulls.filter((pr) => isPrLinkedToTask(task, pr));
    if (matchingPulls.length === 0) return task;

    const openPr = matchingPulls.find((p) => p.state === "open");
    const mergedPr = matchingPulls.find((p) => Boolean(p.merged_at));

    let newStatus: TaskStatus | null = null;
    let relevantPr: GitHubPullItem | null = null;
    let reason = "";

    // Ưu tiên 1: Đã Merged -> Chuyển sang Done
    if (
      mergedPr &&
      (task.status === "review" || task.status === "in_progress")
    ) {
      newStatus = "done";
      relevantPr = mergedPr;
      reason = `Pull Request #${mergedPr.number} đã được Merge thành công`;
    }
    // Ưu tiên 2: Đang Open -> Nếu task đang "in_progress" hoặc "todo" thì chuyển sang "review"
    else if (
      openPr &&
      (task.status === "in_progress" || task.status === "todo")
    ) {
      newStatus = "review";
      relevantPr = openPr;
      reason = `Có Pull Request #${openPr.number} ("${openPr.title}") đang mở`;
    }

    if (newStatus && relevantPr && newStatus !== task.status) {
      changes.push({
        taskId: task.id,
        taskTitle: task.title,
        fromStatus: task.status,
        toStatus: newStatus,
        prNumber: relevantPr.number,
        prTitle: relevantPr.title,
        reason,
      });

      return {
        ...task,
        status: newStatus,
        pullNumber: relevantPr.number,
        pullUrl: relevantPr.html_url,
        branch: task.branch || relevantPr.head?.ref,
        updatedAt: new Date().toISOString(),
      };
    }

    // Nếu không thay đổi status nhưng có PR liên kết, lưu lại pullNumber và pullUrl nếu chưa có
    const bestPr = openPr || mergedPr || matchingPulls[0];
    if (bestPr && (!task.pullNumber || !task.pullUrl)) {
      return {
        ...task,
        pullNumber: bestPr.number,
        pullUrl: bestPr.html_url,
        branch: task.branch || bestPr.head?.ref,
      };
    }

    return task;
  });

  const hasChanges = changes.length > 0;
  const updatedBoard: JiraBoardData = hasChanges
    ? { ...boardData, tasks: updatedTasks }
    : boardData;

  return {
    updatedBoard,
    hasChanges,
    changes,
  };
}
