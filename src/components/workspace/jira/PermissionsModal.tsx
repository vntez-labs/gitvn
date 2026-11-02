"use client";

import {
  Box,
  Button,
  Group,
  Modal,
  Paper,
  Select,
  Stack,
  Text,
} from "@mantine/core";
import { IconCheck, IconShieldLock } from "@tabler/icons-react";
import { useState } from "react";
import type { ProjectPermissions, ProjectRole } from "@/interfaces/jira";
import { AssignRoleSearch } from "./permissions/AssignRoleSearch";
import { UserRolesTable } from "./permissions/UserRolesTable";

interface PermissionsModalProps {
  opened: boolean;
  onClose: () => void;
  permissions: ProjectPermissions;
  currentUserLogin: string;
  repoOwner: string;
  onSavePermissions: (newPermissions: ProjectPermissions) => void;
  canEdit: boolean;
}

const ROLE_LABELS: Record<
  ProjectRole,
  { label: string; desc: string; color: string }
> = {
  admin: {
    label: "Admin (Quản trị)",
    desc: "Toàn quyền cấu hình, tạo sprint, xóa task và phân quyền thành viên",
    color: "red",
  },
  pm: {
    label: "PM / Scrum Master",
    desc: "Có quyền tạo/quản lý Sprint, sắp xếp Backlog và quản lý task",
    color: "orange",
  },
  member: {
    label: "Member (Thành viên)",
    desc: "Có quyền tạo task, kéo thả cập nhật trạng thái trong Sprint",
    color: "blue",
  },
  viewer: {
    label: "Viewer (Người xem)",
    desc: "Chỉ có quyền xem bảng Kanban và Backlog, không được chỉnh sửa",
    color: "gray",
  },
};

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin (Toàn quyền)" },
  { value: "pm", label: "PM / Scrum Master" },
  { value: "member", label: "Member (Thành viên)" },
  { value: "viewer", label: "Viewer (Chỉ xem)" },
];

export function PermissionsModal({
  opened,
  onClose,
  permissions,
  currentUserLogin,
  repoOwner,
  onSavePermissions,
  canEdit,
}: PermissionsModalProps) {
  const [userRoles, setUserRoles] = useState<Record<string, ProjectRole>>(
    permissions.userRoles || {},
  );
  const [defaultRole, setDefaultRole] = useState<ProjectRole>(
    permissions.defaultRole || "member",
  );

  const handleAddUser = (targetUser: string, role: ProjectRole) => {
    const cleanUser = targetUser.trim().replace(/^@/, "").toLowerCase();
    if (!cleanUser) return;

    setUserRoles((prev) => ({
      ...prev,
      [cleanUser]: role,
    }));
  };

  const handleRemoveUser = (username: string) => {
    if (username.toLowerCase() === repoOwner.toLowerCase()) {
      alert("Không thể xóa quyền của Repo Owner!");
      return;
    }
    setUserRoles((prev) => {
      const copy = { ...prev };
      delete copy[username];
      return copy;
    });
  };

  const handleRoleChange = (username: string, role: ProjectRole) => {
    setUserRoles((prev) => ({
      ...prev,
      [username]: role,
    }));
  };

  const handleSave = () => {
    const updated: ProjectPermissions = {
      ...permissions,
      userRoles,
      defaultRole,
    };
    onSavePermissions(updated);
    onClose();
  };

  const usersList = Object.entries(userRoles);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="lg"
      title={
        <Group gap="xs">
          <IconShieldLock size={18} color="#fb291a" />
          <Text fw={700} fz={15} c="#1f1c19">
            Phân Quyền Dự Án & Vai Trò (Roles)
          </Text>
        </Group>
      }
      centered
      radius="md"
      styles={{
        content: {
          backgroundColor: "#ffffff",
          border: "1px solid #e8e5de",
          color: "#1f1c19",
          borderRadius: 12,
        },
        header: {
          backgroundColor: "#f5f3ee",
          borderBottom: "1px solid #e8e5de",
          padding: "14px 20px",
        },
      }}
    >
      <Stack gap="md">
        <Paper
          p="sm"
          bg="#f5f3ee"
          radius="md"
          style={{ border: "1px solid #e8e5de" }}
        >
          <Text fz={12} c="#6e675f" lh={1.5}>
            Phân quyền xác định ai có quyền <strong>kéo thả task</strong>,{" "}
            <strong>quản lý Sprint</strong>, hoặc{" "}
            <strong>cấu hình file .gitvn/tasks.json</strong>.
          </Text>
        </Paper>

        {/* Tra cứu & Gán vai trò cho thành viên mới */}
        {canEdit && (
          <AssignRoleSearch
            onAddUser={handleAddUser}
            roleOptions={ROLE_OPTIONS}
          />
        )}

        {/* Danh sách thành viên hiện tại */}
        <Box>
          <Text fz={12} fw={600} c="#334155" mb={8}>
            Danh sách thành viên & vai trò ({usersList.length})
          </Text>

          <UserRolesTable
            usersList={usersList}
            repoOwner={repoOwner}
            currentUserLogin={currentUserLogin}
            canEdit={canEdit}
            roleOptions={ROLE_OPTIONS}
            roleLabels={ROLE_LABELS}
            onRoleChange={handleRoleChange}
            onRemoveUser={handleRemoveUser}
          />
        </Box>

        {/* Vai trò mặc định cho người ngoài */}
        <Group justify="space-between" align="center" mt="xs">
          <Box>
            <Text fz={12} fw={600} c="#334155">
              Vai trò mặc định cho thành viên khác:
            </Text>
            <Text fz={11} c="#6e675f">
              Áp dụng khi người dùng mở repo mà chưa được cấu hình vai trò riêng
            </Text>
          </Box>
          <Select
            size="xs"
            data={ROLE_OPTIONS.filter((r) => r.value !== "admin")}
            value={defaultRole}
            onChange={(val) => setDefaultRole((val as ProjectRole) || "member")}
            disabled={!canEdit}
            style={{ width: 170 }}
            styles={{
              input: {
                backgroundColor: "#ffffff",
                borderColor: "#e5e1da",
                color: "#1f1c19",
              },
            }}
          />
        </Group>

        {/* Nút Footer */}
        <Group justify="flex-end" mt="md">
          <Button variant="default" size="xs" onClick={onClose}>
            Hủy
          </Button>
          {canEdit && (
            <Button
              color="vntez"
              size="xs"
              leftSection={<IconCheck size={14} />}
              onClick={handleSave}
            >
              Lưu phân quyền
            </Button>
          )}
        </Group>
      </Stack>
    </Modal>
  );
}
