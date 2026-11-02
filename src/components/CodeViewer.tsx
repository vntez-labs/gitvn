"use client";

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
    <SyntaxHighlighter
      language={language}
      style={vs}
      customStyle={{
        margin: 0,
        padding: "16px 20px",
        background: "#ffffff",
        fontSize: "13px",
        lineHeight: "1.6",
        fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Consolas, monospace",
      }}
      lineNumberStyle={{
        minWidth: "2.5em",
        paddingRight: "1em",
        color: "#94a3b8",
        textAlign: "right",
        userSelect: "none",
      }}
      showLineNumbers={true}
      wrapLongLines={false}
    >
      {content}
    </SyntaxHighlighter>
  );
}
