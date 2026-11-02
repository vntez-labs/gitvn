"use client";

import {
  ActionIcon,
  Badge,
  Box,
  CopyButton,
  Group,
  Text,
  Tooltip,
} from "@mantine/core";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import { ICON_BASE_URL } from "../constants";

interface FileEditorHeaderProps {
  activeFile: string;
  activeFileIcon?: string;
  lineCount: number;
  isMarkdown?: boolean;
  fileContent: string;
}

export function FileEditorHeader({
  activeFile,
  activeFileIcon = "default_file.svg",
  lineCount,
  isMarkdown = false,
  fileContent,
}: FileEditorHeaderProps) {
  return (
    <Box
      px="md"
      py={6}
      style={{
        borderBottom: "1px solid #e8e5de",
        backgroundColor: "#faf8f6",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
        minHeight: 38,
      }}
    >
      {/* File Tab Chip */}
      <Group gap="xs" align="center">
        <Box
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            backgroundColor: "#ffffff",
            padding: "4px 10px",
            borderRadius: 6,
            border: "1px solid #e8e5de",
            boxShadow: "0 1px 2px rgba(31, 28, 25, 0.04)",
          }}
        >
          <img
            src={`${ICON_BASE_URL}/${activeFileIcon}`}
            alt=""
            width={14}
            height={14}
            style={{ display: "block" }}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                `${ICON_BASE_URL}/default_file.svg`;
            }}
          />
          <Text fz={12} c="#1f1c19" fw={600} ff="monospace">
            {activeFile}
          </Text>
        </Box>

        {lineCount > 0 && !isMarkdown && (
          <Badge
            size="xs"
            variant="outline"
            color="gray"
            style={{
              borderColor: "#e8e5de",
              color: "#6e675f",
              backgroundColor: "#ffffff",
            }}
          >
            {lineCount.toLocaleString()} dòng
          </Badge>
        )}
      </Group>

      {/* Hành động sao chép mã */}
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
                borderColor: "#e8e5de",
                color: copied ? "#0d9488" : "#6e675f",
              }}
            >
              {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
            </ActionIcon>
          </Tooltip>
        )}
      </CopyButton>
    </Box>
  );
}
