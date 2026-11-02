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
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import {
  IconDotsVertical,
  IconGripVertical,
  IconInbox,
  IconPlus,
} from "@tabler/icons-react";
import { useMemo, useState } from "react";
import type { JiraSprint, JiraTask, SprintStatus } from "@/interfaces/jira";
import { getGitHubAvatarUrl } from "@/lib/avatar";
import { getStoryPointsForTask } from "@/lib/jira-priority";
import { FloatingBulkActionBar } from "./FloatingBulkActionBar";
import { PRIORITY_BADGE, SprintItem } from "./SprintItem";

interface BacklogViewProps {
  sprints: JiraSprint[];
  tasks: JiraTask[];
  onSelectTask: (task: JiraTask) => void;
  onOpenCreateTask: (defaultSprintId?: string | null) => void;
  onOpenCreateSprint: () => void;
  onUpdateSprintStatus: (sprintId: string, status: SprintStatus) => void;
  onMoveTaskToSprint: (taskId: string, targetSprintId: string | null) => void;
  onBulkMoveTasks?: (taskIds: string[], targetSprintId: string | null) => void;
  onBulkDeleteTasks?: (taskIds: string[]) => void;
  canManageSprint: boolean;
  canCreateBacklog: boolean;
}

export function BacklogView({
  sprints,
  tasks,
  onSelectTask,
  onOpenCreateTask,
  onOpenCreateSprint,
  onUpdateSprintStatus,
  onMoveTaskToSprint,
  onBulkMoveTasks,
  onBulkDeleteTasks,
  canManageSprint,
  canCreateBacklog,
}: BacklogViewProps) {
  const [dragOverTargetId, setDragOverTargetId] = useState<string | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  // Tasks trong Backlog (sprintId === null hoặc status === "backlog")
  const backlogTasks = useMemo(() => {
    return tasks.filter((t) => !t.sprintId || t.status === "backlog");
  }, [tasks]);

  const totalBacklogPoints = useMemo(() => {
    return backlogTasks.reduce((sum, t) => sum + getStoryPointsForTask(t), 0);
  }, [backlogTasks]);

  // Kéo thả HTML5
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (dragOverTargetId !== targetId) {
      setDragOverTargetId(targetId);
    }
  };

  const handleDragLeave = () => {
    setDragOverTargetId(null);
  };

  const handleDrop = (e: React.DragEvent, targetSprintId: string | null) => {
    e.preventDefault();
    setDragOverTargetId(null);
    const taskId = e.dataTransfer.getData("text/plain");
    if (!taskId) return;

    if (selectedTaskIds.includes(taskId) && selectedTaskIds.length > 1) {
      if (onBulkMoveTasks) {
        onBulkMoveTasks(selectedTaskIds, targetSprintId);
      } else {
        selectedTaskIds.forEach((id) => onMoveTaskToSprint(id, targetSprintId));
      }
      setSelectedTaskIds([]);
    } else {
      onMoveTaskToSprint(taskId, targetSprintId);
    }
  };

  // Chọn checkbox nhiều task
  const toggleSelectTask = (taskId: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId],
    );
  };

  const toggleSelectAllSprint = (sprintTasks: JiraTask[]) => {
    const taskIds = sprintTasks.map((t) => t.id);
    const allSelected = taskIds.every((id) => selectedTaskIds.includes(id));
    if (allSelected) {
      setSelectedTaskIds((prev) => prev.filter((id) => !taskIds.includes(id)));
    } else {
      setSelectedTaskIds((prev) => Array.from(new Set([...prev, ...taskIds])));
    }
  };

  const toggleSelectAllBacklog = () => {
    const taskIds = backlogTasks.map((t) => t.id);
    const allSelected = taskIds.every((id) => selectedTaskIds.includes(id));
    if (allSelected) {
      setSelectedTaskIds((prev) => prev.filter((id) => !taskIds.includes(id)));
    } else {
      setSelectedTaskIds((prev) => Array.from(new Set([...prev, ...taskIds])));
    }
  };

  // Thao tác hàng loạt
  const handleBulkMove = (targetSprintId: string | null) => {
    if (onBulkMoveTasks) {
      onBulkMoveTasks(selectedTaskIds, targetSprintId);
    } else {
      selectedTaskIds.forEach((id) => onMoveTaskToSprint(id, targetSprintId));
    }
    setSelectedTaskIds([]);
  };

  const handleBulkDelete = () => {
    if (
      confirm(
        `Bạn có chắc chắn muốn xóa ${selectedTaskIds.length} việc đã chọn?`,
      )
    ) {
      if (onBulkDeleteTasks) {
        onBulkDeleteTasks(selectedTaskIds);
      }
      setSelectedTaskIds([]);
    }
  };

  return (
    <Box
      className="hide-scrollbar"
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "24px 24px 80px",
        backgroundColor: "#f8fafc",
        minHeight: 0,
      }}
    >
      <Box style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header Toolbar */}
        <Group justify="space-between" mb="lg" wrap="wrap" gap="md">
          <Box>
            <Text fw={800} fz={20} c="#0f172a">
              Quản Lý Backlog &amp; Chu Kỳ Sprints
            </Text>
            <Text fz={13} c="#64748b">
              Lập kế hoạch phân bổ công việc vào các chu kỳ Sprint hoặc đưa vào
              Backlog tồn đọng
            </Text>
          </Box>

          <Group gap="xs">
            {canCreateBacklog && (
              <Button
                size="sm"
                variant="default"
                radius="md"
                leftSection={<IconPlus size={15} />}
                onClick={() => onOpenCreateTask(null)}
                style={{ fontWeight: 600 }}
              >
                Thêm vào Backlog
              </Button>
            )}

            {canManageSprint && (
              <Button
                size="sm"
                variant="filled"
                color="vntez"
                radius="md"
                leftSection={<IconPlus size={15} />}
                onClick={onOpenCreateSprint}
                style={{ fontWeight: 600 }}
              >
                Tạo Sprint mới
              </Button>
            )}
          </Group>
        </Group>

        {/* Danh sách Sprints */}
        <Stack gap="lg">
          {sprints.map((sprint) => {
            const sprintTasks = tasks.filter((t) => t.sprintId === sprint.id);
            const isDragOver = dragOverTargetId === sprint.id;

            return (
              <SprintItem
                key={sprint.id}
                sprint={sprint}
                sprintTasks={sprintTasks}
                allSprints={sprints}
                selectedTaskIds={selectedTaskIds}
                isDragOver={isDragOver}
                canManageSprint={canManageSprint}
                onSelectTask={onSelectTask}
                onOpenCreateTask={onOpenCreateTask}
                onUpdateSprintStatus={onUpdateSprintStatus}
                onMoveTaskToSprint={onMoveTaskToSprint}
                onToggleSelectTask={toggleSelectTask}
                onToggleSelectAllSprint={toggleSelectAllSprint}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              />
            );
          })}

          {/* CỘT BACKLOG ITEM CONTAINER */}
          {(() => {
            const isDragOver = dragOverTargetId === "backlog";
            const backlogTaskIds = backlogTasks.map((t) => t.id);
            const allBacklogSelected =
              backlogTaskIds.length > 0 &&
              backlogTaskIds.every((id) => selectedTaskIds.includes(id));
            const someBacklogSelected =
              backlogTaskIds.some((id) => selectedTaskIds.includes(id)) &&
              !allBacklogSelected;

            return (
              <Paper
                p="md"
                bg="#ffffff"
                radius="md"
                onDragOver={(e) => handleDragOver(e, "backlog")}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, null)}
                style={{
                  border: `2px ${isDragOver ? "dashed #fb291a" : "solid #e2e8f0"}`,
                  backgroundColor: isDragOver ? "#fff1f0" : "#ffffff",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
                  transition: "all 0.15s ease",
                  userSelect: "none",
                }}
              >
                <Group
                  justify="space-between"
                  mb="sm"
                  wrap="nowrap"
                  align="center"
                  style={{ userSelect: "none" }}
                >
                  <Group gap="sm" wrap="nowrap" align="center">
                    {backlogTasks.length > 0 && (
                      <Checkbox
                        size="xs"
                        checked={allBacklogSelected}
                        indeterminate={someBacklogSelected}
                        onChange={toggleSelectAllBacklog}
                        aria-label="Chọn tất cả task trong Backlog"
                      />
                    )}

                    <Text fw={700} fz={16} c="#0f172a">
                      📁 Backlog (Tồn đọng dự án)
                    </Text>
                    <Badge size="sm" variant="light" color="gray">
                      {backlogTasks.length} việc
                    </Badge>
                    {totalBacklogPoints > 0 && (
                      <Badge size="sm" variant="outline" color="vntez">
                        {totalBacklogPoints} SP
                      </Badge>
                    )}
                  </Group>

                  {canCreateBacklog && (
                    <Button
                      size="xs"
                      variant="default"
                      radius="md"
                      leftSection={<IconPlus size={13} />}
                      onClick={() => onOpenCreateTask(null)}
                      style={{ fontWeight: 600 }}
                    >
                      Thêm vào Backlog
                    </Button>
                  )}
                </Group>

                <Stack gap={6}>
                  {backlogTasks.length === 0 ? (
                    <Box
                      py={32}
                      ta="center"
                      style={{
                        border: "2px dashed #cbd5e1",
                        borderRadius: 8,
                        backgroundColor: isDragOver ? "#fff1f0" : "#f8fafc",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        userSelect: "none",
                      }}
                    >
                      <IconInbox size={24} color="#94a3b8" />
                      <Text fz={13} c="#64748b">
                        Backlog đang trống. Kéo thả việc vào đây hoặc bấm
                        &quot;Thêm vào Backlog&quot;.
                      </Text>
                    </Box>
                  ) : (
                    backlogTasks.map((t) => {
                      const isSelected = selectedTaskIds.includes(t.id);
                      const prio =
                        PRIORITY_BADGE[t.priority] || PRIORITY_BADGE.medium;

                      return (
                        <Paper
                          key={t.id}
                          px="md"
                          py={10}
                          bg={isSelected ? "#fff1f0" : "#ffffff"}
                          radius="sm"
                          draggable
                          onDragStart={(e) => handleDragStart(e, t.id)}
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
                              checked={isSelected}
                              onClick={(e) => e.stopPropagation()}
                              onChange={() => toggleSelectTask(t.id)}
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

                          <Group
                            gap="xs"
                            style={{ flexShrink: 0, userSelect: "none" }}
                          >
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
                                {t.assignee?.login?.slice(0, 2).toUpperCase() ||
                                  "?"}
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

                            <Badge size="xs" variant="outline" color="gray">
                              {getStoryPointsForTask(t)} SP
                            </Badge>

                            {canManageSprint && sprints.length > 0 && (
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
                                  <Menu.Label fz={11}>
                                    Đưa vào Sprint
                                  </Menu.Label>
                                  {sprints.map((s) => (
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
          })()}
        </Stack>
      </Box>

      {/* FLOATING BULK ACTIONS TOOLBAR */}
      <FloatingBulkActionBar
        selectedCount={selectedTaskIds.length}
        sprints={sprints}
        canManageSprint={canManageSprint}
        onBulkMove={handleBulkMove}
        onBulkDelete={handleBulkDelete}
        onClearSelection={() => setSelectedTaskIds([])}
      />
    </Box>
  );
}
