"use client";

import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Button,
  CopyButton,
  Group,
  Text,
  Tooltip,
} from "@mantine/core";
import { IconArrowDown, IconCheck, IconCopy } from "@tabler/icons-react";
import { getGitHubAvatarUrl } from "@/lib/avatar";
import { formatRelativeTime } from "@/lib/time";
import { ICON_BASE_URL } from "../constants";

interface FileEditorHeaderProps {
  activeFile: string;
  activeFileIcon?: string;
  lineCount: number;
  isMarkdown?: boolean;
  fileContent: string;
  lastFileCommit: any;
  currentBranch: string;
  onViewCommit: (sha: string) => void;
}

export function FileEditorHeader({
  activeFile,
  activeFileIcon = "default_file.svg",
  lineCount,
  isMarkdown = false,
  fileContent,
  lastFileCommit,
  currentBranch,
  onViewCommit,
}: FileEditorHeaderProps) {
  return (
    <>
      {/* Header file chính */}
      <Box
        px="md"
        py={6}
        style={{
          borderBottom: "1px solid #e2e8f0",
          backgroundColor: "#f8fafc",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <Group gap="xs">
          <img
            src={`${ICON_BASE_URL}/${activeFileIcon}`}
            alt=""
            width={14}
            height={14}
            style={{ display: "block" }}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                `${ICON_BASE_URL}/default_file.svg`;
            }}
          />
          <Text fz={12} c="#0f172a" fw={500} ff="monospace">
            {activeFile}
          </Text>
          {lineCount > 0 && !isMarkdown && (
            <Badge size="xs" variant="subtle" color="gray">
              {lineCount} lines
            </Badge>
          )}
        </Group>

        <CopyButton value={fileContent}>
          {({ copied, copy }) => (
            <Tooltip label={copied ? "Đã sao chép" : "Sao chép mã"} withArrow>
              <ActionIcon
                size="sm"
                variant="subtle"
                color={copied ? "teal" : "gray"}
                onClick={copy}
              >
                {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
              </ActionIcon>
            </Tooltip>
          )}
        </CopyButton>
      </Box>

      {/* GitLens Blame Bar (Commit gần nhất của file) */}
      {lastFileCommit && (
        <Box
          px="md"
          py={4}
          style={{
            borderBottom: "1px solid #e2e8f0",
            backgroundColor: "#f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
            fontSize: 11,
          }}
        >
          <Group gap={6} wrap="nowrap" style={{ overflow: "hidden", flex: 1 }}>
            <Avatar
              src={getGitHubAvatarUrl(
                lastFileCommit.author || {
                  login: lastFileCommit.commit?.author?.name,
                },
                32,
              )}
              alt={lastFileCommit.commit?.author?.name}
              size={16}
              radius="xl"
            />
            <Text fz={11} c="#64748b" truncate>
              <span style={{ color: "#0f172a", fontWeight: 600 }}>
                {lastFileCommit.commit?.author?.name || "Ai đó"}
              </span>
              {" • "}
              {formatRelativeTime(lastFileCommit.commit?.author?.date)}
              {': "'}
              <span style={{ color: "#334155" }}>
                {lastFileCommit.commit?.message?.split("\n")[0]}
              </span>
              {'"'}
            </Text>
            <Badge
              size="xs"
              variant="outline"
              color="vntez"
              ff="monospace"
              style={{ flexShrink: 0 }}
            >
              {lastFileCommit.sha?.slice(0, 7)}
            </Badge>
          </Group>

          <Button
            size="compact-xs"
            variant="subtle"
            color="vntez"
            onClick={() => {
              if (lastFileCommit.sha) onViewCommit(lastFileCommit.sha);
            }}
            style={{ flexShrink: 0, fontSize: 11 }}
          >
            Xem commit
          </Button>
        </Box>
      )}

      {/* Git Sync / Pull Reminder cho người mới */}
      <Box
        px="md"
        py={4}
        style={{
          borderBottom: "1px solid #e2e8f0",
          backgroundColor: "#fff1f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <Group gap={6} wrap="nowrap">
          <IconArrowDown size={12} color="#fb291a" />
          <Text fz={11} c="#475569">
            Cần lấy code mới nhất về máy tính? Chạy{" "}
            <span
              style={{
                fontFamily: "monospace",
                color: "#db1b0e",
                fontWeight: 600,
              }}
            >
              git pull origin {currentBranch}
            </span>
          </Text>
        </Group>

        <CopyButton value={`git pull origin ${currentBranch}`}>
          {({ copied, copy }) => (
            <Button
              size="compact-xs"
              variant="transparent"
              color={copied ? "teal" : "vntez"}
              onClick={copy}
              leftSection={
                copied ? <IconCheck size={11} /> : <IconCopy size={11} />
              }
              style={{ fontSize: 11 }}
            >
              {copied ? "Đã sao chép" : "Copy lệnh pull"}
            </Button>
          )}
        </CopyButton>
      </Box>
    </>
  );
}
