"use client";

import {
  Alert,
  Avatar,
  Box,
  Button,
  Group,
  Paper,
  SegmentedControl,
  Stack,
  Text,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconCheck,
  IconGitCommit,
  IconGitMerge,
} from "@tabler/icons-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface PullConversationTabProps {
  pull: any;
  commits: any[];
  isOpen: boolean;
  mergeSuccess: boolean;
  mergeError: string | null;
  mergeMethod: "merge" | "squash" | "rebase";
  setMergeMethod: (val: "merge" | "squash" | "rebase") => void;
  merging: boolean;
  onMerge: () => void;
}

export function PullConversationTab({
  pull,
  commits,
  isOpen,
  mergeSuccess,
  mergeError,
  mergeMethod,
  setMergeMethod,
  merging,
  onMerge,
}: PullConversationTabProps) {
  return (
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
              Pull Request đã được merge thành công vào {pull.base.ref}! Đang
              chuyển hướng...
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
                    onClick={onMerge}
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
  );
}
