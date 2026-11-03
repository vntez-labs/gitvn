"use client";

import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Loader,
  Menu,
  SegmentedControl,
  Select,
  Tooltip,
} from "@mantine/core";
import {
  IconCalendar,
  IconDots,
  IconFileCode,
  IconGitPullRequest,
  IconPlus,
  IconRefresh,
  IconShieldLock,
} from "@tabler/icons-react";
import type { GitSyncStatus } from "@/hooks/jira/useJiraSync";
import type { JiraSprint, ProjectRole } from "@/interfaces/jira";

interface JiraBoardToolbarProps {
  view: "kanban" | "backlog";
  setView: (val: "kanban" | "backlog") => void;
  selectedSprintId: string;
  setSelectedSprintId: (val: string) => void;
  sprintOptions: { value: string; label: string }[];
  gitSyncStatus: GitSyncStatus;
  syncedToGitHub: boolean;
  flushGitSync: () => Promise<void>;
  fetchBoardData: () => void;
  syncWithPullRequests: () => Promise<void>;
  userRole: ProjectRole;
  canEdit: boolean;
  canManageSprint: boolean;
  activeSprint: JiraSprint | null;
  onOpenCreateTask: (sprintId?: string | null) => void;
  onOpenCreateSprint: () => void;
  onOpenPermissions: () => void;
  onOpenJsonModal: () => void;
}

import { GitSyncBadge } from "./GitSyncBadge";

export function JiraBoardToolbar({
  view,
  setView,
  selectedSprintId,
  setSelectedSprintId,
  sprintOptions,
  gitSyncStatus,
  syncedToGitHub,
  flushGitSync,
  fetchBoardData,
  syncWithPullRequests,
  userRole,
  canEdit,
  canManageSprint,
  activeSprint,
  onOpenCreateTask,
  onOpenCreateSprint,
  onOpenPermissions,
  onOpenJsonModal,
}: JiraBoardToolbarProps) {
  return (
    <Box
      px="md"
      py={8}
      bg="#ffffff"
      style={{
        borderBottom: "1px solid #e2e8f0",
        flexShrink: 0,
      }}
    >
      <Group justify="space-between" wrap="nowrap" align="center">
        <Group gap="sm" wrap="nowrap" align="center">
          <SegmentedControl
            size="xs"
            value={view}
            onChange={(val) => setView(val as "kanban" | "backlog")}
            data={[
              { value: "kanban", label: "Bảng Kanban" },
              { value: "backlog", label: "Backlog & Sprints" },
            ]}
            styles={{
              root: { backgroundColor: "#f4f4f5" },
              indicator: {
                backgroundColor: "#ffffff",
                boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
              },
              label: {
                fontSize: 12,
                fontWeight: 600,
                padding: "4px 10px",
                "&[data-active]": { color: "#18181b" },
              },
            }}
          />

          {view === "kanban" && (
            <Select
              size="xs"
              data={sprintOptions}
              value={selectedSprintId}
              onChange={(val) => setSelectedSprintId(val || "active")}
              allowDeselect={false}
              leftSection={<IconCalendar size={13} color="#71717a" />}
              styles={{
                input: {
                  fontWeight: 600,
                  fontSize: 12,
                  minWidth: 210,
                  backgroundColor: "#ffffff",
                  borderColor: "#e4e4e7",
                  color: "#18181b",
                },
              }}
            />
          )}
        </Group>

        <Group gap="xs" wrap="nowrap" align="center">
          {/* Sync Status Badge (Tối ưu hóa: Debounced Git Sync & Gom 1 commit) */}
          <GitSyncBadge
            gitSyncStatus={gitSyncStatus}
            syncedToGitHub={syncedToGitHub}
            flushGitSync={flushGitSync}
            fetchBoardData={fetchBoardData}
          />

          {/* Nút Đồng bộ trạng thái Pull Requests */}
          <Tooltip
            label="Quét và đồng bộ trạng thái Task từ GitHub Pull Requests (In Progress -> In Review)"
            withArrow
          >
            <ActionIcon
              variant="light"
              color="violet"
              size="sm"
              radius="md"
              aria-label="Đồng bộ PR"
              onClick={syncWithPullRequests}
            >
              <IconGitPullRequest size={15} />
            </ActionIcon>
          </Tooltip>

          {/* Menu options */}
          <Menu
            position="bottom-end"
            shadow="md"
            width={220}
            radius="md"
            withArrow
          >
            <Menu.Target>
              <ActionIcon
                variant="default"
                size="sm"
                radius="md"
                aria-label="Tùy chọn"
              >
                <IconDots size={15} color="#475569" />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Quản trị & Thành viên</Menu.Label>
              <Menu.Item
                leftSection={<IconShieldLock size={14} color="#64748b" />}
                rightSection={
                  <Badge size="xs" variant="light" color="vntez">
                    {userRole.toUpperCase()}
                  </Badge>
                }
                onClick={onOpenPermissions}
              >
                Phân quyền dự án
              </Menu.Item>
              {canManageSprint && (
                <Menu.Item
                  leftSection={<IconCalendar size={14} color="#64748b" />}
                  onClick={onOpenCreateSprint}
                >
                  Tạo Sprint mới
                </Menu.Item>
              )}
              <Menu.Divider />
              <Menu.Label>Cấu hình & Dữ liệu</Menu.Label>
              <Menu.Item
                leftSection={<IconFileCode size={14} color="#fb291a" />}
                onClick={onOpenJsonModal}
              >
                Xem .gitvn/tasks.json
              </Menu.Item>
              <Menu.Item
                leftSection={<IconGitPullRequest size={14} color="#8b5cf6" />}
                onClick={syncWithPullRequests}
              >
                Đồng bộ Pull Requests
              </Menu.Item>
              <Menu.Item
                leftSection={<IconRefresh size={14} color="#64748b" />}
                onClick={fetchBoardData}
              >
                Làm mới dữ liệu
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>

          <Button
            size="xs"
            variant="default"
            radius="md"
            leftSection={<IconFileCode size={14} color="#71717a" />}
            onClick={onOpenJsonModal}
            styles={{
              root: {
                backgroundColor: "#ffffff",
                borderColor: "#d4d4d8",
                color: "#3f3f46",
                fontWeight: 500,
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
              },
            }}
          >
            Import / Export JSON
          </Button>

          {canEdit && (
            <Button
              size="xs"
              radius="md"
              leftSection={<IconPlus size={14} />}
              onClick={() => onOpenCreateTask(activeSprint?.id || null)}
              styles={{
                root: {
                  backgroundColor: "#dc2626",
                  color: "#ffffff",
                  fontWeight: 500,
                  boxShadow: "0 1px 2px rgba(220, 38, 38, 0.2)",
                  "&:hover": {
                    backgroundColor: "#b91c1c",
                  },
                },
              }}
            >
              Tạo việc
            </Button>
          )}
        </Group>
      </Group>
    </Box>
  );
}
