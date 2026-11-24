"use client";

import {
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  CopyButton,
  Group,
  Skeleton,
  Stack,
  Tabs,
  Text,
} from "@mantine/core";
import {
  IconActivity,
  IconArrowLeft,
  IconCircleX,
  IconExternalLink,
  IconFileDiff,
  IconGitCommit,
  IconGitMerge,
  IconGitPullRequest,
  IconMessageCircle,
} from "@tabler/icons-react";
import axios from "axios";
import { useState } from "react";
import useSWR from "swr";
import type {
  MergeMethod,
  PullChecks,
  PullCommit,
  PullRequestDetails,
} from "@/lib/pull-request";
import { useDashboardStore } from "@/store/dashboard.store";
import { DiffViewer, type FileDiff } from "./DiffViewer";
import { PullActivity } from "./PullActivity";
import { hasPendingPullChecks, PullChecksPanel } from "./PullChecksPanel";
import { PullConversationTab } from "./PullConversationTab";
import { PullMergePanel } from "./PullMergePanel";

async function fetchPullData<T>(url: string): Promise<T> {
  return (await axios.get<T>(url)).data;
}

function pullError(error: unknown, fallback: string) {
  return axios.isAxiosError<{ error: string }>(error)
    ? error.response?.data?.error || fallback
    : fallback;
}

interface PullDetailViewProps {
  pullNumber: number;
  onBack: () => void;
  onMergedSuccess: () => void;
}

