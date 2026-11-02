"use client";

import {
  ActionIcon,
  Badge,
  Box,
  CopyButton,
  Group,
  Paper,
  SegmentedControl,
  Stack,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";
import {
  IconCheck,
  IconCopy,
  IconSparkles,
  IconTerminal2,
} from "@tabler/icons-react";
import { useState } from "react";
import type { GitHubRepo } from "@/interfaces/github";

interface EmptyRepoViewProps {
  repo: GitHubRepo;
}

export function EmptyRepoView({ repo }: EmptyRepoViewProps) {
  const [protocol, setProtocol] = useState<"https" | "ssh">("https");

  const defaultBranch = (repo as any)?.default_branch || "main";
  const httpsUrl =
    repo.clone_url || `https://github.com/${repo.owner.login}/${repo.name}.git`;
  const sshUrl =
    (repo as any)?.ssh_url ||
    `git@github.com:${repo.owner.login}/${repo.name}.git`;
  const cloneUrl = protocol === "https" ? httpsUrl : sshUrl;

  const initCode = `echo "# ${repo.name}" >> README.md
git init
git add README.md
git commit -m "first commit"
git branch -M ${defaultBranch}
git remote add origin ${cloneUrl}
git push -u origin ${defaultBranch}`;

  const pushExistingCode = `git remote add origin ${cloneUrl}
git branch -M ${defaultBranch}
git push -u origin ${defaultBranch}`;

  return (
    <Box
      className="hide-scrollbar"
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "32px 24px",
        backgroundColor: "#f8fafc",
        minHeight: 0,
      }}
    >
      <Box style={{ maxWidth: 860, margin: "0 auto", width: "100%" }}>
        {/* Banner tiêu đề */}
        <Box mb="xl">
          <Group gap="xs" mb={4}>
            <Title order={3} c="#0f172a" fw={700} fz={20}>
              Quick setup
            </Title>
            <Badge size="sm" variant="light" color="vntez" radius="sm">
              Repository trống
            </Badge>
          </Group>
          <Text c="#64748b" fz={13}>
            Repository này chưa có bất kỳ commit hay tệp tin nào. Hãy bắt đầu
            bằng cách tải code lên từ máy tính của bạn.
          </Text>
        </Box>

        {/* Quick setup bar */}
        <Paper
          p="md"
          bg="#ffffff"
          radius="md"
          style={{
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
          mb="xl"
        >
          <Group justify="space-between" mb="xs" wrap="wrap">
            <Group gap="xs">
              <IconTerminal2 size={16} color="#fb291a" />
              <Text fw={600} fz={13} c="#0f172a">
                Clone URL ({protocol.toUpperCase()})
              </Text>
            </Group>
            <SegmentedControl
              value={protocol}
              onChange={(val) => setProtocol(val as "https" | "ssh")}
              size="xs"
              data={[
                { label: "HTTPS", value: "https" },
                { label: "SSH", value: "ssh" },
              ]}
              styles={{
                root: { backgroundColor: "#f1f5f9" },
                indicator: {
                  backgroundColor: "#ffffff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                },
                label: {
                  color: "#334155",
                  fontSize: 11,
                  padding: "2px 10px",
                  fontWeight: 600,
                },
              }}
            />
          </Group>

          <Group gap="xs" mt="xs">
            <Box
              style={{
                flex: 1,
                backgroundColor: "#f8fafc",
                border: "1px solid #cbd5e1",
                borderRadius: 6,
                padding: "6px 12px",
                fontFamily: "monospace",
                fontSize: 12,
                color: "#1d4ed8",
                overflowX: "auto",
                whiteSpace: "nowrap",
              }}
            >
              {cloneUrl}
            </Box>
            <CopyButton value={cloneUrl}>
              {({ copied, copy }) => (
                <Tooltip
                  label={copied ? "Đã sao chép" : "Sao chép URL"}
                  withArrow
                >
                  <ActionIcon
                    variant="default"
                    color={copied ? "teal" : "gray"}
                    onClick={copy}
                    size="lg"
                  >
                    {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
          </Group>
        </Paper>

        {/* Lệnh tạo mới từ Terminal */}
        <Stack gap="xl">
          <Box>
            <Group gap="xs" mb={8}>
              <IconSparkles size={14} color="#16a34a" />
              <Text fz={13} fw={600} c="#0f172a" ff="monospace">
                …hoặc tạo một repository mới từ command line
              </Text>
            </Group>

            <Paper
              p="md"
              bg="#ffffff"
              radius="md"
              style={{
                border: "1px solid #e2e8f0",
                position: "relative",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <Box style={{ position: "absolute", top: 10, right: 10 }}>
                <CopyButton value={initCode}>
                  {({ copied, copy }) => (
                    <Tooltip
                      label={copied ? "Đã sao chép" : "Sao chép toàn bộ"}
                      withArrow
                    >
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        color={copied ? "teal" : "gray"}
                        onClick={copy}
                      >
                        {copied ? (
                          <IconCheck size={14} />
                        ) : (
                          <IconCopy size={14} />
                        )}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
              </Box>
              <pre
                style={{
                  margin: 0,
                  fontFamily: "monospace",
                  fontSize: 12,
                  lineHeight: 1.7,
                  color: "#1e293b",
                  overflowX: "auto",
                }}
              >
                {initCode}
              </pre>
            </Paper>
          </Box>

          {/* Lệnh push repo đã có sẵn */}
          <Box>
            <Group gap="xs" mb={8}>
              <IconTerminal2 size={14} color="#d97706" />
              <Text fz={13} fw={600} c="#0f172a" ff="monospace">
                …hoặc push một repository có sẵn từ máy tính
              </Text>
            </Group>

            <Paper
              p="md"
              bg="#ffffff"
              radius="md"
              style={{
                border: "1px solid #e2e8f0",
                position: "relative",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <Box style={{ position: "absolute", top: 10, right: 10 }}>
                <CopyButton value={pushExistingCode}>
                  {({ copied, copy }) => (
                    <Tooltip
                      label={copied ? "Đã sao chép" : "Sao chép toàn bộ"}
                      withArrow
                    >
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        color={copied ? "teal" : "gray"}
                        onClick={copy}
                      >
                        {copied ? (
                          <IconCheck size={14} />
                        ) : (
                          <IconCopy size={14} />
                        )}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
              </Box>
              <pre
                style={{
                  margin: 0,
                  fontFamily: "monospace",
                  fontSize: 12,
                  lineHeight: 1.7,
                  color: "#1e293b",
                  overflowX: "auto",
                }}
              >
                {pushExistingCode}
              </pre>
            </Paper>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
