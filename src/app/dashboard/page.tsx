"use client";

import {
  Avatar,
  Box,
  Group,
  Menu,
  Skeleton,
  Text,
  Tooltip,
} from "@mantine/core";
import {
  IconBrandFacebook,
  IconBrandGithub,
  IconLogout,
  IconRefresh,
  IconUser,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { GitVNLogo } from "@/components/brand/GitVNLogo";
import { DashboardOverview } from "@/components/dashboard/Overview";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { RepoWorkspace } from "@/components/RepoWorkspace";
import { useAuthStore } from "@/store/auth.store";
import { useDashboardStore } from "@/store/dashboard.store";

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated } = useAuthStore();
  const { selectedRepo, fetchInitialData } = useDashboardStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchInitialData();
    }
  }, [isAuthenticated, fetchInitialData]);

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
        .user-profile-btn:hover { background-color: #f5f3ee; }
      `}</style>

      {/* HEADER */}
      <Box
        component="header"
        py="xs"
        px="lg"
        style={{
          borderBottom: "1px solid #e8e5de",
          backgroundColor: "#ffffff",
          flexShrink: 0,
        }}
      >
        <Group justify="space-between">
          <Group
            gap="sm"
            style={{ cursor: "pointer" }}
            onClick={() => router.push("/")}
          >
            <GitVNLogo size={28} />
            <Text fw={700} fz={15} c="#0f172a" ff="monospace">
              Git<span style={{ color: "#fb291a" }}>VN</span>{" "}
              <span style={{ color: "#64748b", fontWeight: 500, fontSize: 13 }}>
                Workspace
              </span>
            </Text>
          </Group>

          <Group gap="sm">
            <Tooltip label="Tác giả: Nguyễn Hoàng Nam (@hnamhocit)" withArrow>
              <Box
                component="a"
                href="https://github.com/hnamhocit"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  textDecoration: "none",
                  backgroundColor: "#f8fafc",
                  padding: "4px 10px",
                  borderRadius: 20,
                  border: "1px solid #e2e8f0",
                }}
              >
                <Text fz={11} fw={600} c="#64748b">
                  by{" "}
                  <Text span c="#fb291a" fw={700}>
                    @hnamhocit
                  </Text>
                </Text>
              </Box>
            </Tooltip>

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
                  <Text fz={14} fw={600} c="#1e293b">
                    {user.login}
                  </Text>
                </Group>
              </Menu.Target>
              <Menu.Dropdown bg="#ffffff" style={{ borderColor: "#e2e8f0" }}>
                <Menu.Label c="#64748b" fz={12}>
                  Tài khoản {user.name || user.login}
                </Menu.Label>
                <Menu.Item
                  leftSection={<IconUser size={15} color="#fb291a" />}
                  component="a"
                  href={`/u/${user.login}`}
                  target="_blank"
                  c="#1e293b"
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
                  c="#1e293b"
                  fz={13}
                >
                  GitHub Profile
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconRefresh size={15} />}
                  component="a"
                  href="/api/integrations/github?reconnect=true"
                  c="#1e293b"
                  fz={13}
                >
                  Cập nhật quyền GitHub
                </Menu.Item>

                <Menu.Divider style={{ borderColor: "#e2e8f0" }} />
                <Menu.Label c="#64748b" fz={12}>
                  Tác giả / Creator
                </Menu.Label>
                <Menu.Item
                  leftSection={<IconBrandGithub size={15} />}
                  component="a"
                  href="https://github.com/hnamhocit"
                  target="_blank"
                  rel="noopener noreferrer"
                  c="#1e293b"
                  fz={13}
                >
                  github/hnamhocit
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconBrandFacebook size={15} color="#1877f2" />}
                  component="a"
                  href="https://facebook.com/hnamhocit"
                  target="_blank"
                  rel="noopener noreferrer"
                  c="#1e293b"
                  fz={13}
                >
                  facebook/hnamhocit
                </Menu.Item>

                <Menu.Divider style={{ borderColor: "#e2e8f0" }} />
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
        <DashboardSidebar />

        {/* Cột phải: Nếu có chọn Repo thì hiển thị Workspace, chưa thì ra Overview */}
        <Box
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            minHeight: 0,
          }}
        >
          {selectedRepo ? <RepoWorkspace /> : <DashboardOverview />}
        </Box>
      </Box>
    </Box>
  );
}
