"use client";

import axios from "axios";
import useSWR from "swr";
import type { GitHubRepo } from "@/interfaces/github";
import { useAuthStore } from "@/store/auth.store";

async function fetchBranches([url]: [string, string]) {
  const { data } = await axios.get<{ branches: { name: string }[] }>(url);
  return data.branches ?? [];
}

export function useRepoBranches(repo: GitHubRepo | null, enabled = true) {
  const login = useAuthStore((state) => state.user?.login);
  const key: [string, string] | null =
    repo && login && enabled
      ? [
          `/api/github/branches?${new URLSearchParams({
            owner: repo.owner.login,
            repo: repo.name,
          })}`,
          login,
        ]
      : null;

  return useSWR(key, fetchBranches, { dedupingInterval: 30_000 });
}
