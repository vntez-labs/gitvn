"use client";

import {
  Badge,
  Box,
  Button,
  Checkbox,
  Group,
  Paper,
  Stack,
  Text,
} from "@mantine/core";
import { IconInbox, IconPlus } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import type { JiraSprint, JiraTask, SprintStatus } from "@/interfaces/jira";
import { getStoryPointsForTask } from "@/lib/jira-priority";
import { FloatingBulkActionBar } from "./FloatingBulkActionBar";
import { SprintItem } from "./SprintItem";
import { TaskRowItem } from "./TaskRowItem";

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
                variant="default"
                radius="md"
                leftSection={<IconPlus size={15} />}
                onClick={onOpenCreateSprint}
                styles={{
                  root: {
                    backgroundColor: "#ffffff",
                    borderColor: "#d4d4d8",
                    color: "#3f3f46",
                    fontWeight: 500,
                    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                  },
                }}
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
                radius="lg"
                onDragOver={(e) => handleDragOver(e, "backlog")}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, null)}
                style={{
                  border: `1px solid ${isDragOver ? "#dc2626" : "#e4e4e7"}`,
                  backgroundColor: isDragOver ? "#fef2f2" : "#ffffff",
                  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
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

                    <Text fw={600} fz={15} c="#18181b">
                      📁 Backlog (Tồn đọng dự án)
                    </Text>
                    <Badge
                      size="xs"
                      variant="outline"
                      style={{
                        borderColor: "#e4e4e7",
                        color: "#52525b",
                        backgroundColor: "#f4f4f5",
                        fontFamily: "monospace",
                        fontSize: 11,
                        padding: "2px 6px",
                      }}
                    >
                      {backlogTasks.length} việc
                    </Badge>
                    {totalBacklogPoints > 0 && (
                      <Badge
                        size="xs"
                        variant="outline"
                        style={{
                          borderColor: "#e4e4e7",
                          color: "#52525b",
                          backgroundColor: "#f4f4f5",
                          fontFamily: "monospace",
                          fontSize: 11,
                          padding: "2px 6px",
                        }}
                      >
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
                      styles={{
                        root: {
                          backgroundColor: "#ffffff",
                          borderColor: "#d4d4d8",
                          color: "#3f3f46",
                          fontWeight: 500,
                          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                        },
                      }}
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
                    backlogTasks.map((t) => (
                      <TaskRowItem
                        key={t.id}
                        task={t}
                        isSelected={selectedTaskIds.includes(t.id)}
                        sprints={sprints}
                        canManageSprint={canManageSprint}
                        onSelectTask={onSelectTask}
                        onToggleSelectTask={toggleSelectTask}
                        onDragStart={handleDragStart}
                        onMoveTaskToSprint={onMoveTaskToSprint}
                        currentSprintId={null}
                      />
                    ))
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
