"use client";

import { Box, Group, Paper, Skeleton, Stack } from "@mantine/core";

export function KanbanSkeleton() {
  return (
    <Box
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        minHeight: 0,
        backgroundColor: "#f8fafc",
      }}
    >
      {/* Top Filter Bar Skeleton */}
      <Box
        px="md"
        py={10}
        bg="#ffffff"
        style={{ borderBottom: "1px solid #e2e8f0" }}
      >
        <Group justify="space-between" wrap="nowrap">
          <Group gap="sm">
            <Skeleton height={32} width={220} radius="sm" />
            <Skeleton height={32} width={130} radius="sm" />
            <Skeleton height={24} width={90} radius="xl" />
          </Group>
          <Skeleton height={20} width={160} radius="sm" />
        </Group>
      </Box>

      {/* 4 Column Kanban Skeleton */}
      <Box
        p="md"
        style={{
          flex: 1,
          display: "flex",
          gap: 16,
          overflowX: "auto",
          minHeight: 0,
        }}
      >
        {[1, 2, 3, 4].map((col) => (
          <Box
            key={col}
            style={{
              flex: 1,
              minWidth: 280,
              maxWidth: 380,
              backgroundColor: "#f1f5f9",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              display: "flex",
              flexDirection: "column",
              height: "100%",
            }}
          >
            {/* Column Header */}
            <Group
              justify="space-between"
              px="md"
              py={12}
              style={{
                borderBottom: "1px solid #e2e8f0",
                backgroundColor: "#ffffff",
                borderTopLeftRadius: 9,
                borderTopRightRadius: 9,
              }}
            >
              <Group gap={8}>
                <Skeleton height={8} width={8} circle />
                <Skeleton height={14} width={70} radius="sm" />
                <Skeleton height={18} width={24} radius="sm" />
              </Group>
              <Skeleton height={18} width={18} radius="sm" />
            </Group>

            {/* Column Cards */}
            <Stack gap="xs" p="xs" style={{ flex: 1 }}>
              {[1, 2, 3].map((card) => (
                <Paper
                  key={card}
                  p="sm"
                  radius="md"
                  bg="#ffffff"
                  style={{ border: "1px solid #e2e8f0" }}
                >
                  <Group justify="space-between" mb="xs">
                    <Skeleton height={12} width={60} radius="sm" />
                    <Skeleton height={16} width={30} radius="sm" />
                  </Group>
                  <Skeleton height={14} width="90%" radius="sm" mb={6} />
                  <Skeleton height={14} width="65%" radius="sm" mb="md" />
                  <Group justify="space-between" align="center">
                    <Skeleton height={18} width={50} radius="xl" />
                    <Skeleton height={22} width={22} circle />
                  </Group>
                </Paper>
              ))}
            </Stack>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
