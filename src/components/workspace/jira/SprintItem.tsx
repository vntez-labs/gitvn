"use client";

import {
  ActionIcon,
  Avatar,
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
  Tooltip,
} from "@mantine/core";
import {
  IconCalendar,
  IconCheck,
  IconDotsVertical,
  IconFlame,
  IconGripVertical,
  IconPlayerPlay,
  IconPlus,
} from "@tabler/icons-react";
import type { JiraSprint, JiraTask, SprintStatus } from "@/interfaces/jira";
import { getGitHubAvatarUrl } from "@/lib/avatar";
import { getStoryPointsForTask } from "@/lib/jira-priority";

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

export function SprintItem({
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
      radius="md"
      onDragOver={(e) => onDragOver(e, sprint.id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, sprint.id)}
      style={{
        border: `2px ${isDragOver ? "dashed #fb291a" : "solid " + (isActive ? "#ffc5be" : "#e2e8f0")}`,
        backgroundColor: isDragOver ? "#fff1f0" : "#ffffff",
        boxShadow: isActive
          ? "0 4px 12px rgba(251, 41, 26, 0.06)"
          : "0 1px 3px rgba(0, 0, 0, 0.04)",
        transition: "all 0.15s ease",
        userSelect: "none",
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

          <Text fw={700} fz={16} c="#0f172a">
            {sprint.name}
          </Text>

          <Badge
            size="sm"
            variant="light"
            color={isActive ? "vntez" : isCompleted ? "green" : "gray"}
          >
            {isActive
              ? "ĐANG CHẠY"
              : isCompleted
                ? "ĐÃ HOÀN THÀNH"
                : "KẾ HOẠCH"}
          </Badge>

          {sprint.startDate && sprint.endDate && (
            <Group gap={4} fz={12} c="#64748b">
              <IconCalendar size={14} />
              <span>
                {sprint.startDate} → {sprint.endDate}
              </span>
            </Group>
          )}
        </Group>

        <Group gap="xs" wrap="nowrap" align="center">
          <Badge size="sm" variant="outline" color="vntez">
            {donePoints}/{totalPoints} SP
          </Badge>
          <Badge size="sm" variant="light" color="gray">
            {doneTasks.length}/{sprintTasks.length} việc
          </Badge>

          {canManageSprint && (
            <>
              {isPlanned && (
                <Button
                  size="xs"
                  color="teal"
                  variant="light"
                  radius="md"
                  leftSection={<IconPlayerPlay size={13} />}
                  onClick={() => onUpdateSprintStatus(sprint.id, "active")}
                  style={{ fontWeight: 600 }}
                >
                  Bắt đầu Sprint
                </Button>
              )}

              {isActive && (
                <Button
                  size="xs"
                  color="vntez"
                  variant="filled"
                  radius="md"
                  leftSection={<IconCheck size={13} />}
                  onClick={() => onUpdateSprintStatus(sprint.id, "completed")}
                  style={{ fontWeight: 600 }}
                >
                  Hoàn thành Sprint
                </Button>
              )}

              {isCompleted && (
                <Button
                  size="xs"
                  color="gray"
                  variant="subtle"
                  radius="md"
                  leftSection={<IconFlame size={13} />}
                  onClick={() => onUpdateSprintStatus(sprint.id, "active")}
                  style={{ fontWeight: 600 }}
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
          sprintTasks.map((t) => {
            const isSelected = selectedTaskIds.includes(t.id);
            const prio = PRIORITY_BADGE[t.priority] || PRIORITY_BADGE.medium;

            return (
              <Paper
                key={t.id}
                px="md"
                py={10}
                bg={isSelected ? "#fff1f0" : "#ffffff"}
                radius="sm"
                draggable
                onDragStart={(e) => onDragStart(e, t.id)}
                style={{
                  border: `1px solid ${isSelected ? "#fb291a" : "#e2e8f0"}`,
                  cursor: "grab",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transition: "all 0.12s ease",
                  userSelect: "none",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = "#f8fafc";
                    e.currentTarget.style.borderColor = "#ffc5be";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = "#ffffff";
                    e.currentTarget.style.borderColor = "#e2e8f0";
                  }
                }}
                onClick={() => onSelectTask(t)}
              >
                <Group gap="sm" style={{ flex: 1, minWidth: 0 }}>
                  <IconGripVertical
                    size={15}
                    color="#94a3b8"
                    style={{ cursor: "grab", flexShrink: 0 }}
                  />

                  <Checkbox
                    size="xs"
                    color="vntez"
                    checked={isSelected}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => onToggleSelectTask(t.id)}
                    aria-label={`Chọn task ${t.id}`}
                  />

                  <Text
                    fz={12.5}
                    fw={700}
                    c="#fb291a"
                    ff="var(--font-geist-mono), monospace"
                    style={{ flexShrink: 0 }}
                  >
                    {t.id}
                  </Text>

                  <Text fz={14} fw={600} c="#0f172a" truncate>
                    {t.title}
                  </Text>
                </Group>

                <Group gap="xs" style={{ flexShrink: 0, userSelect: "none" }}>
                  {/* Avatar Người thực hiện với getGitHubAvatarUrl */}
                  <Tooltip
                    label={`Người thực hiện: ${t.assignee?.name || t.assignee?.login || "Chưa gán"}`}
                    withArrow
                  >
                    <Avatar
                      src={getGitHubAvatarUrl(t.assignee, 48)}
                      size={22}
                      radius="xl"
                      style={{
                        border: "1px solid #cbd5e1",
                        backgroundColor: "#fff1f0",
                        color: "#fb291a",
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    >
                      {t.assignee?.login?.slice(0, 2).toUpperCase() || "?"}
                    </Avatar>
                  </Tooltip>

                  <Badge
                    size="xs"
                    variant="dot"
                    color={prio.color}
                    styles={{ root: { textTransform: "none" } }}
                  >
                    {prio.label}
                  </Badge>

                  <Badge
                    size="xs"
                    variant="light"
                    color={
                      t.status === "done"
                        ? "green"
                        : t.status === "in_progress"
                          ? "yellow"
                          : t.status === "review"
                            ? "grape"
                            : "blue"
                    }
                  >
                    {t.status.toUpperCase()}
                  </Badge>

                  <Badge size="xs" variant="outline" color="gray">
                    {getStoryPointsForTask(t)} SP
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
                      <Menu.Dropdown
                        bg="#ffffff"
                        style={{ borderColor: "#e2e8f0" }}
                      >
                        <Menu.Label fz={11}>Chuyển sang Sprint</Menu.Label>
                        <Menu.Item
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveTaskToSprint(t.id, null);
                          }}
                        >
                          📦 Về Backlog
                        </Menu.Item>
                        {allSprints
                          .filter((s) => s.id !== sprint.id)
                          .map((s) => (
                            <Menu.Item
                              key={s.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                onMoveTaskToSprint(t.id, s.id);
                              }}
                            >
                              🏃 {s.name}
                            </Menu.Item>
                          ))}
                      </Menu.Dropdown>
                    </Menu>
                  )}
                </Group>
              </Paper>
            );
          })
        )}
      </Stack>
    </Paper>
  );
}
