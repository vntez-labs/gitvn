'use client';

import { useState } from 'react';
import {
  Box,
  Group,
  Text,
  Avatar,
  UnstyledButton,
  Stack,
  Skeleton,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconStar,
  IconLock,
  IconBook,
  IconPlus,
} from '@tabler/icons-react';
import { useAuthStore } from '@/store/auth.store';
import { useDashboardStore } from '@/store/dashboard.store';
import { CreateRepoModal } from '@/components/dashboard/CreateRepoModal';
import { getIconForFile } from 'vscode-icons-js';
import { GitHubRepo } from '@/interfaces/github';

const ICON_BASE_URL = 'https://cdn.jsdelivr.net/gh/vscode-icons/vscode-icons@master/icons';

const LANG_FILE_MAPPING: Record<string, string> = {
  TypeScript: 'main.ts',
  JavaScript: 'main.js',
  Python: 'main.py',
  Rust: 'main.rs',
  Go: 'main.go',
  'C++': 'main.cpp',
  C: 'main.c',
  'C#': 'main.cs',
  Dart: 'main.dart',
  Java: 'main.java',
  PHP: 'main.php',
  HTML: 'main.html',
  CSS: 'main.css',
  Svelte: 'App.svelte',
  Vue: 'App.vue',
  Shell: 'script.sh',
  Ruby: 'main.rb',
  Kotlin: 'main.kt',
  Swift: 'main.swift',
  Dockerfile: 'Dockerfile',
};

function formatCompactNumber(num: number | undefined): string {
  if (!num || num === 0) return '0';
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  })
    .format(num)
    .toLowerCase();
}

function RepoLangIcon({ repo }: { repo: GitHubRepo }) {
  const lang = repo.language;
  const mockFileName = (lang && LANG_FILE_MAPPING[lang]) || 'default_file.svg';
  const iconName = getIconForFile(mockFileName) || 'default_file.svg';

  if (!lang) {
    return <IconBook size={15} color="#8b949e" style={{ flexShrink: 0 }} />;
  }

  return (
    <img
      src={`${ICON_BASE_URL}/${iconName}`}
      alt={lang}
      width={15}
      height={15}
      style={{ display: 'block', flexShrink: 0, objectFit: 'contain' }}
      onError={(e) => {
        (e.target as HTMLImageElement).src = `${ICON_BASE_URL}/default_file.svg`;
      }}
    />
  );
}

