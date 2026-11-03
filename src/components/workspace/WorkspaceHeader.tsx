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
      borderColor: "#e4e4e7",
      color: "#3f3f46",
      fontWeight: 500,
      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
      borderRadius: 6,
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
          <IconBook size={19} color="#6366f1" />
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

          {hasGitvn ? (
            <Badge
              size="xs"
              variant="outline"
              leftSection={<IconCheck size={11} />}
              style={{
                backgroundColor: "#eef2ff",
                color: "#4338ca",
                borderColor: "#c7d2fe",
                borderRadius: 9999,
                fontWeight: 500,
                padding: "2px 8px",
              }}
            >
              .gitvn Active
            </Badge>
          ) : (
            onInitializeGitvn && (
              <Button
                size="compact-xs"
                variant="subtle"
                color="indigo"
                loading={initializingGitvn}
                onClick={onInitializeGitvn}
                leftSection={<IconSparkles size={12} />}
                style={{
                  backgroundColor: "#eef2ff",
                  color: "#4338ca",
                  borderColor: "#c7d2fe",
                  borderRadius: 6,
                  fontWeight: 500,
                }}
              >
                Khởi tạo .gitvn
              </Button>
            )
          )}

          <BranchSelector />
        </Group>

        <Group gap="xs" wrap="nowrap">
          <Button
            size="compact-sm"
            variant="default"
            leftSection={<IconUserPlus size={14} color="#6366f1" />}
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
                padding: "8px 12px 10px",
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? "#18181b" : "#71717a",
                borderBottom: isActive
                  ? "2px solid #18181b"
                  : "2px solid transparent",
                cursor: "pointer",
                transition: "all 0.15s ease",
                userSelect: "none",
                borderRadius: "6px 6px 0 0",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = "#18181b";
                  e.currentTarget.style.backgroundColor =
                    "rgba(244, 244, 245, 0.6)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = "#71717a";
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              <Icon size={15} color={isActive ? "#18181b" : "#71717a"} />
              <span>{tab.label}</span>
              {typeof tab.count === "number" && tab.count > 0 && (
                <Badge
                  size="xs"
                  variant="outline"
                  style={{
                    backgroundColor: isActive ? "#e4e4e7" : "#f4f4f5",
                    borderColor: isActive ? "#d4d4d8" : "#e4e4e7",
                    color: isActive ? "#18181b" : "#71717a",
                    fontWeight: 600,
                    fontSize: 11,
                    padding: "0 6px",
                    height: 18,
                  }}
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
