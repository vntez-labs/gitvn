'use client';

import { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  Group,
  Text,
  Badge,
  Loader,
  Stack,
  Avatar,
  Paper,
  CopyButton,
  ActionIcon,
  Tooltip,
  Accordion,
  Divider,
} from '@mantine/core';
import {
  IconCheck,
  IconCopy,
  IconGitCommit,
  IconFileDiff,
  IconPlus,
  IconMinus,
  IconTerminal2,
  IconExternalLink,
} from '@tabler/icons-react';
import { formatDateTime, formatRelativeTime } from '@/lib/time';
import axios from 'axios';

interface CommitDetailModalProps {
  opened: boolean;
  onClose: () => void;
  owner: string;
  repo: string;
  sha: string | null;
  branch?: string;
}

export function CommitDetailModal({
  opened,
  onClose,
  owner,
  repo,
  sha,
  branch = 'main',
}: CommitDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [commitData, setCommitData] = useState<any>(null);

  useEffect(() => {
    if (!opened || !sha) {
      setCommitData(null);
      return;
    }

    setLoading(true);
    axios
      .get(`/api/github/commits/detail?owner=${owner}&repo=${repo}&ref=${sha}`)
      .then((res) => {
        setCommitData(res.data.commit);
      })
      .catch((err) => console.error('Lỗi tải chi tiết commit:', err))
      .finally(() => setLoading(false));
  }, [opened, sha, owner, repo]);

  const author = commitData?.commit?.author;
  const githubAuthor = commitData?.author;
  const message = commitData?.commit?.message || '';
  const [firstLine, ...restLines] = message.split('\n');
  const bodyText = restLines.join('\n').trim();
  const stats = commitData?.stats || { total: 0, additions: 0, deletions: 0 };
  const files: any[] = commitData?.files || [];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="xl"
      title={
        <Group gap="xs">
          <IconGitCommit size={18} color="#58a6ff" />
          <Text fw={600} fz={14} c="#f0f6fc">
            Chi tiết Commit
          </Text>
          {sha && (
            <Badge size="xs" variant="outline" color="blue" ff="monospace">
              {sha.slice(0, 7)}
            </Badge>
          )}
        </Group>
      }
      styles={{
        content: { backgroundColor: '#161b22', border: '1px solid #30363d' },
        header: { backgroundColor: '#161b22', borderBottom: '1px solid #30363d' },
      }}
    >
      {loading ? (
        <Box ta="center" py={50}>
          <Loader size="sm" color="gray" />
          <Text fz={12} c="#8b949e" mt="xs">
            Đang tải dữ liệu commit...
          </Text>
        </Box>
      ) : !commitData ? (
        <Text fz={13} c="#8b949e" ta="center" py={40}>
          Không tìm thấy thông tin commit.
        </Text>
      ) : (
        <Stack gap="md">
          {/* Header Commit Info */}
          <Paper p="md" bg="#0d1117" radius="md" style={{ border: '1px solid #30363d' }}>
            <Text fw={600} fz={15} c="#f0f6fc" mb={bodyText ? 6 : 10}>
              {firstLine}
            </Text>
            {bodyText && (
              <Text fz={12} c="#8b949e" style={{ whiteSpace: 'pre-wrap' }} mb={12}>
                {bodyText}
              </Text>
            )}

            <Divider color="#21262d" mb="sm" />

            <Group justify="space-between" wrap="wrap" gap="sm">
              <Group gap="xs">
                <Avatar
                  src={githubAuthor?.avatar_url}
                  alt={author?.name}
                  size={24}
                  radius="xl"
                />
                <Box>
                  <Text fz={12} fw={500} c="#c9d1d9">
                    {author?.name || 'Vô danh'}{' '}
                    {githubAuthor?.login && (
                      <span style={{ color: '#8b949e', fontWeight: 400 }}>
                        (@{githubAuthor.login})
                      </span>
                    )}
                  </Text>
                  <Text fz={11} c="#8b949e">
                    {formatRelativeTime(author?.date)} ({formatDateTime(author?.date)})
                  </Text>
                </Box>
              </Group>

              <Group gap="xs">
                <Badge size="sm" color="green" variant="light" leftSection={<IconPlus size={10} />}>
                  +{stats.additions} dòng
                </Badge>
                <Badge size="sm" color="red" variant="light" leftSection={<IconMinus size={10} />}>
                  -{stats.deletions} dòng
                </Badge>
                <CopyButton value={sha || ''}>
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? 'Đã sao chép SHA' : 'Sao chép SHA'} withArrow>
                      <ActionIcon size="sm" variant="subtle" color={copied ? 'teal' : 'gray'} onClick={copy}>
                        {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
              </Group>
            </Group>
          </Paper>

          {/* Lời khuyên cho người mới (Git CLI Commands) */}
          <Paper p="xs" px="md" bg="rgba(56, 139, 253, 0.08)" radius="md" style={{ border: '1px solid #388bfd33' }}>
            <Group justify="space-between" mb={4}>
              <Group gap={6}>
                <IconTerminal2 size={15} color="#58a6ff" />
                <Text fz={12} fw={600} c="#58a6ff">
                  Lệnh kéo hoặc xem commit này trên máy tính
                </Text>
              </Group>
            </Group>
            <Text fz={11} c="#8b949e" mb={8}>
              Để cập nhật code này về máy của bạn hoặc kiểm tra chi tiết trong terminal:
            </Text>
            <Group gap="xs" wrap="wrap">
              <Box
                style={{
                  backgroundColor: '#0d1117',
                  border: '1px solid #30363d',
                  borderRadius: 4,
                  padding: '3px 8px',
                  fontFamily: 'monospace',
                  fontSize: 11,
                  color: '#79c0ff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>git pull origin {branch}</span>
                <CopyButton value={`git pull origin ${branch}`}>
                  {({ copied, copy }) => (
                    <ActionIcon size="xs" variant="transparent" color={copied ? 'teal' : 'gray'} onClick={copy}>
                      {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                    </ActionIcon>
                  )}
                </CopyButton>
              </Box>

              {sha && (
                <Box
                  style={{
                    backgroundColor: '#0d1117',
                    border: '1px solid #30363d',
                    borderRadius: 4,
                    padding: '3px 8px',
                    fontFamily: 'monospace',
                    fontSize: 11,
                    color: '#79c0ff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span>git show {sha.slice(0, 7)}</span>
                  <CopyButton value={`git show ${sha.slice(0, 7)}`}>
                    {({ copied, copy }) => (
                      <ActionIcon size="xs" variant="transparent" color={copied ? 'teal' : 'gray'} onClick={copy}>
                        {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                      </ActionIcon>
                    )}
                  </CopyButton>
                </Box>
              )}
            </Group>
          </Paper>

          {/* Danh sách file thay đổi & Diff Viewer trực quan */}
          <Box>
            <Group justify="space-between" mb="xs">
              <Group gap="xs">
                <IconFileDiff size={15} color="#8b949e" />
                <Text fz={12} fw={600} c="#8b949e">
                  CÁC TỆP TIN THAY ĐỔI ({files.length})
                </Text>
              </Group>
            </Group>

            <Stack gap="xs">
              {files.map((file, idx) => {
                const statusColor =
                  file.status === 'added' ? 'green' : file.status === 'removed' ? 'red' : 'yellow';

                return (
                  <Paper
                    key={idx}
                    radius="md"
                    style={{ border: '1px solid #30363d', overflow: 'hidden', backgroundColor: '#0d1117' }}
                  >
                    {/* File Header */}
                    <Group
                      justify="space-between"
                      px="md"
                      py={8}
                      style={{ backgroundColor: '#161b22', borderBottom: '1px solid #21262d' }}
                    >
                      <Group gap="xs">
                        <Badge size="xs" color={statusColor} variant="light">
                          {file.status}
                        </Badge>
                        <Text fz={12} ff="monospace" fw={500} c="#e6edf3">
                          {file.filename}
                        </Text>
                      </Group>

                      <Group gap={6}>
                        {file.additions > 0 && (
                          <Text fz={11} c="#7ee787" ff="monospace">
                            +{file.additions}
                          </Text>
                        )}
                        {file.deletions > 0 && (
                          <Text fz={11} c="#f85149" ff="monospace">
                            -{file.deletions}
                          </Text>
                        )}
                      </Group>
                    </Group>

                    {/* Patch / Code Diff */}
                    {file.patch ? (
                      <Box
                        p="xs"
                        style={{
                          maxHeight: 280,
                          overflowY: 'auto',
                          fontFamily: 'monospace',
                          fontSize: 11,
                          lineHeight: 1.6,
                        }}
                      >
                        {file.patch.split('\n').map((line: string, lineIdx: number) => {
                          const isAdd = line.startsWith('+') && !line.startsWith('+++');
                          const isDel = line.startsWith('-') && !line.startsWith('---');
                          const isHunk = line.startsWith('@@');

                          let bg = 'transparent';
                          let color = '#c9d1d9';
                          if (isAdd) {
                            bg = 'rgba(46, 160, 67, 0.15)';
                            color = '#7ee787';
                          } else if (isDel) {
                            bg = 'rgba(248, 81, 73, 0.15)';
                            color = '#f85149';
                          } else if (isHunk) {
                            color = '#79c0ff';
                          }

                          return (
                            <Box
                              key={lineIdx}
                              px={8}
                              style={{
                                backgroundColor: bg,
                                color: color,
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-all',
                                borderRadius: 2,
                              }}
                            >
                              {line}
                            </Box>
                          );
                        })}
                      </Box>
                    ) : (
                      <Box p="xs" ta="center">
                        <Text fz={11} c="#8b949e">
                          Tệp tin nhị phân hoặc không có diff văn bản.
                        </Text>
                      </Box>
                    )}
                  </Paper>
                );
              })}
            </Stack>
          </Box>
        </Stack>
      )}
    </Modal>
  );
}
