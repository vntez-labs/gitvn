"use client";

import {
  ActionIcon,
  Anchor,
  Avatar,
  Box,
  Group,
  Paper,
  Skeleton,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { IconRefresh, IconUsers } from "@tabler/icons-react";
import type { RepoContributor } from "@/interfaces/repo-overview";

export function RepoContributors({
  contributors,
  sampledCommits,
  loading,
  refreshing,
  onRefresh,
}: {
  contributors?: RepoContributor[] | null;
  sampledCommits: number;
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const people = contributors?.toSorted(
    (a, b) => b.commits - a.commits || a.login.localeCompare(b.login),
  );

  return (
    <Box mb="xl">
      <Group justify="space-between" mb="xs">
        <Group gap="xs">
          <IconUsers size={18} color="#fb291a" />
          <Text component="h2" fz={16} fw={700}>
            Đóng góp theo commit
          </Text>
        </Group>
        <Tooltip label="Làm mới thống kê">
          <ActionIcon
            variant="subtle"
            color="gray"
            loading={refreshing}
            onClick={onRefresh}
            aria-label="Làm mới thống kê"
          >
            <IconRefresh size={16} />
          </ActionIcon>
        </Tooltip>
      </Group>
      {sampledCommits > 0 && (
        <Text fz={13} c="#475569" mb="sm">
          Từ {sampledCommits} commit gần nhất trên nhánh mặc định, bỏ qua merge
          commit và commit chưa gắn với tài khoản GitHub.
        </Text>
      )}
      <Paper withBorder radius="md">
        {loading ? (
          <Stack p="md" gap="sm">
            <Skeleton height={24} />
            <Skeleton height={24} />
          </Stack>
        ) : people?.length ? (
          <Stack gap={0}>
            {people.map((person, index) => (
              <Group
                key={person.login}
                justify="space-between"
                px="md"
                py="sm"
                style={{
                  borderTop: index > 0 ? "1px solid #e2e8f0" : undefined,
                }}
              >
                <Group gap="sm" wrap="nowrap" maw="100%">
                  <Avatar src={person.avatarUrl} size={34} radius="xl" />
                  <Box miw={0}>
                    <Anchor
                      href={`/u/${encodeURIComponent(person.login)}`}
                      fw={650}
                      fz={14}
                      c="#0f172a"
                    >
                      {person.name}
                    </Anchor>
                    {person.name !== person.login && (
                      <Text fz={13} c="#475569" lineClamp={1}>
                        @{person.login}
                      </Text>
                    )}
                  </Box>
                </Group>
                <Group
                  gap="md"
                  fz={13}
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  <Text size="inherit" fw={650}>
                    {person.commits.toLocaleString()} commit
                  </Text>
                  <Text
                    size="inherit"
                    c="#166534"
                    aria-label={`${person.additions} dòng thêm`}
                  >
                    +{person.additions.toLocaleString()}
                  </Text>
                  <Text
                    size="inherit"
                    c="#b91c1c"
                    aria-label={`${person.deletions} dòng xóa`}
                  >
                    −{person.deletions.toLocaleString()}
                  </Text>
                </Group>
              </Group>
            ))}
          </Stack>
        ) : (
          <Text p="md" fz={14} c="#475569">
            {contributors
              ? "Chưa có commit gắn với tài khoản GitHub."
              : "Chưa tải được dữ liệu đóng góp."}
          </Text>
        )}
      </Paper>
    </Box>
  );
}
