"use client";

import { Box, Text } from "@mantine/core";
import { useCallback, useMemo, useState } from "react";
import { useJiraBoard } from "@/hooks/useJiraBoard";
import type { JiraTask, TaskStatus } from "@/interfaces/jira";
import { useAuthStore } from "@/store/auth.store";
import { useDashboardStore } from "@/store/dashboard.store";
import { BacklogView } from "./BacklogView";
import { DEFAULT_KANBAN_COLUMNS } from "./constants";
import { GitvnInitBanner } from "./GitvnInitBanner";
import { JiraBoardFilters } from "./JiraBoardFilters";
import { JiraBoardToolbar } from "./JiraBoardToolbar";
import { JiraModalsContainer } from "./JiraModalsContainer";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanSkeleton } from "./KanbanSkeleton";

interface JiraWorkspaceProps {
  isTabActive?: boolean;
}

export function JiraWorkspace({ isTabActive = true }: JiraWorkspaceProps) {
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
    gitSyncStatus,
    flushGitSync,
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
  } = useJiraBoard({ isTabActive });

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

  const handleQuickAdd = useCallback(
    (colStatus: TaskStatus) => {
      setQuickAddStatus(colStatus);
      setTargetSprintId(activeSprint?.id || null);
      setCreateTaskOpen(true);
    },
    [activeSprint?.id],
  );

  const handleCardClick = useCallback((task: JiraTask) => {
    setSelectedTask(task);
    setTaskDetailOpen(true);
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
  }, []);

  const tasksByStatus = useMemo(() => {
    const map: Record<TaskStatus, JiraTask[]> = {
      backlog: [],
      todo: [],
      in_progress: [],
      review: [],
      done: [],
    };
    for (const t of filteredTasks) {
      if (map[t.status]) {
        map[t.status].push(t);
      }
    }
    return map;
  }, [filteredTasks]);

  if (!hasGitvn && !loading) {
    return (
      <GitvnInitBanner
        initializing={initializing}
        onInitialize={initializeGitvn}
      />
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
      {/* 1. Header Toolbar */}
      <JiraBoardToolbar
        view={view}
        setView={setView}
        selectedSprintId={selectedSprintId}
        setSelectedSprintId={setSelectedSprintId}
        sprintOptions={sprintOptions}
        gitSyncStatus={gitSyncStatus}
        syncedToGitHub={syncedToGitHub}
        flushGitSync={flushGitSync}
        fetchBoardData={fetchBoardData}
        syncWithPullRequests={syncWithPullRequests}
        userRole={userRole}
        canEdit={canEdit}
        canManageSprint={canManageSprint}
        activeSprint={activeSprint}
        onOpenCreateTask={(sprintId) => {
          setTargetSprintId(sprintId || activeSprint?.id || null);
          setQuickAddStatus("todo");
          setCreateTaskOpen(true);
        }}
        onOpenCreateSprint={() => setCreateSprintOpen(true)}
        onOpenPermissions={() => setPermissionsOpen(true)}
        onOpenJsonModal={() => setJsonModalOpen(true)}
      />

      {/* 2. Main View Content */}
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
          <JiraBoardFilters
            repoPrefix={repoPrefix}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterPriority={filterPriority}
            setFilterPriority={setFilterPriority}
            filterAssignee={filterAssignee}
            setFilterAssignee={setFilterAssignee}
            allMembers={allMembers}
            onlyMyTasks={onlyMyTasks}
            setOnlyMyTasks={setOnlyMyTasks}
            activeSprint={activeSprint}
            tasksCount={filteredTasks.length}
          />

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
            {DEFAULT_KANBAN_COLUMNS.map((col) => (
              <KanbanColumn
                key={col.status}
                status={col.status}
                title={col.title}
                color={col.color}
                tasks={tasksByStatus[col.status] || []}
                onDropTask={dropTask}
                onCardClick={handleCardClick}
                onDragStart={handleDragStart}
                onQuickAdd={handleQuickAdd}
                canEdit={canEdit}
              />
            ))}
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

      {/* 3. Modals */}
      <JiraModalsContainer
        taskDetailOpen={taskDetailOpen}
        onCloseTaskDetail={() => setTaskDetailOpen(false)}
        selectedTask={selectedTask}
        boardData={boardData}
        onUpdateTask={updateTask}
        onDeleteTask={deleteTask}
        canEdit={canEdit}
        allMembers={allMembers}
        createTaskOpen={createTaskOpen}
        onCloseCreateTask={() => setCreateTaskOpen(false)}
        quickAddStatus={quickAddStatus}
        targetSprintId={targetSprintId}
        repoPrefix={repoPrefix}
        onCreateTask={createTask}
        createSprintOpen={createSprintOpen}
        onCloseCreateSprint={() => setCreateSprintOpen(false)}
        onCreateSprint={createSprint}
        permissionsOpen={permissionsOpen}
        onClosePermissions={() => setPermissionsOpen(false)}
        gitvnConfig={gitvnConfig}
        user={user}
        selectedRepo={selectedRepo}
        onSavePermissions={savePermissions}
        userRole={userRole}
        jsonModalOpen={jsonModalOpen}
        onCloseJsonModal={() => setJsonModalOpen(false)}
        onBoardDataSaved={(updatedData) => {
          setBoardData(updatedData);
        }}
      />
    </Box>
  );
}
