"use client";

import {
  Accordion,
  Badge,
  Box,
  Group,
  Modal,
  Skeleton,
  Stack,
  Text,
} from "@mantine/core";
import { IconFileDiff, IconGitCompare } from "@tabler/icons-react";
import axios from "axios";
import { useEffect, useState } from "react";

interface CompareDiffModalProps {
  opened: boolean;
  onClose: () => void;
  owner: string;
  repo: string;
  baseBranch: string;
  headBranch: string;
}

export function CompareDiffModal({
  opened,
  onClose,
  owner,
  repo,
  baseBranch,
  headBranch,
}: CompareDiffModalProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{
    ahead_by: number;
    behind_by: number;
    files: any[];
    commits: any[];
  } | null>(null);

  useEffect(() => {
    if (!opened || !owner || !repo || !headBranch) return;

    setLoading(true);
    axios
      .get(
        `/api/github/compare?owner=${owner}&repo=${repo}&base=${encodeURIComponent(
          baseBranch,
        )}&head=${encodeURIComponent(headBranch)}`,
      )
      .then((res) => {
        setData(res.data);
      })
      .catch((err) => console.error("Lỗi compare:", err))
      .finally(() => setLoading(false));
  }, [opened, owner, repo, baseBranch, headBranch]);

  const files = data?.files || [];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="xl"
      title={
        <Group gap="xs">
          <IconGitCompare size={18} color="#6366f1" />
          <Text fw={700} fz={15} c="#18181b">
            So sánh Diff: <span style={{ color: "#4f46e5" }}>{baseBranch}</span>{" "}
            ← <span style={{ color: "#18181b" }}>{headBranch}</span>
          </Text>
        </Group>
      }
      styles={{
        content: { borderRadius: 12 },
        header: {
          backgroundColor: "#f8fafc",
          borderBottom: "1px solid #e4e4e7",
          padding: "14px 20px",
        },
        body: { padding: 20 },
      }}
    >
      {loading ? (
        <Stack gap="sm">
          <Skeleton height={28} radius="sm" />
          <Skeleton height={140} radius="sm" />
          <Skeleton height={140} radius="sm" />
        </Stack>
      ) : files.length === 0 ? (
        <Box ta="center" py="xl">
          <Text fz="sm" c="#64748b">
            Không có sự khác biệt (diff) nào giữa hai nhánh này.
          </Text>
        </Box>
      ) : (
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <Text fz={13} fw={600} c="#475569">
              {files.length} file thay đổi ({data?.ahead_by || 0} commit)
            </Text>
          </Group>

          <Accordion
            variant="separated"
            radius="md"
            styles={{
              item: { border: "1px solid #e2e8f0", marginBottom: 8 },
              control: { padding: "10px 14px" },
              content: { padding: 0 },
            }}
          >
            {files.map((file: any) => {
              const patchLines = (file.patch || "").split("\n");

              return (
                <Accordion.Item key={file.filename} value={file.filename}>
                  <Accordion.Control>
                    <Group justify="space-between" wrap="nowrap" pr="xs">
                      <Group
                        gap="xs"
                        wrap="nowrap"
                        style={{ overflow: "hidden" }}
                      >
                        <IconFileDiff size={15} color="#fb291a" />
                        <Text fz={12.5} fw={600} ff="monospace" truncate>
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
                                whiteSpace: "pre",
                              }}
                            >
                              {line}
                            </Box>
                          );
                        })
                      ) : (
                        <Text fz={11} c="#94a3b8" p="xs">
                          (Nội dung file nhị phân hoặc không có patch text)
                        </Text>
                      )}
                    </Box>
                  </Accordion.Panel>
                </Accordion.Item>
              );
            })}
          </Accordion>
        </Stack>
      )}
    </Modal>
  );
}
