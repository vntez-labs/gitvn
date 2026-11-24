"use client";

import { Box, Group, Paper, Text, Tooltip } from "@mantine/core";
import type { ContributionWeek } from "@/interfaces/profile-insights";

const colors: Record<string, string> = {
  NONE: "#f4e9e7",
  FIRST_QUARTILE: "#fac8bb",
  SECOND_QUARTILE: "#f3937f",
  THIRD_QUARTILE: "#d95440",
  FOURTH_QUARTILE: "#9f2a1e",
};
const dateFormat = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "medium",
  timeZone: "UTC",
});

export function ContributionHeatmap({ weeks }: { weeks: ContributionWeek[] }) {
  return (
    <Paper withBorder radius="lg" p={{ base: "md", sm: "lg" }}>
      <Group justify="space-between" mb="md">
        <Text component="h3" fz={16} fw={700}>
          Lịch đóng góp
        </Text>
        <Group gap={5} aria-label="Mức độ đóng góp từ ít đến nhiều">
          <Text fz={12} c="#52525b">
            Ít
          </Text>
          {Object.entries(colors).map(([level, color]) => (
            <Box
              key={level}
              w={10}
              h={10}
              bg={color}
              style={{ borderRadius: 2 }}
            />
          ))}
          <Text fz={12} c="#52525b">
            Nhiều
          </Text>
        </Group>
      </Group>

      <Box
        className="overflow-x-auto pb-2"
        tabIndex={0}
        role="region"
        aria-label="Lịch đóng góp từng ngày, cuộn ngang để xem"
      >
        <Box className="flex min-w-[650px] gap-[3px]">
          {weeks.map((week, index) => {
            const first = week.contributionDays[0].date;
            const month = first.slice(0, 7);
            const previous = weeks[index - 1]?.contributionDays[0]?.date.slice(
              0,
              7,
            );

            const firstMonthHasRoom =
              weeks[2]?.contributionDays[0]?.date.slice(0, 7) === month;
            const showMonth =
              month !== previous && (index > 0 || firstMonthHasRoom);

            return (
              <Box key={first} className="relative flex-1 pt-6">
                {showMonth && (
                  <Text
                    fz={12}
                    c="#52525b"
                    className="absolute top-0 whitespace-nowrap"
                    data-month-label
                  >
                    Th{Number(first.slice(5, 7))}
                  </Text>
                )}
                <Box className="grid grid-rows-7 gap-[3px]">
                  {week.contributionDays.map((day) => (
                    <Tooltip
                      key={day.date}
                      label={`${dateFormat.format(new Date(day.date))} · ${day.contributionCount} đóng góp`}
                    >
                      <Box
                        className="h-[11px] rounded-[2px]"
                        style={{
                          gridRow: day.weekday + 1,
                          backgroundColor:
                            colors[day.contributionLevel] ?? colors.NONE,
                        }}
                      />
                    </Tooltip>
                  ))}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Paper>
  );
}
