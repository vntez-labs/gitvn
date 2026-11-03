"use client";

import { Box, Button, Skeleton, Stack, Text, Textarea } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconFileCode, IconGitCommit } from "@tabler/icons-react";
import axios from "axios";
import { useEffect, useState } from "react";
import { CodeViewer } from "@/components/CodeViewer";
import { MarkdownViewer } from "@/components/MarkdownViewer";
import { EmptyRepoView } from "@/components/workspace/EmptyRepoView";
import type { WorkspaceTab } from "@/components/workspace/WorkspaceHeader";
import { useDashboardStore } from "@/store/dashboard.store";
import { CodeTreeSkeleton } from "./code/CodeTreeSkeleton";
import { CreateFileModal } from "./code/CreateFileModal";
import { FileEditorHeader } from "./code/FileEditorHeader";
import { FileExplorerDock } from "./code/FileExplorerDock";

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
    selectRepo,
  } = useDashboardStore();

  const [createFileOpen, setCreateFileOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setIsEditing(false);
    setEditContent(fileContent || "");
  }, [activeFile, fileContent]);

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

  const handleSaveFile = async () => {
    if (!selectedRepo || !activeFile) return;
    setSaving(true);
    try {
      const res = await axios.put("/api/github/content", {
        owner: selectedRepo.owner.login,
        repo: selectedRepo.name,
        path: activeFile,
        branch: currentBranch,
        content: editContent,
        message: `chore: update ${activeFile} via GitVN`,
      });

      if (res.data.success) {
        notifications.show({
          title: "Đã lưu & commit thành công!",
          message: `Thay đổi trên ${activeFile} đã được đẩy lên branch ${currentBranch}`,
          color: "teal",
          icon: <IconCheck size={16} />,
        });
        setIsEditing(false);
        selectFile(activeFile);
      }
    } catch (err: any) {
      notifications.show({
        title: "Lưu file thất bại",
        message: err.response?.data?.error || err.message,
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

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
      {/* File Explorer (Left Panel - Dark Mode) */}
      <FileExplorerDock
        tree={tree}
        activeFile={activeFile}
        onSelectFile={selectFile}
        onCreateFileClick={() => setCreateFileOpen(true)}
      />

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
            lineCount={lineCount}
            isMarkdown={isMarkdown}
            fileContent={isEditing ? editContent : fileContent}
            isEditing={isEditing}
            onToggleEdit={() => {
              if (!isEditing) setEditContent(fileContent);
              setIsEditing(!isEditing);
            }}
            onSave={handleSaveFile}
            saving={saving}
          />
        )}

        {/* Nội dung file hoặc màn hình chờ */}
        <Box
          className="hide-scrollbar"
          style={{
            flex: 1,
            overflowY: "auto",
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
          }}
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
              </Stack>
            </Box>
          ) : activeFile ? (
            isEditing ? (
              <Box p="md" style={{ flex: 1, display: "flex" }}>
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.currentTarget.value)}
                  style={{ flex: 1, display: "flex", flexDirection: "column" }}
                  styles={{
                    wrapper: { flex: 1, display: "flex" },
                    input: {
                      flex: 1,
                      fontFamily: "var(--font-geist-mono), monospace",
                      fontSize: 13,
                      lineHeight: 1.6,
                      backgroundColor: "#0f172a",
                      color: "#f8fafc",
                      borderColor: "#334155",
                      borderRadius: 8,
                      resize: "none",
                      padding: 16,
                    },
                  }}
                />
              </Box>
            ) : isMarkdown ? (
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
              <Text fz={12} fw={500} c="#1f1c19" mb={4}>
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

      {/* Modal tạo file mới */}
      {selectedRepo && (
        <CreateFileModal
          opened={createFileOpen}
          onClose={() => setCreateFileOpen(false)}
          owner={selectedRepo.owner.login}
          repo={selectedRepo.name}
          branch={currentBranch}
          onSuccess={(newPath) => {
            selectRepo(selectedRepo, newPath, currentBranch);
          }}
        />
      )}
    </Box>
  );
}
