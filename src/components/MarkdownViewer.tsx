"use client";

import { Box } from "@mantine/core";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { markdownHtmlPlugins } from "@/lib/markdown-plugins";

export function MarkdownViewer({
  content,
  components,
}: {
  content: string;
  components?: Components;
}) {
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
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={markdownHtmlPlugins}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </Box>
  );
}
