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
  Pagination,
} from '@mantine/core';
import {
  IconGitPullRequest,
  IconGitMerge,
  IconMessageCircle,
  IconSearch,
} from '@tabler/icons-react';
import { useDashboardStore } from '@/store/dashboard.store';
import { PullDetailView } from './pulls/PullDetailView';
import axios from 'axios';

interface PullsTabProps {
  onPullsLoaded?: (count: number) => void;
}

export function PullsTab({ onPullsLoaded }: PullsTabProps) {
  const { selectedRepo } = useDashboardStore();
  const [pulls, setPulls] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('open');
  const [searchQuery, setSearchQuery] = useState('');

  // State phân trang & tổng số PR thực tế
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const [selectedPullNumber, setSelectedPullNumber] = useState<number | null>(null);

  const fetchPulls = () => {
    if (!selectedRepo) return;
    setLoading(true);

    axios
      .get(
        `/api/github/pulls?owner=${selectedRepo.owner.login}&repo=${selectedRepo.name}&state=${filter}&page=${page}&per_page=15`
      )
      .then((res) => {
        const data = res.data.pulls || [];
        const count = res.data.totalCount ?? data.length;
        setPulls(data);
        setTotalPages(res.data.totalPages || 1);
        setTotalCount(count);
        // Chỉ cập nhật badge số lượng open PRs khi filter là 'open'
        if (onPullsLoaded && filter === 'open') {
          onPullsLoaded(count);
        }
      })
      .catch((err) => console.error('Lỗi tải PRs:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPulls();
  }, [selectedRepo?.id, filter, page]);

  const filteredPulls = useMemo(() => {
    if (!searchQuery.trim()) return pulls;
    const q = searchQuery.toLowerCase();
    return pulls.filter(
      (pr) =>
        pr.title.toLowerCase().includes(q) ||
        pr.user?.login.toLowerCase().includes(q) ||
        String(pr.number).includes(q)
    );
  }, [pulls, searchQuery]);

  if (selectedPullNumber) {
    return (
      <PullDetailView
        pullNumber={selectedPullNumber}
        onBack={() => setSelectedPullNumber(null)}
        onMergedSuccess={() => {
          setSelectedPullNumber(null);
          fetchPulls();
        }}
      />
    );
  }

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
              onChange={(val) => {
                setFilter(val as any);
                setPage(1); // Reset về trang 1 khi đổi bộ lọc
              }}
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
              ? `Tìm thấy ${filteredPulls.length} PRs (trong ${totalCount} PRs)`
              : `Trang ${page} / ${totalPages} (${totalCount} PRs)`}
          </Text>
        </Group>

        {/* Danh sách Pulls */}
        {loading ? (
          <Group justify="center" mt={60}>
            <Loader size="sm" color="gray" />
          </Group>
        ) : filteredPulls.length > 0 ? (
          <Stack gap={1} style={{ border: '1px solid #30363d', borderRadius: 6, overflow: 'hidden' }}>
            {filteredPulls.map((pr) => {
              const isMerged = !!pr.merged_at;
              const isOpen = pr.state === 'open';

              return (
                <Box
                  key={pr.id}
                  p="sm"
                  onClick={() => setSelectedPullNumber(pr.number)}
                  style={{
                    backgroundColor: '#0d1117',
                    borderBottom: '1px solid #21262d',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    cursor: 'pointer',
                    transition: 'background-color 0.12s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#161b22')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0d1117')}
                >
                  <Box mt={2}>
                    {isMerged ? (
                      <IconGitMerge size={16} color="#a371f7" />
                    ) : isOpen ? (
                      <IconGitPullRequest size={16} color="#3fb950" />
                    ) : (
                      <IconGitPullRequest size={16} color="#f85149" />
                    )}
                  </Box>

                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <Text fz="sm" fw={600} c="#f0f6fc">
                      {pr.title}
                    </Text>
                    <Text fz={11} c="#8b949e" mt={2}>
                      #{pr.number} by <span style={{ color: '#c9d1d9' }}>{pr.user?.login}</span> • mở vào{' '}
                      {new Date(pr.created_at).toLocaleDateString()}
                    </Text>
                  </Box>

                  {pr.comments > 0 && (
                    <Group gap={4} c="#8b949e">
                      <IconMessageCircle size={14} />
                      <Text fz={11}>{pr.comments}</Text>
                    </Group>
                  )}
                </Box>
              );
            })}
          </Stack>
        ) : (
          <Box ta="center" mt={80}>
            <ThemeIcon size={56} radius="xl" variant="light" color="gray" mb="sm" bg="#161b22">
              <IconGitPullRequest size={28} color="#8b949e" />
            </ThemeIcon>
            <Text fw={600} fz="sm" c="#f0f6fc">Không tìm thấy Pull Request nào</Text>
            <Text fz="xs" c="#8b949e" mt={4}>Thử thay đổi từ khóa tìm kiếm hoặc đổi bộ lọc trạng thái.</Text>
          </Box>
        )}

        {/* CHỈ HIỂN THỊ PHÂN TRANG KHI CÓ TỪ 2 TRANG TRỞ LÊN */}
        {totalPages > 1 && (
          <Group justify="center" mt="xl">
            <Pagination
              value={page}
              onChange={setPage}
              total={totalPages}
              size="sm"
              styles={{
                control: {
                  backgroundColor: '#161b22',
                  borderColor: '#30363d',
                  color: '#c9d1d9',
                  '&[data-active]': { backgroundColor: '#21262d', color: '#58a6ff' },
                },
              }}
            />
          </Group>
        )}
      </Box>
    </Box>
  );
}
