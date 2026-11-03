"use client";

import { Badge, Box, Button, Group, Paper, Text } from "@mantine/core";
import { IconMinus, IconPlus } from "@tabler/icons-react";
import { memo, useMemo, useState } from "react";
import { getIconForFile } from "vscode-icons-js";

const ICON_BASE_URL =
  "https://cdn.jsdelivr.net/gh/vscode-icons/vscode-icons@master/icons";
const MAX_PREVIEW_LINES = 250;

interface FileDiff {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string;
}

export const DiffViewer = memo(function DiffViewer({
  file,
}: {
  file: FileDiff;
}) {
  const [showAll, setShowAll] = useState(false);
  const lines = useMemo(() => (file.patch || "").split("\n"), [file.patch]);
  const iconName = getIconForFile(file.filename) || "default_file.svg";
  const hasTruncated = lines.length > MAX_PREVIEW_LINES && !showAll;
  const visibleLines = hasTruncated ? lines.slice(0, MAX_PREVIEW_LINES) : lines;

  return (
    <Paper
      radius="md"
      style={{
        border: "1px solid #e2e8f0",
        backgroundColor: "#ffffff",
        overflow: "hidden",
      }}
    >
      {/* File Header */}
      <Box
        px="md"
        py={8}
        style={{
          backgroundColor: "#f8fafc",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <Group justify="space-between">
          <Group gap="xs">
            <img
              src={`${ICON_BASE_URL}/${iconName}`}
              alt=""
              width={15}
              height={15}
              style={{ display: "block", objectFit: "contain" }}
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  `${ICON_BASE_URL}/default_file.svg`;
              }}
            />
            <Text fz={13} fw={600} c="#0f172a" ff="monospace">
              {file.filename}
            </Text>
            <Badge
              size="xs"
              variant="light"
              color={
                file.status === "added"
                  ? "green"
                  : file.status === "removed"
                    ? "red"
                    : "gray"
              }
              styles={{ root: { textTransform: "capitalize" } }}
            >
              {file.status}
            </Badge>
          </Group>

          <Group gap={8}>
            <Group gap={2} c="#16a34a">
              <IconPlus size={12} />
              <Text fz={11} fw={600}>
                {file.additions}
              </Text>
            </Group>
            <Group gap={2} c="#dc2626">
              <IconMinus size={12} />
              <Text fz={11} fw={600}>
                {file.deletions}
              </Text>
            </Group>
          </Group>
        </Group>
      </Box>

      {/* Diff Lines View */}
      <Box
        style={{
          overflowX: "auto",
          fontFamily: "monospace",
          fontSize: 12,
          lineHeight: "20px",
        }}
      >
        {lines.length > 0 && file.patch ? (
          <>
            {visibleLines.map((line, idx) => {
              const isAdd = line.startsWith("+") && !line.startsWith("+++");
              const isDel = line.startsWith("-") && !line.startsWith("---");
              const isHunkHeader = line.startsWith("@@");
              const isNoNewline = line.startsWith("\\");

              let content = line;
              if (isAdd || isDel) {
                content = line.slice(1);
              } else if (line.startsWith(" ")) {
                content = line.slice(1);
              }

              let bg = "transparent";
              let color = "#334155";
              let borderLeft = "3px solid transparent";

              if (isAdd) {
                bg = "rgba(34, 197, 94, 0.12)";
                color = "#166534";
                borderLeft = "3px solid #22c55e";
              } else if (isDel) {
                bg = "rgba(239, 68, 68, 0.12)";
                color = "#991b1b";
                borderLeft = "3px solid #ef4444";
              } else if (isHunkHeader) {
                bg = "rgba(59, 130, 246, 0.08)";
                color = "#1d4ed8";
              } else if (isNoNewline) {
                color = "#94a3b8";
              }

              return (
                <Box
                  key={idx}
                  px="md"
                  style={{
                    backgroundColor: bg,
                    color,
                    borderLeft,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                    minHeight: 20,
                  }}
                >
                  {content || "\u00A0"}
                </Box>
              );
            })}

            {hasTruncated && (
              <Box
                p="xs"
                ta="center"
                style={{
                  borderTop: "1px dashed #e2e8f0",
                  backgroundColor: "#f8fafc",
                }}
              >
                <Button
                  size="xs"
                  variant="subtle"
                  color="gray"
                  onClick={() => setShowAll(true)}
                >
                  Hiển thị thêm {lines.length - MAX_PREVIEW_LINES} dòng diff...
                </Button>
              </Box>
            )}
          </>
        ) : (
          <Box p="md" ta="center">
            <Text fz="xs" c="#64748b">
              File nhị phân hoặc không có nội dung diff hiển thị.
            </Text>
          </Box>
        )}
      </Box>
    </Paper>
  );
});
