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
  Tooltip,
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

export const LEVEL_COLORS: Record<string, string> = {
  NONE: "#ebedf0",
  FIRST_QUARTILE: "#ffc5be",
  SECOND_QUARTILE: "#fca59b",
  THIRD_QUARTILE: "#f87171",
  FOURTH_QUARTILE: "#fb291a",
};

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
            <span
              style={{
                fontSize: 13,
                color: "#64748b",
                fontWeight: 400,
              }}
            >
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
              ĐỘ HOÀN THIỆN (SHIP-READY)
            </Text>
            <IconBox size={16} color="#16a34a" />
          </Group>
          <Text fz={22} fw={700} c="#16a34a" mt={2} ff="monospace">
            {data.shipReadiness?.totalReleases}{" "}
            <span
              style={{
                fontSize: 13,
                color: "#64748b",
                fontWeight: 400,
              }}
            >
              Releases
            </span>
          </Text>
          <Text fz={11} c="#64748b" mt={4}>
            {data.shipReadiness?.licenseRate}% repo có License chuẩn
          </Text>
        </Paper>
      </SimpleGrid>

      {/* BẢNG 2: HEATMAP CONTRIBUTION CALENDAR 52 TUẦN */}
      <Paper
        p="lg"
        radius="md"
        bg="#ffffff"
        style={{
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <Group justify="space-between" align="baseline" mb="md">
          <Box>
            <Text fz={16} fw={700} c="#0f172a">
              {data.stats?.totalContributions ?? 0} đóng góp trong 1 năm qua
            </Text>
            <Text fz={11} c="#64748b">
              Bao gồm commits, pull requests, code reviews và mở issues
            </Text>
          </Box>

          <Group gap={4} align="center">
            <Text fz={10} c="#64748b">
              Ít
            </Text>
            {Object.entries(LEVEL_COLORS).map(([lvl, color]) => (
              <Box
                key={lvl}
                w={10}
                h={10}
                style={{ backgroundColor: color, borderRadius: 2 }}
              />
            ))}
            <Text fz={10} c="#64748b">
              Nhiều
            </Text>
          </Group>
        </Group>

        <Box style={{ overflowX: "auto", paddingBottom: 6 }}>
          <Box style={{ display: "flex", gap: 3, minWidth: 780 }}>
            {data.calendarWeeks?.map((week: any, wIdx: number) => (
              <Box
                key={wIdx}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                }}
              >
                {week.contributionDays?.map((day: any) => (
                  <Tooltip
                    key={day.date}
                    label={`${day.contributionCount} đóng góp vào ${day.date}`}
                    withArrow
                  >
                    <Box
                      w={11}
                      h={11}
                      style={{
                        backgroundColor:
                          LEVEL_COLORS[day.contributionLevel] || "#ebedf0",
                        borderRadius: 2,
                        cursor: "pointer",
                        outline: "1px solid rgba(0, 0, 0, 0.04)",
                      }}
                    />
                  </Tooltip>
                ))}
              </Box>
            ))}
          </Box>
        </Box>
      </Paper>

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
              MERGE RATE
            </Text>
            <IconGitMerge size={15} color="#16a34a" />
          </Group>
          <Text fz={20} fw={700} c="#16a34a" mt={4} ff="monospace">
            {data.collaborativeImpact?.prMergeRate ?? 0}%
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
              STARS EARNED
            </Text>
            <IconStar size={15} color="#eab308" />
          </Group>
          <Text fz={20} fw={700} c="#0f172a" mt={4} ff="monospace">
            {formatCompactNumber(data.stats?.totalStarsEarned ?? 0)}
          </Text>
        </Paper>
      </SimpleGrid>
    </Stack>
  );
}
