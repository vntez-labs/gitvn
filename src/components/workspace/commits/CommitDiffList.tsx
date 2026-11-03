"use client";

import { Accordion, Badge, Box, Button, Group, Text } from "@mantine/core";
import { IconFileDiff } from "@tabler/icons-react";
import { memo, useMemo, useState } from "react";

const MAX_DIFF_PREVIEW_LINES = 250;

interface CommitDiffListProps {
  files: any[];
}

const CommitDiffFileItem = memo(function CommitDiffFileItem({
  file,
}: {
  file: any;
}) {
  const [showAll, setShowAll] = useState(false);
  const patchLines = useMemo(
    () => (file.patch || "").split("\n"),
    [file.patch],
  );
  const hasTruncated = patchLines.length > MAX_DIFF_PREVIEW_LINES && !showAll;
  const visibleLines = hasTruncated
    ? patchLines.slice(0, MAX_DIFF_PREVIEW_LINES)
    : patchLines;

  return (
    <Accordion.Item key={file.filename} value={file.filename}>
      <Accordion.Control>
        <Group
          justify="space-between"
          wrap="nowrap"
          style={{ width: "100%", paddingRight: 8 }}
        >
          <Group gap="xs" wrap="nowrap" style={{ overflow: "hidden" }}>
            <IconFileDiff size={15} color="#fb291a" />
            <Text fz={12.5} fw={600} c="#0f172a" ff="monospace" truncate>
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
            >
              {file.status}
            </Badge>
          </Group>

          <Group gap={6} style={{ flexShrink: 0 }}>
            <Text fz={11} c="#16a34a" fw={600}>
              +{file.additions}
            </Text>
            <Text fz={11} c="#dc2626" fw={600}>
              -{file.deletions}
            </Text>
          </Group>
        </Group>
      </Accordion.Control>

      <Accordion.Panel>
        <Box
          style={{
            backgroundColor: "#ffffff",
            borderTop: "1px solid #e2e8f0",
            padding: 10,
            overflowX: "auto",
            fontFamily: "monospace",
            fontSize: 12,
            lineHeight: "19px",
          }}
        >
          {patchLines.length > 0 && file.patch ? (
            <>
              {visibleLines.map((line: string, idx: number) => {
                const isAdd = line.startsWith("+") && !line.startsWith("+++");
                const isDel = line.startsWith("-") && !line.startsWith("---");
                const isHunk = line.startsWith("@@");

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
                } else if (isHunk) {
                  bg = "rgba(59, 130, 246, 0.1)";
                  color = "#1d4ed8";
                }

                return (
                  <Box
                    key={idx}
                    px={8}
                    style={{
                      backgroundColor: bg,
                      color,
                      borderLeft,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                    }}
                  >
                    {line || "\u00A0"}
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
                    marginTop: 8,
                  }}
                >
                  <Button
                    size="xs"
                    variant="subtle"
                    color="gray"
                    onClick={() => setShowAll(true)}
                  >
                    Hiển thị thêm {patchLines.length - MAX_DIFF_PREVIEW_LINES}{" "}
                    dòng diff...
                  </Button>
                </Box>
              )}
            </>
          ) : (
            <Box p="sm" ta="center">
              <Text fz="xs" c="#64748b">
                Không có nội dung diff để hiển thị.
              </Text>
            </Box>
          )}
        </Box>
      </Accordion.Panel>
    </Accordion.Item>
  );
});

export const CommitDiffList = memo(function CommitDiffList({
  files,
}: CommitDiffListProps) {
  if (!files || files.length === 0) return null;

  return (
    <Box>
      <Group justify="space-between" mb="xs">
        <Text fz={12} fw={700} c="#475569" style={{ letterSpacing: "0.06em" }}>
          CÁC FILE THAY ĐỔI ({files.length})
        </Text>
      </Group>

      <Accordion
        variant="separated"
        radius="md"
        styles={{
          item: {
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            marginBottom: 8,
          },
          control: {
            padding: "10px 14px",
            "&:hover": { backgroundColor: "#f8fafc" },
          },
          content: { padding: 0 },
        }}
      >
        {files.map((file: any) => (
          <CommitDiffFileItem key={file.filename} file={file} />
        ))}
      </Accordion>
    </Box>
  );
});