export function PullDetailView({
  pullNumber,
  onBack,
  onMergedSuccess,
}: PullDetailViewProps) {
  const selectedRepo = useDashboardStore((state) => state.selectedRepo);
  const [activeTab, setActiveTab] = useState<string | null>("conversation");
  const owner = selectedRepo?.owner.login;
  const repo = selectedRepo?.name;
  const endpoint =
    owner && repo
      ? `/api/github/pulls/detail?${new URLSearchParams({
          owner,
          repo,
          pull_number: String(pullNumber),
        })}`
      : null;
  const { data, error, isValidating, mutate } = useSWR(
    endpoint,
    fetchPullData<{ pull: PullRequestDetails; checks: PullChecks }>,
    {
      refreshInterval: (current) => {
        if (current?.pull.state !== "open") return 0;
        return current.pull.mergeable === null
          ? 5000
          : hasPendingPullChecks(current.checks)
            ? 15000
            : 30000;
      },
      errorRetryCount: 2,
    },
  );
  const pull = data?.pull;
  const revision = pull && `&head=${pull.head.sha}&base=${pull.base.sha}`;
  const filesRequest = useSWR(
    endpoint && revision && activeTab === "files"
      ? `${endpoint}&view=files${revision}`
      : null,
    fetchPullData<FileDiff[]>,
  );
  const commitsRequest = useSWR(
    endpoint &&
      revision &&
      (activeTab === "commits" || activeTab === "conversation")
      ? `${endpoint}&view=commits${revision}`
      : null,
    fetchPullData<PullCommit[]>,
  );
  const files = filesRequest.data ?? [];
  const commits = commitsRequest.data ?? [];

  async function handleMerge(method: MergeMethod, sha: string) {
    try {
      await axios.put("/api/github/pulls/merge", {
        owner,
        repo,
        pullNumber,
        mergeMethod: method,
        sha,
      });
    } catch (error) {
      void mutate();
      throw new Error(
        pullError(
          error,
          "GitHub chưa xác nhận merge. Hãy kiểm tra lại trạng thái PR.",
        ),
      );
    }

    await mutate(
      (current) =>
        current && {
          ...current,
          pull: {
            ...current.pull,
            state: "closed",
            merged: true,
          },
        },
      { revalidate: false },
    );
    onMergedSuccess();
  }

  if (!data || !pull) {
    if (error) {
      return (
        <Stack p="xl">
          <Button variant="subtle" onClick={onBack} w="fit-content">
            Quay lại danh sách Pull Requests
          </Button>
          <Alert color="red">
            {pullError(error, "Không thể tải Pull Request.")}
          </Alert>
          <Button
            variant="default"
            onClick={() => void mutate()}
            loading={isValidating}
            w="fit-content"
          >
            Thử lại
          </Button>
        </Stack>
      );
    }
    return (
      <Box p="xl" style={{ maxWidth: 960, margin: "0 auto" }}>
        <Skeleton height={28} width={120} radius="sm" mb="lg" />
        <Skeleton height={32} width="70%" radius="sm" mb="sm" />
        <Skeleton height={20} width="40%" radius="sm" mb="xl" />
        <Skeleton height={40} radius="sm" mb="md" />
        <Skeleton height={200} radius="md" />
      </Box>
    );
  }

  const isMerged = pull.merged;
  const isOpen = pull.state === "open";

  return (
    <Box
      className="hide-scrollbar"
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "24px 20px",
        minHeight: 0,
        backgroundColor: "#ffffff",
      }}
    >
      <Box style={{ maxWidth: 960, margin: "0 auto" }}>
        {/* Nút quay lại */}
        <Button
          variant="subtle"
          color="gray"
          size="xs"
          leftSection={<IconArrowLeft size={14} />}
          onClick={onBack}
          mb="md"
          styles={{
            root: { color: "#64748b", "&:hover": { color: "#0f172a" } },
          }}
        >
          Quay lại danh sách Pull Requests
        </Button>

        {/* 1. HEADER PULL REQUEST */}
        <Box mb="lg">
          <Group justify="space-between" align="flex-start" mb={8}>
            <Text fz={22} fw={700} c="#0f172a" lh={1.3}>
              {pull.title}{" "}
              <span style={{ color: "#64748b", fontWeight: 400 }}>
                #{pull.number}
              </span>
            </Text>

            <Group gap="xs">
              <CopyButton
                value={
                  typeof window === "undefined" || !owner || !repo
                    ? ""
                    : `${window.location.origin}/dashboard?${new URLSearchParams({ repo: `${owner}/${repo}`, pr: String(pull.number) })}`
                }
              >
                {({ copied, copy }) => (
                  <Button size="compact-xs" variant="default" onClick={copy}>
                    {copied ? "Đã sao chép" : "Sao chép link GitVN"}
                  </Button>
                )}
              </CopyButton>
              <Button
                size="compact-xs"
                variant="default"
                component="a"
                href={pull.html_url}
                target="_blank"
                rightSection={<IconExternalLink size={12} />}
              >
                Xem trên GitHub
              </Button>
            </Group>
          </Group>

          {/* Subtitle mô tả ngắn gọn */}
          <Box
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <Badge
              size="md"
              leftSection={
                isMerged ? (
                  <IconGitMerge size={14} />
                ) : isOpen ? (
                  <IconGitPullRequest size={14} />
                ) : (
                  <IconCircleX size={14} />
                )
              }
              color={
                isMerged
                  ? "violet"
                  : pull.draft && isOpen
                    ? "gray"
                    : isOpen
                      ? "green"
                      : "red"
              }
              variant="filled"
              radius="xl"
              styles={{ root: { textTransform: "capitalize" } }}
            >
              {isMerged
                ? "Merged"
                : isOpen
                  ? pull.draft
                    ? "Draft"
                    : "Open"
                  : "Closed"}
            </Badge>

            <Text
              component="div"
              fz={13}
              c="#64748b"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                flexWrap: "wrap",
              }}
            >
              <span style={{ color: "#0f172a", fontWeight: 600 }}>
                {pull.user?.login}
              </span>
              <span>{isMerged ? "đã merge" : "muốn merge"}</span>
              <span style={{ color: "#0f172a", fontWeight: 600 }}>
                {pull.commits} commits
              </span>
              <span>vào</span>
              <Badge
                component="span"
                size="xs"
                variant="light"
                color="vntez"
                ff="monospace"
                px={6}
              >
                {pull.base.label}
              </Badge>
              <span>từ</span>
              <Badge
                component="span"
                size="xs"
                variant="outline"
                color="gray"
                ff="monospace"
                px={6}
              >
                {pull.head.label}
              </Badge>
            </Text>
          </Box>
        </Box>

        {/* 2. TABS: CONVERSATION / COMMITS / FILES CHANGED */}
        <Tabs
          value={activeTab}
          onChange={setActiveTab}
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
              value="conversation"
              leftSection={<IconMessageCircle size={15} />}
            >
              Conversation
            </Tabs.Tab>

            <Tabs.Tab
              value="commits"
              leftSection={<IconGitCommit size={15} />}
              rightSection={
                <Badge size="xs" variant="light" color="gray" circle>
                  {pull.commits}
                </Badge>
              }
            >
              Commits
            </Tabs.Tab>

            <Tabs.Tab
              value="checks"
              leftSection={<IconActivity size={15} />}
              rightSection={
                <Badge size="xs" variant="light" color="gray">
                  {data.checks.items.length}
                </Badge>
              }
            >
              Checks
            </Tabs.Tab>

            <Tabs.Tab
              value="files"
              leftSection={<IconFileDiff size={15} />}
              rightSection={
                <Group gap={4} wrap="nowrap">
                  <Badge size="xs" variant="light" color="gray" circle>
                    {pull.changed_files}
                  </Badge>
                  <Text fz={11} c="#16a34a" fw={600}>
                    +{pull.additions}
                  </Text>
                  <Text fz={11} c="#dc2626" fw={600}>
                    -{pull.deletions}
                  </Text>
                </Group>
              }
            >
              Files changed
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>

        {error && (
          <Alert color="yellow" mb="md">
            {pullError(error, "Không thể cập nhật trạng thái từ GitHub.")} Dữ
            liệu đang hiển thị có thể đã cũ.
          </Alert>
        )}

        {activeTab === "conversation" && (
          <PullConversationTab
            pull={pull}
            commits={commits}
            mergePanel={
              <Stack gap="md">
                {owner && repo && (
                  <PullActivity
                    owner={owner}
                    repo={repo}
                    pull={pull}
                    onRefresh={() => void mutate()}
                  />
                )}
                <PullChecksPanel checks={data.checks} />
                <PullMergePanel
                  pull={pull}
                  stale={Boolean(error)}
                  refreshing={isValidating}
                  onRefresh={() => void mutate()}
                  onMerge={handleMerge}
                />
              </Stack>
            }
          />
        )}

        {activeTab === "checks" && (
          <Stack gap="sm">
            <Button
              variant="default"
              size="xs"
              w="fit-content"
              onClick={() => void mutate()}
              loading={isValidating}
            >
              Làm mới checks
            </Button>
            <PullChecksPanel checks={data.checks} />
          </Stack>
        )}

        {(activeTab === "conversation" || activeTab === "commits") &&
          commitsRequest.error && (
            <Alert color="red" my="sm">
              {pullError(
                commitsRequest.error,
                "Không thể tải danh sách commit.",
              )}
            </Alert>
          )}
        {activeTab === "commits" && commitsRequest.isLoading && (
          <Skeleton height={90} />
        )}
        {activeTab === "files" && filesRequest.isLoading && (
          <Skeleton height={120} />
        )}
        {activeTab === "files" && filesRequest.error && (
          <Alert color="red" my="sm">
            {pullError(filesRequest.error, "Không thể tải thay đổi của PR.")}
          </Alert>
        )}

        {/* TAB 2: COMMITS */}
        {activeTab === "commits" && (
          <Stack
            gap={1}
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            {commits.map((c) => (
              <Box
                key={c.sha}
                p="sm"
                style={{
                  backgroundColor: "#ffffff",
                  borderBottom: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Group gap="sm" style={{ flex: 1, minWidth: 0 }}>
                  <Avatar src={c.author?.avatar_url} size={24} radius="xl" />
                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <Text fz={13} fw={600} c="#0f172a" truncate>
                      {c.commit.message.split("\n")[0]}
                    </Text>
                    <Text fz={11} c="#64748b">
                      {c.commit.author?.name} committed vào{" "}
                      {new Date(c.commit.author?.date).toLocaleDateString()}
                    </Text>
                  </Box>
                </Group>
                <Badge size="sm" variant="light" color="vntez" ff="monospace">
                  {c.sha.slice(0, 7)}
                </Badge>
              </Box>
            ))}
          </Stack>
        )}

        {/* TAB 3: FILES CHANGED (DIFF VIEW) */}
        {activeTab === "files" && (
          <Stack gap="md">
            {files.map((file) => (
              <DiffViewer key={file.filename} file={file} />
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
}
