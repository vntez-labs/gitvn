"use client";

import {
  Box,
  Group,
  Paper,
  Progress,
  SimpleGrid,
  Stack,
  Text,
} from "@mantine/core";
import type { ProfileInsights } from "@/interfaces/profile-insights";
import { ActivityRank } from "./ActivityRank";
import { ContributionHeatmap } from "./ContributionHeatmap";

const number = new Intl.NumberFormat("vi-VN");
const date = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "medium",
  timeZone: "UTC",
});

export function UserStatsMatrix({
  activity,
  codeChanges,
}: {
  activity: NonNullable<ProfileInsights["activity"]>;
  codeChanges: ProfileInsights["codeChanges"];
}) {
  const outcomes = [
    { label: "Commit", value: activity.commits },
    { label: "PR đã mở", value: activity.pulls },
    { label: "Lượt review PR", value: activity.reviews },
    { label: "Issue đã mở", value: activity.issues },
  ];
  const max = Math.max(1, activity.recent30, activity.previous30);
  const periods = [
    { label: "30 ngày gần nhất", value: activity.recent30, color: "vntez" },
    { label: "30 ngày liền trước", value: activity.previous30, color: "gray" },
  ];

  const quickStats = [
    {
      label: "Đóng góp",
      value: number.format(activity.total),
      detail: `${number.format(activity.activeDays)} ngày có hoạt động`,
      color: "#18181b",
    },
    {
      label: "Dòng thêm",
      value: codeChanges ? `+${number.format(codeChanges.additions)}` : "—",
      detail: "30 ngày · repo công khai",
      color: "#166534",
    },
    {
      label: "Dòng xóa",
      value: codeChanges ? `−${number.format(codeChanges.deletions)}` : "—",
      detail: "30 ngày · repo công khai",
      color: "#b91c1c",
    },
    {
      label: "Chuỗi hiện tại",
      value: `${number.format(activity.currentStreak)} ngày`,
      detail: `Dài nhất: ${number.format(activity.longestStreak)} ngày`,
      color: "#18181b",
    },
  ];

  return (
    <Stack gap="md">
      <Paper withBorder radius="lg" p={{ base: "md", sm: "lg" }}>
        <Group justify="space-between" gap="xs" mb="md">
          <Text component="h2" fz={19} fw={750}>
            Tổng quan GitHub
          </Text>
          <Text fz={13} c="#52525b">
            {date.format(new Date(activity.from))} –{" "}
            {date.format(new Date(activity.through))}
          </Text>
        </Group>
        <SimpleGrid cols={{ base: 2, lg: 4 }} spacing="xs">
          {quickStats.map(({ label, value, detail, color }) => (
            <Box
              key={label}
              className="min-w-0 rounded-lg bg-zinc-50 p-3 lg:p-4"
            >
              <Text fz={13} fw={600} c="#52525b">
                {label}
              </Text>
              <Text
                c={color}
                fz={{ base: 23, md: 29, xl: 33 }}
                fw={750}
                lh={1.18}
                mt={5}
                style={{
                  fontVariantNumeric: "tabular-nums",
                  overflowWrap: "anywhere",
                }}
              >
                {value}
              </Text>
              <Text fz={12} c="#52525b" mt={5}>
                {detail}
              </Text>
            </Box>
          ))}
        </SimpleGrid>
        <Text fz={12} c="#52525b" mt="sm">
          {codeChanges
            ? `Dòng thêm/xóa được cộng theo ${number.format(codeChanges.commits)} commit thường trên nhánh mặc định của ${codeChanges.repositories} repo công khai.${codeChanges.partial ? " Mẫu tối đa 5 repo và 50 commit mỗi repo." : ""}`
            : "Chưa có số liệu dòng thêm/xóa từ các nhánh mặc định công khai trong kỳ."}
        </Text>
      </Paper>

      <ActivityRank
        weeks={activity.weeks}
        contributions={activity.total}
        repositories={activity.activeRepositories}
        currentStreak={activity.currentStreak}
      />

      <ContributionHeatmap weeks={activity.weeks} />

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <Paper withBorder radius="lg" p={{ base: "md", sm: "lg" }}>
          <Text component="h3" fz={16} fw={700} mb="md">
            Theo loại đóng góp
          </Text>
          <SimpleGrid cols={2} spacing="sm">
            {outcomes.map(({ label, value }) => (
              <Box key={label} className="rounded-lg bg-zinc-50 p-3">
                <Text fz={13} c="#52525b">
                  {label}
                </Text>
                <Text
                  fz={22}
                  fw={750}
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {number.format(value)}
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        </Paper>

        <Paper withBorder radius="lg" p={{ base: "md", sm: "lg" }}>
          <Text component="h3" fz={16} fw={700}>
            Nhịp hoạt động
          </Text>
          <Text fz={13} c="#52525b" mt={3} mb="md">
            Hai kỳ 30 ngày đã kết thúc, tính theo UTC.
          </Text>
          <Stack gap="md">
            {periods.map(({ label, value, color }) => (
              <Box key={label}>
                <Group justify="space-between" gap="xs" mb={5}>
                  <Text fz={13}>{label}</Text>
                  <Text fz={14} fw={700}>
                    {number.format(value)}
                  </Text>
                </Group>
                <Progress
                  aria-label={label}
                  aria-valuetext={`${value} đóng góp`}
                  value={(value / max) * 100}
                  color={color}
                  size={6}
                />
              </Box>
            ))}
          </Stack>
        </Paper>
      </SimpleGrid>
      <Text fz={13} c="#52525b">
        Số liệu theo lịch đóng góp GitHub và quyền xem của tài khoản hiện tại.
      </Text>
    </Stack>
  );
}
