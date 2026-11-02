"use client";

import { Avatar, Box, Button, Group, Paper, Select, Text } from "@mantine/core";
import { IconSend } from "@tabler/icons-react";
import { getGitHubAvatarUrl } from "@/lib/avatar";
import type { SearchUser } from "./UserSearchResults";

interface InviteUserCardProps {
  selectedUser: SearchUser;
  onClear: () => void;
  permission: string;
  onPermissionChange: (val: string) => void;
  role: string;
  onRoleChange: (val: string) => void;
  inviting: boolean;
  onSendInvite: () => void;
}

export function InviteUserCard({
  selectedUser,
  onClear,
  permission,
  onPermissionChange,
  role,
  onRoleChange,
  inviting,
  onSendInvite,
}: InviteUserCardProps) {
  return (
    <Paper
      p="sm"
      radius="md"
      style={{
        backgroundColor: "#f5f3ee",
        border: "1px solid #e8e5de",
      }}
    >
      <Group justify="space-between" mb="xs">
        <Group gap="xs">
          <Avatar
            src={getGitHubAvatarUrl(selectedUser, 48)}
            size={32}
            radius="xl"
          />
          <Box>
            <Text fz="xs" fw={700} c="#1f1c19">
              @{selectedUser.login}
            </Text>
            <Text fz={11} c="#6e675f">
              {selectedUser.isCollaborator
                ? "Đang là thành viên repository"
                : "Chưa tham gia repository"}
            </Text>
          </Box>
        </Group>

        <Button
          size="compact-xs"
          variant="subtle"
          color="gray"
          onClick={onClear}
        >
          Đổi người khác
        </Button>
      </Group>

      <Group gap="xs" grow mt="sm">
        <Select
          label="Quyền GitHub Repo"
          size="xs"
          value={permission}
          onChange={(val) => onPermissionChange(val || "push")}
          data={[
            { value: "push", label: "Write (Đẩy code & tạo PR)" },
            { value: "pull", label: "Read (Chỉ đọc & review)" },
            { value: "admin", label: "Admin (Toàn quyền)" },
          ]}
          styles={{
            label: { fontSize: 11, fontWeight: 600, color: "#475569" },
            input: { backgroundColor: "#ffffff" },
          }}
        />

        <Select
          label="Vai trò Agile GitVN"
          size="xs"
          value={role}
          onChange={(val) => onRoleChange(val || "member")}
          data={[
            { value: "member", label: "Member (Thành viên sprint)" },
            { value: "pm", label: "PM / Scrum Master" },
            { value: "admin", label: "Admin (Quản trị task)" },
            { value: "viewer", label: "Viewer (Chỉ xem bảng)" },
          ]}
          styles={{
            label: { fontSize: 11, fontWeight: 600, color: "#475569" },
            input: { backgroundColor: "#ffffff" },
          }}
        />
      </Group>

      <Button
        mt="md"
        fullWidth
        size="xs"
        color="vntez"
        loading={inviting}
        onClick={onSendInvite}
        leftSection={<IconSend size={14} />}
      >
        Gửi lời mời tham gia
      </Button>
    </Paper>
  );
}
