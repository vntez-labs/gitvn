'use client';

import { useEffect } from 'react';
import { Box, Group, Text, Avatar, Menu, Skeleton } from '@mantine/core';
import { IconLogout, IconGitBranch, IconBrandGithub } from '@tabler/icons-react';
import { useAuthStore } from '@/store/auth.store';
import { useDashboardStore } from '@/store/dashboard.store';
import { useRouter } from 'next/navigation';

import { DashboardSidebar } from '@/components/dashboard/Sidebar';
import { DashboardOverview } from '@/components/dashboard/Overview';
import { RepoWorkspace } from '@/components/RepoWorkspace';

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated } = useAuthStore();
  const { selectedRepo, fetchInitialData } = useDashboardStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchInitialData();
    }
  }, [isAuthenticated, fetchInitialData]);

  if (isLoading || !user) {
    return (
      <Box h="100vh" bg="#0d1117" p="xl">
        <Skeleton height={40} width={200} mb="xl" />
        <Group align="flex-start" gap="xl">
          <Skeleton height={600} width={260} />
          <Skeleton height={600} style={{ flex: 1 }} />
        </Group>
      </Box>
    );
  }

  return (
    <Box h="100vh" bg="#0d1117" style={{ display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      {/* HEADER */}
      <Box
        component="header"
        py="xs"
        px="lg"
        style={{ borderBottom: '1px solid #30363d', backgroundColor: '#161b22', flexShrink: 0 }}
      >
        <Group justify="space-between">
          <Group gap="sm">
            <Box
              w={28}
              h={28}
              style={{
                borderRadius: 6,
                background: '#238636',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconGitBranch size={16} color="white" stroke={2.5} />
            </Box>
            <Text fw={600} fz="sm" c="#f0f6fc" ff="monospace">
              GitVN Workspace
            </Text>
          </Group>

          <Menu shadow="md" width={200} position="bottom-end">
            <Menu.Target>
              <Group gap="xs" style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}>
                <Avatar src={user.avatar_url} alt={user.login} radius="xl" size="sm" />
                <Text fz="xs" fw={500} c="#c9d1d9">
                  {user.login}
                </Text>
              </Group>
            </Menu.Target>
            <Menu.Dropdown bg="#161b22" style={{ borderColor: '#30363d' }}>
              <Menu.Label c="#8b949e">Tài khoản {user.name || user.login}</Menu.Label>
              <Menu.Item
                leftSection={<IconBrandGithub size={14} />}
                component="a"
                href={user.html_url}
                target="_blank"
                c="#c9d1d9"
              >
                GitHub Profile
              </Menu.Item>
              <Menu.Divider style={{ borderColor: '#30363d' }} />
              <Menu.Item
                color="red"
                leftSection={<IconLogout size={14} />}
                component="a"
                href="/api/auth/logout"
              >
                Đăng xuất
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Box>

      {/* MAIN LAYOUT */}
      <Box style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {/* Cột trái: Sidebar điều khiển danh sách Repo */}
        <DashboardSidebar />

        {/* Cột phải: Nếu có chọn Repo thì hiển thị Workspace, chưa thì ra Overview */}
        <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
          {selectedRepo ? <RepoWorkspace /> : <DashboardOverview />}
        </Box>
      </Box>
    </Box>
  );
}
