'use client';

import { useState } from 'react';
import {
  Popover,
  Button,
  Text,
  SegmentedControl,
  CopyButton,
  TextInput,
  ActionIcon,
  Divider,
} from '@mantine/core';
import {
  IconTerminal2,
  IconChevronDown,
  IconCheck,
  IconCopy,
  IconDownload,
} from '@tabler/icons-react';
import { useDashboardStore } from '@/store/dashboard.store';

export function ClonePopover() {
  const { selectedRepo, currentBranch } = useDashboardStore();
  const [protocol, setProtocol] = useState<'https' | 'ssh'>('https');

  if (!selectedRepo) return null;

  const httpsUrl = selectedRepo.clone_url || `https://github.com/${selectedRepo.owner.login}/${selectedRepo.name}.git`;
  const sshUrl = `git@github.com:${selectedRepo.owner.login}/${selectedRepo.name}.git`;
  const zipUrl = `https://github.com/${selectedRepo.owner.login}/${selectedRepo.name}/archive/refs/heads/${currentBranch}.zip`;
  const cloneTarget = protocol === 'https' ? httpsUrl : sshUrl;

  return (
    <Popover width={340} position="bottom-end" withArrow shadow="xl">
      <Popover.Target>
        <Button
          size="compact-xs"
          variant="filled"
          leftSection={<IconTerminal2 size={13} />}
          rightSection={<IconChevronDown size={11} />}
          styles={{ root: { backgroundColor: '#238636', '&:hover': { backgroundColor: '#2ea043' } } }}
        >
          Code
        </Button>
      </Popover.Target>

      <Popover.Dropdown bg="#161b22" style={{ borderColor: '#30363d', padding: 14 }}>
        <Text fz={12} fw={700} c="#f0f6fc" mb={8}>
          Clone repository ({currentBranch})
        </Text>

        <SegmentedControl
          value={protocol}
          onChange={(val) => setProtocol(val as 'https' | 'ssh')}
          size="xs"
          fullWidth
          data={[
            { label: 'HTTPS', value: 'https' },
            { label: 'SSH', value: 'ssh' },
          ]}
          styles={{
            root: { backgroundColor: '#0d1117' },
            indicator: { backgroundColor: '#21262d' },
            label: { color: '#c9d1d9' },
          }}
          mb="xs"
        />

        <CopyButton value={cloneTarget}>
          {({ copied, copy }) => (
            <TextInput
              readOnly
              value={cloneTarget}
              size="xs"
              styles={{
                input: {
                  backgroundColor: '#0d1117',
                  borderColor: '#30363d',
                  color: '#c9d1d9',
                  fontFamily: 'monospace',
                  fontSize: 11,
                },
              }}
              rightSection={
                <ActionIcon size="xs" variant="subtle" color={copied ? 'teal' : 'gray'} onClick={copy}>
                  {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                </ActionIcon>
              }
            />
          )}
        </CopyButton>

        <Divider my="sm" color="#30363d" />

        <Button
          fullWidth
          size="xs"
          variant="subtle"
          color="gray"
          leftSection={<IconDownload size={14} />}
          component="a"
          href={zipUrl}
          download
          styles={{
            root: {
              justifyContent: 'flex-start',
              color: '#c9d1d9',
              '&:hover': { backgroundColor: '#21262d' },
            },
          }}
        >
          Download ZIP ({currentBranch})
        </Button>
      </Popover.Dropdown>
    </Popover>
  );
}
