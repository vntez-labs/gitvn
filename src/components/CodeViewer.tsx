"use client";

import { Box } from "@mantine/core";
import { getLanguageByFileName } from "file-lang-map";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import vs from "react-syntax-highlighter/dist/esm/styles/prism/vs";

// Bảng ánh xạ phụ: Chỉ dành cho các tên mà GitHub Linguist và Prism lệch nhau
const LINGUIST_TO_PRISM_ALIASES: Record<string, string> = {
  "c#": "csharp",
  "c++": "cpp",
  "f#": "fsharp",
  shell: "bash",
  shellscript: "bash",
  dockerfile: "docker",
  "protocol buffer": "protobuf",
  "jupyter notebook": "json",
  "visual basic .net": "vbnet",
};

const CODE_FONT =
  "var(--font-jetbrains-mono), 'JetBrains Mono', 'Fira Code', ui-monospace, Menlo, Monaco, Consolas, monospace";

// Tùy biến theme Prism: Khắc phục triệt để lỗi số dòng màu xanh lá/nghiêng của theme vs gốc, ép font JetBrains Mono chuẩn xác
const gitvnCodeTheme: Record<string, React.CSSProperties> = {
  ...vs,
  'code[class*="language-"]': {
    ...(vs['code[class*="language-"]'] as any),
    fontFamily: CODE_FONT,
    fontSize: "14px",
    lineHeight: "1.7",
  },
  'pre[class*="language-"]': {
    ...(vs['pre[class*="language-"]'] as any),
    fontFamily: CODE_FONT,
    fontSize: "14px",
    lineHeight: "1.7",
    backgroundColor: "#ffffff",
    border: "none",
  },
  // Ghi đè class comment/linenumber mà Prism tự động gán vào số dòng
  linenumber: {
    color: "#a1a1aa",
    fontStyle: "normal",
    fontWeight: "400",
  },
  "react-syntax-highlighter-line-number": {
    color: "#a1a1aa",
    fontStyle: "normal",
    fontWeight: "400",
  },
};

function resolveLanguage(filename: string): string {
  // 1. Quét tên file qua file-lang-map (nhận diện cả .svelte, .vue, .rs, Dockerfile, v.v.)
  const detectedLangs = getLanguageByFileName(filename);

  if (detectedLangs && detectedLangs.length > 0) {
    const rawLang = detectedLangs[0].toLowerCase();

    // Khớp alias nếu tên có ký tự đặc biệt
    if (LINGUIST_TO_PRISM_ALIASES[rawLang]) {
      return LINGUIST_TO_PRISM_ALIASES[rawLang];
    }

    return rawLang.replace(/\s+/g, "-");
  }

  // 2. Dự phòng nếu gặp file không có trong từ điển
  const ext = filename.split(".").pop()?.toLowerCase();
  return ext || "text";
}

export function CodeViewer({
  content,
  filename,
}: {
  content: string;
  filename: string;
}) {
  const language = resolveLanguage(filename);

  return (
    <Box style={{ minWidth: "100%", width: "max-content" }}>
      <SyntaxHighlighter
        language={language}
        style={gitvnCodeTheme}
        customStyle={{
          margin: 0,
          padding: "18px 24px",
          backgroundColor: "#ffffff",
          fontSize: "14px",
          lineHeight: "1.7",
          fontFamily: CODE_FONT,
          minWidth: "100%",
          border: "none",
        }}
        codeTagProps={{
          style: {
            fontFamily: CODE_FONT,
            fontSize: "14px",
            lineHeight: "1.7",
          },
        }}
        lineNumberStyle={{
          minWidth: "3em",
          paddingRight: "1.5em",
          color: "#a1a1aa",
          fontStyle: "normal",
          fontWeight: 400,
          textAlign: "right",
          userSelect: "none",
          borderRight: "1px solid #f4f4f5",
          marginRight: "1.25em",
        }}
        showLineNumbers={true}
        wrapLongLines={false}
      >
        {content}
      </SyntaxHighlighter>
    </Box>
  );
}
