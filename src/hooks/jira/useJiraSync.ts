"use client";

import { notifications } from "@mantine/notifications";
import { useCallback, useEffect, useRef, useState } from "react";
import type { GitHubRepo } from "@/interfaces/github";
import type { JiraBoardData } from "@/interfaces/jira";
import { jiraService } from "@/services/jira.service";

interface UseJiraSyncProps {
  selectedRepo: GitHubRepo | null;
  currentBranch: string;
  isTabActive: boolean;
  setBoardData: React.Dispatch<React.SetStateAction<JiraBoardData | null>>;
}

export type GitSyncStatus = "synced" | "pending" | "syncing" | "error";

export function useJiraSync({
  selectedRepo,
  currentBranch,
  isTabActive,
  setBoardData,
}: UseJiraSyncProps) {
  const [gitSyncStatus, setGitSyncStatus] = useState<GitSyncStatus>("synced");
  const [syncing, setSyncing] = useState(false);
  const [syncedToGitHub, setSyncedToGitHub] = useState(false);

  const repoRef = useRef(selectedRepo);
  const branchRef = useRef(currentBranch);
  const isMountedRef = useRef(true);
  const isSyncingRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingDataRef = useRef<JiraBoardData | null>(null);
  const prevRepoKeyRef = useRef<string>("");

  useEffect(() => {
    repoRef.current = selectedRepo;
  }, [selectedRepo]);

  useEffect(() => {
    branchRef.current = currentBranch;
  }, [currentBranch]);

  const flushGitSync = useCallback(async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const currentRepo = repoRef.current;
    const currentTargetBranch = branchRef.current;
    const dataToSync = pendingDataRef.current;

    if (!dataToSync || !currentRepo) return;

    if (isSyncingRef.current) {
      // Đang có tiến trình sync đang chạy, pendingDataRef.current vẫn giữ dữ liệu mới nhất
      return;
    }

    pendingDataRef.current = null;
    isSyncingRef.current = true;

    if (isMountedRef.current) {
      setGitSyncStatus("syncing");
      setSyncing(true);
    }

    try {
      await jiraService.saveBoardData(
        currentRepo.owner.login,
        currentRepo.name,
        currentTargetBranch,
        dataToSync,
        true,
      );
      if (isMountedRef.current) {
        setSyncedToGitHub(true);
        setGitSyncStatus("synced");
      }
    } catch (err: any) {
      console.error("Lỗi đồng bộ Git:", err);
      if (!pendingDataRef.current) {
        pendingDataRef.current = dataToSync;
      }
      if (isMountedRef.current) {
        setGitSyncStatus("error");
        notifications.show({
          title: "Lỗi đồng bộ GitHub",
          message: err.response?.data?.error || "Không thể đồng bộ lên GitHub",
          color: "red",
        });
      }
    } finally {
      isSyncingRef.current = false;
      if (isMountedRef.current) {
        setSyncing(false);
      }
      if (pendingDataRef.current) {
        flushGitSync();
      }
    }
  }, []);

  // 1. Tự động sync ngay khi người dùng chuyển sang tab khác trong workspace
  useEffect(() => {
    if (!isTabActive && pendingDataRef.current) {
      flushGitSync();
    }
  }, [isTabActive, flushGitSync]);

  // 2. Tự động sync nếu repo hoặc branch thay đổi trước khi tải dữ liệu mới
  const currentRepoKey = selectedRepo
    ? `${selectedRepo.owner.login}/${selectedRepo.name}@${currentBranch}`
    : "";

  useEffect(() => {
    if (
      prevRepoKeyRef.current &&
      prevRepoKeyRef.current !== currentRepoKey &&
      pendingDataRef.current
    ) {
      flushGitSync();
    }
    prevRepoKeyRef.current = currentRepoKey;
  }, [currentRepoKey, flushGitSync]);

  // 3. Tự động sync khi ẩn tab (visibilitychange), tắt trang (beforeunload, pagehide) hoặc unmount
  useEffect(() => {
    isMountedRef.current = true;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && pendingDataRef.current) {
        flushGitSync();
      }
    };

    const handleBeforeUnload = () => {
      if (pendingDataRef.current && repoRef.current) {
        const dataToSync = pendingDataRef.current;
        const owner = repoRef.current.owner.login;
        const repo = repoRef.current.name;
        const branch = branchRef.current;
        pendingDataRef.current = null;

        try {
          if (typeof fetch === "function") {
            fetch("/api/jira", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                owner,
                repo,
                branch,
                data: dataToSync,
                syncToGitHub: true,
                forceGitHubSync: true,
              }),
              keepalive: true,
            }).catch(() => {});
          }
        } catch {}
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handleBeforeUnload);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      isMountedRef.current = false;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handleBeforeUnload);
      window.removeEventListener("beforeunload", handleBeforeUnload);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      if (pendingDataRef.current) {
        flushGitSync();
      }
    };
  }, [flushGitSync]);

  // Lưu Board Data ngầm có debounce (không tạo commit rác liên tục khi kéo thả)
  const saveTasks = useCallback(
    (newData: JiraBoardData, immediateSync = false) => {
      const repo = repoRef.current;
      const branch = branchRef.current;
      if (!repo) return;

      setBoardData(newData);
      pendingDataRef.current = newData;

      // Lưu local cache ngay lập tức (0ms delay)
      jiraService
        .saveBoardData(repo.owner.login, repo.name, branch, newData, false)
        .catch((err) => console.warn("Lỗi lưu local cache:", err));

      if (immediateSync) {
        flushGitSync();
      } else {
        setGitSyncStatus("pending");
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
          flushGitSync();
        }, 2500);
      }
    },
    [flushGitSync, setBoardData],
  );

  return {
    gitSyncStatus,
    setGitSyncStatus,
    syncing,
    setSyncing,
    syncedToGitHub,
    setSyncedToGitHub,
    flushGitSync,
    saveTasks,
  };
}
