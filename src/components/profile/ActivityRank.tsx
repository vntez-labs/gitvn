"use client";

import {
  Badge,
  Box,
  Group,
  Image,
  Paper,
  Progress,
  SimpleGrid,
  Text,
  Tooltip,
} from "@mantine/core";
import type { ContributionWeek } from "@/interfaces/profile-insights";
import { getActivityRank } from "@/lib/activity-rank";

const number = new Intl.NumberFormat("vi-VN");
const scoreNumber = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 1,
});

export function ActivityRank({
  weeks,
  contributions,
  repositories,
  currentStreak,
  longestStreak = 0,
  pulls = 0,
  reviews = 0,
  issues = 0,
  commits = 0,
  stars = 0,
  releases = 0,
  forks = 0,
  followers = 0,
}: {
  weeks: ContributionWeek[];
  contributions: number;
  repositories: number;
  currentStreak: number;
  longestStreak?: number;
  pulls?: number;
  reviews?: number;
  issues?: number;
  commits?: number;
  stars?: number;
  releases?: number;
  forks?: number;
  followers?: number;
}) {
  const result = getActivityRank({
    weeks,
    contributions,
    repositories,
    currentStreak,
    longestStreak,
    pulls,
    reviews,
    issues,
    commits,
    stars,
    releases,
    followers,
  });

  const {
    activeWeeks,
    score,
    rank,
    next,
    ranks,
    impactPoints,
    activityPoints,
    consistencyPoints,
    repoPoints,
    longestStreak: recordStreak,
  } = result;

  const remaining = next ? Math.max(0, Math.ceil(next.minScore - score)) : 0;
  const totalProgress = Math.min(100, Math.max(0, score));

  const criteria = [
    {
      label: "Tác động xã hội",
      maxPoints: 30,
      points: impactPoints,
      stat: `⭐ ${number.format(stars)} · 📦 ${number.format(releases)}`,
      detail: `${number.format(followers)} người theo dõi`,
    },
    {
      label: "Năng suất đóng góp",
      maxPoints: 30,
      points: activityPoints,
      stat: `${number.format(contributions)} đóng góp`,
      detail:
        pulls + reviews > 0
          ? `${pulls} PRs · ${reviews} reviews`
          : "Trần 500 đóng góp",
    },
    {
      label: "Chuyên cần & Kỷ luật",
      maxPoints: 25,
      points: consistencyPoints,
      stat: `${activeWeeks}/52 tuần`,
      detail: `Kỷ lục ${number.format(recordStreak)} ngày chuỗi`,
    },
    {
      label: "Độ phủ dự án",
      maxPoints: 15,
      points: repoPoints,
      stat: `${number.format(repositories)} repo có đóng góp`,
      detail:
        repositories >= 6
          ? "Đạt tối đa (≥6 repo)"
          : "Lũy tiến: 1=5, 2=8, 3=11, 4=13, 6=15",
    },
  ];

  return (
    <Paper withBorder radius="lg" p={{ base: "md", sm: "lg" }}>
      {/* Header Info */}
      <Group justify="space-between" align="center" gap="md" wrap="nowrap">
        <Group gap="md" wrap="nowrap" align="center">
          <Image
            src={`/ranks/${rank.badge}.webp`}
            alt={`Huy hiệu ${rank.name}`}
            w={{ base: 56, sm: 64 }}
            h={{ base: 56, sm: 64 }}
            fit="contain"
            aria-hidden="true"
          />
          <Box>
            <Text size="xs" fw={600} c="#71717a" tt="uppercase" lts={0.5}>
              Hạng hoạt động · 365 ngày
            </Text>
            <Text
              component="h3"
              fz={{ base: 22, sm: 26 }}
              fw={800}
              c={rank.color}
              lh={1.2}
              mt={2}
            >
              {rank.name}
            </Text>
            <Text fz={13} c="#52525b" mt={3}>
              <span className="font-bold text-zinc-900">
                {scoreNumber.format(score)}
              </span>{" "}
              / 100 điểm
            </Text>
          </Box>
        </Group>

        <Box ta="right" className="shrink-0">
          <Text
            fz={{ base: 20, sm: 24 }}
            fw={800}
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {number.format(activeWeeks)}
            <span className="text-xs font-normal text-zinc-400">/52</span>
          </Text>
          <Text fz={12} c="#71717a">
            tuần hoạt động
          </Text>
        </Box>
      </Group>

      {/* Main Unified Progress Bar (0 to 100) */}
      <Box mt="lg">
        <Progress
          size={10}
          radius="xl"
          color={rank.color}
          value={totalProgress}
          aria-label="Tiến độ điểm tổng"
          aria-valuetext={`${scoreNumber.format(score)} trên 100 điểm`}
        />

        {/* Status text with breathing room */}
        <Group justify="space-between" align="center" mt={8}>
          <Text fz={13} c="#52525b">
            {next ? (
              <>
                Còn{" "}
                <span className="font-semibold text-zinc-900">
                  {number.format(remaining)} điểm
                </span>{" "}
                để đạt hạng{" "}
                <span className="font-semibold" style={{ color: next.color }}>
                  {next.name}
                </span>
              </>
            ) : (
              <>
                Đã đạt hạng cao nhất · Còn{" "}
                <span className="font-semibold text-zinc-900">
                  {scoreNumber.format(Math.max(0, 100 - score))} điểm
                </span>{" "}
                để đạt điểm tuyệt đối 100/100
              </>
            )}
          </Text>

          <Text fz={12} fw={600} c="#71717a">
            {scoreNumber.format(score)}%
          </Text>
        </Group>
      </Box>

      {/* 4 Criteria Cards with clear spacing and breathing room */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="sm" mt="lg">
        {criteria.map((item) => {
          const pct = Math.min(100, (item.points / item.maxPoints) * 100);
          const isMax = item.points >= item.maxPoints;
          return (
            <Box
              key={item.label}
              className="flex flex-col justify-between rounded-xl bg-zinc-50/80 p-3.5 transition-colors hover:bg-zinc-100/60"
            >
              <div>
                <Group justify="space-between" align="center" mb={6}>
                  <Text fz={12} fw={600} c="#52525b">
                    {item.label}
                  </Text>
                  <Badge
                    size="sm"
                    variant="light"
                    color={isMax ? "green" : "gray"}
                    radius="sm"
                  >
                    {scoreNumber.format(item.points)}/{item.maxPoints}đ
                  </Badge>
                </Group>
                <Text fz={15} fw={750} className="text-zinc-900" mt={2}>
                  {item.stat}
                </Text>
                <Text fz={11} c="#71717a" mt={2} lineClamp={1}>
                  {item.detail}
                </Text>
              </div>

              <div className="mt-3">
                <Progress
                  value={pct}
                  size={4}
                  radius="xl"
                  color={rank.color}
                  aria-label={`${item.label} tiến độ`}
                />
              </div>
            </Box>
          );
        })}
      </SimpleGrid>

      {/* Ranks Milestone Track */}
      <Box mt="lg" pt="sm" className="border-t border-zinc-100">
        <Group gap={4} justify="space-between" wrap="nowrap">
          {ranks.map((item) => {
            const isReached = score >= item.minScore;
            const isCurrent = rank.name === item.name;
            return (
              <Tooltip
                key={item.name}
                label={`${item.name} (${item.minScore}đ): ${item.description}`}
                position="top"
                withArrow
              >
                <Box
                  ta="center"
                  className={`min-w-0 flex-1 rounded-xl p-2 transition-all ${
                    isCurrent
                      ? "bg-zinc-100 ring-1 ring-zinc-300"
                      : "hover:bg-zinc-50"
                  }`}
                >
                  <Image
                    src={`/ranks/${item.badge}.webp`}
                    alt=""
                    w={{ base: 32, sm: 38 }}
                    h={{ base: 32, sm: 38 }}
                    fit="contain"
                    mx="auto"
                    style={{
                      opacity: isReached ? 1 : 0.35,
                      filter: isReached ? undefined : "grayscale(0.7)",
                      transform: isCurrent ? "scale(1.06)" : undefined,
                    }}
                  />
                  <Text
                    fz={{ base: 10, sm: 11 }}
                    fw={isCurrent ? 750 : isReached ? 600 : 500}
                    c={isReached ? item.color : "#71717a"}
                    lineClamp={1}
                    mt={4}
                  >
                    {item.name}
                  </Text>
                  <Text fz={10} c="#a1a1aa" mt={1}>
                    ≥{number.format(item.minScore)}đ
                  </Text>
                </Box>
              </Tooltip>
            );
          })}
        </Group>

        <Text fz={11} c="#a1a1aa" ta="center" mt="xs">
          Thang điểm 100: Tác động xã hội 30đ (Stars, Releases, Followers) ·
          Năng suất 30đ · Độ đều 25đ · Độ phủ 15đ
        </Text>
      </Box>
    </Paper>
  );
}
