"use client";

import { ActionIcon, Badge, Button, Group, Menu, Paper } from "@mantine/core";
import { IconArrowRight, IconTrash, IconX } from "@tabler/icons-react";
import type { JiraSprint } from "@/interfaces/jira";

interface FloatingBulkActionBarProps {
  selectedCount: number;
  sprints: JiraSprint[];
  canManageSprint: boolean;
  onBulkMove: (targetSprintId: string | null) => void;
  onBulkDelete: () => void;
  onClearSelection: () => void;
}

export function FloatingBulkActionBar({
  selectedCount,
  sprints,
  canManageSprint,
  onBulkMove,
  onBulkDelete,
  onClearSelection,
}: FloatingBulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <Paper
      p="sm"
      radius="md"
      shadow="lg"
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "#1e293b",
        color: "#ffffff",
        border: "1px solid #334155",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        gap: 16,
        userSelect: "none",
      }}
    >
      <Group gap="xs">
        <Badge size="md" variant="filled" color="vntez" radius="sm">
          {selectedCount} việc đã chọn
        </Badge>
      </Group>

      <Group gap="xs">
        {/* Chuyển sang Sprint khác */}
        <Menu shadow="md" width={220} position="top">
          <Menu.Target>
            <Button
              size="xs"
              variant="filled"
              color="indigo"
              radius="sm"
              rightSection={<IconArrowRight size={13} />}
            >
              Chuyển vào Sprint...
            </Button>
          </Menu.Target>
          <Menu.Dropdown bg="#ffffff" style={{ borderColor: "#e2e8f0" }}>
            <Menu.Label>Chọn đích đến</Menu.Label>
            <Menu.Item onClick={() => onBulkMove(null)}>
              📦 Backlog (Chưa vào Sprint)
            </Menu.Item>
            {sprints.map((s) => (
              <Menu.Item key={s.id} onClick={() => onBulkMove(s.id)}>
                🏃 {s.name} ({s.status.toUpperCase()})
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>

        {/* Xóa hàng loạt */}
        {canManageSprint && (
          <Button
            size="xs"
            variant="filled"
            color="red"
            radius="sm"
            leftSection={<IconTrash size={14} />}
            onClick={onBulkDelete}
          >
            Xóa {selectedCount} việc
          </Button>
        )}

        {/* Bỏ chọn */}
        <ActionIcon
          size="sm"
          variant="subtle"
          color="gray"
          onClick={onClearSelection}
          aria-label="Bỏ chọn"
        >
          <IconX size={15} color="#94a3b8" />
        </ActionIcon>
      </Group>
    </Paper>
  );
}
