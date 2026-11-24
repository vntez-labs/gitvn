"use client";

import axios from "axios";
import useSWR from "swr";
import type { RepoOverviewStats } from "@/interfaces/repo-overview";

async function fetchStats(url: string) {
  const { data } = await axios.get<RepoOverviewStats>(url);
  return data;
}

export function useRepoOverviewStats(owner?: string, repo?: string) {
  const url =
    owner && repo
      ? `/api/github/stats?${new URLSearchParams({ owner, repo })}`
      : null;
  const { data, isLoading, mutate } = useSWR(url, fetchStats);

  async function refresh() {
    if (!url) return;
    await mutate(fetchStats(`${url}&refresh=true`), { revalidate: false });
  }

  return { data, isLoading, refresh };
}
