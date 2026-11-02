"use client";

import {
  Alert,
  Button,
  FileInput,
  Group,
  Stack,
  Text,
  Textarea,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconCheck,
  IconFileImport,
  IconUpload,
} from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { docsService } from "@/services/docs.service";

interface DocsImportTabProps {
  owner: string;
  repo: string;
  branch: string;
  onDocsUpdated: () => void;
  onClose: () => void;
}

export function DocsImportTab({
  owner,
  repo,
  branch,
  onDocsUpdated,
  onClose,
}: DocsImportTabProps) {
  const [inputText, setInputText] = useState("");
  const [importing, setImporting] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const parsedImportPreview = useMemo(() => {
    const trimmed = inputText.trim();
    if (!trimmed) return null;

    try {
      const obj = JSON.parse(trimmed);
      let items: any[] = [];
      if (Array.isArray(obj)) {
        items = obj;
      } else if (typeof obj === "object" && obj !== null) {
        items = Array.isArray(obj.docs) ? obj.docs : [];
      }

      const validDocs = items.filter(
        (it) => it && (it.filename || it.name || it.title),
      );

      return {
        valid: validDocs.length > 0,
        docCount: validDocs.length,
        docs: validDocs,
      };
    } catch (err: any) {
      return {
        valid: false,
        error: `Lỗi cú pháp JSON: ${err.message}`,
      };
    }
  }, [inputText]);

  const handleFileUpload = (file: File | null) => {
    if (!file) return;
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setInputText(text || "");
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (!parsedImportPreview || !parsedImportPreview.valid) return;
    setImporting(true);

    try {
      const docsToSave = parsedImportPreview.docs || [];
      for (const item of docsToSave) {
        const filename = item.filename || item.name || `${item.title}.mdx`;
        const content = item.content || `# ${item.title || filename}\n\n`;
        await docsService.saveDoc(owner, repo, branch, filename, content);
      }

      notifications.show({
        title: "Nhập tài liệu thành công!",
        message: `Đã nhập và lưu ${docsToSave.length} file tài liệu vào .gitvn/docs!`,
        color: "teal",
        icon: <IconCheck size={16} />,
      });

      onDocsUpdated();
      onClose();
    } catch (err: any) {
      notifications.show({
        title: "Nhập tài liệu thất bại",
        message: err.response?.data?.error || err.message || "Lỗi lưu tài liệu",
        color: "red",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Stack gap="sm">
      <FileInput
        size="xs"
        placeholder="Tải lên file docs.json từ máy tính..."
        accept=".json,application/json"
        leftSection={<IconUpload size={14} />}
        onChange={handleFileUpload}
        clearable
      />

      {parsedImportPreview &&
        (parsedImportPreview.valid ? (
          <Alert color="teal" icon={<IconCheck size={16} />} py={6}>
            <Text fz={12} fw={600}>
              Hợp lệ: Sẵn sàng nhập {parsedImportPreview.docCount} tài liệu vào
              .gitvn/docs
              {uploadedFileName && ` (từ ${uploadedFileName})`}
            </Text>
          </Alert>
        ) : (
          <Alert color="red" icon={<IconAlertCircle size={16} />} py={6}>
            <Text fz={12}>{parsedImportPreview.error}</Text>
          </Alert>
        ))}

      <Textarea
        placeholder="Hoặc dán JSON chứa danh sách tài liệu (vd: { docs: [{ filename: 'api.mdx', content: '...' }] })..."
        value={inputText}
        onChange={(e) => setInputText(e.currentTarget.value)}
        rows={10}
        styles={{
          input: {
            backgroundColor: "#ffffff",
            borderColor: "#cbd5e1",
            color: "#0f172a",
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: 12,
            lineHeight: 1.5,
            borderRadius: 8,
          },
        }}
      />

      <Group justify="flex-end" gap="xs">
        <Button
          variant="default"
          size="xs"
          onClick={onClose}
          disabled={importing}
        >
          Hủy
        </Button>
        <Button
          color="vntez"
          size="xs"
          loading={importing}
          disabled={!parsedImportPreview || !parsedImportPreview.valid}
          leftSection={<IconFileImport size={14} />}
          onClick={handleExecuteImport}
        >
          Nhập & Lưu vào .gitvn/docs
        </Button>
      </Group>
    </Stack>
  );
}
