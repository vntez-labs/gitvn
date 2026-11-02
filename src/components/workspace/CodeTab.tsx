"use client";

import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Button,
  CopyButton,
  Group,
  Skeleton,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import {
  IconArrowDown,
  IconCheck,
  IconCopy,
  IconFileCode,
  IconGitCommit,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { getIconForFile } from "vscode-icons-js";
import { CodeViewer } from "@/components/CodeViewer";
import { FileTree } from "@/components/FileTree";
import { MarkdownViewer } from "@/components/MarkdownViewer";
import { EmptyRepoView } from "@/components/workspace/EmptyRepoView";
import type { WorkspaceTab } from "@/components/workspace/WorkspaceHeader";
import { useDashboardStore } from "@/store/dashboard.store";
import { CodeTreeSkeleton } from "./code/CodeTreeSkeleton";
import { FileEditorHeader } from "./code/FileEditorHeader";
import { ICON_BASE_URL } from "./constants";

interface CodeTabProps {
  onNavigateTab?: (tab: WorkspaceTab) => void;
}

export function CodeTab({ onNavigateTab }: CodeTabProps) {
  const {
    tree,
    loadingTree,
    activeFile,
    selectFile,
    fileContent,
    loadingContent,
    selectedRepo,
    currentBranch,
  } = useDashboardStore();

  if (loadingTree) {
    return <CodeTreeSkeleton />;
  }

  if (tree.length === 0 && selectedRepo) {
    return <EmptyRepoView repo={selectedRepo} />;
  }

  const isMarkdown =
    activeFile?.toLowerCase().endsWith(".md") ||
    activeFile?.toLowerCase().endsWith(".mdx");
  const activeFileIcon = activeFile
    ? getIconForFile(activeFile)
    : "default_file.svg";
  const lineCount = fileContent ? fileContent.split("\n").length : 0;

  return (
    <Box
      style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "280px 1fr",
        overflow: "hidden",
        minHeight: 0,
        backgroundColor: "#ffffff",
      }}
    >
      {/* File Explorer (Left Panel) */}
      <Box
        style={{
          borderRight: "1px solid #e8e5de",
          backgroundColor: "#f5f3ee",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        <Box
          p="xs"
          px="md"
          style={{
            borderBottom: "1px solid #e8e5de",
            backgroundColor: "#f5f3ee",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text
            fz={11}
            fw={700}
            c="#6e675f"
            style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}
          >
            Files
          </Text>
          <Badge
            size="xs"
            variant="outline"
            color="gray"
            style={{ borderColor: "#e8e5de", color: "#6e675f" }}
          >
            {tree.length} files
          </Badge>
        </Box>

        <Box
          className="hide-scrollbar"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 8,
            minHeight: 0,
          }}
        >
          {tree.length === 0 ? (
            <Text fz="xs" c="#6e675f" ta="center" mt="xl">
              Không có file nào trong thư mục này
            </Text>
          ) : (
            <FileTree
              data={tree}
              activePath={activeFile}
              onFileClick={selectFile}
            />
          )}
        </Box>
      </Box>

      {/* Editor Content (Right Panel) */}
      <Box
        style={{
          backgroundColor: "#ffffff",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        {activeFile && (
          <FileEditorHeader
            activeFile={activeFile}
            activeFileIcon={activeFileIcon}
            lineCount={lineCount}
            isMarkdown={isMarkdown}
            fileContent={fileContent}
          />
        )}

        {/* Nội dung file hoặc màn hình chờ */}
        <Box
          className="hide-scrollbar"
          style={{ flex: 1, overflowY: "auto", minHeight: 0 }}
        >
          {loadingContent ? (
            <Box p="md">
              <Stack gap={8}>
                <Skeleton height={14} width="40%" radius="sm" />
                <Skeleton height={14} width="70%" radius="sm" />
                <Skeleton height={14} width="55%" radius="sm" />
                <Skeleton height={14} width="85%" radius="sm" />
                <Skeleton height={14} width="60%" radius="sm" />
                <Skeleton height={14} width="75%" radius="sm" />
                <Skeleton height={14} width="45%" radius="sm" />
                <Skeleton height={14} width="90%" radius="sm" />
              </Stack>
            </Box>
          ) : activeFile ? (
            isMarkdown ? (
              <Box
                p="xl"
                style={{ maxWidth: 880, margin: "0 auto", color: "#1f1c19" }}
              >
                <MarkdownViewer content={fileContent} />
              </Box>
            ) : (
              <CodeViewer content={fileContent} filename={activeFile} />
            )
          ) : (
            <Box ta="center" mt={120} px="md">
              <IconFileCode
                size={38}
                color="#94a3b8"
                style={{ margin: "0 auto 10px" }}
              />
              <Text fz="sm" fw={500} c="#1f1c19" mb={4}>
                Chọn một file từ Explorer để xem mã nguồn
              </Text>
              <Text fz="xs" c="#6e675f" mb="md">
                Hoặc xem lịch sử các lần thay đổi code của repository.
              </Text>
              {onNavigateTab && (
                <Button
                  size="xs"
                  variant="light"
                  color="vntez"
                  leftSection={<IconGitCommit size={14} />}
                  onClick={() => onNavigateTab("commits")}
                >
                  Xem lịch sử Commits ({currentBranch})
                </Button>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
