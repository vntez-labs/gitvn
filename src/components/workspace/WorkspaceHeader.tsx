'use client';

import { Box, Group, Text, Badge, Button } from '@mantine/core';
import {
  IconBook,
  IconExternalLink,
  IconCode,
  IconInfoCircle,
  IconGitPullRequest,
  IconCircleDot,
  IconSettings,
  IconGitCommit,
  IconGitMerge,
  IconLayoutKanban,
} from '@tabler/icons-react';
import { useDashboardStore } from '@/store/dashboard.store';
import { BranchSelector } from './BranchSelector';
import { ClonePopover } from './ClonePopover';

export type WorkspaceTab = 'code' | 'commits' | 'kanban' | 'overview' | 'pulls' | 'issues' | 'settings';

interface WorkspaceHeaderProps {
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  commitsCount?: number;
  pullsCount?: number;
  issuesCount?: number;
}

export function WorkspaceHeader({
  activeTab,
  onTabChange,
  commitsCount,
  pullsCount = 0,
  issuesCount = 0,
}: WorkspaceHeaderProps) {
  const { selectedRepo, currentBranch } = useDashboardStore();
  if (!selectedRepo) return null;

  const defaultBranch = (selectedRepo as any).default_branch || 'main';
  const isFeatureBranch = currentBranch.toLowerCase() !== defaultBranch.toLowerCase();
  const compareUrl = `https://github.com/${selectedRepo.owner.login}/${selectedRepo.name}/compare/${currentBranch}?expand=1`;

  const tabs = [
    { id: 'code', label: 'Code', icon: IconCode },
    { id: 'commits', label: 'Commits', icon: IconGitCommit, count: commitsCount },
    { id: 'kanban', label: 'Kanban (Tasks)', icon: IconLayoutKanban },
    { id: 'overview', label: 'Overview', icon: IconInfoCircle },
    { id: 'pulls', label: 'Pull requests', icon: IconGitPullRequest, count: pullsCount },
    { id: 'issues', label: 'Issues', icon: IconCircleDot, count: issuesCount },
    { id: 'settings', label: 'Settings', icon: IconSettings },
  ];

  return (
    <Box
      px="lg"
      pt="sm"
      pb={0}
      style={{
        borderBottom: '1px solid #21262d',
        backgroundColor: '#161b22',
        flexShrink: 0,
      }}
    >
      <Group justify="space-between" align="center" wrap="nowrap" mb={10}>
        <Group gap="xs" wrap="nowrap">
          <IconBook size={18} color="#58a6ff" />
          <Text fw={600} fz="sm" c="#f0f6fc" ff="monospace">
            {selectedRepo.owner.login} / <span style={{ color: '#58a6ff', fontWeight: 700 }}>{selectedRepo.name}</span>
          </Text>

          <Badge size="xs" variant="outline" color={selectedRepo.private ? 'gray' : 'green'} radius="sm">
            {selectedRepo.private ? 'Private' : 'Public'}
          </Badge>

          <BranchSelector />
        </Group>

        <Group gap="xs" wrap="nowrap">
          {isFeatureBranch && (
            <Button
              size="compact-xs"
              variant="filled"
              component="a"
              href={compareUrl}
              target="_blank"
              leftSection={<IconGitMerge size={12} />}
              rightSection={<IconExternalLink size={10} />}
              styles={{
                root: {
                  backgroundColor: '#238636',
                  color: '#ffffff',
                  fontWeight: 600,
                  '&:hover': { backgroundColor: '#2ea043' },
                },
              }}
            >
              Merge / PR
            </Button>
          )}
          <ClonePopover />
          <Button
            size="compact-xs"
            variant="light"
            color="gray"
            component="a"
            href={selectedRepo.html_url}
            target="_blank"
            rightSection={<IconExternalLink size={12} />}
            styles={{ root: { backgroundColor: '#21262d', color: '#c9d1d9' } }}
          >
            GitHub
          </Button>
        </Group>
      </Group>

      {/* Tabs */}
      <Group gap={4} wrap="nowrap">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <Box
              key={tab.id}
              onClick={() => onTabChange(tab.id as WorkspaceTab)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 12px 10px',
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#f0f6fc' : '#8b949e',
                borderBottom: isActive ? '2px solid #f78166' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'color 0.15s ease, border-color 0.15s ease',
                userSelect: 'none',
              }}
            >
              <Icon size={15} color={isActive ? '#f0f6fc' : '#8b949e'} />
              <span>{tab.label}</span>
              {/* CHỈ HIỂN THỊ BADGE KHI CÓ SỐ LƯỢNG THỰC SỰ LỚN HƠN 0 */}
              {typeof tab.count === 'number' && tab.count > 0 && (
                <Badge size="xs" variant="filled" color="dark" c="#c9d1d9" circle>
                  {tab.count}
                </Badge>
              )}
            </Box>
          );
        })}
      </Group>
    </Box>
  );
}
