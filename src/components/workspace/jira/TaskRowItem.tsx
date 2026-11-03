"use client";

import {
  ActionIcon,
  Avatar,
  Badge,
  Checkbox,
  Group,
  Menu,
  Paper,
  Text,
  Tooltip,
} from "@mantine/core";
import { IconDotsVertical, IconGripVertical } from "@tabler/icons-react";
import { memo } from "react";
import type { JiraSprint, JiraTask } from "@/interfaces/jira";
import { getGitHubAvatarUrl } from "@/lib/avatar";
import { getStoryPointsForTask } from "@/lib/jira-priority";
import { PRIORITY_BADGE } from "./SprintItem";

interface TaskRowItemProps {
  task: JiraTask;
  isSelected: boolean;
  sprints: JiraSprint[];
  canManageSprint: boolean;
  onSelectTask: (task: JiraTask) => void;
  onToggleSelectTask: (taskId: string) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onMoveTaskToSprint: (taskId: string, targetSprintId: string | null) => void;
  currentSprintId?: string | null;
}

export const TaskRowItem = memo(function TaskRowItem({
  task,
  isSelected,
  sprints,
  canManageSprint,
  onSelectTask,
  onToggleSelectTask,
  onDragStart,
  onMoveTaskToSprint,
  currentSprintId = null,
}: TaskRowItemProps) {
  const prio = PRIORITY_BADGE[task.priority] || PRIORITY_BADGE.medium;

  return (
    <Paper
      key={task.id}
      px="md"
      py={9}
      bg={isSelected ? "#fef2f2" : "#ffffff"}
      radius="md"
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      style={{
        border: `1px solid ${isSelected ? "#dc2626" : "#e4e4e7"}`,
        cursor: "grab",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        transition: "all 0.12s ease",
        userSelect: "none",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = "#fafafa";
          e.currentTarget.style.borderColor = "#d4d4d8";
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = "#ffffff";
          e.currentTarget.style.borderColor = "#e4e4e7";
        }
      }}
      onClick={() => onSelectTask(task)}
    >
      <Group gap="sm" style={{ flex: 1, minWidth: 0 }}>
        <IconGripVertical
          size={14}
          color="#a1a1aa"
          style={{ cursor: "grab", flexShrink: 0 }}
        />

        <Checkbox
          size="xs"
          color="red"
          checked={isSelected}
          onClick={(e) => e.stopPropagation()}
          onChange={() => onToggleSelectTask(task.id)}
          aria-label={`Chọn task ${task.id}`}
        />

        <Text
          fz={12}
          fw={600}
          c="#71717a"
          ff="var(--font-geist-mono), monospace"
          style={{ flexShrink: 0 }}
        >
          {task.id}
        </Text>

        <Text fz={13.5} fw={500} c="#27272a" truncate>
          {task.title}
        </Text>
      </Group>

      <Group gap="xs" style={{ flexShrink: 0, userSelect: "none" }}>
        {/* Avatar Người thực hiện với getGitHubAvatarUrl */}
        <Tooltip
          label={`Người thực hiện: ${task.assignee?.name || task.assignee?.login || "Chưa gán"}`}
          withArrow
        >
          <Avatar
            src={getGitHubAvatarUrl(task.assignee, 48)}
            size={22}
            radius="xl"
            style={{
              border: "1px solid #e4e4e7",
              backgroundColor: "#f4f4f5",
              color: "#52525b",
              fontSize: 10,
              fontWeight: 600,
            }}
          >
            {task.assignee?.login?.slice(0, 2).toUpperCase() || "?"}
          </Avatar>
        </Tooltip>

        <Badge
          size="xs"
          variant="outline"
          style={{
            backgroundColor:
              task.priority === "urgent"
                ? "#fef2f2"
                : task.priority === "high"
                  ? "#fffbeb"
                  : "#f4f4f5",
            color:
              task.priority === "urgent"
                ? "#b91c1c"
                : task.priority === "high"
                  ? "#b45309"
                  : "#52525b",
            borderColor:
              task.priority === "urgent"
                ? "#fecaca"
                : task.priority === "high"
                  ? "#fde68a"
                  : "#e4e4e7",
            borderRadius: 9999,
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          {prio.label}
        </Badge>

        <Badge
          size="xs"
          variant="outline"
          style={{
            backgroundColor: "#f4f4f5",
            borderColor: "#e4e4e7",
            color: "#52525b",
            fontFamily: "monospace",
            fontSize: 11,
          }}
        >
          {getStoryPointsForTask(task)} SP
        </Badge>

        {canManageSprint && (
          <Menu shadow="sm" position="bottom-end">
            <Menu.Target>
              <ActionIcon
                size="xs"
                variant="subtle"
                color="gray"
                onClick={(e) => e.stopPropagation()}
              >
                <IconDotsVertical size={13} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown bg="#ffffff" style={{ borderColor: "#e4e4e7" }}>
              <Menu.Label fz={11}>Chuyển sang</Menu.Label>
              {currentSprintId !== null && (
                <Menu.Item
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveTaskToSprint(task.id, null);
                  }}
                >
                  📦 Về Backlog
                </Menu.Item>
              )}
              {sprints
                .filter((s) => s.id !== currentSprintId)
                .map((s) => (
                  <Menu.Item
                    key={s.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveTaskToSprint(task.id, s.id);
                    }}
                  >
                    🎯 {s.name}
                  </Menu.Item>
                ))}
            </Menu.Dropdown>
          </Menu>
        )}
      </Group>
    </Paper>
  );
});
