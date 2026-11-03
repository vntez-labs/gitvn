"use client";

import {
  Badge,
  Box,
  Button,
  Divider,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import {
  IconCheck,
  IconGitPullRequest,
  IconSparkles,
  IconTrash,
} from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import type {
  JiraSprint,
  JiraTask,
  TaskAssignee,
  TaskPriority,
  TaskStatus,
} from "@/interfaces/jira";
import { copyTaskAIPrompt } from "@/lib/ai-prompt";
import { getGitHubAvatarUrl } from "@/lib/avatar";
import {
  PRIORITY_OPTIONS,
  PRIORITY_TO_POINTS,
  pointsToPriority,
} from "@/lib/jira-priority";
import { formatRelativeTime } from "@/lib/time";
import { TaskAssigneeMeta } from "./TaskAssigneeMeta";
import { TaskDescriptionEditor } from "./TaskDescriptionEditor";
import { TaskMetaFields } from "./TaskMetaFields";

interface TaskDetailModalProps {
  opened: boolean;
  onClose: () => void;
  task: JiraTask | null;
  sprints: JiraSprint[];
  onUpdateTask: (updatedTask: JiraTask) => void;
  onDeleteTask: (taskId: string) => void;
  canEdit: boolean;
  members?: TaskAssignee[];
}

export const PRIORITY_DEFAULT_POINTS = PRIORITY_TO_POINTS;

export function TaskDetailModal({
  opened,
  onClose,
  task,
  sprints,
  onUpdateTask,
  onDeleteTask,
  canEdit,
  members = [],
}: TaskDetailModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [sprintId, setSprintId] = useState<string | null>(null);
  const [storyPoints, setStoryPoints] = useState<number | "">("");
  const [assignee, setAssignee] = useState<TaskAssignee | undefined>(undefined);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setStatus(task.status);
      setPriority(task.priority);
      setSprintId(task.sprintId);
      setStoryPoints(
        typeof task.storyPoints === "number" ? task.storyPoints : "",
      );
      setAssignee(task.assignee);
    }
  }, [task]);

  const memberOptions = useMemo(() => {
    const map = new Map<string, TaskAssignee>();
    if (task?.assignee)
      map.set(task.assignee.login.toLowerCase(), task.assignee);
    if (task?.reporter)
      map.set(task.reporter.login.toLowerCase(), task.reporter);
    for (const m of members) {
      map.set(m.login.toLowerCase(), m);
    }
    return Array.from(map.values());
  }, [members, task?.assignee, task?.reporter]);

  if (!task) return null;

  const handleSave = () => {
    if (!title.trim()) return;

    const cleanAssignee = assignee
      ? { ...assignee, avatar_url: getGitHubAvatarUrl(assignee) }
      : undefined;

    const cleanReporter = task.reporter
      ? { ...task.reporter, avatar_url: getGitHubAvatarUrl(task.reporter) }
      : { login: "unknown", name: "Unknown" };

    const updated: JiraTask = {
      ...task,
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      sprintId,
      storyPoints: typeof storyPoints === "number" ? storyPoints : undefined,
      assignee: cleanAssignee,
      reporter: cleanReporter,
      updatedAt: new Date().toISOString(),
    };

    onUpdateTask(updated);
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
      size="xl"
      title={
        <Group gap="xs">
          <Badge
            size="sm"
            styles={{
              root: {
                backgroundColor: "#fff1f0",
                color: "#fb291a",
                fontWeight: 700,
                fontFamily: "var(--font-jetbrains-mono), monospace",
                borderRadius: 6,
              },
            }}
          >
            {task.id}
          </Badge>
          {task.pullNumber && (
            <Badge
              size="sm"
              variant="light"
              color={task.status === "done" ? "teal" : "violet"}
              leftSection={<IconGitPullRequest size={12} />}
              component="a"
              href={task.pullUrl || "#"}
              target="_blank"
              styles={{ root: { cursor: "pointer", textTransform: "none" } }}
            >
              PR #{task.pullNumber} (GitHub)
            </Badge>
          )}
          <Text fw={700} fz={15} c="#0f172a">
            Chi tiết Công việc
          </Text>
        </Group>
      }
      styles={{
        content: { borderRadius: 12, border: "1px solid #e2e8f0" },
        header: {
          backgroundColor: "#f8fafc",
          borderBottom: "1px solid #e2e8f0",
          padding: "14px 20px",
        },
        body: { padding: 20 },
      }}
    >
      <Stack gap="md">
        {/* Tiêu đề task */}
        <TextInput
          label="Tiêu đề công việc"
          value={title}
          onChange={(e) => setTitle(e.currentTarget.value)}
          disabled={!canEdit}
          styles={{
            input: {
              backgroundColor: "#ffffff",
              borderColor: "#cbd5e1",
              color: "#0f172a",
              fontWeight: 600,
              fontSize: 14,
              borderRadius: 8,
            },
            label: {
              color: "#334155",
              fontWeight: 600,
              fontSize: 12,
              marginBottom: 4,
            },
          }}
        />

        {/* Thông số cột & trạng thái & Story Points */}
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
          canEdit={canEdit}
        />

        {/* Mô tả hỗ trợ Markdown & Preview */}
        <TaskDescriptionEditor
          description={description}
          setDescription={setDescription}
          canEdit={canEdit}
        />

        <Divider color="#f1f5f9" my={4} />

        {/* Thông tin Meta: Người báo cáo, Người nhận, Thời gian */}
        <TaskAssigneeMeta
          assignee={assignee}
          setAssignee={setAssignee}
          reporter={task.reporter}
          updatedAt={task.updatedAt}
          createdAt={task.createdAt}
          canEdit={canEdit}
          memberOptions={memberOptions}
        />

        <Divider color="#e2e8f0" my={4} />

        {/* Nút hành động Lưu / Xóa / Prompt AI */}
        <Group justify="space-between">
          <Group gap="xs">
            {canEdit && (
              <Button
                variant="subtle"
                color="red"
                size="xs"
                leftSection={<IconTrash size={14} />}
                onClick={() => {
                  if (confirm(`Bạn có chắc chắn muốn xóa task ${task.id}?`)) {
                    onDeleteTask(task.id);
                    onClose();
                  }
                }}
              >
                Xóa công việc
              </Button>
            )}

            <Button
              variant="light"
              color="grape"
              size="xs"
              leftSection={<IconSparkles size={14} />}
              onClick={() => copyTaskAIPrompt(task)}
            >
              Xuất Prompt AI (Cursor/Claude)
            </Button>
          </Group>

          <Group gap="xs">
            <Button variant="default" size="xs" onClick={onClose}>
              Đóng
            </Button>
            {canEdit && (
              <Button
                color="vntez"
                size="xs"
                leftSection={<IconCheck size={14} />}
                onClick={handleSave}
              >
                Lưu thay đổi
              </Button>
            )}
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
}
