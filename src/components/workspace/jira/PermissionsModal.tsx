'use client';

import { useState } from 'react';
import {
  Modal,
  Box,
  Group,
  Text,
  Button,
  Stack,
  Select,
  Badge,
  Paper,
  Divider,
  TextInput,
  ActionIcon,
  Tooltip,
  Checkbox,
} from '@mantine/core';
import {
  IconShieldLock,
  IconUserPlus,
  IconTrash,
  IconCheck,
  IconUsers,
} from '@tabler/icons-react';
import { ProjectPermissions, ProjectRole } from '@/interfaces/jira';

interface PermissionsModalProps {
  opened: boolean;
  onClose: () => void;
  permissions: ProjectPermissions;
  currentUsername: string;
  isAdminOrPM: boolean;
  onSavePermissions: (updated: ProjectPermissions) => void;
}

const ROLES: { value: ProjectRole; label: string; desc: string }[] = [
  { value: 'admin', label: 'Admin (Quản trị viên)', desc: 'Toàn quyền cấu hình, xóa, phân quyền' },
  { value: 'pm', label: 'Project Manager (Quản lý dự án)', desc: 'Tạo sprint, quản lý backlog và phân công task' },
  { value: 'member', label: 'Member / Developer', desc: 'Tạo và kéo thả task trong Sprint' },
  { value: 'viewer', label: 'Viewer (Người xem)', desc: 'Chỉ xem bảng Kanban, không có quyền sửa' },
];

