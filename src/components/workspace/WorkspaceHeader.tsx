"use client";

import { Box, Button, Drawer, Group, Stack, Text } from "@mantine/core";
import {
  IconCircleDot,
  IconCircleDotFilled,
  IconCode,
  IconExternalLink,
  IconFileText,
  IconFileTextFilled,
  IconGitCommit,
  IconGitPullRequest,
  IconInfoCircle,
  IconInfoCircleFilled,
  IconLayoutKanban,
  IconLayoutKanbanFilled,
  IconLock,
  IconSettings,
  IconSettingsFilled,
  IconUsers,
  IconWorld,
} from "@tabler/icons-react";
import { useState } from "react";
import { dashboardPath, publicSharePath } from "@/lib/workspace-links";
import { useDashboardStore } from "@/store/dashboard.store";
import { BranchSelector } from "./BranchSelector";
import { ClonePopover } from "./ClonePopover";
import { GitvnStatusBadge } from "./GitvnStatusBadge";
import { ShareLinkMenu } from "./ShareLinkMenu";

export type WorkspaceTab =
  | "code"
  | "commits"
  | "kanban"
  | "docs"
  | "overview"
  | "pulls"
  | "issues"
  | "members"
  | "settings";

interface WorkspaceHeaderProps {
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  commitsCount?: number;
  pullsCount?: number;
  issuesCount?: number;
  hasGitvn?: boolean;
  isOutdated?: boolean;
  gitvnVersion?: string;
  onOpenUpgradeModal?: () => void;
  onInitializeGitvn?: () => void;
  initializingGitvn?: boolean;
}

