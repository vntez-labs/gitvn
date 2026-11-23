"use client";

import {
  Box,
  Button,
  Drawer,
  Skeleton,
  Stack,
  Text,
  Textarea,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconCheck,
  IconFileCode,
  IconFiles,
  IconGitCommit,
} from "@tabler/icons-react";
import axios from "axios";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MarkdownViewer } from "@/components/MarkdownViewer";
import { EmptyRepoView } from "@/components/workspace/EmptyRepoView";
import type { WorkspaceTab } from "@/components/workspace/WorkspaceHeader";
import { getDocumentFormat } from "@/lib/document-format";
import { useDashboardStore } from "@/store/dashboard.store";
import { CodeTreeSkeleton } from "./code/CodeTreeSkeleton";
import { CreateFileModal } from "./code/CreateFileModal";
import { DocumentPreview } from "./code/DocumentPreview";
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

function resolveRepositoryUrl(href: string | undefined, source: string) {
  if (!href || /^(?:#|[a-z][a-z\d+.-]*:|\/\/)/i.test(href)) return null;

  const origin = "https://repository.invalid";
  const sourcePath = source.split("/").map(encodeURIComponent).join("/");
  const base = `${origin}/${sourcePath}`;
  try {
    const target = new URL(href, base);
    return target.origin === origin ? target : null;
  } catch {
    return null;
  }
}

function decodePath(path: string) {
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

export function CodeTab({ onNavigateTab }: CodeTabProps) {
  const tree = useDashboardStore((s) => s.tree);
  const treeError = useDashboardStore((s) => s.treeError);
  const loadingTree = useDashboardStore((s) => s.loadingTree);
  const activeFile = useDashboardStore((s) => s.activeFile);
  const selectFile = useDashboardStore((s) => s.selectFile);
  const fileContent = useDashboardStore((s) => s.fileContent);
  const contentError = useDashboardStore((s) => s.contentError);
  const loadingContent = useDashboardStore((s) => s.loadingContent);
  const selectedRepo = useDashboardStore((s) => s.selectedRepo);
  const currentBranch = useDashboardStore((s) => s.currentBranch);
  const selectRepo = useDashboardStore((s) => s.selectRepo);

  const [createFileOpen, setCreateFileOpen] = useState(false);
  const [filesOpen, filesDrawer] = useDisclosure(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);

  // Kích thước thanh File Explorer có thể kéo giãn linh hoạt
  const [explorerWidth, setExplorerWidth] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("gitvn_code_explorer_width");
      if (saved) {
        const parsed = Number(saved);
        if (!Number.isNaN(parsed) && parsed >= 180 && parsed <= 700)
          return parsed;
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
    setEditContent(activeFile ? fileContent : "");
  }, [activeFile, fileContent]);

  const lineCount = useMemo(() => {
    if (!fileContent) return 0;
    let count = 1;
    for (
      let index = fileContent.indexOf("\n");
      index !== -1;
      index = fileContent.indexOf("\n", index + 1)
    ) {
      count++;
    }
    return count;
  }, [fileContent]);

  if (loadingTree) {
    return <CodeTreeSkeleton />;
  }

  if (treeError && selectedRepo) {
    return (
      <Stack p="md" align="flex-start" gap="xs" role="alert">
        <Text size="sm" c="red">
          {treeError}
        </Text>
        <Button
          size="xs"
          variant="default"
          onClick={() =>
            void selectRepo(selectedRepo, activeFile, currentBranch)
          }
        >
          Thử lại
        </Button>
      </Stack>
    );
  }

  if (tree.length === 0 && selectedRepo) {
    return <EmptyRepoView repo={selectedRepo} />;
  }

  const documentFormat = activeFile && getDocumentFormat(activeFile);
  const documentUrl =
    documentFormat && activeFile && selectedRepo
      ? `/api/github/content?${new URLSearchParams({
          owner: selectedRepo.owner.login,
          repo: selectedRepo.name,
          path: activeFile,
          ref: currentBranch,
          binary: "1",
        })}`
      : null;
  const isMarkdown =
    activeFile?.toLowerCase().endsWith(".md") ||
    activeFile?.toLowerCase().endsWith(".mdx");
  const showPlainText = fileContent.length > 100_000 || lineCount > 3_000;
  const markdownComponents =
    activeFile && selectedRepo && isMarkdown
      ? {
          a: function RepositoryLink({
            node: _node,
            href,
            ...props
          }: React.ComponentProps<"a"> & { node?: unknown }) {
            const target = resolveRepositoryUrl(href, activeFile);
            if (!target) return <a {...props} href={href} />;

            const path = target.pathname.slice(1).replace(/\/$/, "");
            const decodedPath = decodePath(path);
            const entry = tree.find((item) => item.path === decodedPath);
            const view = !path || entry?.type === "tree" ? "tree" : "blob";
            const githubUrl = `${selectedRepo.html_url}/${view}/${encodeURIComponent(currentBranch)}${path ? `/${path}` : ""}${target.search}${target.hash}`;

            return (
              <a
                {...props}
                href={githubUrl}
                onClick={(event) => {
                  if (
                    entry?.type !== "blob" ||
                    target.hash ||
                    target.search ||
                    event.button !== 0 ||
                    event.metaKey ||
                    event.ctrlKey ||
                    event.shiftKey ||
                    event.altKey
                  )
                    return;
                  event.preventDefault();
                  void selectFile(entry.path);
                }}
              />
            );
          },
          img: function RepositoryImage({
            node: _node,
            src,
            alt,
            ...props
          }: React.ComponentProps<"img"> & { node?: unknown }) {
            const target = resolveRepositoryUrl(
              typeof src === "string" ? src : undefined,
              activeFile,
            );
            const imageUrl = target
              ? `/api/github/content?${new URLSearchParams({
                  owner: selectedRepo.owner.login,
                  repo: selectedRepo.name,
                  path: decodePath(target.pathname.slice(1)),
                  ref: currentBranch,
                  binary: "image",
                })}${target.hash}`
              : src;

            // biome-ignore lint/performance/noImgElement: Repository images use browser authentication and have unknown dimensions.
            return <img {...props} src={imageUrl} alt={alt ?? ""} />;
          },
        }
      : undefined;

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
        const current = useDashboardStore.getState();
        if (
          current.selectedRepo?.id === selectedRepo.id &&
          current.currentBranch === currentBranch &&
          current.activeFile === activeFile
        ) {
          setIsEditing(false);
          void selectFile(activeFile);
        }
      }
    } catch (error) {
      notifications.show({
        title: "Lưu file thất bại",
        message: axios.isAxiosError<{ error?: string }>(error)
          ? error.response?.data?.error || error.message
          : "Không thể lưu file.",
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
        visibleFrom="md"
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
        visibleFrom="md"
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
        <Box hiddenFrom="md" px="xs" py={4}>
          <Button
            size="compact-xs"
            variant="default"
            leftSection={<IconFiles size={14} />}
            onClick={filesDrawer.open}
          >
            Danh sách file
          </Button>
        </Box>
        <Drawer
          opened={filesOpen}
          onClose={filesDrawer.close}
          title="Danh sách file"
          size="xs"
        >
          <Box h="75dvh">
            <FileExplorerDock
              tree={tree}
              activeFile={activeFile}
              onSelectFile={(path) => {
                void selectFile(path);
                filesDrawer.close();
              }}
              onCreateFileClick={() => {
                filesDrawer.close();
                handleOpenCreateFile();
              }}
            />
          </Box>
        </Drawer>
        {activeFile && !contentError && (
          <FileEditorHeader
            activeFile={activeFile}
            lineCount={lineCount}
            isMarkdown={isMarkdown}
            fileContent={isEditing ? editContent : fileContent}
            downloadUrl={documentUrl ?? undefined}
            isEditing={isEditing && !documentFormat}
            onToggleEdit={
              documentFormat || loadingContent
                ? undefined
                : () => {
                    if (!isEditing) setEditContent(fileContent);
                    setIsEditing(!isEditing);
                  }
            }
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
          ) : contentError && activeFile ? (
            <Stack p="md" align="flex-start" gap="xs" role="alert">
              <Text size="sm" c="red">
                {contentError}
              </Text>
              <Button
                size="xs"
                variant="default"
                onClick={() => void selectFile(activeFile)}
              >
                Thử lại
              </Button>
            </Stack>
          ) : activeFile ? (
            documentUrl && documentFormat ? (
              <DocumentPreview
                key={documentUrl}
                filename={activeFile}
                format={documentFormat}
                url={documentUrl}
              />
            ) : isEditing ? (
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
                <MarkdownViewer
                  content={fileContent}
                  components={markdownComponents}
                />
              </Box>
            ) : showPlainText ? (
              <Box p="md">
                <Text size="xs" c="dimmed">
                  File lớn đang hiển thị dưới dạng văn bản thường.
                </Text>
                <Box
                  component="pre"
                  ff="monospace"
                  style={{ whiteSpace: "pre" }}
                >
                  {fileContent}
                </Box>
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
