"use client";

import {
  ActionIcon,
  Badge,
  Box,
  Button,
  CopyButton,
  Group,
  Text,
  Tooltip,
} from "@mantine/core";
import {
  IconCheck,
  IconCopy,
  IconDeviceFloppy,
  IconEdit,
  IconX,
} from "@tabler/icons-react";

interface FileEditorHeaderProps {
  activeFile: string;
  lineCount: number;
  isMarkdown?: boolean;
  fileContent: string;
  isEditing?: boolean;
  onToggleEdit?: () => void;
  onSave?: () => void;
  saving?: boolean;
}

export function FileEditorHeader({
  activeFile,
  lineCount,
  isMarkdown = false,
  fileContent,
  isEditing = false,
  onToggleEdit,
  onSave,
  saving = false,
}: FileEditorHeaderProps) {
  return (
    <Box
      px="md"
      py={6}
      style={{
        borderBottom: "1px solid #e8e5de",
        backgroundColor: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
        minHeight: 38,
      }}
    >
      {/* File Meta info (Line count, format) - Removed redundant file name chip */}
      <Group gap="xs" align="center">
        {lineCount > 0 && !isMarkdown && (
          <Badge
            size="xs"
            variant="outline"
            color="gray"
            style={{
              borderColor: "#e2e8f0",
              color: "#64748b",
              backgroundColor: "#f8fafc",
              fontFamily: "monospace",
            }}
          >
            {lineCount.toLocaleString()} dòng
          </Badge>
        )}
        {isMarkdown && (
          <Badge
            size="xs"
            variant="light"
            color="blue"
            style={{ fontFamily: "monospace" }}
          >
            Markdown Preview
          </Badge>
        )}
        {isEditing && (
          <Badge size="xs" color="orange" variant="filled">
            Đang chỉnh sửa
          </Badge>
        )}
      </Group>

      {/* Hành động: Chỉnh sửa & Sao chép mã */}
      <Group gap="xs" align="center">
        {isEditing ? (
          <>
            <Button
              size="xs"
              variant="default"
              leftSection={<IconX size={13} />}
              onClick={onToggleEdit}
              disabled={saving}
            >
              Hủy
            </Button>
            <Button
              size="xs"
              color="vntez"
              leftSection={<IconDeviceFloppy size={13} />}
              onClick={onSave}
              loading={saving}
            >
              Lưu & Commit
            </Button>
          </>
        ) : (
          <>
            {onToggleEdit && (
              <Tooltip label="Chỉnh sửa file trực tiếp" withArrow>
                <Button
                  size="xs"
                  variant="subtle"
                  color="gray"
                  leftSection={<IconEdit size={14} />}
                  onClick={onToggleEdit}
                  style={{ color: "#334155" }}
                >
                  Chỉnh sửa
                </Button>
              </Tooltip>
            )}

            <CopyButton value={fileContent}>
              {({ copied, copy }) => (
                <Tooltip
                  label={copied ? "Đã sao chép mã!" : "Sao chép mã nguồn"}
                  withArrow
                >
                  <ActionIcon
                    size="sm"
                    variant="default"
                    color={copied ? "teal" : "gray"}
                    onClick={copy}
                    style={{
                      backgroundColor: "#ffffff",
                      borderColor: "#e2e8f0",
                      color: copied ? "#0d9488" : "#64748b",
                    }}
                  >
                    {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
          </>
        )}
      </Group>
    </Box>
  );
}
