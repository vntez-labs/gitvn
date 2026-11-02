'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Group,
  Text,
  Avatar,
  Badge,
  Paper,
  SimpleGrid,
  Stack,
  Loader,
  Button,
  TextInput,
  Tabs,
  Tooltip,
  Progress,
  Alert,
} from '@mantine/core';
import {
  IconSearch,
  IconBrandGithub,
  IconStar,
  IconGitFork,
  IconExternalLink,
  IconMail,
  IconMapPin,
  IconLink,
  IconUsers,
  IconGitCommit,
  IconGitPullRequest,
  IconCircleDot,
  IconFlame,
  IconAlertCircle,
  IconCalendar,
  IconBox,
  IconFileCheck,
  IconGitMerge,
  IconMessageCode,
} from '@tabler/icons-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import axios from 'axios';

const LEVEL_COLORS: Record<string, string> = {
  NONE: '#161b22',
  FIRST_QUARTILE: '#0e4429',
  SECOND_QUARTILE: '#006d32',
  THIRD_QUARTILE: '#26a641',
  FOURTH_QUARTILE: '#39d353',
};

function formatBytes(bytes: number) {
  if (!bytes || bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function UserProfileContent() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;

  const [data, setData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'readme' | 'repos'>('overview');

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    setErrorMsg(null);

    axios
      .get(`/api/github/user/${username}`)
      .then((res) => {
        setData(res.data);
      })
      .catch((err) => {
        console.error('[UserProfile] Lỗi tải dữ liệu:', err);
        setErrorMsg(err.response?.data?.error || 'Có lỗi xảy ra khi lấy dữ liệu');
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [username]);

  const handleSearch = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/u/${searchInput.trim()}`);
    }
  };

  return (
    <Box
      style={{
        backgroundColor: '#0d1117',
        color: '#c9d1d9',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <style>{`
        .readme-container { color: #c9d1d9; font-size: 14px; line-height: 1.6; }
        .readme-container img { max-width: 100%; display: inline-block; margin: 4px 2px; vertical-align: middle; }
        .readme-container h1, .readme-container h2, .readme-container h3 { color: #f0f6fc; margin-top: 16px; margin-bottom: 8px; }
        .readme-container hr { border: none; border-top: 1px solid #30363d; margin: 20px 0; }
        .readme-container a { color: #58a6ff; text-decoration: none; }
        .readme-container a:hover { text-decoration: underline; }
      `}</style>

      {/* HEADER */}
      <Box component="header" px="xl" py="sm" style={{ borderBottom: '1px solid #30363d', backgroundColor: '#161b22', flexShrink: 0 }}>
        <Group justify="space-between" align="center" style={{ maxWidth: 1240, margin: '0 auto' }}>
          <Group gap="sm" style={{ cursor: 'pointer' }} onClick={() => router.push('/')}>
            <Box w={32} h={32} style={{ borderRadius: 8, background: '#238636', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconBrandGithub size={20} color="white" />
            </Box>
            <Box>
              <Text fw={700} fz="sm" c="#f0f6fc" ff="monospace" lh={1.1}>
                GitVN <span style={{ color: '#58a6ff' }}>Insights</span>
              </Text>
              <Text fz={10} c="#8b949e">Real Developer Audit & Metrics</Text>
            </Box>
          </Group>

          <form onSubmit={handleSearch} style={{ maxWidth: 360, width: '100%' }}>
            <TextInput
              placeholder="Nhập username GitHub..."
              size="xs"
              value={searchInput}
              onChange={(e) => setSearchInput(e.currentTarget.value)}
              leftSection={<IconSearch size={14} color="#8b949e" />}
              styles={{ input: { backgroundColor: '#0d1117', borderColor: '#30363d', color: '#f0f6fc' } }}
            />
          </form>

          <Button size="compact-xs" variant="light" color="gray" onClick={() => router.push('/')} styles={{ root: { backgroundColor: '#21262d', color: '#c9d1d9' } }}>
            Về Workspace ↗
          </Button>
        </Group>
      </Box>

      {/* MAIN BODY */}
      {loading ? (
        <Group justify="center" mt={120} style={{ flex: 1 }}>
          <Loader size="md" color="gray" />
        </Group>
      ) : errorMsg || !data?.user ? (
        <Box ta="center" mt={100} style={{ flex: 1, maxWidth: 500, margin: '100px auto' }}>
          <Alert icon={<IconAlertCircle size={16} />} title="Không thể tải hồ sơ" color="red">
            {errorMsg || `Không tìm thấy người dùng @${username}`}
          </Alert>
        </Box>
      ) : (
        <Box px="lg" py="xl" style={{ maxWidth: 1240, width: '100%', margin: '0 auto', flex: 1 }}>
          <Box style={{ display: 'grid', gridTemplateColumns: '290px 1fr', gap: 32, alignItems: 'flex-start' }}>

            {/* CỘT TRÁI: THÔNG TIN USER, PRO, ACHIEVEMENTS */}
            <Stack gap="md">
              <Avatar
                src={data.user?.avatar_url}
                size={260}
                radius="50%"
                style={{ border: '2px solid #30363d', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}
              />

              <Box>
                <Text fz={22} fw={700} c="#f0f6fc" lh={1.2}>
                  {data.user?.name || data.user?.login}
                </Text>
                <Group gap="xs" mt={3}>
                  <Text fz={15} c="#8b949e" ff="monospace">
                    {data.user?.login}
                  </Text>
                  {data.isPro && (
                    <Badge size="xs" variant="outline" radius="xl" styles={{ root: { borderColor: '#a371f7', color: '#d2a8ff', backgroundColor: 'rgba(163, 113, 247, 0.1)', fontWeight: 700 } }}>
                      ★ PRO
                    </Badge>
                  )}
                </Group>
              </Box>

              {data.user?.bio && (
                <Text fz={13} c="#f0f6fc" lh={1.5}>
                  {data.user.bio}
                </Text>
              )}

              <Button
                component="a"
                href={data.user?.html_url}
                target="_blank"
                fullWidth
                size="xs"
                variant="default"
                rightSection={<IconExternalLink size={13} />}
                styles={{ root: { backgroundColor: '#21262d', borderColor: '#30363d', color: '#f0f6fc' } }}
              >
                Trang cá nhân GitHub
              </Button>

              <Group gap="xs" fz={12} c="#8b949e">
                <IconUsers size={14} />
                <Text fz={12}>
                  <b style={{ color: '#f0f6fc' }}>{data.user?.followers ?? 0}</b> followers •{' '}
                  <b style={{ color: '#f0f6fc' }}>{data.user?.following ?? 0}</b> following
                </Text>
              </Group>

              <Stack gap={6} fz={12} c="#8b949e">
                {data.user?.email && (
                  <Group gap="xs">
                    <IconMail size={14} />
                    <Text fz={12}>{data.user.email}</Text>
                  </Group>
                )}
                {data.user?.location && (
                  <Group gap="xs">
                    <IconMapPin size={14} />
                    <Text fz={12}>{data.user.location}</Text>
                  </Group>
                )}
                {data.user?.blog && (
                  <Group gap="xs">
                    <IconLink size={14} />
                    <Text component="a" href={data.user.blog.startsWith('http') ? data.user.blog : `https://${data.user.blog}`} target="_blank" fz={12} c="#58a6ff" truncate>
                      {data.user.blog}
                    </Text>
                  </Group>
                )}
              </Stack>

              {/* ACHIEVEMENTS */}
              {data.achievements?.length > 0 && (
                <Box pt="xs" style={{ borderTop: '1px solid #21262d' }}>
                  <Group justify="space-between" mb="xs">
                    <Text fz={12} fw={700} c="#f0f6fc">
                      Achievements ({data.achievements.length})
                    </Text>
                    <Text component="a" href={`https://github.com/${data.user?.login}?tab=achievements`} target="_blank" fz={10} c="#58a6ff">
                      Xác thực ↗
                    </Text>
                  </Group>

                  <Group gap={8} wrap="wrap">
                    {data.achievements.map((item: any, idx: number) => (
                      <Tooltip key={idx} label={`${item.name} ${item.tier ? `(${item.tier})` : ''}`} withArrow>
                        <Box component="a" href={`https://github.com/${data.user?.login}?tab=achievements`} target="_blank" style={{ position: 'relative', display: 'block' }}>
                          <img src={item.iconUrl} alt={item.name} width={54} height={54} style={{ display: 'block', objectFit: 'contain' }} />
                          {item.tier && (
                            <Badge size="xs" variant="filled" color="dark" radius="xl" style={{ position: 'absolute', bottom: -2, right: -4, border: '1px solid #30363d', fontSize: 9, padding: '0 4px' }}>
                              {item.tier}
                            </Badge>
                          )}
                        </Box>
                      </Tooltip>
                    ))}
                  </Group>
                </Box>
              )}

              {/* ORGANIZATIONS */}
              {data.orgs?.length > 0 && (
                <Box pt="xs" style={{ borderTop: '1px solid #21262d' }}>
                  <Text fz={12} fw={700} c="#f0f6fc" mb="xs">Organizations</Text>
                  <Group gap={6} wrap="wrap">
                    {data.orgs.map((org: any) => (
                      <Tooltip key={org.login} label={org.login} withArrow>
                        <Avatar src={org.avatarUrl} size={28} radius="sm" component="a" href={org.url} target="_blank" />
                      </Tooltip>
                    ))}
                  </Group>
                </Box>
              )}
            </Stack>

            {/* CỘT PHẢI: HEATMAP & CÁC CHIỀU ĐÁNH GIÁ CHUYÊN SÂU */}
            <Box style={{ minWidth: 0 }}>
              <Tabs
                value={activeTab}
                onChange={(val) => setActiveTab(val as any)}
                styles={{
                  root: { marginBottom: 20 },
                  list: { borderBottom: '1px solid #30363d' },
                  tab: { color: '#8b949e', fontSize: 13, fontWeight: 500, padding: '8px 14px', '&[data-active]': { color: '#f0f6fc', borderBottomColor: '#f78166', fontWeight: 600 } },
                }}
              >
                <Tabs.List>
                  <Tabs.Tab value="overview" leftSection={<IconFlame size={15} color="#f78166" />}>
                    Stats & Activity Matrix
                  </Tabs.Tab>
                  {data.readme && (
                    <Tabs.Tab value="readme" leftSection={<IconBrandGithub size={15} />}>
                      Profile README
                    </Tabs.Tab>
                  )}
                  <Tabs.Tab value="repos" leftSection={<IconStar size={15} />}>
                    Top Repositories ({data.pinnedRepos?.length ?? 0})
                  </Tabs.Tab>
                </Tabs.List>
              </Tabs>

              {activeTab === 'overview' && (
                <Stack gap="lg">

                  {/* BẢNG 1: THÂM NIÊN & TÍNH KỶ LUẬT (SENIORITY & STREAK) */}
                  <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                    <Paper p="md" bg="#161b22" radius="md" style={{ border: '1px solid #30363d' }}>
                      <Group justify="space-between">
                        <Text fz="xs" c="#8b949e" fw={600}>THÂM NIÊN GITHUB</Text>
                        <IconCalendar size={16} color="#58a6ff" />
                      </Group>
                      <Text fz={22} fw={700} c="#f0f6fc" mt={2} ff="monospace">
                        {data.seniority?.years} năm {data.seniority?.months} tháng
                      </Text>
                      <Text fz={11} c="#8b949e" mt={4}>
                        Tham gia từ: {data.seniority?.formattedJoined}
                      </Text>
                    </Paper>

                    <Paper p="md" bg="#161b22" radius="md" style={{ border: '1px solid #30363d' }}>
                      <Group justify="space-between">
                        <Text fz="xs" c="#8b949e" fw={600}>CHUỖI HOẠT ĐỘNG (STREAK)</Text>
                        <IconFlame size={16} color="#f78166" />
                      </Group>
                      <Text fz={22} fw={700} c="#f78166" mt={2} ff="monospace">
                        {data.streak?.maxStreak} ngày <span style={{ fontSize: 13, color: '#8b949e', fontWeight: 400 }}>kỷ lục</span>
                      </Text>
                      <Text fz={11} c="#8b949e" mt={4}>
                        Chuỗi hiện tại: <b style={{ color: '#f0f6fc' }}>{data.streak?.currentStreak} ngày liên tiếp</b>
                      </Text>
                    </Paper>

                    <Paper p="md" bg="#161b22" radius="md" style={{ border: '1px solid #30363d' }}>
                      <Group justify="space-between">
                        <Text fz="xs" c="#8b949e" fw={600}>ĐỘ HOÀN THIỆN (SHIP-READY)</Text>
                        <IconBox size={16} color="#3fb950" />
                      </Group>
                      <Text fz={22} fw={700} c="#3fb950" mt={2} ff="monospace">
                        {data.shipReadiness?.totalReleases} <span style={{ fontSize: 13, color: '#8b949e', fontWeight: 400 }}>Releases</span>
                      </Text>
                      <Text fz={11} c="#8b949e" mt={4}>
                        {data.shipReadiness?.licenseRate}% repo có License chuẩn
                      </Text>
                    </Paper>
                  </SimpleGrid>

                  {/* BẢNG 2: HEATMAP CONTRIBUTION CALENDAR 52 TUẦN */}
                  <Paper p="lg" radius="md" bg="#161b22" style={{ border: '1px solid #30363d' }}>
                    <Group justify="space-between" align="baseline" mb="md">
                      <Box>
                        <Text fz={16} fw={700} c="#f0f6fc">
                          {data.stats?.totalContributions ?? 0} đóng góp trong 1 năm qua
                        </Text>
                        <Text fz={11} c="#8b949e">
                          Bao gồm commits, pull requests, code reviews và mở issues
                        </Text>
                      </Box>

                      <Group gap={4} align="center">
                        <Text fz={10} c="#8b949e">Ít</Text>
                        {Object.entries(LEVEL_COLORS).map(([lvl, color]) => (
                          <Box key={lvl} w={10} h={10} style={{ backgroundColor: color, borderRadius: 2 }} />
                        ))}
                        <Text fz={10} c="#8b949e">Nhiều</Text>
                      </Group>
                    </Group>

                    <Box style={{ overflowX: 'auto', paddingBottom: 6 }}>
                      <Box style={{ display: 'flex', gap: 3, minWidth: 780 }}>
                        {data.calendarWeeks?.map((week: any, wIdx: number) => (
                          <Box key={wIdx} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {week.contributionDays?.map((day: any) => (
                              <Tooltip key={day.date} label={`${day.contributionCount} đóng góp vào ${day.date}`} withArrow>
                                <Box
                                  w={11}
                                  h={11}
                                  style={{
                                    backgroundColor: LEVEL_COLORS[day.contributionLevel] || '#161b22',
                                    borderRadius: 2,
                                    cursor: 'pointer',
                                    outline: '1px solid rgba(255, 255, 255, 0.04)',
                                  }}
                                />
                              </Tooltip>
                            ))}
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </Paper>

                  {/* BẢNG 3: BỐN THẺ CHỈ SỐ CỘNG TÁC THẬT */}
                  <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                    <Paper p="md" bg="#161b22" radius="md" style={{ border: '1px solid #30363d' }}>
                      <Group justify="space-between">
                        <Text fz="xs" c="#8b949e">Commits (1 năm qua)</Text>
                        <IconGitCommit size={15} color="#3fb950" />
                      </Group>
                      <Text fz={22} fw={700} c="#f0f6fc" mt={2} ff="monospace">
                        {data.stats?.totalCommits ?? 0}
                      </Text>
                      <Text fz={10} c="#8b949e" mt={4}>Trên các repo gốc</Text>
                    </Paper>

                    <Paper p="md" bg="#161b22" radius="md" style={{ border: '1px solid #30363d' }}>
                      <Group justify="space-between">
                        <Text fz="xs" c="#8b949e">Pull Requests</Text>
                        <IconGitPullRequest size={15} color="#a371f7" />
                      </Group>
                      <Text fz={22} fw={700} c="#a371f7" mt={2} ff="monospace">
                        {data.stats?.totalPRs ?? 0}
                      </Text>
                      <Text fz={10} c="#8b949e" mt={4}>
                        {data.stats?.recentPRs ?? 0} trong năm qua • {data.stats?.totalReviews ?? 0} reviews
                      </Text>
                    </Paper>

                    <Paper p="md" bg="#161b22" radius="md" style={{ border: '1px solid #30363d' }}>
                      <Group justify="space-between">
                        <Text fz="xs" c="#8b949e">Stars Hữu Cơ</Text>
                        <IconStar size={15} color="#e3b341" />
                      </Group>
                      <Text fz={22} fw={700} c="#e3b341" mt={2} ff="monospace">
                        ★ {data.stats?.totalStars ?? 0}
                      </Text>
                      <Text fz={10} c="#8b949e" mt={4}>{data.stats?.totalForks ?? 0} lượt fork từ người khác</Text>
                    </Paper>

                    <Paper p="md" bg="#161b22" radius="md" style={{ border: '1px solid #30363d' }}>
                      <Group justify="space-between">
                        <Text fz="xs" c="#8b949e">Phạm Vi Đóng Góp</Text>
                        <IconGitMerge size={15} color="#58a6ff" />
                      </Group>
                      <Text fz={22} fw={700} c="#58a6ff" mt={2} ff="monospace">
                        {data.stats?.contributedRepoCount ?? 0}
                      </Text>
                      <Text fz={10} c="#8b949e" mt={4}>Repositories đã cống hiến</Text>
                    </Paper>
                  </SimpleGrid>

                  {/* BẢNG 4: PHÂN BỔ NGÔN NGỮ BẰNG BYTE THẬT */}
                  {data.languages?.length > 0 && (
                    <Paper p="lg" radius="md" bg="#161b22" style={{ border: '1px solid #30363d' }}>
                      <Group justify="space-between" mb="xs">
                        <Text fz="sm" fw={700} c="#f0f6fc">
                          Thống kê Ngôn ngữ Lập trình (Toàn bộ mã nguồn)
                        </Text>
                        <Text fz={11} c="#8b949e">
                          Tổng dung lượng: <b style={{ color: '#f0f6fc' }}>{formatBytes(data.totalCodeBytes ?? 0)}</b> ({data.languages.length} ngôn ngữ)
                        </Text>
                      </Group>

                      <Progress.Root size="sm" radius="xl" mb="md" style={{ backgroundColor: '#21262d' }}>
                        {data.languages.slice(0, 8).map((lang: any) => (
                          <Tooltip key={lang.name} label={`${lang.name}: ${lang.percent}% (${formatBytes(lang.size)})`} withArrow>
                            <Progress.Section value={lang.percent} color={lang.color} />
                          </Tooltip>
                        ))}
                      </Progress.Root>

                      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
                        {data.languages.slice(0, 8).map((lang: any) => (
                          <Group key={lang.name} gap="xs">
                            <Box w={9} h={9} style={{ borderRadius: '50%', backgroundColor: lang.color }} />
                            <Box style={{ flex: 1, minWidth: 0 }}>
                              <Text fz={12} c="#f0f6fc" fw={600} truncate>{lang.name}</Text>
                              <Text fz={11} c="#8b949e">{lang.percent}% ({formatBytes(lang.size)})</Text>
                            </Box>
                          </Group>
                        ))}
                      </SimpleGrid>
                    </Paper>
                  )}
                </Stack>
              )}

              {/* TAB 2: PROFILE README */}
              {activeTab === 'readme' && data.readme && (
                <Paper p="xl" radius="md" bg="#0d1117" style={{ border: '1px solid #30363d', minHeight: 300 }}>
                  <Box className="readme-container">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                      {data.readme}
                    </ReactMarkdown>
                  </Box>
                </Paper>
              )}

              {/* TAB 3: TOP REPOSITORIES */}
              {activeTab === 'repos' && (
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  {data.pinnedRepos?.map((repo: any) => (
                    <Paper key={repo.name} p="md" radius="md" bg="#161b22" style={{ border: '1px solid #30363d' }}>
                      <Text component="a" href={repo.url} target="_blank" fz="sm" fw={600} c="#58a6ff" style={{ textDecoration: 'none' }}>
                        {repo.name}
                      </Text>
                      <Text fz={11} c="#8b949e" mt={4} lineClamp={2}>
                        {repo.description || 'Không có mô tả.'}
                      </Text>
                      <Group justify="space-between" mt="md" fz={11} c="#8b949e">
                        <Group gap={6}>
                          {repo.primaryLanguage && (
                            <>
                              <Box w={8} h={8} style={{ borderRadius: '50%', backgroundColor: repo.primaryLanguage.color }} />
                              <Text fz={11}>{repo.primaryLanguage.name}</Text>
                            </>
                          )}
                        </Group>
                        <Group gap="xs">
                          <Group gap={3}>
                            <IconStar size={13} />
                            <Text fz={11}>{repo.stargazerCount ?? 0}</Text>
                          </Group>
                          <Group gap={3}>
                            <IconGitFork size={13} />
                            <Text fz={11}>{repo.forkCount ?? 0}</Text>
                          </Group>
                        </Group>
                      </Group>
                    </Paper>
                  ))}
                </SimpleGrid>
              )}

            </Box>
          </Box>
        </Box>
      )}

      {/* FOOTER */}
      <Box component="footer" px="xl" py="md" mt="auto" style={{ borderTop: '1px solid #21262d', backgroundColor: '#161b22', flexShrink: 0 }}>
        <Group justify="space-between" align="center" style={{ maxWidth: 1240, margin: '0 auto' }}>
          <Group gap="xs">
            <Box w={18} h={18} style={{ borderRadius: 4, background: '#238636', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconBrandGithub size={12} color="white" />
            </Box>
            <Text fz={11} c="#8b949e">GitVN Insights • Trích xuất trực tiếp từ GitHub GraphQL Engine</Text>
          </Group>
          <Text component="a" href={`https://github.com/${username}`} target="_blank" fz={11} c="#58a6ff" style={{ textDecoration: 'none' }}>
            @{username} trên GitHub ↗
          </Text>
        </Group>
      </Box>
    </Box>
  );
}

export default function UserProfilePage() {
  return (
    <Suspense
      fallback={
        <Box style={{ backgroundColor: '#0d1117', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader size="md" color="gray" />
        </Box>
      }
    >
      <UserProfileContent />
    </Suspense>
  );
}
