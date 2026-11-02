'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Group,
  Text,
  Button,
  Badge,
  ActionIcon,
  Tooltip,
  CopyButton,
  Paper,
} from '@mantine/core';
import {
  IconGitPullRequest,
  IconGitMerge,
  IconExternalLink,
  IconArrowDown,
  IconCheck,
  IconCopy,
  IconX,
  IconGitBranch,
} from '@tabler/icons-react';
import { useDashboardStore } from '@/store/dashboard.store';
import { WorkspaceTab } from './WorkspaceHeader';
import axios from 'axios';

interface BranchActionBannerProps {
  onTabChange?: (tab: WorkspaceTab) => void;
}

export function BranchActionBanner({ onTabChange }: BranchActionBannerProps) {
  const { selectedRepo, currentBranch } = useDashboardStore();

  const [baseBranch, setBaseBranch] = useState<string>('main');
  const [compareData, setCompareData] = useState<{
    ahead_by: number;
    behind_by: number;
    status: string;
    compare_url: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Reset dismissed khi đổi branch hoặc đổi repo
  useEffect(() => {
    setDismissed(false);
  }, [selectedRepo?.id, currentBranch]);

  useEffect(() => {
    if (!selectedRepo) return;

    let isMounted = true;
    setLoading(true);

    // 1. Lấy danh sách branches để xác định baseBranch (ưu tiên 'develop', nếu không có thì lấy default_branch)
    axios
      .get(`/api/github/branches?owner=${selectedRepo.owner.login}&repo=${selectedRepo.name}`)
      .then((res) => {
        if (!isMounted) return;
        const branches: { name: string }[] = res.data.branches || [];
        const hasDevelop = branches.some((b) => b.name.toLowerCase() === 'develop');
        const defaultBranch = (selectedRepo as any).default_branch || 'main';
        const targetBase = hasDevelop ? 'develop' : defaultBranch;
        setBaseBranch(targetBase);

        // 2. Nếu currentBranch khác baseBranch, gọi compare
        if (currentBranch.toLowerCase() !== targetBase.toLowerCase()) {
          return axios.get(
            `/api/github/compare?owner=${selectedRepo.owner.login}&repo=${selectedRepo.name}&base=${encodeURIComponent(
              targetBase
            )}&head=${encodeURIComponent(currentBranch)}`
          );
        } else {
          setCompareData(null);
          return null;
        }
      })
      .then((res) => {
        if (!isMounted || !res) return;
        setCompareData(res.data);
      })
      .catch((err) => {
        console.error('Lỗi compare branch:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedRepo?.id, currentBranch]);

  if (!selectedRepo || dismissed) return null;

  const isCurrentBranchBase = currentBranch.toLowerCase() === baseBranch.toLowerCase();
  const aheadCount = compareData?.ahead_by || 0;
  const behindCount = compareData?.behind_by || 0;

  const compareUrl =
    compareData?.compare_url ||
    `https://github.com/${selectedRepo.owner.login}/${selectedRepo.name}/compare/${encodeURIComponent(
      baseBranch
    )}...${encodeURIComponent(currentBranch)}?expand=1`;

  // TRƯỜNG HỢP 1: Đang ở branch tính năng và CÓ COMMIT MỚI CẦN MERGE VÀO DEVELOP / MAIN
  if (!isCurrentBranchBase && (aheadCount > 0 || compareData?.status === 'ahead' || compareData?.status === 'diverged')) {
    return (
      <Paper
        px="lg"
        py={9}
        radius={0}
        style={{
          backgroundColor: 'rgba(35, 134, 54, 0.12)',
          borderBottom: '1px solid rgba(46, 160, 67, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          flexShrink: 0,
        }}
      >
        <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 260 }}>
          <Box
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              backgroundColor: '#238636',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconGitPullRequest size={16} color="#ffffff" />
          </Box>

          <Box>
            <Group gap="xs" wrap="wrap">
              <Text fz={13} fw={600} c="#f0f6fc">
                Nhánh <span style={{ color: '#58a6ff', fontFamily: 'monospace' }}>{currentBranch}</span> có{' '}
                <span style={{ color: '#7ee787' }}>{aheadCount} commit mới</span> cần merge vào{' '}
                <span style={{ color: '#58a6ff', fontFamily: 'monospace' }}>{baseBranch}</span>
              </Text>
              <Badge size="xs" color="green" variant="outline">
                Sẵn sàng tạo PR
              </Badge>
            </Group>
            <Text fz={11} c="#8b949e">
              Các thay đổi trên nhánh này chưa được đưa vào nhánh chính. Hãy tạo Pull Request để review và merge.
            </Text>
          </Box>
        </Group>

        <Group gap="xs" wrap="nowrap">
          {behindCount > 0 && (
            <Tooltip label={`Nhánh của bạn đang thiếu ${behindCount} commit từ ${baseBranch}`} withArrow>
              <Badge size="sm" color="yellow" variant="light">
                Chậm {behindCount} commit so với {baseBranch}
              </Badge>
            </Tooltip>
          )}

          <Button
            size="xs"
            variant="filled"
            component="a"
            href={compareUrl}
            target="_blank"
            leftSection={<IconGitMerge size={14} />}
            rightSection={<IconExternalLink size={12} />}
            styles={{
              root: {
                backgroundColor: '#238636',
                color: '#ffffff',
                fontWeight: 600,
                '&:hover': { backgroundColor: '#2ea043' },
              },
            }}
          >
            Qua GitHub Merge / Tạo Pull Request
          </Button>

          {onTabChange && (
            <Button
              size="xs"
              variant="subtle"
              color="gray"
              onClick={() => onTabChange('pulls')}
              styles={{
                root: { color: '#c9d1d9', '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' } },
              }}
            >
              Xem Pull requests
            </Button>
          )}

          <Tooltip label="Ẩn thông báo này" withArrow>
            <ActionIcon size="sm" variant="subtle" color="gray" onClick={() => setDismissed(true)}>
              <IconX size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Paper>
    );
  }

  // TRƯỜNG HỢP 2: Nhánh này đang bị CHẬM HƠN BASE BRANCH (CẦN PULL HOẶC MERGE VỀ MÁY)
  if (!isCurrentBranchBase && behindCount > 0) {
    const pullBaseCmd = `git pull origin ${baseBranch}`;

    return (
      <Paper
        px="lg"
        py={8}
        radius={0}
        style={{
          backgroundColor: 'rgba(56, 139, 253, 0.09)',
          borderBottom: '1px solid rgba(56, 139, 253, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          flexShrink: 0,
        }}
      >
        <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 260 }}>
          <Box
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              backgroundColor: '#1f6feb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconArrowDown size={15} color="#ffffff" />
          </Box>

          <Box>
            <Text fz={13} fw={600} c="#f0f6fc">
              Nhánh <span style={{ color: '#58a6ff', fontFamily: 'monospace' }}>{currentBranch}</span> đang chậm hơn{' '}
              <span style={{ color: '#58a6ff', fontFamily: 'monospace' }}>{baseBranch}</span> {behindCount} commit
            </Text>
            <Text fz={11} c="#8b949e">
              Nhánh chính đã có code mới từ các thành viên khác. Bạn nên pull code từ {baseBranch} về máy để tránh xung đột:
            </Text>
          </Box>
        </Group>

        <Group gap="xs" wrap="nowrap">
          <Box
            style={{
              backgroundColor: '#0d1117',
              border: '1px solid #30363d',
              borderRadius: 6,
              padding: '4px 10px',
              fontFamily: 'monospace',
              fontSize: 11,
              color: '#79c0ff',
            }}
          >
            {pullBaseCmd}
          </Box>

          <CopyButton value={pullBaseCmd}>
            {({ copied, copy }) => (
              <Button
                size="xs"
                variant="light"
                color={copied ? 'teal' : 'blue'}
                onClick={copy}
                leftSection={copied ? <IconCheck size={13} /> : <IconCopy size={13} />}
              >
                {copied ? 'Đã sao chép' : 'Copy lệnh'}
              </Button>
            )}
          </CopyButton>

          <Button
            size="xs"
            variant="subtle"
            component="a"
            href={`https://github.com/${selectedRepo.owner.login}/${selectedRepo.name}/commits/${baseBranch}`}
            target="_blank"
            rightSection={<IconExternalLink size={12} />}
            color="gray"
            styles={{ root: { color: '#c9d1d9' } }}
          >
            Xem commits trên GitHub
          </Button>

          <Tooltip label="Ẩn thông báo" withArrow>
            <ActionIcon size="sm" variant="subtle" color="gray" onClick={() => setDismissed(true)}>
              <IconX size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Paper>
    );
  }

  // TRƯỜNG HỢP 3: Đang ở branch tính năng nhưng chưa có diff đặc biệt, vẫn cung cấp nút tạo PR nhanh
  if (!isCurrentBranchBase) {
    return (
      <Box
        px="lg"
        py={6}
        style={{
          backgroundColor: '#11161d',
          borderBottom: '1px solid #21262d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
          flexShrink: 0,
        }}
      >
        <Group gap="xs">
          <IconGitBranch size={14} color="#8b949e" />
          <Text fz={12} c="#8b949e">
            Đang làm việc trên nhánh <span style={{ color: '#58a6ff', fontFamily: 'monospace' }}>{currentBranch}</span>.
            Mục tiêu merge: <span style={{ color: '#58a6ff', fontFamily: 'monospace' }}>{baseBranch}</span>
          </Text>
        </Group>

        <Group gap="xs">
          <Button
            size="compact-xs"
            variant="light"
            color="green"
            component="a"
            href={compareUrl}
            target="_blank"
            leftSection={<IconGitPullRequest size={12} />}
            rightSection={<IconExternalLink size={11} />}
          >
            Tạo Pull Request qua GitHub
          </Button>
        </Group>
      </Box>
    );
  }

  return null;
}
