"use client";

import { useMemo } from "react";
import type { TreeNode } from "@/components/FileTree";
import { LANG_METADATA } from "@/components/workspace/constants";

export interface RankedContributor {
  author: {
    login: string;
    avatar_url: string;
    html_url: string;
    name?: string;
  };
  commits: number;
  additions: number;
  deletions: number;
  linesChanged: number;
  mergedPRs: number;
  mergedByCount: number;
  role?: string;
  impactScore: number;
  percent: number;
}

export interface LanguageStat {
  name: string;
  color: string;
  percent: number;
  count: number;
}

export function useRepoOverviewMetrics(
  statsData: { activity?: any[]; contributors?: any[] },
  sortBy: "impact" | "prs" | "lines" | "commits",
  tree: TreeNode[],
) {
  // 1. TIMELINE BIỂU ĐỒ SÓNG (52 tuần gần nhất)
  const timelineMetrics = useMemo(() => {
    const rawActivity = statsData.activity;
    if (!Array.isArray(rawActivity) || rawActivity.length === 0) {
      return { weeks: [], maxCommits: 1, totalAllTime: 0, peakWeek: 0 };
    }

    const firstActiveIndex = rawActivity.findIndex((w) => w.total > 0);
    const activeWeeks =
      firstActiveIndex !== -1
        ? rawActivity.slice(firstActiveIndex)
        : rawActivity;
    const maxCommits = Math.max(...activeWeeks.map((w) => w.total), 1);
    const totalAllTime = activeWeeks.reduce(
      (acc, w) => acc + (w.total || 0),
      0,
    );

    return {
      weeks: activeWeeks,
      maxCommits,
      totalAllTime,
      peakWeek: maxCommits,
    };
  }, [statsData.activity]);

  // 2. BẢNG XẾP HẠNG THÀNH VIÊN ĐA CHIỀU
  const rankedContributors: RankedContributor[] = useMemo(() => {
    const rawContributors = statsData.contributors || [];
    if (!Array.isArray(rawContributors) || rawContributors.length === 0)
      return [];

    // Tính chỉ số Impact Score
    const enhanced = rawContributors.map((c: any) => {
      const mergedPRs = c.mergedPRs || 0;
      const mergedByCount = c.mergedByCount || 0;
      const additions = c.additions || 0;
      const deletions = c.deletions || 0;
      const linesChanged = additions + deletions;
      const commits = c.commits || 0;

      const impactScore = Math.round(
        mergedPRs * 35 +
          mergedByCount * 25 +
          commits * 2 +
          Math.min(Math.round(linesChanged / 100), 200),
      );

      return {
        ...c,
        mergedPRs,
        mergedByCount,
        linesChanged,
        impactScore,
      };
    });

    enhanced.sort((a, b) => {
      if (sortBy === "impact") return b.impactScore - a.impactScore;
      if (sortBy === "prs")
        return b.mergedPRs - a.mergedPRs || b.mergedByCount - a.mergedByCount;
      if (sortBy === "lines") return b.linesChanged - a.linesChanged;
      return b.commits - a.commits;
    });

    const maxVal = Math.max(
      ...enhanced.map((c) => {
        if (sortBy === "impact") return c.impactScore;
        if (sortBy === "prs") return Math.max(c.mergedPRs, c.mergedByCount);
        if (sortBy === "lines") return c.linesChanged;
        return c.commits;
      }),
      1,
    );

    return enhanced.map((c) => {
      let currentVal = c.impactScore;
      if (sortBy === "prs") currentVal = Math.max(c.mergedPRs, c.mergedByCount);
      if (sortBy === "lines") currentVal = c.linesChanged;
      if (sortBy === "commits") currentVal = c.commits;

      return {
        ...c,
        percent: Math.min(Math.round((currentVal / maxVal) * 100), 100),
      };
    });
  }, [statsData.contributors, sortBy]);

  // 3. THỐNG KÊ TỶ LỆ NGÔN NGỮ
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

  return {
    timelineMetrics,
    rankedContributors,
    languageStats,
  };
}
