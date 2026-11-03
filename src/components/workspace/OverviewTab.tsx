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
  IconGitFork,
  IconStar,
  IconUsers,
} from "@tabler/icons-react";
import axios from "axios";
import { useEffect, useState } from "react";
import { useRepoOverviewMetrics } from "@/hooks/useRepoOverviewMetrics";
import { useDashboardStore } from "@/store/dashboard.store";
import { formatCompactNumber } from "./constants";
import { CommitFrequencyChart } from "./overview/CommitFrequencyChart";
import { ContributorsLeaderboard } from "./overview/ContributorsLeaderboard";
import { LanguageStatsSection } from "./overview/LanguageStatsSection";
import { PulseHealthSection } from "./overview/PulseHealthSection";

export function OverviewTab() {
  const { selectedRepo, currentBranch, tree } = useDashboardStore();

  const [statsData, setStatsData] = useState<{
    contributors: any[];
    totalContributors?: number;
    totalCommits?: number;
    activity: any[];
    pulse?: {
      pulls: {
        total: number;
        open: number;
        merged: number;
        closed: number;
        mergeRate: number;
      };
      issues: {
        total: number;
        open: number;
        closed: number;
        closeRate: number;
      };
    };
  }>({
    contributors: [],
    activity: [],
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<"impact" | "prs" | "lines" | "commits">(
    "impact",
  );

  const fetchStats = (forceRefresh = false) => {
    if (!selectedRepo) return;
    if (forceRefresh) setRefreshing(true);
    else setLoadingStats(true);

    const url = `/api/github/stats?owner=${selectedRepo.owner.login}&repo=${selectedRepo.name}${
      forceRefresh ? "&refresh=true" : ""
    }`;

    axios
      .get(url)
      .then((res) => {
        setStatsData(res.data);
      })
      .catch((err) => console.error("Lỗi tải thống kê repo:", err))
      .finally(() => {
        setLoadingStats(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    fetchStats(false);
  }, [selectedRepo?.id]);

  // Hook tính toán các chỉ số thống kê & ngôn ngữ
  const { timelineMetrics, rankedContributors, languageStats } =
    useRepoOverviewMetrics(statsData, sortBy, tree);

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
        {/* ABOUT */}
        <Box mb="xl">
          <Text
            fz={10}
            fw={700}
            c="#64748b"
            mb={4}
            style={{ letterSpacing: "0.08em" }}
          >
            ABOUT
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
                Members
              </Text>
              <ThemeIcon color="teal" variant="light" size="sm" radius="md">
                <IconUsers size={14} />
              </ThemeIcon>
            </Group>
            <Tooltip
              label={`${(statsData.totalContributors || rankedContributors.length).toLocaleString()} members`}
              withArrow
            >
              <Text fz="xl" fw={700} c="#0f172a" mt={4}>
                {statsData.totalContributors || rankedContributors.length}
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
                Default Branch
              </Text>
              <ThemeIcon color="indigo" variant="light" size="sm" radius="md">
                <IconGitBranch size={14} />
              </ThemeIcon>
            </Group>
            <Text fz="sm" fw={600} c="#0f172a" mt={8} ff="monospace" truncate>
              {currentBranch}
            </Text>
          </Paper>
        </SimpleGrid>

        {/* SECTION 1: PULSE (PULL REQUESTS & ISSUES) */}
        <PulseHealthSection pulse={statsData.pulse} />

        {/* SECTION 2: BIỂU ĐỒ LỊCH SỬ COMMIT */}
        <CommitFrequencyChart
          statsData={statsData}
          timelineMetrics={timelineMetrics}
          loadingStats={loadingStats}
        />

        {/* SECTION 3: BẢNG XẾP HẠNG THÀNH VIÊN ĐA CHIỀU */}
        <ContributorsLeaderboard
          rankedContributors={rankedContributors}
          statsData={statsData}
          loadingStats={loadingStats}
          refreshing={refreshing}
          fetchStats={fetchStats}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />

        {/* SECTION 4: TỶ LỆ NGÔN NGỮ */}
        <LanguageStatsSection languageStats={languageStats} />
      </Box>
    </Box>
  );
}
