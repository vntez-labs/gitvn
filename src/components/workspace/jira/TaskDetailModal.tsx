'use client';

import { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  Group,
  Text,
  Badge,
  Button,
  Stack,
  TextInput,
  Textarea,
  Select,
  NumberInput,
  Tabs,
  Avatar,
  Divider,
} from '@mantine/core';
import {
  IconCheck,
  IconTrash,
  IconEdit,
  IconEye,
  IconClock,
} from '@tabler/icons-react';
import { JiraTask, TaskPriority, TaskStatus, JiraSprint } from '@/interfaces/jira';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import { formatRelativeTime } from '@/lib/time';

interface TaskDetailModalProps {
  opened: boolean;
  onClose: () => void;
  task: JiraTask | null;
  sprints: JiraSprint[];
  onUpdateTask: (updatedTask: JiraTask) => void;
  onDeleteTask: (taskId: string) => void;
  canEdit: boolean;
}

const PRIORITY_OPTIONS = [
  { value: 'urgent', label: '🔴 Khẩn cấp (Urgent)' },
  { value: 'high', label: '🟠 Cao (High)' },
  { value: 'medium', label: '🔵 Trung bình (Medium)' },
  { value: 'low', label: '⚪ Thấp (Low)' },
];

const STATUS_OPTIONS = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'In Review' },
  { value: 'done', label: 'Done' },
];

