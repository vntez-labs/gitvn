'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Group,
  Text,
  Badge,
  Button,
  Loader,
  Stack,
  Tabs,
  Paper,
  Avatar,
  SegmentedControl,
  Alert,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconGitPullRequest,
  IconGitMerge,
  IconGitCommit,
  IconCheck,
  IconAlertTriangle,
  IconExternalLink,
  IconMessageCircle,
  IconFileDiff,
  IconCircleX,
} from '@tabler/icons-react';
import { useDashboardStore } from '@/store/dashboard.store';
import { DiffViewer } from './DiffViewer';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import axios from 'axios';

interface PullDetailViewProps {
  pullNumber: number;
  onBack: () => void;
  onMergedSuccess: () => void;
}

export function PullDetailView({ pullNumber, onBack, onMergedSuccess }: PullDetailViewProps) {
  const { selectedRepo } = useDashboardStore();
  const [data, setData] = useState<{ pull: any; files: any[]; commits: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'conversation' | 'commits' | 'files'>('conversation');

  // Merge state
  const [mergeMethod, setMergeMethod] = useState<'merge' | 'squash' | 'rebase'>('merge');
  const [merging, setMerging] = useState(false);
  const [mergeError, setMergeError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedRepo) return;
    setLoading(true);
    axios
      .get(`/api/github/pulls/detail?owner=${selectedRepo.owner.login}&repo=${selectedRepo.name}&pull_number=${pullNumber}`)
      .then((res) => setData(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedRepo, pullNumber]);

  const handleMerge = async () => {
    if (!selectedRepo || !data) return;
    setMerging(true);
    setMergeError(null);

    try {
      await axios.put('/api/github/pulls/merge', {
        owner: selectedRepo.owner.login,
        repo: selectedRepo.name,
        pullNumber,
        mergeMethod,
      });

      onMergedSuccess();
      onBack();
    } catch (err: any) {
      setMergeError(err.response?.data?.error || 'Merge thất bại');
    } finally {
      setMerging(false);
    }
  };

  if (loading || !data) {
    return (
      <Group justify="center" mt={100}>
        <Loader size="md" color="gray" />
      </Group>
    );
  }

  const { pull, files, commits } = data;
  const isMerged = !!pull.merged_at;
  const isOpen = pull.state === 'open';
  const isClean = pull.mergeable === true;
  const hasConflict = pull.mergeable === false;

  const totalAdditions = files.reduce((acc, f) => acc + (f.additions || 0), 0);
  const totalDeletions = files.reduce((acc, f) => acc + (f.deletions || 0), 0);

  return (
    <Box className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '24px', minHeight: 0 }}>
      <Box style={{ maxWidth: 940, margin: '0 auto' }}>

        {/* NÚT QUAY LẠI */}
        <Button
          variant="subtle"
          color="gray"
          size="compact-xs"
          leftSection={<IconArrowLeft size={14} />}
          onClick={onBack}
          mb="md"
          styles={{ root: { color: '#8b949e', '&:hover': { color: '#f0f6fc' } } }}
        >
          Quay lại danh sách PR
        </Button>

        {/* 1. HEADER CHUẨN GITHUB (FIX HOÀN TOÀN LỖI LẶP CHỮ & HYDRATION) */}
        <Box mb="lg">
          <Group justify="space-between" align="flex-start" mb={8}>
            <Text fz={22} fw={700} c="#f0f6fc" lh={1.3}>
              {pull.title} <span style={{ color: '#8b949e', fontWeight: 400 }}>#{pull.number}</span>
            </Text>

            <Button
              size="compact-xs"
              variant="light"
              color="gray"
              component="a"
              href={pull.html_url}
              target="_blank"
              rightSection={<IconExternalLink size={12} />}
            >
              Xem trên GitHub
            </Button>
          </Group>

          {/* Subtitle mô tả ngắn gọn */}
          <Box style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Badge
              size="md"
              leftSection={
                isMerged ? <IconGitMerge size={14} /> : isOpen ? <IconGitPullRequest size={14} /> : <IconCircleX size={14} />
              }
              color={isMerged ? 'violet' : isOpen ? 'green' : 'red'}
              variant="filled"
              radius="xl"
              styles={{ root: { textTransform: 'capitalize' } }}
            >
              {isMerged ? 'Merged' : isOpen ? 'Open' : 'Closed'}
            </Badge>

            <Text component="div" fz={13} c="#8b949e" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ color: '#c9d1d9', fontWeight: 600 }}>{pull.user?.login}</span>
              <span>{isMerged ? 'đã merge' : 'muốn merge'}</span>
              <span style={{ color: '#f0f6fc', fontWeight: 600 }}>{commits.length} commits</span>
              <span>vào</span>
              <Badge component="span" size="xs" variant="outline" color="blue" ff="monospace" px={6}>
                {pull.base.ref}
              </Badge>
              <span>từ</span>
              <Badge component="span" size="xs" variant="outline" color="gray" ff="monospace" px={6}>
                {pull.head.ref}
              </Badge>
            </Text>
          </Box>
        </Box>

        {/* 2. TABS: CONVERSATION / COMMITS / FILES CHANGED */}
        <Tabs
          value={activeTab}
          onChange={(val) => setActiveTab(val as any)}
          styles={{
            root: { marginBottom: 20 },
            list: { borderBottom: '1px solid #30363d' },
            tab: {
              color: '#8b949e',
              fontSize: 13,
              fontWeight: 500,
              padding: '8px 14px',
              '&[data-active]': { color: '#f0f6fc', borderBottomColor: '#f78166', fontWeight: 600 },
            },
          }}
        >
          <Tabs.List>
            <Tabs.Tab value="conversation" leftSection={<IconMessageCircle size={15} />}>
              Conversation
            </Tabs.Tab>

            <Tabs.Tab
              value="commits"
              leftSection={<IconGitCommit size={15} />}
              rightSection={
                <Badge size="xs" variant="filled" color="dark" c="#c9d1d9" circle>
                  {commits.length}
                </Badge>
              }
            >
              Commits
            </Tabs.Tab>

            <Tabs.Tab
              value="files"
              leftSection={<IconFileDiff size={15} />}
              rightSection={
                <Group gap={4} wrap="nowrap">
                  <Badge size="xs" variant="filled" color="dark" c="#c9d1d9" circle>
                    {files.length}
                  </Badge>
                  <Text fz={11} c="#3fb950" fw={600}>+{totalAdditions}</Text>
                  <Text fz={11} c="#f85149" fw={600}>-{totalDeletions}</Text>
                </Group>
              }
            >
              Files changed
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>

        {/* 3. NỘI DUNG TỪNG TAB */}

        {/* TAB 1: CONVERSATION */}
        {activeTab === 'conversation' && (
          <Stack gap="md">
            {/* Hộp mô tả PR (Description ban đầu) */}
            <Paper radius="md" style={{ border: '1px solid #30363d', backgroundColor: '#0d1117', overflow: 'hidden' }}>
              <Box px="md" py={8} style={{ backgroundColor: '#161b22', borderBottom: '1px solid #30363d' }}>
                <Group gap="xs">
                  <Avatar src={pull.user?.avatar_url} size={22} radius="xl" />
                  <Text fz={12} fw={600} c="#f0f6fc">{pull.user?.login}</Text>
                  <Text fz={11} c="#8b949e">đã tạo vào {new Date(pull.created_at).toLocaleDateString()}</Text>
                </Group>
              </Box>
              <Box p="md" c="#c9d1d9" style={{ fontSize: 14 }}>
                {pull.body ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{pull.body}</ReactMarkdown>
                ) : (
                  <Text fz="xs" c="#8b949e" fs="italic">No description provided.</Text>
                )}
              </Box>
            </Paper>

            {/* Commits Timeline ngắn gọn */}
            <Box style={{ borderLeft: '2px solid #30363d', marginLeft: 16, paddingLeft: 20 }}>
              <Text fz={12} fw={600} c="#8b949e" mb="xs">
                {commits.length} commits trong PR này
              </Text>
              <Stack gap={6}>
                {commits.map((c) => (
                  <Group key={c.sha} justify="space-between" py={4} wrap="nowrap">
                    <Group gap="xs" wrap="nowrap" style={{ overflow: 'hidden' }}>
                      <IconGitCommit size={14} color="#8b949e" style={{ flexShrink: 0 }} />
                      <Text fz={12} c="#f0f6fc" truncate>
                        {c.commit?.message?.split('\n')[0]}
                      </Text>
                    </Group>
                    <Text fz={11} ff="monospace" c="#58a6ff" style={{ flexShrink: 0 }}>
                      {c.sha.slice(0, 7)}
                    </Text>
                  </Group>
                ))}
              </Stack>
            </Box>

            {/* MERGE BOX TRẠNG THÁI */}
            {isMerged ? (
              /* ĐÃ MERGE: Box tím GitHub */
              <Paper p="md" radius="md" style={{ border: '1px solid #8957e5', backgroundColor: 'rgba(137, 87, 229, 0.1)' }}>
                <Group align="flex-start" wrap="nowrap">
                  <IconGitMerge size={22} color="#a371f7" style={{ flexShrink: 0, marginTop: 2 }} />
                  <Box>
                    <Text fz="sm" fw={600} c="#d2a8ff">
                      Pull request successfully merged and closed
                    </Text>
                    <Text fz="xs" c="#8b949e" mt={2}>
                      Nhánh <span style={{ fontFamily: 'monospace', color: '#c9d1d9' }}>{pull.head.ref}</span> đã được hợp nhất hoàn tất vào <span style={{ fontFamily: 'monospace', color: '#58a6ff' }}>{pull.base.ref}</span>.
                    </Text>
                  </Box>
                </Group>
              </Paper>
            ) : !isOpen ? (
              /* ĐÃ ĐÓNG NHƯNG KHÔNG MERGE: Box xám/đỏ */
              <Paper p="md" radius="md" style={{ border: '1px solid #da3633', backgroundColor: 'rgba(218, 54, 51, 0.1)' }}>
                <Group align="flex-start" wrap="nowrap">
                  <IconCircleX size={22} color="#f85149" style={{ flexShrink: 0, marginTop: 2 }} />
                  <Box>
                    <Text fz="sm" fw={600} c="#f85149">This pull request was closed</Text>
                    <Text fz="xs" c="#8b949e" mt={2}>Pull request này đã bị đóng mà không được merge.</Text>
                  </Box>
                </Group>
              </Paper>
            ) : (
              /* ĐANG MỞ (OPEN): Sẵn sàng Merge hoặc Conflict */
              <Paper p="md" radius="md" style={{ border: '1px solid #30363d', backgroundColor: '#161b22' }}>
                {mergeError && (
                  <Alert color="red" title="Merge lỗi" mb="md" withCloseButton onClose={() => setMergeError(null)}>
                    {mergeError}
                  </Alert>
                )}

                {hasConflict ? (
                  <Group align="flex-start" wrap="nowrap">
                    <IconAlertTriangle size={20} color="#f85149" style={{ flexShrink: 0, marginTop: 2 }} />
                    <Box style={{ flex: 1 }}>
                      <Text fz="sm" fw={600} c="#f85149">This branch has conflicts that must be resolved</Text>
                      <Text fz="xs" c="#8b949e" mt={2}>
                        Xung đột mã nguồn giữa 2 nhánh. Bạn cần giải quyết conflict trên GitHub trước khi merge.
                      </Text>
                      <Button size="xs" variant="light" color="red" mt="xs" component="a" href={pull.html_url} target="_blank">
                        Resolve conflicts on GitHub ↗
                      </Button>
                    </Box>
                  </Group>
                ) : isClean ? (
                  <Stack gap="sm">
                    <Group align="flex-start" wrap="nowrap">
                      <IconCheck size={20} color="#3fb950" style={{ flexShrink: 0, marginTop: 2 }} />
                      <Box>
                        <Text fz="sm" fw={600} c="#3fb950">This branch has no conflicts with the base branch</Text>
                        <Text fz="xs" c="#8b949e" mt={2}>
                          Nhánh sạch, sẵn sàng hợp nhất trực tiếp từ GitVN Workspace.
                        </Text>
                      </Box>
                    </Group>

                    <Group justify="space-between" mt="xs" wrap="nowrap">
                      <SegmentedControl
                        value={mergeMethod}
                        onChange={(v) => setMergeMethod(v as any)}
                        size="xs"
                        data={[
                          { label: 'Create merge commit', value: 'merge' },
                          { label: 'Squash and merge', value: 'squash' },
                          { label: 'Rebase and merge', value: 'rebase' },
                        ]}
                        styles={{
                          root: { backgroundColor: '#0d1117' },
                          indicator: { backgroundColor: '#21262d' },
                          label: { color: '#c9d1d9' },
                        }}
                      />

                      <Button
                        size="xs"
                        color="green"
                        loading={merging}
                        onClick={handleMerge}
                        styles={{ root: { backgroundColor: '#238636', '&:hover': { backgroundColor: '#2ea043' } } }}
                      >
                        Merge pull request
                      </Button>
                    </Group>
                  </Stack>
                ) : (
                  <Text fz="xs" c="#8b949e">Đang kiểm tra khả năng merge từ GitHub...</Text>
                )}
              </Paper>
            )}
          </Stack>
        )}

        {/* TAB 2: COMMITS CHI TIẾT */}
        {activeTab === 'commits' && (
          <Stack gap={1} style={{ border: '1px solid #30363d', borderRadius: 6, overflow: 'hidden' }}>
            {commits.map((c) => (
              <Box
                key={c.sha}
                p="sm"
                style={{
                  backgroundColor: '#0d1117',
                  borderBottom: '1px solid #21262d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <Group gap="xs" wrap="nowrap" style={{ overflow: 'hidden' }}>
                  <Avatar src={c.author?.avatar_url} size={22} radius="xl" />
                  <Box style={{ overflow: 'hidden' }}>
                    <Text fz="sm" fw={600} c="#f0f6fc" truncate>
                      {c.commit?.message?.split('\n')[0]}
                    </Text>
                    <Text fz={11} c="#8b949e">
                      <span style={{ color: '#c9d1d9' }}>{c.commit?.author?.name || c.author?.login}</span> committed vào{' '}
                      {new Date(c.commit?.author?.date).toLocaleDateString()}
                    </Text>
                  </Box>
                </Group>

                <Button
                  component="a"
                  href={c.html_url}
                  target="_blank"
                  size="compact-xs"
                  variant="subtle"
                  color="gray"
                  ff="monospace"
                  styles={{ root: { backgroundColor: 'rgba(255,255,255,0.05)', color: '#58a6ff' } }}
                >
                  {c.sha.slice(0, 7)} ↗
                </Button>
              </Box>
            ))}
          </Stack>
        )}

        {/* TAB 3: FILES CHANGED (DIFFS) */}
        {activeTab === 'files' && (
          <Stack gap="md">
            {files.map((file) => (
              <DiffViewer key={file.filename} file={file} />
            ))}
          </Stack>
        )}

      </Box>
    </Box>
  );
}
