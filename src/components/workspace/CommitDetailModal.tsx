"use client";

import {
  Accordion,
  ActionIcon,
  Avatar,
  Badge,
  Box,
  CopyButton,
  Divider,
  Group,
  Modal,
  Paper,
  Skeleton,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import {
  IconCheck,
  IconCopy,
  IconExternalLink,
  IconFileDiff,
  IconGitCommit,
  IconMinus,
  IconPlus,
  IconTerminal2,
} from "@tabler/icons-react";
import axios from "axios";
import { useEffect, useState } from "react";
import { formatDateTime, formatRelativeTime } from "@/lib/time";

interface CommitDetailModalProps {
  opened: boolean;
  onClose: () => void;
  owner: string;
  repo: string;
  sha: string | null;
  branch?: string;
}

export function CommitDetailModal({
  opened,
  onClose,
  owner,
  repo,
  sha,
  branch = "main",
}: CommitDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [commitData, setCommitData] = useState<any>(null);

  useEffect(() => {
    if (!opened || !sha) {
      setCommitData(null);
      return;
    }

    setLoading(true);
    axios
      .get(`/api/github/commits/detail?owner=${owner}&repo=${repo}&ref=${sha}`)
      .then((res) => {
        setCommitData(res.data.commit);
      })
      .catch((err) => console.error("Lỗi tải chi tiết commit:", err))
      .finally(() => setLoading(false));
  }, [opened, sha, owner, repo]);

  const author = commitData?.commit?.author;
  const githubAuthor = commitData?.author;
  const rawMessage = commitData?.commit?.message || "";
  const [titleText, ...bodyLines] = rawMessage.split("\n");
  const bodyText = bodyLines.join("\n").trim();

  const files = commitData?.files || [];
  const stats = commitData?.stats || { total: 0, additions: 0, deletions: 0 };
  const htmlUrl = commitData?.html_url;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="xl"
      title={
        <Group gap="xs">
          <IconGitCommit size={18} color="#fb291a" />
          <Text fw={600} fz={15} c="#0f172a">
            Chi tiết Commit
          </Text>
          {sha && (
            <Badge size="sm" variant="light" color="vntez" ff="monospace">
              {sha.slice(0, 7)}
            </Badge>
          )}
        </Group>
      }
      styles={{
        content: { backgroundColor: "#ffffff", border: "1px solid #e2e8f0" },
        header: {
          backgroundColor: "#f8fafc",
          borderBottom: "1px solid #e2e8f0",
          padding: "12px 20px",
        },
        body: { padding: 20 },
      }}
    >
      {loading ? (
        <Stack gap="md">
          <Skeleton height={60} radius="md" />
          <Skeleton height={40} radius="md" />
          <Skeleton height={120} radius="md" />
        </Stack>
      ) : commitData ? (
        <Stack gap="md">
          {/* Header Message Box */}
          <Paper
            p="md"
            bg="#f8fafc"
            radius="md"
            style={{ border: "1px solid #e2e8f0" }}
          >
            <Text fz={15} fw={700} c="#0f172a" mb={bodyText ? 8 : 4} lh={1.4}>
              {titleText || "Không có tiêu đề commit"}
            </Text>

            {bodyText && (
              <Text
                fz={12}
                c="#475569"
                style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}
                mb="sm"
              >
                {bodyText}
              </Text>
            )}

            <Divider color="#e2e8f0" mb="sm" />

            <Group justify="space-between" wrap="wrap" gap="sm">
              <Group gap="xs">
                <Avatar
                  src={githubAuthor?.avatar_url}
                  alt={author?.name}
                  size={24}
                  radius="xl"
                />
                <Box>
                  <Text fz={12} fw={600} c="#0f172a">
                    {author?.name || "Vô danh"}{" "}
                    {githubAuthor?.login && (
                      <span style={{ color: "#64748b", fontWeight: 400 }}>
                        (@{githubAuthor.login})
                      </span>
                    )}
                  </Text>
                  <Text fz={11} c="#64748b">
                    {formatRelativeTime(author?.date)} (
                    {formatDateTime(author?.date)})
                  </Text>
                </Box>
              </Group>

              <Group gap="xs">
                <Badge
                  size="sm"
                  color="green"
                  variant="light"
                  leftSection={<IconPlus size={10} />}
                >
                  +{stats.additions} dòng
                </Badge>
                <Badge
                  size="sm"
                  color="red"
                  variant="light"
                  leftSection={<IconMinus size={10} />}
                >
                  -{stats.deletions} dòng
                </Badge>
                <CopyButton value={sha || ""}>
                  {({ copied, copy }) => (
                    <Tooltip
                      label={copied ? "Đã sao chép SHA" : "Sao chép SHA"}
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
              </Group>
            </Group>
          </Paper>

          {/* Hướng dẫn Checkout commit */}
          <Paper
            p="xs"
            px="md"
            bg="#fff1f0"
            radius="md"
            style={{ border: "1px solid #ffc5be" }}
          >
            <Group justify="space-between" align="center" wrap="wrap" gap="xs">
              <Group gap="xs">
                <IconTerminal2 size={16} color="#fb291a" />
                <Text fz={12} c="#b81408">
                  Lệnh checkout commit này trên máy tính:
                </Text>
                <Text fz={12} ff="monospace" c="#db1b0e" fw={600}>
                  git checkout {sha?.slice(0, 7)}
                </Text>
              </Group>

              <Group gap="xs">
                <CopyButton value={`git checkout ${sha}`}>
                  {({ copied, copy }) => (
                    <ActionIcon
                      size="xs"
                      variant="subtle"
                      color={copied ? "teal" : "vntez"}
                      onClick={copy}
                    >
                      {copied ? (
                        <IconCheck size={12} />
                      ) : (
                        <IconCopy size={12} />
                      )}
                    </ActionIcon>
                  )}
                </CopyButton>

                {htmlUrl && (
                  <ActionIcon
                    size="xs"
                    variant="subtle"
                    color="gray"
                    component="a"
                    href={htmlUrl}
                    target="_blank"
                  >
                    <IconExternalLink size={12} />
                  </ActionIcon>
                )}
              </Group>
            </Group>
          </Paper>

          {/* Danh sách các files thay đổi (File Diffs) */}
          <Box>
            <Group justify="space-between" mb="xs">
              <Text
                fz={12}
                fw={700}
                c="#475569"
                style={{ letterSpacing: "0.06em" }}
              >
                CÁC FILE THAY ĐỔI ({files.length})
              </Text>
            </Group>

            <Accordion
              variant="separated"
              radius="md"
              styles={{
                item: {
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  marginBottom: 8,
                },
                control: {
                  padding: "10px 14px",
                  "&:hover": { backgroundColor: "#f8fafc" },
                },
                content: { padding: 0 },
              }}
            >
              {files.map((file: any) => {
                const patchLines = (file.patch || "").split("\n");

                return (
                  <Accordion.Item key={file.filename} value={file.filename}>
                    <Accordion.Control>
                      <Group
                        justify="space-between"
                        wrap="nowrap"
                        style={{ width: "100%", paddingRight: 8 }}
                      >
                        <Group
                          gap="xs"
                          wrap="nowrap"
                          style={{ overflow: "hidden" }}
                        >
                          <IconFileDiff size={15} color="#fb291a" />
                          <Text
                            fz={12.5}
                            fw={600}
                            c="#0f172a"
                            ff="monospace"
                            truncate
                          >
                            {file.filename}
                          </Text>
                          <Badge
                            size="xs"
                            variant="light"
                            color={
                              file.status === "added"
                                ? "green"
                                : file.status === "removed"
                                  ? "red"
                                  : "gray"
                            }
                          >
                            {file.status}
                          </Badge>
                        </Group>

                        <Group gap={6} style={{ flexShrink: 0 }}>
                          <Text fz={11} c="#16a34a" fw={600}>
                            +{file.additions}
                          </Text>
                          <Text fz={11} c="#dc2626" fw={600}>
                            -{file.deletions}
                          </Text>
                        </Group>
                      </Group>
                    </Accordion.Control>

                    <Accordion.Panel>
                      <Box
                        style={{
                          backgroundColor: "#ffffff",
                          borderTop: "1px solid #e2e8f0",
                          padding: 10,
                          overflowX: "auto",
                          fontFamily: "monospace",
                          fontSize: 12,
                          lineHeight: "19px",
                        }}
                      >
                        {patchLines.length > 0 && file.patch ? (
                          patchLines.map((line: string, idx: number) => {
                            const isAdd =
                              line.startsWith("+") && !line.startsWith("+++");
                            const isDel =
                              line.startsWith("-") && !line.startsWith("---");
                            const isHunk = line.startsWith("@@");

                            let bg = "transparent";
                            let color = "#334155";
                            let borderLeft = "3px solid transparent";

                            if (isAdd) {
                              bg = "rgba(34, 197, 94, 0.12)";
                              color = "#166534";
                              borderLeft = "3px solid #22c55e";
                            } else if (isDel) {
                              bg = "rgba(239, 68, 68, 0.12)";
                              color = "#991b1b";
                              borderLeft = "3px solid #ef4444";
                            } else if (isHunk) {
                              bg = "rgba(59, 130, 246, 0.1)";
                              color = "#1d4ed8";
                            }

                            return (
                              <Box
                                key={idx}
                                px={8}
                                style={{
                                  backgroundColor: bg,
                                  color,
                                  borderLeft,
                                  whiteSpace: "pre-wrap",
                                  wordBreak: "break-all",
                                }}
                              >
                                {line || "\u00A0"}
                              </Box>
                            );
                          })
                        ) : (
                          <Text fz="xs" c="#64748b" p="xs">
                            File nhị phân hoặc không có nội dung diff dạng text.
                          </Text>
                        )}
                      </Box>
                    </Accordion.Panel>
                  </Accordion.Item>
                );
              })}
            </Accordion>
          </Box>
        </Stack>
      ) : (
        <Text c="#64748b" ta="center" py="xl">
          Không tìm thấy thông tin commit.
        </Text>
      )}
    </Modal>
  );
}
