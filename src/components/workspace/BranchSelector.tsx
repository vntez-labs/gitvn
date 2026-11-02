'use client';

import { useState } from 'react';
import { Button, Menu, Loader } from '@mantine/core';
import { IconGitBranch, IconChevronDown } from '@tabler/icons-react';
import { useDashboardStore } from '@/store/dashboard.store';
import axios from 'axios';

export function BranchSelector() {
  const { selectedRepo, currentBranch, changeBranch } = useDashboardStore();
  const [branches, setBranches] = useState<{ name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  if (!selectedRepo) return null;
  const defaultBranch = (selectedRepo as any)?.default_branch || 'main';

  const handleOpen = async () => {
    if (branches.length > 0) return;
    setLoading(true);
    try {
      const { data } = await axios.get(
        `/api/github/branches?owner=${selectedRepo.owner.login}&repo=${selectedRepo.name}`
      );
      setBranches(data.branches || []);
    } catch (err) {
      console.error('Lỗi lấy branches:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Menu shadow="md" width={220} onOpen={handleOpen}>
      <Menu.Target>
        <Button
          size="compact-xs"
          variant="subtle"
          color="gray"
          leftSection={<IconGitBranch size={13} color="#8b949e" />}
          rightSection={
            loading ? <Loader size={10} color="gray" /> : <IconChevronDown size={11} color="#8b949e" />
          }
          styles={{
            root: {
              backgroundColor: 'rgba(255,255,255,0.05)',
              color: '#c9d1d9',
              fontFamily: 'monospace',
              fontWeight: 500,
            },
          }}
        >
          {currentBranch}
        </Button>
      </Menu.Target>

      <Menu.Dropdown bg="#161b22" style={{ borderColor: '#30363d', maxHeight: 300, overflowY: 'auto' }}>
        <Menu.Label c="#8b949e">Select Branch ({branches.length || 1})</Menu.Label>
        {branches.length > 0 ? (
          branches.map((b) => (
            <Menu.Item
              key={b.name}
              leftSection={<IconGitBranch size={13} />}
              onClick={() => changeBranch(b.name)}
              c={currentBranch === b.name ? '#58a6ff' : '#c9d1d9'}
              style={{ fontSize: 12, fontFamily: 'monospace' }}
            >
              {b.name} {b.name === defaultBranch && '(default)'}
            </Menu.Item>
          ))
        ) : (
          <Menu.Item c="#58a6ff" style={{ fontSize: 12, fontFamily: 'monospace' }}>
            {defaultBranch} (default)
          </Menu.Item>
        )}
      </Menu.Dropdown>
    </Menu>
  );
}
