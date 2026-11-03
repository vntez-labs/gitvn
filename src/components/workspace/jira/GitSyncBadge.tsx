"use client";

import { Badge, Loader, Tooltip } from "@mantine/core";
import type { GitSyncStatus } from "@/hooks/jira/useJiraSync";

interface GitSyncBadgeProps {
  gitSyncStatus: GitSyncStatus;
  syncedToGitHub: boolean;
  flushGitSync: () => Promise<void>;
  fetchBoardData: () => void;
}

export function GitSyncBadge({
  gitSyncStatus,
  syncedToGitHub,
  flushGitSync,
  fetchBoardData,
}: GitSyncBadgeProps) {
  if (gitSyncStatus === "syncing") {
    return (
      <Badge
        size="sm"
        variant="light"
        color="blue"
        leftSection={<Loader size={10} color="blue" />}
      >
        ĐANG LƯU GITHUB...
      </Badge>
    );
  }

  if (gitSyncStatus === "pending") {
    return (
      <Tooltip
        label="Đang gom các thao tác kéo thả (debounce 2.5s) để chỉ tạo 1 commit duy nhất. Nhấp để lưu ngay!"
        withArrow
      >
        <Badge
          size="sm"
          variant="light"
          color="orange"
          style={{ cursor: "pointer" }}
          onClick={flushGitSync}
        >
          ⏳ CHỜ LƯU GIT (BẤM LƯU NGAY)
        </Badge>
      </Tooltip>
    );
  }

  if (gitSyncStatus === "error") {
    return (
      <Tooltip label="Đồng bộ GitHub gặp lỗi. Nhấp để thử lại ngay!" withArrow>
        <Badge
          size="sm"
          variant="light"
          color="red"
          style={{ cursor: "pointer" }}
          onClick={flushGitSync}
        >
          ⚠️ LỖI SYNC (BẤM THỬ LẠI)
        </Badge>
      </Tooltip>
    );
  }

  return (
    <Tooltip
      label={
        syncedToGitHub
          ? "Đã đồng bộ an toàn với GitHub repo (1 commit sạch)"
          : "Đang lưu cục bộ trong hệ thống"
      }
      withArrow
    >
      <Badge
        size="sm"
        variant="light"
        color={syncedToGitHub ? "teal" : "yellow"}
        style={{ cursor: "pointer" }}
        onClick={fetchBoardData}
      >
        ● {syncedToGitHub ? "GITHUB SYNCED" : "LOCAL CACHED"}
      </Badge>
    </Tooltip>
  );
}
