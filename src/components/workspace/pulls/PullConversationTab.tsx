"use client";

import { Avatar, Box, Group, Paper, Stack, Text } from "@mantine/core";
import { IconGitCommit } from "@tabler/icons-react";
import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { PullCommit, PullRequestDetails } from "@/lib/pull-request";

interface PullConversationTabProps {
  pull: PullRequestDetails;
  commits: PullCommit[];
  activity: ReactNode;
}

export function PullConversationTab({
  pull,
  commits,
  activity,
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

      {commits.length > 0 && (
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
                <Text
                  fz={12}
                  fw={500}
                  c="#0f172a"
                  ff="var(--mantine-font-family-monospace)"
                >
                  {c.sha.slice(0, 7)}
                </Text>
                <Text fz={12} c="#334155" truncate style={{ flex: 1 }}>
                  {c.commit.message.split("\n")[0]}
                </Text>
              </Group>
            ))}
          </Stack>
        </Box>
      )}
      {activity}
    </Stack>
  );
}
