"use client";

import {
  Badge,
  Box,
  Group,
  Select,
  Switch,
  Text,
  TextInput,
} from "@mantine/core";
import { IconFilter, IconSearch, IconUser } from "@tabler/icons-react";
import type { JiraSprint, TaskAssignee } from "@/interfaces/jira";

interface JiraBoardFiltersProps {
  repoPrefix: string;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  filterPriority: string | null;
  setFilterPriority: (val: string | null) => void;
  filterAssignee: string | null;
  setFilterAssignee: (val: string | null) => void;
  allMembers: TaskAssignee[];
  onlyMyTasks: boolean;
  setOnlyMyTasks: (val: boolean) => void;
  activeSprint: JiraSprint | null;
  tasksCount: number;
}

export function JiraBoardFilters({
  repoPrefix,
  searchQuery,
  setSearchQuery,
  filterPriority,
  setFilterPriority,
  filterAssignee,
  setFilterAssignee,
  allMembers,
  onlyMyTasks,
  setOnlyMyTasks,
  activeSprint,
  tasksCount,
}: JiraBoardFiltersProps) {
  return (
    <Box
      px="md"
      py={8}
      bg="#ffffff"
      style={{
        borderBottom: "1px solid #e4e4e7",
        flexShrink: 0,
      }}
    >
      <Group justify="space-between" wrap="nowrap" align="center">
        <Group gap="sm" wrap="nowrap" align="center" style={{ flex: 1 }}>
          <TextInput
            placeholder={`Tìm kiếm (${repoPrefix}-1, tiêu đề, người nhận)...`}
            size="xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            leftSection={<IconSearch size={13} color="#a1a1aa" />}
            style={{ width: 260 }}
            styles={{
              input: {
                backgroundColor: "#ffffff",
                borderColor: "#e4e4e7",
                fontSize: 12,
              },
            }}
          />

          <Select
            placeholder="Độ ưu tiên"
            size="xs"
            clearable
            value={filterPriority}
            onChange={setFilterPriority}
            leftSection={<IconFilter size={13} color="#a1a1aa" />}
            data={[
              { value: "urgent", label: "🔴 Khẩn cấp" },
              { value: "high", label: "🟠 Cao" },
              { value: "medium", label: "🔵 Trung bình" },
              { value: "low", label: "⚪ Thấp" },
            ]}
            style={{ width: 140 }}
            styles={{
              input: {
                backgroundColor: "#ffffff",
                borderColor: "#e4e4e7",
                fontSize: 12,
              },
            }}
          />

          {/* Lọc theo Thành viên (Assignee) */}
          <Select
            placeholder="Thành viên"
            size="xs"
            clearable
            value={filterAssignee}
            onChange={setFilterAssignee}
            leftSection={<IconUser size={13} color="#a1a1aa" />}
            data={[
              { value: "unassigned", label: "❓ Chưa gán ai" },
              ...allMembers.map((m) => ({
                value: m.login,
                label: `👤 ${m.name || m.login}`,
              })),
            ]}
            style={{ width: 160 }}
            styles={{
              input: {
                backgroundColor: "#ffffff",
                borderColor: "#e4e4e7",
                fontSize: 12,
              },
            }}
          />

          <Switch
            size="xs"
            checked={onlyMyTasks}
            onChange={(e) => setOnlyMyTasks(e.currentTarget.checked)}
            label={
              <Group gap={4}>
                <IconUser size={13} />
                <Text fz={12} c="#475569" fw={500}>
                  Việc của tôi
                </Text>
              </Group>
            }
            color="vntez"
          />
        </Group>

        <Group gap="xs" style={{ flexShrink: 0 }}>
          <Text fz={12} c="#64748b" fw={500}>
            Sprint:{" "}
            <strong style={{ color: "#fb291a" }}>
              {activeSprint?.name || "Chưa có Sprint"}
            </strong>
          </Text>
          <Badge size="sm" variant="light" color="vntez">
            {tasksCount} việc
          </Badge>
        </Group>
      </Group>
    </Box>
  );
}
