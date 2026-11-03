import YAML from "yaml";
import type { GitvnConfig } from "@/interfaces/gitvn";

export const LATEST_GITVN_VERSION = "2.0.0";

/**
 * Tạo cấu hình mặc định theo quy chuẩn v2.0.0 với storage decoupled
 */
export function createDefaultConfig(repo: string): GitvnConfig {
  return {
    version: LATEST_GITVN_VERSION,
    name: repo,
    description: `Cấu hình chuẩn GitVN Workspace v2 cho ${repo}`,
    storage: {
      format: "decoupled",
      tasks_dir: ".gitvn/tasks",
      docs_dir: ".gitvn/docs",
    },
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

/**
 * Xuất GitvnConfig sang định dạng YAML
 */
export function configToYaml(config: GitvnConfig): string {
  const header = `# GitVN Workspace Configuration Schema v${config.version || LATEST_GITVN_VERSION}\n# Single Source of Truth (SSOT) for Agile Kanban, Sprints & Docs\n`;
  const yamlContent = YAML.stringify(config, { indent: 2 });
  return `${header}\n${yamlContent}`;
}

/**
 * Parse nội dung YAML hoặc JSON sang GitvnConfig
 */
export function parseGitvnConfig(
  raw: string,
  isYaml = true,
): GitvnConfig | null {
  try {
    if (!raw || !raw.trim()) return null;
    if (isYaml) {
      return YAML.parse(raw) as GitvnConfig;
    }
    return JSON.parse(raw) as GitvnConfig;
  } catch (err) {
    console.warn("[parseGitvnConfig error]:", err);
    return null;
  }
}

/**
 * Kiểm tra xem repo có đang dùng quy chuẩn cũ (outdated) không
 */
export function detectOutdated(
  config?: GitvnConfig | null,
  hasDecoupledTasks = false,
  hasTasksJson = false,
): { isOutdated: boolean; reason?: string } {
  // Chưa có config hoặc config dưới v2.0.0
  if (!config) {
    if (hasTasksJson && !hasDecoupledTasks) {
      return {
        isOutdated: true,
        reason:
          "Dự án sử dụng file tập trung tasks.json mà chưa có config.yml và thư mục .gitvn/tasks/.",
      };
    }
    return { isOutdated: false };
  }

  const ver = config.version || "1.0.0";
  if (ver !== LATEST_GITVN_VERSION) {
    return {
      isOutdated: true,
      reason: `Phiên bản cấu hình hiện tại (v${ver}) cũ hơn quy chuẩn mới nhất (v${LATEST_GITVN_VERSION}).`,
    };
  }

  // Nếu là v2 nhưng storage không phải decoupled hoặc chưa có thư mục tasks
  if (
    config.storage?.format !== "decoupled" &&
    hasTasksJson &&
    !hasDecoupledTasks
  ) {
    return {
      isOutdated: true,
      reason:
        "Dự án chưa chuyển đổi sang kiến trúc file rời .gitvn/tasks/*.md chống xung đột Git.",
    };
  }

  return { isOutdated: false };
}
