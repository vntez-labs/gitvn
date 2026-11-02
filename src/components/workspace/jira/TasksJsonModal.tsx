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
  Textarea,
  ActionIcon,
  Tooltip,
  Alert,
} from '@mantine/core';
import {
  IconFileCode,
  IconCopy,
  IconCheck,
  IconDeviceFloppy,
  IconCloudUpload,
  IconTrash,
  IconAlertCircle,
  IconSparkles,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { JiraBoardData } from '@/interfaces/jira';

interface TasksJsonModalProps {
  opened: boolean;
  onClose: () => void;
  boardData: JiraBoardData | null;
  syncedToGitHub: boolean;
  onSaveData: (data: JiraBoardData, commitMessage?: string) => Promise<void>;
  repoPrefix: string;
}

export function TasksJsonModal({
  opened,
  onClose,
  boardData,
  syncedToGitHub,
  onSaveData,
  repoPrefix,
}: TasksJsonModalProps) {
  const [jsonContent, setJsonContent] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (boardData && opened) {
      setJsonContent(JSON.stringify(boardData, null, 2));
      setJsonError(null);
    }
  }, [boardData, opened]);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonContent);
    setCopied(true);
    notifications.show({
      title: 'Đã sao chép',
      message: 'Nội dung .gitvn/tasks.json đã được lưu vào clipboard',
      color: 'blue',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async (commitToGit = false) => {
    try {
      const parsed: JiraBoardData = JSON.parse(jsonContent);

      if (!parsed || !Array.isArray(parsed.tasks) || !Array.isArray(parsed.sprints)) {
        setJsonError('Cấu trúc JSON không hợp lệ: Cần có mảng "tasks" và "sprints"');
        return;
      }

      setSaving(true);
      setJsonError(null);

      const msg = commitToGit
        ? `chore(gitvn): manual update .gitvn/tasks.json from UI`
        : undefined;

      await onSaveData(parsed, msg);

      notifications.show({
        title: commitToGit ? 'Đã commit lên GitHub' : 'Đã lưu file',
        message: 'File .gitvn/tasks.json đã được cập nhật thành công!',
        color: 'green',
      });

      onClose();
    } catch (err: any) {
      setJsonError(`Lỗi cú pháp JSON: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleResetEmpty = () => {
    if (!boardData) return;
    const emptyBoard: JiraBoardData = {
      ...boardData,
      taskSeq: 0,
      tasks: [],
      sprints: [
        {
          id: 'sprint-1',
          name: 'Sprint 1',
          goal: 'Sprint khởi động',
          status: 'active',
          createdAt: new Date().toISOString(),
        },
      ],
    };
    setJsonContent(JSON.stringify(emptyBoard, null, 2));
    setJsonError(null);
  };

  const handleInsertSample = () => {
    if (!boardData) return;
    const now = new Date().toISOString();
    const sampleBoard: JiraBoardData = {
      ...boardData,
      taskSeq: 3,
      tasks: [
        {
          id: `${repoPrefix}-1`,
          title: 'Khởi tạo cấu trúc dự án và cài đặt dependencies',
          description: 'Cài đặt các gói phụ thuộc và cấu hình cơ bản.',
          status: 'done',
          priority: 'high',
          sprintId: 'sprint-1',
          storyPoints: 3,
          createdAt: now,
          updatedAt: now,
          reporter: { login: 'admin', name: 'Admin' },
        },
        {
          id: `${repoPrefix}-2`,
          title: 'Xây dựng giao diện tính năng chính',
          description: 'Triển khai UI components theo thiết kế Figma/Spec.',
          status: 'in_progress',
          priority: 'urgent',
          sprintId: 'sprint-1',
          storyPoints: 5,
          createdAt: now,
          updatedAt: now,
          reporter: { login: 'admin', name: 'Admin' },
        },
        {
          id: `${repoPrefix}-3`,
          title: 'Viết unit tests và chuẩn bị deployment pipeline',
          description: 'Kiểm thử logic cốt lõi và thiết lập CI/CD.',
          status: 'todo',
          priority: 'medium',
          sprintId: 'sprint-1',
          storyPoints: 2,
          createdAt: now,
          updatedAt: now,
          reporter: { login: 'admin', name: 'Admin' },
        },
      ],
    };
    setJsonContent(JSON.stringify(sampleBoard, null, 2));
    setJsonError(null);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="xl"
      title={
        <Group gap="xs">
          <IconFileCode size={20} color="#58a6ff" />
          <Box>
            <Group gap="xs">
              <Text fw={700} fz={15} c="#f0f6fc" ff="monospace">
                .gitvn/tasks.json
              </Text>
              <Badge
                size="xs"
                variant="light"
                color={syncedToGitHub ? 'green' : 'blue'}
              >
                {syncedToGitHub ? '🟢 GitHub Synced' : '💾 Local Workspace'}
              </Badge>
            </Group>
          </Box>
        </Group>
      }
      styles={{
        content: {
          backgroundColor: '#0d1117',
          border: '1px solid #30363d',
          color: '#f0f6fc',
          borderRadius: 12,
        },
        header: {
          backgroundColor: '#161b22',
          borderBottom: '1px solid #21262d',
          padding: '14px 20px',
        },
        body: {
          padding: 20,
        },
      }}
    >
      <Stack gap="sm">
        <Group justify="space-between" align="center">
          <Text fz={12} c="#8b949e">
            Bạn có thể chỉnh sửa trực tiếp cấu trúc JSON của bảng Kanban bên dưới.
          </Text>

          <Group gap={6}>
            <Tooltip label="Xóa toàn bộ tasks để tạo bảng sạch rỗng" withArrow>
              <Button
                size="compact-xs"
                variant="subtle"
                color="red"
                leftSection={<IconTrash size={12} />}
                onClick={handleResetEmpty}
              >
                Làm rỗng bảng
              </Button>
            </Tooltip>

            <Tooltip label="Khởi tạo công việc mẫu chuẩn" withArrow>
              <Button
                size="compact-xs"
                variant="subtle"
                color="blue"
                leftSection={<IconSparkles size={12} />}
                onClick={handleInsertSample}
              >
                Chèn mẫu
              </Button>
            </Tooltip>

            <Button
              size="compact-xs"
              variant="default"
              leftSection={copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
              onClick={handleCopy}
              styles={{
                root: {
                  backgroundColor: '#21262d',
                  borderColor: '#30363d',
                  color: '#c9d1d9',
                },
              }}
            >
              {copied ? 'Đã copy' : 'Sao chép'}
            </Button>
          </Group>
        </Group>

        {jsonError && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Lỗi cấu trúc JSON"
            color="red"
            variant="light"
            styles={{ root: { backgroundColor: 'rgba(248, 81, 73, 0.1)', borderColor: '#f85149' } }}
          >
            {jsonError}
          </Alert>
        )}

        <Box
          style={{
            position: 'relative',
            borderRadius: 8,
            overflow: 'hidden',
            border: '1px solid #30363d',
            backgroundColor: '#090d16',
          }}
        >
          <Textarea
            value={jsonContent}
            onChange={(e) => {
              setJsonContent(e.currentTarget.value);
              if (jsonError) setJsonError(null);
            }}
            minRows={14}
            maxRows={24}
            autosize
            styles={{
              input: {
                backgroundColor: '#090d16',
                color: '#7ee787',
                fontFamily: 'var(--font-geist-mono), monospace',
                fontSize: 12.5,
                lineHeight: 1.5,
                border: 'none',
                padding: '12px 14px',
              },
            }}
          />
        </Box>

        <Group justify="space-between" mt="sm">
          <Text fz={11} c="#8b949e">
            Vị trí lưu: <code style={{ color: '#58a6ff' }}>.gitvn/tasks.json</code>
          </Text>

          <Group gap="xs">
            <Button
              variant="default"
              size="xs"
              onClick={onClose}
              styles={{
                root: {
                  backgroundColor: '#21262d',
                  borderColor: '#30363d',
                  color: '#c9d1d9',
                },
              }}
            >
              Hủy
            </Button>

            <Button
              variant="default"
              size="xs"
              loading={saving}
              leftSection={<IconDeviceFloppy size={14} />}
              onClick={() => handleSave(false)}
              styles={{
                root: {
                  backgroundColor: '#238636',
                  borderColor: '#2ea043',
                  color: '#ffffff',
                  fontWeight: 600,
                  '&:hover': { backgroundColor: '#2ea043' },
                },
              }}
            >
              Lưu vào .gitvn/tasks.json
            </Button>

            <Button
              variant="filled"
              size="xs"
              loading={saving}
              leftSection={<IconCloudUpload size={14} />}
              onClick={() => handleSave(true)}
              styles={{
                root: {
                  backgroundColor: '#1f6feb',
                  color: '#ffffff',
                  fontWeight: 600,
                  '&:hover': { backgroundColor: '#388bfd' },
                },
              }}
            >
              Commit lên GitHub
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
}
