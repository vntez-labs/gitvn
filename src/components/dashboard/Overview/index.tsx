"use client";

import {
  ActionIcon,
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconBookmark,
  IconBrandGithub,
  IconCheck,
  IconFolderOpen,
  IconInfoCircle,
  IconLock,
  IconMailCheck,
  IconRefresh,
  IconStar,
  IconUsers,
} from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { RepoLangIcon } from "@/components/dashboard/Sidebar/RepoLangIcon";
import type { GitHubRepo } from "@/interfaces/github";
import { formatCompactNumber } from "@/lib/time";
import { useAuthStore } from "@/store/auth.store";
import { useDashboardStore } from "@/store/dashboard.store";

export function DashboardOverview() {
  const { user } = useAuthStore();
  const {
    repos,
    orgs,
    invitations = [],
    selectRepo,
    fetchInitialData,
    acceptInvitation,
  } = useDashboardStore();

  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  if (!user) return null;

  const userLogin = user.login.toLowerCase();

  const { personalRepos, collabRepos } = useMemo(() => {
    const pRepos: GitHubRepo[] = [];
    const cRepos: GitHubRepo[] = [];

    repos.forEach((repo) => {
      if (repo.owner?.login?.toLowerCase() === userLogin) {
        pRepos.push(repo);
      } else {
        cRepos.push(repo);
      }
    });

    return { personalRepos: pRepos, collabRepos: cRepos };
  }, [repos, userLogin]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchInitialData();
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

  return (
    <Box
      className="hide-scrollbar"
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "40px",
        minHeight: 0,
        backgroundColor: "#ffffff",
      }}
    >
      <Box style={{ maxWidth: 1040, margin: "0 auto", width: "100%" }}>
        {/* HEADER SECTION */}
        <Group justify="space-between" align="flex-start" mb="xl">
          <Box>
            <Title order={2} c="#18181b" mb={4} ff="monospace">
              Tổng quan Workspace
            </Title>
            <Text c="#71717a">
              Chào mừng bạn trở lại, <b>@{user.login}</b>. Chọn một repository
              để bắt đầu làm việc.
            </Text>
          </Box>
          <Button
            size="xs"
            variant="default"
            loading={refreshing}
            onClick={handleRefresh}
            leftSection={<IconRefresh size={14} />}
          >
            Đồng bộ dữ liệu
          </Button>
        </Group>

        {/* THÔNG BÁO LỜI MỜI REPO (NẾU CÓ) */}
        {invitations.length > 0 && (
          <Alert
            icon={<IconMailCheck size={18} />}
            title={`Bạn có ${invitations.length} lời mời tham gia Repository`}
            color="red"
            variant="light"
            mb="xl"
            radius="md"
          >
            <Text fz={13} mb="sm">
              Bạn được người khác mời cộng tác vào các dự án dưới đây. Hãy bấm
              chấp nhận để hiển thị trong Workspace của bạn:
            </Text>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
              {invitations.map((inv: any) => (
                <Card
                  key={inv.id}
                  padding="xs"
                  radius="sm"
                  withBorder
                  bg="#ffffff"
                >
                  <Group justify="space-between">
                    <Box style={{ minWidth: 0, flex: 1 }}>
                      <Text fz={13} fw={600} truncate c="#18181b">
                        {inv.repository?.full_name || inv.repository?.name}
                      </Text>
                      <Text fz={11} c="#71717a">
                        Mời bởi @{inv.inviter?.login || "thành viên"}
                      </Text>
                    </Box>
                    <Button
                      size="xs"
                      color="red"
                      variant="filled"
                      loading={acceptingId === inv.id}
                      onClick={() =>
                        handleAcceptInvite(
                          inv.id,
                          inv.repository?.name || "repo",
                        )
                      }
                      leftSection={<IconCheck size={13} />}
                    >
                      Chấp nhận
                    </Button>
                  </Group>
                </Card>
              ))}
            </SimpleGrid>
          </Alert>
        )}

        {/* METRIC CARDS */}
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg" mb="xl">
          <Paper
            p="lg"
            bg="#ffffff"
            radius="md"
            style={{
              border: "1px solid #e4e4e7",
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
            }}
          >
            <Group justify="space-between" mb="xs">
              <Text fz="sm" c="#71717a" fw={500}>
                Repositories
              </Text>
              <ThemeIcon color="indigo" variant="light" size="md" radius="md">
                <IconBookmark size={18} />
              </ThemeIcon>
            </Group>
            <Title order={2} c="#18181b">
              {repos.length}
            </Title>
            <Text fz={11} c="#71717a" mt={4}>
              {personalRepos.length} cá nhân • {collabRepos.length} cộng tác &
              org
            </Text>
          </Paper>

          <Paper
            p="lg"
            bg="#ffffff"
            radius="md"
            style={{
              border: "1px solid #e4e4e7",
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
            }}
          >
            <Group justify="space-between" mb="xs">
              <Text fz="sm" c="#71717a" fw={500}>
                Organizations
              </Text>
              <ThemeIcon color="teal" variant="light" size="md" radius="md">
                <IconUsers size={18} />
              </ThemeIcon>
            </Group>
            <Title order={2} c="#18181b">
              {orgs.length}
            </Title>
            <Text fz={11} c="#71717a" mt={4}>
              Tài khoản & các tổ chức liên kết
            </Text>
          </Paper>

          <Paper
            p="lg"
            bg="#ffffff"
            radius="md"
            style={{
              border: "1px solid #e4e4e7",
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
            }}
          >
            <Group justify="space-between" mb="xs">
              <Text fz="sm" c="#71717a" fw={500}>
                GitHub Account
              </Text>
              <ThemeIcon color="blue" variant="light" size="md" radius="md">
                <IconBrandGithub size={18} />
              </ThemeIcon>
            </Group>
            <Title order={3} c="#18181b" ff="monospace">
              @{user.login}
            </Title>
            <Text fz={11} c="#71717a" mt={4}>
              {user.name || "GitHub User"}
            </Text>
          </Paper>
        </SimpleGrid>

        {/* HƯỚNG DẪN NẾU THIẾU ORG */}
        <Alert
          icon={<IconInfoCircle size={18} />}
          title="Không thấy Organization hoặc Repository của người khác?"
          color="gray"
          variant="light"
          radius="md"
          mb="xl"
          styles={{
            root: { backgroundColor: "#fafafa", borderColor: "#e4e4e7" },
            title: { color: "#27272a", fontSize: 13, fontWeight: 600 },
            message: { color: "#52525b", fontSize: 12 },
          }}
        >
          <Text fz={12} c="#52525b" mb={6}>
            1. <b>Repository người khác tạo:</b> Đã được hiển thị trong mục{" "}
            <b>&quot;CỘNG TÁC & CHIA SẺ&quot;</b> ở thanh bên trái hoặc danh
            sách bên dưới. Nếu bạn chưa được mời, hãy gửi username{" "}
            <code>@{user.login}</code> để họ thêm bạn làm Collaborator.
          </Text>
          <Text fz={12} c="#52525b">
            2. <b>Tổ chức (Organization) trên GitHub:</b> GitHub mặc định bật cơ
            chế bảo vệ bên thứ ba. Nếu bạn không thấy Organization, hãy bấm{" "}
            <a
              href="/api/integrations/github?reconnect=true"
              style={{ color: "#dc2626", fontWeight: 600 }}
            >
              Cập nhật quyền GitHub tại đây
            </a>{" "}
            hoặc yêu cầu Owner của Tổ chức phê duyệt (Grant access) cho ứng dụng
            GitVN trong Organization Settings.
          </Text>
        </Alert>

        <Divider my="lg" color="#e4e4e7" />

        {/* DANH SÁCH TOÀN BỘ REPOSITORIES DẠNG GRID */}
        <Box mb="xl">
          <Group justify="space-between" mb="md">
            <Title order={3} fz={16} c="#18181b" ff="monospace">
              TẤT CẢ REPOSITORIES ({repos.length})
            </Title>
            <Text fz={12} c="#71717a">
              Nhấp vào bất kỳ repository nào để mở Workspace
            </Text>
          </Group>

          {repos.length === 0 ? (
            <Box ta="center" py={40}>
              <ThemeIcon
                size={60}
                radius={100}
                variant="light"
                color="indigo"
                mb="md"
              >
                <IconFolderOpen size={30} />
              </ThemeIcon>
              <Title order={4} c="#18181b">
                Chưa có Repository nào
              </Title>
              <Text c="#71717a" fz="sm" mt="xs">
                Bạn chưa sở hữu hoặc tham gia repository nào trên tài khoản này.
              </Text>
            </Box>
          ) : (
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              {repos.map((repo) => {
                const isPersonal =
                  repo.owner?.login?.toLowerCase() === userLogin;

                return (
                  <Card
                    key={repo.id}
                    p="md"
                    radius="md"
                    withBorder
                    style={{
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      border: "1px solid #e4e4e7",
                      backgroundColor: "#ffffff",
                    }}
                    onClick={() => selectRepo(repo)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#dc2626";
                      e.currentTarget.style.boxShadow =
                        "0 4px 12px rgba(0, 0, 0, 0.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#e4e4e7";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <Group justify="space-between" wrap="nowrap" mb={6}>
                      <Group
                        gap={8}
                        wrap="nowrap"
                        style={{ minWidth: 0, flex: 1 }}
                      >
                        <RepoLangIcon repo={repo} />
                        <Text
                          fz={14}
                          fw={600}
                          c="#18181b"
                          ff="monospace"
                          truncate
                        >
                          {repo.name}
                        </Text>
                      </Group>
                      <Group gap={6} wrap="nowrap" style={{ flexShrink: 0 }}>
                        {repo.private && (
                          <Badge
                            size="xs"
                            variant="light"
                            color="gray"
                            leftSection={<IconLock size={10} />}
                          >
                            Private
                          </Badge>
                        )}
                        {!isPersonal ? (
                          <Badge size="xs" variant="light" color="blue">
                            Shared
                          </Badge>
                        ) : (
                          <Badge size="xs" variant="light" color="teal">
                            Personal
                          </Badge>
                        )}
                      </Group>
                    </Group>

                    <Text fz={12} c="#71717a" lineClamp={2} mb="sm" h={36}>
                      {repo.description || "Không có mô tả cho repository này."}
                    </Text>

                    <Divider color="#f4f4f5" mb="xs" />

                    <Group justify="space-between" align="center">
                      <Group gap={6} wrap="nowrap">
                        <Avatar
                          src={repo.owner?.avatar_url}
                          size={18}
                          radius="xl"
                        />
                        <Text fz={11} c="#71717a">
                          @{repo.owner?.login}
                        </Text>
                      </Group>

                      {repo.stargazers_count !== undefined &&
                        repo.stargazers_count > 0 && (
                          <Group gap={4} wrap="nowrap">
                            <IconStar
                              size={12}
                              color="#eab308"
                              fill="#eab308"
                            />
                            <Text fz={11} c="#71717a" ff="monospace">
                              {formatCompactNumber(repo.stargazers_count)}
                            </Text>
                          </Group>
                        )}
                    </Group>
                  </Card>
                );
              })}
            </SimpleGrid>
          )}
        </Box>
      </Box>
    </Box>
  );
}
