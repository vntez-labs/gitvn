'use client';

import { useState } from 'react';
import {
  Modal,
  Group,
  Text,
  Button,
  Stack,
  TextInput,
  Textarea,
  Select,
} from '@mantine/core';
import { IconCalendar, IconPlus } from '@tabler/icons-react';
import { JiraSprint, SprintStatus } from '@/interfaces/jira';

interface CreateSprintModalProps {
  opened: boolean;
  onClose: () => void;
  nextSprintNumber: number;
  onCreateSprint: (newSprint: JiraSprint) => void;
}

export function CreateSprintModal({
  opened,
  onClose,
  nextSprintNumber,
  onCreateSprint,
}: CreateSprintModalProps) {
  const [name, setName] = useState(`Sprint ${nextSprintNumber}`);
  const [goal, setGoal] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [status, setStatus] = useState<SprintStatus>('planned');
  const [nameError, setNameError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError('Vui lòng nhập tên Sprint');
      return;
    }

    const newSprint: JiraSprint = {
      id: `sprint-${Date.now()}`,
      name: name.trim(),
      goal: goal.trim() || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      status,
      createdAt: new Date().toISOString(),
    };

    onCreateSprint(newSprint);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconCalendar size={18} color="#58a6ff" />
          <Text fw={700} fz={15} c="#f0f6fc">
            Tạo Sprint mới (Chu kỳ phát triển)
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
            label="Tên Sprint"
            placeholder="Ví dụ: Sprint 2 - Tính năng thanh toán"
            required
            value={name}
            onChange={(e) => {
              setName(e.currentTarget.value);
              if (nameError) setNameError(null);
            }}
            error={nameError}
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

          <Textarea
            label="Mục tiêu Sprint (Sprint Goal)"
            placeholder="Mục tiêu cốt lõi mà team cần đạt được trong sprint này..."
            rows={2}
            value={goal}
            onChange={(e) => setGoal(e.currentTarget.value)}
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

          <Group grow>
            <TextInput
              label="Ngày bắt đầu"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.currentTarget.value)}
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

            <TextInput
              label="Ngày kết thúc (Dự kiến)"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.currentTarget.value)}
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
          </Group>

          <Select
            label="Trạng thái ban đầu"
            data={[
              { value: 'planned', label: 'Lên kế hoạch (Planned)' },
              { value: 'active', label: 'Bắt đầu ngay (Active)' },
            ]}
            value={status}
            onChange={(val) => setStatus(val as SprintStatus)}
            styles={{
              input: {
                backgroundColor: '#0d1117',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                color: '#f0f6fc',
                borderRadius: 8,
              },
              label: { color: '#c9d1d9', fontWeight: 600, fontSize: 12, marginBottom: 4 },
              dropdown: { backgroundColor: '#161b22', borderColor: '#30363d' },
            }}
          />

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
                  backgroundColor: '#1f6feb',
                  color: '#ffffff',
                  fontWeight: 600,
                  borderRadius: 8,
                  '&:hover': { backgroundColor: '#388bfd' },
                },
              }}
            >
              Tạo Sprint
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
