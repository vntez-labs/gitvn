"use client";

import { notifications } from "@mantine/notifications";
import { useCallback, useMemo } from "react";
import type { GitHubRepo, GitHubUser } from "@/interfaces/github";
import type { GitvnConfig } from "@/interfaces/gitvn";
import type {
  JiraBoardData,
  ProjectPermissions,
  ProjectRole,
  TaskAssignee,
} from "@/interfaces/jira";
import { getGitHubAvatarUrl } from "@/lib/avatar";
import { jiraService } from "@/services/jira.service";

interface UseJiraPermissionsProps {
  user: GitHubUser | null;
  selectedRepo: GitHubRepo | null;
  currentBranch: string;
  repoMembers: TaskAssignee[];
  boardData: JiraBoardData | null;
  gitvnConfig: GitvnConfig | null;
  setGitvnConfig: React.Dispatch<React.SetStateAction<GitvnConfig | null>>;
  saveTasks: (data: JiraBoardData, immediateSync?: boolean) => void;
}

export function useJiraPermissions({
  user,
  selectedRepo,
  currentBranch,
  repoMembers,
  boardData,
  gitvnConfig,
  setGitvnConfig,
  saveTasks,
}: UseJiraPermissionsProps) {
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
    [
      selectedRepo,
      currentBranch,
      gitvnConfig,
      boardData,
      saveTasks,
      setGitvnConfig,
    ],
  );

  return {
    allMembers,
    userRole,
    canEdit,
    canManageSprint,
    canCreateBacklog,
    savePermissions,
  };
}
