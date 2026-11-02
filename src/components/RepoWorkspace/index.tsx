"use client";

import { Alert, Box, Button, Group, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle, IconCheck, IconSparkles } from "@tabler/icons-react";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { useDashboardStore } from "@/store/dashboard.store";
import { BranchActionBanner } from "../workspace/BranchActionBanner";
import { CodeTab } from "../workspace/CodeTab";
import { CommitsTab } from "../workspace/CommitsTab";
import { DocsTab } from "../workspace/docs/DocsTab";
import { IssuesTab } from "../workspace/IssuesTab";
import { JiraWorkspace } from "../workspace/jira/JiraWorkspace";
import { OverviewTab } from "../workspace/OverviewTab";
import { PullsTab } from "../workspace/PullsTab";
import { SettingsTab } from "../workspace/SettingsTab";
import {
  WorkspaceHeader,
  type WorkspaceTab,
} from "../workspace/WorkspaceHeader";

export function RepoWorkspace() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("code");
  const [commitsCount, setCommitsCount] = useState<number | undefined>(
    undefined,
  );
  const [pullsCount, setPullsCount] = useState<number>(0);
  const [issuesCount, setIssuesCount] = useState<number>(0);
  const [hasGitvn, setHasGitvn] = useState<boolean>(true);
  const [initializingGitvn, setInitializingGitvn] = useState<boolean>(false);
  const { selectedRepo, currentBranch } = useDashboardStore();

  const checkGitvnStatus = useCallback(() => {
    if (!selectedRepo) return;
    axios
      .get(
        `/api/gitvn?owner=${selectedRepo.owner.login}&repo=${selectedRepo.name}&branch=${encodeURIComponent(
          currentBranch,
        )}`,
      )
      .then((res) => {
        setHasGitvn(Boolean(res.data.hasGitvn));
      })
      .catch((err) => {
        console.error("Lỗi kiểm tra .gitvn:", err);
      });
  }, [selectedRepo, currentBranch]);

  const handleInitializeGitvn = async () => {
    if (!selectedRepo) return;
    setInitializingGitvn(true);

    try {
      const res = await axios.post("/api/gitvn", {
        action: "init",
        owner: selectedRepo.owner.login,
        repo: selectedRepo.name,
        branch: currentBranch,
      });

      if (res.data.success) {
        notifications.show({
          title: "Khởi tạo .gitvn thành công!",
          message: res.data.syncedToGitHub
            ? "Đã tạo và commit cấu trúc chuẩn .gitvn lên GitHub"
            : "Đã tạo cấu trúc chuẩn .gitvn cục bộ",
          color: "teal",
          icon: <IconCheck size={16} />,
        });
        setHasGitvn(true);
      }
    } catch (err: any) {
      notifications.show({
        title: "Khởi tạo .gitvn thất bại",
        message: err.response?.data?.error || err.message,
        color: "red",
        icon: <IconAlertCircle size={16} />,
      });
    } finally {
      setInitializingGitvn(false);
    }
  };

  // Tự động đồng bộ số lượng PRs và Issues mở thực tế ngay khi đổi Repo
  useEffect(() => {
    if (!selectedRepo) return;

    // Reset về 0 tránh giữ số cũ của repo trước
    setCommitsCount(undefined);
    setPullsCount(0);
    setIssuesCount(0);

    const owner = selectedRepo.owner.login;
    const repo = selectedRepo.name;

    checkGitvnStatus();

    // Gọi API stats để lấy số đếm thực tế
    axios
      .get(`/api/github/stats?owner=${owner}&repo=${repo}`)
      .then((res) => {
        const pulse = res.data?.pulse;
        if (pulse) {
          setPullsCount(pulse.pulls?.open ?? 0);
          setIssuesCount(pulse.issues?.open ?? 0);
        }
      })
      .catch((err) => {
        console.error("Lỗi lấy số đếm badge:", err);
      });
  }, [selectedRepo, currentBranch, checkGitvnStatus]);

  if (!selectedRepo) return null;

  return (
    <Box
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        backgroundColor: "#faf8f6",
      }}
    >
      <WorkspaceHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        commitsCount={commitsCount}
        pullsCount={pullsCount}
        issuesCount={issuesCount}
        hasGitvn={hasGitvn}
        onInitializeGitvn={handleInitializeGitvn}
        initializingGitvn={initializingGitvn}
      />

      <BranchActionBanner onTabChange={setActiveTab} />

      {activeTab === "code" && <CodeTab onNavigateTab={setActiveTab} />}
      {activeTab === "commits" && (
        <CommitsTab onCommitsLoaded={setCommitsCount} />
      )}
      {activeTab === "kanban" && <JiraWorkspace />}
      {activeTab === "docs" && (
        <DocsTab
          onInitializeGitvn={handleInitializeGitvn}
          hasGitvn={hasGitvn}
        />
      )}
      {activeTab === "overview" && <OverviewTab />}
      {activeTab === "pulls" && (
        <PullsTab
          onPullsLoaded={(count) => {
            if (typeof count === "number") {
              setPullsCount(count);
            }
          }}
        />
      )}
      {activeTab === "issues" && (
        <IssuesTab
          onIssuesLoaded={(count) => {
            if (typeof count === "number") {
              setIssuesCount(count);
            }
          }}
        />
      )}
      {activeTab === "settings" && <SettingsTab />}
    </Box>
  );
}
