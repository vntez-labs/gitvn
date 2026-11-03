import { notifications } from "@mantine/notifications";
import type { JiraTask } from "@/interfaces/jira";

/**
 * Tạo prompt tối ưu hóa cho AI Coding Assistants (Cursor, Copilot, Claude, GPT-4o)
 */
export function generateTaskAIPrompt(
  task: JiraTask,
  repoName?: string,
  branch?: string,
): string {
  const points =
    typeof task.storyPoints === "number" ? task.storyPoints : "Chưa ước lượng";
  const assignee =
    task.assignee?.name || task.assignee?.login || "Chưa phân công";

  return `### BỐI CẢNH DỰ ÁN & NHIỆM VỤ CẦN THỰC HIỆN
Dự án: ${repoName || "Dự án hiện tại"} (Nhánh: ${branch || "main"})
Mã task: ${task.id}
Tiêu đề: ${task.title}
Trạng thái: ${task.status.toUpperCase()} | Mức ưu tiên: ${task.priority.toUpperCase()} | Story Points: ${points}
Người phụ trách: ${assignee}

---

### YÊU CẦU CHI TIẾT (SPECIFICATION / ACCEPTANCE CRITERIA)
${task.description?.trim() || "Thực hiện theo tiêu đề công việc nêu trên."}

---

### HƯỚNG DẪN THỰC THI CHO AI (CURSOR / CLAUDE / COPILOT):
1. Phân tích kỹ yêu cầu và cấu trúc codebase hiện tại trước khi sinh mã.
2. Viết mã nguồn sạch (clean code), chuẩn TypeScript/type-safe, tuân thủ các quy tắc hiện có trong repo.
3. Không làm ảnh hưởng đến các module khác ngoài phạm vi của task ${task.id}.
4. Bổ sung unit test hoặc kiểm tra các trường hợp biên (edge cases) nếu cần thiết.`;
}

/**
 * Tiện ích 1-click sao chép prompt AI vào clipboard kèm thông báo
 */
export async function copyTaskAIPrompt(
  task: JiraTask,
  repoName?: string,
  branch?: string,
) {
  const prompt = generateTaskAIPrompt(task, repoName, branch);
  try {
    await navigator.clipboard.writeText(prompt);
    notifications.show({
      title: "Đã sao chép Prompt AI!",
      message: `Prompt cho task [${task.id}] đã sẵn sàng để dán vào Cursor / Claude / Copilot`,
      color: "grape",
    });
    return true;
  } catch (err) {
    console.error("Lỗi copy clipboard:", err);
    return false;
  }
}