export function TaskDetailModal({
  opened,
  onClose,
  task,
  sprints,
  onUpdateTask,
  onDeleteTask,
  canEdit,
}: TaskDetailModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [sprintId, setSprintId] = useState<string | null>(null);
  const [storyPoints, setStoryPoints] = useState<number | ''>(3);
  const [assigneeName, setAssigneeName] = useState('');
  const [descTab, setDescTab] = useState<string | null>('preview');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority);
      setSprintId(task.sprintId);
      setStoryPoints(task.storyPoints ?? '');
      setAssigneeName(task.assignee?.name || task.assignee?.login || '');
      setDescTab(task.description ? 'preview' : 'edit');
    }
  }, [task]);

  if (!task) return null;

  const handleSave = () => {
    const updated: JiraTask = {
      ...task,
      title: title.trim() || task.title,
      description,
      status,
      priority,
      sprintId,
      storyPoints: typeof storyPoints === 'number' ? storyPoints : undefined,
      assignee: assigneeName.trim()
        ? { login: assigneeName.trim(), name: assigneeName.trim() }
        : undefined,
      updatedAt: new Date().toISOString(),
    };
    onUpdateTask(updated);
    onClose();
  };

  const sprintOptions = [
    { value: 'backlog', label: '📁 Backlog (Chưa vào Sprint)' },
    ...sprints.map((s) => ({
      value: s.id,
      label: `${s.name} (${s.status.toUpperCase()})`,
    })),
  ];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="xl"
      title={
        <Group gap="xs">
          <Badge
            size="sm"
            styles={{
              root: {
                backgroundColor: 'rgba(56, 139, 253, 0.15)',
                color: '#58a6ff',
                fontWeight: 700,
                fontFamily: 'var(--font-geist-mono), monospace',
                borderRadius: 6,
              },
            }}
          >
            {task.id}
          </Badge>
          <Text fw={700} fz={15} c="#f0f6fc">
            Chi tiết Công việc
          </Text>
        </Group>
      }
      styles={{
        content: {
          backgroundColor: '#161b22',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#f0f6fc',
          borderRadius: 12,
        },
        header: {
          backgroundColor: '#1c2128',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '14px 20px',
        },
        body: {
          padding: 20,
        },
      }}
    >
      <Stack gap="md">
        {/* Tiêu đề task */}
        <TextInput
          label="Tiêu đề công việc"
          value={title}
          onChange={(e) => setTitle(e.currentTarget.value)}
          disabled={!canEdit}
          styles={{
            input: {
              backgroundColor: '#0d1117',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              color: '#f0f6fc',
              fontWeight: 600,
              fontSize: 14,
              borderRadius: 8,
            },
            label: { color: '#c9d1d9', fontWeight: 600, fontSize: 12, marginBottom: 4 },
          }}
        />

        {/* Thông số cột & trạng thái */}
        <Group grow align="flex-start">
          <Select
            label="Trạng thái"
            data={STATUS_OPTIONS}
            value={status}
            onChange={(val) => setStatus(val as TaskStatus)}
            disabled={!canEdit}
            styles={{
              input: { backgroundColor: '#0d1117', borderColor: 'rgba(255, 255, 255, 0.1)', color: '#f0f6fc', borderRadius: 8 },
              label: { color: '#c9d1d9', fontWeight: 600, fontSize: 12, marginBottom: 4 },
              dropdown: { backgroundColor: '#161b22', borderColor: '#30363d' },
            }}
          />

          <Select
            label="Mức độ ưu tiên"
            data={PRIORITY_OPTIONS}
            value={priority}
            onChange={(val) => setPriority(val as TaskPriority)}
            disabled={!canEdit}
            styles={{
              input: { backgroundColor: '#0d1117', borderColor: 'rgba(255, 255, 255, 0.1)', color: '#f0f6fc', borderRadius: 8 },
              label: { color: '#c9d1d9', fontWeight: 600, fontSize: 12, marginBottom: 4 },
              dropdown: { backgroundColor: '#161b22', borderColor: '#30363d' },
            }}
          />

          <Select
            label="Sprint"
            data={sprintOptions}
            value={sprintId || 'backlog'}
            onChange={(val) => setSprintId(val === 'backlog' ? null : val)}
            disabled={!canEdit}
            styles={{
              input: { backgroundColor: '#0d1117', borderColor: 'rgba(255, 255, 255, 0.1)', color: '#f0f6fc', borderRadius: 8 },
              label: { color: '#c9d1d9', fontWeight: 600, fontSize: 12, marginBottom: 4 },
              dropdown: { backgroundColor: '#161b22', borderColor: '#30363d' },
            }}
          />
        </Group>

        <Group grow align="flex-start">
          <TextInput
            label="Người thực hiện (Assignee)"
            placeholder="Username GitHub..."
            value={assigneeName}
            onChange={(e) => setAssigneeName(e.currentTarget.value)}
            disabled={!canEdit}
            styles={{
              input: { backgroundColor: '#0d1117', borderColor: 'rgba(255, 255, 255, 0.1)', color: '#f0f6fc', borderRadius: 8 },
              label: { color: '#c9d1d9', fontWeight: 600, fontSize: 12, marginBottom: 4 },
            }}
          />

          <NumberInput
            label="Story Points (Độ khó)"
            placeholder="1, 2, 3, 5, 8..."
            min={0}
            max={100}
            value={storyPoints}
            onChange={(val) => setStoryPoints(typeof val === 'number' ? val : '')}
            disabled={!canEdit}
            styles={{
              input: { backgroundColor: '#0d1117', borderColor: 'rgba(255, 255, 255, 0.1)', color: '#f0f6fc', borderRadius: 8 },
              label: { color: '#c9d1d9', fontWeight: 600, fontSize: 12, marginBottom: 4 },
            }}
          />
        </Group>

        {/* Mô tả Markdown */}
        <Box>
          <Group justify="space-between" mb={6}>
            <Text fz={12} fw={600} c="#c9d1d9">
              Mô tả chi tiết (Markdown)
            </Text>
            <Tabs value={descTab} onChange={setDescTab} variant="pills" color="blue">
              <Tabs.List>
                <Tabs.Tab value="edit" leftSection={<IconEdit size={12} />}>
                  Chỉnh sửa
                </Tabs.Tab>
                <Tabs.Tab value="preview" leftSection={<IconEye size={12} />}>
                  Xem trước
                </Tabs.Tab>
              </Tabs.List>
            </Tabs>
          </Group>

          {descTab === 'edit' ? (
            <Textarea
              placeholder="Nhập mô tả task với định dạng Markdown (### Tiêu đề, - Danh sách, **In đậm**)..."
              value={description}
              onChange={(e) => setDescription(e.currentTarget.value)}
              minRows={6}
              disabled={!canEdit}
              styles={{
                input: {
                  backgroundColor: '#0d1117',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#f0f6fc',
                  fontFamily: 'var(--font-geist-mono), monospace',
                  fontSize: 12.5,
                  borderRadius: 8,
                },
              }}
            />
          ) : (
            <Box
              p="md"
              style={{
                backgroundColor: '#0d1117',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 8,
                minHeight: 140,
                maxHeight: 320,
                overflowY: 'auto',
                color: '#c9d1d9',
              }}
            >
              {description ? (
                <MarkdownViewer content={description} />
              ) : (
                <Text fz={12.5} c="#8b949e" fs="italic">
                  Chưa có nội dung mô tả.
                </Text>
              )}
            </Box>
          )}
        </Box>

        <Divider color="rgba(255, 255, 255, 0.08)" />

        {/* Footer */}
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <IconClock size={14} color="#8b949e" />
            <Text fz={11.5} c="#8b949e">
              Tạo bởi <span style={{ color: '#f0f6fc', fontWeight: 600 }}>{task.reporter?.name || task.reporter?.login || 'Admin'}</span> •{' '}
              {formatRelativeTime(task.createdAt)}
            </Text>
          </Group>

          <Group gap="xs">
            {canEdit && (
              <Button
                variant="subtle"
                color="red"
                size="xs"
                leftSection={<IconTrash size={14} />}
                onClick={() => {
                  if (confirm(`Bạn có chắc muốn xóa task ${task.id}?`)) {
                    onDeleteTask(task.id);
                    onClose();
                  }
                }}
              >
                Xóa việc
              </Button>
            )}

            <Button
              variant="default"
              size="xs"
              onClick={onClose}
              styles={{
                root: {
                  backgroundColor: '#21262d',
                  borderColor: 'rgba(255, 255, 255, 0.12)',
                  color: '#c9d1d9',
                  borderRadius: 8,
                },
              }}
            >
              Đóng
            </Button>

            {canEdit && (
              <Button
                variant="filled"
                size="xs"
                leftSection={<IconCheck size={14} />}
                onClick={handleSave}
                styles={{
                  root: {
                    backgroundColor: '#238636',
                    color: '#ffffff',
                    fontWeight: 600,
                    borderRadius: 8,
                    '&:hover': { backgroundColor: '#2ea043' },
                  },
                }}
              >
                Lưu thay đổi
              </Button>
            )}
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
}
