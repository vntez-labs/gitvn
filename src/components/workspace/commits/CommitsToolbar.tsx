"use client";

import {
  ActionIcon,
  Badge,
  Group,
  Select,
  TextInput,
  Tooltip,
} from "@mantine/core";
import {
  IconGitBranch,
  IconRefresh,
  IconSearch,
  IconUsers,
} from "@tabler/icons-react";

interface CommitsToolbarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  branchOptions: { value: string; label: string }[];
  branchFilter: string;
  onBranchChange: (val: string) => void;
  authorOptions: { value: string; label: string }[];
  authorFilter: string;
  onAuthorChange: (val: string) => void;
  onRefresh: () => void;
  loading: boolean;
  totalCommits: number;
}

export function CommitsToolbar({
  searchQuery,
  onSearchChange,
  branchOptions,
  branchFilter,
  onBranchChange,
  authorOptions,
  authorFilter,
  onAuthorChange,
  onRefresh,
  loading,
  totalCommits,
}: CommitsToolbarProps) {
  return (
    <Group justify="space-between" mb="md" gap="sm" wrap="wrap">
      <Group gap="xs" wrap="wrap">
        <TextInput
          placeholder="Tìm kiếm commit theo thông điệp, tác giả hoặc SHA..."
          leftSection={<IconSearch size={14} color="#94a3b8" />}
          size="xs"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.currentTarget.value)}
          style={{ width: 280 }}
          styles={{
            input: {
              backgroundColor: "#ffffff",
              borderColor: "#e5e1da",
              color: "#1f1c19",
            },
          }}
        />

        <Select
          size="xs"
          data={branchOptions}
          value={branchFilter}
          onChange={(val) => onBranchChange(val || "all")}
          placeholder="Chọn nhánh..."
          style={{ width: 210 }}
          leftSection={<IconGitBranch size={14} color="#6e675f" />}
          styles={{
            input: {
              backgroundColor: "#ffffff",
              borderColor: "#e5e1da",
              color: "#1f1c19",
              fontWeight: 600,
            },
          }}
        />

        <Select
          size="xs"
          data={authorOptions}
          value={authorFilter}
          onChange={(val) => onAuthorChange(val || "all")}
          placeholder="Lọc tác giả..."
          style={{ width: 220 }}
          leftSection={<IconUsers size={14} color="#6e675f" />}
          styles={{
            input: {
              backgroundColor: "#ffffff",
              borderColor: "#e5e1da",
              color: "#1f1c19",
            },
          }}
        />

        <Tooltip label="Làm mới lịch sử commit" withArrow>
          <ActionIcon
            size="input-xs"
            variant="default"
            onClick={onRefresh}
            loading={loading}
            aria-label="Làm mới"
            style={{
              backgroundColor: "#ffffff",
              borderColor: "#e5e1da",
              color: "#1f1c19",
            }}
          >
            <IconRefresh size={14} />
          </ActionIcon>
        </Tooltip>
      </Group>

      <Badge
        size="sm"
        variant="outline"
        color="gray"
        style={{ borderColor: "#e5e1da", color: "#6e675f" }}
      >
        {totalCommits} commits
      </Badge>
    </Group>
  );
}
