"use client";

import { Box, Group, Paper, Skeleton, Text } from "@mantine/core";
import { IconActivity } from "@tabler/icons-react";
import { useId } from "react";
import type { CommitWeek } from "@/interfaces/repo-overview";
import { formatCompactNumber } from "@/lib/time";

const weekFormat = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "medium",
  timeZone: "UTC",
});

export function CommitFrequencyChart({
  activity,
  loadingStats,
}: {
  activity?: CommitWeek[] | null;
  loadingStats: boolean;
}) {
  const gradient = useId();
  const weeks = activity ?? [];
  const total = weeks.reduce((sum, week) => sum + week.total, 0);
  const peak = Math.max(0, ...weeks.map((week) => week.total));
  const svgWidth = 800;
  const svgHeight = 120;
  const points = weeks.map(({ total, week }, index) => ({
    week,
    x: (index / Math.max(weeks.length - 1, 1)) * svgWidth,
    y: svgHeight - 10 - (total / Math.max(peak, 1)) * (svgHeight - 24),
    total,
  }));
  const pathD = points
    .map(({ x, y }, index) => `${index === 0 ? "M" : "L"} ${x} ${y}`)
    .join(" ");
  const areaD = `${pathD} L ${svgWidth} ${svgHeight} L 0 ${svgHeight} Z`;

  return (
    <Box mb="xl">
      <Group justify="space-between" mb="xs">
        <Group gap="xs">
          <IconActivity size={16} color="#fb291a" />
          <Text component="h2" fz={16} fw={700} c="#0f172a">
            Hoạt động commit · 52 tuần
          </Text>
        </Group>

        {activity && (
          <Text fz={13} c="#475569">
            {formatCompactNumber(total)} commit (trừ merge) · Cao nhất {peak}
            /tuần
          </Text>
        )}
      </Group>

      <Paper
        p="lg"
        radius="md"
        bg="#ffffff"
        style={{
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        {loadingStats ? (
          <Box py="md">
            <Skeleton height={110} radius="sm" mb="sm" />
            <Group justify="space-between">
              <Skeleton height={12} width={80} radius="sm" />
              <Skeleton height={12} width={100} radius="sm" />
            </Group>
          </Box>
        ) : total > 0 ? (
          <Box>
            <Box style={{ width: "100%", height: 130, position: "relative" }}>
              <svg
                role="img"
                aria-label="Số commit mỗi tuần trên nhánh mặc định, bỏ qua merge commit"
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                preserveAspectRatio="none"
                style={{
                  width: "100%",
                  height: "100%",
                  overflow: "visible",
                }}
              >
                <defs>
                  <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fb291a" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#fb291a" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                {areaD && <path d={areaD} fill={`url(#${gradient})`} />}
                {pathD && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#fb291a"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                  />
                )}

                {points.map((p) => (
                  <circle
                    key={p.week}
                    cx={p.x}
                    cy={p.y}
                    r={p.total > 0 ? 3.5 : 1.5}
                    fill={p.total > 0 ? "#fb291a" : "#cbd5e1"}
                    stroke="#ffffff"
                    strokeWidth={1.5}
                  >
                    <title>
                      {weekFormat.format(p.week * 1000)} · {p.total} commit
                    </title>
                  </circle>
                ))}
              </svg>
            </Box>

            <Group justify="space-between" mt="xs">
              <Text fz={13} c="#64748b">
                {weekFormat.format(weeks[0].week * 1000)}
              </Text>
              <Text fz={13} c="#fb291a" fw={600}>
                {weekFormat.format(weeks[weeks.length - 1].week * 1000)}
              </Text>
            </Group>
          </Box>
        ) : (
          <Box p="xl" ta="center">
            <Text fz={14} c="#475569">
              {activity
                ? "Không có commit trong 52 tuần gần nhất."
                : "Dữ liệu hoạt động từ GitHub chưa có sẵn."}
            </Text>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