export function WorkspaceHeader({
  activeTab,
  onTabChange,
  commitsCount,
  pullsCount = 0,
  issuesCount = 0,
  hasGitvn = true,
  isOutdated = false,
  gitvnVersion,
  onOpenUpgradeModal,
  onInitializeGitvn,
  initializingGitvn = false,
}: WorkspaceHeaderProps) {
  const branch = useDashboardStore((s) => s.currentBranch);
  const file = useDashboardStore((s) => s.activeFile);
  const selectedRepo = useDashboardStore((s) => s.selectedRepo);
  const [actionsOpen, setActionsOpen] = useState(false);
  if (!selectedRepo) return null;

  const VisibilityIcon = selectedRepo.private ? IconLock : IconWorld;

  const tabs: {
    id: WorkspaceTab;
    label: string;
    icon: typeof IconCode;
    activeIcon?: typeof IconCode;
    count?: number;
  }[] = [
    { id: "code", label: "Code", icon: IconCode },
    {
      id: "commits",
      label: "Commits",
      icon: IconGitCommit,
      count: commitsCount,
    },
    {
      id: "kanban",
      label: "Kanban",
      icon: IconLayoutKanban,
      activeIcon: IconLayoutKanbanFilled,
    },
    {
      id: "docs",
      label: "Docs",
      icon: IconFileText,
      activeIcon: IconFileTextFilled,
    },
    {
      id: "overview",
      label: "Overview",
      icon: IconInfoCircle,
      activeIcon: IconInfoCircleFilled,
    },
    {
      id: "pulls",
      label: "Pull requests",
      icon: IconGitPullRequest,
      count: pullsCount,
    },
    {
      id: "issues",
      label: "Issues",
      icon: IconCircleDot,
      activeIcon: IconCircleDotFilled,
      count: issuesCount,
    },
    { id: "members", label: "Thành viên", icon: IconUsers },
    {
      id: "settings",
      label: "Settings",
      icon: IconSettings,
      activeIcon: IconSettingsFilled,
    },
  ];

  const btnStyles = {
    root: {
      backgroundColor: "#ffffff",
      borderColor: "#d4d4d8",
      color: "#3f3f46",
      fontWeight: 500,
      fontSize: 13,
      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
      borderRadius: 8,
    },
  };

  const actions = (
    <>
      <ShareLinkMenu
        privateRepo={selectedRepo.private}
        shareTitle={selectedRepo.full_name}
        path={(selectedRepo.private ? dashboardPath : publicSharePath)({
          owner: selectedRepo.owner.login,
          repo: selectedRepo.name,
          branch,
          file: activeTab === "code" ? (file ?? undefined) : undefined,
        })}
      />
      <ClonePopover />
      <Button
        size="compact-sm"
        variant="default"
        component="a"
        href={selectedRepo.html_url}
        target="_blank"
        rightSection={<IconExternalLink size={13} color="#71717a" />}
        styles={btnStyles}
      >
        GitHub
      </Button>
    </>
  );

  return (
    <Box
      px={{ base: "sm", md: "lg" }}
      pt="sm"
      pb={0}
      style={{
        borderBottom: "1px solid #e4e4e7",
        backgroundColor: "#ffffff",
        flexShrink: 0,
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      <Group
        justify="space-between"
        align="center"
        wrap="nowrap"
        gap="xs"
        mb="xs"
      >
        <Group gap="xs" style={{ flex: 1, minWidth: 0 }}>
          <Group gap={6} wrap="nowrap" miw={0}>
            <Text
              component="h1"
              fw={750}
              fz={{ base: 16, md: 19 }}
              c="#18181b"
              truncate
              title={selectedRepo.full_name}
            >
              <Text component="span" inherit fw={500} c="#52525b">
                {selectedRepo.owner.login}
              </Text>
              {" / "}
              {selectedRepo.name}
            </Text>
            <Box
              component="span"
              role="img"
              aria-label={selectedRepo.private ? "Private" : "Public"}
              title={selectedRepo.private ? "Private" : "Public"}
              style={{ display: "inline-flex", flexShrink: 0 }}
            >
              <VisibilityIcon
                size={15}
                stroke={1.75}
                color="#71717a"
                aria-hidden
              />
            </Box>
          </Group>

          <GitvnStatusBadge
            hasGitvn={hasGitvn}
            isOutdated={isOutdated}
            gitvnVersion={gitvnVersion}
            onOpenUpgradeModal={onOpenUpgradeModal}
            onInitializeGitvn={onInitializeGitvn}
            initializingGitvn={initializingGitvn}
          />
          <BranchSelector />
        </Group>

        <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
          <Group visibleFrom="lg" gap="xs" wrap="nowrap">
            {actions}
          </Group>
          <Button
            hiddenFrom="lg"
            size="compact-sm"
            variant="default"
            onClick={() => setActionsOpen(true)}
          >
            Thao tác
          </Button>
        </Group>
      </Group>

      <Drawer
        opened={actionsOpen}
        onClose={() => setActionsOpen(false)}
        position="bottom"
        size="auto"
        title="Thao tác repo"
      >
        <Stack align="stretch" gap="xs">
          {actions}
        </Stack>
      </Drawer>

      {/* Tabs */}
      <style>{`
        .ws-tab-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 39px;
          padding: 8px 11px;
          font-size: 13px;
          font-weight: 500;
          color: #71717a;
          cursor: pointer;
          border-radius: 7px;
          transition: color 0.15s ease, background-color 0.15s ease;
          user-select: none;
          background: transparent;
          border: none;
          outline: none;
          white-space: nowrap;
        }

        .ws-tab-btn:hover:not(.ws-tab-active) {
          color: #18181b;
          background-color: #f4f4f5;
        }

        .ws-tab-active {
          color: #991b1b;
          font-weight: 650;
          background: #fff1f0;
        }

        .ws-tab-btn:focus-visible {
          outline: 2px solid #b91c1c;
          outline-offset: -2px;
        }

      `}</style>
      <Group
        component="nav"
        aria-label="Các mục trong repository"
        gap={2}
        wrap="nowrap"
        className="hide-scrollbar"
        style={{
          overflowX: "auto",
          paddingBottom: 8,
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = isActive ? (tab.activeIcon ?? tab.icon) : tab.icon;

          return (
            <button
              type="button"
              key={tab.id}
              aria-current={isActive ? "page" : undefined}
              onClick={() => onTabChange(tab.id)}
              className={`ws-tab-btn ${isActive ? "ws-tab-active" : ""}`}
            >
              <Icon
                size={15}
                color={isActive ? "#dc2626" : "#71717a"}
                stroke={isActive ? 2.5 : 1.75}
                style={{ transition: "all 0.15s ease", flexShrink: 0 }}
              />
              <span>{tab.label}</span>
              {typeof tab.count === "number" && tab.count > 0 && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 18,
                    height: 18,
                    padding: "0 6px",
                    borderRadius: 9999,
                    fontSize: 12,
                    fontWeight: 600,
                    backgroundColor: isActive ? "#fef2f2" : "#f4f4f5",
                    color: isActive ? "#dc2626" : "#71717a",
                    border: isActive
                      ? "1px solid #fecaca"
                      : "1px solid #e4e4e7",
                    lineHeight: 1,
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </Group>
    </Box>
  );
}
