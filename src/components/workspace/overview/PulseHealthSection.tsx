"use client";

import {
  Badge,
  Box,
  Group,
  Paper,
  RingProgress,
  SimpleGrid,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import {
  IconCircleCheck,
  IconCircleDot,
  IconGitMerge,
  IconGitPullRequest,
} from "@tabler/icons-react";
import { formatCompactNumber } from "@/lib/time";

interface PulseData {
  pulls: {
    total: number;
    open: number;
    merged: number;
    closed: number;
    mergeRate: number;
  };
  issues: {
    total: number;
    open: number;
    closed: number;
    closeRate: number;
  };
}

export function PulseHealthSection({ pulse }: { pulse?: PulseData }) {
  return (
    <Box mb="xl">
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        {/* PULL REQUESTS */}
        <Paper
          p="md"
          bg="#ffffff"
          radius="md"
          style={{
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <Group justify="space-between" align="flex-start">
            <Box>
              <Text fz="xs" c="#64748b" fw={600}>
                PULL REQUESTS
              </Text>
              <Tooltip
                label={`${(pulse?.pulls.total ?? 0).toLocaleString()} pull requests`}
                withArrow
              >
                <Text fz={24} fw={700} c="#0f172a" mt={2} ff="monospace">
                  {formatCompactNumber(pulse?.pulls.total ?? 0)}
                </Text>
              </Tooltip>
            </Box>
            <RingProgress
              size={64}
              thickness={6}
              roundCaps
              sections={[
                { value: pulse?.pulls.mergeRate ?? 0, color: "violet" },
              ]}
              label={
                <Text ta="center" fz={11} fw={700} c="#0f172a">
                  {pulse?.pulls.mergeRate ?? 0}%
                </Text>
              }
            />
          </Group>

          <Stack gap={8} mt="xs">
            <Group justify="space-between">
              <Group gap={6}>
                <IconGitMerge size={14} color="#7c3aed" />
                <Text fz={12} c="#334155">
                  Đã Merge
                </Text>
              </Group>
              <Tooltip
                label={`${(pulse?.pulls.merged ?? 0).toLocaleString()} PRs`}
                withArrow
              >
                <Text fz={12} fw={600} c="#7c3aed" ff="monospace">
                  {formatCompactNumber(pulse?.pulls.merged ?? 0)}
                </Text>
              </Tooltip>
            </Group>

            <Group justify="space-between">
              <Group gap={6}>
                <IconGitPullRequest size={14} color="#16a34a" />
                <Text fz={12} c="#334155">
                  Đang mở (Open)
                </Text>
              </Group>
              <Tooltip
                label={`${(pulse?.pulls.open ?? 0).toLocaleString()} PRs`}
                withArrow
              >
                <Text fz={12} fw={600} c="#16a34a" ff="monospace">
                  {formatCompactNumber(pulse?.pulls.open ?? 0)}
                </Text>
              </Tooltip>
            </Group>

            <Group justify="space-between">
              <Group gap={6}>
                <IconGitPullRequest size={14} color="#dc2626" />
                <Text fz={12} c="#334155">
                  Đã đóng (Closed)
                </Text>
              </Group>
              <Tooltip
                label={`${(pulse?.pulls.closed ?? 0).toLocaleString()} PRs`}
                withArrow
              >
                <Text fz={12} fw={600} c="#dc2626" ff="monospace">
                  {formatCompactNumber(pulse?.pulls.closed ?? 0)}
                </Text>
              </Tooltip>
            </Group>
          </Stack>
        </Paper>

        {/* ISSUES RESOLUTION */}
        <Paper
          p="md"
          bg="#ffffff"
          radius="md"
          style={{
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <Group justify="space-between" align="flex-start">
            <Box>
              <Text fz="xs" c="#64748b" fw={600}>
                ISSUES RESOLUTION
              </Text>
              <Tooltip
                label={`${(pulse?.issues.total ?? 0).toLocaleString()} issues`}
                withArrow
              >
                <Text fz={24} fw={700} c="#0f172a" mt={2} ff="monospace">
                  {formatCompactNumber(pulse?.issues.total ?? 0)}
                </Text>
              </Tooltip>
            </Box>
            <RingProgress
              size={64}
              thickness={6}
              roundCaps
              sections={[
                { value: pulse?.issues.closeRate ?? 0, color: "teal" },
              ]}
              label={
                <Text ta="center" fz={11} fw={700} c="#0f172a">
                  {pulse?.issues.closeRate ?? 0}%
                </Text>
              }
            />
          </Group>

          <Stack gap={8} mt="xs">
            <Group justify="space-between">
              <Group gap={6}>
                <IconCircleCheck size={14} color="#16a34a" />
                <Text fz={12} c="#334155">
                  Đã xử lý xong
                </Text>
              </Group>
              <Tooltip
                label={`${(pulse?.issues.closed ?? 0).toLocaleString()} issues`}
                withArrow
              >
                <Text fz={12} fw={600} c="#16a34a" ff="monospace">
                  {formatCompactNumber(pulse?.issues.closed ?? 0)}
                </Text>
              </Tooltip>
            </Group>

            <Group justify="space-between">
              <Group gap={6}>
                <IconCircleDot size={14} color="#d97706" />
                <Text fz={12} c="#334155">
                  Đang mở (Open)
                </Text>
              </Group>
              <Tooltip
                label={`${(pulse?.issues.open ?? 0).toLocaleString()} issues`}
                withArrow
              >
                <Text fz={12} fw={600} c="#d97706" ff="monospace">
                  {formatCompactNumber(pulse?.issues.open ?? 0)}
                </Text>
              </Tooltip>
            </Group>

            <Group justify="space-between">
              <Text fz={11} c="#64748b">
                Tỷ lệ hoàn thành
              </Text>
              <Badge size="xs" variant="outline" color="teal">
                {pulse?.issues.closeRate ?? 0}% solved
              </Badge>
            </Group>
          </Stack>
        </Paper>
      </SimpleGrid>
    </Box>
  );
}
