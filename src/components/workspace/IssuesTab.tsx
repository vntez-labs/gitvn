'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Group,
  Text,
  SegmentedControl,
  Loader,
  Stack,
  ThemeIcon,
  TextInput,
  Badge,
} from '@mantine/core';
import {
  IconCircleDot,
  IconCircleCheck,
  IconMessageCircle,
  IconSearch,
} from '@tabler/icons-react';
import { useDashboardStore } from '@/store/dashboard.store';
import axios from 'axios';

interface IssuesTabProps {
  onIssuesLoaded?: (count: number) => void;
}

export function IssuesTab({ onIssuesLoaded }: IssuesTabProps) {
  const { selectedRepo } = useDashboardStore();
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'open' | 'closed' | 'all'>('open');
  const [searchQuery, setSearchQuery] = useState('');
  const [totalCount, setTotalCount] = useState<number>(0);

  useEffect(() => {
    if (!selectedRepo) return;
    setLoading(true);

    axios
      .get(`/api/github/issues?owner=${selectedRepo.owner.login}&repo=${selectedRepo.name}&state=${filter}`)
      .then((res) => {
        const data = res.data.issues || [];
        const count = res.data.totalCount ?? data.length;
        setIssues(data);
        setTotalCount(count);
        if (onIssuesLoaded && filter === 'open') {
          onIssuesLoaded(count);
        }
      })
      .catch((err) => console.error('Lỗi tải issues:', err))
      .finally(() => setLoading(false));
  }, [selectedRepo?.id, filter]);

  const filteredIssues = useMemo(() => {
    if (!searchQuery.trim()) return issues;
    const q = searchQuery.toLowerCase();
    return issues.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.user?.login.toLowerCase().includes(q) ||
        String(item.number).includes(q)
    );
  }, [issues, searchQuery]);

  return (
    <Box className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '24px', minHeight: 0 }}>
      <Box style={{ maxWidth: 960, margin: '0 auto' }}>
        {/* Toolbar */}
        <Group justify="space-between" mb="md" align="center">
          <Group gap="sm" style={{ flex: 1, maxWidth: 500 }}>
            <TextInput
              placeholder="Tìm theo tiêu đề, tác giả, #id..."
              size="xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              leftSection={<IconSearch size={14} color="#8b949e" />}
              style={{ flex: 1 }}
              styles={{
                input: {
                  backgroundColor: '#161b22',
                  borderColor: '#30363d',
                  color: '#f0f6fc',
                },
              }}
            />

            <SegmentedControl
              value={filter}
              onChange={(val) => setFilter(val as any)}
              size="xs"
              data={[
                { label: 'Open', value: 'open' },
                { label: 'Closed', value: 'closed' },
                { label: 'All', value: 'all' },
              ]}
              styles={{
                root: { backgroundColor: '#161b22' },
                indicator: { backgroundColor: '#21262d' },
                label: { color: '#c9d1d9' },
              }}
            />
          </Group>

          <Text fz="xs" c="#8b949e">
            {searchQuery.trim()
              ? `Tìm thấy ${filteredIssues.length} issues (trong ${totalCount} issues)`
              : `${totalCount} Issues`}
          </Text>
        </Group>

        {/* Danh sách Issues */}
        {loading ? (
          <Group justify="center" mt={60}>
            <Loader size="sm" color="gray" />
          </Group>
        ) : filteredIssues.length > 0 ? (
          <Stack gap={1} style={{ border: '1px solid #30363d', borderRadius: 6, overflow: 'hidden' }}>
            {filteredIssues.map((issue) => {
              const isOpen = issue.state === 'open';

              return (
                <Box
                  key={issue.id}
                  p="sm"
                  component="a"
                  href={issue.html_url}
                  target="_blank"
                  style={{
                    backgroundColor: '#0d1117',
                    borderBottom: '1px solid #21262d',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    textDecoration: 'none',
                    transition: 'background-color 0.12s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#161b22')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0d1117')}
                >
                  <Box mt={2}>
                    {isOpen ? (
                      <IconCircleDot size={16} color="#3fb950" />
                    ) : (
                      <IconCircleCheck size={16} color="#a371f7" />
                    )}
                  </Box>

                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <Group gap="xs" wrap="wrap">
                      <Text fz="sm" fw={600} c="#f0f6fc">
                        {issue.title}
                      </Text>
                      {issue.labels?.map((label: any) => (
                        <Badge
                          key={label.id}
                          size="xs"
                          variant="filled"
                          style={{
                            backgroundColor: `#${label.color}25`,
                            color: `#${label.color}`,
                            border: `1px solid #${label.color}40`,
                          }}
                        >
                          {label.name}
                        </Badge>
                      ))}
                    </Group>

                    <Text fz={11} c="#8b949e" mt={4}>
                      #{issue.number} mở bởi <span style={{ color: '#c9d1d9' }}>{issue.user?.login}</span> •{' '}
                      {new Date(issue.created_at).toLocaleDateString()}
                    </Text>
                  </Box>

                  {issue.comments > 0 && (
                    <Group gap={4} c="#8b949e">
                      <IconMessageCircle size={14} />
                      <Text fz={11}>{issue.comments}</Text>
                    </Group>
                  )}
                </Box>
              );
            })}
          </Stack>
        ) : (
          <Box ta="center" mt={80}>
            <ThemeIcon size={56} radius="xl" variant="light" color="gray" mb="sm" bg="#161b22">
              <IconCircleDot size={28} color="#8b949e" />
            </ThemeIcon>
            <Text fw={600} fz="sm" c="#f0f6fc">Không có Issue nào</Text>
            <Text fz="xs" c="#8b949e" mt={4}>
              Repository này hiện không có issue nào phù hợp với bộ lọc.
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}
