"use client";

import { Box } from "@mantine/core";
import MarkdownPreview from "@uiw/react-markdown-preview";

export function MarkdownViewer({ content }: { content: string }) {
  return (
    <Box
      style={{
        width: "100%",
        color: "#0f172a",
      }}
    >
      <MarkdownPreview
        source={content}
        style={{
          backgroundColor: "transparent",
          color: "#0f172a",
          fontSize: "14px",
          lineHeight: "1.7",
        }}
        wrapperElement={{
          "data-color-mode": "light",
        }}
      />
    </Box>
  );
}
