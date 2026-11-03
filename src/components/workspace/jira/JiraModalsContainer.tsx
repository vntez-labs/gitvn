"use client";

import dynamic from "next/dynamic";
import type { GitHubRepo, GitHubUser } from "@/interfaces/github";
import type { GitvnConfig } from "@/interfaces/gitvn";
import type {
  JiraBoardData,
  JiraSprint,
  JiraTask,
  ProjectPermissions,
  ProjectRole,
  TaskAssignee,
  TaskStatus,
} from "@/interfaces/jira";

// Dynamic imports cho các modal lớn để giảm dung lượng bundle tải ban đầu
const TaskDetailModal = dynamic(
  () => import("./TaskDetailModal").then((m) => m.TaskDetailModal),
  { ssr: false },
);
const CreateTaskModal = dynamic(
  () => import("./CreateTaskModal").then((m) => m.CreateTaskModal),
  { ssr: false },
);
const CreateSprintModal = dynamic(
  () => import("./CreateSprintModal").then((m) => m.CreateSprintModal),
  { ssr: false },
);
const PermissionsModal = dynamic(
  () => import("./PermissionsModal").then((m) => m.PermissionsModal),
  { ssr: false },
);
const TasksJsonModal = dynamic(
  () => import("./TasksJsonModal").then((m) => m.TasksJsonModal),
  { ssr: false },
);

interface JiraModalsContainerProps {
  taskDetailOpen: boolean;
  onCloseTaskDetail: () => void;
  selectedTask: JiraTask | null;
  boardData: JiraBoardData | null;
  onUpdateTask: (task: JiraTask) => void;
  onDeleteTask: (taskId: string) => void;
  canEdit: boolean;
  allMembers: TaskAssignee[];

  createTaskOpen: boolean;
  onCloseCreateTask: () => void;
  quickAddStatus: TaskStatus;
  targetSprintId: string | null;
  repoPrefix: string;
  onCreateTask: (task: JiraTask) => void;

  createSprintOpen: boolean;
  onCloseCreateSprint: () => void;
  onCreateSprint: (sprint: JiraSprint) => void;

  permissionsOpen: boolean;
  onClosePermissions: () => void;
  gitvnConfig: GitvnConfig | null;
  user: GitHubUser | null;
  selectedRepo: GitHubRepo | null;
  onSavePermissions: (permissions: ProjectPermissions) => Promise<void>;
  userRole: ProjectRole;

  jsonModalOpen: boolean;
  onCloseJsonModal: () => void;
  onBoardDataSaved: (data: JiraBoardData) => void;
}

export function JiraModalsContainer({
  taskDetailOpen,
  onCloseTaskDetail,
  selectedTask,
  boardData,
  onUpdateTask,
  onDeleteTask,
  canEdit,
  allMembers,

  createTaskOpen,
  onCloseCreateTask,
  quickAddStatus,
  targetSprintId,
  repoPrefix,
  onCreateTask,

  createSprintOpen,
  onCloseCreateSprint,
  onCreateSprint,

  permissionsOpen,
  onClosePermissions,
  gitvnConfig,
  user,
  selectedRepo,
  onSavePermissions,
  userRole,

  jsonModalOpen,
  onCloseJsonModal,
  onBoardDataSaved,
}: JiraModalsContainerProps) {
  return (
    <>
      {taskDetailOpen && (
        <TaskDetailModal
          opened={taskDetailOpen}
          onClose={onCloseTaskDetail}
          task={selectedTask}
          sprints={boardData?.sprints || []}
          onUpdateTask={onUpdateTask}
          onDeleteTask={onDeleteTask}
          canEdit={canEdit}
          members={allMembers}
        />
      )}

      {createTaskOpen && (
        <CreateTaskModal
          opened={createTaskOpen}
          onClose={onCloseCreateTask}
          sprints={boardData?.sprints || []}
          defaultStatus={quickAddStatus}
          defaultSprintId={targetSprintId}
          taskSeq={(boardData?.taskSeq || 0) + 1}
          repoPrefix={repoPrefix}
          onCreateTask={onCreateTask}
          members={allMembers}
        />
      )}

      {createSprintOpen && (
        <CreateSprintModal
          opened={createSprintOpen}
          onClose={onCloseCreateSprint}
          sprintCount={boardData?.sprints?.length || 0}
          onCreateSprint={onCreateSprint}
        />
      )}

      {permissionsOpen && (
        <PermissionsModal
          opened={permissionsOpen}
          onClose={onClosePermissions}
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
          onSavePermissions={onSavePermissions}
          canEdit={userRole === "admin"}
        />
      )}

      {jsonModalOpen && (
        <TasksJsonModal
          opened={jsonModalOpen}
          onClose={onCloseJsonModal}
          owner={selectedRepo?.owner.login || ""}
          repo={selectedRepo?.name || ""}
          boardData={boardData}
          onSavedSuccess={onBoardDataSaved}
        />
      )}
    </>
  );
}