export function DashboardSidebar() {
  const { user } = useAuthStore();
  const {
    orgs,
    repos,
    dataLoading,
    selectedOrg,
    selectedRepo,
    selectOrg,
    selectRepo,
  } = useDashboardStore();

  const [createModalOpen, setCreateModalOpen] = useState(false);

  if (!user) return null;

  const filteredRepos = repos.filter((repo) =>
    selectedOrg
      ? repo.owner.login.toLowerCase() === selectedOrg.toLowerCase()
      : repo.owner.login.toLowerCase() === user.login.toLowerCase()
  );

  return (
    <Box
      w={260}
      style={{
        borderRight: '1px solid #21262d',
        backgroundColor: '#0d1117',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      <Box className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '14px 8px 8px', minHeight: 0 }}>
        {/* ORGANIZATIONS */}
        <Text fz={10} fw={700} c="#8b949e" mb={6} px="xs" style={{ letterSpacing: '0.08em', fontFamily: 'monospace' }}>
          ORGANIZATIONS
        </Text>

        {dataLoading ? (
          <Stack gap="xs" px="xs" mb="md">
            <Skeleton height={26} radius="sm" />
            <Skeleton height={26} radius="sm" />
          </Stack>
        ) : (
          <Stack gap={2} mb="md">
            {orgs.length > 0 ? (
              orgs.map((org) => {
                const isSelected = selectedOrg === org.login;
                return (
                  <UnstyledButton
                    key={org.id}
                    onClick={() => selectOrg(org.login)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '5px 8px',
                      borderRadius: 6,
                      backgroundColor: isSelected ? 'rgba(56, 139, 253, 0.15)' : 'transparent',
                      borderLeft: isSelected ? '2px solid #58a6ff' : '2px solid transparent',
                      transition: 'background 0.12s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Group gap="xs" wrap="nowrap">
                      <Avatar src={org.avatar_url} size={18} radius="xl" />
                      <Text fz={12} fw={isSelected ? 600 : 400} c={isSelected ? '#ffffff' : '#c9d1d9'} truncate>
                        {org.login}
                      </Text>
                    </Group>
                  </UnstyledButton>
                );
              })
            ) : (
              <Text fz={11} c="#6e7681" px="xs">
                Không có organization nào.
              </Text>
            )}
          </Stack>
        )}

        {/* REPOSITORIES HEADER */}
        <Group justify="space-between" mb={6} px="xs" align="center">
          <Text fz={10} fw={700} c="#8b949e" style={{ letterSpacing: '0.08em', fontFamily: 'monospace' }}>
            {selectedOrg ? `REPOS CỦA ${selectedOrg.toUpperCase()}` : 'REPOS CÁ NHÂN'}
          </Text>
          <Group gap={4} wrap="nowrap">
            {selectedOrg && (
              <Tooltip label="Quay lại cá nhân" withArrow>
                <ActionIcon size="xs" variant="subtle" color="gray" onClick={() => selectOrg(null)}>
                  <IconArrowLeft size={12} />
                </ActionIcon>
              </Tooltip>
            )}
            <Tooltip label="Tạo Repository mới" withArrow>
              <ActionIcon
                size="xs"
                variant="subtle"
                color="gray"
                onClick={() => setCreateModalOpen(true)}
                styles={{
                  root: {
                    '&:hover': { color: '#58a6ff', backgroundColor: 'rgba(56, 139, 253, 0.15)' },
                  },
                }}
              >
                <IconPlus size={13} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>

        {/* DANH SÁCH REPO */}
        {dataLoading ? (
          <Stack gap="xs" px="xs">
            <Skeleton height={26} radius="sm" />
            <Skeleton height={26} radius="sm" />
            <Skeleton height={26} radius="sm" />
          </Stack>
        ) : (
          <Stack gap={2}>
            {filteredRepos.length > 0 ? (
              filteredRepos.map((repo) => {
                const isSelected = selectedRepo?.id === repo.id;
                const starCount = repo.stargazers_count ?? 0;

                return (
                  <UnstyledButton
                    key={repo.id}
                    onClick={() => selectRepo(repo)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 8px',
                      borderRadius: 6,
                      backgroundColor: isSelected ? 'rgba(56, 139, 253, 0.15)' : 'transparent',
                      borderLeft: isSelected ? '2px solid #58a6ff' : '2px solid transparent',
                      transition: 'all 0.12s ease',
                      width: '100%',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Group gap={8} wrap="nowrap" style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
                      <RepoLangIcon repo={repo} />
                      <Text
                        fz={12}
                        ff="monospace"
                        fw={isSelected ? 600 : 400}
                        c={isSelected ? '#58a6ff' : '#c9d1d9'}
                        truncate
                      >
                        {repo.name}
                      </Text>
                    </Group>

                    <Group gap={6} wrap="nowrap" style={{ flexShrink: 0 }}>
                      {repo.private && (
                        <Tooltip label="Private repo" withArrow>
                          <Box style={{ display: 'flex', alignItems: 'center' }}>
                            <IconLock size={12} color="#8b949e" />
                          </Box>
                        </Tooltip>
                      )}

                      {starCount > 0 && (
                        <Group gap={2} wrap="nowrap">
                          <IconStar size={11} color="#e3b341" fill="#e3b341" />
                          <Text fz={10} c="#8b949e" ff="monospace" fw={500}>
                            {formatCompactNumber(starCount)}
                          </Text>
                        </Group>
                      )}
                    </Group>
                  </UnstyledButton>
                );
              })
            ) : (
              <Text fz={11} c="#6e7681" px="xs">
                Không có repository nào.
              </Text>
            )}
          </Stack>
        )}
      </Box>

      <CreateRepoModal
        opened={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </Box>
  );
}
