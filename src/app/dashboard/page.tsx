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
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GitVNLogo } from "@/components/brand/GitVNLogo";
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
        .user-profile-btn:hover { background-color: #f4f4f5; }
      `}</style>

      {/* TOP HEADER */}
      <Box
        component="header"
        py="xs"
        px={{ base: "xs", sm: "lg" }}
        style={{
          borderBottom: "1px solid #e4e4e7",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <Group justify="space-between">
          <Group
            gap="sm"
            style={{ cursor: "pointer" }}
            onClick={() => router.push("/")}
          >
            <GitVNLogo size={28} />
            <Text fw={700} fz={15} c="#18181b" ff="monospace">
              Git<span style={{ color: "#dc2626" }}>VN</span>{" "}
              <span style={{ color: "#71717a", fontWeight: 500, fontSize: 13 }}>
                Workspace
              </span>
            </Text>
          </Group>

          <Group gap="sm">
            <ActionIcon
              hiddenFrom="md"
              variant="default"
              aria-label="Mở danh sách repository"
              onClick={reposDrawer.open}
            >
              <IconMenu2 size={18} />
            </ActionIcon>
            <Menu shadow="md" width={220} position="bottom-end">
              <Menu.Target>
                <Group
                  gap="xs"
                  style={{
                    cursor: "pointer",
                    padding: "5px 10px",
                    borderRadius: 6,
                    transition: "background 0.15s ease",
                  }}
                  className="user-profile-btn"
                >
                  <Avatar
                    src={user.avatar_url}
                    alt={user.login}
                    radius="xl"
                    size="sm"
                  />
                  <Text fz={14} fw={600} c="#18181b">
                    {user.login}
                  </Text>
                </Group>
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
          title="Repositories"
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
