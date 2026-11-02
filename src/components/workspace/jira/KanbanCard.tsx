"use client";

import { Avatar, Badge, Box, Group, Text, Tooltip } from "@mantine/core";
import { IconGitPullRequest } from "@tabler/icons-react";
import { getGitHubAvatarUrl } from "@/lib/avatar";
import { getStoryPointsForTask } from "@/lib/jira-priority";
import type { JiraTask, TaskPriority } from "@/interfaces/jira";

interface KanbanCardProps {
  task: JiraTask;
  onClick: (task: JiraTask) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  canDrag: boolean;
}

const PRIORITY_CONFIG: Record<
  TaskPriority,
  { bg: string; text: string; dot: string; label: string }
> = {
  urgent: {
    bg: "#fee2e2",
    text: "#dc2626",
    dot: "#ef4444",
    label: "Urgent",
  },
  high: {
    bg: "#fef3c7",
    text: "#d97706",
    dot: "#f59e0b",
    label: "High",
  },
  medium: {
    bg: "#eff6ff",
    text: "#2563eb",
    dot: "#3b82f6",
    label: "Medium",
  },
  low: {
    bg: "#f1f5f9",
    text: "#475569",
    dot: "#64748b",
    label: "Low",
  },
};

export function KanbanCard({
  task,
  onClick,
  onDragStart,
  canDrag,
}: KanbanCardProps) {
  const prio = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const assigneeName = task.assignee?.name || task.assignee?.login;

  return (
    <Box
      draggable={canDrag}
      onDragStart={(e) => onDragStart(e, task.id)}
      onClick={() => onClick(task)}
      p={12}
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 8,
        cursor: canDrag ? "grab" : "pointer",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
        transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
        userSelect: "none",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#ffc5be";
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 6px 14px rgba(251, 41, 26, 0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#e2e8f0";
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.05)";
      }}
    >
      {/* Header: Key & Story Points */}
      <Group justify="space-between" mb={8} wrap="nowrap">
        <Group gap={6} align="center" wrap="nowrap">
          <Text
            fz={11.5}
            fw={700}
            c="#fb291a"
            ff="var(--font-geist-mono), monospace"
          >
            {task.id}
          </Text>

          {task.pullNumber && (
            <Tooltip
              label={`Mở Pull Request #${task.pullNumber} trên GitHub`}
              withArrow
            >
              <Badge
                size="xs"
                variant="outline"
                color={task.status === "done" ? "teal" : "violet"}
                leftSection={<IconGitPullRequest size={10} />}
                component="a"
                href={task.pullUrl || "#"}
                target="_blank"
                onClick={(e) => e.stopPropagation()}
                styles={{
                  root: {
                    cursor: "pointer",
                    textTransform: "none",
                    height: 18,
                    padding: "0 6px",
                    fontWeight: 600,
                  },
                }}
              >
                PR #{task.pullNumber}
              </Badge>
            </Tooltip>
          )}
        </Group>

        <Badge
          size="xs"
          variant="light"
          color="gray"
          styles={{
            root: {
              fontWeight: 600,
              fontSize: 10,
              padding: "2px 6px",
              height: 18,
            },
          }}
        >
          {getStoryPointsForTask(task)} SP
        </Badge>
      </Group>

      {/* Title */}
      <Text
        fz={13.5}
        fw={600}
        c="#0f172a"
        lineClamp={2}
        mb={12}
        lh={1.45}
        style={{ letterSpacing: "-0.01em" }}
      >
        {task.title}
      </Text>

      {/* Footer: Priority Pill & Assignee */}
      <Group justify="space-between" align="center" wrap="nowrap">
        <Group
          gap={5}
          px={8}
          py={2}
          style={{
            backgroundColor: prio.bg,
            borderRadius: 12,
            border: `1px solid ${prio.dot}33`,
          }}
        >
          <Box
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: prio.dot,
            }}
          />
          <Text fz={11} fw={600} c={prio.text}>
            {prio.label}
          </Text>
        </Group>

        {task.assignee ? (
          <Tooltip label={`Người thực hiện: ${assigneeName}`} withArrow>
            <Avatar
              src={getGitHubAvatarUrl(task.assignee, 48)}
              size={22}
              radius="xl"
              style={{
                border: "1px solid #e2e8f0",
                fontSize: 10,
                fontWeight: 700,
                backgroundColor: "#fff1f0",
                color: "#fb291a",
              }}
            >
              {assigneeName?.slice(0, 2).toUpperCase() || "VN"}
            </Avatar>
          </Tooltip>
        ) : (
          <Tooltip label="Chưa có người nhận task" withArrow>
            <Box
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                border: "1px dashed #cbd5e1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                color: "#94a3b8",
              }}
            >
              ?
            </Box>
          </Tooltip>
        )}
      </Group>
    </Box>
  );
}
