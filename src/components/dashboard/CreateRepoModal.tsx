'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Modal,
  TextInput,
  Textarea,
  Button,
  Group,
  Stack,
  Text,
  Select,
  Radio,
  Paper,
} from '@mantine/core';
import { IconBook, IconLock, IconWorld, IconPlus } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useAuthStore } from '@/store/auth.store';
import { useDashboardStore } from '@/store/dashboard.store';
import axios from 'axios';

interface CreateRepoModalProps {
  opened: boolean;
  onClose: () => void;
}

export function CreateRepoModal({ opened, onClose }: CreateRepoModalProps) {
  const { user } = useAuthStore();
  const { orgs, selectedOrg, addRepo } = useDashboardStore();

  const [owner, setOwner] = useState<string>(selectedOrg || user?.login || '');
  const [repoName, setRepoName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  // Cập nhật owner mặc định khi modal mở hoặc selectedOrg thay đổi
  useEffect(() => {
    if (opened) {
      setOwner(selectedOrg || user?.login || '');
      setRepoName('');
      setDescription('');
      setIsPrivate(true);
      setNameError(null);
    }
  }, [opened, selectedOrg, user?.login]);

  const ownerOptions = [
    ...(user ? [{ value: user.login, label: `${user.login} (Cá nhân)` }] : []),
    ...orgs.map((org) => ({ value: org.login, label: `${org.login} (Organization)` })),
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = repoName.trim();

    if (!cleanName) {
      setNameError('Vui lòng nhập tên repository');
      return;
    }

    if (!/^[a-zA-Z0-9._-]+$/.test(cleanName)) {
      setNameError('Tên repo chỉ chứa chữ cái, số, dấu gạch ngang (-), gạch dưới (_) và chấm (.)');
      return;
    }

    setNameError(null);
    setSubmitting(true);

    try {
      const isOrgOwner = owner !== user?.login;
      const res = await axios.post('/api/github/repo', {
        name: cleanName,
        description: description.trim(),
        is_private: isPrivate,
        org: isOrgOwner ? owner : undefined,
      });

      const newRepo = res.data.repo;
      addRepo(newRepo);

      notifications.show({
        title: 'Tạo thành công',
        message: `Repository ${cleanName} đã được tạo!`,
        color: 'teal',
      });

      onClose();
    } catch (error: any) {
      const message = error.response?.data?.error || 'Có lỗi xảy ra khi tạo repository';
      notifications.show({
        title: 'Không thể tạo repository',
        message,
        color: 'red',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconBook size={18} color="#58a6ff" />
          <Text fw={600} fz={15} c="#f0f6fc">
            Tạo repository mới
          </Text>
        </Group>
      }
      centered
      radius="md"
      styles={{
        content: { backgroundColor: '#161b22', border: '1px solid #30363d' },
        header: { backgroundColor: '#161b22', borderBottom: '1px solid #30363d' },
      }}
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md" mt="xs">
          <Select
            label="Owner"
            data={ownerOptions}
            value={owner}
            onChange={(val) => setOwner(val || user?.login || '')}
            allowDeselect={false}
            styles={{
              input: { backgroundColor: '#0d1117', borderColor: '#30363d', color: '#c9d1d9' },
              dropdown: { backgroundColor: '#161b22', borderColor: '#30363d' },
              option: { color: '#c9d1d9' },
            }}
          />

          <TextInput
            label="Tên repository"
            placeholder="my-awesome-repo"
            required
            value={repoName}
            onChange={(e) => {
              setRepoName(e.currentTarget.value);
              if (nameError) setNameError(null);
            }}
            error={nameError}
            styles={{
              input: {
                backgroundColor: '#0d1117',
                borderColor: '#30363d',
                color: '#c9d1d9',
                fontFamily: 'monospace',
              },
            }}
          />

          <Textarea
            label="Mô tả (tùy chọn)"
            placeholder="Mô tả ngắn gọn về dự án..."
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
            styles={{
              input: { backgroundColor: '#0d1117', borderColor: '#30363d', color: '#c9d1d9' },
            }}
          />

          {/* Visibility */}
          <Box>
            <Text fz={13} fw={500} c="#c9d1d9" mb={6}>
              Chế độ hiển thị
            </Text>
            <Radio.Group
              value={isPrivate ? 'private' : 'public'}
              onChange={(val) => setIsPrivate(val === 'private')}
            >
              <Stack gap="xs">
                <Paper
                  p="xs"
                  bg={isPrivate ? 'rgba(56, 139, 253, 0.08)' : 'transparent'}
                  style={{
                    border: `1px solid ${isPrivate ? '#388bfd' : '#30363d'}`,
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                  onClick={() => setIsPrivate(true)}
                >
                  <Radio
                    value="private"
                    label={
                      <Group gap="xs">
                        <IconLock size={15} color="#e3b341" />
                        <Box>
                          <Text fz={13} fw={500} c="#e6edf3">
                            Private
                          </Text>
                          <Text fz={11} c="#8b949e">
                            Chỉ bạn và những người được cấp quyền mới có thể xem repo này.
                          </Text>
                        </Box>
                      </Group>
                    }
                  />
                </Paper>

                <Paper
                  p="xs"
                  bg={!isPrivate ? 'rgba(56, 139, 253, 0.08)' : 'transparent'}
                  style={{
                    border: `1px solid ${!isPrivate ? '#388bfd' : '#30363d'}`,
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                  onClick={() => setIsPrivate(false)}
                >
                  <Radio
                    value="public"
                    label={
                      <Group gap="xs">
                        <IconWorld size={15} color="#58a6ff" />
                        <Box>
                          <Text fz={13} fw={500} c="#e6edf3">
                            Public
                          </Text>
                          <Text fz={11} c="#8b949e">
                            Bất kỳ ai trên internet đều có thể xem repository này.
                          </Text>
                        </Box>
                      </Group>
                    }
                  />
                </Paper>
              </Stack>
            </Radio.Group>
          </Box>

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" color="gray" onClick={onClose} disabled={submitting} size="xs">
              Hủy
            </Button>
            <Button
              type="submit"
              loading={submitting}
              leftSection={<IconPlus size={14} />}
              size="xs"
              styles={{
                root: {
                  backgroundColor: '#238636',
                  '&:hover': { backgroundColor: '#2ea043' },
                },
              }}
            >
              Tạo repository
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
