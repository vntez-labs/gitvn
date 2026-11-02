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
import axios from "axios";
import { useEffect, useState } from "react";
import { getIconForFile } from "vscode-icons-js";
import { CodeViewer } from "@/components/CodeViewer";
import { FileTree } from "@/components/FileTree";
import { MarkdownViewer } from "@/components/MarkdownViewer";
import { CommitDetailModal } from "@/components/workspace/CommitDetailModal";
import { EmptyRepoView } from "@/components/workspace/EmptyRepoView";
import type { WorkspaceTab } from "@/components/workspace/WorkspaceHeader";
import { formatRelativeTime } from "@/lib/time";
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

  const [lastFileCommit, setLastFileCommit] = useState<any>(null);
  const [loadingCommit, setLoadingCommit] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSha, setSelectedSha] = useState<string | null>(null);

  // GitLens file blame: Lấy commit mới nhất của file đang mở
  useEffect(() => {
    if (!selectedRepo || !activeFile) {
      setLastFileCommit(null);
      return;
    }

    setLoadingCommit(true);
    axios
      .get(
        `/api/github/commits?owner=${selectedRepo.owner.login}&repo=${selectedRepo.name}&branch=${encodeURIComponent(
          currentBranch,
        )}&path=${encodeURIComponent(activeFile)}&per_page=1`,
      )
      .then((res) => {
        const commits = res.data.commits || [];
        setLastFileCommit(commits.length > 0 ? commits[0] : null);
      })
      .catch(() => setLastFileCommit(null))
      .finally(() => setLoadingCommit(false));
  }, [selectedRepo?.id, currentBranch, activeFile]);

  if (loadingTree) {
    return <CodeTreeSkeleton />;
  }

  if (tree.length === 0 && selectedRepo) {
    return <EmptyRepoView repo={selectedRepo} />;
  }

  const isMarkdown =
    activeFile?.toLowerCase().endsWith(".md") ||
    activeFile?.toLowerCase().endsWith(".mdx");
  const lineCount = fileContent ? fileContent.split("\n").length : 0;
  const activeFileName = activeFile?.split("/").pop() || "";
  const activeFileIcon = activeFile
    ? getIconForFile(activeFileName)
    : "default_file.svg";

  return (
    <Box
      style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "260px 1fr",
        overflow: "hidden",
        minHeight: 0,
        backgroundColor: "#ffffff",
      }}
    >
      {/* File Explorer */}
      <Box
        style={{
          borderRight: "1px solid #e8e5de",
          backgroundColor: "#f5f3ee",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <Group
          justify="space-between"
          px="md"
          py={8}
          style={{ borderBottom: "1px solid #e8e5de", flexShrink: 0 }}
        >
          <Text
            fz={10}
            fw={700}
            c="#78716c"
            style={{ letterSpacing: "0.08em" }}
          >
            FILES
          </Text>
          <Badge size="xs" variant="transparent" c="#78716c" p={0}>
            {tree.filter((t) => t.type === "blob").length} files
          </Badge>
        </Group>

        <Box
          className="hide-scrollbar"
          style={{ flex: 1, overflow: "auto", minHeight: 0 }}
        >
          {loadingTree ? (
            <Stack gap={6} p="xs">
              <Skeleton height={20} width="70%" radius="sm" />
              <Skeleton height={20} width="85%" radius="sm" />
              <Skeleton height={20} width="60%" radius="sm" />
              <Skeleton height={20} width="75%" radius="sm" />
              <Skeleton height={20} width="90%" radius="sm" />
            </Stack>
          ) : (
            <FileTree
              data={tree}
              activePath={activeFile}
              onFileClick={selectFile}
            />
          )}
        </Box>
      </Box>

      {/* Editor Content */}
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
            lastFileCommit={lastFileCommit}
            currentBranch={currentBranch}
            onViewCommit={(sha) => {
              setSelectedSha(sha);
              setModalOpen(true);
            }}
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
                style={{ maxWidth: 880, margin: "0 auto", color: "#0f172a" }}
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
              <Text fz="sm" fw={500} c="#0f172a" mb={4}>
                Chọn một file từ Explorer để xem mã nguồn
              </Text>
              <Text fz="xs" c="#64748b" mb="md">
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

      {/* Modal chi tiết commit */}
      {selectedRepo && (
        <CommitDetailModal
          opened={modalOpen}
          onClose={() => setModalOpen(false)}
          owner={selectedRepo.owner.login}
          repo={selectedRepo.name}
          sha={selectedSha}
          branch={currentBranch}
        />
      )}
    </Box>
  );
}
