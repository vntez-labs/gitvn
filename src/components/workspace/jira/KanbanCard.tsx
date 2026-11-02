'use client';

import { Box, Group, Text, Badge, Avatar, Tooltip } from '@mantine/core';
import { JiraTask, TaskPriority } from '@/interfaces/jira';

interface KanbanCardProps {
  task: JiraTask;
  onClick: (task: JiraTask) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  canDrag: boolean;
}

const PRIORITY_CONFIG: Record<
  TaskPriority,
  { bg: string; text: string; dot: string; label: string }
> = {
  urgent: {
    bg: 'rgba(248, 81, 73, 0.12)',
    text: '#ff7b72',
    dot: '#f85149',
    label: 'Urgent',
  },
  high: {
    bg: 'rgba(210, 153, 34, 0.12)',
    text: '#e3b341',
    dot: '#d29922',
    label: 'High',
  },
  medium: {
    bg: 'rgba(56, 139, 253, 0.12)',
    text: '#79c0ff',
    dot: '#58a6ff',
    label: 'Medium',
  },
  low: {
    bg: 'rgba(139, 148, 158, 0.12)',
    text: '#8b949e',
    dot: '#8b949e',
    label: 'Low',
  },
};

export function KanbanCard({ task, onClick, onDragStart, canDrag }: KanbanCardProps) {
  const prio = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const assigneeName = task.assignee?.name || task.assignee?.login;

  return (
    <Box
      draggable={canDrag}
      onDragStart={(e) => onDragStart(e, task.id)}
      onClick={() => onClick(task)}
      p={12}
      style={{
        backgroundColor: '#161b22',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 8,
        cursor: canDrag ? 'grab' : 'pointer',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
        transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
        userSelect: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(88, 166, 255, 0.45)';
        e.currentTarget.style.backgroundColor = '#1c2128';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 6px 14px rgba(0, 0, 0, 0.35)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
        e.currentTarget.style.backgroundColor = '#161b22';
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.25)';
      }}
    >
      {/* Header: Key & Story Points */}
      <Group justify="space-between" mb={8} wrap="nowrap">
        <Text fz={11.5} fw={600} c="#58a6ff" ff="var(--font-geist-mono), monospace">
          {task.id}
        </Text>

        {typeof task.storyPoints === 'number' && (
          <Badge
            size="xs"
            variant="outline"
            styles={{
              root: {
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                color: '#8b949e',
                fontWeight: 600,
                fontSize: 10,
                padding: '2px 6px',
                height: 18,
              },
            }}
          >
            {task.storyPoints} SP
          </Badge>
        )}
      </Group>

      {/* Title */}
      <Text
        fz={13.5}
        fw={500}
        c="#e6edf3"
        lineClamp={2}
        mb={12}
        lh={1.45}
        style={{ letterSpacing: '-0.01em' }}
      >
        {task.title}
      </Text>

      {/* Footer: Priority Pill & Assignee */}
      <Group justify="space-between" align="center" wrap="nowrap">
        <Group
          gap={5}
          px={8}
          py={2}
          style={{
            backgroundColor: prio.bg,
            borderRadius: 12,
            border: `1px solid ${prio.dot}33`,
          }}
        >
          <Box
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: prio.dot,
            }}
          />
          <Text fz={10.5} fw={600} c={prio.text} style={{ textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            {prio.label}
          </Text>
        </Group>

        {assigneeName ? (
          <Tooltip label={`Giao cho: @${assigneeName}`} withArrow>
            <Avatar
              src={task.assignee?.avatar_url}
              alt={assigneeName}
              size={22}
              radius="xl"
              style={{
                border: '1.5px solid #30363d',
                backgroundColor: '#21262d',
                color: '#f0f6fc',
                fontSize: 10,
                fontWeight: 600,
              }}
            >
              {assigneeName.slice(0, 2).toUpperCase()}
            </Avatar>
          </Tooltip>
        ) : (
          <Text fz={11} c="#6e7681" fs="italic">
            Chưa giao
          </Text>
        )}
      </Group>
    </Box>
  );
}
