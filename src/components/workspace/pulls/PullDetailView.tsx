"use client";

import {
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Group,
  Paper,
  SegmentedControl,
  Skeleton,
  Stack,
  Tabs,
  Text,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconCheck,
  IconCircleX,
  IconExternalLink,
  IconFileDiff,
  IconGitCommit,
  IconGitMerge,
  IconGitPullRequest,
  IconMessageCircle,
} from "@tabler/icons-react";
import axios from "axios";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useDashboardStore } from "@/store/dashboard.store";
import { DiffViewer } from "./DiffViewer";

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
  const { selectedRepo } = useDashboardStore();
  const [data, setData] = useState<{
    pull: any;
    files: any[];
    commits: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "conversation" | "commits" | "files"
  >("conversation");

  // Merge state
  const [mergeMethod, setMergeMethod] = useState<"merge" | "squash" | "rebase">(
    "merge",
  );
  const [merging, setMerging] = useState(false);
  const [mergeError, setMergeError] = useState<string | null>(null);
  const [mergeSuccess, setMergeSuccess] = useState(false);

  useEffect(() => {
    if (!selectedRepo) return;
    setLoading(true);

    axios
      .get(
        `/api/github/pulls/detail?owner=${selectedRepo.owner.login}&repo=${selectedRepo.name}&pull_number=${pullNumber}`,
      )
      .then((res) => {
        setData(res.data);
      })
      .catch((err) => console.error("Lỗi tải chi tiết PR:", err))
      .finally(() => setLoading(false));
  }, [selectedRepo?.id, pullNumber]);

  const handleMerge = async () => {
    if (!selectedRepo || !data?.pull) return;
    setMerging(true);
    setMergeError(null);

    try {
      await axios.put("/api/github/pulls/merge", {
        owner: selectedRepo.owner.login,
        repo: selectedRepo.name,
        pull_number: pullNumber,
        merge_method: mergeMethod,
        commit_title: `${data.pull.title} (#${pullNumber})`,
      });

      setMergeSuccess(true);
      setTimeout(() => {
        onMergedSuccess();
      }, 1500);
    } catch (err: any) {
      setMergeError(
        err.response?.data?.error ||
          "Merge thất bại. Có thể do xung đột hoặc không đủ quyền.",
      );
    } finally {
      setMerging(false);
    }
  };

  if (loading || !data) {
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

  const { pull, files, commits } = data;
  const isMerged = Boolean(pull.merged_at);
  const isOpen = pull.state === "open";

  const totalAdditions = files.reduce((acc, f) => acc + (f.additions || 0), 0);
  const totalDeletions = files.reduce((acc, f) => acc + (f.deletions || 0), 0);

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
              color={isMerged ? "violet" : isOpen ? "green" : "red"}
              variant="filled"
              radius="xl"
              styles={{ root: { textTransform: "capitalize" } }}
            >
              {isMerged ? "Merged" : isOpen ? "Open" : "Closed"}
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
                {commits.length} commits
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
                {pull.base.ref}
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
                {pull.head.ref}
              </Badge>
            </Text>
          </Box>
        </Box>

        {/* 2. TABS: CONVERSATION / COMMITS / FILES CHANGED */}
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
                  {commits.length}
                </Badge>
              }
            >
              Commits
            </Tabs.Tab>

            <Tabs.Tab
              value="files"
              leftSection={<IconFileDiff size={15} />}
              rightSection={
                <Group gap={4} wrap="nowrap">
                  <Badge size="xs" variant="light" color="gray" circle>
                    {files.length}
                  </Badge>
                  <Text fz={11} c="#16a34a" fw={600}>
                    +{totalAdditions}
                  </Text>
                  <Text fz={11} c="#dc2626" fw={600}>
                    -{totalDeletions}
                  </Text>
                </Group>
              }
            >
              Files changed
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>

        {/* 3. NỘI DUNG TỪNG TAB */}

        {/* TAB 1: CONVERSATION */}
        {activeTab === "conversation" && (
          <Stack gap="md">
            {/* Hộp mô tả PR */}
            <Paper
              radius="md"
              style={{
                border: "1px solid #e2e8f0",
                backgroundColor: "#ffffff",
                overflow: "hidden",
              }}
            >
              <Box
                px="md"
                py={8}
                style={{
                  backgroundColor: "#f8fafc",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                <Group gap="xs">
                  <Avatar src={pull.user?.avatar_url} size={22} radius="xl" />
                  <Text fz={12} fw={600} c="#0f172a">
                    {pull.user?.login}
                  </Text>
                  <Text fz={11} c="#64748b">
                    đã tạo vào {new Date(pull.created_at).toLocaleDateString()}
                  </Text>
                </Group>
              </Box>
              <Box p="md" c="#334155" style={{ fontSize: 14 }}>
                {pull.body ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {pull.body}
                  </ReactMarkdown>
                ) : (
                  <Text fz="xs" c="#64748b" fs="italic">
                    No description provided.
                  </Text>
                )}
              </Box>
            </Paper>

            {/* Commits Timeline ngắn gọn */}
            <Box
              style={{
                borderLeft: "2px solid #e2e8f0",
                marginLeft: 16,
                paddingLeft: 20,
              }}
            >
              <Text fz={12} fw={600} c="#64748b" mb="xs">
                {commits.length} commits trong PR này
              </Text>
              <Stack gap={6}>
                {commits.map((c) => (
                  <Group key={c.sha} gap="xs">
                    <IconGitCommit size={14} color="#fb291a" />
                    <Text fz={12} fw={500} c="#0f172a" ff="monospace">
                      {c.sha.slice(0, 7)}
                    </Text>
                    <Text fz={12} c="#334155" truncate style={{ flex: 1 }}>
                      {c.commit.message.split("\n")[0]}
                    </Text>
                  </Group>
                ))}
              </Stack>
            </Box>

            {/* HỘP HÀNH ĐỘNG MERGE */}
            {isOpen && (
              <Paper
                p="md"
                radius="md"
                style={{
                  border: "1px solid #bfdbfe",
                  backgroundColor: "#eff6ff",
                }}
              >
                {mergeSuccess ? (
                  <Alert color="green" icon={<IconCheck size={16} />}>
                    Pull Request đã được merge thành công vào {pull.base.ref}!
                    Đang chuyển hướng...
                  </Alert>
                ) : (
                  <Stack gap="sm">
                    {mergeError && (
                      <Alert color="red" icon={<IconAlertTriangle size={16} />}>
                        {mergeError}
                      </Alert>
                    )}

                    <Group justify="space-between" align="center" wrap="wrap">
                      <Box>
                        <Text fz="sm" fw={700} c="#1e40af">
                          Merge pull request
                        </Text>
                        <Text fz="xs" c="#3b82f6">
                          Nhánh này không có xung đột và sẵn sàng hợp nhất vào{" "}
                          <code>{pull.base.ref}</code>.
                        </Text>
                      </Box>

                      <Group gap="xs">
                        <SegmentedControl
                          size="xs"
                          value={mergeMethod}
                          onChange={(val) => setMergeMethod(val as any)}
                          data={[
                            { label: "Create merge commit", value: "merge" },
                            { label: "Squash and merge", value: "squash" },
                            { label: "Rebase and merge", value: "rebase" },
                          ]}
                          styles={{
                            root: { backgroundColor: "#ffffff" },
                            indicator: { backgroundColor: "#eff6ff" },
                            label: {
                              color: "#1e40af",
                              fontSize: 11,
                              fontWeight: 500,
                            },
                          }}
                        />

                        <Button
                          color="green"
                          size="xs"
                          loading={merging}
                          leftSection={<IconGitMerge size={14} />}
                          onClick={handleMerge}
                        >
                          Merge pull request
                        </Button>
                      </Group>
                    </Group>
                  </Stack>
                )}
              </Paper>
            )}
          </Stack>
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
