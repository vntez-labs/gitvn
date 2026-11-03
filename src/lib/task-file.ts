import type { JiraTask } from "@/interfaces/jira";

/**
 * Chuyển đổi một JiraTask sang định dạng Markdown kèm YAML Frontmatter
 * để lưu trữ dạng file rời (.gitvn/tasks/TASK-ID.md) chống xung đột Git.
 */
export function taskToMarkdown(task: JiraTask): string {
  const frontmatter = [
    "---",
    `id: ${task.id}`,
    `title: ${JSON.stringify(task.title)}`,
    `status: ${task.status}`,
    `priority: ${task.priority}`,
    task.assignee?.login ? `assignee: ${task.assignee.login}` : null,
    task.reporter?.login ? `reporter: ${task.reporter.login}` : null,
    task.sprintId ? `sprintId: ${task.sprintId}` : null,
    typeof task.storyPoints === "number"
      ? `storyPoints: ${task.storyPoints}`
      : null,
    task.createdAt ? `createdAt: ${task.createdAt}` : null,
    task.updatedAt ? `updatedAt: ${task.updatedAt}` : null,
    "---",
  ]
    .filter(Boolean)
    .join("\n");

  const body = (task.description || "").trim();
  return `${frontmatter}\n\n${body}\n`;
}

/**
 * Parse nội dung Markdown kèm Frontmatter thành JiraTask
 */
export function parseTaskMarkdown(
  content: string,
  fallbackId: string,
): JiraTask {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  const now = new Date().toISOString();

  if (!match) {
    return {
      id: fallbackId,
      title: fallbackId,
      description: content.trim(),
      status: "todo",
      priority: "medium",
      reporter: { login: "admin", name: "Admin" },
      sprintId: null,
      createdAt: now,
      updatedAt: now,
    };
  }

  const yamlBlock = match[1];
  const body = match[2].trim();
  const fields: Record<string, string> = {};

  yamlBlock.split(/\r?\n/).forEach((line) => {
    const idx = line.indexOf(":");
    if (idx > 0) {
      const key = line.slice(0, idx).trim();
      let val = line.slice(idx + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      fields[key] = val;
    }
  });

  return {
    id: fields.id || fallbackId,
    title: fields.title || fallbackId,
    description: body,
    status: (fields.status as any) || "todo",
    priority: (fields.priority as any) || "medium",
    assignee: fields.assignee
      ? { login: fields.assignee, name: fields.assignee }
      : undefined,
    reporter: fields.reporter
      ? { login: fields.reporter, name: fields.reporter }
      : { login: "admin", name: "Admin" },
    sprintId: fields.sprintId || null,
    storyPoints: fields.storyPoints
      ? parseInt(fields.storyPoints, 10)
      : undefined,
    createdAt: fields.createdAt || now,
    updatedAt: fields.updatedAt || now,
  };
}
