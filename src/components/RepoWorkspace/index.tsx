"use client";

import {
  Alert,
  Box,
  Button,
  Group,
  Skeleton,
  Stack,
  Text,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle, IconCheck, IconSparkles } from "@tabler/icons-react";
import axios from "axios";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { useDashboardStore } from "@/store/dashboard.store";
import { BranchActionBanner } from "../workspace/BranchActionBanner";
import { CodeTab } from "../workspace/CodeTab";
import {
  WorkspaceHeader,
  type WorkspaceTab,
} from "../workspace/WorkspaceHeader";

function TabSkeleton() {
  return (
    <Box p="xl" style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <Stack gap="md">
        <Skeleton height={32} width="30%" radius="sm" />
        <Skeleton height={20} width="60%" radius="sm" />
        <Skeleton height={180} radius="md" />
        <Skeleton height={140} radius="md" />
      </Stack>
    </Box>
  );
}

const CommitsTab = dynamic(
  () => import("../workspace/CommitsTab").then((mod) => mod.CommitsTab),
  { ssr: false, loading: () => <TabSkeleton /> },
);

const DocsTab = dynamic(
  () => import("../workspace/docs/DocsTab").then((mod) => mod.DocsTab),
  { ssr: false, loading: () => <TabSkeleton /> },
);

const JiraWorkspace = dynamic(
  () =>
    import("../workspace/jira/JiraWorkspace").then((mod) => mod.JiraWorkspace),
  { ssr: false, loading: () => <TabSkeleton /> },
);

const OverviewTab = dynamic(
  () => import("../workspace/OverviewTab").then((mod) => mod.OverviewTab),
  { ssr: false, loading: () => <TabSkeleton /> },
);

const PullsTab = dynamic(
  () => import("../workspace/PullsTab").then((mod) => mod.PullsTab),
  { ssr: false, loading: () => <TabSkeleton /> },
);

const IssuesTab = dynamic(
  () => import("../workspace/IssuesTab").then((mod) => mod.IssuesTab),
  { ssr: false, loading: () => <TabSkeleton /> },
);

const SettingsTab = dynamic(
  () => import("../workspace/SettingsTab").then((mod) => mod.SettingsTab),
  { ssr: false, loading: () => <TabSkeleton /> },
);

const UpgradeGitvnModal = dynamic(
  () =>
    import("../workspace/UpgradeGitvnModal").then(
      (mod) => mod.UpgradeGitvnModal,
    ),
  { ssr: false },
);

export function RepoWorkspace() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("code");
  const [commitsCount, setCommitsCount] = useState<number | undefined>(
    undefined,
  );
  const [pullsCount, setPullsCount] = useState<number>(0);
  const [issuesCount, setIssuesCount] = useState<number>(0);
  const [hasGitvn, setHasGitvn] = useState<boolean>(true);
  const [isOutdated, setIsOutdated] = useState<boolean>(false);
  const [gitvnVersion, setGitvnVersion] = useState<string>("1.0.0");
  const [outdatedReason, setOutdatedReason] = useState<string>("");
  const [upgradeModalOpen, setUpgradeModalOpen] = useState<boolean>(false);
  const [bannerDismissed, setBannerDismissed] = useState<boolean>(false);
  const [initializingGitvn, setInitializingGitvn] = useState<boolean>(false);
  const [kanbanMounted, setKanbanMounted] = useState<boolean>(false);
  const { selectedRepo, currentBranch } = useDashboardStore();

  useEffect(() => {
    if (activeTab === "kanban") {
      setKanbanMounted(true);
    }
  }, [activeTab]);

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
        setIsOutdated(Boolean(res.data.isOutdated));
        setGitvnVersion(res.data.currentVersion || "1.0.0");
        setOutdatedReason(res.data.reason || "");
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
        backgroundColor: "#ffffff",
      }}
    >
      <WorkspaceHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        commitsCount={commitsCount}
        pullsCount={pullsCount}
        issuesCount={issuesCount}
        hasGitvn={hasGitvn}
        isOutdated={isOutdated}
        gitvnVersion={gitvnVersion}
        onOpenUpgradeModal={() => setUpgradeModalOpen(true)}
        onInitializeGitvn={handleInitializeGitvn}
        initializingGitvn={initializingGitvn}
      />

      {isOutdated && hasGitvn && !bannerDismissed && (
        <Alert
          color="orange"
          variant="light"
          radius={0}
          icon={<IconAlertCircle size={16} />}
          withCloseButton
          onClose={() => setBannerDismissed(true)}
          style={{
            borderBottom: "1px solid #fed7aa",
            backgroundColor: "#fffbeb",
            padding: "8px 16px",
          }}
        >
          <Group justify="space-between" wrap="nowrap">
            <Text fz={13} c="#9a3412">
              Dự án đang dùng quy chuẩn <b>.gitvn v{gitvnVersion || "1"}</b>{" "}
              (file gộp tasks.json). Khuyến nghị nâng cấp lên <b>v2.0</b> với
              kiến trúc file rời để chống xung đột Git khi merge nhánh.
            </Text>
            <Button
              size="compact-xs"
              color="orange"
              variant="filled"
              onClick={() => setUpgradeModalOpen(true)}
              style={{
                backgroundColor: "#ea580c",
                borderRadius: 6,
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              Nâng cấp v2 ngay
            </Button>
          </Group>
        </Alert>
      )}

      {upgradeModalOpen && (
        <UpgradeGitvnModal
          opened={upgradeModalOpen}
          onClose={() => setUpgradeModalOpen(false)}
          currentVersion={gitvnVersion}
          reason={outdatedReason}
          onUpgraded={checkGitvnStatus}
        />
      )}

      <BranchActionBanner onTabChange={setActiveTab} />

      {activeTab === "code" && <CodeTab onNavigateTab={setActiveTab} />}
      {activeTab === "commits" && (
        <CommitsTab onCommitsLoaded={setCommitsCount} />
      )}
      {(kanbanMounted || activeTab === "kanban") && (
        <Box
          style={{
            display: activeTab === "kanban" ? "flex" : "none",
            flex: 1,
            minHeight: 0,
            flexDirection: "column",
          }}
        >
          <JiraWorkspace isTabActive={activeTab === "kanban"} />
        </Box>
      )}
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
