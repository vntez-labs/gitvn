"use client";

import { Box, Group, Image, Paper, Progress, SimpleGrid, Text } from "@mantine/core";
import type { ContributionWeek } from "@/interfaces/profile-insights";
import { getActivityRank } from "@/lib/activity-rank";

const number = new Intl.NumberFormat("vi-VN");

export function ActivityRank({
  weeks,
  contributions,
  repositories,
  currentStreak,
}: {
  weeks: ContributionWeek[];
  contributions: number;
  repositories: number;
  currentStreak: number;
}) {
  const result = getActivityRank({ weeks, contributions, repositories, currentStreak });
  const { activeWeeks, score, rank, next, ranks } = result;
  const remaining = next ? next.minScore - score : 0;
  const progress = next
    ? ((score - rank.minScore) / (next.minScore - rank.minScore)) * 100
    : 100;

  return (
    <Paper withBorder radius="lg" p={{ base: "md", sm: "lg" }}>
      <Group justify="space-between" align="center" gap="md" wrap="nowrap">
        <Group gap="sm" wrap="nowrap" align="center">
          <Image
            src={`/ranks/${rank.badge}.webp`}
            alt={`Huy hiệu ${rank.name}`}
            w={{ base: 56, sm: 72 }}
            h={{ base: 56, sm: 72 }}
            fit="contain"
            aria-hidden="true"
          />
          <Box>
            <Text size="sm" c="#52525b">Hạng hoạt động · 365 ngày</Text>
            <Text component="h3" fz={{ base: 20, sm: 24 }} fw={800} c={rank.color}>
              {rank.name}
            </Text>
            <Text fz={13} c="#52525b">{number.format(score)} điểm</Text>
          </Box>
        </Group>
        <Box ta="right" className="shrink-0">
          <Text fz={{ base: 19, sm: 23 }} fw={800} style={{ fontVariantNumeric: "tabular-nums" }}>
            {number.format(activeWeeks)}
          </Text>
          <Text fz={12} c="#52525b">tuần hoạt động</Text>
        </Box>
      </Group>

      <Progress
        mt="md"
        size="md"
        radius="xl"
        color={rank.color}
        value={progress}
        aria-label="Tiến độ lên hạng"
        aria-valuetext={next ? `Còn ${number.format(remaining)} điểm để lên hạng ${next.name}` : "Đã đạt hạng cao nhất"}
      />
      <Text fz={13} c="#52525b" mt="xs">
        {next ? `Còn ${number.format(remaining)} điểm để đạt ${next.name}.` : "Bạn đã đạt hạng cao nhất."}
      </Text>

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xs" mt="md">
        <Box className="rounded-lg bg-zinc-50 px-3 py-2">
          <Text fz={12} c="#52525b">Đóng góp</Text>
          <Text fz={14} fw={700}>+{number.format(contributions)} điểm</Text>
        </Box>
        <Box className="rounded-lg bg-zinc-50 px-3 py-2">
          <Text fz={12} c="#52525b">Repo có commit</Text>
          <Text fz={14} fw={700}>+{number.format(result.repoPoints)} điểm</Text>
        </Box>
        <Box className="rounded-lg bg-zinc-50 px-3 py-2">
          <Text fz={12} c="#52525b">Chuỗi hiện tại</Text>
          <Text fz={14} fw={700}>+{number.format(result.streakPoints)} điểm</Text>
        </Box>
      </SimpleGrid>

      <Group gap={4} mt="md" justify="space-between" wrap="nowrap">
        {ranks.map((item) => (
          <Box key={item.name} ta="center" className="min-w-0 flex-1">
            <Image
              src={`/ranks/${item.badge}.webp`}
              alt=""
              w={{ base: 32, sm: 40 }}
              h={{ base: 32, sm: 40 }}
              fit="contain"
              mx="auto"
              style={{ opacity: score >= item.minScore ? 1 : 0.38, filter: score >= item.minScore ? undefined : "grayscale(0.7)" }}
            />
            <Text fz={{ base: 9, sm: 11 }} fw={score >= item.minScore ? 700 : 500} c={score >= item.minScore ? item.color : "#71717a"} lineClamp={1}>
              {item.name}
            </Text>
            <Text fz={10} c="#71717a">{number.format(item.minScore)}</Text>
          </Box>
        ))}
      </Group>
      <Text fz={11} c="#71717a" mt="sm">
        Điểm = đóng góp GitHub + 25 điểm mỗi repo có commit (tối đa 12) + 3 điểm mỗi ngày streak. Dữ liệu repo dựa trên tối đa 12 repo có commit trong năm.
      </Text>
    </Paper>
  );
}
