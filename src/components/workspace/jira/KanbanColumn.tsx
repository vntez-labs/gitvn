'use client';

import { useState } from 'react';
import { Box, Group, Text, Badge, Stack, Button, ActionIcon, Tooltip } from '@mantine/core';
import { IconPlus, IconInbox } from '@tabler/icons-react';
import { JiraTask, TaskStatus } from '@/interfaces/jira';
import { KanbanCard } from './KanbanCard';

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
    const taskId = e.dataTransfer.getData('text/plain');
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
        backgroundColor: isDragOver ? 'rgba(56, 139, 253, 0.08)' : '#0d1117',
        border: `1px solid ${isDragOver ? '#58a6ff' : 'rgba(255, 255, 255, 0.08)'}`,
        borderRadius: 10,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxHeight: '100%',
        transition: 'all 0.15s ease',
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
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          backgroundColor: '#161b22',
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
              borderRadius: '50%',
              backgroundColor: color,
              boxShadow: `0 0 8px ${color}88`,
            }}
          />
          <Text
            fz={12.5}
            fw={700}
            c="#f0f6fc"
            style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}
          >
            {title}
          </Text>

          <Badge
            size="xs"
            variant="filled"
            styles={{
              root: {
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#c9d1d9',
                fontWeight: 600,
                fontSize: 10.5,
                borderRadius: 10,
                padding: '2px 7px',
                height: 18,
              },
            }}
          >
            {tasks.length}
          </Badge>
        </Group>

        <Group gap={6}>
          {totalPoints > 0 && (
            <Tooltip label={`Tổng: ${totalPoints} Story Points`} withArrow>
              <Badge
                size="xs"
                variant="outline"
                styles={{
                  root: {
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                    color: '#8b949e',
                    fontWeight: 600,
                    fontSize: 10,
                    height: 18,
                  },
                }}
              >
                {totalPoints} SP
              </Badge>
            </Tooltip>
          )}

          {canEdit && (
            <Tooltip label={`Thêm việc vào ${title}`} withArrow>
              <ActionIcon
                size="sm"
                variant="subtle"
                color="gray"
                onClick={() => onQuickAdd(status)}
                styles={{
                  root: {
                    color: '#8b949e',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      color: '#58a6ff',
                    },
                  },
                }}
              >
                <IconPlus size={15} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Group>

      {/* Cards list */}
      <Box
        className="hide-scrollbar"
        p={10}
        style={{
          flex: 1,
          overflowY: 'auto',
          minHeight: 120,
        }}
      >
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

          {tasks.length === 0 && (
            <Box
              py={36}
              ta="center"
              style={{
                border: '1.5px dashed rgba(255, 255, 255, 0.1)',
                borderRadius: 8,
                backgroundColor: 'rgba(255, 255, 255, 0.01)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <IconInbox size={22} color="#6e7681" />
              <Text fz={12} c="#6e7681" fw={500}>
                Kéo thẻ công việc vào đây
              </Text>
            </Box>
          )}
        </Stack>
      </Box>

      {/* Quick Add Button at bottom */}
      {canEdit && (
        <Box p={8} style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', flexShrink: 0 }}>
          <Button
            fullWidth
            size="compact-xs"
            variant="subtle"
            color="gray"
            leftSection={<IconPlus size={13} />}
            onClick={() => onQuickAdd(status)}
            styles={{
              root: {
                color: '#8b949e',
                fontWeight: 500,
                fontSize: 12,
                borderRadius: 6,
                height: 28,
                '&:hover': {
                  color: '#58a6ff',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                },
              },
            }}
          >
            Thêm việc mới
          </Button>
        </Box>
      )}
    </Box>
  );
}
