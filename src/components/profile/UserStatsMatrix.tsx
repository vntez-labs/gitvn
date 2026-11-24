"use client";

import {
  Badge,
  Box,
  Divider,
  Group,
  Paper,
  Progress,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import {
  IconBug,
  IconFlame,
  IconGitCommit,
  IconGitPullRequest,
  IconMessageCode,
  IconMinus,
  IconTrendingDown,
  IconTrendingUp,
} from "@tabler/icons-react";
import axios from "axios";
import useSWR from "swr";
import type { ProfileInsights } from "@/interfaces/profile-insights";
import { ActivityRank } from "./ActivityRank";
import {
  ContributionHeatmapCalendar,
  ContributionHeatmapLegend,
} from "./ContributionHeatmap";

const number = new Intl.NumberFormat("vi-VN");
const date = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "medium",
  timeZone: "UTC",
});

async function fetchCodeChanges(url: string) {
  const { data } = await axios.get<ProfileInsights["codeChanges"]>(url);
  return data;
}

export function UserStatsMatrix({
  username,
  activity,
  codeChanges: initialCodeChanges,
  followers = 0,
  score,
}: {
  username?: string;
  activity: NonNullable<ProfileInsights["activity"]>;
  codeChanges?: ProfileInsights["codeChanges"];
  followers?: number;
  score?: ProfileInsights["score"];
}) {
  const { data: remoteCodeChanges, isLoading: isCodeChangesLoading } = useSWR(
    username && !initialCodeChanges
      ? `/api/github/user/${encodeURIComponent(username)}/code-changes`
      : null,
    fetchCodeChanges,
    { revalidateOnFocus: false, dedupingInterval: 60000 },
  );

  const codeChanges = initialCodeChanges ?? remoteCodeChanges;
  const isLoadingChanges = isCodeChangesLoading && codeChanges === undefined;
  const hasCommits = codeChanges && codeChanges.commits > 0;

  const quickStats = [
    {
      label: "Đóng góp",
      value: number.format(activity.total),
      detail: `${number.format(activity.activeDays)} ngày có hoạt động`,
      color: "#18181b",
      isLoading: false,
    },
    {
      label: "Dòng thêm",
      value: codeChanges ? `+${number.format(codeChanges.additions)}` : "+0",
      detail: isLoadingChanges
        ? "Đang tính..."
        : hasCommits
          ? "30 ngày · repo công khai"
          : "30 ngày · 0 commit",
      color: "#166534",
      isLoading: isLoadingChanges,
    },
    {
      label: "Dòng xóa",
      value: codeChanges ? `−${number.format(codeChanges.deletions)}` : "−0",
      detail: isLoadingChanges
        ? "Đang tính..."
        : hasCommits
          ? "30 ngày · repo công khai"
          : "30 ngày · 0 commit",
      color: "#b91c1c",
      isLoading: isLoadingChanges,
    },
    {
      label: "Chuỗi hiện tại",
      value: `${number.format(activity.currentStreak)} ngày`,
      detail: `Dài nhất: ${number.format(activity.longestStreak)} ngày`,
      color: "#18181b",
      isLoading: false,
    },
  ];

  // Tính cơ cấu thể loại đóng góp
  const totalCategorized = Math.max(
    1,
    activity.commits + activity.pulls + activity.reviews + activity.issues,
  );

  const contributionTypes = [
    {
      key: "commits",
      label: "Commits",
      count: activity.commits,
      color: "#2563eb",
      icon: IconGitCommit,
      pct: (activity.commits / totalCategorized) * 100,
    },
    {
      key: "pulls",
      label: "PRs đã mở",
      count: activity.pulls,
      color: "#16a34a",
      icon: IconGitPullRequest,
      pct: (activity.pulls / totalCategorized) * 100,
    },
    {
      key: "reviews",
      label: "Review PR",
      count: activity.reviews,
      color: "#9333ea",
      icon: IconMessageCode,
      pct: (activity.reviews / totalCategorized) * 100,
    },
    {
      key: "issues",
      label: "Issue đã mở",
      count: activity.issues,
      color: "#ea580c",
      icon: IconBug,
      pct: (activity.issues / totalCategorized) * 100,
    },
  ];

  // Tính nhịp độ & biến động phong độ giữa 2 kỳ 30 ngày
  const maxPeriod = Math.max(1, activity.recent30, activity.previous30);
  const diff30 = activity.recent30 - activity.previous30;
  const growthRate =
    activity.previous30 > 0
      ? Math.round((diff30 / activity.previous30) * 100)
      : activity.recent30 > 0
        ? 100
        : 0;

  const avgPerDay = (activity.total / 365).toFixed(1);

  return (
    <Stack gap="md">
      {/* 1. Tổng quan GitHub */}
      <Paper withBorder radius="lg" p={{ base: "md", sm: "lg" }}>
        <Group justify="space-between" gap="xs" mb="md">
          <Text component="h2" fz={19} fw={750}>
            Tổng quan GitHub
          </Text>
          <Text fz={13} c="#71717a">
            {date.format(new Date(activity.from))} –{" "}
            {date.format(new Date(activity.through))}
          </Text>
        </Group>
        <SimpleGrid cols={{ base: 2, lg: 4 }} spacing="xs">
          {quickStats.map(({ label, value, detail, color, isLoading }) => (
            <Box
              key={label}
              className="min-w-0 rounded-xl bg-zinc-50/80 p-3.5 lg:p-4"
            >
              <Text fz={12} fw={600} c="#71717a">
                {label}
              </Text>
              {isLoading ? (
                <Skeleton h={32} w={100} mt={6} radius="sm" />
              ) : (
                <Text
                  component="div"
                  c={color}
                  fz={{ base: 22, md: 28, xl: 32 }}
                  fw={750}
                  lh={1.2}
                  mt={4}
                  style={{
                    fontVariantNumeric: "tabular-nums",
                    overflowWrap: "anywhere",
                  }}
                >
                  {value}
                </Text>
              )}
              <Text fz={12} c="#71717a" mt={4}>
                {detail}
              </Text>
            </Box>
          ))}
        </SimpleGrid>
        <Text fz={12} c="#a1a1aa" mt="sm">
          {isLoadingChanges
            ? "Đang tính toán dòng thêm/xóa trong 30 ngày qua..."
            : hasCommits
              ? `Dòng thêm/xóa tính theo ${number.format(codeChanges?.commits ?? 0)} commit thường trên nhánh mặc định (${codeChanges?.repositories ?? 0} repo).`
              : "Không phát sinh commit trên nhánh mặc định của repo công khai trong 30 ngày qua."}
        </Text>
      </Paper>

      {/* 2. Hạng hoạt động & Điểm chuyên nghiệp */}
      <ActivityRank
        scoreV3={score}
        weeks={activity.weeks}
        contributions={activity.total}
        repositories={activity.activeRepositories}
        currentStreak={activity.currentStreak}
        longestStreak={activity.longestStreak}
        pulls={activity.pulls}
        reviews={activity.reviews}
        issues={activity.issues}
        commits={activity.commits}
        stars={activity.stars ?? 0}
        releases={activity.releases ?? 0}
        forks={activity.forks ?? 0}
        followers={followers}
      />

      {/* 3. Trung tâm Hoạt động: Lịch đóng góp + Thể loại đóng góp + Nhịp hoạt động */}
      <Paper withBorder radius="lg" p={{ base: "md", sm: "lg" }}>
        {/* Header cụm Đóng góp */}
        <Group
          justify="space-between"
          align="center"
          mb="sm"
          wrap="wrap"
          gap="xs"
        >
          <Group gap="xs" align="center">
            <Text component="h3" fz={17} fw={750}>
              Lịch đóng góp
            </Text>
            <Badge variant="light" color="red" size="sm" radius="sm">
              365 ngày qua
            </Badge>
          </Group>
          <ContributionHeatmapLegend />
        </Group>

        <Text fz={13} c="#71717a" mb="md">
          {number.format(activity.total)} đóng góp trên{" "}
          {number.format(activity.activeDays)} ngày có hoạt động
        </Text>

        {/* Heatmap Calendar */}
        <ContributionHeatmapCalendar weeks={activity.weeks} />

        <Divider my="lg" color="#f4f4f5" />

        {/* Flex / Grid: Thể loại đóng góp & Nhịp hoạt động (Clean & Airy) */}
        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl">
          {/* CỘT 1: Cơ cấu thể loại đóng góp */}
          <Box className="flex flex-col justify-between">
            <div>
              <Group justify="space-between" align="center" mb="xs">
                <Text fz={15} fw={750} className="text-zinc-900">
                  Cơ cấu đóng góp
                </Text>
                <Badge size="sm" variant="outline" color="gray">
                  {number.format(activity.total)} đóng góp
                </Badge>
              </Group>

              {/* Multi-segment Stacked Progress Bar */}
              <Box className="my-3 flex h-2.5 w-full overflow-hidden rounded-full bg-zinc-100">
                {contributionTypes.map((item) => {
                  if (item.pct <= 0) return null;
                  return (
                    <Tooltip
                      key={item.key}
                      label={`${item.label}: ${number.format(item.count)} (${item.pct.toFixed(1)}%)`}
                    >
                      <Box
                        style={{
                          width: `${item.pct}%`,
                          backgroundColor: item.color,
                        }}
                        className="transition-all hover:opacity-90"
                      />
                    </Tooltip>
                  );
                })}
              </Box>
            </div>

            {/* 4 Category Cards */}
            <SimpleGrid cols={2} spacing="xs" mt="xs">
              {contributionTypes.map((item) => {
                const Icon = item.icon;
                return (
                  <Box
                    key={item.key}
                    className="rounded-xl bg-zinc-50/80 p-3 transition-colors hover:bg-zinc-100/60"
                  >
                    <Group justify="space-between" align="center" wrap="nowrap">
                      <Group gap={6} wrap="nowrap">
                        <Box
                          p={4}
                          className="rounded-md"
                          style={{
                            backgroundColor: `${item.color}15`,
                            color: item.color,
                          }}
                        >
                          <Icon size={15} />
                        </Box>
                        <Text fz={12} fw={600} c="#52525b" lineClamp={1}>
                          {item.label}
                        </Text>
                      </Group>
                      <Text fz={11} fw={600} c="#71717a">
                        {item.pct.toFixed(0)}%
                      </Text>
                    </Group>
                    <Text
                      fz={17}
                      fw={750}
                      className="mt-2 text-zinc-900"
                      style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                      {number.format(item.count)}
                    </Text>
                  </Box>
                );
              })}
            </SimpleGrid>
          </Box>

          {/* CỘT 2: Nhịp hoạt động & Phong độ */}
          <Box className="flex flex-col justify-between">
            <div>
              <Group justify="space-between" align="center" mb="xs">
                <Text fz={15} fw={750} className="text-zinc-900">
                  Nhịp độ 30 ngày
                </Text>

                {/* Trend Badge */}
                {diff30 > 0 ? (
                  <Badge
                    color="green"
                    variant="light"
                    leftSection={<IconTrendingUp size={13} />}
                    size="sm"
                  >
                    +{growthRate}% kỳ này
                  </Badge>
                ) : diff30 < 0 ? (
                  <Badge
                    color="orange"
                    variant="light"
                    leftSection={<IconTrendingDown size={13} />}
                    size="sm"
                  >
                    {growthRate}% kỳ này
                  </Badge>
                ) : (
                  <Badge
                    color="gray"
                    variant="light"
                    leftSection={<IconMinus size={13} />}
                    size="sm"
                  >
                    Ổn định
                  </Badge>
                )}
              </Group>

              {/* Progress bars so sánh 2 kỳ 30 ngày */}
              <Stack gap="xs" my="xs">
                <Box>
                  <Group justify="space-between" gap="xs" mb={4}>
                    <Text fz={12} fw={600} className="text-zinc-700">
                      30 ngày gần nhất
                    </Text>
                    <Text fz={13} fw={700} className="text-zinc-900">
                      {number.format(activity.recent30)}{" "}
                      <span className="text-xs font-normal text-zinc-400">
                        đóng góp
                      </span>
                    </Text>
                  </Group>
                  <Progress
                    aria-label="30 ngày gần nhất"
                    value={(activity.recent30 / maxPeriod) * 100}
                    color="#dc2626"
                    size={6}
                    radius="xl"
                  />
                </Box>

                <Box>
                  <Group justify="space-between" gap="xs" mb={4}>
                    <Text fz={12} c="#71717a">
                      30 ngày liền trước
                    </Text>
                    <Text fz={13} fw={600} c="#71717a">
                      {number.format(activity.previous30)}{" "}
                      <span className="text-xs font-normal text-zinc-400">
                        đóng góp
                      </span>
                    </Text>
                  </Group>
                  <Progress
                    aria-label="30 ngày liền trước"
                    value={(activity.previous30 / maxPeriod) * 100}
                    color="#d4d4d8"
                    size={6}
                    radius="xl"
                  />
                </Box>
              </Stack>
            </div>

            {/* Quick Metrics Bar */}
            <SimpleGrid cols={3} spacing="xs" mt="xs">
              <Box className="rounded-xl bg-zinc-50/80 p-2.5 text-center">
                <Text fz={11} c="#71717a">
                  Tần suất TB
                </Text>
                <Text fz={15} fw={750} className="mt-0.5 text-zinc-900">
                  ~{avgPerDay}
                </Text>
                <Text fz={10} c="#a1a1aa">
                  lần/ngày
                </Text>
              </Box>

              <Box className="rounded-xl bg-zinc-50/80 p-2.5 text-center">
                <Group gap={3} justify="center" align="center">
                  <IconFlame size={12} className="text-amber-500" />
                  <Text fz={11} c="#71717a">
                    Kỷ lục chuỗi
                  </Text>
                </Group>
                <Text fz={15} fw={750} className="mt-0.5 text-zinc-900">
                  {number.format(activity.longestStreak)}
                </Text>
                <Text fz={10} c="#a1a1aa">
                  ngày liên tục
                </Text>
              </Box>

              <Box className="rounded-xl bg-zinc-50/80 p-2.5 text-center">
                <Text fz={11} c="#71717a">
                  Chuỗi hiện tại
                </Text>
                <Text fz={15} fw={750} className="mt-0.5 text-red-600">
                  {number.format(activity.currentStreak)}
                </Text>
                <Text fz={10} c="#a1a1aa">
                  ngày giữ nhịp
                </Text>
              </Box>
            </SimpleGrid>
          </Box>
        </SimpleGrid>
      </Paper>
    </Stack>
  );
}
