"use client";

import {
  Avatar,
  Box,
  Button,
  Group,
  Modal,
  Select,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import type {
  JiraSprint,
  JiraTask,
  TaskAssignee,
  TaskPriority,
  TaskStatus,
} from "@/interfaces/jira";
import { getGitHubAvatarUrl } from "@/lib/avatar";
import {
  PRIORITY_OPTIONS,
  PRIORITY_TO_POINTS,
  pointsToPriority,
} from "@/lib/jira-priority";
import { useAuthStore } from "@/store/auth.store";
import { TaskDescriptionEditor } from "./TaskDescriptionEditor";
import { TaskMetaFields } from "./TaskMetaFields";

interface CreateTaskModalProps {
  opened: boolean;
  onClose: () => void;
  sprints: JiraSprint[];
  defaultStatus?: TaskStatus;
  defaultSprintId?: string | null;
  taskSeq: number;
  repoPrefix: string;
  onCreateTask: (newTask: JiraTask) => void;
  members?: TaskAssignee[];
}

export const PRIORITY_DEFAULT_POINTS = PRIORITY_TO_POINTS;

const STATUS_OPTIONS = [
  { value: "backlog", label: "Backlog" },
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "review", label: "In Review" },
  { value: "done", label: "Done" },
];

export function CreateTaskModal({
  opened,
  onClose,
  sprints,
  defaultStatus = "todo",
  defaultSprintId = null,
  taskSeq,
  repoPrefix,
  onCreateTask,
  members = [],
}: CreateTaskModalProps) {
  const { user } = useAuthStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [sprintId, setSprintId] = useState<string | null>(defaultSprintId);
  const [storyPoints, setStoryPoints] = useState<number | "">(3);
  const [assigneeLogin, setAssigneeLogin] = useState<string | null>(
    user?.login || null,
  );

  const memberOptions = useMemo(() => {
    const map = new Map<string, TaskAssignee>();
    if (user) {
      map.set(user.login.toLowerCase(), {
        login: user.login,
        name: user.name || user.login,
        avatar_url: user.avatar_url,
      });
    }
    for (const m of members) {
      map.set(m.login.toLowerCase(), m);
    }
    return Array.from(map.values());
  }, [members, user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const selectedMember = assigneeLogin
      ? memberOptions.find(
          (m) => m.login.toLowerCase() === assigneeLogin.toLowerCase(),
        )
      : undefined;

    const assignee: TaskAssignee | undefined = assigneeLogin
      ? {
          login: assigneeLogin,
          name: selectedMember?.name || assigneeLogin,
          avatar_url: getGitHubAvatarUrl(
            selectedMember || { login: assigneeLogin },
          ),
        }
      : undefined;

    const now = new Date().toISOString();
    const newTask: JiraTask = {
      id: `${repoPrefix}-${taskSeq}`,
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      sprintId,
      storyPoints: typeof storyPoints === "number" ? storyPoints : undefined,
      assignee,
      reporter: {
        login: user?.login || "anonymous",
        name: user?.name || user?.login || "Anonymous",
        avatar_url: getGitHubAvatarUrl(user),
      },
      createdAt: now,
      updatedAt: now,
    };

    onCreateTask(newTask);
    setTitle("");
    setDescription("");
    onClose();
  };

  const sprintOptions = [
    { value: "null", label: "📦 Backlog (Chưa vào Sprint)" },
    ...sprints.map((s) => ({
      value: s.id,
      label: `🏃 ${s.name} (${s.status.toUpperCase()})`,
    })),
  ];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconPlus size={18} color="#fb291a" />
          <Text fw={700} fz={15} c="#0f172a">
            Tạo công việc mới ({repoPrefix}-{taskSeq})
          </Text>
        </Group>
      }
      centered
      radius="md"
      styles={{
        content: {
          backgroundColor: "#ffffff",
          border: "1px solid #e2e8f0",
          color: "#0f172a",
          borderRadius: 12,
        },
        header: {
          backgroundColor: "#f8fafc",
          borderBottom: "1px solid #e2e8f0",
          padding: "14px 20px",
        },
      }}
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md" mt="xs">
          <TextInput
            label="Tiêu đề công việc"
            placeholder="Ví dụ: Thiết kế cơ sở dữ liệu cho module thanh toán..."
            required
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
            styles={{
              input: {
                backgroundColor: "#ffffff",
                borderColor: "#cbd5e1",
                color: "#0f172a",
              },
              label: {
                color: "#334155",
                fontWeight: 600,
                fontSize: 12,
                marginBottom: 4,
              },
            }}
          />

          <TaskMetaFields
            status={status}
            setStatus={setStatus}
            priority={priority}
            setPriority={setPriority}
            sprintId={sprintId}
            setSprintId={setSprintId}
            storyPoints={storyPoints}
            setStoryPoints={setStoryPoints}
            sprintOptions={sprintOptions}
            canEdit={true}
          />

          <Select
            label="Người thực hiện"
            placeholder="Chọn người thực hiện hoặc để trống..."
            clearable
            searchable
            value={assigneeLogin}
            onChange={setAssigneeLogin}
            data={memberOptions.map((m) => ({
              value: m.login,
              label:
                m.name && m.name !== m.login
                  ? `${m.name} (@${m.login})`
                  : `@${m.login}`,
            }))}
            leftSection={
              assigneeLogin ? (
                <Avatar
                  src={getGitHubAvatarUrl(
                    memberOptions.find(
                      (m) =>
                        m.login.toLowerCase() === assigneeLogin.toLowerCase(),
                    ) || { login: assigneeLogin },
                    36,
                  )}
                  size={18}
                  radius="xl"
                />
              ) : undefined
            }
            renderOption={({ option }) => {
              const m = memberOptions.find(
                (item) => item.login === option.value,
              );
              return (
                <Group gap="xs" wrap="nowrap">
                  <Avatar
                    src={getGitHubAvatarUrl(m || { login: option.value }, 40)}
                    size={20}
                    radius="xl"
                  />
                  <Text fz={12}>{option.label}</Text>
                </Group>
              );
            }}
            styles={{
              input: {
                backgroundColor: "#ffffff",
                borderColor: "#cbd5e1",
                color: "#0f172a",
              },
              label: {
                color: "#334155",
                fontWeight: 600,
                fontSize: 12,
                marginBottom: 4,
              },
            }}
          />

          <TaskDescriptionEditor
            description={description}
            setDescription={setDescription}
            canEdit={true}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Hủy
            </Button>
            <Button
              type="submit"
              color="vntez"
              leftSection={<IconPlus size={14} />}
            >
              Tạo công việc
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
