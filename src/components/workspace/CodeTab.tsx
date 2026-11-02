'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Group,
  Text,
  Badge,
  Loader,
  CopyButton,
  Tooltip,
  ActionIcon,
  Button,
  Avatar,
} from '@mantine/core';
import {
  IconCheck,
  IconCopy,
  IconGitCommit,
  IconArrowDown,
  IconFileCode,
} from '@tabler/icons-react';
import { FileTree } from '@/components/FileTree';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import { CodeViewer } from '@/components/CodeViewer';
import { EmptyRepoView } from '@/components/workspace/EmptyRepoView';
import { CommitDetailModal } from '@/components/workspace/CommitDetailModal';
import { WorkspaceTab } from '@/components/workspace/WorkspaceHeader';
import { useDashboardStore } from '@/store/dashboard.store';
import { formatRelativeTime } from '@/lib/time';
import { getIconForFile } from 'vscode-icons-js';
import { ICON_BASE_URL } from './constants';
import axios from 'axios';

interface CodeTabProps {
  onNavigateTab?: (tab: WorkspaceTab) => void;
}

export function CodeTab({ onNavigateTab }: CodeTabProps) {
  const {
    tree,
    loadingTree,
    activeFile,
    selectFile,
    fileContent,
    loadingContent,
    selectedRepo,
    currentBranch,
  } = useDashboardStore();

  const [lastFileCommit, setLastFileCommit] = useState<any>(null);
  const [loadingCommit, setLoadingCommit] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSha, setSelectedSha] = useState<string | null>(null);

  // GitLens file blame: Lấy commit mới nhất của file đang mở
  useEffect(() => {
    if (!selectedRepo || !activeFile) {
      setLastFileCommit(null);
      return;
    }

    setLoadingCommit(true);
    axios
      .get(
        `/api/github/commits?owner=${selectedRepo.owner.login}&repo=${selectedRepo.name}&branch=${encodeURIComponent(
          currentBranch
        )}&path=${encodeURIComponent(activeFile)}&per_page=1`
      )
      .then((res) => {
        const commits = res.data.commits || [];
        setLastFileCommit(commits.length > 0 ? commits[0] : null);
      })
      .catch(() => setLastFileCommit(null))
      .finally(() => setLoadingCommit(false));
  }, [selectedRepo?.id, currentBranch, activeFile]);

  if (loadingTree) {
    return (
      <Box
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0d1117',
        }}
      >
        <Loader size="sm" color="gray" />
      </Box>
    );
  }

  if (tree.length === 0 && selectedRepo) {
    return <EmptyRepoView repo={selectedRepo} />;
  }

  const isMarkdown = activeFile?.toLowerCase().endsWith('.md');
  const lineCount = fileContent ? fileContent.split('\n').length : 0;
  const activeFileName = activeFile?.split('/').pop() || '';
  const activeFileIcon = activeFile ? getIconForFile(activeFileName) : 'default_file.svg';

  return (
    <Box
      style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '260px 1fr',
        overflow: 'hidden',
        minHeight: 0,
      }}
    >
      {/* File Explorer */}
      <Box
        style={{
          borderRight: '1px solid #21262d',
          backgroundColor: '#010409',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        <Group
          justify="space-between"
          px="md"
          py={8}
          style={{ borderBottom: '1px solid #21262d', flexShrink: 0 }}
        >
          <Text fz={10} fw={700} c="#8b949e" style={{ letterSpacing: '0.08em' }}>
            FILES
          </Text>
          <Badge size="xs" variant="transparent" c="#8b949e" p={0}>
            {tree.filter((t) => t.type === 'blob').length} files
          </Badge>
        </Group>

        <Box className="hide-scrollbar" style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          {loadingTree ? (
            <Group justify="center" mt="xl">
              <Loader size="xs" color="gray" />
            </Group>
          ) : (
            <FileTree data={tree} activePath={activeFile} onFileClick={selectFile} />
          )}
        </Box>
      </Box>

      {/* Editor Content */}
      <Box
        style={{
          backgroundColor: '#0d1117',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        {activeFile && (
          <>
            {/* Header file chính */}
            <Box
              px="md"
              py={6}
              style={{
                borderBottom: '1px solid #21262d',
                backgroundColor: '#161b22',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
              }}
            >
              <Group gap="xs">
                <img
                  src={`${ICON_BASE_URL}/${activeFileIcon}`}
                  alt=""
                  width={14}
                  height={14}
                  style={{ display: 'block' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `${ICON_BASE_URL}/default_file.svg`;
                  }}
                />
                <Text fz={12} c="#e6edf3" fw={500} ff="monospace">
                  {activeFile}
                </Text>
                {lineCount > 0 && !isMarkdown && (
                  <Badge size="xs" variant="subtle" color="gray">
                    {lineCount} lines
                  </Badge>
                )}
              </Group>

              <CopyButton value={fileContent}>
                {({ copied, copy }) => (
                  <Tooltip label={copied ? 'Đã sao chép' : 'Sao chép mã'} withArrow>
                    <ActionIcon size="sm" variant="subtle" color={copied ? 'teal' : 'gray'} onClick={copy}>
                      {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                    </ActionIcon>
                  </Tooltip>
                )}
              </CopyButton>
            </Box>

            {/* GitLens Blame Bar (Commit gần nhất của file) */}
            {lastFileCommit && (
              <Box
                px="md"
                py={4}
                style={{
                  borderBottom: '1px solid #21262d',
                  backgroundColor: '#11161d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexShrink: 0,
                  fontSize: 11,
                }}
              >
                <Group gap={6} wrap="nowrap" style={{ overflow: 'hidden', flex: 1 }}>
                  <Avatar
                    src={lastFileCommit.author?.avatar_url}
                    alt={lastFileCommit.commit?.author?.name}
                    size={16}
                    radius="xl"
                  />
                  <Text fz={11} c="#8b949e" truncate>
                    <span style={{ color: '#c9d1d9', fontWeight: 500 }}>
                      {lastFileCommit.commit?.author?.name || 'Ai đó'}
                    </span>
                    {' • '}
                    {formatRelativeTime(lastFileCommit.commit?.author?.date)}
                    {': "'}
                    <span style={{ color: '#e6edf3' }}>
                      {lastFileCommit.commit?.message?.split('\n')[0]}
                    </span>
                    {'"'}
                  </Text>
                  <Badge size="xs" variant="outline" color="blue" ff="monospace" style={{ flexShrink: 0 }}>
                    {lastFileCommit.sha?.slice(0, 7)}
                  </Badge>
                </Group>

                <Button
                  size="compact-xs"
                  variant="subtle"
                  color="blue"
                  onClick={() => {
                    setSelectedSha(lastFileCommit.sha);
                    setModalOpen(true);
                  }}
                  style={{ flexShrink: 0, fontSize: 11 }}
                >
                  Xem commit
                </Button>
              </Box>
            )}

            {/* Git Sync / Pull Reminder cho người mới */}
            <Box
              px="md"
              py={4}
              style={{
                borderBottom: '1px solid #21262d',
                backgroundColor: 'rgba(56, 139, 253, 0.04)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
              }}
            >
              <Group gap={6} wrap="nowrap">
                <IconArrowDown size={12} color="#58a6ff" />
                <Text fz={11} c="#8b949e">
                  Cần lấy code mới nhất về máy tính? Chạy{' '}
                  <span style={{ fontFamily: 'monospace', color: '#79c0ff' }}>
                    git pull origin {currentBranch}
                  </span>
                </Text>
              </Group>

              <CopyButton value={`git pull origin ${currentBranch}`}>
                {({ copied, copy }) => (
                  <Button
                    size="compact-xs"
                    variant="transparent"
                    color={copied ? 'teal' : 'gray'}
                    onClick={copy}
                    leftSection={copied ? <IconCheck size={11} /> : <IconCopy size={11} />}
                    style={{ fontSize: 11 }}
                  >
                    {copied ? 'Đã sao chép' : 'Copy lệnh pull'}
                  </Button>
                )}
              </CopyButton>
            </Box>
          </>
        )}

        {/* Nội dung file hoặc màn hình chờ */}
        <Box className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {loadingContent ? (
            <Group justify="center" mt={100}>
              <Loader size="sm" color="gray" />
            </Group>
          ) : activeFile ? (
            isMarkdown ? (
              <Box p="xl" style={{ maxWidth: 880, margin: '0 auto', color: '#c9d1d9' }}>
                <MarkdownViewer content={fileContent} />
              </Box>
            ) : (
              <CodeViewer content={fileContent} filename={activeFile} />
            )
          ) : (
            <Box ta="center" mt={120} px="md">
              <IconFileCode size={38} color="#8b949e" style={{ margin: '0 auto 10px' }} />
              <Text fz="sm" fw={500} c="#c9d1d9" mb={4}>
                Chọn một file từ Explorer để xem mã nguồn
              </Text>
              <Text fz="xs" c="#8b949e" mb="md">
                Hoặc xem lịch sử các lần thay đổi code của repository.
              </Text>
              {onNavigateTab && (
                <Button
                  size="xs"
                  variant="light"
                  color="blue"
                  leftSection={<IconGitCommit size={14} />}
                  onClick={() => onNavigateTab('commits')}
                >
                  Xem lịch sử Commits ({currentBranch})
                </Button>
              )}
            </Box>
          )}
        </Box>
      </Box>

      {/* Modal chi tiết commit */}
      {selectedRepo && (
        <CommitDetailModal
          opened={modalOpen}
          onClose={() => setModalOpen(false)}
          owner={selectedRepo.owner.login}
          repo={selectedRepo.name}
          sha={selectedSha}
          branch={currentBranch}
        />
      )}
    </Box>
  );
}
