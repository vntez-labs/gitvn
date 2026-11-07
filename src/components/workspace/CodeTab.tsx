"use client";

import { Box, Button, Skeleton, Stack, Text, Textarea } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconFileCode, IconGitCommit } from "@tabler/icons-react";
import axios from "axios";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { MarkdownViewer } from "@/components/MarkdownViewer";
import { EmptyRepoView } from "@/components/workspace/EmptyRepoView";
import type { WorkspaceTab } from "@/components/workspace/WorkspaceHeader";
import { useDashboardStore } from "@/store/dashboard.store";
import { CodeTreeSkeleton } from "./code/CodeTreeSkeleton";
import { CreateFileModal } from "./code/CreateFileModal";
import { FileEditorHeader } from "./code/FileEditorHeader";
import { FileExplorerDock } from "./code/FileExplorerDock";

const CodeViewer = dynamic(
  () => import("@/components/CodeViewer").then((mod) => mod.CodeViewer),
  {
    ssr: false,
    loading: () => (
      <Stack p="xl" gap="sm">
        <Skeleton height={18} width="35%" radius="sm" />
        <Skeleton height={18} width="60%" radius="sm" />
        <Skeleton height={18} width="45%" radius="sm" />
        <Skeleton height={18} width="75%" radius="sm" />
        <Skeleton height={18} width="50%" radius="sm" />
        <Skeleton height={18} width="40%" radius="sm" />
      </Stack>
    ),
  },
);

interface CodeTabProps {
  onNavigateTab?: (tab: WorkspaceTab) => void;
}

export function CodeTab({ onNavigateTab }: CodeTabProps) {
  const tree = useDashboardStore((s) => s.tree);
  const loadingTree = useDashboardStore((s) => s.loadingTree);
  const activeFile = useDashboardStore((s) => s.activeFile);
  const selectFile = useDashboardStore((s) => s.selectFile);
  const fileContent = useDashboardStore((s) => s.fileContent);
  const loadingContent = useDashboardStore((s) => s.loadingContent);
  const selectedRepo = useDashboardStore((s) => s.selectedRepo);
  const currentBranch = useDashboardStore((s) => s.currentBranch);
  const selectRepo = useDashboardStore((s) => s.selectRepo);

  const [createFileOpen, setCreateFileOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);

  // Kích thước thanh File Explorer có thể kéo giãn linh hoạt
  const [explorerWidth, setExplorerWidth] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("gitvn_code_explorer_width");
      if (saved) {
        const parsed = Number(saved);
        if (!isNaN(parsed) && parsed >= 180 && parsed <= 700) return parsed;
      }
    }
    return 280;
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartXRef = useRef<number>(0);
  const dragStartWidthRef = useRef<number>(280);

  const handleOpenCreateFile = useCallback(() => {
    setCreateFileOpen(true);
  }, []);

  const handleStartResize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      dragStartXRef.current = e.clientX;
      dragStartWidthRef.current = explorerWidth;
    },
    [explorerWidth],
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - dragStartXRef.current;
      const maxAllowed = Math.min(700, window.innerWidth - 300);
      const newWidth = Math.min(
        Math.max(180, dragStartWidthRef.current + delta),
        maxAllowed,
      );
      setExplorerWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setExplorerWidth((w) => {
        localStorage.setItem("gitvn_code_explorer_width", String(w));
        return w;
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

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
        display: "flex",
        flexDirection: "row",
        overflow: "hidden",
        minHeight: 0,
        backgroundColor: "#ffffff",
        userSelect: isDragging ? "none" : "auto",
        cursor: isDragging ? "col-resize" : "auto",
      }}
    >
      {/* File Explorer (Left Panel) */}
      <Box
        style={{
          width: explorerWidth,
          minWidth: 180,
          maxWidth: 700,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <FileExplorerDock
          tree={tree}
          activeFile={activeFile}
          onSelectFile={selectFile}
          onCreateFileClick={handleOpenCreateFile}
        />
      </Box>

      {/* Draggable Divider Handle */}
      <Box
        onMouseDown={handleStartResize}
        onDoubleClick={() => {
          setExplorerWidth(280);
          localStorage.setItem("gitvn_code_explorer_width", "280");
        }}
        title="Kéo sang hai bên để thay đổi kích thước File Explorer (Nhấp đúp để đặt lại 280px)"
        style={{
          width: 7,
          margin: "0 -3px",
          cursor: "col-resize",
          position: "relative",
          zIndex: 10,
          display: "flex",
          justifyContent: "center",
          alignItems: "stretch",
          flexShrink: 0,
          backgroundColor: isDragging
            ? "rgba(220, 38, 38, 0.15)"
            : "transparent",
          transition: "background-color 0.15s ease",
        }}
        onMouseEnter={(e) => {
          if (!isDragging) {
            e.currentTarget.style.backgroundColor = "rgba(220, 38, 38, 0.08)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isDragging) {
            e.currentTarget.style.backgroundColor = "transparent";
          }
        }}
      >
        <Box
          style={{
            width: 1,
            height: "100%",
            backgroundColor: isDragging ? "#dc2626" : "#e4e4e7",
            transition: "background-color 0.15s ease",
          }}
        />
      </Box>

      {/* Editor Content (Right Panel) */}
      <Box
        style={{
          flex: 1,
          minWidth: 0,
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
          style={{
            flex: 1,
            overflowX: "auto",
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
                  wrap="off"
                  style={{ flex: 1, display: "flex", flexDirection: "column" }}
                  styles={{
                    wrapper: { flex: 1, display: "flex" },
                    input: {
                      flex: 1,
                      fontFamily:
                        "var(--font-jetbrains-mono), 'JetBrains Mono', monospace",
                      fontSize: 14,
                      lineHeight: 1.7,
                      backgroundColor: "#ffffff",
                      color: "#18181b",
                      borderColor: "#e4e4e7",
                      borderRadius: 8,
                      resize: "none",
                      padding: 16,
                      whiteSpace: "pre",
                      overflowX: "auto",
                    },
                  }}
                />
              </Box>
            ) : isMarkdown ? (
              <Box
                className="max-w-4xl mx-auto py-8 px-10"
                style={{ width: "100%", color: "#18181b" }}
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
                color="#a1a1aa"
                style={{ margin: "0 auto 10px" }}
              />
              <Text fz={13} fw={500} c="#18181b" mb={4}>
                Chọn một file từ Explorer để xem mã nguồn
              </Text>
              <Text fz="xs" c="#71717a" mb="md">
                Hoặc xem lịch sử các lần thay đổi code của repository.
              </Text>
              {onNavigateTab && (
                <Button
                  size="xs"
                  variant="default"
                  leftSection={<IconGitCommit size={14} color="#6366f1" />}
                  onClick={() => onNavigateTab("commits")}
                  styles={{
                    root: {
                      backgroundColor: "#ffffff",
                      borderColor: "#e4e4e7",
                      color: "#3f3f46",
                      fontWeight: 500,
                      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                      borderRadius: 6,
                    },
                  }}
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