export function PermissionsModal({
  opened,
  onClose,
  permissions,
  currentUsername,
  isAdminOrPM,
  onSavePermissions,
}: PermissionsModalProps) {
  const [userRoles, setUserRoles] = useState<Record<string, ProjectRole>>(permissions?.userRoles || {});
  const [canManageSprint, setCanManageSprint] = useState<ProjectRole[]>(permissions?.canManageSprint || ['admin', 'pm']);
  const [canCreateBacklog, setCanCreateBacklog] = useState<ProjectRole[]>(
    permissions?.canCreateBacklog || ['admin', 'pm', 'member']
  );
  const [newUser, setNewUser] = useState('');
  const [newRole, setNewRole] = useState<ProjectRole>('member');

  const handleAddUser = () => {
    const trimmed = newUser.trim().toLowerCase();
    if (!trimmed) return;
    setUserRoles((prev) => ({
      ...prev,
      [trimmed]: newRole,
    }));
    setNewUser('');
  };

  const handleRemoveUser = (login: string) => {
    setUserRoles((prev) => {
      const copy = { ...prev };
      delete copy[login];
      return copy;
    });
  };

  const handleSave = () => {
    onSavePermissions({
      ...permissions,
      userRoles,
      canManageSprint,
      canCreateBacklog,
    });
    onClose();
  };

  const toggleSprintRole = (role: ProjectRole) => {
    if (canManageSprint.includes(role)) {
      setCanManageSprint(canManageSprint.filter((r) => r !== role));
    } else {
      setCanManageSprint([...canManageSprint, role]);
    }
  };

  const toggleBacklogRole = (role: ProjectRole) => {
    if (canCreateBacklog.includes(role)) {
      setCanCreateBacklog(canCreateBacklog.filter((r) => r !== role));
    } else {
      setCanCreateBacklog([...canCreateBacklog, role]);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="lg"
      title={
        <Group gap="xs">
          <IconShieldLock size={18} color="#58a6ff" />
          <Text fw={700} fz={15} c="#f0f6fc">
            Phân quyền dự án (Roles & Permissions)
          </Text>
        </Group>
      }
      styles={{
        content: {
          backgroundColor: '#161b22',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#f0f6fc',
          borderRadius: 12,
        },
        header: {
          backgroundColor: '#1c2128',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '14px 20px',
        },
        body: {
          padding: 20,
        },
      }}
    >
      <Stack gap="md">
        {/* Vai trò của user hiện tại */}
        <Paper p="xs" px="md" bg="#0d1117" radius="md" style={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <Group justify="space-between">
            <Group gap="xs">
              <IconUsers size={16} color="#8b949e" />
              <Text fz={13} c="#c9d1d9">
                Tài khoản của bạn:{' '}
                <span style={{ fontWeight: 700, color: '#58a6ff' }}>@{currentUsername}</span>
              </Text>
            </Group>
            <Badge size="sm" color="blue" variant="light" style={{ textTransform: 'uppercase' }}>
              {(userRoles[currentUsername] || permissions?.defaultRole || 'member')}
            </Badge>
          </Group>
        </Paper>

        {/* Cấu hình quyền: Ai có quyền tạo Sprint */}
        <Paper p="md" bg="#0d1117" radius="md" style={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <Text fz={13} fw={700} c="#f0f6fc" mb={4}>
            Ai có quyền tạo & quản lý Sprint?
          </Text>
          <Text fz={12} c="#8b949e" mb="sm">
            Chỉ những vai trò được tích chọn mới có thể tạo Sprint mới, bắt đầu hoặc kết thúc Sprint.
          </Text>
          <Group gap="lg">
            {(['admin', 'pm', 'member'] as ProjectRole[]).map((role) => (
              <Checkbox
                key={role}
                label={role.toUpperCase()}
                checked={canManageSprint.includes(role)}
                disabled={!isAdminOrPM || role === 'admin'}
                onChange={() => toggleSprintRole(role)}
                styles={{ label: { color: '#f0f6fc', fontSize: 13, fontWeight: 600 } }}
              />
            ))}
          </Group>
        </Paper>

        {/* Cấu hình quyền: Ai có quyền tạo Backlog */}
        <Paper p="md" bg="#0d1117" radius="md" style={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <Text fz={13} fw={700} c="#f0f6fc" mb={4}>
            Ai có quyền tạo Backlog / Task?
          </Text>
          <Text fz={12} c="#8b949e" mb="sm">
            Những vai trò được phép thêm công việc mới vào danh sách Backlog.
          </Text>
          <Group gap="lg">
            {(['admin', 'pm', 'member', 'viewer'] as ProjectRole[]).map((role) => (
              <Checkbox
                key={role}
                label={role.toUpperCase()}
                checked={canCreateBacklog.includes(role)}
                disabled={!isAdminOrPM || role === 'admin'}
                onChange={() => toggleBacklogRole(role)}
                styles={{ label: { color: '#f0f6fc', fontSize: 13, fontWeight: 600 } }}
              />
            ))}
          </Group>
        </Paper>

        {/* Danh sách thành viên & Gán vai trò */}
        <Box>
          <Text fz={13} fw={700} c="#f0f6fc" mb={8}>
            Thành viên & Vai trò trong dự án
          </Text>

          {isAdminOrPM && (
            <Group gap="xs" mb="sm">
              <TextInput
                placeholder="Nhập GitHub username..."
                size="xs"
                value={newUser}
                onChange={(e) => setNewUser(e.currentTarget.value)}
                style={{ flex: 1 }}
                styles={{
                  input: {
                    backgroundColor: '#0d1117',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    color: '#f0f6fc',
                    borderRadius: 6,
                  },
                }}
              />
              <Select
                size="xs"
                data={ROLES.map((r) => ({ value: r.value, label: r.label }))}
                value={newRole}
                onChange={(val) => setNewRole(val as ProjectRole)}
                style={{ width: 220 }}
                styles={{
                  input: {
                    backgroundColor: '#0d1117',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    color: '#f0f6fc',
                    borderRadius: 6,
                  },
                  dropdown: { backgroundColor: '#161b22', borderColor: '#30363d' },
                }}
              />
              <Button
                size="xs"
                variant="light"
                color="blue"
                leftSection={<IconUserPlus size={14} />}
                onClick={handleAddUser}
              >
                Gán vai trò
              </Button>
            </Group>
          )}

          <Stack gap={6} style={{ maxHeight: 200, overflowY: 'auto' }}>
            {Object.entries(userRoles).map(([login, role]) => (
              <Group
                key={login}
                justify="space-between"
                p="xs"
                bg="#0d1117"
                style={{ border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 6 }}
              >
                <Group gap="xs">
                  <Text fz={13} fw={600} c="#f0f6fc">
                    @{login}
                  </Text>
                  {login === currentUsername && (
                    <Badge size="xs" variant="outline" color="blue">
                      Bạn
                    </Badge>
                  )}
                </Group>

                <Group gap="xs">
                  {isAdminOrPM ? (
                    <Select
                      size="xs"
                      data={ROLES.map((r) => ({ value: r.value, label: r.label }))}
                      value={role}
                      onChange={(val) =>
                        setUserRoles((prev) => ({ ...prev, [login]: (val as ProjectRole) || 'member' }))
                      }
                      style={{ width: 190 }}
                      styles={{
                        input: {
                          backgroundColor: '#161b22',
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                          color: '#f0f6fc',
                          height: 28,
                          borderRadius: 6,
                        },
                        dropdown: { backgroundColor: '#161b22', borderColor: '#30363d' },
                      }}
                    />
                  ) : (
                    <Badge size="xs" color="blue">
                      {role.toUpperCase()}
                    </Badge>
                  )}

                  {isAdminOrPM && login !== currentUsername && (
                    <Tooltip label="Xóa vai trò" withArrow>
                      <ActionIcon size="sm" variant="subtle" color="red" onClick={() => handleRemoveUser(login)}>
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                </Group>
              </Group>
            ))}
          </Stack>
        </Box>

        <Divider color="rgba(255, 255, 255, 0.08)" />

        <Group justify="flex-end">
          <Button
            variant="default"
            size="xs"
            onClick={onClose}
            styles={{
              root: {
                backgroundColor: '#21262d',
                borderColor: 'rgba(255, 255, 255, 0.12)',
                color: '#c9d1d9',
                borderRadius: 8,
              },
            }}
          >
            Hủy
          </Button>
          {isAdminOrPM && (
            <Button
              variant="filled"
              size="xs"
              leftSection={<IconCheck size={14} />}
              onClick={handleSave}
              styles={{
                root: {
                  backgroundColor: '#238636',
                  color: '#ffffff',
                  fontWeight: 600,
                  borderRadius: 8,
                  '&:hover': { backgroundColor: '#2ea043' },
                },
              }}
            >
              Lưu phân quyền
            </Button>
          )}
        </Group>
      </Stack>
    </Modal>
  );
}
