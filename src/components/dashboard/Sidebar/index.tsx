"use client";

import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Divider,
  Group,
  Paper,
  Skeleton,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconArrowLeft,
  IconCheck,
  IconInfoCircle,
  IconMailCheck,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { CreateRepoModal } from "@/components/dashboard/CreateRepoModal";
import { useAuthStore } from "@/store/auth.store";
import { useDashboardStore } from "@/store/dashboard.store";
import { OrgListItem } from "./OrgListItem";
import { RepoListItem } from "./RepoListItem";

export function DashboardSidebar() {
  const { user } = useAuthStore();
  const {
    orgs,
    repos,
    invitations = [],
    dataLoading,
    selectedOrg,
    selectedRepo,
    selectOrg,
    selectRepo,
    fetchInitialData,
    acceptInvitation,
  } = useDashboardStore();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  if (!user) return null;

  // Lọc theo tìm kiếm
  const query = searchQuery.trim().toLowerCase();

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

  // Phân loại Repos
  const { personalRepos, collabRepos, orgRepos } = useMemo(() => {
    const userLogin = user.login.toLowerCase();

    // Repos cá nhân: do chính user sở hữu
    const pRepos = repos.filter(
      (r) =>
        r.owner?.login?.toLowerCase() === userLogin &&
        (!query ||
          r.name.toLowerCase().includes(query) ||
          r.full_name?.toLowerCase().includes(query)),
    );

    // Repos cộng tác: do user khác hoặc bên ngoài tạo mà user được chia sẻ/mời vào
    const cRepos = repos.filter((r) => {
      const isOwner = r.owner?.login?.toLowerCase() === userLogin;
      const isSelectedOrg =
        selectedOrg &&
        r.owner?.login?.toLowerCase() === selectedOrg.toLowerCase();
      // Không phải do user sở hữu
      if (isOwner) return false;
      // Nếu đang chọn Org thì repo của Org đó sẽ được tính vào orgRepos
      if (isSelectedOrg) return false;

      if (!query) return true;
      return (
        r.name.toLowerCase().includes(query) ||
        r.full_name?.toLowerCase().includes(query) ||
        r.owner?.login?.toLowerCase().includes(query)
      );
    });

    // Repos của Organization đang chọn
    const oRepos = selectedOrg
      ? repos.filter(
          (r) =>
            r.owner?.login?.toLowerCase() === selectedOrg.toLowerCase() &&
            (!query ||
              r.name.toLowerCase().includes(query) ||
              r.full_name?.toLowerCase().includes(query)),
        )
      : [];

    return {
      personalRepos: pRepos,
      collabRepos: cRepos,
      orgRepos: oRepos,
    };
  }, [repos, user.login, selectedOrg, query]);

  return (
    <Box
      w={270}
      style={{
        borderRight: "1px solid #e4e4e7",
        backgroundColor: "#f4f4f5",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <Box
        className="hide-scrollbar"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 10px 10px",
          minHeight: 0,
        }}
      >
        {/* ORGANIZATIONS HEADER */}
        <Group justify="space-between" mb={8} px="xs" align="center">
          <Text
            fz={11}
            fw={700}
            c="#71717a"
            style={{ letterSpacing: "0.08em", fontFamily: "monospace" }}
          >
            ORGANIZATIONS
          </Text>
          <Tooltip
            label="Không thấy Organization? Nhấp để cấp quyền truy cập GitHub cho GitVN"
            position="right"
            withArrow
            multiline
            w={240}
          >
            <ActionIcon
              size="xs"
              variant="subtle"
              color="gray"
              component="a"
              href="/api/integrations/github?reconnect=true"
            >
              <IconInfoCircle size={14} color="#71717a" />
            </ActionIcon>
          </Tooltip>
        </Group>

        {dataLoading ? (
          <Stack gap="xs" px="xs" mb="md">
            <Skeleton height={32} radius="sm" />
            <Skeleton height={32} radius="sm" />
          </Stack>
        ) : (
          <Stack gap={2} mb="md">
            {orgs.length > 0 ? (
              orgs.map((org) => {
                const isSelected = selectedOrg
                  ? selectedOrg.toLowerCase() === org.login.toLowerCase()
                  : org.login.toLowerCase() === user.login.toLowerCase();

                return (
                  <OrgListItem
                    key={org.id}
                    org={org}
                    isSelected={isSelected}
                    onSelect={() => {
                      if (
                        (org as any).isUser ||
                        org.login.toLowerCase() === user.login.toLowerCase()
                      ) {
                        selectOrg(null);
                      } else {
                        selectOrg(org.login);
                      }
                    }}
                  />
                );
              })
            ) : (
              <Text fz={12} c="#a1a1aa" px="xs">
                Không có organization nào.
              </Text>
            )}
          </Stack>
        )}

        <Divider my="sm" color="#e4e4e7" />

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
              <Text fz={11} fw={700} c="#b91c1c" ff="monospace">
                LỜI MỜI MỚI ({invitations.length})
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
                  <Text fz={10} c="#71717a" mb={4} truncate>
                    Từ @{inv.inviter?.login || "ai đó"}
                  </Text>
                  <Button
                    size="compact-xs"
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

        {/* SEARCH REPOSITORIES */}
        <TextInput
          size="xs"
          placeholder="Tìm repository..."
          leftSection={<IconSearch size={13} color="#a1a1aa" />}
          rightSection={
            query ? (
              <ActionIcon
                size="xs"
                variant="subtle"
                color="gray"
                onClick={() => setSearchQuery("")}
              >
                <IconX size={12} />
              </ActionIcon>
            ) : null
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          mb="sm"
          styles={{
            input: {
              backgroundColor: "#ffffff",
              borderColor: "#e4e4e7",
              fontSize: 12,
              borderRadius: 6,
            },
          }}
        />

        {/* REPOSITORIES HEADER */}
        <Group justify="space-between" mb={8} px="xs" align="center">
          <Text
            fz={11}
            fw={700}
            c="#71717a"
            style={{ letterSpacing: "0.08em", fontFamily: "monospace" }}
          >
            {selectedOrg
              ? `REPOS CỦA ${selectedOrg.toUpperCase()}`
              : "REPOSITORIES"}
          </Text>
          <Group gap={4} wrap="nowrap">
            {selectedOrg && (
              <Tooltip label="Quay lại cá nhân & cộng tác" withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="gray"
                  onClick={() => selectOrg(null)}
                >
                  <IconArrowLeft size={14} color="#71717a" />
                </ActionIcon>
              </Tooltip>
            )}
            <Tooltip label="Đồng bộ / Làm mới" withArrow>
              <ActionIcon
                size="sm"
                variant="subtle"
                color="gray"
                loading={refreshing}
                onClick={handleRefresh}
              >
                <IconRefresh size={14} color="#71717a" />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Tạo Repository mới" withArrow>
              <ActionIcon
                size="sm"
                variant="subtle"
                color="red"
                onClick={() => setCreateModalOpen(true)}
              >
                <IconPlus size={15} color="#dc2626" />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>

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
                  onSelect={() => selectRepo(repo)}
                />
              ))
            ) : (
              <Text fz={12} c="#a1a1aa" px="xs" py="xs">
                {query
                  ? "Không tìm thấy repository phù hợp."
                  : "Không có repository nào trong tổ chức này."}
              </Text>
            )}
          </Stack>
        ) : (
          // HIỂN THỊ REPOS CÁ NHÂN VÀ CỘNG TÁC (CHIA SẺ)
          <Stack gap="sm">
            {/* NHÓM REPOS CÁ NHÂN */}
            {personalRepos.length > 0 && (
              <Box>
                <Group justify="space-between" px="xs" mb={4}>
                  <Text fz={10} fw={700} c="#a1a1aa" ff="monospace">
                    CÁ NHÂN ({personalRepos.length})
                  </Text>
                </Group>
                <Stack gap={2}>
                  {personalRepos.map((repo) => (
                    <RepoListItem
                      key={repo.id}
                      repo={repo}
                      isSelected={selectedRepo?.id === repo.id}
                      onSelect={() => selectRepo(repo)}
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
                  <Text fz={10} fw={700} c="#a1a1aa" ff="monospace">
                    CỘNG TÁC & CHIA SẺ ({collabRepos.length})
                  </Text>
                  <Badge size="xs" variant="light" color="blue" radius="sm">
                    Shared
                  </Badge>
                </Group>
                <Stack gap={2}>
                  {collabRepos.map((repo) => (
                    <RepoListItem
                      key={repo.id}
                      repo={repo}
                      isSelected={selectedRepo?.id === repo.id}
                      onSelect={() => selectRepo(repo)}
                      showOwner={true}
                    />
                  ))}
                </Stack>
              </Box>
            )}

            {personalRepos.length === 0 && collabRepos.length === 0 && (
              <Text fz={12} c="#a1a1aa" px="xs" py="xs">
                {query
                  ? "Không tìm thấy repository phù hợp."
                  : "Không có repository nào."}
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
