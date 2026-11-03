"use client";

import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { IconInbox, IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import type { JiraTask, TaskStatus } from "@/interfaces/jira";
import { KanbanCard } from "./KanbanCard";

interface KanbanColumnProps {
  status: TaskStatus;
  title: string;
  color: string;
  tasks: JiraTask[];
  onDropTask: (
    taskId: string,
    targetStatus: TaskStatus,
    targetIndex?: number,
  ) => void;
  onCardClick: (task: JiraTask) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onQuickAdd: (status: TaskStatus) => void;
  canEdit: boolean;
}

export function KanbanColumn({
  status,
  title,
  color,
  tasks,
  onDropTask,
  onCardClick,
  onDragStart,
  onQuickAdd,
  canEdit,
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const totalPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (canEdit && !isDragOver) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) {
      onDropTask(taskId, status, tasks.length);
    }
  };

  const handleDropOnCard = (e: React.DragEvent, targetIndex: number) => {
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) {
      onDropTask(taskId, status, targetIndex);
    }
  };

  return (
    <Box
      style={{
        flex: 1,
        minWidth: 280,
        maxWidth: 380,
        backgroundColor: isDragOver ? "#fef2f2" : "#fbfbfc",
        border: `1px solid ${isDragOver ? "#dc2626" : "#e4e4e7"}`,
        borderRadius: 10,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        maxHeight: "100%",
        transition: "all 0.15s ease",
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <Group
        justify="space-between"
        px="md"
        py={12}
        style={{
          borderBottom: "1px solid #e4e4e7",
          backgroundColor: "#ffffff",
          borderTopLeftRadius: 9,
          borderTopRightRadius: 9,
          flexShrink: 0,
        }}
      >
        <Group gap={8}>
          <Box
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: color,
            }}
          />
          <Text
            fz={12.5}
            fw={600}
            c="#18181b"
            style={{ textTransform: "uppercase", letterSpacing: "0.04em" }}
          >
            {title}
          </Text>

          <Badge
            size="xs"
            variant="outline"
            style={{
              borderColor: "#e4e4e7",
              color: "#52525b",
              backgroundColor: "#f4f4f5",
              fontFamily: "monospace",
              fontSize: 11,
              padding: "2px 7px",
            }}
          >
            {tasks.length} {totalPoints > 0 ? `· ${totalPoints} SP` : ""}
          </Badge>
        </Group>

        {canEdit && (
          <Tooltip label={`Thêm task vào cột ${title}`} withArrow>
            <ActionIcon
              size="xs"
              variant="subtle"
              color="gray"
              onClick={() => onQuickAdd(status)}
              aria-label={`Thêm task vào ${title}`}
            >
              <IconPlus size={14} />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>

      {/* Cards Scrollable Container */}
      <Box
        className="hide-scrollbar"
        p={8}
        style={{
          flex: 1,
          overflowY: "auto",
          minHeight: 0,
        }}
      >
        {tasks.length > 0 ? (
          <Stack gap={8}>
            {tasks.map((task, idx) => (
              <KanbanCard
                key={task.id}
                task={task}
                index={idx}
                onClick={onCardClick}
                onDragStart={onDragStart}
                onDropOnCard={handleDropOnCard}
                canDrag={canEdit}
              />
            ))}
          </Stack>
        ) : (
          <Box
            style={{
              height: 140,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              border: "1px dashed #e4e4e7",
              borderRadius: 8,
              backgroundColor: "#f4f4f5",
            }}
          >
            <IconInbox size={24} color="#a1a1aa" />
            <Text fz={12} c="#71717a" mt={6}>
              Chưa có task nào
            </Text>
            {canEdit && (
              <Button
                variant="subtle"
                color="gray"
                size="compact-xs"
                mt={4}
                leftSection={<IconPlus size={12} />}
                onClick={() => onQuickAdd(status)}
                style={{ color: "#71717a" }}
              >
                Tạo task mới
              </Button>
            )}
          </Box>
        )}
      </Box>

      {/* Quick Add Footer Button */}
      {canEdit && tasks.length > 0 && (
        <Box p={8} style={{ borderTop: "1px solid #e2e8f0", flexShrink: 0 }}>
          <Button
            variant="subtle"
            color="gray"
            size="xs"
            fullWidth
            leftSection={<IconPlus size={14} />}
            onClick={() => onQuickAdd(status)}
            styles={{
              root: {
                color: "#475569",
                fontSize: 12,
                fontWeight: 500,
                "&:hover": {
                  backgroundColor: "#ffffff",
                  color: "#0f172a",
                },
              },
            }}
          >
            Tạo thêm task...
          </Button>
        </Box>
      )}
    </Box>
  );
}
