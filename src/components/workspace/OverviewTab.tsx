"use client";

import {
  Box,
  Group,
  Paper,
  SimpleGrid,
  Text,
  ThemeIcon,
  Tooltip,
} from "@mantine/core";
import {
  IconGitBranch,
  IconGitCommit,
  IconGitFork,
  IconStar,
} from "@tabler/icons-react";
import { useRepoOverviewMetrics } from "@/hooks/useRepoOverviewMetrics";
import { useRepoOverviewStats } from "@/hooks/useRepoOverviewStats";
import { useDashboardStore } from "@/store/dashboard.store";
import { formatCompactNumber } from "./constants";
import { CommitFrequencyChart } from "./overview/CommitFrequencyChart";
import { LanguageStatsSection } from "./overview/LanguageStatsSection";
import { PulseHealthSection } from "./overview/PulseHealthSection";

export function OverviewTab() {
  const { selectedRepo, tree } = useDashboardStore();
  const { data, isLoading } = useRepoOverviewStats(
    selectedRepo?.owner.login,
    selectedRepo?.name,
  );
  const languageStats = useRepoOverviewMetrics(tree);

  if (!selectedRepo) return null;

  const starsCount = selectedRepo.stargazers_count ?? 0;
  const forksCount = selectedRepo.forks_count ?? 0;

  return (
    <Box
      className="hide-scrollbar"
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "32px 24px",
        minHeight: 0,
        backgroundColor: "#f8fafc",
      }}
    >
      <Box style={{ maxWidth: 960, margin: "0 auto" }}>
        {/* Giới thiệu */}
        <Box mb="xl">
          <Text fz={13} fw={700} c="#64748b" mb={4}>
            Giới thiệu
          </Text>
          <Text
            fz="md"
            c={selectedRepo.description ? "#0f172a" : "#64748b"}
            lh={1.6}
          >
            {selectedRepo.description ||
              "Chưa có mô tả chi tiết cho repository này."}
          </Text>
        </Box>

        {/* 4 THẺ THỐNG KÊ NHANH */}
        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md" mb="xl">
          <Paper
            p="md"
            bg="#ffffff"
            radius="md"
            style={{
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <Group justify="space-between">
              <Text fz="xs" c="#64748b" fw={500}>
                Stars
              </Text>
              <ThemeIcon color="yellow" variant="light" size="sm" radius="md">
                <IconStar size={14} />
              </ThemeIcon>
            </Group>
            <Tooltip label={`${starsCount.toLocaleString()} stars`} withArrow>
              <Text fz="xl" fw={700} c="#0f172a" mt={4}>
                {formatCompactNumber(starsCount)}
              </Text>
            </Tooltip>
          </Paper>

          <Paper
            p="md"
            bg="#ffffff"
            radius="md"
            style={{
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <Group justify="space-between">
              <Text fz="xs" c="#64748b" fw={500}>
                Forks
              </Text>
              <ThemeIcon color="gray" variant="light" size="sm" radius="md">
                <IconGitFork size={14} />
              </ThemeIcon>
            </Group>
            <Tooltip label={`${forksCount.toLocaleString()} forks`} withArrow>
              <Text fz="xl" fw={700} c="#0f172a" mt={4}>
                {formatCompactNumber(forksCount)}
              </Text>
            </Tooltip>
          </Paper>

          <Paper
            p="md"
            bg="#ffffff"
            radius="md"
            style={{
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <Group justify="space-between">
              <Text fz="xs" c="#64748b" fw={500}>
                Commit nhánh mặc định
              </Text>
              <ThemeIcon color="teal" variant="light" size="sm" radius="md">
                <IconGitCommit size={14} />
              </ThemeIcon>
            </Group>
            <Text
              fz="xl"
              fw={700}
              c="#0f172a"
              mt={4}
              title="Tổng commit trên nhánh mặc định"
            >
              {data?.totalCommits?.toLocaleString() ?? "—"}
            </Text>
          </Paper>

          <Paper
            p="md"
            bg="#ffffff"
            radius="md"
            style={{
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <Group justify="space-between">
              <Text fz="xs" c="#64748b" fw={500}>
                Nhánh mặc định
              </Text>
              <ThemeIcon color="indigo" variant="light" size="sm" radius="md">
                <IconGitBranch size={14} />
              </ThemeIcon>
            </Group>
            <Text fz="sm" fw={600} c="#0f172a" mt={8} truncate>
              {selectedRepo.default_branch ?? "—"}
            </Text>
          </Paper>
        </SimpleGrid>

        <PulseHealthSection pulse={data?.pulse} loading={isLoading} />

        <CommitFrequencyChart
          activity={data?.activity}
          loadingStats={isLoading}
        />

        <LanguageStatsSection languageStats={languageStats} />
      </Box>
    </Box>
  );
}
