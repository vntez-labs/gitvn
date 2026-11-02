'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Group,
  Text,
  Badge,
  Loader,
  Stack,
  Avatar,
  Paper,
  TextInput,
  Button,
  CopyButton,
  ActionIcon,
  Tooltip,
  Alert,
  Title,
} from '@mantine/core';
import {
  IconGitCommit,
  IconSearch,
  IconRefresh,
  IconCheck,
  IconCopy,
  IconArrowDown,
  IconInfoCircle,
  IconFileDiff,
  IconSparkles,
} from '@tabler/icons-react';
import { useDashboardStore } from '@/store/dashboard.store';
import { formatDateTime, formatRelativeTime } from '@/lib/time';
import { CommitDetailModal } from './CommitDetailModal';
import axios from 'axios';

interface CommitsTabProps {
  onCommitsLoaded?: (count: number) => void;
}

export function CommitsTab({ onCommitsLoaded }: CommitsTabProps) {
  const { selectedRepo, currentBranch } = useDashboardStore();
  const [commits, setCommits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSha, setSelectedSha] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchCommits = () => {
    if (!selectedRepo) return;
    setLoading(true);

    axios
      .get(
        `/api/github/commits?owner=${selectedRepo.owner.login}&repo=${selectedRepo.name}&branch=${encodeURIComponent(
          currentBranch
        )}`
      )
      .then((res) => {
        const data = res.data.commits || [];
        setCommits(data);
        if (onCommitsLoaded) {
          onCommitsLoaded(data.length);
        }
      })
      .catch((err) => console.error('Lỗi tải danh sách commits:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCommits();
  }, [selectedRepo?.id, currentBranch]);

  const filteredCommits = useMemo(() => {
    if (!searchQuery.trim()) return commits;
    const q = searchQuery.toLowerCase();
    return commits.filter((c) => {
      const msg = c.commit?.message?.toLowerCase() || '';
      const author = c.commit?.author?.name?.toLowerCase() || '';
      const login = c.author?.login?.toLowerCase() || '';
      const sha = c.sha?.toLowerCase() || '';
      return msg.includes(q) || author.includes(q) || login.includes(q) || sha.includes(q);
    });
  }, [commits, searchQuery]);

  if (!selectedRepo) return null;

  const pullCommand = `git pull origin ${currentBranch}`;
  const latestCommit = commits[0];

  return (
    <Box
      className="hide-scrollbar"
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px 32px',
        backgroundColor: '#0d1117',
        minHeight: 0,
      }}
    >
      <Box style={{ maxWidth: 960, margin: '0 auto', width: '100%' }}>
        {/* Hướng Dẫn Kéo Code (Git Sync Guide) */}
        <Paper
          p="md"
          mb="xl"
          radius="md"
          bg="rgba(56, 139, 253, 0.06)"
          style={{ border: '1px solid #388bfd44' }}
        >
          <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
            <Box style={{ flex: 1, minWidth: 280 }}>
              <Group gap="xs" mb={4}>
                <IconSparkles size={18} color="#58a6ff" />
                <Text fw={600} fz={14} c="#f0f6fc">
                  Đồng bộ mã nguồn (Sync & Pull)
                </Text>
                <Badge size="xs" variant="filled" color="blue">
                  Nhánh: {currentBranch}
                </Badge>
              </Group>
              <Text fz={12} c="#8b949e" mb={8} lh={1.5}>
                Khi đồng đội vừa push code mới hoặc bạn bắt đầu làm việc trong ngày, hãy chạy lệnh dưới đây trong Terminal ở máy tính để cập nhật code mới nhất về máy và tránh bị conflict (xung đột):
              </Text>

              <Group gap="xs">
                <Box
                  style={{
                    backgroundColor: '#0d1117',
                    border: '1px solid #30363d',
                    borderRadius: 6,
                    padding: '6px 12px',
                    fontFamily: 'monospace',
                    fontSize: 12,
                    color: '#79c0ff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <IconArrowDown size={14} color="#58a6ff" />
                  <span>{pullCommand}</span>
                </Box>
                <CopyButton value={pullCommand}>
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? 'Đã sao chép!' : 'Sao chép lệnh pull'} withArrow>
                      <Button
                        size="xs"
                        variant="light"
                        color={copied ? 'teal' : 'blue'}
                        onClick={copy}
                        leftSection={copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                      >
                        {copied ? 'Đã sao chép' : 'Copy lệnh pull'}
                      </Button>
                    </Tooltip>
                  )}
                </CopyButton>
              </Group>
            </Box>

            <Button
              size="xs"
              variant="subtle"
              color="gray"
              leftSection={<IconRefresh size={14} />}
              onClick={fetchCommits}
              loading={loading}
              styles={{
                root: {
                  backgroundColor: '#161b22',
                  border: '1px solid #30363d',
                  color: '#c9d1d9',
                  '&:hover': { backgroundColor: '#21262d' },
                },
              }}
            >
              Kiểm tra commit mới
            </Button>
          </Group>
        </Paper>

        {/* Thanh tìm kiếm & đếm */}
        <Group justify="space-between" mb="md">
          <Group gap="xs">
            <Title order={4} fz={14} c="#f0f6fc">
              Lịch sử Commits
            </Title>
            <Badge size="sm" variant="outline" color="gray">
              {filteredCommits.length} commits
            </Badge>
          </Group>

          <TextInput
            size="xs"
            placeholder="Tìm theo message, tác giả, SHA..."
            leftSection={<IconSearch size={14} color="#8b949e" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            styles={{
              input: {
                backgroundColor: '#161b22',
                borderColor: '#30363d',
                color: '#c9d1d9',
                width: 260,
              },
            }}
          />
        </Group>

        {/* Danh sách Commits */}
        {loading ? (
          <Box ta="center" py={60}>
            <Loader size="sm" color="gray" />
            <Text fz={12} c="#8b949e" mt="xs">
              Đang tải danh sách commit...
            </Text>
          </Box>
        ) : filteredCommits.length === 0 ? (
          <Paper p="xl" bg="#161b22" radius="md" style={{ border: '1px solid #30363d', textAlign: 'center' }}>
            <IconGitCommit size={36} color="#8b949e" style={{ margin: '0 auto 12px' }} />
            <Text fz={14} fw={600} c="#f0f6fc" mb={4}>
              Chưa có commit nào
            </Text>
            <Text fz={12} c="#8b949e">
              {searchQuery ? 'Không có commit nào khớp với từ khóa tìm kiếm.' : 'Hãy tạo commit đầu tiên và push lên nhé!'}
            </Text>
          </Paper>
        ) : (
          <Stack gap="xs" style={{ position: 'relative' }}>
            {filteredCommits.map((item, idx) => {
              const isLatest = idx === 0 && !searchQuery;
              const author = item.commit?.author;
              const githubAuthor = item.author;
              const message = item.commit?.message || '';
              const [title] = message.split('\n');
              const shaShort = item.sha?.slice(0, 7);

              return (
                <Paper
                  key={item.sha}
                  p="sm"
                  radius="md"
                  bg={isLatest ? '#161b22' : '#0d1117'}
                  style={{
                    border: `1px solid ${isLatest ? '#388bfd' : '#21262d'}`,
                    transition: 'all 0.15s ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#161b22';
                    e.currentTarget.style.borderColor = '#388bfd';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isLatest ? '#161b22' : '#0d1117';
                    e.currentTarget.style.borderColor = isLatest ? '#388bfd' : '#21262d';
                  }}
                  onClick={() => {
                    setSelectedSha(item.sha);
                    setModalOpen(true);
                  }}
                >
                  <Group justify="space-between" align="center" wrap="nowrap">
                    <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                      <Avatar
                        src={githubAuthor?.avatar_url}
                        alt={author?.name}
                        size={32}
                        radius="xl"
                        style={{ flexShrink: 0 }}
                      />

                      <Box style={{ flex: 1, minWidth: 0 }}>
                        <Group gap="xs" mb={2} wrap="nowrap">
                          <Text fz={13} fw={600} c="#f0f6fc" truncate>
                            {title}
                          </Text>
                          {isLatest && (
                            <Badge size="xs" variant="filled" color="green" radius="sm">
                              HEAD • Mới nhất
                            </Badge>
                          )}
                        </Group>

                        <Group gap={8} wrap="nowrap">
                          <Text fz={11} fw={500} c="#8b949e">
                            {author?.name || 'Vô danh'}
                          </Text>
                          <Text fz={11} c="#484f58">
                            •
                          </Text>
                          <Tooltip label={formatDateTime(author?.date)} withArrow>
                            <Text fz={11} c="#8b949e">
                              {formatRelativeTime(author?.date)}
                            </Text>
                          </Tooltip>
                        </Group>
                      </Box>
                    </Group>

                    {/* SHA Badge & Action */}
                    <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
                      {isLatest && (
                        <Tooltip label="Bạn nên pull commit này về máy nếu chưa có" withArrow>
                          <Badge size="xs" variant="light" color="teal">
                            Nên pull
                          </Badge>
                        </Tooltip>
                      )}

                      <Badge
                        size="sm"
                        variant="subtle"
                        color="gray"
                        ff="monospace"
                        styles={{ root: { backgroundColor: '#21262d', color: '#c9d1d9' } }}
                      >
                        {shaShort}
                      </Badge>

                      <CopyButton value={item.sha}>
                        {({ copied, copy }) => (
                          <Tooltip label={copied ? 'Đã sao chép SHA' : 'Sao chép SHA'} withArrow>
                            <ActionIcon
                              size="sm"
                              variant="subtle"
                              color={copied ? 'teal' : 'gray'}
                              onClick={(e) => {
                                e.stopPropagation();
                                copy();
                              }}
                            >
                              {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                            </ActionIcon>
                          </Tooltip>
                        )}
                      </CopyButton>

                      <Button
                        size="compact-xs"
                        variant="subtle"
                        color="blue"
                        rightSection={<IconFileDiff size={12} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSha(item.sha);
                          setModalOpen(true);
                        }}
                      >
                        Xem diff
                      </Button>
                    </Group>
                  </Group>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Box>

      {/* Modal xem chi tiết thay đổi commit */}
      <CommitDetailModal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        owner={selectedRepo.owner.login}
        repo={selectedRepo.name}
        sha={selectedSha}
        branch={currentBranch}
      />
    </Box>
  );
}
