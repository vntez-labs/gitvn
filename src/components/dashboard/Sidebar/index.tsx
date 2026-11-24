"use client";

import {
  ActionIcon,
  Box,
  Button,
  Group,
  Paper,
  Skeleton,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconCheck,
  IconMailCheck,
  IconPlus,
  IconRefresh,
} from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import { CreateRepoModal } from "@/components/dashboard/CreateRepoModal";
import { useAuthStore } from "@/store/auth.store";
import { useDashboardStore } from "@/store/dashboard.store";
import { RepoListItem } from "./RepoListItem";

export function DashboardSidebar({
  onRepoSelect,
}: {
  onRepoSelect?: () => void;
}) {
  const user = useAuthStore((s) => s.user);
  const repos = useDashboardStore((s) => s.repos);
  const invitations = useDashboardStore((s) => s.invitations || []);
  const dataLoading = useDashboardStore((s) => s.dataLoading);
  const selectedOrg = useDashboardStore((s) => s.selectedOrg);
  const selectedRepo = useDashboardStore((s) => s.selectedRepo);
  const selectRepo = useDashboardStore((s) => s.selectRepo);
  const fetchInitialData = useDashboardStore((s) => s.fetchInitialData);
  const acceptInvitation = useDashboardStore((s) => s.acceptInvitation);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const userLogin = user?.login.toLowerCase();
  const [recentIds, setRecentIds] = useState<number[]>([]);
  useEffect(() => {
    if (!userLogin) return;
    const key = `gitvn:recent-repos:${userLogin}`;
    try {
      const stored: unknown = JSON.parse(
        window.localStorage.getItem(key) || "[]",
      );
      const ids = Array.isArray(stored)
        ? stored.filter((id): id is number => Number.isSafeInteger(id))
        : [];
      const next = selectedRepo
        ? [
            selectedRepo.id,
            ...ids.filter((id) => id !== selectedRepo.id),
          ].slice(0, 5)
        : ids;
      if (selectedRepo) window.localStorage.setItem(key, JSON.stringify(next));
      setRecentIds(next);
    } catch {
      setRecentIds([]);
    }
  }, [userLogin, selectedRepo]);
  const recentRepos = recentIds.flatMap((id) =>
    repos.filter((repo) => repo.id === id),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchInitialData(true);
      notifications.show({
        title: "Đã cập nhật",
        message:
          "Danh sách Repository và Organization đã được đồng bộ mới nhất.",
        color: "teal",
      });
    } catch {
      notifications.show({
        title: "Lỗi",
        message: "Không thể làm mới dữ liệu.",
        color: "red",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleAcceptInvite = async (invitationId: number, repoName: string) => {
    setAcceptingId(invitationId);
    try {
      const ok = await acceptInvitation(invitationId);
      if (ok) {
        notifications.show({
          title: "Thành công",
          message: `Đã chấp nhận lời mời tham gia "${repoName}".`,
          color: "teal",
        });
      } else {
        notifications.show({
          title: "Thất bại",
          message: "Không thể chấp nhận lời mời.",
          color: "red",
        });
      }
    } finally {
      setAcceptingId(null);
    }
  };

  const { personalRepos, collabRepos, orgRepos } = useMemo(() => {
    const orgLogin = selectedOrg?.toLowerCase();
    return {
      personalRepos: repos.filter(
        (repo) => repo.owner.login.toLowerCase() === userLogin,
      ),
      collabRepos: repos.filter(
        (repo) => repo.owner.login.toLowerCase() !== userLogin,
      ),
      orgRepos: orgLogin
        ? repos.filter((repo) => repo.owner.login.toLowerCase() === orgLogin)
        : [],
    };
  }, [repos, userLogin, selectedOrg]);

  if (!user) return null;

  return (
    <Box
      w={onRepoSelect ? "100%" : 270}
      h="100%"
      style={{
        borderRight: "1px solid #e4e4e7",
        backgroundColor: "#fafafa",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      {/* REPOSITORIES HEADER */}
      <Group
        justify="space-between"
        px="xs"
        py="xs"
        align="center"
        wrap="nowrap"
      >
        <Text component="h2" fz={15} fw={700} truncate miw={0}>
          Repository
        </Text>
        <Group gap={4} wrap="nowrap">
          <Tooltip label="Đồng bộ / Làm mới" withArrow>
            <ActionIcon
              size="md"
              variant="subtle"
              color="gray"
              aria-label="Làm mới repository"
              loading={refreshing}
              onClick={handleRefresh}
            >
              <IconRefresh size={14} color="#71717a" />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Tạo Repository mới" withArrow>
            <ActionIcon
              size="md"
              variant="subtle"
              color="red"
              aria-label="Tạo repository"
              onClick={() => setCreateModalOpen(true)}
            >
              <IconPlus size={15} color="#dc2626" />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      <Box
        className="hide-scrollbar"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px 10px",
          minHeight: 0,
        }}
      >
        {/* LỜI MỜI REPO CHƯA ACCEPT (NẾU CÓ) */}
        {invitations.length > 0 && (
          <Paper
            p="xs"
            mb="md"
            radius="md"
            bg="#fef2f2"
            style={{ border: "1px solid #fecaca" }}
          >
            <Group gap={6} mb={6}>
              <IconMailCheck size={15} color="#dc2626" />
              <Text fz={13} fw={700} c="#b91c1c">
                Lời mời mới ({invitations.length})
              </Text>
            </Group>
            <Stack gap={6}>
              {invitations.map((inv: any) => (
                <Box
                  key={inv.id}
                  p={6}
                  bg="#ffffff"
                  style={{
                    borderRadius: 6,
                    border: "1px solid #fee2e2",
                  }}
                >
                  <Text fz={12} fw={600} c="#18181b" truncate>
                    {inv.repository?.name || "Repository"}
                  </Text>
                  <Text fz={12} c="#71717a" mb={4} truncate>
                    Từ @{inv.inviter?.login || "ai đó"}
                  </Text>
                  <Button
                    size="compact-sm"
                    color="red"
                    variant="filled"
                    fullWidth
                    loading={acceptingId === inv.id}
                    onClick={() =>
                      handleAcceptInvite(inv.id, inv.repository?.name || "repo")
                    }
                    leftSection={<IconCheck size={12} />}
                  >
                    Chấp nhận
                  </Button>
                </Box>
              ))}
            </Stack>
          </Paper>
        )}

        {!selectedOrg && recentRepos.length > 0 && (
          <Stack gap={4} mb="sm">
            <Text fz={12} fw={650} c="#52525b" px="xs">
              Repo gần đây
            </Text>
            {recentRepos.map((repo) => (
              <Button
                key={repo.id}
                variant="subtle"
                color="gray"
                size="compact-sm"
                justify="start"
                onClick={() => {
                  void selectRepo(repo);
                  onRepoSelect?.();
                }}
              >
                {repo.full_name}
              </Button>
            ))}
          </Stack>
        )}

        {/* DANH SÁCH REPOS */}
        {dataLoading ? (
          <Stack gap="xs" px="xs">
            <Skeleton height={32} radius="sm" />
            <Skeleton height={32} radius="sm" />
            <Skeleton height={32} radius="sm" />
          </Stack>
        ) : selectedOrg ? (
          // HIỂN THỊ REPOS CỦA ORGANIZATION
          <Stack gap={2}>
            {orgRepos.length > 0 ? (
              orgRepos.map((repo) => (
                <RepoListItem
                  key={repo.id}
                  repo={repo}
                  isSelected={selectedRepo?.id === repo.id}
                  onSelect={() => {
                    void selectRepo(repo);
                    onRepoSelect?.();
                  }}
                />
              ))
            ) : (
              <Text fz={13} c="#52525b" px="xs" py="xs">
                Không có repository nào trong tổ chức này.
              </Text>
            )}
          </Stack>
        ) : (
          // HIỂN THỊ REPOS Cá nhân VÀ CỘNG TÁC (CHIA SẺ)
          <Stack gap="sm">
            {/* NHÓM REPOS Cá nhân */}
            {personalRepos.length > 0 && (
              <Box>
                <Group justify="space-between" px="xs" mb={4}>
                  <Text fz={12} fw={650} c="#52525b">
                    Cá nhân ({personalRepos.length})
                  </Text>
                </Group>
                <Stack gap={2}>
                  {personalRepos.map((repo) => (
                    <RepoListItem
                      key={repo.id}
                      repo={repo}
                      isSelected={selectedRepo?.id === repo.id}
                      onSelect={() => {
                        void selectRepo(repo);
                        onRepoSelect?.();
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            )}

            {/* NHÓM REPOS CỘNG TÁC / ĐƯỢC CHIA SẺ */}
            {collabRepos.length > 0 && (
              <Box>
                <Group
                  justify="space-between"
                  px="xs"
                  mb={4}
                  mt={personalRepos.length > 0 ? 6 : 0}
                >
                  <Text fz={12} fw={650} c="#52525b">
                    Được chia sẻ ({collabRepos.length})
                  </Text>
                </Group>
                <Stack gap={2}>
                  {collabRepos.map((repo) => (
                    <RepoListItem
                      key={repo.id}
                      repo={repo}
                      isSelected={selectedRepo?.id === repo.id}
                      onSelect={() => {
                        void selectRepo(repo);
                        onRepoSelect?.();
                      }}
                      showOwner={true}
                    />
                  ))}
                </Stack>
              </Box>
            )}

            {personalRepos.length === 0 && collabRepos.length === 0 && (
              <Text fz={13} c="#52525b" px="xs" py="xs">
                Không có repository nào.
              </Text>
            )}
          </Stack>
        )}
      </Box>

      <CreateRepoModal
        opened={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </Box>
  );
}
