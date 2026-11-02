"use client";

import {
  Button,
  CopyButton,
  Group,
  Paper,
  Stack,
  Text,
  Textarea,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconCopy, IconDownload } from "@tabler/icons-react";
import { useMemo } from "react";
import type { GitvnDocItem } from "@/interfaces/gitvn";

interface DocsExportTabProps {
  docs: GitvnDocItem[];
  repo: string;
}

export function DocsExportTab({ docs, repo }: DocsExportTabProps) {
  const exportJsonString = useMemo(() => {
    const payload = {
      version: "1.0.0",
      repo,
      exportedAt: new Date().toISOString(),
      docs: docs.map((d) => ({
        filename: d.name || `${d.id}.mdx`,
        title: d.title || d.name,
        content: d.content || "",
      })),
    };
    return JSON.stringify(payload, null, 2);
  }, [docs, repo]);

  const handleDownload = () => {
    try {
      const blob = new Blob([exportJsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${repo || "gitvn"}-docs.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      notifications.show({
        title: "Tải xuống thành công",
        message: `Đã lưu file ${repo || "gitvn"}-docs.json về máy tính của bạn`,
        color: "teal",
        icon: <IconCheck size={16} />,
      });
    } catch (err: any) {
      notifications.show({
        title: "Lỗi tải file",
        message: err.message || "Không thể tải file",
        color: "red",
      });
    }
  };

  return (
    <Stack gap="sm">
      <Paper
        p="xs"
        radius="md"
        style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}
      >
        <Group justify="space-between" align="center" wrap="wrap" gap="xs">
          <Text fz={12} c="#64748b">
            Xuất tất cả tài liệu .md/.mdx trong .gitvn/docs thành 1 file JSON
          </Text>
          <Group gap="xs">
            <CopyButton value={exportJsonString}>
              {({ copied, copy }) => (
                <Button
                  size="compact-xs"
                  variant="default"
                  leftSection={
                    copied ? <IconCheck size={12} /> : <IconCopy size={12} />
                  }
                  onClick={() => {
                    copy();
                    notifications.show({
                      title: "Đã sao chép",
                      message: "JSON tài liệu đã được lưu vào clipboard",
                      color: "teal",
                      icon: <IconCheck size={16} />,
                    });
                  }}
                >
                  {copied ? "Đã sao chép" : "Sao chép JSON"}
                </Button>
              )}
            </CopyButton>
            <Button
              size="compact-xs"
              color="vntez"
              leftSection={<IconDownload size={12} />}
              onClick={handleDownload}
            >
              Tải file docs.json
            </Button>
          </Group>
        </Group>
      </Paper>

      <Textarea
        readOnly
        value={exportJsonString}
        rows={12}
        styles={{
          input: {
            backgroundColor: "#f8fafc",
            borderColor: "#cbd5e1",
            color: "#0f172a",
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: 12,
            lineHeight: 1.5,
            borderRadius: 8,
          },
        }}
      />
    </Stack>
  );
}
