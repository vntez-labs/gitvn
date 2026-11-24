"use client";

import { Alert, Anchor, Badge, Group, Paper, Stack, Text } from "@mantine/core";
import {
  IconCheck,
  IconClock,
  IconExclamationCircle,
  IconMinus,
} from "@tabler/icons-react";
import type { PullChecks } from "@/lib/pull-request";

const passed = ["success", "neutral", "skipped"];
const pending = [
  "pending",
  "queued",
  "in_progress",
  "waiting",
  "requested",
  "expected",
];

export function hasPendingPullChecks(checks?: PullChecks) {
  return checks?.items.some((check) => pending.includes(check.status)) ?? false;
}

export function PullChecksPanel({ checks }: { checks: PullChecks }) {
  const passedCount = checks.items.filter((check) =>
    passed.includes(check.status),
  ).length;
  const pendingCount = checks.items.filter((check) =>
    pending.includes(check.status),
  ).length;
  const otherCount = checks.items.length - passedCount - pendingCount;

  return (
    <Paper withBorder radius="md" style={{ overflow: "hidden" }}>
      <Stack gap={6} p="md" bg="#f5f3ee">
        <Group justify="space-between">
          <Text fw={700} size="sm">
            CI/CD checks
          </Text>
          <Text size="xs" c="dimmed" ff="var(--mantine-font-family-monospace)">
            {checks.testMerge ? "Test merge" : "Head"} ·{" "}
            {checks.sha.slice(0, 7)}
          </Text>
        </Group>
        {checks.items.length > 0 && (
          <Group gap="xs">
            <Badge variant="light" color="green">
              {passedCount} đạt
            </Badge>
            <Badge variant="light" color="yellow">
              {pendingCount} đang chờ
            </Badge>
            {otherCount > 0 && (
              <Badge variant="light" color="red">
                {otherCount} cần xem
              </Badge>
            )}
          </Group>
        )}
      </Stack>
      {checks.incomplete && (
        <Alert color="yellow" radius={0}>
          GitHub chưa trả đủ kết quả checks. Hãy làm mới hoặc xem trực tiếp trên
          GitHub.
        </Alert>
      )}
      {!checks.items.length && !checks.incomplete && (
        <Text p="md" size="sm" c="dimmed">
          Chưa có kết quả checks cho commit này.
        </Text>
      )}
      {checks.items.map((check) => {
        const isPending = pending.includes(check.status);
        const isPassed = check.status === "success";
        const isNeutral = passed.includes(check.status) && !isPassed;
        const Icon = isPending
          ? IconClock
          : isPassed
            ? IconCheck
            : isNeutral
              ? IconMinus
              : IconExclamationCircle;
        const color = isPending
          ? "yellow"
          : isPassed
            ? "green"
            : isNeutral
              ? "gray"
              : "red";
        return (
          <Group
            key={check.id}
            justify="space-between"
            px="md"
            py="xs"
            style={{ borderTop: "1px solid #e8e5de" }}
          >
            <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
              <Text component="span" c={color} style={{ display: "flex" }}>
                <Icon size={16} />
              </Text>
              <div style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                <Text size="sm" fw={600}>
                  {check.name}
                </Text>
                {check.source && (
                  <Text size="xs" c="dimmed">
                    {check.source}
                  </Text>
                )}
              </div>
            </Group>
            <Group gap="xs">
              <Badge variant="light" color={color}>
                {check.status.replaceAll("_", " ")}
              </Badge>
              {check.url && /^https?:\/\//i.test(check.url) && (
                <Anchor
                  href={check.url}
                  target="_blank"
                  rel="noreferrer"
                  size="xs"
                >
                  Chi tiết
                </Anchor>
              )}
            </Group>
          </Group>
        );
      })}
    </Paper>
  );
}
