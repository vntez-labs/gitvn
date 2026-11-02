'use client';

import { Box, Group, Text, Title, Paper, SimpleGrid, ThemeIcon, Divider } from '@mantine/core';
import { IconBookmark, IconUsers, IconBrandGithub, IconFolderOpen } from '@tabler/icons-react';
import { useAuthStore } from '@/store/auth.store';
import { useDashboardStore } from '@/store/dashboard.store';

export function DashboardOverview() {
  const { user } = useAuthStore();
  const { repos, orgs } = useDashboardStore();

  if (!user) return null;

  return (
    <Box className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '40px', minHeight: 0 }}>
      <Box style={{ maxWidth: 1000, margin: '0 auto', width: '100%' }}>
        <Title order={2} c="white" mb="xs" ff="monospace">Tổng quan Workspace</Title>
        <Text c="gray.5" mb="xl">Chào mừng bạn trở lại. Hãy chọn một repository ở thanh bên trái để xem chi tiết.</Text>

        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
          <Paper p="lg" bg="#1a1a1a" radius="md" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
            <Group justify="space-between" mb="xs">
              <Text fz="sm" c="gray.4" fw={500}>Repositories</Text>
              <ThemeIcon color="indigo" variant="light" size="md" radius="md"><IconBookmark size={18} /></ThemeIcon>
            </Group>
            <Title order={2} c="white">{repos.length}</Title>
          </Paper>
          <Paper p="lg" bg="#1a1a1a" radius="md" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
            <Group justify="space-between" mb="xs">
              <Text fz="sm" c="gray.4" fw={500}>Organizations</Text>
              <ThemeIcon color="teal" variant="light" size="md" radius="md"><IconUsers size={18} /></ThemeIcon>
            </Group>
            <Title order={2} c="white">{orgs.length}</Title>
          </Paper>
          <Paper p="lg" bg="#1a1a1a" radius="md" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
            <Group justify="space-between" mb="xs">
              <Text fz="sm" c="gray.4" fw={500}>Username</Text>
              <ThemeIcon color="gray" variant="light" size="md" radius="md"><IconBrandGithub size={18} /></ThemeIcon>
            </Group>
            <Title order={3} c="white" mt={10} ff="monospace">@{user.login}</Title>
          </Paper>
        </SimpleGrid>

        <Divider my="xl" color="rgba(255,255,255,0.05)" />
        <Box ta="center" mt={60}>
          <ThemeIcon size={80} radius={100} variant="light" color="indigo" mb="md">
            <IconFolderOpen size={40} />
          </ThemeIcon>
          <Title order={3} c="gray.4">Chưa có Repository nào được chọn</Title>
          <Text c="gray.6" mt="xs">Nhấp vào một repository ở thanh bên trái để bắt đầu xem mã nguồn.</Text>
        </Box>
      </Box>
    </Box>
  );
}
