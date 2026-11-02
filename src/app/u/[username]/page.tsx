"use client";

import {
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Group,
  Paper,
  Progress,
  SimpleGrid,
  Skeleton,
  Stack,
  Tabs,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconBox,
  IconBrandGithub,
  IconCalendar,
  IconExternalLink,
  IconFlame,
  IconGitCommit,
  IconGitFork,
  IconGitMerge,
  IconGitPullRequest,
  IconLink,
  IconMail,
  IconMapPin,
  IconSearch,
  IconStar,
  IconUsers,
} from "@tabler/icons-react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { UserProfileSidebar } from "@/components/profile/UserProfileSidebar";
import { UserStatsMatrix } from "@/components/profile/UserStatsMatrix";
import { GitVNLogo } from "@/components/brand/GitVNLogo";
import { formatCompactNumber } from "@/lib/time";

const LEVEL_COLORS: Record<string, string> = {
  NONE: "#ebedf0",
  FIRST_QUARTILE: "#9be9a8",
  SECOND_QUARTILE: "#40c463",
  THIRD_QUARTILE: "#30a14e",
  FOURTH_QUARTILE: "#216e39",
};

function formatBytes(bytes: number) {
  if (!bytes || bytes === 0) return "0 B";
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
  const [searchInput, setSearchInput] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "readme" | "repos">(
    "overview",
  );

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
        console.error("[UserProfile] Lỗi tải dữ liệu:", err);
        setErrorMsg(
          err.response?.data?.error || "Có lỗi xảy ra khi lấy dữ liệu",
        );
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
        backgroundColor: "#f8fafc",
        color: "#0f172a",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{`
        .readme-container { color: #334155; font-size: 14px; line-height: 1.6; }
        .readme-container img { max-width: 100%; display: inline-block; margin: 4px 2px; vertical-align: middle; }
        .readme-container h1, .readme-container h2, .readme-container h3 { color: #0f172a; margin-top: 16px; margin-bottom: 8px; }
        .readme-container hr { border: none; border-top: 1px solid #e2e8f0; margin: 20px 0; }
        .readme-container a { color: #fb291a; text-decoration: none; }
        .readme-container a:hover { text-decoration: underline; }
      `}</style>

      {/* HEADER */}
      <Box
        component="header"
        px="xl"
        py="sm"
        style={{
          borderBottom: "1px solid #e2e8f0",
          backgroundColor: "#ffffff",
          flexShrink: 0,
        }}
      >
        <Group
          justify="space-between"
          align="center"
          style={{ maxWidth: 1240, margin: "0 auto" }}
        >
          <Group
            gap="sm"
            style={{ cursor: "pointer" }}
            onClick={() => router.push("/")}
          >
            <GitVNLogo size={32} />
            <Box>
              <Text fw={700} fz="sm" c="#0f172a" ff="monospace" lh={1.1}>
                GitVN <span style={{ color: "#fb291a" }}>Insights</span>
              </Text>
              <Text fz={10} c="#64748b">
                Real Developer Audit & Metrics
              </Text>
            </Box>
          </Group>

          <form
            onSubmit={handleSearch}
            style={{ maxWidth: 360, width: "100%" }}
          >
            <TextInput
              placeholder="Nhập username GitHub..."
              size="xs"
              value={searchInput}
              onChange={(e) => setSearchInput(e.currentTarget.value)}
              leftSection={<IconSearch size={14} color="#94a3b8" />}
              styles={{
                input: {
                  backgroundColor: "#ffffff",
                  borderColor: "#cbd5e1",
                  color: "#0f172a",
                },
              }}
            />
          </form>

          <Button
            size="compact-xs"
            variant="default"
            onClick={() => router.push("/")}
          >
            Về Workspace ↗
          </Button>
        </Group>
      </Box>

      {/* MAIN BODY */}
      {loading ? (
        <Box
          px="lg"
          py="xl"
          style={{
            flex: 1,
            maxWidth: 1280,
            margin: "0 auto",
            width: "100%",
            display: "grid",
            gridTemplateColumns: "296px 1fr",
            gap: 32,
          }}
        >
          {/* Cột trái: Profile skeleton */}
          <Box>
            <Skeleton height={260} circle mb="md" />
            <Skeleton height={28} width="70%" radius="sm" mb="xs" />
            <Skeleton height={18} width="45%" radius="sm" mb="md" />
            <Skeleton height={14} width="90%" radius="sm" mb="sm" />
            <Skeleton height={14} width="80%" radius="sm" mb="lg" />
            <Skeleton height={32} radius="sm" mb="md" />
            <Group gap="xs">
              <Skeleton height={16} width={80} radius="sm" />
              <Skeleton height={16} width={80} radius="sm" />
            </Group>
          </Box>

          {/* Cột phải: Repositories skeleton */}
          <Box>
            <Skeleton height={36} radius="sm" mb="lg" />
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Paper
                  key={i}
                  p="md"
                  radius="md"
                  style={{ border: "1px solid #e2e8f0" }}
                >
                  <Skeleton height={18} width="60%" radius="sm" mb="xs" />
                  <Skeleton height={14} width="85%" radius="sm" mb="xs" />
                  <Skeleton height={14} width="50%" radius="sm" mb="md" />
                  <Group justify="space-between">
                    <Skeleton height={12} width={60} radius="sm" />
                    <Skeleton height={12} width={40} radius="sm" />
                  </Group>
                </Paper>
              ))}
            </SimpleGrid>
          </Box>
        </Box>
      ) : errorMsg || !data?.user ? (
        <Box
          ta="center"
          mt={100}
          style={{ flex: 1, maxWidth: 500, margin: "100px auto" }}
        >
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Không thể tải hồ sơ"
            color="red"
          >
            {errorMsg || `Không tìm thấy người dùng @${username}`}
          </Alert>
        </Box>
      ) : (
        <Box
          px="lg"
          py="xl"
          style={{ maxWidth: 1240, width: "100%", margin: "0 auto", flex: 1 }}
        >
          <Box
            style={{
              display: "grid",
              gridTemplateColumns: "290px 1fr",
              gap: 32,
              alignItems: "flex-start",
            }}
          >
            {/* CỘT TRÁI: THÔNG TIN USER, PRO, ACHIEVEMENTS */}
            <UserProfileSidebar
              data={data}
              formatCompactNumber={formatCompactNumber}
            />

            {/* CỘT PHẢI: HEATMAP & CÁC CHIỀU ĐÁNH GIÁ CHUYÊN SÂU */}
            <Box style={{ minWidth: 0 }}>
              <Tabs
                value={activeTab}
                onChange={(val) => setActiveTab(val as any)}
                styles={{
                  root: { marginBottom: 20 },
                  list: { borderBottom: "1px solid #e2e8f0" },
                  tab: {
                    color: "#64748b",
                    fontSize: 13,
                    fontWeight: 500,
                    padding: "8px 14px",
                    "&[data-active]": {
                      color: "#fb291a",
                      borderBottomColor: "#fb291a",
                      fontWeight: 600,
                    },
                  },
                }}
              >
                <Tabs.List>
                  <Tabs.Tab
                    value="overview"
                    leftSection={<IconFlame size={15} color="#fb291a" />}
                  >
                    Stats & Activity Matrix
                  </Tabs.Tab>
                  {data.readme && (
                    <Tabs.Tab
                      value="readme"
                      leftSection={<IconBrandGithub size={15} />}
                    >
                      Profile README
                    </Tabs.Tab>
                  )}
                  <Tabs.Tab value="repos" leftSection={<IconStar size={15} />}>
                    Top Repositories ({data.pinnedRepos?.length ?? 0})
                  </Tabs.Tab>
                </Tabs.List>
              </Tabs>

              {activeTab === "overview" && (
                <UserStatsMatrix
                  data={data}
                  formatCompactNumber={formatCompactNumber}
                />
              )}

              {/* TAB 2: PROFILE README */}
              {activeTab === "readme" && data.readme && (
                <Paper
                  p="xl"
                  radius="md"
                  bg="#ffffff"
                  style={{
                    border: "1px solid #e2e8f0",
                    minHeight: 300,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  }}
                >
                  <Box className="readme-container">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                    >
                      {data.readme}
                    </ReactMarkdown>
                  </Box>
                </Paper>
              )}

              {/* TAB 3: TOP REPOSITORIES */}
              {activeTab === "repos" && (
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  {data.pinnedRepos?.map((repo: any) => (
                    <Paper
                      key={repo.name}
                      p="md"
                      radius="md"
                      bg="#ffffff"
                      style={{
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                      }}
                    >
                      <Text
                        component="a"
                        href={repo.url}
                        target="_blank"
                        fz="sm"
                        fw={600}
                        c="#fb291a"
                        style={{ textDecoration: "none" }}
                      >
                        {repo.name}
                      </Text>
                      <Text fz={11} c="#64748b" mt={4} lineClamp={2}>
                        {repo.description || "Không có mô tả."}
                      </Text>
                      <Group
                        justify="space-between"
                        mt="md"
                        fz={11}
                        c="#64748b"
                      >
                        <Group gap={6}>
                          {repo.primaryLanguage && (
                            <>
                              <Box
                                w={8}
                                h={8}
                                style={{
                                  borderRadius: "50%",
                                  backgroundColor: repo.primaryLanguage.color,
                                }}
                              />
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
      <Box
        component="footer"
        px="xl"
        py="md"
        mt="auto"
        style={{
          borderTop: "1px solid #e2e8f0",
          backgroundColor: "#ffffff",
          flexShrink: 0,
        }}
      >
        <Group
          justify="space-between"
          align="center"
          style={{ maxWidth: 1240, margin: "0 auto" }}
        >
          <Group gap="xs">
            <Box
              w={18}
              h={18}
              style={{
                borderRadius: 4,
                background: "#16a34a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconBrandGithub size={12} color="white" />
            </Box>
            <Text fz={11} c="#64748b">
              GitVN Insights • Trích xuất trực tiếp từ GitHub GraphQL Engine
            </Text>
          </Group>
          <Text
            component="a"
            href={`https://github.com/${username}`}
            target="_blank"
            fz={11}
            c="#fb291a"
            style={{ textDecoration: "none" }}
          >
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
        <Box
          style={{
            backgroundColor: "#ffffff",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box p="md" style={{ borderBottom: "1px solid #e2e8f0" }}>
            <Skeleton height={32} width={180} radius="sm" />
          </Box>
          <Box
            p="xl"
            style={{
              maxWidth: 1280,
              margin: "0 auto",
              width: "100%",
              display: "grid",
              gridTemplateColumns: "296px 1fr",
              gap: 32,
            }}
          >
            <Box>
              <Skeleton height={260} circle mb="md" />
              <Skeleton height={28} width="70%" radius="sm" mb="xs" />
              <Skeleton height={18} width="45%" radius="sm" />
            </Box>
            <Box>
              <Skeleton height={36} radius="sm" mb="lg" />
              <Skeleton height={140} radius="md" mb="md" />
              <Skeleton height={140} radius="md" />
            </Box>
          </Box>
        </Box>
      }
    >
      <UserProfileContent />
    </Suspense>
  );
}
