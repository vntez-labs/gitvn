"use client";

import { Box, Text } from "@mantine/core";
import { useMemo } from "react";

interface DiffLine {
  kind: "added" | "removed" | "same";
  text: string;
}

function compareLines(before: string, after: string): DiffLine[] | null {
  const previous = before.split("\n");
  const next = after.split("\n");
  const columns = next.length + 1;
  const cells = (previous.length + 1) * columns;
  if (cells > 250_000 || before.length + after.length > 150_000) return null;

  const lengths = new Uint16Array(cells);
  for (let row = previous.length - 1; row >= 0; row--) {
    for (let column = next.length - 1; column >= 0; column--) {
      const index = row * columns + column;
      lengths[index] =
        previous[row] === next[column]
          ? lengths[index + columns + 1] + 1
          : Math.max(lengths[index + columns], lengths[index + 1]);
    }
  }

  const lines: DiffLine[] = [];
  let row = 0;
  let column = 0;
  while (row < previous.length || column < next.length) {
    if (
      row < previous.length &&
      column < next.length &&
      previous[row] === next[column]
    ) {
      lines.push({ kind: "same", text: previous[row] });
      row++;
      column++;
    } else if (
      row < previous.length &&
      (column === next.length ||
        lengths[(row + 1) * columns + column] >=
          lengths[row * columns + column + 1])
    ) {
      lines.push({ kind: "removed", text: previous[row++] });
    } else {
      lines.push({ kind: "added", text: next[column++] });
    }
  }

  const nearby = new Set<number>();
  lines.forEach((line, index) => {
    if (line.kind === "same") return;
    for (
      let cursor = Math.max(0, index - 2);
      cursor <= Math.min(lines.length - 1, index + 2);
      cursor++
    ) {
      nearby.add(cursor);
    }
  });
  return lines.filter((_, index) => nearby.has(index));
}

export function CommitDiffPreview({
  before,
  after,
}: {
  before: string;
  after: string;
}) {
  const lines = useMemo(() => compareLines(before, after), [before, after]);
  if (!lines)
    return (
      <Text size="xs" c="dimmed">
        File lớn. Đối chiếu bằng hai cột bên dưới.
      </Text>
    );
  if (!lines.length)
    return (
      <Text size="xs" c="dimmed">
        Chưa có thay đổi.
      </Text>
    );

  return (
    <Box
      style={{
        maxHeight: 224,
        overflow: "auto",
        border: "1px solid #e4e4e7",
        borderRadius: 6,
      }}
    >
      <Box component="pre" m={0} fz="xs">
        {lines.map((line, index) => {
          const prefix =
            line.kind === "added" ? "+" : line.kind === "removed" ? "-" : " ";
          const background =
            line.kind === "added"
              ? "#ecfdf3"
              : line.kind === "removed"
                ? "#fef2f2"
                : "#fff";
          return (
            <Box
              // biome-ignore lint/suspicious/noArrayIndexKey: These stateless diff rows are keyed by their line position.
              key={index}
              component="span"
              display="block"
              px="xs"
              bg={background}
            >
              {prefix} {line.text}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
