"use client";

import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Checkbox,
  Group,
  Menu,
  Paper,
  Progress,
  Stack,
  Text,
} from "@mantine/core";
import {
  IconCalendar,
  IconCheck,
  IconDotsVertical,
  IconFlame,
  IconPlayerPlay,
  IconPlus,
} from "@tabler/icons-react";
import { memo } from "react";
import type { JiraSprint, JiraTask, SprintStatus } from "@/interfaces/jira";
import { getStoryPointsForTask } from "@/lib/jira-priority";
import { TaskRowItem } from "./TaskRowItem";

export const PRIORITY_BADGE = {
  urgent: { color: "red", label: "Khẩn cấp" },
  high: { color: "orange", label: "Cao" },
  medium: { color: "blue", label: "Trung bình" },
  low: { color: "gray", label: "Thấp" },
};

interface SprintItemProps {
  sprint: JiraSprint;
  sprintTasks: JiraTask[];
  allSprints: JiraSprint[];
  selectedTaskIds: string[];
  isDragOver: boolean;
  canManageSprint: boolean;
  onSelectTask: (task: JiraTask) => void;
  onOpenCreateTask: (sprintId: string) => void;
  onUpdateSprintStatus: (sprintId: string, status: SprintStatus) => void;
  onMoveTaskToSprint: (taskId: string, targetSprintId: string | null) => void;
  onToggleSelectTask: (taskId: string) => void;
  onToggleSelectAllSprint: (tasks: JiraTask[]) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDragOver: (e: React.DragEvent, sprintId: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, sprintId: string) => void;
}

