'use client';

import { useState } from 'react';
import {
  Box,
  Text,
  Title,
  Paper,
  SegmentedControl,
  CopyButton,
  ActionIcon,
  Tooltip,
  Stack,
  Group,
  Badge,
} from '@mantine/core';
import { IconCheck, IconCopy, IconTerminal2, IconSparkles } from '@tabler/icons-react';
import { GitHubRepo } from '@/interfaces/github';

interface EmptyRepoViewProps {
  repo: GitHubRepo;
}

export function EmptyRepoView({ repo }: EmptyRepoViewProps) {
  const [protocol, setProtocol] = useState<'https' | 'ssh'>('https');

  const defaultBranch = (repo as any)?.default_branch || 'main';
  const httpsUrl =
    repo.clone_url || `https://github.com/${repo.owner.login}/${repo.name}.git`;
  const sshUrl =
    (repo as any)?.ssh_url || `git@github.com:${repo.owner.login}/${repo.name}.git`;
  const cloneUrl = protocol === 'https' ? httpsUrl : sshUrl;

  const initCode = `echo "# ${repo.name}" >> README.md
git init
git add README.md
git commit -m "first commit"
git branch -M ${defaultBranch}
git remote add origin ${cloneUrl}
git push -u origin ${defaultBranch}`;

  const pushExistingCode = `git remote add origin ${cloneUrl}
git branch -M ${defaultBranch}
git push -u origin ${defaultBranch}`;

  return (
    <Box
      className="hide-scrollbar"
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '32px 24px',
        backgroundColor: '#0d1117',
        minHeight: 0,
      }}
    >
      <Box style={{ maxWidth: 860, margin: '0 auto', width: '100%' }}>
        {/* Banner tiêu đề */}
        <Box mb="xl">
          <Group gap="xs" mb={4}>
            <Title order={3} c="#f0f6fc" fw={600} fz={20}>
              Quick setup
            </Title>
            <Badge size="sm" variant="outline" color="blue" radius="sm">
              Repository trống
            </Badge>
          </Group>
          <Text c="#8b949e" fz={13}>
            Repository này chưa có bất kỳ commit hay tệp tin nào. Hãy bắt đầu bằng cách tải code lên từ máy của bạn.
          </Text>
        </Box>

        {/* Quick setup bar */}
        <Paper
          p="md"
          bg="#161b22"
          radius="md"
          style={{ border: '1px solid #30363d' }}
          mb="xl"
        >
          <Group justify="space-between" mb="xs" wrap="wrap">
            <Group gap="xs">
              <IconTerminal2 size={16} color="#58a6ff" />
              <Text fw={600} fz={13} c="#f0f6fc">
                Clone URL ({protocol.toUpperCase()})
              </Text>
            </Group>
            <SegmentedControl
              value={protocol}
              onChange={(val) => setProtocol(val as 'https' | 'ssh')}
              size="xs"
              data={[
                { label: 'HTTPS', value: 'https' },
                { label: 'SSH', value: 'ssh' },
              ]}
              styles={{
                root: { backgroundColor: '#0d1117', border: '1px solid #30363d' },
                indicator: { backgroundColor: '#21262d' },
                label: { color: '#c9d1d9', fontSize: 11, padding: '2px 10px' },
              }}
            />
          </Group>

          <Group gap="xs" mt="xs">
            <Box
              style={{
                flex: 1,
                backgroundColor: '#0d1117',
                border: '1px solid #30363d',
                borderRadius: 6,
                padding: '6px 12px',
                fontFamily: 'monospace',
                fontSize: 12,
                color: '#58a6ff',
                overflowX: 'auto',
                whiteSpace: 'nowrap',
              }}
            >
              {cloneUrl}
            </Box>
            <CopyButton value={cloneUrl}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? 'Đã sao chép' : 'Sao chép URL'} withArrow>
                  <ActionIcon
                    variant="light"
                    color={copied ? 'teal' : 'gray'}
                    onClick={copy}
                    size="lg"
                    style={{ borderColor: '#30363d' }}
                  >
                    {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
          </Group>
        </Paper>

        {/* Lệnh tạo mới từ Terminal */}
        <Stack gap="xl">
          <Box>
            <Group gap="xs" mb={8}>
              <IconSparkles size={14} color="#7ee787" />
              <Text fz={13} fw={600} c="#e6edf3" ff="monospace">
                …hoặc tạo một repository mới từ command line
              </Text>
            </Group>

            <Paper
              p="md"
              bg="#010409"
              radius="md"
              style={{ border: '1px solid #30363d', position: 'relative' }}
            >
              <Box style={{ position: 'absolute', top: 10, right: 10 }}>
                <CopyButton value={initCode}>
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? 'Đã sao chép' : 'Sao chép toàn bộ'} withArrow>
                      <ActionIcon size="sm" variant="subtle" color={copied ? 'teal' : 'gray'} onClick={copy}>
                        {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
              </Box>
              <pre
                style={{
                  margin: 0,
                  fontFamily: 'monospace',
                  fontSize: 12,
                  lineHeight: 1.7,
                  color: '#79c0ff',
                  overflowX: 'auto',
                }}
              >
                {initCode}
              </pre>
            </Paper>
          </Box>

          {/* Lệnh push repo đã có sẵn */}
          <Box>
            <Group gap="xs" mb={8}>
              <IconTerminal2 size={14} color="#d29922" />
              <Text fz={13} fw={600} c="#e6edf3" ff="monospace">
                …hoặc push một repository có sẵn từ máy tính
              </Text>
            </Group>

            <Paper
              p="md"
              bg="#010409"
              radius="md"
              style={{ border: '1px solid #30363d', position: 'relative' }}
            >
              <Box style={{ position: 'absolute', top: 10, right: 10 }}>
                <CopyButton value={pushExistingCode}>
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? 'Đã sao chép' : 'Sao chép toàn bộ'} withArrow>
                      <ActionIcon size="sm" variant="subtle" color={copied ? 'teal' : 'gray'} onClick={copy}>
                        {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
              </Box>
              <pre
                style={{
                  margin: 0,
                  fontFamily: 'monospace',
                  fontSize: 12,
                  lineHeight: 1.7,
                  color: '#79c0ff',
                  overflowX: 'auto',
                }}
              >
                {pushExistingCode}
              </pre>
            </Paper>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
