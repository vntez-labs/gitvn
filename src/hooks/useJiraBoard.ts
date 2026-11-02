"use client";

import { notifications } from "@mantine/notifications";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { GitvnConfig } from "@/interfaces/gitvn";
import type {
  JiraBoardData,
  JiraSprint,
  JiraTask,
  ProjectPermissions,
  ProjectRole,
  SprintStatus,
  TaskAssignee,
  TaskPriority,
  TaskStatus,
} from "@/interfaces/jira";
import { getGitHubAvatarUrl } from "@/lib/avatar";
import {
  type GitHubPullItem,
  syncBoardTasksWithPulls,
} from "@/lib/jira-pr-sync";
import { jiraService } from "@/services/jira.service";
import { useAuthStore } from "@/store/auth.store";
import { useDashboardStore } from "@/store/dashboard.store";

export function useJiraBoard() {
  const { user } = useAuthStore();
  const { selectedRepo, currentBranch } = useDashboardStore();

  const [boardData, setBoardData] = useState<JiraBoardData | null>(null);
  const [gitvnConfig, setGitvnConfig] = useState<GitvnConfig | null>(null);
  const [hasGitvn, setHasGitvn] = useState<boolean>(true);
  const [initializing, setInitializing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncedToGitHub, setSyncedToGitHub] = useState(false);
  const [view, setView] = useState<"kanban" | "backlog">("kanban");
  const [selectedSprintId, setSelectedSprintId] = useState<string>("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [onlyMyTasks, setOnlyMyTasks] = useState(false);
  const [repoMembers, setRepoMembers] = useState<TaskAssignee[]>([]);
  const [repoPulls, setRepoPulls] = useState<GitHubPullItem[]>([]);

  const fetchBoardData = useCallback(() => {
    if (!selectedRepo) return;
    setLoading(true);

    jiraService
      .fetchBoardData(
        selectedRepo.owner.login,
        selectedRepo.name,
        currentBranch,
      )
      .then((res) => {
        let currentBoard = res.data;
        setSyncedToGitHub(res.syncedToGitHub);
        setHasGitvn(res.hasGitvn);
        if (res.config) setGitvnConfig(res.config);
        if (res.members) setRepoMembers(res.members);
        if (res.pulls) setRepoPulls(res.pulls);

        // Tự động kiểm tra và đồng bộ trạng thái Task với Pull Requests
        if (res.data && res.pulls && res.pulls.length > 0) {
          const syncRes = syncBoardTasksWithPulls(res.data, res.pulls);
          if (syncRes.hasChanges) {
            currentBoard = syncRes.updatedBoard;
            jiraService
              .saveBoardData(
                selectedRepo.owner.login,
                selectedRepo.name,
                currentBranch,
                syncRes.updatedBoard,
                true,
              )
              .catch((err) =>
                console.error("Lỗi đồng bộ PR status lên GitHub:", err),
              );

            syncRes.changes.forEach((ch) => {
              notifications.show({
                title: "Tự động đồng bộ PR",
                message: `Task ${ch.taskId} đã chuyển sang "${ch.toStatus.toUpperCase()}" (${ch.reason})`,
                color: ch.toStatus === "done" ? "teal" : "violet",
              });
            });
          }
        }

        setBoardData(currentBoard);
      })
      .catch((err) => {
        console.error("Lỗi tải dữ liệu Jira/Tasks:", err);
      })
      .finally(() => setLoading(false));
  }, [selectedRepo, currentBranch]);

  useEffect(() => {
    fetchBoardData();
  }, [fetchBoardData]);

  // Danh sách thành viên tổng hợp
  const allMembers = useMemo(() => {
    const map = new Map<string, TaskAssignee>();
    if (selectedRepo) {
      map.set(selectedRepo.owner.login.toLowerCase(), {
        login: selectedRepo.owner.login,
        name: selectedRepo.owner.login,
        avatar_url: `https://github.com/${selectedRepo.owner.login}.png`,
      });
    }
    if (user) {
      map.set(user.login.toLowerCase(), {
        login: user.login,
        name: user.name || user.login,
        avatar_url: getGitHubAvatarUrl(user),
      });
    }
    for (const m of repoMembers) {
      map.set(m.login.toLowerCase(), {
        ...m,
        avatar_url: getGitHubAvatarUrl(m),
      });
    }
    if (boardData?.tasks) {
      for (const t of boardData.tasks) {
        if (t.assignee) {
          map.set(t.assignee.login.toLowerCase(), {
            ...t.assignee,
            avatar_url: getGitHubAvatarUrl(t.assignee),
          });
        }
        if (t.reporter) {
          map.set(t.reporter.login.toLowerCase(), {
            ...t.reporter,
            avatar_url: getGitHubAvatarUrl(t.reporter),
          });
        }
      }
    }
    return Array.from(map.values());
  }, [selectedRepo, user, repoMembers, boardData?.tasks]);

  // Phân quyền
  const userRole: ProjectRole = useMemo(() => {
    if (!user) return "viewer";
    if (
      selectedRepo?.owner.login &&
      user.login.toLowerCase() === selectedRepo.owner.login.toLowerCase()
    ) {
      return "admin";
    }
    const permissions = boardData?.permissions || gitvnConfig?.permissions;
    if (permissions?.userRoles) {
      const explicit = permissions.userRoles[user.login.toLowerCase()];
      if (explicit) return explicit;
      return permissions.defaultRole || "member";
    }
    return "admin";
  }, [
    user,
    selectedRepo?.owner.login,
    boardData?.permissions,
    gitvnConfig?.permissions,
  ]);

  const canEdit =
    userRole === "admin" || userRole === "pm" || userRole === "member";
  const canManageSprint = userRole === "admin" || userRole === "pm";
  const canCreateBacklog = canEdit;

  // Lưu Board Data ngầm
  const saveTasks = useCallback(
    async (newData: JiraBoardData) => {
      if (!selectedRepo) return;
      setBoardData(newData);
      setSyncing(true);

      try {
        await jiraService.saveBoardData(
          selectedRepo.owner.login,
          selectedRepo.name,
          currentBranch,
          newData,
          true,
        );
        setSyncedToGitHub(true);
      } catch (err: any) {
        console.error("Lỗi lưu tasks:", err);
        notifications.show({
          title: "Lưu thất bại",
          message: err.response?.data?.error || "Không thể lưu dữ liệu",
          color: "red",
        });
      } finally {
        setSyncing(false);
      }
    },
    [selectedRepo, currentBranch],
  );

  const initializeGitvn = useCallback(async () => {
    if (!selectedRepo) return;
    setInitializing(true);
    try {
      await jiraService.initializeGitvn(
        selectedRepo.owner.login,
        selectedRepo.name,
        currentBranch,
      );
      notifications.show({
        title: "Khởi tạo thành công!",
        message: "Cấu trúc .gitvn/ đã được thiết lập.",
        color: "teal",
      });
      fetchBoardData();
    } catch (err: any) {
      notifications.show({
        title: "Khởi tạo thất bại",
        message: err.response?.data?.error || "Có lỗi xảy ra",
        color: "red",
      });
    } finally {
      setInitializing(false);
    }
  }, [selectedRepo, currentBranch, fetchBoardData]);

  // CRUD Tasks
  const createTask = useCallback(
    (newTask: JiraTask) => {
      if (!boardData) return;
      const tasks = [...boardData.tasks, newTask];
      const taskSeq = (boardData.taskSeq || 0) + 1;
      saveTasks({ ...boardData, tasks, taskSeq });
    },
    [boardData, saveTasks],
  );

  const updateTask = useCallback(
    (updatedTask: JiraTask) => {
      if (!boardData) return;
      const tasks = boardData.tasks.map((t) =>
        t.id === updatedTask.id ? updatedTask : t,
      );
      saveTasks({ ...boardData, tasks });
    },
    [boardData, saveTasks],
  );

  const deleteTask = useCallback(
    (taskId: string) => {
      if (!boardData) return;
      const tasks = boardData.tasks.filter((t) => t.id !== taskId);
      saveTasks({ ...boardData, tasks });
    },
    [boardData, saveTasks],
  );

  const dropTask = useCallback(
    (taskId: string, targetStatus: TaskStatus) => {
      if (!boardData) return;
      const task = boardData.tasks.find((t) => t.id === taskId);
      if (!task || task.status === targetStatus) return;

      const updated = {
        ...task,
        status: targetStatus,
        updatedAt: new Date().toISOString(),
      };
      const tasks = boardData.tasks.map((t) => (t.id === taskId ? updated : t));
      saveTasks({ ...boardData, tasks });
    },
    [boardData, saveTasks],
  );

  // CRUD Sprints
  const createSprint = useCallback(
    (newSprint: JiraSprint) => {
      if (!boardData) return;
      const sprints = [...boardData.sprints, newSprint];
      saveTasks({ ...boardData, sprints });
    },
    [boardData, saveTasks],
  );

  const updateSprintStatus = useCallback(
    (sprintId: string, status: SprintStatus) => {
      if (!boardData) return;
      let sprints = boardData.sprints.map((s) => {
        if (s.id === sprintId) return { ...s, status };
        if (status === "active" && s.status === "active") {
          return { ...s, status: "completed" as SprintStatus };
        }
        return s;
      });
      saveTasks({ ...boardData, sprints });
    },
    [boardData, saveTasks],
  );

  const moveTaskToSprint = useCallback(
    (taskId: string, targetSprintId: string | null) => {
      if (!boardData) return;
      const tasks = boardData.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              sprintId: targetSprintId,
              status:
                targetSprintId === null
                  ? ("backlog" as TaskStatus)
                  : t.status === "backlog"
                    ? ("todo" as TaskStatus)
                    : t.status,
              updatedAt: new Date().toISOString(),
            }
          : t,
      );
      saveTasks({ ...boardData, tasks });
    },
    [boardData, saveTasks],
  );

  const bulkMoveTasks = useCallback(
    (taskIds: string[], targetSprintId: string | null) => {
      if (!boardData || taskIds.length === 0) return;
      const tasks = boardData.tasks.map((t) =>
        taskIds.includes(t.id)
          ? {
              ...t,
              sprintId: targetSprintId,
              status:
                targetSprintId === null
                  ? ("backlog" as TaskStatus)
                  : t.status === "backlog"
                    ? ("todo" as TaskStatus)
                    : t.status,
              updatedAt: new Date().toISOString(),
            }
          : t,
      );
      saveTasks({ ...boardData, tasks });
    },
    [boardData, saveTasks],
  );

  const bulkDeleteTasks = useCallback(
    (taskIds: string[]) => {
      if (!boardData || taskIds.length === 0) return;
      const tasks = boardData.tasks.filter((t) => !taskIds.includes(t.id));
      saveTasks({ ...boardData, tasks });
    },
    [boardData, saveTasks],
  );

  const savePermissions = useCallback(
    async (newPermissions: ProjectPermissions) => {
      if (!selectedRepo) return;
      if (boardData) {
        saveTasks({
          ...boardData,
          permissions: newPermissions,
        });
      }
      const newConfig: GitvnConfig = {
        ...(gitvnConfig || {
          version: "1.0",
          name: selectedRepo.name,
          modules: { kanban: true, docs: true },
          kanban: { columns: [] },
          docs: { entry: "README.mdx", files: [] },
        }),
        permissions: newPermissions,
      };
      setGitvnConfig(newConfig);
      try {
        await jiraService.saveConfig(
          selectedRepo.owner.login,
          selectedRepo.name,
          currentBranch,
          newConfig,
        );
        notifications.show({
          title: "Đã lưu phân quyền",
          message: "Cấu hình vai trò đã được cập nhật.",
          color: "teal",
        });
      } catch (err: any) {
        notifications.show({
          title: "Lỗi lưu quyền",
          message: err.response?.data?.error || "Không thể cập nhật cấu hình",
          color: "red",
        });
      }
    },
    [selectedRepo, currentBranch, gitvnConfig, boardData, saveTasks],
  );

  // Active Sprint & Filtered Tasks
  const activeSprint = useMemo(() => {
    return boardData?.sprints.find((s) => s.status === "active") || null;
  }, [boardData?.sprints]);

  const effectiveSprintId = useMemo(() => {
    if (selectedSprintId === "active") return activeSprint?.id || null;
    if (selectedSprintId === "all") return "all";
    if (selectedSprintId === "backlog") return null;
    return selectedSprintId;
  }, [selectedSprintId, activeSprint]);

  const filteredTasks = useMemo(() => {
    if (!boardData?.tasks) return [];
    return boardData.tasks.filter((task) => {
      if (effectiveSprintId !== "all" && task.sprintId !== effectiveSprintId) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchId = task.id.toLowerCase().includes(q);
        const matchAssignee = task.assignee?.login.toLowerCase().includes(q);
        if (!matchTitle && !matchId && !matchAssignee) return false;
      }
      if (filterPriority && task.priority !== filterPriority) return false;
      if (onlyMyTasks && user) {
        if (task.assignee?.login.toLowerCase() !== user.login.toLowerCase()) {
          return false;
        }
      }
      return true;
    });
  }, [
    boardData?.tasks,
    effectiveSprintId,
    searchQuery,
    filterPriority,
    onlyMyTasks,
    user,
  ]);

  const syncWithPullRequests = useCallback(async () => {
    if (!selectedRepo || !boardData) return;
    setSyncing(true);
    try {
      const res = await jiraService.fetchBoardData(
        selectedRepo.owner.login,
        selectedRepo.name,
        currentBranch,
      );
      if (res.pulls) setRepoPulls(res.pulls);
      const syncRes = syncBoardTasksWithPulls(boardData, res.pulls || []);
      if (syncRes.hasChanges) {
        setBoardData(syncRes.updatedBoard);
        await jiraService.saveBoardData(
          selectedRepo.owner.login,
          selectedRepo.name,
          currentBranch,
          syncRes.updatedBoard,
          true,
        );
        notifications.show({
          title: "Đồng bộ PR thành công!",
          message: `Đã cập nhật trạng thái cho ${syncRes.changes.length} task theo Pull Request.`,
          color: "teal",
        });
      } else {
        notifications.show({
          title: "Đã cập nhật mới nhất",
          message: "Tất cả các task đều đã khớp với trạng thái Pull Request.",
          color: "blue",
        });
      }
    } catch (err: any) {
      notifications.show({
        title: "Đồng bộ thất bại",
        message: err.message || "Lỗi đồng bộ PR",
        color: "red",
      });
    } finally {
      setSyncing(false);
    }
  }, [selectedRepo, currentBranch, boardData]);

  return {
    boardData,
    setBoardData,
    gitvnConfig,
    hasGitvn,
    initializing,
    loading,
    syncing,
    syncedToGitHub,
    view,
    setView,
    selectedSprintId,
    setSelectedSprintId,
    searchQuery,
    setSearchQuery,
    filterPriority,
    setFilterPriority,
    onlyMyTasks,
    setOnlyMyTasks,
    repoMembers,
    repoPulls,
    allMembers,
    userRole,
    canEdit,
    canManageSprint,
    canCreateBacklog,
    activeSprint,
    effectiveSprintId,
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
    saveTasks,
  };
}
