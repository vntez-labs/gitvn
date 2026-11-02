"use client";

import { IconBook } from "@tabler/icons-react";
import { getIconForFile } from "vscode-icons-js";
import type { GitHubRepo } from "@/interfaces/github";

const ICON_BASE_URL =
  "https://cdn.jsdelivr.net/gh/vscode-icons/vscode-icons@master/icons";

const LANG_FILE_MAPPING: Record<string, string> = {
  TypeScript: "main.ts",
  JavaScript: "main.js",
  Python: "main.py",
  Rust: "main.rs",
  Go: "main.go",
  "C++": "main.cpp",
  C: "main.c",
  "C#": "main.cs",
  Dart: "main.dart",
  Java: "main.java",
  PHP: "main.php",
  HTML: "main.html",
  CSS: "main.css",
  Svelte: "App.svelte",
  Vue: "App.vue",
  Shell: "script.sh",
  Ruby: "main.rb",
  Kotlin: "main.kt",
  Swift: "main.swift",
  Dockerfile: "Dockerfile",
};

export function RepoLangIcon({ repo }: { repo: GitHubRepo }) {
  const lang = repo.language;
  const mockFileName = (lang && LANG_FILE_MAPPING[lang]) || "default_file.svg";
  const iconName = getIconForFile(mockFileName) || "default_file.svg";

  if (!lang) {
    return <IconBook size={16} color="#64748b" style={{ flexShrink: 0 }} />;
  }

  return (
    <img
      src={`${ICON_BASE_URL}/${iconName}`}
      alt={lang}
      width={16}
      height={16}
      style={{ display: "block", flexShrink: 0, objectFit: "contain" }}
      onError={(e) => {
        (e.target as HTMLImageElement).src =
          `${ICON_BASE_URL}/default_file.svg`;
      }}
    />
  );
}
