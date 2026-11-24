"use client";

import { Group, Paper, SimpleGrid, Skeleton, Stack, Text } from "@mantine/core";
import type { RepoPulse } from "@/interfaces/repo-overview";

export function PulseHealthSection({
  pulse,
  loading,
}: {
  pulse?: RepoPulse | null;
  loading: boolean;
}) {
  const cards = [
    {
      title: "Pull requests",
      total: pulse?.pulls.total,
      breakdown: [
        { label: "Đang mở", count: pulse?.pulls.open },
        { label: "Đã merge", count: pulse?.pulls.merged },
        { label: "Đóng chưa merge", count: pulse?.pulls.closed },
      ],
    },
    {
      title: "Issues",
      total: pulse?.issues.total,
      breakdown: [
        { label: "Đang mở", count: pulse?.issues.open },
        { label: "Đã đóng", count: pulse?.issues.closed },
      ],
    },
  ];

  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mb="xl">
      {cards.map(({ title, total, breakdown }) => (
        <Paper key={title} p="md" radius="md" withBorder>
          <Group justify="space-between" mb="sm">
            <Text component="h2" fz={16} fw={700}>
              {title}
            </Text>
            <Text fz={24} fw={700}>
              {total?.toLocaleString() ?? "—"}
            </Text>
          </Group>
          {loading ? (
            <Skeleton height={48} />
          ) : total === undefined ? (
            <Text fz={14} c="#475569">
              Chưa tải được số liệu.
            </Text>
          ) : (
            <Stack gap={6}>
              {breakdown.map(({ label, count }) => (
                <Group key={label} justify="space-between" fz={14}>
                  <Text size="inherit" c="#475569">
                    {label}
                  </Text>
                  <Text
                    size="inherit"
                    fw={600}
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {count?.toLocaleString()}
                  </Text>
                </Group>
              ))}
            </Stack>
          )}
        </Paper>
      ))}
    </SimpleGrid>
  );
}
