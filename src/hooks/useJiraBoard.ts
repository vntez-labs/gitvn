"use client";

import { notifications } from "@mantine/notifications";
import { useCallback, useEffect, useState } from "react";
import type { GitvnConfig } from "@/interfaces/gitvn";
import type { JiraBoardData, TaskAssignee } from "@/interfaces/jira";
import {
  type GitHubPullItem,
  syncBoardTasksWithPulls,
} from "@/lib/jira-pr-sync";
import { jiraService } from "@/services/jira.service";
import { useAuthStore } from "@/store/auth.store";
import { useDashboardStore } from "@/store/dashboard.store";
import { useJiraFilter } from "./jira/useJiraFilter";
import { useJiraPermissions } from "./jira/useJiraPermissions";
import { useJiraSync } from "./jira/useJiraSync";
import { useJiraTaskActions } from "./jira/useJiraTaskActions";

export interface UseJiraBoardOptions {
  isTabActive?: boolean;
}

export function useJiraBoard(options?: UseJiraBoardOptions) {
  const isTabActive = options?.isTabActive ?? true;
  const { user } = useAuthStore();
  const { selectedRepo, currentBranch } = useDashboardStore();

  const [boardData, setBoardData] = useState<JiraBoardData | null>(null);
  const [gitvnConfig, setGitvnConfig] = useState<GitvnConfig | null>(null);
  const [hasGitvn, setHasGitvn] = useState<boolean>(true);
  const [initializing, setInitializing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"kanban" | "backlog">("kanban");
  const [selectedSprintId, setSelectedSprintId] = useState<string>("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [filterAssignee, setFilterAssignee] = useState<string | null>(null);
  const [onlyMyTasks, setOnlyMyTasks] = useState(false);
  const [repoMembers, setRepoMembers] = useState<TaskAssignee[]>([]);
  const [repoPulls, setRepoPulls] = useState<GitHubPullItem[]>([]);

  // 1. Hook quản lý đồng bộ Git & Debounce Sync
  const {
    gitSyncStatus,
    syncing,
    setSyncing,
    syncedToGitHub,
    setSyncedToGitHub,
    flushGitSync,
    saveTasks,
  } = useJiraSync({
    selectedRepo,
    currentBranch,
    isTabActive,
    setBoardData,
  });

  // 2. Hook quản lý Phân quyền & Danh sách thành viên
  const {
    allMembers,
    userRole,
    canEdit,
    canManageSprint,
    canCreateBacklog,
    savePermissions,
  } = useJiraPermissions({
    user,
    selectedRepo,
    currentBranch,
    repoMembers,
    boardData,
    gitvnConfig,
    setGitvnConfig,
    saveTasks,
  });

  // 3. Hook quản lý các thao tác CRUD Task & Sprint
  const {
    createTask,
    updateTask,
    deleteTask,
    dropTask,
    createSprint,
    updateSprintStatus,
    moveTaskToSprint,
    bulkMoveTasks,
    bulkDeleteTasks,
  } = useJiraTaskActions({
    boardData,
    saveTasks,
  });

  // 4. Hook quản lý Lọc & Tìm kiếm
  const { activeSprint, effectiveSprintId, filteredTasks } = useJiraFilter({
    boardData,
    selectedSprintId,
    searchQuery,
    filterPriority,
    filterAssignee,
    onlyMyTasks,
    user,
  });

  // 5. Tải dữ liệu ban đầu
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
  }, [selectedRepo, currentBranch, setSyncedToGitHub]);

  useEffect(() => {
    fetchBoardData();
  }, [fetchBoardData]);

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
  }, [selectedRepo, currentBranch, boardData, setSyncing]);

  return {
    boardData,
    setBoardData,
    gitvnConfig,
    hasGitvn,
    initializing,
    loading,
    syncing,
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
