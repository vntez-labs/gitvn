"use client";

import {
  Badge,
  Box,
  Group,
  Paper,
  Skeleton,
  Text,
  Tooltip,
} from "@mantine/core";
import { IconActivity } from "@tabler/icons-react";
import { useMemo } from "react";
import { formatCompactNumber } from "@/lib/time";

interface CommitFrequencyChartProps {
  statsData: any;
  timelineMetrics: {
    peakWeek: number;
    totalAllTime: number;
  };
  loadingStats: boolean;
}

export function CommitFrequencyChart({
  statsData,
  timelineMetrics,
  loadingStats,
}: CommitFrequencyChartProps) {
  const participation = statsData?.participation?.all || [];
  const svgWidth = 800;
  const svgHeight = 120;

  const points = useMemo(() => {
    if (participation.length === 0) return [];
    const max = Math.max(...participation, 1);
    const stepX = svgWidth / Math.max(participation.length - 1, 1);

    return participation.map((val: number, idx: number) => {
      const x = idx * stepX;
      const y = svgHeight - 10 - (val / max) * (svgHeight - 24);
      return { x, y, total: val };
    });
  }, [participation]);

  const pathD = useMemo(() => {
    if (points.length === 0) return "";
    return points.reduce((acc: string, curr: any, idx: number) => {
      if (idx === 0) return `M ${curr.x} ${curr.y}`;
      return `${acc} L ${curr.x} ${curr.y}`;
    }, "");
  }, [points]);

  const areaD = useMemo(() => {
    if (points.length === 0) return "";
    const first = points[0];
    const last = points[points.length - 1];
    return `M ${first.x} ${svgHeight} L ${first.x} ${first.y} ${points
      .slice(1)
      .map((p: any) => `L ${p.x} ${p.y}`)
      .join(" ")} L ${last.x} ${svgHeight} Z`;
  }, [points]);

  return (
    <Box mb="xl">
      <Group justify="space-between" mb="xs">
        <Group gap="xs">
          <IconActivity size={16} color="#fb291a" />
          <Text fz="sm" fw={700} c="#0f172a">
            Tần suất Commit (52 tuần gần nhất)
          </Text>
        </Group>

        <Group gap={8}>
          {typeof statsData.totalCommits === "number" &&
            statsData.totalCommits > 0 && (
              <Tooltip
                label={`${statsData.totalCommits.toLocaleString()} commits trên nhánh mặc định`}
                withArrow
              >
                <Badge size="xs" variant="light" color="vntez">
                  Tổng: {formatCompactNumber(statsData.totalCommits)} commits
                </Badge>
              </Tooltip>
            )}
          <Badge size="xs" variant="outline" color="gray">
            Đỉnh điểm: {timelineMetrics.peakWeek} commits/tuần
          </Badge>
          <Text fz={11} c="#64748b">
            1 năm qua:{" "}
            <span style={{ color: "#0f172a", fontWeight: 600 }}>
              {formatCompactNumber(timelineMetrics.totalAllTime)} commits
            </span>
          </Text>
        </Group>
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
        ) : points.length > 0 ? (
          <Box>
            <Box style={{ width: "100%", height: 130, position: "relative" }}>
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                preserveAspectRatio="none"
                style={{
                  width: "100%",
                  height: "100%",
                  overflow: "visible",
                }}
              >
                <defs>
                  <linearGradient
                    id="commitGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#fb291a" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#fb291a" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                {areaD && <path d={areaD} fill="url(#commitGradient)" />}
                {pathD && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#fb291a"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                  />
                )}

                {points.map((p: any, idx: number) => (
                  <circle
                    key={idx}
                    cx={p.x}
                    cy={p.y}
                    r={p.total > 0 ? 3.5 : 1.5}
                    fill={p.total > 0 ? "#fb291a" : "#cbd5e1"}
                    stroke="#ffffff"
                    strokeWidth={1.5}
                  />
                ))}
              </svg>
            </Box>

            <Group justify="space-between" mt="xs">
              <Text fz={11} c="#64748b">
                52 tuần trước
              </Text>
              <Text fz={11} c="#fb291a" fw={600}>
                Tuần này (Hiện tại)
              </Text>
            </Group>
          </Box>
        ) : (
          <Box p="xl" ta="center">
            <Text fz="xs" c="#64748b">
              Chưa có lịch sử commit nào được ghi nhận trong 1 năm qua.
            </Text>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