export const SprintItem = memo(function SprintItem({
  sprint,
  sprintTasks,
  allSprints,
  selectedTaskIds,
  isDragOver,
  canManageSprint,
  onSelectTask,
  onOpenCreateTask,
  onUpdateSprintStatus,
  onMoveTaskToSprint,
  onToggleSelectTask,
  onToggleSelectAllSprint,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
}: SprintItemProps) {
  const totalPoints = sprintTasks.reduce(
    (sum, t) => sum + getStoryPointsForTask(t),
    0,
  );
  const doneTasks = sprintTasks.filter((t) => t.status === "done");
  const donePoints = doneTasks.reduce(
    (sum, t) => sum + getStoryPointsForTask(t),
    0,
  );
  const progressPercent =
    sprintTasks.length > 0
      ? Math.round((doneTasks.length / sprintTasks.length) * 100)
      : 0;

  const isCompleted = sprint.status === "completed";
  const isActive = sprint.status === "active";
  const isPlanned = sprint.status === "planned";

  const sprintTaskIds = sprintTasks.map((t) => t.id);
  const allSprintTasksSelected =
    sprintTaskIds.length > 0 &&
    sprintTaskIds.every((id) => selectedTaskIds.includes(id));
  const someSprintTasksSelected =
    sprintTaskIds.some((id) => selectedTaskIds.includes(id)) &&
    !allSprintTasksSelected;

  return (
    <Paper
      key={sprint.id}
      p="md"
      bg="#ffffff"
      radius="lg"
      onDragOver={(e) => onDragOver(e, sprint.id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, sprint.id)}
      style={{
        border: isDragOver ? "2px dashed #dc2626" : "1px solid #e4e4e7",
        borderLeft: isDragOver
          ? "2px dashed #dc2626"
          : isActive
            ? "4px solid #dc2626"
            : "1px solid #e4e4e7",
        backgroundColor: isDragOver ? "#fef2f2" : "#ffffff",
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
        transition: "all 0.15s ease",
        userSelect: "none",
        borderRadius: 12,
      }}
    >
      {/* Sprint Header */}
      <Group
        justify="space-between"
        mb="sm"
        wrap="nowrap"
        align="center"
        style={{ userSelect: "none" }}
      >
        <Group gap="sm" wrap="nowrap" align="center">
          {sprintTasks.length > 0 && (
            <Checkbox
              size="xs"
              checked={allSprintTasksSelected}
              indeterminate={someSprintTasksSelected}
              onChange={() => onToggleSelectAllSprint(sprintTasks)}
              aria-label="Chọn tất cả task trong Sprint"
            />
          )}

          <Text fw={700} fz={15} c="#18181b">
            {sprint.name}
          </Text>

          <Badge
            size="xs"
            variant="outline"
            style={{
              backgroundColor: isActive
                ? "#fef2f2"
                : isCompleted
                  ? "#f0fdf4"
                  : "#f4f4f5",
              color: isActive ? "#b91c1c" : isCompleted ? "#15803d" : "#52525b",
              borderColor: isActive
                ? "#fecaca"
                : isCompleted
                  ? "#bbf7d0"
                  : "#e4e4e7",
              borderRadius: 9999,
              fontWeight: 600,
              padding: "2px 8px",
            }}
          >
            {isActive
              ? "ĐANG CHẠY"
              : isCompleted
                ? "ĐÃ HOÀN THÀNH"
                : "KẾ HOẠCH"}
          </Badge>

          {sprint.startDate && sprint.endDate && (
            <Group gap={4} fz={12} c="#71717a">
              <IconCalendar size={14} />
              <span>
                {sprint.startDate} → {sprint.endDate}
              </span>
            </Group>
          )}
        </Group>

        <Group gap="xs" wrap="nowrap" align="center">
          <Badge
            size="xs"
            variant="outline"
            style={{
              backgroundColor: "#f4f4f5",
              borderColor: "#e4e4e7",
              color: "#52525b",
              fontFamily: "monospace",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {donePoints}/{totalPoints} SP
          </Badge>
          <Badge
            size="xs"
            variant="outline"
            style={{
              backgroundColor: "#f4f4f5",
              borderColor: "#e4e4e7",
              color: "#52525b",
              fontSize: 11,
            }}
          >
            {doneTasks.length}/{sprintTasks.length} việc
          </Badge>

          {canManageSprint && (
            <>
              {isPlanned && (
                <Button
                  size="xs"
                  variant="default"
                  leftSection={<IconPlayerPlay size={13} color="#15803d" />}
                  onClick={() => onUpdateSprintStatus(sprint.id, "active")}
                  styles={{
                    root: {
                      backgroundColor: "#ffffff",
                      borderColor: "#d4d4d8",
                      color: "#3f3f46",
                      fontWeight: 500,
                      borderRadius: 8,
                      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                    },
                  }}
                >
                  Bắt đầu Sprint
                </Button>
              )}

              {isActive && (
                <Button
                  size="xs"
                  variant="default"
                  leftSection={<IconCheck size={13} color="#dc2626" />}
                  onClick={() => onUpdateSprintStatus(sprint.id, "completed")}
                  styles={{
                    root: {
                      backgroundColor: "#ffffff",
                      borderColor: "#d4d4d8",
                      color: "#3f3f46",
                      fontWeight: 500,
                      borderRadius: 8,
                      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                    },
                  }}
                >
                  Hoàn thành Sprint
                </Button>
              )}

              {isCompleted && (
                <Button
                  size="xs"
                  variant="default"
                  leftSection={<IconFlame size={13} color="#71717a" />}
                  onClick={() => onUpdateSprintStatus(sprint.id, "active")}
                  styles={{
                    root: {
                      backgroundColor: "#ffffff",
                      borderColor: "#d4d4d8",
                      color: "#3f3f46",
                      fontWeight: 500,
                      borderRadius: 8,
                      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                    },
                  }}
                >
                  Mở lại
                </Button>
              )}

              <Menu shadow="md" width={180} position="bottom-end">
                <Menu.Target>
                  <ActionIcon size="sm" variant="subtle" color="gray">
                    <IconDotsVertical size={14} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown bg="#ffffff" style={{ borderColor: "#e2e8f0" }}>
                  <Menu.Item
                    leftSection={<IconPlus size={14} />}
                    onClick={() => onOpenCreateTask(sprint.id)}
                  >
                    Thêm task vào Sprint
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </>
          )}
        </Group>
      </Group>

      {/* Sprint Goal & Progress */}
      {sprint.goal && (
        <Text fz={13} c="#64748b" mb="xs">
          🎯 <strong>Mục tiêu:</strong> {sprint.goal}
        </Text>
      )}

      <Progress
        value={progressPercent}
        size={6}
        radius="xl"
        color={isCompleted ? "green" : "vntez"}
        mb="md"
      />

      {/* Danh sách Tasks trong Sprint */}
      <Stack gap={6}>
        {sprintTasks.length === 0 ? (
          <Box
            py={28}
            ta="center"
            style={{
              border: "2px dashed #cbd5e1",
              borderRadius: 8,
              backgroundColor: isDragOver ? "#fff1f0" : "#f8fafc",
              userSelect: "none",
            }}
          >
            <Text fz={13} fw={500} c="#64748b">
              Kéo thả công việc từ Backlog hoặc các Sprint khác vào đây
            </Text>
          </Box>
        ) : (
          sprintTasks.map((t) => (
            <TaskRowItem
              key={t.id}
              task={t}
              isSelected={selectedTaskIds.includes(t.id)}
              sprints={allSprints}
              canManageSprint={canManageSprint}
              onSelectTask={onSelectTask}
              onToggleSelectTask={onToggleSelectTask}
              onDragStart={onDragStart}
              onMoveTaskToSprint={onMoveTaskToSprint}
              currentSprintId={sprint.id}
            />
          ))
        )}
      </Stack>
    </Paper>
  );
});
