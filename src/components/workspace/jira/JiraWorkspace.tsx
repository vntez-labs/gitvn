"use client";

import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Menu,
  Paper,
  SegmentedControl,
  Select,
  Switch,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import {
  IconCalendar,
  IconDots,
  IconFileCode,
  IconFilter,
  IconFolderPlus,
  IconGitPullRequest,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconShieldLock,
  IconSparkles,
  IconUser,
} from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { useJiraBoard } from "@/hooks/useJiraBoard";
import type { JiraTask, TaskPriority, TaskStatus } from "@/interfaces/jira";
import { useAuthStore } from "@/store/auth.store";
import { useDashboardStore } from "@/store/dashboard.store";
import { BacklogView } from "./BacklogView";
import { CreateSprintModal } from "./CreateSprintModal";
import { CreateTaskModal } from "./CreateTaskModal";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanSkeleton } from "./KanbanSkeleton";
import { PermissionsModal } from "./PermissionsModal";
import { TaskDetailModal } from "./TaskDetailModal";
import { TasksJsonModal } from "./TasksJsonModal";

const DEFAULT_KANBAN_COLUMNS: {
  status: TaskStatus;
  title: string;
  color: string;
}[] = [
  { status: "todo", title: "To Do", color: "#3b82f6" },
  { status: "in_progress", title: "In Progress", color: "#eab308" },
  { status: "review", title: "In Review", color: "#a855f7" },
  { status: "done", title: "Done", color: "#22c55e" },
];

