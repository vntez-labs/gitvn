"use client";

import { Box, Group, Paper, Text, Tooltip } from "@mantine/core";
import type { FC } from "react";

export const LEVEL_COLORS: Record<string, string> = {
  NONE: "#ebedf0",
  FIRST_QUARTILE: "#ffc5be",
  SECOND_QUARTILE: "#fca59b",
  THIRD_QUARTILE: "#f87171",
  FOURTH_QUARTILE: "#fb291a",
};

interface ContributionHeatmapProps {
  totalContributions: number;
  calendarWeeks: any[];
}

export const ContributionHeatmap: FC<ContributionHeatmapProps> = ({
  totalContributions,
  calendarWeeks = [],
}) => {
  return (
    <Paper
      p="lg"
      bg="#ffffff"
      radius="md"
      style={{
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
      }}
    >
      <Group justify="space-between" align="baseline" mb="md">
        <Box>
          <Text fz={16} fw={700} c="#0f172a">
            {totalContributions} đóng góp trong 1 năm qua
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
        <Box style={{ display: "flex", gap: 8, minWidth: 800 }}>
          {/* Nhãn các ngày trong tuần (T2, T4, T6) */}
          <Box
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 3,
              paddingTop: 14,
              width: 18,
              flexShrink: 0,
            }}
          >
            <Text fz={9} c="#94a3b8" style={{ height: 11, lineHeight: "11px" }}>
              {" "}
            </Text>
            <Text fz={9} c="#94a3b8" style={{ height: 11, lineHeight: "11px" }}>
              T2
            </Text>
            <Text fz={9} c="#94a3b8" style={{ height: 11, lineHeight: "11px" }}>
              {" "}
            </Text>
            <Text fz={9} c="#94a3b8" style={{ height: 11, lineHeight: "11px" }}>
              T4
            </Text>
            <Text fz={9} c="#94a3b8" style={{ height: 11, lineHeight: "11px" }}>
              {" "}
            </Text>
            <Text fz={9} c="#94a3b8" style={{ height: 11, lineHeight: "11px" }}>
              T6
            </Text>
            <Text fz={9} c="#94a3b8" style={{ height: 11, lineHeight: "11px" }}>
              {" "}
            </Text>
          </Box>

          {/* Cột các tuần đóng góp */}
          <Box style={{ display: "flex", gap: 3 }}>
            {calendarWeeks?.map((week: any, wIdx: number) => {
              const firstDay = week.contributionDays?.[0];
              const dateObj = firstDay ? new Date(firstDay.date) : null;
              const isFirstWeekOfMonth = dateObj && dateObj.getDate() <= 7;
              const monthName = isFirstWeekOfMonth
                ? `Th${dateObj.getMonth() + 1}`
                : "";

              return (
                <Box
                  key={wIdx}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                  }}
                >
                  <Text
                    fz={9}
                    c="#94a3b8"
                    style={{
                      height: 11,
                      lineHeight: "11px",
                      whiteSpace: "nowrap",
                      textAlign: "left",
                    }}
                  >
                    {monthName}
                  </Text>
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
              );
            })}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};
