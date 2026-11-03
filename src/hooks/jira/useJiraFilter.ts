"use client";

import { useMemo } from "react";
import type { GitHubUser } from "@/interfaces/github";
import type { JiraBoardData, JiraSprint } from "@/interfaces/jira";

interface UseJiraFilterProps {
  boardData: JiraBoardData | null;
  selectedSprintId: string;
  searchQuery: string;
  filterPriority: string | null;
  filterAssignee: string | null;
  onlyMyTasks: boolean;
  user: GitHubUser | null;
}

export function useJiraFilter({
  boardData,
  selectedSprintId,
  searchQuery,
  filterPriority,
  filterAssignee,
  onlyMyTasks,
  user,
}: UseJiraFilterProps) {
  // Active Sprint
  const activeSprint: JiraSprint | null = useMemo(() => {
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
      if (effectiveSprintId !== "all") {
        if (effectiveSprintId === "null" || effectiveSprintId === null) {
          if (task.sprintId) return false;
        } else if (task.sprintId !== effectiveSprintId) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchId = task.id.toLowerCase().includes(q);
        const matchAssignee = task.assignee?.login.toLowerCase().includes(q);
        if (!matchTitle && !matchId && !matchAssignee) return false;
      }
      if (filterPriority && task.priority !== filterPriority) return false;
      if (filterAssignee) {
        if (filterAssignee === "unassigned") {
          if (task.assignee) return false;
        } else if (
          task.assignee?.login.toLowerCase() !== filterAssignee.toLowerCase()
        ) {
          return false;
        }
      }
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
    filterAssignee,
    onlyMyTasks,
    user,
  ]);

  return {
    activeSprint,
    effectiveSprintId,
    filteredTasks,
  };
}
