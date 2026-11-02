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
  onDropTask: (taskId: string, targetStatus: TaskStatus) => void;
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
      onDropTask(taskId, status);
    }
  };

  return (
    <Box
      style={{
        flex: 1,
        minWidth: 280,
        maxWidth: 380,
        backgroundColor: isDragOver ? "#fff1f0" : "#f1f5f9",
        border: `1px solid ${isDragOver ? "#fb291a" : "#e2e8f0"}`,
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
          borderBottom: "1px solid #e2e8f0",
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
              boxShadow: `0 0 6px ${color}66`,
            }}
          />
          <Text
            fz={12.5}
            fw={700}
            c="#0f172a"
            style={{ textTransform: "uppercase", letterSpacing: "0.04em" }}
          >
            {title}
          </Text>

          <Badge
            size="xs"
            variant="light"
            color="gray"
            styles={{
              root: {
                fontWeight: 600,
                fontSize: 10.5,
                borderRadius: 10,
                padding: "2px 7px",
                height: 18,
              },
            }}
          >
            {tasks.length}
          </Badge>

          {totalPoints > 0 && (
            <Tooltip label={`Tổng Story Points: ${totalPoints} SP`} withArrow>
              <Badge
                size="xs"
                variant="outline"
                color="vntez"
                styles={{
                  root: {
                    fontSize: 10,
                    padding: "2px 6px",
                    height: 18,
                  },
                }}
              >
                {totalPoints} SP
              </Badge>
            </Tooltip>
          )}
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
            {tasks.map((task) => (
              <KanbanCard
                key={task.id}
                task={task}
                onClick={onCardClick}
                onDragStart={onDragStart}
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
              border: "1px dashed #cbd5e1",
              borderRadius: 8,
              backgroundColor: "rgba(255, 255, 255, 0.4)",
            }}
          >
            <IconInbox size={24} color="#94a3b8" />
            <Text fz={12} c="#94a3b8" mt={6}>
              Chưa có task nào
            </Text>
            {canEdit && (
              <Button
                variant="subtle"
                color="vntez"
                size="compact-xs"
                mt={4}
                leftSection={<IconPlus size={12} />}
                onClick={() => onQuickAdd(status)}
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
