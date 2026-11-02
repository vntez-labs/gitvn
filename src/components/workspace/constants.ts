export const LANG_METADATA: Record<string, { name: string; color: string }> = {
  ts: { name: "TypeScript", color: "#3178c6" },
  tsx: { name: "TypeScript", color: "#3178c6" },
  js: { name: "JavaScript", color: "#f7df1e" },
  jsx: { name: "JavaScript", color: "#f7df1e" },
  svelte: { name: "Svelte", color: "#ff3e00" },
  vue: { name: "Vue", color: "#41b883" },
  rs: { name: "Rust", color: "#dea584" },
  go: { name: "Go", color: "#00add8" },
  py: { name: "Python", color: "#3572a5" },
  html: { name: "HTML", color: "#e34c26" },
  css: { name: "CSS", color: "#563d7c" },
  scss: { name: "SCSS", color: "#c6538c" },
  sql: { name: "SQL", color: "#e38c00" },
  sh: { name: "Shell", color: "#89e051" },
  bash: { name: "Shell", color: "#89e051" },
  json: { name: "JSON", color: "#cbcb41" },
  md: { name: "Markdown", color: "#083fa1" },
};

export const ICON_BASE_URL =
  "https://cdn.jsdelivr.net/gh/vscode-icons/vscode-icons@master/icons";

export function formatCompactNumber(num: number | undefined): string {
  if (!num || num === 0) return "0";
  return new Intl.NumberFormat("en", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  })
    .format(num)
    .toLowerCase();
}
