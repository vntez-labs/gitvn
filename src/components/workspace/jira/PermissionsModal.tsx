"use client";

import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Modal,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconCheck,
  IconShieldLock,
  IconTrash,
  IconUserPlus,
} from "@tabler/icons-react";
import { useState } from "react";
import type { ProjectPermissions, ProjectRole } from "@/interfaces/jira";

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
  const [newUsername, setNewUsername] = useState("");
  const [newRole, setNewRole] = useState<ProjectRole>("member");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddUser = () => {
    const cleanUser = newUsername.trim().toLowerCase();
    if (!cleanUser) {
      setErrorMsg("Vui lòng nhập GitHub username");
      return;
    }

    setUserRoles((prev) => ({
      ...prev,
      [cleanUser]: newRole,
    }));
    setNewUsername("");
    setErrorMsg(null);
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
          <Text fw={700} fz={15} c="#0f172a">
            Phân Quyền Dự Án & Vai Trò (Roles)
          </Text>
        </Group>
      }
      centered
      radius="md"
      styles={{
        content: {
          backgroundColor: "#ffffff",
          border: "1px solid #e2e8f0",
          color: "#0f172a",
          borderRadius: 12,
        },
        header: {
          backgroundColor: "#f8fafc",
          borderBottom: "1px solid #e2e8f0",
          padding: "14px 20px",
        },
      }}
    >
      <Stack gap="md">
        {/* Giới thiệu các vai trò */}
        <Paper
          p="sm"
          bg="#f8fafc"
          radius="md"
          style={{ border: "1px solid #e2e8f0" }}
        >
          <Text fz={12} c="#475569" lh={1.5}>
            Phân quyền xác định ai có thể <strong>kéo thả task</strong>,{" "}
            <strong>quản lý Sprint</strong>, hoặc{" "}
            <strong>cấu hình file .gitvn/tasks.json</strong>.
          </Text>
        </Paper>

        {/* Thêm thành viên mới */}
        {canEdit && (
          <Box>
            <Text fz={12} fw={600} c="#334155" mb={6}>
              Gán vai trò cho thành viên mới
            </Text>
            <Group gap="xs" align="flex-start">
              <TextInput
                placeholder="GitHub username (vd: octocat)"
                size="xs"
                value={newUsername}
                onChange={(e) => {
                  setNewUsername(e.currentTarget.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                error={errorMsg}
                style={{ flex: 1 }}
                styles={{
                  input: {
                    backgroundColor: "#ffffff",
                    borderColor: "#cbd5e1",
                    color: "#0f172a",
                  },
                }}
              />
              <Select
                size="xs"
                data={ROLE_OPTIONS}
                value={newRole}
                onChange={(val) => setNewRole((val as ProjectRole) || "member")}
                style={{ width: 180 }}
                styles={{
                  input: {
                    backgroundColor: "#ffffff",
                    borderColor: "#cbd5e1",
                    color: "#0f172a",
                  },
                }}
              />
              <Button
                size="xs"
                color="indigo"
                leftSection={<IconUserPlus size={14} />}
                onClick={handleAddUser}
              >
                Gán quyền
              </Button>
            </Group>
          </Box>
        )}

        {/* Danh sách thành viên hiện tại */}
        <Box>
          <Text fz={12} fw={600} c="#334155" mb={8}>
            Danh sách thành viên & vai trò ({usersList.length})
          </Text>

          <Paper
            p={0}
            bg="#ffffff"
            radius="md"
            style={{ border: "1px solid #e2e8f0", overflow: "hidden" }}
          >
            <Table horizontalSpacing="md" verticalSpacing="xs">
              <Table.Thead
                style={{
                  backgroundColor: "#f8fafc",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                <Table.Tr>
                  <Table.Th style={{ color: "#64748b", fontSize: 11 }}>
                    USERNAME
                  </Table.Th>
                  <Table.Th style={{ color: "#64748b", fontSize: 11 }}>
                    VAI TRÒ
                  </Table.Th>
                  <Table.Th style={{ width: 50 }} />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {usersList.map(([username, role]) => {
                  const isOwner =
                    username.toLowerCase() === repoOwner.toLowerCase();
                  const isCurrent =
                    username.toLowerCase() === currentUserLogin.toLowerCase();
                  const meta = ROLE_LABELS[role] || ROLE_LABELS.member;

                  return (
                    <Table.Tr
                      key={username}
                      style={{ borderBottom: "1px solid #e2e8f0" }}
                    >
                      <Table.Td>
                        <Group gap={6}>
                          <Text
                            fz={13}
                            fw={600}
                            c="#0f172a"
                            ff="var(--font-geist-mono), monospace"
                          >
                            {username}
                          </Text>
                          {isOwner && (
                            <Badge size="xs" color="teal" variant="light">
                              Owner
                            </Badge>
                          )}
                          {isCurrent && (
                            <Badge size="xs" color="vntez" variant="outline">
                              Bạn
                            </Badge>
                          )}
                        </Group>
                      </Table.Td>

                      <Table.Td>
                        {canEdit && !isOwner ? (
                          <Select
                            size="xs"
                            data={ROLE_OPTIONS}
                            value={role}
                            onChange={(val) =>
                              handleRoleChange(username, val as ProjectRole)
                            }
                            style={{ width: 170 }}
                            styles={{
                              input: {
                                backgroundColor: "#ffffff",
                                borderColor: "#cbd5e1",
                                color: "#0f172a",
                              },
                            }}
                          />
                        ) : (
                          <Badge size="sm" color={meta.color} variant="light">
                            {meta.label}
                          </Badge>
                        )}
                      </Table.Td>

                      <Table.Td>
                        {canEdit && !isOwner && (
                          <Tooltip label="Gỡ quyền thành viên" withArrow>
                            <ActionIcon
                              size="sm"
                              variant="subtle"
                              color="red"
                              onClick={() => handleRemoveUser(username)}
                            >
                              <IconTrash size={14} />
                            </ActionIcon>
                          </Tooltip>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Paper>
        </Box>

        {/* Vai trò mặc định cho người ngoài */}
        <Group justify="space-between" align="center" mt="xs">
          <Box>
            <Text fz={12} fw={600} c="#334155">
              Vai trò mặc định cho thành viên khác:
            </Text>
            <Text fz={11} c="#64748b">
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
                borderColor: "#cbd5e1",
                color: "#0f172a",
              },
            }}
          />
        </Group>

        {/* Nút Footer */}
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose}>
            Hủy
          </Button>
          {canEdit && (
            <Button
              color="vntez"
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
