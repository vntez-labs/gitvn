"use client";

import {
  Badge,
  Box,
  Group,
  Paper,
  Progress,
  SimpleGrid,
  Stack,
  Text,
} from "@mantine/core";
import {
  IconBox,
  IconCalendar,
  IconFlame,
  IconGitCommit,
  IconGitFork,
  IconGitMerge,
  IconGitPullRequest,
  IconStar,
} from "@tabler/icons-react";
import { ContributionHeatmap, LEVEL_COLORS } from "./ContributionHeatmap";

export { LEVEL_COLORS };

interface UserStatsMatrixProps {
  data: any;
  formatCompactNumber: (n: number) => string;
}

export function UserStatsMatrix({
  data,
  formatCompactNumber,
}: UserStatsMatrixProps) {
  return (
    <Stack gap="lg">
      {/* BẢNG 1: THÂM NIÊN & TÍNH KỶ LUẬT (SENIORITY & STREAK) */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
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
            <Text fz="xs" c="#64748b" fw={600}>
              THÂM NIÊN GITHUB
            </Text>
            <IconCalendar size={16} color="#fb291a" />
          </Group>
          <Text fz={22} fw={700} c="#0f172a" mt={2} ff="monospace">
            {data.seniority?.years} năm {data.seniority?.months} tháng
          </Text>
          <Text fz={11} c="#64748b" mt={4}>
            Tham gia từ: {data.seniority?.formattedJoined}
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
            <Text fz="xs" c="#64748b" fw={600}>
              CHUỖI HOẠT ĐỘNG (STREAK)
            </Text>
            <IconFlame size={16} color="#fb291a" />
          </Group>
          <Text fz={22} fw={700} c="#fb291a" mt={2} ff="monospace">
            {data.streak?.maxStreak} ngày{" "}
            <span style={{ fontSize: 13, color: "#64748b", fontWeight: 400 }}>
              kỷ lục
            </span>
          </Text>
          <Text fz={11} c="#64748b" mt={4}>
            Chuỗi hiện tại:{" "}
            <b style={{ color: "#0f172a" }}>
              {data.streak?.currentStreak} ngày liên tiếp
            </b>
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
            <Text fz="xs" c="#64748b" fw={600}>
              TỔNG ĐÓNG GÓP (TOTAL)
            </Text>
            <IconGitCommit size={16} color="#fb291a" />
          </Group>
          <Text fz={22} fw={700} c="#0f172a" mt={2} ff="monospace">
            {formatCompactNumber(data.stats?.totalContributions ?? 0)}
          </Text>
          <Text fz={11} c="#64748b" mt={4}>
            commits, PRs & reviews
          </Text>
        </Paper>
      </SimpleGrid>

      {/* BẢNG 2: BIỂU ĐỒ ĐÓNG GÓP (CONTRIBUTION HEATMAP) */}
      <ContributionHeatmap
        totalContributions={data.stats?.totalContributions ?? 0}
        calendarWeeks={data.calendarWeeks}
      />

      {/* BẢNG 3: BỐN THẺ CHỈ SỐ CỘNG TÁC THẬT */}
      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
        <Paper
          p="md"
          bg="#ffffff"
          radius="md"
          style={{ border: "1px solid #e2e8f0" }}
        >
          <Group justify="space-between">
            <Text fz="xs" c="#64748b" fw={600}>
              TOTAL COMMITS
            </Text>
            <IconGitCommit size={15} color="#fb291a" />
          </Group>
          <Text fz={20} fw={700} c="#0f172a" mt={4} ff="monospace">
            {formatCompactNumber(data.stats?.totalCommits ?? 0)}
          </Text>
        </Paper>

        <Paper
          p="md"
          bg="#ffffff"
          radius="md"
          style={{ border: "1px solid #e2e8f0" }}
        >
          <Group justify="space-between">
            <Text fz="xs" c="#64748b" fw={600}>
              PULL REQUESTS
            </Text>
            <IconGitPullRequest size={15} color="#8b5cf6" />
          </Group>
          <Text fz={20} fw={700} c="#0f172a" mt={4} ff="monospace">
            {formatCompactNumber(data.stats?.totalPRs ?? 0)}
          </Text>
        </Paper>

        <Paper
          p="md"
          bg="#ffffff"
          radius="md"
          style={{ border: "1px solid #e2e8f0" }}
        >
          <Group justify="space-between">
            <Text fz="xs" c="#64748b" fw={600}>
              MERGED PRs
            </Text>
            <IconGitMerge size={15} color="#10b981" />
          </Group>
          <Text fz={20} fw={700} c="#0f172a" mt={4} ff="monospace">
            {formatCompactNumber(data.stats?.mergedPRs ?? 0)}
          </Text>
        </Paper>

        <Paper
          p="md"
          bg="#ffffff"
          radius="md"
          style={{ border: "1px solid #e2e8f0" }}
        >
          <Group justify="space-between">
            <Text fz="xs" c="#64748b" fw={600}>
              STARS RECEIVED
            </Text>
            <IconStar size={15} color="#f59e0b" />
          </Group>
          <Text fz={20} fw={700} c="#0f172a" mt={4} ff="monospace">
            {formatCompactNumber(data.stats?.starsReceived ?? 0)}
          </Text>
        </Paper>
      </SimpleGrid>
    </Stack>
  );
}
