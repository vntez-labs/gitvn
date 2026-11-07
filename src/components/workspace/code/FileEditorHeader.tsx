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
        backgroundColor: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}
    >
      {/* File Meta info (Path, Line count, format) */}
      <Group
        gap="xs"
        align="center"
        style={{ minWidth: 0, overflow: "hidden", flex: 1, marginRight: 12 }}
      >
        <Text
          fz={13}
          fw={600}
          ff="monospace"
          c="#18181b"
          truncate
          title={activeFile}
          style={{ minWidth: 0 }}
        >
          {activeFile}
        </Text>
        {lineCount > 0 && !isMarkdown && (
          <Badge
            size="xs"
            variant="outline"
            style={{
              borderColor: "#e4e4e7",
              color: "#52525b",
              backgroundColor: "#f4f4f5",
              fontFamily: "monospace",
              fontSize: 11,
              padding: "2px 6px",
              flexShrink: 0,
            }}
          >
            {lineCount.toLocaleString()} dòng
          </Badge>
        )}
        {isEditing && (
          <Badge
            size="xs"
            variant="outline"
            style={{
              backgroundColor: "#fff7ed",
              borderColor: "#fed7aa",
              color: "#c2410c",
              fontSize: 11,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            Đang chỉnh sửa
          </Badge>
        )}
      </Group>

      {/* Hành động: Chỉnh sửa & Sao chép mã */}
      <Group gap="xs" align="center" ml="auto">
        {isEditing ? (
          <>
            <Button
              size="xs"
              variant="default"
              leftSection={<IconX size={13} />}
              onClick={onToggleEdit}
              disabled={saving}
              styles={{
                root: {
                  backgroundColor: "#ffffff",
                  borderColor: "#d4d4d8",
                  color: "#3f3f46",
                  fontWeight: 500,
                  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                  borderRadius: 6,
                },
              }}
            >
              Hủy
            </Button>
            <Button
              size="xs"
              leftSection={<IconDeviceFloppy size={13} />}
              onClick={onSave}
              loading={saving}
              styles={{
                root: {
                  backgroundColor: "#dc2626",
                  color: "#ffffff",
                  fontWeight: 500,
                  boxShadow: "0 1px 2px rgba(220, 38, 38, 0.2)",
                  borderRadius: 6,
                  "&:hover": {
                    backgroundColor: "#b91c1c",
                  },
                },
              }}
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
                  variant="default"
                  leftSection={<IconEdit size={14} color="#71717a" />}
                  onClick={onToggleEdit}
                  styles={{
                    root: {
                      backgroundColor: "#ffffff",
                      borderColor: "#d4d4d8",
                      color: "#3f3f46",
                      fontWeight: 500,
                      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                      borderRadius: 6,
                    },
                  }}
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
                      borderColor: "#e4e4e7",
                      color: copied ? "#059669" : "#71717a",
                      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                      borderRadius: 6,
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
