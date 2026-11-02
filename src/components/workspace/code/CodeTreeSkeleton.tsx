"use client";

import { Box, Group, Skeleton, Stack } from "@mantine/core";

export function CodeTreeSkeleton() {
  return (
    <Box
      style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "280px 1fr",
        overflow: "hidden",
        minHeight: 0,
        backgroundColor: "#faf8f6",
      }}
    >
      {/* Left Explorer Skeleton */}
      <Box
        p="md"
        style={{
          borderRight: "1px solid #e8e5de",
          backgroundColor: "#f5f3ee",
        }}
      >
        <Skeleton height={28} radius="sm" mb="md" />
        <Stack gap={8}>
          <Skeleton height={20} width="60%" radius="sm" />
          <Skeleton height={20} width="80%" radius="sm" />
          <Skeleton height={20} width="70%" radius="sm" />
          <Skeleton height={20} width="85%" radius="sm" />
          <Skeleton height={20} width="50%" radius="sm" />
          <Skeleton height={20} width="65%" radius="sm" />
          <Skeleton height={20} width="75%" radius="sm" />
        </Stack>
      </Box>

      {/* Right Code Pane Skeleton */}
      <Box p="md" style={{ backgroundColor: "#faf8f6" }}>
        <Group justify="space-between" mb="lg">
          <Skeleton height={24} width={200} radius="sm" />
          <Skeleton height={24} width={120} radius="sm" />
        </Group>
        <Stack gap={8}>
          <Skeleton height={14} width="35%" radius="sm" />
          <Skeleton height={14} width="75%" radius="sm" />
          <Skeleton height={14} width="50%" radius="sm" />
          <Skeleton height={14} width="80%" radius="sm" />
          <Skeleton height={14} width="60%" radius="sm" />
          <Skeleton height={14} width="90%" radius="sm" />
          <Skeleton height={14} width="40%" radius="sm" />
          <Skeleton height={14} width="70%" radius="sm" />
          <Skeleton height={14} width="55%" radius="sm" />
          <Skeleton height={14} width="85%" radius="sm" />
        </Stack>
      </Box>
    </Box>
  );
}
