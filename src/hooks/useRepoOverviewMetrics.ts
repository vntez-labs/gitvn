"use client";

import { useMemo } from "react";
import type { TreeNode } from "@/components/FileTree";
import { LANG_METADATA } from "@/components/workspace/constants";

export interface LanguageStat {
  name: string;
  color: string;
  percent: number;
  count: number;
}

export function useRepoOverviewMetrics(tree: TreeNode[]) {
  const languageStats: LanguageStat[] = useMemo(() => {
    if (!tree || tree.length === 0) return [];
    const counts: Record<string, number> = {};
    let totalFiles = 0;

    tree.forEach((node) => {
      if (node.type === "blob") {
        const ext = node.path.split(".").pop()?.toLowerCase();
        if (ext) {
          counts[ext] = (counts[ext] || 0) + 1;
          totalFiles++;
        }
      }
    });

    if (totalFiles === 0) return [];

    const stats: LanguageStat[] = [];
    Object.entries(counts).forEach(([ext, count]) => {
      const meta = LANG_METADATA[ext];
      if (meta) {
        const percent = Math.round((count / totalFiles) * 100);
        if (percent >= 1) {
          stats.push({
            name: meta.name,
            color: meta.color,
            percent,
            count,
          });
        }
      }
    });

    stats.sort((a, b) => b.percent - a.percent);
    return stats.slice(0, 6);
  }, [tree]);

  return languageStats;
}
