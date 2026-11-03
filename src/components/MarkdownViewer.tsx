"use client";

import { Box } from "@mantine/core";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

export function MarkdownViewer({ content }: { content: string }) {
  return (
    <Box
      className="wmde-markdown prose prose-slate max-w-none text-sm leading-relaxed"
      style={{
        width: "100%",
        color: "#18181b",
        fontSize: "14px",
        lineHeight: "1.75",
      }}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
        {content}
      </ReactMarkdown>
    </Box>
  );
}
