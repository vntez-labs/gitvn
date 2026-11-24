"use client";

import {
  Alert,
  Anchor,
  Box,
  Button,
  Group,
  Paper,
  SimpleGrid,
  Skeleton,
  Stack,
  Tabs,
  Text,
  UnstyledButton,
} from "@mantine/core";
import {
  IconActivity,
  IconAlertCircle,
  IconBrandGithub,
  IconExternalLink,
  IconFileText,
  IconGitFork,
  IconPin,
  IconStar,
} from "@tabler/icons-react";
import axios from "axios";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense } from "react";
import useSWR from "swr";
import { GitVNLogo } from "@/components/brand/GitVNLogo";
import { MarkdownViewer } from "@/components/MarkdownViewer";
import { ProfileSearch } from "@/components/profile/ProfileSearch";
import { UserProfileSidebar } from "@/components/profile/UserProfileSidebar";
import { UserStatsMatrix } from "@/components/profile/UserStatsMatrix";
import type { ProfileInsights } from "@/interfaces/profile-insights";

async function fetchInsights(url: string) {
  const { data } = await axios.get<ProfileInsights>(url);
  return data;
}

function ProfileSkeleton() {
  return (
    <div className="grid items-start gap-5 lg:grid-cols-[clamp(270px,22vw,340px)_minmax(0,1fr)]">
      <Paper withBorder radius="lg" p={{ base: "md", sm: "lg" }}>
        <Stack gap="md">
          <Skeleton circle h={108} w={108} />
          <Skeleton h={28} w="75%" radius="sm" />
          <Skeleton h={18} w="50%" radius="sm" />
          <Skeleton h={38} w="100%" radius="sm" />
          <Skeleton h={16} w="65%" radius="sm" />
          <Skeleton h={16} w="55%" radius="sm" />
          <Skeleton h={36} w="100%" radius="md" mt="xs" />
        </Stack>
      </Paper>

      <Stack gap="md">
        <Skeleton h={44} w={260} radius="md" />
        <Paper withBorder radius="lg" p={{ base: "md", sm: "lg" }}>
          <Skeleton h={22} w={180} mb="md" radius="sm" />
          <SimpleGrid cols={{ base: 2, lg: 4 }} spacing="xs">
            <Skeleton h={95} radius="md" />
            <Skeleton h={95} radius="md" />
            <Skeleton h={95} radius="md" />
            <Skeleton h={95} radius="md" />
          </SimpleGrid>
        </Paper>
        <Paper withBorder radius="lg" p={{ base: "md", sm: "lg" }}>
          <Skeleton h={64} radius="md" mb="md" />
          <Skeleton h={12} radius="xl" mb="md" />
          <SimpleGrid cols={{ base: 2, lg: 4 }} spacing="xs">
            <Skeleton h={80} radius="md" />
            <Skeleton h={80} radius="md" />
            <Skeleton h={80} radius="md" />
            <Skeleton h={80} radius="md" />
          </SimpleGrid>
        </Paper>
      </Stack>
    </div>
  );
}

