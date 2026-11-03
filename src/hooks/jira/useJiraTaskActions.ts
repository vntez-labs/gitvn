"use client";

import { useCallback } from "react";
import type {
  JiraBoardData,
  JiraSprint,
  JiraTask,
  SprintStatus,
  TaskStatus,
} from "@/interfaces/jira";

interface UseJiraTaskActionsProps {
  boardData: JiraBoardData | null;
  saveTasks: (data: JiraBoardData, immediateSync?: boolean) => void;
}

export function useJiraTaskActions({
  boardData,
  saveTasks,
}: UseJiraTaskActionsProps) {
  // CRUD Tasks
  const createTask = useCallback(
    (newTask: JiraTask) => {
      if (!boardData) return;
      const tasks = [...boardData.tasks, newTask];
      const taskSeq = (boardData.taskSeq || 0) + 1;
      saveTasks({ ...boardData, tasks, taskSeq }, true); // Tạo task mới thì sync ngay
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
      saveTasks({ ...boardData, tasks }, true);
    },
    [boardData, saveTasks],
  );

  // Kéo thả Task có hỗ trợ vị trí (targetIndex) và reorder trong cùng cột
  const dropTask = useCallback(
    (taskId: string, targetStatus: TaskStatus, targetIndex?: number) => {
      if (!boardData) return;
      const currentTask = boardData.tasks.find((t) => t.id === taskId);
      if (!currentTask) return;

      const updatedTask: JiraTask = {
        ...currentTask,
        status: targetStatus,
        updatedAt: new Date().toISOString(),
      };

      // Tách task cần di chuyển ra khỏi mảng
      const remainingTasks = boardData.tasks.filter((t) => t.id !== taskId);

      // Lấy danh sách các task hiện có trong cột đích
      const targetColTasks = remainingTasks.filter(
        (t) => t.status === targetStatus,
      );

      let insertAtOverallIndex: number;

      if (
        targetIndex !== undefined &&
        targetIndex >= 0 &&
        targetIndex < targetColTasks.length
      ) {
        // Chèn trước task tại vị trí targetIndex trong cột đích
        const pivotTask = targetColTasks[targetIndex];
        insertAtOverallIndex = remainingTasks.findIndex(
          (t) => t.id === pivotTask.id,
        );
      } else if (targetColTasks.length > 0) {
        // Chèn sau task cuối cùng của cột đích
        const lastColTask = targetColTasks[targetColTasks.length - 1];
        const lastIdx = remainingTasks.findIndex(
          (t) => t.id === lastColTask.id,
        );
        insertAtOverallIndex = lastIdx + 1;
      } else {
        // Cột đích đang trống -> chèn vào cuối
        insertAtOverallIndex = remainingTasks.length;
      }

      if (insertAtOverallIndex < 0) {
        insertAtOverallIndex = remainingTasks.length;
      }

      const newTasks = [
        ...remainingTasks.slice(0, insertAtOverallIndex),
        updatedTask,
        ...remainingTasks.slice(insertAtOverallIndex),
      ];

      // Lưu với cơ chế debounce 2.5s (không tạo commit rác liên tục)
      saveTasks({ ...boardData, tasks: newTasks }, false);
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

  return {
    createTask,
    updateTask,
    deleteTask,
    dropTask,
    createSprint,
    updateSprintStatus,
    moveTaskToSprint,
    bulkMoveTasks,
    bulkDeleteTasks,
  };
}
