'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Group,
  Text,
  SimpleGrid,
  Paper,
  ThemeIcon,
  Progress,
  Tooltip,
  Avatar,
  Loader,
  Stack,
  Badge,
  RingProgress,
  SegmentedControl,
  ActionIcon,
} from '@mantine/core';
import {
  IconStar,
  IconGitFork,
  IconUsers,
  IconGitBranch,
  IconActivity,
  IconGitPullRequest,
  IconGitMerge,
  IconCircleDot,
  IconCircleCheck,
  IconSparkles,
  IconInfoCircle,
  IconRefresh,
} from '@tabler/icons-react';
import { useDashboardStore } from '@/store/dashboard.store';
import { LANG_METADATA, formatCompactNumber } from './constants';
import axios from 'axios';

export function OverviewTab() {
  const { selectedRepo, currentBranch, tree } = useDashboardStore();

  const [statsData, setStatsData] = useState<{
    contributors: any[];
    totalContributors?: number;
    totalCommits?: number;
    activity: any[];
    pulse?: {
      pulls: { total: number; open: number; merged: number; closed: number; mergeRate: number };
      issues: { total: number; open: number; closed: number; closeRate: number };
    };
  }>({
    contributors: [],
    activity: [],
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Bộ lọc sắp xếp đóng góp: 'impact' (điểm tổng hợp) | 'prs' (PRs đã merge) | 'lines' (dòng code) | 'commits'
  const [sortBy, setSortBy] = useState<'impact' | 'prs' | 'lines' | 'commits'>('impact');

  const fetchStats = (forceRefresh = false) => {
    if (!selectedRepo) return;
    if (forceRefresh) setRefreshing(true);
    else setLoadingStats(true);

    const url = `/api/github/stats?owner=${selectedRepo.owner.login}&repo=${selectedRepo.name}${
      forceRefresh ? '&refresh=true' : ''
    }`;

    axios
      .get(url)
      .then((res) => {
        setStatsData(res.data);
      })
      .catch((err) => console.error('Lỗi tải thống kê repo:', err))
      .finally(() => {
        setLoadingStats(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    fetchStats(false);
  }, [selectedRepo?.id]);

  // 1. TIMELINE BIỂU ĐỒ SÓNG (52 tuần gần nhất)
  const timelineMetrics = useMemo(() => {
    const rawActivity = statsData.activity;
    if (!Array.isArray(rawActivity) || rawActivity.length === 0) {
      return { weeks: [], maxCommits: 1, totalAllTime: 0, peakWeek: 0 };
    }

    const firstActiveIndex = rawActivity.findIndex((w) => w.total > 0);
    const activeWeeks = firstActiveIndex !== -1 ? rawActivity.slice(firstActiveIndex) : rawActivity;
    const maxCommits = Math.max(...activeWeeks.map((w) => w.total), 1);
    const totalAllTime = activeWeeks.reduce((acc, w) => acc + (w.total || 0), 0);

    return {
      weeks: activeWeeks,
      maxCommits,
      totalAllTime,
      peakWeek: maxCommits,
    };
  }, [statsData.activity]);

  // 2. XẾP HẠNG THÀNH VIÊN ĐA CHIỀU (Impact, Merged PRs, Lines of code, Commits)
  const rankedContributors = useMemo(() => {
    const list = [...(statsData.contributors || [])];

    if (sortBy === 'impact') {
      list.sort((a, b) => (b.impactScore ?? 0) - (a.impactScore ?? 0));
    } else if (sortBy === 'prs') {
      list.sort((a, b) => {
        const valA = (a.mergedPRs || 0) + (a.mergedByCount || 0);
        const valB = (b.mergedPRs || 0) + (b.mergedByCount || 0);
        return valB - valA || (b.linesChanged || 0) - (a.linesChanged || 0);
      });
    } else if (sortBy === 'lines') {
      list.sort((a, b) => (b.linesChanged ?? 0) - (a.linesChanged ?? 0));
    } else {
      list.sort((a, b) => (b.commits ?? 0) - (a.commits ?? 0));
    }

    const maxVal = Math.max(
      ...list.map((c) => {
        if (sortBy === 'impact') return c.impactScore ?? 1;
        if (sortBy === 'prs') return (c.mergedPRs || 0) + (c.mergedByCount || 0) || 1;
        if (sortBy === 'lines') return c.linesChanged ?? 1;
        return c.commits ?? 1;
      }),
      1
    );

    return list.map((c) => {
      let currentVal = c.commits ?? 0;
      if (sortBy === 'impact') currentVal = c.impactScore ?? 0;
      if (sortBy === 'prs') currentVal = (c.mergedPRs || 0) + (c.mergedByCount || 0);
      if (sortBy === 'lines') currentVal = c.linesChanged ?? 0;

      const percent = Math.min(100, Math.round((currentVal / maxVal) * 100));
      return {
        ...c,
        percent,
      };
    });
  }, [statsData.contributors, sortBy]);

  // 3. TỶ LỆ NGÔN NGỮ
  const languageStats = useMemo(() => {
    if (!tree || tree.length === 0) return [];
    const countMap: Record<string, { name: string; color: string; count: number }> = {};
    let totalCodeFiles = 0;

    tree.forEach((node) => {
      if (node.type !== 'blob') return;
      const ext = node.path.split('.').pop()?.toLowerCase();
      if (!ext || !LANG_METADATA[ext]) return;

      const meta = LANG_METADATA[ext];
      if (!countMap[meta.name]) {
        countMap[meta.name] = { name: meta.name, color: meta.color, count: 0 };
      }
      countMap[meta.name].count += 1;
      totalCodeFiles += 1;
    });

    if (totalCodeFiles === 0) return [];
    return Object.values(countMap)
      .map((item) => ({ ...item, percent: Math.round((item.count / totalCodeFiles) * 100) }))
      .sort((a, b) => b.count - a.count);
  }, [tree]);

  if (!selectedRepo) return null;

  const forksCount = (selectedRepo as any).forks_count ?? 0;
  const starsCount = (selectedRepo as any).stargazers_count ?? 0;
  const pulse = statsData.pulse;

  // Tính tọa độ SVG Area/Line Chart
  const svgWidth = 800;
  const svgHeight = 120;
  const weeksData = timelineMetrics.weeks;
  const points = weeksData.map((w, i) => {
    const x = weeksData.length > 1 ? (i / (weeksData.length - 1)) * svgWidth : svgWidth / 2;
    const y = svgHeight - (w.total / timelineMetrics.maxCommits) * (svgHeight - 16) - 8;
    return { x, y, total: w.total };
  });

  const pathD = points.length > 0
    ? points.reduce((acc, p, idx) => (idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '')
    : '';
  const areaD = pathD ? `${pathD} L ${svgWidth} ${svgHeight} L 0 ${svgHeight} Z` : '';

  return (
    <Box className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '32px 24px', minHeight: 0 }}>
      <Box style={{ maxWidth: 960, margin: '0 auto' }}>

        {/* ABOUT */}
        <Box mb="xl">
          <Text fz={10} fw={700} c="#8b949e" mb={4} style={{ letterSpacing: '0.08em' }}>
            ABOUT
          </Text>
          <Text fz="md" c={selectedRepo.description ? '#f0f6fc' : '#8b949e'} lh={1.6}>
            {selectedRepo.description || 'Chưa có mô tả chi tiết cho repository này.'}
          </Text>
        </Box>

        {/* 4 THẺ THỐNG KÊ NHANH */}
        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md" mb="xl">
          <Paper p="md" bg="#161b22" radius="md" style={{ border: '1px solid #30363d' }}>
            <Group justify="space-between">
              <Text fz="xs" c="#8b949e" fw={500}>Stars</Text>
              <ThemeIcon color="yellow" variant="light" size="sm" radius="md"><IconStar size={14} /></ThemeIcon>
            </Group>
            <Tooltip label={`${starsCount.toLocaleString()} stars`} withArrow>
              <Text fz="xl" fw={700} c="#f0f6fc" mt={4}>{formatCompactNumber(starsCount)}</Text>
            </Tooltip>
          </Paper>

          <Paper p="md" bg="#161b22" radius="md" style={{ border: '1px solid #30363d' }}>
            <Group justify="space-between">
              <Text fz="xs" c="#8b949e" fw={500}>Forks</Text>
              <ThemeIcon color="gray" variant="light" size="sm" radius="md"><IconGitFork size={14} /></ThemeIcon>
            </Group>
            <Tooltip label={`${forksCount.toLocaleString()} forks`} withArrow>
              <Text fz="xl" fw={700} c="#f0f6fc" mt={4}>{formatCompactNumber(forksCount)}</Text>
            </Tooltip>
          </Paper>

          <Paper p="md" bg="#161b22" radius="md" style={{ border: '1px solid #30363d' }}>
            <Group justify="space-between">
              <Text fz="xs" c="#8b949e" fw={500}>Members</Text>
              <ThemeIcon color="teal" variant="light" size="sm" radius="md"><IconUsers size={14} /></ThemeIcon>
            </Group>
            <Tooltip
              label={`${(statsData.totalContributors || rankedContributors.length).toLocaleString()} members`}
              withArrow
            >
              <Text fz="xl" fw={700} c="#f0f6fc" mt={4}>
                {statsData.totalContributors || rankedContributors.length}
              </Text>
            </Tooltip>
          </Paper>

          <Paper p="md" bg="#161b22" radius="md" style={{ border: '1px solid #30363d' }}>
            <Group justify="space-between">
              <Text fz="xs" c="#8b949e" fw={500}>Default Branch</Text>
              <ThemeIcon color="indigo" variant="light" size="sm" radius="md"><IconGitBranch size={14} /></ThemeIcon>
            </Group>
            <Text fz="sm" fw={600} c="#f0f6fc" mt={8} ff="monospace" truncate>{currentBranch}</Text>
          </Paper>
        </SimpleGrid>

        {/* SECTION 1: PULSE (PULL REQUESTS & ISSUES) */}
        <Box mb="xl">
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">

            {/* PULL REQUESTS */}
            <Paper p="md" bg="#161b22" radius="md" style={{ border: '1px solid #30363d' }}>
              <Group justify="space-between" align="flex-start">
                <Box>
                  <Text fz="xs" c="#8b949e" fw={600}>PULL REQUESTS</Text>
                  <Tooltip label={`${(pulse?.pulls.total ?? 0).toLocaleString()} pull requests`} withArrow>
                    <Text fz={24} fw={700} c="#f0f6fc" mt={2} ff="monospace">
                      {formatCompactNumber(pulse?.pulls.total ?? 0)}
                    </Text>
                  </Tooltip>
                </Box>
                <RingProgress
                  size={64}
                  thickness={6}
                  roundCaps
                  sections={[{ value: pulse?.pulls.mergeRate ?? 0, color: 'violet' }]}
                  label={
                    <Text ta="center" fz={11} fw={700} c="#f0f6fc">
                      {pulse?.pulls.mergeRate ?? 0}%
                    </Text>
                  }
                />
              </Group>

              <Stack gap={8} mt="xs">
                <Group justify="space-between">
                  <Group gap={6}>
                    <IconGitMerge size={14} color="#a371f7" />
                    <Text fz={12} c="#c9d1d9">Đã Merge</Text>
                  </Group>
                  <Tooltip label={`${(pulse?.pulls.merged ?? 0).toLocaleString()} PRs`} withArrow>
                    <Text fz={12} fw={600} c="#a371f7" ff="monospace">
                      {formatCompactNumber(pulse?.pulls.merged ?? 0)}
                    </Text>
                  </Tooltip>
                </Group>

                <Group justify="space-between">
                  <Group gap={6}>
                    <IconGitPullRequest size={14} color="#3fb950" />
                    <Text fz={12} c="#c9d1d9">Đang mở (Open)</Text>
                  </Group>
                  <Tooltip label={`${(pulse?.pulls.open ?? 0).toLocaleString()} PRs`} withArrow>
                    <Text fz={12} fw={600} c="#3fb950" ff="monospace">
                      {formatCompactNumber(pulse?.pulls.open ?? 0)}
                    </Text>
                  </Tooltip>
                </Group>

                <Group justify="space-between">
                  <Group gap={6}>
                    <IconGitPullRequest size={14} color="#f85149" />
                    <Text fz={12} c="#c9d1d9">Đã đóng (Closed)</Text>
                  </Group>
                  <Tooltip label={`${(pulse?.pulls.closed ?? 0).toLocaleString()} PRs`} withArrow>
                    <Text fz={12} fw={600} c="#f85149" ff="monospace">
                      {formatCompactNumber(pulse?.pulls.closed ?? 0)}
                    </Text>
                  </Tooltip>
                </Group>
              </Stack>
            </Paper>

            {/* ISSUES RESOLUTION */}
            <Paper p="md" bg="#161b22" radius="md" style={{ border: '1px solid #30363d' }}>
              <Group justify="space-between" align="flex-start">
                <Box>
                  <Text fz="xs" c="#8b949e" fw={600}>ISSUES RESOLUTION</Text>
                  <Tooltip label={`${(pulse?.issues.total ?? 0).toLocaleString()} issues`} withArrow>
                    <Text fz={24} fw={700} c="#f0f6fc" mt={2} ff="monospace">
                      {formatCompactNumber(pulse?.issues.total ?? 0)}
                    </Text>
                  </Tooltip>
                </Box>
                <RingProgress
                  size={64}
                  thickness={6}
                  roundCaps
                  sections={[{ value: pulse?.issues.closeRate ?? 0, color: 'teal' }]}
                  label={
                    <Text ta="center" fz={11} fw={700} c="#f0f6fc">
                      {pulse?.issues.closeRate ?? 0}%
                    </Text>
                  }
                />
              </Group>

              <Stack gap={8} mt="xs">
                <Group justify="space-between">
                  <Group gap={6}>
                    <IconCircleCheck size={14} color="#3fb950" />
                    <Text fz={12} c="#c9d1d9">Đã xử lý xong</Text>
                  </Group>
                  <Tooltip label={`${(pulse?.issues.closed ?? 0).toLocaleString()} issues`} withArrow>
                    <Text fz={12} fw={600} c="#3fb950" ff="monospace">
                      {formatCompactNumber(pulse?.issues.closed ?? 0)}
                    </Text>
                  </Tooltip>
                </Group>

                <Group justify="space-between">
                  <Group gap={6}>
                    <IconCircleDot size={14} color="#d29922" />
                    <Text fz={12} c="#c9d1d9">Đang mở (Open)</Text>
                  </Group>
                  <Tooltip label={`${(pulse?.issues.open ?? 0).toLocaleString()} issues`} withArrow>
                    <Text fz={12} fw={600} c="#d29922" ff="monospace">
                      {formatCompactNumber(pulse?.issues.open ?? 0)}
                    </Text>
                  </Tooltip>
                </Group>

                <Group justify="space-between">
                  <Text fz={11} c="#8b949e">Tỷ lệ hoàn thành</Text>
                  <Badge size="xs" variant="outline" color="teal">
                    {pulse?.issues.closeRate ?? 0}% solved
                  </Badge>
                </Group>
              </Stack>
            </Paper>

          </SimpleGrid>
        </Box>

        {/* SECTION 2: BIỂU ĐỒ LỊCH SỬ COMMIT (TIMELINE WAVE) */}
        <Box mb="xl">
          <Group justify="space-between" mb="xs">
            <Group gap="xs">
              <IconActivity size={16} color="#58a6ff" />
              <Text fz="sm" fw={700} c="#f0f6fc">Tần suất Commit (52 tuần gần nhất)</Text>
            </Group>

            <Group gap={8}>
              {typeof statsData.totalCommits === 'number' && statsData.totalCommits > 0 && (
                <Tooltip label={`${statsData.totalCommits.toLocaleString()} commits trên nhánh mặc định`} withArrow>
                  <Badge size="xs" variant="filled" color="dark" c="#58a6ff">
                    Tổng: {formatCompactNumber(statsData.totalCommits)} commits
                  </Badge>
                </Tooltip>
              )}
              <Badge size="xs" variant="outline" color="gray">
                Đỉnh điểm: {timelineMetrics.peakWeek} commits/tuần
              </Badge>
              <Text fz={11} c="#8b949e">
                1 năm qua: <span style={{ color: '#f0f6fc', fontWeight: 600 }}>{formatCompactNumber(timelineMetrics.totalAllTime)} commits</span>
              </Text>
            </Group>
          </Group>

          <Paper p="lg" radius="md" bg="#161b22" style={{ border: '1px solid #30363d' }}>
            {loadingStats ? (
              <Group justify="center" py={40}><Loader size="sm" color="gray" /></Group>
            ) : points.length > 0 ? (
              <Box>
                <Box style={{ width: '100%', height: 130, position: 'relative' }}>
                  <svg
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    preserveAspectRatio="none"
                    style={{ width: '100%', height: '100%', overflow: 'visible' }}
                  >
                    <defs>
                      <linearGradient id="commitGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1f6feb" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#1f6feb" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>

                    {areaD && <path d={areaD} fill="url(#commitGradient)" />}
                    {pathD && <path d={pathD} fill="none" stroke="#58a6ff" strokeWidth={2.5} strokeLinecap="round" />}

                    {points.map((p, idx) => (
                      <circle
                        key={idx}
                        cx={p.x}
                        cy={p.y}
                        r={p.total > 0 ? 3.5 : 1.5}
                        fill={p.total > 0 ? '#388bfd' : '#30363d'}
                        stroke="#0d1117"
                        strokeWidth={1.5}
                      />
                    ))}
                  </svg>
                </Box>

                <Group justify="space-between" mt="xs">
                  <Text fz={11} c="#8b949e">52 tuần trước</Text>
                  <Text fz={11} c="#58a6ff" fw={600}>Tuần này (Hiện tại)</Text>
                </Group>
              </Box>
            ) : (
              <Box p="xl" ta="center">
                <Text fz="xs" c="#8b949e">Chưa có lịch sử commit nào được ghi nhận trong 1 năm qua.</Text>
              </Box>
            )}
          </Paper>
        </Box>

        {/* SECTION 3: BẢNG XẾP HẠNG THÀNH VIÊN ĐA CHIỀU (IMPACT / PRS / LINES / COMMITS) */}
        <Box mb="xl">
          <Group justify="space-between" align="center" mb="xs" wrap="wrap">
            <Group gap="xs">
              <IconUsers size={16} color="#58a6ff" />
              <Text fz="sm" fw={700} c="#f0f6fc">Đóng góp của các thành viên</Text>
              <Badge size="xs" variant="outline" color="gray">
                {statsData.totalContributors
                  ? `${rankedContributors.length} / ${formatCompactNumber(statsData.totalContributors)} members`
                  : `${rankedContributors.length} members`}
              </Badge>
              <Tooltip label="Làm mới số liệu (Xóa cache GitHub)" withArrow>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="xs"
                  loading={refreshing}
                  onClick={() => fetchStats(true)}
                  aria-label="Làm mới thống kê"
                >
                  <IconRefresh size={13} />
                </ActionIcon>
              </Tooltip>
            </Group>

            {/* BỘ LỌC TIÊU CHÍ ĐÁNH GIÁ ĐÓNG GÓP */}
            <SegmentedControl
              size="xs"
              value={sortBy}
              onChange={(val) => setSortBy(val as any)}
              data={[
                { label: 'Tác động (Impact)', value: 'impact' },
                { label: 'PRs chấp nhận', value: 'prs' },
                { label: 'Dòng code (+ / -)', value: 'lines' },
                { label: 'Số commit', value: 'commits' },
              ]}
              styles={{
                root: { backgroundColor: '#161b22', border: '1px solid #30363d' },
                indicator: { backgroundColor: '#21262d' },
                label: { color: '#c9d1d9', fontSize: 11 },
              }}
            />
          </Group>

          {/* GHI CHÚ MINH BẠCH VỀ CƠ CHẾ ĐÓNG GÓP */}
          <Group gap={6} mb="sm" c="#8b949e">
            <IconInfoCircle size={13} />
            <Text fz={11}>
              {sortBy === 'impact' && 'Điểm Impact Score kết hợp: PRs đã được duyệt merge (30đ) + Chu kỳ Commit (2đ) + Quy mô dòng code.'}
              {sortBy === 'prs' && 'Xếp hạng theo số Pull Request đã được chấp nhận (Merged PRs) vào codebase.'}
              {sortBy === 'lines' && 'Xếp hạng theo tổng dung lượng dòng code can thiệp (+thêm / -xóa).'}
              {sortBy === 'commits' && 'Xếp hạng theo số lượng commits truyền thống.'}
            </Text>
          </Group>

          <Paper radius="md" bg="#161b22" style={{ border: '1px solid #30363d', overflow: 'hidden' }}>
            {loadingStats ? (
              <Group justify="center" py={40}><Loader size="sm" color="gray" /></Group>
            ) : rankedContributors.length > 0 ? (
              <Stack gap={0}>
                {rankedContributors.map((c, index) => {
                  const author = c.author || {};
                  const isTop1 = index === 0;

                  return (
                    <Box
                      key={author.id || index}
                      p="md"
                      style={{
                        borderBottom: index === rankedContributors.length - 1 ? 'none' : '1px solid #21262d',
                        backgroundColor: '#0d1117',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 16,
                      }}
                    >
                      <Group gap="md" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                        <Text fz="xs" fw={700} c={isTop1 ? '#e3b341' : '#8b949e'} w={16} ta="center" ff="monospace">
                          #{index + 1}
                        </Text>
                        <Avatar src={author.avatar_url} size={36} radius="xl" />
                        <Box style={{ overflow: 'hidden' }}>
                          <Group gap={6} wrap="nowrap">
                            <Text
                              component="a"
                              href={author.html_url}
                              target="_blank"
                              fz="sm"
                              fw={600}
                              c="#f0f6fc"
                              style={{ textDecoration: 'none', '&:hover': { color: '#58a6ff' } }}
                              truncate
                            >
                              {author.name && author.name !== author.login ? (
                                <>
                                  {author.name}{' '}
                                  <span style={{ color: '#8b949e', fontSize: 12, fontWeight: 400 }}>
                                    (@{author.login})
                                  </span>
                                </>
                              ) : (
                                author.login || 'Unknown'
                              )}
                            </Text>
                            {isTop1 && (
                              <Badge size="xs" color="yellow" variant="light" leftSection={<IconSparkles size={11} />}>
                                Dẫn đầu
                              </Badge>
                            )}
                          </Group>

                          {/* ĐA CHIỀU: PRS MERGED, DÒNG CODE VÀ COMMITS */}
                          <Group gap={8} mt={4} wrap="wrap">
                            {/* BADGE CHO NHÓM TRƯỞNG / REVIEWER MERGE CODE */}
                            {c.mergedByCount > 0 && (
                              <Badge size="xs" variant="light" color="cyan" leftSection={<IconGitMerge size={11} />}>
                                {c.mergedPRs === 0 ? 'Nhóm trưởng • ' : ''}Đã duyệt {c.mergedByCount} PRs
                              </Badge>
                            )}

                            {/* BADGE CHO NGƯỜI TẠO PR */}
                            {c.mergedPRs > 0 ? (
                              <Badge size="xs" variant="outline" color="violet" leftSection={<IconGitPullRequest size={11} />}>
                                {c.mergedPRs} PRs đã merge
                              </Badge>
                            ) : c.commits > 0 ? (
                              <Badge size="xs" variant="outline" color="gray">
                                Direct Committer
                              </Badge>
                            ) : c.mergedByCount === 0 ? (
                              <Badge size="xs" variant="outline" color="cyan">
                                {c.role || 'Collaborator'}
                              </Badge>
                            ) : null}

                            {c.linesChanged > 0 ? (
                              <Tooltip
                                label={`+${(c.additions || 0).toLocaleString()} thêm / -${(c.deletions || 0).toLocaleString()} xóa (${(c.linesChanged || 0).toLocaleString()} dòng thay đổi)`}
                                withArrow
                              >
                                <Text fz={11} c="#8b949e" ff="monospace">
                                  <span style={{ color: '#3fb950' }}>+{formatCompactNumber(c.additions || 0)}</span> /{' '}
                                  <span style={{ color: '#f85149' }}>-{formatCompactNumber(c.deletions || 0)}</span> dòng
                                </Text>
                              </Tooltip>
                            ) : (
                              <Text fz={11} c="#8b949e" ff="monospace">
                                0 dòng thay đổi
                              </Text>
                            )}

                            <Text fz={11} c="#8b949e">
                              • {formatCompactNumber(c.commits || 0)} commits
                            </Text>
                          </Group>
                        </Box>
                      </Group>

                      {/* Thanh đo tỷ trọng theo tiêu chí đang chọn */}
                      <Box style={{ width: 140 }} visibleFrom="sm">
                        <Progress value={c.percent} size={6} radius="xl" color={isTop1 ? 'yellow' : 'indigo'} />
                      </Box>

                      {/* Badge giá trị theo tiêu chí đang chọn */}
                      <Badge size="sm" variant="subtle" color={isTop1 ? 'yellow' : 'gray'} ff="monospace">
                        {sortBy === 'impact' && `${c.impactScore ?? 0} pts`}
                        {sortBy === 'prs' && `${c.mergedPRs > 0 ? `${c.mergedPRs} PRs tạo` : `${c.mergedByCount} PRs duyệt`}`}
                        {sortBy === 'lines' && `${formatCompactNumber(c.linesChanged ?? 0)} dòng`}
                        {sortBy === 'commits' && `${formatCompactNumber(c.commits ?? 0)} commits`}
                      </Badge>
                    </Box>
                  );
                })}
              </Stack>
            ) : (
              <Box p="xl" ta="center">
                <Text fz="xs" c="#8b949e">Chưa có dữ liệu thành viên đóng góp.</Text>
              </Box>
            )}
          </Paper>
        </Box>

        {/* SECTION 4: TỶ LỆ NGÔN NGỮ */}
        {languageStats.length > 0 && (
          <Box mb="xl">
            <Text fz={10} fw={700} c="#8b949e" mb="xs" style={{ letterSpacing: '0.08em' }}>
              LANGUAGES
            </Text>

            <Progress.Root size="sm" radius="xl" mb="md" style={{ backgroundColor: '#21262d' }}>
              {languageStats.map((lang) => (
                <Tooltip key={lang.name} label={`${lang.name}: ${lang.percent}% (${lang.count} files)`} withArrow>
                  <Progress.Section value={lang.percent} color={lang.color} />
                </Tooltip>
              ))}
            </Progress.Root>

            <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
              {languageStats.map((lang) => (
                <Group key={lang.name} gap="xs">
                  <Box w={8} h={8} style={{ borderRadius: '50%', backgroundColor: lang.color }} />
                  <Text fz={12} c="#f0f6fc" fw={500}>
                    {lang.name}
                  </Text>
                  <Text fz={12} c="#8b949e">
                    {lang.percent}%
                  </Text>
                </Group>
              ))}
            </SimpleGrid>
          </Box>
        )}

      </Box>
    </Box>
  );
}
