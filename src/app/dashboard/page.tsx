"use client";

import {
  ActionIcon,
  Alert,
  Avatar,
  Box,
  Drawer,
  Group,
  Menu,
  Skeleton,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconBrandGithub,
  IconLogout,
  IconMenu2,
  IconRefresh,
  IconUser,
} from "@tabler/icons-react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GitVNLogo } from "@/components/brand/GitVNLogo";
import {
  OrganizationPicker,
  RepositorySearch,
} from "@/components/dashboard/DashboardHeaderControls";
import { DashboardOverview } from "@/components/dashboard/Overview";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { RepoWorkspace } from "@/components/RepoWorkspace";
import type { GitHubRepo } from "@/interfaces/github";
import { useAuthStore } from "@/store/auth.store";
import { useDashboardStore } from "@/store/dashboard.store";

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated } = useAuthStore();
  const selectedRepo = useDashboardStore((state) => state.selectedRepo);
  const fetchInitialData = useDashboardStore((state) => state.fetchInitialData);
  const router = useRouter();
  const [reposOpen, reposDrawer] = useDisclosure(false);
  const [linkedPull, setLinkedPull] = useState<{
    repoId: number;
    number: number;
  }>();
  const initialPull =
    linkedPull && linkedPull.repoId === selectedRepo?.id
      ? linkedPull.number
      : undefined;
  const [restoringRepo, setRestoringRepo] = useState(true);
  const [linkError, setLinkError] = useState("");
  const login = user?.login;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated || !login) return;
    const controller = new AbortController();
    async function openWorkspace() {
      const params = new URLSearchParams(window.location.search);
      const saved = useDashboardStore.getState();
      const repoName = params.get("repo") || saved.selectedRepo?.full_name;
      if (!repoName) {
        setRestoringRepo(false);
        void fetchInitialData();
        return;
      }

      const [owner, repo, extra] = repoName.split("/");
      try {
        if (!owner || !repo || extra !== undefined)
          throw new Error("Invalid repository");
        const query = new URLSearchParams({ owner, repo });
        const { data } = await axios.get<GitHubRepo>(
          `/api/github/repo?${query}`,
          { signal: controller.signal },
        );
        if (controller.signal.aborted) return;
        const current = useDashboardStore.getState();
        if (
          current.selectedRepo?.id !== saved.selectedRepo?.id ||
          current.currentBranch !== saved.currentBranch ||
          current.activeFile !== saved.activeFile
        )
          return;
        const linked = params.has("repo");
        const number = Number(params.get("pr"));
        if (linked && Number.isSafeInteger(number) && number > 0)
          setLinkedPull({ repoId: data.id, number });
        const opening = current.selectRepo(
          data,
          linked ? params.get("file") : saved.activeFile,
          linked ? params.get("branch") : saved.currentBranch,
        );
        setRestoringRepo(false);
        await opening;
      } catch (error) {
        if (controller.signal.aborted) return;
        if (
          !params.has("repo") &&
          axios.isAxiosError(error) &&
          [403, 404].includes(error.response?.status ?? 0)
        ) {
          const current = useDashboardStore.getState();
          if (current.selectedRepo?.id === saved.selectedRepo?.id)
            current.resetWorkspace();
        }
        setLinkError(
          "Không thể mở repo GitHub. Hãy chọn repo hoặc thử tải lại.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setRestoringRepo(false);
          void fetchInitialData();
        }
      }
    }
    void openWorkspace();
    return () => controller.abort();
  }, [isAuthenticated, login, fetchInitialData]);

  if (isLoading || !user) {
    return (
      <Box h="100vh" bg="#ffffff" p="xl">
        <Skeleton height={40} width={200} mb="xl" />
        <Group align="flex-start" gap="xl">
          <Skeleton height={600} width={270} />
          <Skeleton height={600} style={{ flex: 1 }} />
        </Group>
      </Box>
    );
  }

  return (
    <Box
      h="100vh"
      bg="#ffffff"
      style={{ display: "flex", flexDirection: "column" }}
    >
      <style>{`
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      <Box
        component="header"
        className="dashboard-topbar"
        style={{ borderBottom: "1px solid #d4d4d8" }}
        px={{ base: "xs", sm: "lg" }}
        py={7}
      >
        <Group justify="space-between" wrap="nowrap" gap="xs">
          <Group gap="xs" wrap="nowrap" miw={0}>
            <UnstyledButton
              component={Link}
              href="/"
              className="dashboard-brand"
              style={{ display: "inline-flex", alignItems: "center", gap: 7 }}
              aria-label="GitVN"
            >
              <GitVNLogo size={27} />
              <Text component="span" fw={750} fz={17}>
                Git<span style={{ color: "#dc2626" }}>VN</span>
              </Text>
            </UnstyledButton>
            <OrganizationPicker />
          </Group>

          <Group gap="xs" wrap="nowrap">
            <ActionIcon
              hiddenFrom="md"
              variant="default"
              aria-label="Mở danh sách repository"
              onClick={reposDrawer.open}
            >
              <IconMenu2 size={18} />
            </ActionIcon>
            <RepositorySearch />
            <Menu shadow="md" width={220} position="bottom-end">
              <Menu.Target>
                <UnstyledButton
                  className="dashboard-avatar-trigger"
                  aria-label={`Tài khoản ${user.login}`}
                >
                  <Avatar src={user.avatar_url} alt="" radius="xl" size={30} />
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown bg="#ffffff" style={{ borderColor: "#e4e4e7" }}>
                <Menu.Label c="#71717a" fz={12}>
                  Tài khoản {user.name || user.login}
                </Menu.Label>
                <Menu.Item
                  leftSection={<IconUser size={15} color="#dc2626" />}
                  component="a"
                  href={`/u/${user.login}`}
                  target="_blank"
                  c="#18181b"
                  fz={13}
                  fw={600}
                >
                  Trang Insights cá nhân (@{user.login})
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconBrandGithub size={15} />}
                  component="a"
                  href={user.html_url}
                  target="_blank"
                  c="#18181b"
                  fz={13}
                >
                  GitHub Profile
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconRefresh size={15} />}
                  component="a"
                  href="/api/integrations/github?reconnect=true"
                  c="#18181b"
                  fz={13}
                >
                  Cập nhật quyền GitHub
                </Menu.Item>

                <Menu.Divider style={{ borderColor: "#e4e4e7" }} />
                <Menu.Item
                  color="red"
                  leftSection={<IconLogout size={15} />}
                  component="a"
                  href="/api/auth/logout"
                  fz={13}
                >
                  Đăng xuất
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </Box>

      {/* MAIN LAYOUT */}
      <Box
        style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}
      >
        {/* Cột trái: Sidebar điều khiển danh sách Repo */}
        <Box visibleFrom="md">
          <DashboardSidebar />
        </Box>
        <Drawer
          opened={reposOpen}
          onClose={reposDrawer.close}
          title="Repository"
          size="xs"
        >
          <Box h="75dvh">
            <DashboardSidebar onRepoSelect={reposDrawer.close} />
          </Box>
        </Drawer>

        {/* Cột phải: Nếu có chọn Repo thì hiển thị Workspace, chưa thì ra Overview */}
        <Box
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            minHeight: 0,
            minWidth: 0,
          }}
        >
          {linkError && (
            <Alert
              color="yellow"
              withCloseButton
              onClose={() => setLinkError("")}
            >
              {linkError}
            </Alert>
          )}
          {restoringRepo ? (
            <Box p="lg" role="status" aria-label="Đang mở repository">
              <Skeleton height={26} width="40%" mb="md" />
              <Skeleton height={280} />
            </Box>
          ) : selectedRepo ? (
            <RepoWorkspace
              key={`${selectedRepo.id}:${initialPull ?? ""}`}
              initialPull={initialPull}
            />
          ) : (
            <DashboardOverview />
          )}
        </Box>
      </Box>
    </Box>
  );
}
