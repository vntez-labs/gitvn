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
  IconGitMerge,
  IconGitPullRequest,
  IconInfoCircle,
  IconLayoutKanban,
  IconSettings,
  IconSparkles,
  IconUserPlus,
} from "@tabler/icons-react";
import { useState } from "react";
import { useDashboardStore } from "@/store/dashboard.store";
import { BranchSelector } from "./BranchSelector";
import { ClonePopover } from "./ClonePopover";
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
  onInitializeGitvn,
  initializingGitvn = false,
}: WorkspaceHeaderProps) {
  const { selectedRepo, currentBranch } = useDashboardStore();
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  if (!selectedRepo) return null;

  const defaultBranch = (selectedRepo as any).default_branch || "main";
  const isFeatureBranch =
    currentBranch.toLowerCase() !== defaultBranch.toLowerCase();
  const compareUrl = `https://github.com/${selectedRepo.owner.login}/${selectedRepo.name}/compare/${currentBranch}?expand=1`;

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

  return (
    <Box
      px="lg"
      pt="sm"
      pb={0}
      style={{
        borderBottom: "1px solid #e8e5de",
        backgroundColor: "#ffffff",
        flexShrink: 0,
      }}
    >
      <Group justify="space-between" align="center" wrap="nowrap" mb={12}>
        <Group gap="xs" wrap="nowrap">
          <IconBook size={20} color="#fb291a" />
          <Text fw={600} fz={16} c="#0f172a" ff="monospace">
            {selectedRepo.owner.login} /{" "}
            <span style={{ color: "#fb291a", fontWeight: 700 }}>
              {selectedRepo.name}
            </span>
          </Text>

          <Badge
            size="sm"
            variant="light"
            color={selectedRepo.private ? "gray" : "teal"}
            radius="sm"
          >
            {selectedRepo.private ? "Private" : "Public"}
          </Badge>

          {/* Indicator trạng thái cấu trúc chuẩn .gitvn */}
          {hasGitvn ? (
            <Badge
              size="sm"
              variant="light"
              color="vntez"
              radius="sm"
              leftSection={<IconCheck size={12} />}
            >
              .gitvn Active
            </Badge>
          ) : (
            onInitializeGitvn && (
              <Button
                size="compact-xs"
                variant="light"
                color="vntez"
                loading={initializingGitvn}
                onClick={onInitializeGitvn}
                leftSection={<IconSparkles size={12} />}
              >
                Khởi tạo .gitvn
              </Button>
            )
          )}

          <BranchSelector />
        </Group>

        <Group gap="xs" wrap="nowrap">
          {isFeatureBranch && (
            <Button
              size="compact-sm"
              variant="filled"
              component="a"
              href={compareUrl}
              target="_blank"
              leftSection={<IconGitMerge size={14} />}
              rightSection={<IconExternalLink size={12} />}
              styles={{
                root: {
                  backgroundColor: "#16a34a",
                  color: "#ffffff",
                  fontWeight: 600,
                  "&:hover": { backgroundColor: "#15803d" },
                },
              }}
            >
              Merge / PR
            </Button>
          )}

          <Button
            size="compact-sm"
            variant="default"
            leftSection={<IconUserPlus size={14} color="#fb291a" />}
            onClick={() => setInviteModalOpen(true)}
            styles={{
              root: {
                backgroundColor: "#ffffff",
                borderColor: "#e5e1da",
                color: "#1f1c19",
                fontWeight: 500,
              },
            }}
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
            rightSection={<IconExternalLink size={13} />}
            styles={{
              root: {
                backgroundColor: "#f8fafc",
                borderColor: "#e2e8f0",
                color: "#334155",
                fontWeight: 500,
              },
            }}
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
      <Group
        gap={4}
        wrap="nowrap"
        className="hide-scrollbar"
        style={{ overflowX: "auto" }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <Box
              key={tab.id}
              onClick={() => onTabChange(tab.id as WorkspaceTab)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "9px 14px 11px",
                fontSize: 14,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? "#fb291a" : "#475569",
                borderBottom: isActive
                  ? "2px solid #fb291a"
                  : "2px solid transparent",
                cursor: "pointer",
                transition: "all 0.15s ease",
                userSelect: "none",
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.color = "#0f172a";
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.color = "#475569";
              }}
            >
              <Icon size={16} color={isActive ? "#fb291a" : "#64748b"} />
              <span>{tab.label}</span>
              {typeof tab.count === "number" && tab.count > 0 && (
                <Badge
                  size="xs"
                  variant={isActive ? "filled" : "light"}
                  color={isActive ? "vntez" : "gray"}
                  circle
                >
                  {tab.count}
                </Badge>
              )}
            </Box>
          );
        })}
      </Group>
    </Box>
  );
}
