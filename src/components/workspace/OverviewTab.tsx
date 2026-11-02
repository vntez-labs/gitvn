"use client";

import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Group,
  Paper,
  Progress,
  RingProgress,
  SegmentedControl,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
  Tooltip,
} from "@mantine/core";
import {
  IconActivity,
  IconCircleCheck,
  IconCircleDot,
  IconGitBranch,
  IconGitFork,
  IconGitMerge,
  IconGitPullRequest,
  IconInfoCircle,
  IconRefresh,
  IconSparkles,
  IconStar,
  IconUsers,
} from "@tabler/icons-react";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { useDashboardStore } from "@/store/dashboard.store";
import { formatCompactNumber, LANG_METADATA } from "./constants";
import { CommitFrequencyChart } from "./overview/CommitFrequencyChart";
import { ContributorsLeaderboard } from "./overview/ContributorsLeaderboard";

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

  // Bộ lọc sắp xếp đóng góp: 'impact' (điểm tổng hợp) | 'prs' (PRs đã merge) | 'lines' (dòng code) | 'commits'
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

  // 1. TIMELINE BIỂU ĐỒ SÓNG (52 tuần gần nhất)
  const timelineMetrics = useMemo(() => {
    const rawActivity = statsData.activity;
    if (!Array.isArray(rawActivity) || rawActivity.length === 0) {
      return { weeks: [], maxCommits: 1, totalAllTime: 0, peakWeek: 0 };
    }

    const firstActiveIndex = rawActivity.findIndex((w) => w.total > 0);
    const activeWeeks =
      firstActiveIndex !== -1
        ? rawActivity.slice(firstActiveIndex)
        : rawActivity;
    const maxCommits = Math.max(...activeWeeks.map((w) => w.total), 1);
    const totalAllTime = activeWeeks.reduce(
      (acc, w) => acc + (w.total || 0),
      0,
    );

    return {
      weeks: activeWeeks,
      maxCommits,
      totalAllTime,
      peakWeek: maxCommits,
    };
  }, [statsData.activity]);

  // 2. BẢNG XẾP HẠNG THÀNH VIÊN ĐA CHIỀU
  const rankedContributors = useMemo(() => {
    const rawContributors = statsData.contributors || [];
    if (!Array.isArray(rawContributors) || rawContributors.length === 0)
      return [];

    // Tính chỉ số Impact Score
    const enhanced = rawContributors.map((c: any) => {
      const mergedPRs = c.mergedPRs || 0;
      const mergedByCount = c.mergedByCount || 0;
      const additions = c.additions || 0;
      const deletions = c.deletions || 0;
      const linesChanged = additions + deletions;
      const commits = c.commits || 0;

      const impactScore = Math.round(
        mergedPRs * 35 +
          mergedByCount * 25 +
          commits * 2 +
          Math.min(Math.round(linesChanged / 100), 200),
      );

      return {
        ...c,
        mergedPRs,
        mergedByCount,
        linesChanged,
        impactScore,
      };
    });

    enhanced.sort((a, b) => {
      if (sortBy === "impact") return b.impactScore - a.impactScore;
      if (sortBy === "prs")
        return b.mergedPRs - a.mergedPRs || b.mergedByCount - a.mergedByCount;
      if (sortBy === "lines") return b.linesChanged - a.linesChanged;
      return b.commits - a.commits;
    });

    const maxVal = Math.max(
      ...enhanced.map((c) => {
        if (sortBy === "impact") return c.impactScore;
        if (sortBy === "prs") return Math.max(c.mergedPRs, c.mergedByCount);
        if (sortBy === "lines") return c.linesChanged;
        return c.commits;
      }),
      1,
    );

    return enhanced.map((c) => {
      let currentVal = c.impactScore;
      if (sortBy === "prs") currentVal = Math.max(c.mergedPRs, c.mergedByCount);
      if (sortBy === "lines") currentVal = c.linesChanged;
      if (sortBy === "commits") currentVal = c.commits;

      return {
        ...c,
        percent: Math.min(Math.round((currentVal / maxVal) * 100), 100),
      };
    });
  }, [statsData.contributors, sortBy]);

  // 3. THỐNG KÊ TỶ LỆ NGÔN NGỮ
  const languageStats = useMemo(() => {
    if (!tree || tree.length === 0) return [];
    const counts: Record<string, number> = {};
    let totalFiles = 0;

    tree.forEach((node) => {
      if (node.type === "blob") {
        const ext = node.path.split(".").pop()?.toLowerCase();
        if (ext) {
          counts[ext] = (counts[ext] || 0) + 1;
          totalFiles++;
        }
      }
    });

    return Object.entries(counts)
      .map(([ext, count]) => {
        const meta = LANG_METADATA[ext] || {
          name: ext.toUpperCase(),
          color: "#94a3b8",
        };
        return {
          name: meta.name,
          color: meta.color,
          count,
          percent: Math.round((count / totalFiles) * 100),
        };
      })
      .filter((l) => l.percent > 0)
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 5);
  }, [tree]);

  if (!selectedRepo) return null;

  const starsCount = selectedRepo.stargazers_count ?? 0;
  const forksCount = selectedRepo.forks_count ?? 0;
  const pulse = statsData.pulse;

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
        <Box mb="xl">
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {/* PULL REQUESTS */}
            <Paper
              p="md"
              bg="#ffffff"
              radius="md"
              style={{
                border: "1px solid #e2e8f0",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <Group justify="space-between" align="flex-start">
                <Box>
                  <Text fz="xs" c="#64748b" fw={600}>
                    PULL REQUESTS
                  </Text>
                  <Tooltip
                    label={`${(pulse?.pulls.total ?? 0).toLocaleString()} pull requests`}
                    withArrow
                  >
                    <Text fz={24} fw={700} c="#0f172a" mt={2} ff="monospace">
                      {formatCompactNumber(pulse?.pulls.total ?? 0)}
                    </Text>
                  </Tooltip>
                </Box>
                <RingProgress
                  size={64}
                  thickness={6}
                  roundCaps
                  sections={[
                    { value: pulse?.pulls.mergeRate ?? 0, color: "violet" },
                  ]}
                  label={
                    <Text ta="center" fz={11} fw={700} c="#0f172a">
                      {pulse?.pulls.mergeRate ?? 0}%
                    </Text>
                  }
                />
              </Group>

              <Stack gap={8} mt="xs">
                <Group justify="space-between">
                  <Group gap={6}>
                    <IconGitMerge size={14} color="#7c3aed" />
                    <Text fz={12} c="#334155">
                      Đã Merge
                    </Text>
                  </Group>
                  <Tooltip
                    label={`${(pulse?.pulls.merged ?? 0).toLocaleString()} PRs`}
                    withArrow
                  >
                    <Text fz={12} fw={600} c="#7c3aed" ff="monospace">
                      {formatCompactNumber(pulse?.pulls.merged ?? 0)}
                    </Text>
                  </Tooltip>
                </Group>

                <Group justify="space-between">
                  <Group gap={6}>
                    <IconGitPullRequest size={14} color="#16a34a" />
                    <Text fz={12} c="#334155">
                      Đang mở (Open)
                    </Text>
                  </Group>
                  <Tooltip
                    label={`${(pulse?.pulls.open ?? 0).toLocaleString()} PRs`}
                    withArrow
                  >
                    <Text fz={12} fw={600} c="#16a34a" ff="monospace">
                      {formatCompactNumber(pulse?.pulls.open ?? 0)}
                    </Text>
                  </Tooltip>
                </Group>

                <Group justify="space-between">
                  <Group gap={6}>
                    <IconGitPullRequest size={14} color="#dc2626" />
                    <Text fz={12} c="#334155">
                      Đã đóng (Closed)
                    </Text>
                  </Group>
                  <Tooltip
                    label={`${(pulse?.pulls.closed ?? 0).toLocaleString()} PRs`}
                    withArrow
                  >
                    <Text fz={12} fw={600} c="#dc2626" ff="monospace">
                      {formatCompactNumber(pulse?.pulls.closed ?? 0)}
                    </Text>
                  </Tooltip>
                </Group>
              </Stack>
            </Paper>

            {/* ISSUES RESOLUTION */}
            <Paper
              p="md"
              bg="#ffffff"
              radius="md"
              style={{
                border: "1px solid #e2e8f0",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <Group justify="space-between" align="flex-start">
                <Box>
                  <Text fz="xs" c="#64748b" fw={600}>
                    ISSUES RESOLUTION
                  </Text>
                  <Tooltip
                    label={`${(pulse?.issues.total ?? 0).toLocaleString()} issues`}
                    withArrow
                  >
                    <Text fz={24} fw={700} c="#0f172a" mt={2} ff="monospace">
                      {formatCompactNumber(pulse?.issues.total ?? 0)}
                    </Text>
                  </Tooltip>
                </Box>
                <RingProgress
                  size={64}
                  thickness={6}
                  roundCaps
                  sections={[
                    { value: pulse?.issues.closeRate ?? 0, color: "teal" },
                  ]}
                  label={
                    <Text ta="center" fz={11} fw={700} c="#0f172a">
                      {pulse?.issues.closeRate ?? 0}%
                    </Text>
                  }
                />
              </Group>

              <Stack gap={8} mt="xs">
                <Group justify="space-between">
                  <Group gap={6}>
                    <IconCircleCheck size={14} color="#16a34a" />
                    <Text fz={12} c="#334155">
                      Đã xử lý xong
                    </Text>
                  </Group>
                  <Tooltip
                    label={`${(pulse?.issues.closed ?? 0).toLocaleString()} issues`}
                    withArrow
                  >
                    <Text fz={12} fw={600} c="#16a34a" ff="monospace">
                      {formatCompactNumber(pulse?.issues.closed ?? 0)}
                    </Text>
                  </Tooltip>
                </Group>

                <Group justify="space-between">
                  <Group gap={6}>
                    <IconCircleDot size={14} color="#d97706" />
                    <Text fz={12} c="#334155">
                      Đang mở (Open)
                    </Text>
                  </Group>
                  <Tooltip
                    label={`${(pulse?.issues.open ?? 0).toLocaleString()} issues`}
                    withArrow
                  >
                    <Text fz={12} fw={600} c="#d97706" ff="monospace">
                      {formatCompactNumber(pulse?.issues.open ?? 0)}
                    </Text>
                  </Tooltip>
                </Group>

                <Group justify="space-between">
                  <Text fz={11} c="#64748b">
                    Tỷ lệ hoàn thành
                  </Text>
                  <Badge size="xs" variant="outline" color="teal">
                    {pulse?.issues.closeRate ?? 0}% solved
                  </Badge>
                </Group>
              </Stack>
            </Paper>
          </SimpleGrid>
        </Box>

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
        {languageStats.length > 0 && (
          <Box mb="xl">
            <Text
              fz={10}
              fw={700}
              c="#64748b"
              mb="xs"
              style={{ letterSpacing: "0.08em" }}
            >
              LANGUAGES
            </Text>

            <Progress.Root
              size="sm"
              radius="xl"
              mb="md"
              style={{ backgroundColor: "#e2e8f0" }}
            >
              {languageStats.map((lang) => (
                <Tooltip
                  key={lang.name}
                  label={`${lang.name}: ${lang.percent}% (${lang.count} files)`}
                  withArrow
                >
                  <Progress.Section value={lang.percent} color={lang.color} />
                </Tooltip>
              ))}
            </Progress.Root>

            <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
              {languageStats.map((lang) => (
                <Group key={lang.name} gap="xs">
                  <Box
                    w={8}
                    h={8}
                    style={{ borderRadius: "50%", backgroundColor: lang.color }}
                  />
                  <Text fz={12} c="#0f172a" fw={500}>
                    {lang.name}
                  </Text>
                  <Text fz={12} c="#64748b">
                    {lang.percent}%
                  </Text>
                </Group>
              ))}
            </SimpleGrid>
          </Box>
        )}
      </Box>
    </Box>
  );
}