function ProfilePanels({ username }: { username: string }) {
  const { data, isLoading, error } = useSWR(
    `/api/github/user/${encodeURIComponent(username)}`,
    fetchInsights,
    {
      shouldRetryOnError: (err) => (err.response?.status ?? 500) >= 500,
      errorRetryCount: 1,
    },
  );

  if (isLoading) return <ProfileSkeleton />;
  if (!data) {
    return (
      <Alert
        icon={<IconAlertCircle size={18} />}
        title="Không thể tải hồ sơ"
        color="red"
      >
        {error?.response?.data?.error ?? "Chưa có dữ liệu cho hồ sơ này."}
        {error?.response?.status === 401 && (
          <Button
            component="a"
            href="/api/integrations/github"
            variant="light"
            size="sm"
            ml="sm"
            leftSection={<IconBrandGithub size={16} />}
          >
            Đăng nhập GitHub
          </Button>
        )}
      </Alert>
    );
  }

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[clamp(270px,22vw,340px)_minmax(0,1fr)]">
      <UserProfileSidebar
        user={data.user}
        organizations={data.organizations}
        achievements={data.achievements}
        isPro={data.isPro}
        isOwnProfile={data.isOwnProfile}
      />

      <Tabs
        defaultValue="activity"
        keepMounted={false}
        className="min-w-0"
        variant="unstyled"
      >
        <Tabs.List className="insights-tabs mb-5" aria-label="Các mục Insights">
          <Tabs.Tab value="activity" leftSection={<IconActivity size={17} />}>
            Hoạt động
          </Tabs.Tab>
          <Tabs.Tab value="repos" leftSection={<IconPin size={17} />}>
            Repo ghim
          </Tabs.Tab>
          {data.readme && (
            <Tabs.Tab value="readme" leftSection={<IconFileText size={17} />}>
              README
            </Tabs.Tab>
          )}
        </Tabs.List>

        <Tabs.Panel value="activity">
          {data.activity ? (
            <UserStatsMatrix
              username={data.user.login}
              activity={data.activity}
              codeChanges={data.codeChanges}
              followers={data.user.followers?.totalCount ?? 0}
            />
          ) : (
            <Alert color="gray">
              GitHub chưa trả về lịch đóng góp cho kỳ này.
            </Alert>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="repos">
          <Group justify="space-between" align="center" gap="xs" mb="sm">
            <Box>
              <Text component="h2" fz={17} fw={700}>
                Repo ghim
              </Text>{" "}
            </Box>
            <Anchor
              href={data.user.url}
              target="_blank"
              rel="noopener noreferrer"
              fz={13}
            >
              Xem trên GitHub
            </Anchor>
          </Group>
          {!data.pinnedRepositories?.length ? (
            <Paper withBorder p="md" radius="lg">
              <Text fz={14}>
                {data.pinnedRepositories
                  ? "Chưa ghim repo công khai nào."
                  : "Chưa tải được danh sách repo ghim."}
              </Text>
            </Paper>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              {data.pinnedRepositories.map((repo) => (
                <Paper key={repo.url} withBorder p="md" radius="lg">
                  <Stack gap="sm" h="100%">
                    <Anchor
                      href={repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      fw={700}
                      fz={15}
                      style={{ overflowWrap: "anywhere" }}
                    >
                      {repo.nameWithOwner}
                    </Anchor>
                    {repo.description && (
                      <Text fz={14} c="#52525b" lineClamp={2}>
                        {repo.description}
                      </Text>
                    )}
                    <Group gap="md" c="#52525b" fz={13} mt="auto">
                      {repo.primaryLanguage && (
                        <Text size="inherit">{repo.primaryLanguage.name}</Text>
                      )}
                      <Group gap={4}>
                        <IconStar size={15} aria-label="Sao" />
                        {repo.stargazerCount}
                      </Group>
                      <Group gap={4}>
                        <IconGitFork size={15} aria-label="Fork" />
                        {repo.forkCount}
                      </Group>
                    </Group>
                  </Stack>
                </Paper>
              ))}
            </SimpleGrid>
          )}
        </Tabs.Panel>

        {data.readme && (
          <Tabs.Panel value="readme">
            <Paper withBorder p={{ base: "md", sm: "lg" }} radius="lg">
              <MarkdownViewer content={data.readme} />
            </Paper>
          </Tabs.Panel>
        )}
      </Tabs>
    </div>
  );
}

function ProfilePageContent() {
  const { username: rawUsername } = useParams<{ username: string }>();
  const username = rawUsername.trim().replace(/^@/, "");

  return (
    <div className="min-h-dvh bg-[#f7f7f8]">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto grid w-full max-w-[1920px] grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 px-4 py-3 sm:grid-cols-[1fr_minmax(250px,450px)_1fr] sm:px-6 xl:px-10">
          <UnstyledButton
            component={Link}
            href="/"
            className="inline-flex w-fit items-center gap-2.5"
            aria-label="GitVN Insights"
          >
            <GitVNLogo size={30} />
            <Text fw={750} fz={16} className="whitespace-nowrap">
              GitVN{" "}
              <span className="ml-1 border-l border-zinc-200 pl-2.5 font-medium text-zinc-600">
                Insights
              </span>
            </Text>
          </UnstyledButton>
          <div className="col-span-2 row-start-2 min-w-0 sm:col-span-1 sm:col-start-2 sm:row-start-1">
            <ProfileSearch />
          </div>
          <Button
            component={Link}
            href="/dashboard"
            variant="default"
            size="sm"
            className="col-start-2 row-start-1 justify-self-end sm:col-start-3"
            rightSection={<IconExternalLink size={14} />}
          >
            Workspace
          </Button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1920px] px-4 py-5 sm:px-6 sm:py-7 xl:px-10">
        <ProfilePanels key={username.toLowerCase()} username={username} />
      </main>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-[1920px] px-4 py-5 sm:px-6 sm:py-7 xl:px-10">
          <ProfileSkeleton />
        </div>
      }
    >
      <ProfilePageContent />
    </Suspense>
  );
}
