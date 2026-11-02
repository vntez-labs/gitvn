"use client";

import { Group, NumberInput, Select } from "@mantine/core";
import type { TaskPriority, TaskStatus } from "@/interfaces/jira";
import {
  PRIORITY_OPTIONS,
  PRIORITY_TO_POINTS,
  pointsToPriority,
} from "@/lib/jira-priority";

export const STATUS_OPTIONS = [
  { value: "backlog", label: "Backlog" },
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "review", label: "In Review" },
  { value: "done", label: "Done" },
];

interface TaskMetaFieldsProps {
  status: TaskStatus;
  setStatus: (status: TaskStatus) => void;
  priority: TaskPriority;
  setPriority: (priority: TaskPriority) => void;
  sprintId: string | null;
  setSprintId: (sprintId: string | null) => void;
  storyPoints: number | "";
  setStoryPoints: (points: number | "") => void;
  sprintOptions: { value: string; label: string }[];
  canEdit: boolean;
}

export function TaskMetaFields({
  status,
  setStatus,
  priority,
  setPriority,
  sprintId,
  setSprintId,
  storyPoints,
  setStoryPoints,
  sprintOptions,
  canEdit,
}: TaskMetaFieldsProps) {
  return (
    <>
      <Group grow align="flex-start">
        <Select
          label="Trạng thái"
          data={STATUS_OPTIONS}
          value={status}
          onChange={(val) => setStatus((val as TaskStatus) || "todo")}
          disabled={!canEdit}
          styles={{
            input: {
              backgroundColor: "#ffffff",
              borderColor: "#cbd5e1",
              color: "#0f172a",
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

        <Select
          label="Độ ưu tiên"
          data={PRIORITY_OPTIONS}
          value={priority}
          onChange={(val) => {
            const newPrio = (val as TaskPriority) || "medium";
            setPriority(newPrio);
            setStoryPoints(PRIORITY_TO_POINTS[newPrio] ?? 3);
          }}
          disabled={!canEdit}
          styles={{
            input: {
              backgroundColor: "#ffffff",
              borderColor: "#cbd5e1",
              color: "#0f172a",
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
      </Group>

      <Group grow align="flex-start">
        <Select
          label="Thuộc Sprint"
          data={sprintOptions}
          value={sprintId || "null"}
          onChange={(val) => setSprintId(val === "null" ? null : val)}
          disabled={!canEdit}
          styles={{
            input: {
              backgroundColor: "#ffffff",
              borderColor: "#cbd5e1",
              color: "#0f172a",
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

        <NumberInput
          label="Story Points (Độ phức tạp)"
          placeholder="Ví dụ: 1, 2, 3, 5, 8..."
          value={storyPoints}
          onChange={(val) => {
            if (typeof val === "number") {
              setStoryPoints(val);
              setPriority(pointsToPriority(val));
            } else {
              setStoryPoints("");
            }
          }}
          min={0}
          max={100}
          disabled={!canEdit}
          styles={{
            input: {
              backgroundColor: "#ffffff",
              borderColor: "#cbd5e1",
              color: "#0f172a",
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
      </Group>
    </>
  );
}
