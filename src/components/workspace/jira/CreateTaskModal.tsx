'use client';

import { useState } from 'react';
import {
  Modal,
  Box,
  Group,
  Text,
  Button,
  Stack,
  TextInput,
  Textarea,
  Select,
  NumberInput,
  Tabs,
} from '@mantine/core';
import { IconPlus, IconEdit, IconEye } from '@tabler/icons-react';
import { JiraSprint, JiraTask, TaskPriority, TaskStatus } from '@/interfaces/jira';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import { useAuthStore } from '@/store/auth.store';

interface CreateTaskModalProps {
  opened: boolean;
  onClose: () => void;
  sprints: JiraSprint[];
  defaultSprintId: string | null;
  defaultStatus?: TaskStatus;
  nextSeq: number;
  repoPrefix: string;
  onCreateTask: (newTask: JiraTask) => void;
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

export function CreateTaskModal({
  opened,
  onClose,
  sprints,
  defaultSprintId,
  defaultStatus = 'todo',
  nextSeq,
  repoPrefix,
  onCreateTask,
}: CreateTaskModalProps) {
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [sprintId, setSprintId] = useState<string | null>(defaultSprintId);
  const [storyPoints, setStoryPoints] = useState<number | ''>(3);
  const [assigneeName, setAssigneeName] = useState(user?.login || '');
  const [descTab, setDescTab] = useState<string | null>('edit');
  const [titleError, setTitleError] = useState<string | null>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      setTitleError('Vui lòng nhập tiêu đề công việc');
      return;
    }

    const now = new Date().toISOString();
    const newTask: JiraTask = {
      id: `${repoPrefix}-${nextSeq}`,
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      sprintId: sprintId,
      storyPoints: typeof storyPoints === 'number' ? storyPoints : undefined,
      assignee: assigneeName.trim()
        ? { login: assigneeName.trim(), name: assigneeName.trim() }
        : undefined,
      reporter: {
        login: user?.login || 'anonymous',
        name: user?.name || user?.login || 'Anonymous',
        avatar_url: user?.avatar_url,
      },
      createdAt: now,
      updatedAt: now,
    };

    onCreateTask(newTask);
    setTitle('');
    setDescription('');
    setTitleError(null);
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
      size="lg"
      title={
        <Group gap="xs">
          <IconPlus size={18} color="#58a6ff" />
          <Text fw={700} fz={15} c="#f0f6fc">
            Tạo công việc mới ({repoPrefix}-{nextSeq})
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
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label="Tiêu đề công việc"
            placeholder="Ví dụ: Tối ưu hoá tải dữ liệu từ cache..."
            required
            value={title}
            onChange={(e) => {
              setTitle(e.currentTarget.value);
              if (titleError) setTitleError(null);
            }}
            error={titleError}
            styles={{
              input: {
                backgroundColor: '#0d1117',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                color: '#f0f6fc',
                borderRadius: 8,
              },
              label: { color: '#c9d1d9', fontWeight: 600, fontSize: 12, marginBottom: 4 },
            }}
          />

          <Group grow align="flex-start">
            <Select
              label="Sprint"
              data={sprintOptions}
              value={sprintId || 'backlog'}
              onChange={(val) => setSprintId(val === 'backlog' ? null : val)}
              styles={{
                input: { backgroundColor: '#0d1117', borderColor: 'rgba(255, 255, 255, 0.1)', color: '#f0f6fc', borderRadius: 8 },
                label: { color: '#c9d1d9', fontWeight: 600, fontSize: 12, marginBottom: 4 },
                dropdown: { backgroundColor: '#161b22', borderColor: '#30363d' },
              }}
            />

            <Select
              label="Cột trạng thái ban đầu"
              data={STATUS_OPTIONS}
              value={status}
              onChange={(val) => setStatus(val as TaskStatus)}
              styles={{
                input: { backgroundColor: '#0d1117', borderColor: 'rgba(255, 255, 255, 0.1)', color: '#f0f6fc', borderRadius: 8 },
                label: { color: '#c9d1d9', fontWeight: 600, fontSize: 12, marginBottom: 4 },
                dropdown: { backgroundColor: '#161b22', borderColor: '#30363d' },
              }}
            />
          </Group>

          <Group grow align="flex-start">
            <Select
              label="Độ ưu tiên"
              data={PRIORITY_OPTIONS}
              value={priority}
              onChange={(val) => setPriority(val as TaskPriority)}
              styles={{
                input: { backgroundColor: '#0d1117', borderColor: 'rgba(255, 255, 255, 0.1)', color: '#f0f6fc', borderRadius: 8 },
                label: { color: '#c9d1d9', fontWeight: 600, fontSize: 12, marginBottom: 4 },
                dropdown: { backgroundColor: '#161b22', borderColor: '#30363d' },
              }}
            />

            <TextInput
              label="Người thực hiện"
              placeholder="Username..."
              value={assigneeName}
              onChange={(e) => setAssigneeName(e.currentTarget.value)}
              styles={{
                input: { backgroundColor: '#0d1117', borderColor: 'rgba(255, 255, 255, 0.1)', color: '#f0f6fc', borderRadius: 8 },
                label: { color: '#c9d1d9', fontWeight: 600, fontSize: 12, marginBottom: 4 },
              }}
            />

            <NumberInput
              label="Story Points"
              min={0}
              max={100}
              value={storyPoints}
              onChange={(val) => setStoryPoints(typeof val === 'number' ? val : '')}
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
                    Nhập Markdown
                  </Tabs.Tab>
                  <Tabs.Tab value="preview" leftSection={<IconEye size={12} />}>
                    Xem trước
                  </Tabs.Tab>
                </Tabs.List>
              </Tabs>
            </Group>

            {descTab === 'edit' ? (
              <Textarea
                placeholder="Nhập mô tả với định dạng Markdown (### Header, - List, **Bold**)..."
                value={description}
                onChange={(e) => setDescription(e.currentTarget.value)}
                minRows={5}
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
                  minHeight: 120,
                  maxHeight: 250,
                  overflowY: 'auto',
                }}
              >
                {description ? (
                  <MarkdownViewer content={description} />
                ) : (
                  <Text fz={12} c="#8b949e" fs="italic">
                    Chưa có nội dung mô tả.
                  </Text>
                )}
              </Box>
            )}
          </Box>

          <Group justify="flex-end" mt="sm">
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
              Hủy
            </Button>
            <Button
              type="submit"
              variant="filled"
              size="xs"
              leftSection={<IconPlus size={14} />}
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
              Tạo công việc
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
