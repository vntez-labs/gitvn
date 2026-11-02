"use client";

import {
  Badge,
  Box,
  Button,
  Group,
  Modal,
  Paper,
  SegmentedControl,
  Skeleton,
  Stack,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconColumns,
  IconDeviceFloppy,
  IconEdit,
  IconEye,
  IconFileText,
  IconFolderPlus,
  IconSparkles,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { MarkdownViewer } from "@/components/MarkdownViewer";
import type { GitvnDocItem } from "@/interfaces/gitvn";
import { docsService } from "@/services/docs.service";
import { useDashboardStore } from "@/store/dashboard.store";
import { CreateNewDocModal } from "./CreateNewDocModal";
import { DocsSidebar } from "./DocsSidebar";
import { DocsSnippetsBar } from "./DocsSnippetsBar";

interface DocsTabProps {
  onInitializeGitvn?: () => void;
  hasGitvn?: boolean;
}

export function DocsTab({ onInitializeGitvn, hasGitvn = true }: DocsTabProps) {
  const { selectedRepo, currentBranch } = useDashboardStore();
  const [docs, setDocs] = useState<GitvnDocItem[]>([]);
  const [activeDocId, setActiveDocId] = useState<string>("");
  const [activeDoc, setActiveDoc] = useState<GitvnDocItem | null>(null);
  const [mode, setMode] = useState<"preview" | "edit" | "split">("preview");
  const [editContent, setEditContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [newDocModalOpen, setNewDocModalOpen] = useState(false);
  const [newDocName, setNewDocName] = useState("");

  const fetchDocs = () => {
    if (!selectedRepo) return;
    setLoading(true);

    docsService
      .fetchDocs(selectedRepo.owner.login, selectedRepo.name, currentBranch)
      .then((data) => {
        const fetchedDocs: GitvnDocItem[] = data.docs || [];
        setDocs(fetchedDocs);

        if (fetchedDocs.length > 0) {
          const current =
            fetchedDocs.find((d) => d.id === activeDocId) || fetchedDocs[0];
          setActiveDocId(current.id);
          setActiveDoc(current);
          setEditContent(current.content || "");
        } else {
          setActiveDocId("");
          setActiveDoc(null);
          setEditContent("");
        }
      })
      .catch((err) => {
        console.error("Lỗi tải danh sách tài liệu MDX:", err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDocs();
  }, [selectedRepo?.id, currentBranch]);

  const handleSelectDoc = (doc: GitvnDocItem) => {
    setActiveDocId(doc.id);
    setActiveDoc(doc);
    setEditContent(doc.content || "");
  };

  const handleSaveDoc = async () => {
    if (!selectedRepo || !activeDoc) return;
    setSaving(true);

    try {
      await docsService.saveDoc(
        selectedRepo.owner.login,
        selectedRepo.name,
        currentBranch,
        activeDoc.name,
        editContent,
      );

      notifications.show({
        title: "Đã lưu tài liệu thành công!",
        message: `Tài liệu .gitvn/docs/${activeDoc.name} đã được cập nhật.`,
        color: "teal",
      });

      const updated = docs.map((d) =>
        d.id === activeDoc.id ? { ...d, content: editContent } : d,
      );
      setDocs(updated);
      setActiveDoc({ ...activeDoc, content: editContent });
    } catch (err: any) {
      notifications.show({
        title: "Lưu thất bại",
        message: err.response?.data?.error || "Có lỗi xảy ra khi lưu file.",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNewDoc = async () => {
    if (!selectedRepo || !newDocName.trim()) return;
    const cleanName = newDocName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-");
    const filename = cleanName.endsWith(".mdx")
      ? cleanName
      : `${cleanName}.mdx`;

    try {
      await docsService.createDoc(
        selectedRepo.owner.login,
        selectedRepo.name,
        currentBranch,
        filename,
      );

      notifications.show({
        title: "Tạo tài liệu mới thành công",
        message: `Đã tạo file .gitvn/docs/${filename}`,
        color: "teal",
      });

      setNewDocModalOpen(false);
      setNewDocName("");
      fetchDocs();
    } catch (err: any) {
      notifications.show({
        title: "Tạo file thất bại",
        message: err.response?.data?.error || "Có lỗi xảy ra",
        color: "red",
      });
    }
  };

  const insertSnippet = (snippet: string) => {
    setEditContent((prev) => `${prev}\n\n${snippet}\n`);
  };

  if (!loading && docs.length === 0 && !hasGitvn) {
    return (
      <Box
        p="xl"
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8fafc",
        }}
      >
        <Paper
          p="xl"
          radius="md"
          bg="#ffffff"
          style={{
            border: "1px solid #e2e8f0",
            maxWidth: 540,
            textAlign: "center",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
          }}
        >
          <Box
            w={64}
            h={64}
            mx="auto"
            mb="md"
            style={{
              borderRadius: 16,
              backgroundColor: "#fff1f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fb291a",
            }}
          >
            <IconFileText size={32} />
          </Box>
          <Text fz={18} fw={700} c="#0f172a" mb="xs">
            Chưa có thư mục tài liệu .gitvn/docs
          </Text>
          <Text fz="sm" c="#64748b" mb="xl" lh={1.6}>
            Tài liệu dự án dạng MDX được lưu chuẩn trong{" "}
            <code>.gitvn/docs/</code>. Khởi tạo ngay để tạo file{" "}
            <code>index.mdx</code> với các công cụ soạn thảo trực quan.
          </Text>
          <Button
            size="md"
            variant="filled"
            color="vntez"
            leftSection={<IconSparkles size={18} />}
            onClick={onInitializeGitvn}
            style={{ fontWeight: 600 }}
          >
            Khởi tạo .gitvn và Tài liệu MDX
          </Button>
        </Paper>
      </Box>
    );
  }

  if (loading) {
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
        <Box
          p="md"
          style={{
            borderRight: "1px solid #e2e8f0",
            backgroundColor: "#f8fafc",
          }}
        >
          <Group justify="space-between" mb="lg">
            <Skeleton height={16} width={100} radius="sm" />
            <Skeleton height={24} width={24} radius="sm" />
          </Group>
          <Stack gap="sm">
            <Skeleton height={32} radius="sm" />
            <Skeleton height={32} radius="sm" />
            <Skeleton height={32} radius="sm" />
          </Stack>
        </Box>
        <Box p="lg">
          <Group justify="space-between" mb="xl">
            <Skeleton height={20} width={220} radius="sm" />
            <Group gap="sm">
              <Skeleton height={30} width={180} radius="sm" />
              <Skeleton height={30} width={100} radius="sm" />
            </Group>
          </Group>
          <Stack gap="md" maw={860}>
            <Skeleton height={36} width="60%" radius="sm" />
            <Skeleton height={14} width="95%" radius="sm" mt="md" />
            <Skeleton height={14} width="90%" radius="sm" />
            <Skeleton height={140} radius="md" mt="md" />
          </Stack>
        </Box>
      </Box>
    );
  }

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
      {/* CỘT TRÁI: SIDEBAR */}
      <DocsSidebar
        docs={docs}
        activeDocId={activeDocId}
        onSelectDoc={handleSelectDoc}
        onOpenNewDocModal={() => setNewDocModalOpen(true)}
      />

      {/* CỘT PHẢI: SOẠN THẢO VÀ XEM TRỰC TIẾP */}
      <Box
        style={{
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        {/* Header Toolbar */}
        <Box
          px="lg"
          py={8}
          style={{
            borderBottom: "1px solid #e2e8f0",
            backgroundColor: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <Group gap="xs">
            <Text fw={600} fz={15} c="#0f172a">
              {activeDoc?.title || activeDoc?.name || "Tài liệu"}
            </Text>
            <Badge
              size="sm"
              variant="light"
              color="vntez"
              radius="sm"
              ff="monospace"
            >
              .gitvn/docs/{activeDoc?.name}
            </Badge>
          </Group>

          <Group gap="sm" wrap="nowrap">
            <SegmentedControl
              value={mode}
              onChange={(val) => setMode(val as any)}
              size="xs"
              data={[
                {
                  value: "preview",
                  label: (
                    <Group gap={4} wrap="nowrap" align="center">
                      <IconEye size={13} />
                      <span>Xem trước</span>
                    </Group>
                  ),
                },
                {
                  value: "edit",
                  label: (
                    <Group gap={4} wrap="nowrap" align="center">
                      <IconEdit size={13} />
                      <span>Soạn thảo</span>
                    </Group>
                  ),
                },
                {
                  value: "split",
                  label: (
                    <Group gap={4} wrap="nowrap" align="center">
                      <IconColumns size={13} />
                      <span>Chia đôi</span>
                    </Group>
                  ),
                },
              ]}
              styles={{
                root: { backgroundColor: "#f1f5f9" },
                indicator: {
                  backgroundColor: "#ffffff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                },
                label: { fontSize: 12, fontWeight: 500, padding: "3px 8px" },
              }}
            />

            <Button
              size="xs"
              variant="filled"
              color="vntez"
              leftSection={<IconDeviceFloppy size={14} />}
              loading={saving}
              onClick={handleSaveDoc}
              style={{ fontWeight: 600 }}
            >
              Lưu & Đồng bộ
            </Button>
          </Group>
        </Box>

        {/* Snippets Toolbar */}
        {(mode === "edit" || mode === "split") && (
          <DocsSnippetsBar onInsert={insertSnippet} />
        )}

        {/* Nội dung Preview / Edit */}
        <Box
          style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}
        >
          {(mode === "edit" || mode === "split") && (
            <Box
              style={{
                flex: mode === "split" ? 0.5 : 1,
                borderRight: mode === "split" ? "1px solid #e2e8f0" : "none",
                display: "flex",
                flexDirection: "column",
                height: "100%",
              }}
            >
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.currentTarget.value)}
                placeholder="Nhập nội dung Markdown / MDX..."
                autosize={false}
                styles={{
                  root: { flex: 1, display: "flex", flexDirection: "column" },
                  wrapper: { flex: 1, display: "flex" },
                  input: {
                    flex: 1,
                    height: "100%",
                    borderRadius: 0,
                    border: "none",
                    fontFamily: "var(--font-geist-mono), monospace",
                    fontSize: 13,
                    lineHeight: 1.6,
                    padding: 16,
                    backgroundColor: "#f8fafc",
                    color: "#0f172a",
                    resize: "none",
                  },
                }}
              />
            </Box>
          )}

          {(mode === "preview" || mode === "split") && (
            <Box
              className="hide-scrollbar"
              style={{
                flex: mode === "split" ? 0.5 : 1,
                overflowY: "auto",
                backgroundColor: "#ffffff",
                padding: "24px 32px",
                height: "100%",
              }}
            >
              {editContent ? (
                <MarkdownViewer content={editContent} />
              ) : (
                <Box py={60} ta="center" c="#94a3b8">
                  <IconAlertCircle size={28} style={{ margin: "0 auto 8px" }} />
                  <Text fz={13}>
                    Tài liệu đang trống. Hãy chuyển sang tab Soạn thảo để viết
                    nội dung.
                  </Text>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Box>

      {/* Modal Tạo tài liệu mới */}
      <CreateNewDocModal
        opened={newDocModalOpen}
        onClose={() => setNewDocModalOpen(false)}
        newDocName={newDocName}
        setNewDocName={setNewDocName}
        onCreateDoc={handleCreateNewDoc}
      />
    </Box>
  );
}
