"use client";

import {
  Alert,
  Anchor,
  Avatar,
  Badge,
  Box,
  Button,
  Group,
  Paper,
  Skeleton,
  Stack,
  Text,
} from "@mantine/core";
import { IconExternalLink, IconUserPlus } from "@tabler/icons-react";
import axios from "axios";
import { useState } from "react";
import useSWR from "swr";
import { useRepoOverviewStats } from "@/hooks/useRepoOverviewStats";
import type { GitHubRepo } from "@/interfaces/github";
import { useAuthStore } from "@/store/auth.store";
import { RepoContributors } from "../overview/RepoContributors";
import { InviteMemberModal } from "./InviteMemberModal";

type MemberList = {
  members: { login: string; avatar_url: string; role: string | null }[];
  hasNext: boolean;
};

async function fetchMembers(url: string) {
  const { data } = await axios.get<MemberList>(url);
  return data;
}

export function MembersTab({ repository }: { repository: GitHubRepo }) {
  const owner = repository.owner.login;
  const repo = repository.name;
  const [page, setPage] = useState(1);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const {
    data: stats,
    isLoading: statsLoading,
    refresh,
  } = useRepoOverviewStats(owner, repo);
  const params = new URLSearchParams({
    owner,
    repo,
    scope: "access",
    page: String(page),
  });
  const { data, error, isLoading, mutate } = useSWR(
    `/api/github/collaborators?${params}`,
    fetchMembers,
    {
      shouldRetryOnError: (error) =>
        ![401, 403, 404].includes(error.response?.status),
      errorRetryCount: 2,
    },
  );
  const accessUnavailable = [403, 404].includes(error?.response?.status);
  const login = useAuthStore((state) => state.user?.login);
  const canInvite =
    repository.permissions?.admin ??
    login?.toLowerCase() === owner.toLowerCase();
  const settingsUrl = `https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/settings/access`;

  async function refreshContributors() {
    setRefreshing(true);
    try {
      await refresh();
    } catch {
      // Keep the last successful contribution data visible.
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <Box
      component="section"
      flex={1}
      mih={0}
      className="overflow-y-auto bg-slate-50 px-4 py-6 sm:px-6"
    >
      <Stack maw={880} mx="auto" gap="xl">
        <Box>
          <Group justify="space-between" align="flex-start" mb="sm">
            <Text component="h2" fz={18} fw={700}>
              Quyền truy cập
            </Text>
            {canInvite && (
              <Group gap="xs">
                <Button
                  component="a"
                  href={settingsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="sm"
                  variant="default"
                  rightSection={<IconExternalLink size={14} />}
                >
                  Quản lý trên GitHub
                </Button>
                <Button
                  size="sm"
                  leftSection={<IconUserPlus size={16} />}
                  onClick={() => setInviteOpen(true)}
                >
                  Mời thành viên
                </Button>
              </Group>
            )}
          </Group>
          {isLoading && <Skeleton height={100} />}
          {error && !data && (
            <Alert color="gray">
              {accessUnavailable
                ? "Tài khoản GitHub hiện tại không xem được danh sách quyền truy cập."
                : "Không tải được danh sách thành viên."}
            </Alert>
          )}
          {data && (
            <Paper withBorder radius="md">
              {data.members.map((member) => (
                <Group
                  key={member.login}
                  justify="space-between"
                  p="sm"
                  className="border-b border-zinc-100 last:border-b-0"
                >
                  <Group gap="sm">
                    <Avatar size={32} src={member.avatar_url} />
                    <Anchor
                      href={`/u/${encodeURIComponent(member.login)}`}
                      fw={600}
                      fz={14}
                      c="dark"
                    >
                      {member.login}
                    </Anchor>
                  </Group>
                  {member.role && (
                    <Badge variant="light" color="gray" size="md" tt="none">
                      {member.role}
                    </Badge>
                  )}
                </Group>
              ))}
              {data.members.length === 0 && (
                <Text p="sm" c="dimmed">
                  Chưa có thành viên trong danh sách.
                </Text>
              )}
              {(page > 1 || data.hasNext) && (
                <Group justify="space-between" p="sm">
                  <Button
                    variant="default"
                    size="compact-sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Trang trước
                  </Button>
                  <Text size="sm">Trang {page}</Text>
                  <Button
                    variant="default"
                    size="compact-sm"
                    disabled={!data.hasNext}
                    onClick={() => setPage(page + 1)}
                  >
                    Trang sau
                  </Button>
                </Group>
              )}
            </Paper>
          )}
        </Box>

        <RepoContributors
          contributors={stats?.contributors}
          sampledCommits={stats?.sampledCommits ?? 0}
          loading={statsLoading}
          refreshing={refreshing}
          onRefresh={refreshContributors}
        />
      </Stack>
      <InviteMemberModal
        opened={inviteOpen}
        onClose={() => setInviteOpen(false)}
        owner={owner}
        repo={repo}
        onMemberInvited={() => {
          void mutate();
        }}
      />
    </Box>
  );
}
