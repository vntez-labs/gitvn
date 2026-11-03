"use client";

import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Group,
  Text,
  Tooltip,
} from "@mantine/core";
import { IconGitPullRequest, IconSparkles } from "@tabler/icons-react";
import { memo, useState } from "react";
import { copyTaskAIPrompt } from "@/lib/ai-prompt";
import { getGitHubAvatarUrl } from "@/lib/avatar";
import { getStoryPointsForTask } from "@/lib/jira-priority";
import type { JiraTask, TaskPriority } from "@/interfaces/jira";

interface KanbanCardProps {
  task: JiraTask;
  index: number;
  onClick: (task: JiraTask) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDropOnCard?: (e: React.DragEvent, targetIndex: number) => void;
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

export const KanbanCard = memo(function KanbanCard({
  task,
  index,
  onClick,
  onDragStart,
  onDropOnCard,
  canDrag,
}: KanbanCardProps) {
  const [dropPos, setDropPos] = useState<"top" | "bottom" | null>(null);
  const prio = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const assigneeName = task.assignee?.name || task.assignee?.login;

  const handleDragOver = (e: React.DragEvent) => {
    if (!canDrag || !onDropOnCard) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const pos = e.clientY < midY ? "top" : "bottom";
    if (dropPos !== pos) {
      setDropPos(pos);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    setDropPos(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!canDrag || !onDropOnCard) return;
    e.preventDefault();
    e.stopPropagation();
    const targetIdx = dropPos === "bottom" ? index + 1 : index;
    setDropPos(null);
    onDropOnCard(e, targetIdx);
  };

  return (
    <Box
      draggable={canDrag}
      onDragStart={(e) => onDragStart(e, task.id)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => onClick(task)}
      p={12}
      style={{
        position: "relative",
        backgroundColor: "#ffffff",
        border: "1px solid #e4e4e7",
        borderRadius: 8,
        cursor: canDrag ? "grab" : "pointer",
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
        transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
        userSelect: "none",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#d4d4d8";
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow = "0 3px 6px rgba(0, 0, 0, 0.05)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#e4e4e7";
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = "0 1px 2px rgba(0, 0, 0, 0.04)";
      }}
    >
      {/* Vị trí hiển thị Drop Indicator khi kéo thả để chọn chính xác thứ tự */}
      {dropPos === "top" && (
        <Box
          style={{
            position: "absolute",
            top: -5,
            left: 2,
            right: 2,
            height: 3,
            backgroundColor: "#dc2626",
            borderRadius: 2,
            zIndex: 10,
            pointerEvents: "none",
          }}
        />
      )}
      {dropPos === "bottom" && (
        <Box
          style={{
            position: "absolute",
            bottom: -5,
            left: 2,
            right: 2,
            height: 3,
            backgroundColor: "#dc2626",
            borderRadius: 2,
            zIndex: 10,
            pointerEvents: "none",
          }}
        />
      )}
      {/* Header: Key & Story Points */}
      <Group justify="space-between" mb={8} wrap="nowrap">
        <Group gap={6} align="center" wrap="nowrap">
          <Text
            fz={11.5}
            fw={500}
            c="#a1a1aa"
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
                color={task.status === "done" ? "teal" : "gray"}
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
                    fontWeight: 500,
                  },
                }}
              >
                PR #{task.pullNumber}
              </Badge>
            </Tooltip>
          )}
        </Group>

        <Group gap={4} wrap="nowrap">
          <Tooltip label="1-Click Copy Prompt AI cho Cursor/Claude" withArrow>
            <ActionIcon
              size="xs"
              variant="subtle"
              color="gray"
              onClick={(e) => {
                e.stopPropagation();
                copyTaskAIPrompt(task);
              }}
            >
              <IconSparkles size={13} color="#a1a1aa" />
            </ActionIcon>
          </Tooltip>

          <Badge
            size="xs"
            variant="outline"
            style={{
              borderColor: "#e4e4e7",
              color: "#52525b",
              backgroundColor: "#f4f4f5",
              fontFamily: "monospace",
              fontSize: 10,
              padding: "2px 6px",
              height: 18,
            }}
          >
            {getStoryPointsForTask(task)} SP
          </Badge>
        </Group>
      </Group>

      {/* Title */}
      <Text
        fz={13.5}
        fw={500}
        c="#27272a"
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
});
