"use client";

import {
  Box,
  Divider,
  Group,
  Paper,
  SimpleGrid,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconBookmark,
  IconBrandGithub,
  IconFolderOpen,
  IconUsers,
} from "@tabler/icons-react";
import { useAuthStore } from "@/store/auth.store";
import { useDashboardStore } from "@/store/dashboard.store";

export function DashboardOverview() {
  const { user } = useAuthStore();
  const { repos, orgs } = useDashboardStore();

  if (!user) return null;

  return (
    <Box
      className="hide-scrollbar"
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "40px",
        minHeight: 0,
        backgroundColor: "#faf8f6",
      }}
    >
      <Box style={{ maxWidth: 1000, margin: "0 auto", width: "100%" }}>
        <Title order={2} c="#1f1c19" mb="xs" ff="monospace">
          Tổng quan Workspace
        </Title>
        <Text c="#6e675f" mb="xl">
          Chào mừng bạn trở lại. Hãy chọn một repository ở thanh bên trái để xem
          chi tiết.
        </Text>

        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
          <Paper
            p="lg"
            bg="#ffffff"
            radius="md"
            style={{
              border: "1px solid #e8e5de",
              boxShadow: "0 1px 3px rgba(31, 28, 25, 0.04)",
            }}
          >
            <Group justify="space-between" mb="xs">
              <Text fz="sm" c="#6e675f" fw={500}>
                Repositories
              </Text>
              <ThemeIcon color="indigo" variant="light" size="md" radius="md">
                <IconBookmark size={18} />
              </ThemeIcon>
            </Group>
            <Title order={2} c="#1f1c19">
              {repos.length}
            </Title>
          </Paper>
          <Paper
            p="lg"
            bg="#ffffff"
            radius="md"
            style={{
              border: "1px solid #e8e5de",
              boxShadow: "0 1px 3px rgba(31, 28, 25, 0.04)",
            }}
          >
            <Group justify="space-between" mb="xs">
              <Text fz="sm" c="#6e675f" fw={500}>
                Organizations
              </Text>
              <ThemeIcon color="teal" variant="light" size="md" radius="md">
                <IconUsers size={18} />
              </ThemeIcon>
            </Group>
            <Title order={2} c="#1f1c19">
              {orgs.length}
            </Title>
          </Paper>
          <Paper
            p="lg"
            bg="#ffffff"
            radius="md"
            style={{
              border: "1px solid #e8e5de",
              boxShadow: "0 1px 3px rgba(31, 28, 25, 0.04)",
            }}
          >
            <Group justify="space-between" mb="xs">
              <Text fz="sm" c="#6e675f" fw={500}>
                Username
              </Text>
              <ThemeIcon color="blue" variant="light" size="md" radius="md">
                <IconBrandGithub size={18} />
              </ThemeIcon>
            </Group>
            <Title order={3} c="#1f1c19" mt={10} ff="monospace">
              @{user.login}
            </Title>
          </Paper>
        </SimpleGrid>

        <Divider my="xl" color="#e8e5de" />
        <Box ta="center" mt={60}>
          <ThemeIcon
            size={80}
            radius={100}
            variant="light"
            color="indigo"
            mb="md"
          >
            <IconFolderOpen size={40} />
          </ThemeIcon>
          <Title order={3} c="#334155">
            Chưa có Repository nào được chọn
          </Title>
          <Text c="#64748b" mt="xs">
            Nhấp vào một repository ở thanh bên trái để bắt đầu xem mã nguồn.
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