export function JiraWorkspace() {
  const { user } = useAuthStore();
  const { selectedRepo } = useDashboardStore();
  const {
    boardData,
    setBoardData,
    gitvnConfig,
    hasGitvn,
    initializing,
    loading,
    syncedToGitHub,
    view,
    setView,
    selectedSprintId,
    setSelectedSprintId,
    searchQuery,
    setSearchQuery,
    filterPriority,
    setFilterPriority,
    filterAssignee,
    setFilterAssignee,
    onlyMyTasks,
    setOnlyMyTasks,
    allMembers,
    userRole,
    canEdit,
    canManageSprint,
    canCreateBacklog,
    activeSprint,
    filteredTasks,
    fetchBoardData,
    syncWithPullRequests,
    initializeGitvn,
    createTask,
    updateTask,
    deleteTask,
    dropTask,
    createSprint,
    updateSprintStatus,
    moveTaskToSprint,
    bulkMoveTasks,
    bulkDeleteTasks,
    savePermissions,
  } = useJiraBoard();

  // Modals state
  const [selectedTask, setSelectedTask] = useState<JiraTask | null>(null);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [createSprintOpen, setCreateSprintOpen] = useState(false);
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [jsonModalOpen, setJsonModalOpen] = useState(false);
  const [quickAddStatus, setQuickAddStatus] = useState<TaskStatus>("todo");
  const [targetSprintId, setTargetSprintId] = useState<string | null>(null);

  const repoPrefix = useMemo(() => {
    if (!selectedRepo) return "TASK";
    return (
      selectedRepo.name
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(0, 5)
        .toUpperCase() || "TASK"
    );
  }, [selectedRepo]);

  const sprintOptions = useMemo(() => {
    if (!boardData) return [];
    return [
      {
        value: "active",
        label: activeSprint
          ? `🏃 Đang chạy: ${activeSprint.name}`
          : "Chưa có Sprint kích hoạt",
      },
      { value: "all", label: "🌟 Tất cả công việc" },
      { value: "null", label: "📦 Backlog (Chưa vào Sprint)" },
      ...boardData.sprints.map((s) => ({
        value: s.id,
        label: `🏃 ${s.name} (${s.status.toUpperCase()})`,
      })),
    ];
  }, [boardData, activeSprint]);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
  };

  const handleQuickAdd = (colStatus: TaskStatus) => {
    setQuickAddStatus(colStatus);
    setTargetSprintId(activeSprint?.id || null);
    setCreateTaskOpen(true);
  };

  if (!hasGitvn && !loading) {
    return (
      <Box
        p="xl"
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#ffffff",
        }}
      >
        <Paper
          p={40}
          radius="md"
          ta="center"
          maw={560}
          bg="#ffffff"
          style={{
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
          }}
        >
          <Box
            w={64}
            h={64}
            mx="auto"
            mb="md"
            style={{
              borderRadius: 16,
              backgroundColor: "#fff1f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fb291a",
            }}
          >
            <IconFolderPlus size={32} />
          </Box>
          <Text fz={18} fw={700} c="#0f172a" mb="xs">
            Chưa phát hiện cấu hình .gitvn trong repository
          </Text>
          <Text fz="sm" c="#64748b" mb="xl" lh={1.6}>
            GitVN quản lý Agile Sprint, Kanban board và tài liệu chuẩn hoá thông
            qua thư mục <code>.gitvn/</code> lưu trực tiếp trong mã nguồn của
            bạn.
          </Text>
          <Button
            size="md"
            variant="filled"
            color="vntez"
            loading={initializing}
            leftSection={<IconSparkles size={18} />}
            onClick={initializeGitvn}
            style={{ fontWeight: 600 }}
          >
            Khởi tạo .gitvn và Bảng Kanban
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        minHeight: 0,
        backgroundColor: "#ffffff",
      }}
    >
      {/* HEADER TOOLBAR */}
      <Box
        px="md"
        py={8}
        bg="#ffffff"
        style={{
          borderBottom: "1px solid #e2e8f0",
          flexShrink: 0,
        }}
      >
        <Group justify="space-between" wrap="nowrap" align="center">
          <Group gap="sm" wrap="nowrap" align="center">
            <SegmentedControl
              size="xs"
              value={view}
              onChange={(val) => setView(val as "kanban" | "backlog")}
              data={[
                { value: "kanban", label: "Bảng Kanban" },
                { value: "backlog", label: "Backlog & Sprints" },
              ]}
              styles={{
                root: { backgroundColor: "#f4f4f5" },
                indicator: {
                  backgroundColor: "#ffffff",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                },
                label: {
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "4px 10px",
                  "&[data-active]": { color: "#18181b" },
                },
              }}
            />

            {view === "kanban" && (
              <Select
                size="xs"
                data={sprintOptions}
                value={selectedSprintId}
                onChange={(val) => setSelectedSprintId(val || "active")}
                allowDeselect={false}
                leftSection={<IconCalendar size={13} color="#71717a" />}
                styles={{
                  input: {
                    fontWeight: 600,
                    fontSize: 12,
                    minWidth: 210,
                    backgroundColor: "#ffffff",
                    borderColor: "#e4e4e7",
                    color: "#18181b",
                  },
                }}
              />
            )}
          </Group>

          <Group gap="xs" wrap="nowrap" align="center">
            {/* Sync Status Badge */}
            <Tooltip
              label={
                syncedToGitHub
                  ? "Đã đồng bộ với .gitvn/tasks.json trên GitHub"
                  : "Đang lưu cục bộ trong hệ thống"
              }
              withArrow
            >
              <Badge
                size="sm"
                variant="light"
                color={syncedToGitHub ? "teal" : "yellow"}
                style={{ cursor: "pointer" }}
                onClick={fetchBoardData}
              >
                ● {syncedToGitHub ? "GITHUB SYNCED" : "LOCAL CACHED"}
              </Badge>
            </Tooltip>

            {/* Nút Đồng bộ trạng thái Pull Requests */}
            <Tooltip
              label="Quét và đồng bộ trạng thái Task từ GitHub Pull Requests (In Progress -> In Review)"
              withArrow
            >
              <ActionIcon
                variant="light"
                color="violet"
                size="sm"
                radius="md"
                aria-label="Đồng bộ PR"
                onClick={syncWithPullRequests}
              >
                <IconGitPullRequest size={15} />
              </ActionIcon>
            </Tooltip>

            {/* Menu options */}
            <Menu
              position="bottom-end"
              shadow="md"
              width={220}
              radius="md"
              withArrow
            >
              <Menu.Target>
                <ActionIcon
                  variant="default"
                  size="sm"
                  radius="md"
                  aria-label="Tùy chọn"
                >
                  <IconDots size={15} color="#475569" />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Quản trị & Thành viên</Menu.Label>
                <Menu.Item
                  leftSection={<IconShieldLock size={14} color="#64748b" />}
                  rightSection={
                    <Badge size="xs" variant="light" color="vntez">
                      {userRole.toUpperCase()}
                    </Badge>
                  }
                  onClick={() => setPermissionsOpen(true)}
                >
                  Phân quyền dự án
                </Menu.Item>
                {canManageSprint && (
                  <Menu.Item
                    leftSection={<IconCalendar size={14} color="#64748b" />}
                    onClick={() => setCreateSprintOpen(true)}
                  >
                    Tạo Sprint mới
                  </Menu.Item>
                )}
                <Menu.Divider />
                <Menu.Label>Cấu hình & Dữ liệu</Menu.Label>
                <Menu.Item
                  leftSection={<IconFileCode size={14} color="#fb291a" />}
                  onClick={() => setJsonModalOpen(true)}
                >
                  Xem .gitvn/tasks.json
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconGitPullRequest size={14} color="#8b5cf6" />}
                  onClick={syncWithPullRequests}
                >
                  Đồng bộ Pull Requests
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconRefresh size={14} color="#64748b" />}
                  onClick={fetchBoardData}
                >
                  Làm mới dữ liệu
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>

            <Button
              size="xs"
              variant="default"
              radius="md"
              leftSection={<IconFileCode size={14} color="#71717a" />}
              onClick={() => setJsonModalOpen(true)}
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
              Import / Export JSON
            </Button>

            {canEdit && (
              <Button
                size="xs"
                radius="md"
                leftSection={<IconPlus size={14} />}
                onClick={() => {
                  setTargetSprintId(activeSprint?.id || null);
                  setQuickAddStatus("todo");
                  setCreateTaskOpen(true);
                }}
                styles={{
                  root: {
                    backgroundColor: "#dc2626",
                    color: "#ffffff",
                    fontWeight: 500,
                    boxShadow: "0 1px 2px rgba(220, 38, 38, 0.2)",
                    "&:hover": {
                      backgroundColor: "#b91c1c",
                    },
                  },
                }}
              >
                Tạo việc
              </Button>
            )}
          </Group>
        </Group>
      </Box>

      {/* VIEW CONTENT */}
      {loading ? (
        <KanbanSkeleton />
      ) : !boardData ? (
        <Box p="xl" ta="center">
          <Text c="#64748b" fz="sm">
            Không có dữ liệu công việc.
          </Text>
        </Box>
      ) : view === "kanban" ? (
        <Box
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            minHeight: 0,
            backgroundColor: "#ffffff",
          }}
        >
          {/* Filters Bar */}
          <Box
            px="md"
            py={8}
            bg="#ffffff"
            style={{
              borderBottom: "1px solid #e4e4e7",
              flexShrink: 0,
            }}
          >
            <Group justify="space-between" wrap="nowrap" align="center">
              <Group gap="sm" wrap="nowrap" align="center" style={{ flex: 1 }}>
                <TextInput
                  placeholder={`Tìm kiếm (${repoPrefix}-1, tiêu đề, người nhận)...`}
                  size="xs"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.currentTarget.value)}
                  leftSection={<IconSearch size={13} color="#a1a1aa" />}
                  style={{ width: 260 }}
                  styles={{
                    input: {
                      backgroundColor: "#ffffff",
                      borderColor: "#e4e4e7",
                      fontSize: 12,
                    },
                  }}
                />

                <Select
                  placeholder="Độ ưu tiên"
                  size="xs"
                  clearable
                  value={filterPriority}
                  onChange={setFilterPriority}
                  leftSection={<IconFilter size={13} color="#a1a1aa" />}
                  data={[
                    { value: "urgent", label: "🔴 Khẩn cấp" },
                    { value: "high", label: "🟠 Cao" },
                    { value: "medium", label: "🔵 Trung bình" },
                    { value: "low", label: "⚪ Thấp" },
                  ]}
                  style={{ width: 140 }}
                  styles={{
                    input: {
                      backgroundColor: "#ffffff",
                      borderColor: "#e4e4e7",
                      fontSize: 12,
                    },
                  }}
                />

                {/* Lọc theo Thành viên (Assignee) */}
                <Select
                  placeholder="Thành viên"
                  size="xs"
                  clearable
                  value={filterAssignee}
                  onChange={setFilterAssignee}
                  leftSection={<IconUser size={13} color="#a1a1aa" />}
                  data={[
                    { value: "unassigned", label: "❓ Chưa gán ai" },
                    ...allMembers.map((m) => ({
                      value: m.login,
                      label: `👤 ${m.name || m.login}`,
                    })),
                  ]}
                  style={{ width: 160 }}
                  styles={{
                    input: {
                      backgroundColor: "#ffffff",
                      borderColor: "#e4e4e7",
                      fontSize: 12,
                    },
                  }}
                />

                <Switch
                  size="xs"
                  checked={onlyMyTasks}
                  onChange={(e) => setOnlyMyTasks(e.currentTarget.checked)}
                  label={
                    <Group gap={4}>
                      <IconUser size={13} />
                      <Text fz={12} c="#475569" fw={500}>
                        Việc của tôi
                      </Text>
                    </Group>
                  }
                  color="vntez"
                />
              </Group>

              <Group gap="xs" style={{ flexShrink: 0 }}>
                <Text fz={12} c="#64748b" fw={500}>
                  Sprint:{" "}
                  <strong style={{ color: "#fb291a" }}>
                    {activeSprint?.name || "Chưa có Sprint"}
                  </strong>
                </Text>
                <Badge size="sm" variant="light" color="vntez">
                  {filteredTasks.length} việc
                </Badge>
              </Group>
            </Group>
          </Box>

          {/* Kanban Columns Board */}
          <Box
            p="md"
            style={{
              flex: 1,
              display: "flex",
              gap: 16,
              overflowX: "auto",
              minHeight: 0,
            }}
            className="hide-scrollbar"
          >
            {DEFAULT_KANBAN_COLUMNS.map((col) => {
              const colTasks = filteredTasks.filter(
                (t) => t.status === col.status,
              );
              return (
                <KanbanColumn
                  key={col.status}
                  status={col.status}
                  title={col.title}
                  color={col.color}
                  tasks={colTasks}
                  onDropTask={dropTask}
                  onCardClick={(task) => {
                    setSelectedTask(task);
                    setTaskDetailOpen(true);
                  }}
                  onDragStart={handleDragStart}
                  onQuickAdd={handleQuickAdd}
                  canEdit={canEdit}
                />
              );
            })}
          </Box>
        </Box>
      ) : (
        <BacklogView
          sprints={boardData.sprints}
          tasks={boardData.tasks}
          onSelectTask={(task) => {
            setSelectedTask(task);
            setTaskDetailOpen(true);
          }}
          onOpenCreateTask={(sprintId) => {
            setTargetSprintId(sprintId || null);
            setQuickAddStatus(sprintId ? "todo" : "backlog");
            setCreateTaskOpen(true);
          }}
          onOpenCreateSprint={() => setCreateSprintOpen(true)}
          onUpdateSprintStatus={updateSprintStatus}
          onMoveTaskToSprint={moveTaskToSprint}
          onBulkMoveTasks={bulkMoveTasks}
          onBulkDeleteTasks={bulkDeleteTasks}
          canManageSprint={canManageSprint}
          canCreateBacklog={canCreateBacklog}
        />
      )}

      {/* MODALS */}
      <TaskDetailModal
        opened={taskDetailOpen}
        onClose={() => setTaskDetailOpen(false)}
        task={selectedTask}
        sprints={boardData?.sprints || []}
        onUpdateTask={updateTask}
        onDeleteTask={deleteTask}
        canEdit={canEdit}
        members={allMembers}
      />

      <CreateTaskModal
        opened={createTaskOpen}
        onClose={() => setCreateTaskOpen(false)}
        sprints={boardData?.sprints || []}
        defaultStatus={quickAddStatus}
        defaultSprintId={targetSprintId}
        taskSeq={(boardData?.taskSeq || 0) + 1}
        repoPrefix={repoPrefix}
        onCreateTask={createTask}
        members={allMembers}
      />

      <CreateSprintModal
        opened={createSprintOpen}
        onClose={() => setCreateSprintOpen(false)}
        sprintCount={boardData?.sprints?.length || 0}
        onCreateSprint={createSprint}
      />

      <PermissionsModal
        opened={permissionsOpen}
        onClose={() => setPermissionsOpen(false)}
        permissions={
          boardData?.permissions ||
          gitvnConfig?.permissions || {
            userRoles: {},
            defaultRole: "member",
            canManageSprint: ["admin", "pm"],
            canCreateBacklog: ["admin", "pm", "member"],
          }
        }
        currentUserLogin={user?.login || ""}
        repoOwner={selectedRepo?.owner.login || ""}
        onSavePermissions={savePermissions}
        canEdit={userRole === "admin"}
      />

      <TasksJsonModal
        opened={jsonModalOpen}
        onClose={() => setJsonModalOpen(false)}
        owner={selectedRepo?.owner.login || ""}
        repo={selectedRepo?.name || ""}
        boardData={boardData}
        onSavedSuccess={(updatedData) => {
          setBoardData(updatedData);
        }}
      />
    </Box>
  );
}
