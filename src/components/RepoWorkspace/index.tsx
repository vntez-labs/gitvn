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
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";
import axios from "axios";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { useAuthStore } from "@/store/auth.store";
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

const MembersTab = dynamic(
  () => import("../workspace/members/MembersTab").then((mod) => mod.MembersTab),
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

export function RepoWorkspace({ initialPull }: { initialPull?: number }) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(
    initialPull ? "pulls" : "code",
  );
  const [pullNumber, setPullNumber] = useState(initialPull);
  const [commitsCount, setCommitsCount] = useState<number | undefined>(
    undefined,
  );
  const [pullsCount, setPullsCount] = useState<number>();
  const [issuesCount, setIssuesCount] = useState<number>();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState<boolean>(false);
  const [bannerDismissed, setBannerDismissed] = useState<boolean>(false);
  const [initializingGitvn, setInitializingGitvn] = useState<boolean>(false);
  const [kanbanMounted, setKanbanMounted] = useState<boolean>(false);
  const selectedRepo = useDashboardStore((s) => s.selectedRepo);
  const currentBranch = useDashboardStore((s) => s.currentBranch);
  const selectRepo = useDashboardStore((s) => s.selectRepo);

  const loadingTree = useDashboardStore((state) => state.loadingTree);
  const waitForCode = activeTab === "code" && loadingTree;
  const login = useAuthStore((state) => state.user?.login);
  const owner = selectedRepo?.owner.login;
  const repo = selectedRepo?.name;
  const countsUrl =
    owner &&
    repo &&
    `/api/github/repo?${new URLSearchParams({ owner, repo, view: "counts" })}`;
  const { data: counts } = useSWR(
    login && countsUrl && !waitForCode ? [countsUrl, login] : null,
    async ([url]) =>
      (await axios.get<{ pulls: number; issues: number }>(url)).data,
    { dedupingInterval: 60_000, revalidateOnFocus: false, errorRetryCount: 1 },
  );

  useEffect(() => {
    if (activeTab === "kanban") {
      setKanbanMounted(true);
    }
  }, [activeTab]);

  const gitvnUrl =
    owner &&
    repo &&
    `/api/gitvn?${new URLSearchParams({ owner, repo, branch: currentBranch })}`;
  const { data: gitvnStatus, mutate: checkGitvnStatus } = useSWR(
    login && gitvnUrl && !waitForCode ? [gitvnUrl, login] : null,
    async ([url]) =>
      (
        await axios.get<{
          hasGitvn: boolean;
          isOutdated: boolean;
          currentVersion?: string;
          reason?: string;
        }>(url)
      ).data,
    { dedupingInterval: 30_000, revalidateOnFocus: false, errorRetryCount: 1 },
  );
  const hasGitvn = Boolean(gitvnStatus?.hasGitvn);
  const isOutdated = Boolean(gitvnStatus?.isOutdated);
  const gitvnVersion = gitvnStatus?.currentVersion || "2.0.0";
  const outdatedReason = gitvnStatus?.reason || "";

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
            ? "Đã tạo và commit cấu trúc chuẩn .gitvn v2 lên GitHub"
            : "Đã tạo cấu trúc chuẩn .gitvn v2 cục bộ",
          color: "teal",
          icon: <IconCheck size={16} />,
        });
        void checkGitvnStatus();
        selectRepo(selectedRepo, undefined, currentBranch);
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
        pullsCount={pullsCount ?? counts?.pulls}
        issuesCount={issuesCount ?? counts?.issues}
        hasGitvn={hasGitvn}
        isOutdated={isOutdated}
        gitvnVersion={gitvnVersion}
        onOpenUpgradeModal={() => setUpgradeModalOpen(true)}
        onInitializeGitvn={gitvnStatus ? handleInitializeGitvn : undefined}
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

      {!waitForCode && <BranchActionBanner onTabChange={setActiveTab} />}

      {activeTab === "code" && (
        <CodeTab
          onNavigateTab={setActiveTab}
          onPullCreated={(number) => {
            setPullNumber(number);
            setActiveTab("pulls");
          }}
        />
      )}
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
          onInitializeGitvn={gitvnStatus ? handleInitializeGitvn : undefined}
          hasGitvn={hasGitvn}
        />
      )}
      {activeTab === "overview" && <OverviewTab />}
      {activeTab === "pulls" && (
        <PullsTab
          initialPull={pullNumber}
          onPullOpened={(number) => setPullNumber(number ?? undefined)}
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
      {activeTab === "members" && (
        <MembersTab key={selectedRepo.id} repository={selectedRepo} />
      )}
      {activeTab === "settings" && <SettingsTab />}
    </Box>
  );
}
