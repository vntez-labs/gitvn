"use client";

import { Badge, Box, Button, Group, Text } from "@mantine/core";
import {
  IconBook,
  IconCheck,
  IconCircleDot,
  IconCode,
  IconExternalLink,
  IconFileText,
  IconGitCommit,
  IconGitPullRequest,
  IconInfoCircle,
  IconLayoutKanban,
  IconRefresh,
  IconSettings,
  IconSparkles,
  IconUserPlus,
} from "@tabler/icons-react";
import { useState } from "react";
import { useDashboardStore } from "@/store/dashboard.store";
import { BranchSelector } from "./BranchSelector";
import { ClonePopover } from "./ClonePopover";
import { GitvnStatusBadge } from "./GitvnStatusBadge";
import { InviteMemberModal } from "./members/InviteMemberModal";

export type WorkspaceTab =
  | "code"
  | "commits"
  | "kanban"
  | "docs"
  | "overview"
  | "pulls"
  | "issues"
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
  const { selectedRepo, currentBranch } = useDashboardStore();
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  if (!selectedRepo) return null;

  const tabs = [
    { id: "code", label: "Code", icon: IconCode },
    {
      id: "commits",
      label: "Commits",
      icon: IconGitCommit,
      count: commitsCount,
    },
    { id: "kanban", label: "Kanban", icon: IconLayoutKanban },
    { id: "docs", label: "Docs", icon: IconFileText },
    { id: "overview", label: "Overview", icon: IconInfoCircle },
    {
      id: "pulls",
      label: "Pull requests",
      icon: IconGitPullRequest,
      count: pullsCount,
    },
    { id: "issues", label: "Issues", icon: IconCircleDot, count: issuesCount },
    { id: "settings", label: "Settings", icon: IconSettings },
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

  return (
    <Box
      px="lg"
      pt="sm"
      pb={0}
      style={{
        borderBottom: "1px solid #e4e4e7",
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        flexShrink: 0,
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      <Group justify="space-between" align="center" wrap="nowrap" mb={12}>
        <Group gap="xs" wrap="nowrap">
          <IconBook size={19} color="#dc2626" />
          <Text fw={600} fz={15} c="#18181b" ff="monospace">
            {selectedRepo.owner.login} /{" "}
            <span style={{ color: "#18181b", fontWeight: 700 }}>
              {selectedRepo.name}
            </span>
          </Text>

          <Badge
            size="xs"
            variant="outline"
            style={{
              backgroundColor: selectedRepo.private ? "#f4f4f5" : "#ecfdf5",
              color: selectedRepo.private ? "#52525b" : "#047857",
              borderColor: selectedRepo.private ? "#e4e4e7" : "#a7f3d0",
              borderRadius: 9999,
              fontWeight: 500,
              padding: "2px 8px",
            }}
          >
            {selectedRepo.private ? "Private" : "Public"}
          </Badge>

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

        <Group gap="xs" wrap="nowrap">
          <Button
            size="compact-sm"
            variant="default"
            leftSection={<IconUserPlus size={14} color="#71717a" />}
            onClick={() => setInviteModalOpen(true)}
            styles={btnStyles}
          >
            Mời thành viên
          </Button>

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
        </Group>
      </Group>

      {/* Modal Mời & Tra cứu thành viên */}
      <InviteMemberModal
        opened={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        owner={selectedRepo.owner.login}
        repo={selectedRepo.name}
      />

      {/* Tabs */}
      <style>{`
        .ws-tab-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px 10px 12px;
          font-size: 13px;
          font-weight: 500;
          color: #71717a;
          cursor: pointer;
          border-radius: 6px 6px 0 0;
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
          color: #18181b !important;
          font-weight: 600 !important;
          background: transparent !important;
        }

        .ws-tab-active::after {
          content: "";
          position: absolute;
          left: 4px;
          right: 4px;
          bottom: 0;
          height: 2px;
          background-color: #dc2626;
          border-radius: 2px;
          z-index: 2;
        }
      `}</style>
      <Group
        gap={2}
        wrap="nowrap"
        className="hide-scrollbar"
        style={{
          overflowX: "auto",
          marginBottom: -1,
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              type="button"
              key={tab.id}
              onClick={() => onTabChange(tab.id as WorkspaceTab)}
              className={`ws-tab-btn ${isActive ? "ws-tab-active" : ""}`}
            >
              <Icon
                size={15}
                color={isActive ? "#dc2626" : "#71717a"}
                style={{ transition: "color 0.15s ease" }}
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
                    fontSize: 11,
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
