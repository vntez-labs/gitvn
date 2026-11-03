"use client";

import { Box } from "@mantine/core";
import MarkdownPreview from "@uiw/react-markdown-preview";

export function MarkdownViewer({ content }: { content: string }) {
  return (
    <Box
      style={{
        width: "100%",
        color: "#18181b",
      }}
    >
      <MarkdownPreview
        source={content}
        style={{
          backgroundColor: "transparent",
          color: "#18181b",
          fontSize: "14px",
          lineHeight: "1.75",
        }}
        wrapperElement={{
          "data-color-mode": "light",
        }}
      />
    </Box>
  );
}
