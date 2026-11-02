"use client";

import { Avatar, Box, Group, Select, Text } from "@mantine/core";
import { IconClock } from "@tabler/icons-react";
import type { TaskAssignee } from "@/interfaces/jira";
import { getGitHubAvatarUrl } from "@/lib/avatar";
import { formatRelativeTime } from "@/lib/time";

interface TaskAssigneeMetaProps {
  assignee: TaskAssignee | undefined;
  setAssignee: (assignee: TaskAssignee | undefined) => void;
  reporter?: TaskAssignee;
  updatedAt?: string;
  createdAt?: string;
  canEdit: boolean;
  memberOptions: TaskAssignee[];
}

export function TaskAssigneeMeta({
  assignee,
  setAssignee,
  reporter,
  updatedAt,
  createdAt,
  canEdit,
  memberOptions,
}: TaskAssigneeMetaProps) {
  return (
    <Box
      p="sm"
      style={{
        backgroundColor: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: 8,
      }}
    >
      <Group justify="space-between" wrap="wrap" gap="sm">
        <Group gap="xs" align="center">
          <Avatar
            src={getGitHubAvatarUrl(assignee, 64)}
            size={28}
            radius="xl"
            style={{ border: "1px solid #cbd5e1" }}
          >
            {assignee?.login?.slice(0, 2).toUpperCase() || "?"}
          </Avatar>
          <Box>
            <Text fz={11} c="#64748b" mb={2}>
              Người thực hiện:
            </Text>
            {canEdit ? (
              <Select
                size="xs"
                radius="md"
                placeholder="Chưa gán (Bấm để gán)"
                clearable
                searchable
                value={assignee?.login || null}
                onChange={(val) => {
                  if (!val) {
                    setAssignee(undefined);
                  } else {
                    const found = memberOptions.find(
                      (m) => m.login.toLowerCase() === val.toLowerCase(),
                    );
                    if (found) {
                      setAssignee({
                        ...found,
                        avatar_url: getGitHubAvatarUrl(found),
                      });
                    } else {
                      setAssignee({
                        login: val,
                        name: val,
                        avatar_url: `https://github.com/${val}.png`,
                      });
                    }
                  }
                }}
                leftSection={
                  assignee ? (
                    <Avatar
                      src={getGitHubAvatarUrl(assignee, 36)}
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
                        src={getGitHubAvatarUrl(
                          m || { login: option.value },
                          40,
                        )}
                        size={20}
                        radius="xl"
                      />
                      <Text fz={12}>{option.label}</Text>
                    </Group>
                  );
                }}
                data={memberOptions.map((m) => ({
                  value: m.login,
                  label:
                    m.name && m.name !== m.login
                      ? `${m.name} (@${m.login})`
                      : `@${m.login}`,
                }))}
                styles={{
                  input: {
                    fontWeight: 600,
                    fontSize: 12,
                    minWidth: 200,
                    backgroundColor: "#ffffff",
                    borderColor: "#cbd5e1",
                  },
                }}
              />
            ) : (
              <Text fz={12} fw={600} c="#0f172a">
                {assignee?.name || assignee?.login || "Chưa gán"}
              </Text>
            )}
          </Box>
        </Group>

        <Group gap="xs">
          <Avatar
            src={getGitHubAvatarUrl(reporter, 64)}
            size={26}
            radius="xl"
            style={{ border: "1px solid #cbd5e1" }}
          >
            {reporter?.login?.slice(0, 2).toUpperCase() || "?"}
          </Avatar>
          <Box>
            <Text fz={11} c="#64748b">
              Người tạo task:
            </Text>
            <Text fz={12} fw={600} c="#0f172a">
              {reporter?.name || reporter?.login}
            </Text>
          </Box>
        </Group>

        <Group gap={6} c="#64748b">
          <IconClock size={14} />
          <Text fz={11}>
            Cập nhật: {formatRelativeTime(updatedAt || createdAt || "")}
          </Text>
        </Group>
      </Group>
    </Box>
  );
}
