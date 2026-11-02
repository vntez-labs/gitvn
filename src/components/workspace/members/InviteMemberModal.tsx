"use client";

import {
  Box,
  Button,
  Divider,
  Group,
  Loader,
  Modal,
  Paper,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import {
  IconCheck,
  IconSearch,
  IconUserCheck,
  IconUserPlus,
} from "@tabler/icons-react";
import axios from "axios";
import { useEffect, useState } from "react";
import { InviteUserCard } from "./InviteUserCard";
import { type SearchUser, UserSearchResults } from "./UserSearchResults";

interface InviteMemberModalProps {
  opened: boolean;
  onClose: () => void;
  owner: string;
  repo: string;
  onMemberInvited?: (username: string, role: string) => void;
}

export function InviteMemberModal({
  opened,
  onClose,
  owner,
  repo,
  onMemberInvited,
}: InviteMemberModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);

  const [permission, setPermission] = useState<string>("push");
  const [role, setRole] = useState<string>("member");
  const [inviting, setInviting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Debounced search khi người dùng gõ
  useEffect(() => {
    if (!opened) {
      setSearchQuery("");
      setSearchResults([]);
      setSearchError(null);
      setSelectedUser(null);
      setStatusMessage(null);
      return;
    }

    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    const timer = setTimeout(() => {
      setSearching(true);
      setSearchError(null);
      axios
        .get(
          `/api/github/users/search?q=${encodeURIComponent(
            searchQuery.trim(),
          )}&owner=${owner}&repo=${repo}`,
        )
        .then((res) => {
          setSearchResults(res.data.users || []);
        })
        .catch((err) => {
          setSearchResults([]);
          setSearchError(
            err.response?.data?.error || "Lỗi khi tra cứu tài khoản GitHub",
          );
        })
        .finally(() => setSearching(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, opened, owner, repo]);

  const handleSelectUser = (user: SearchUser) => {
    setSelectedUser(user);
    setSearchQuery("");
    setSearchResults([]);
    setStatusMessage(null);
  };

  const handleSelectManualUsername = (manualName: string) => {
    const clean = manualName.replace(/^@/, "").trim();
    if (!clean) return;
    setSelectedUser({
      id: 0,
      login: clean,
      avatar_url: `https://github.com/${clean}.png`,
      html_url: `https://github.com/${clean}`,
    });
    setSearchQuery("");
    setSearchResults([]);
    setStatusMessage(null);
  };

  const handleSendInvite = async () => {
    if (!selectedUser) return;
    setInviting(true);
    setStatusMessage(null);

    try {
      const res = await axios.post("/api/github/collaborators/invite", {
        owner,
        repo,
        username: selectedUser.login,
        permission,
        role,
      });

      setStatusMessage({
        type: "success",
        text: res.data.message || `Đã mời @${selectedUser.login} thành công!`,
      });

      if (onMemberInvited) {
        onMemberInvited(selectedUser.login, role);
      }

      setSelectedUser(null);
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text:
          err.response?.data?.error ||
          "Không thể gửi lời mời. Hãy kiểm tra bạn có quyền Admin trên repository này.",
      });
    } finally {
      setInviting(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="md"
      title={
        <Group gap="xs">
          <IconUserPlus size={18} color="#fb291a" />
          <Text fw={700} fz={15} c="#1f1c19">
            Mời & Tra cứu Thành viên
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
        {/* Hộp tìm kiếm và tra cứu GitHub user */}
        <Box style={{ position: "relative" }}>
          <Text fz={12} fw={600} c="#334155" mb={6}>
            Tra cứu tài khoản GitHub (Username hoặc Email)
          </Text>
          <TextInput
            placeholder="Nhập email hoặc username (vd: khanhhly8530lk@gmail.com, octocat)..."
            size="xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            leftSection={<IconSearch size={14} color="#94a3b8" />}
            rightSection={searching ? <Loader size={12} color="vntez" /> : null}
            styles={{
              input: {
                backgroundColor: "#ffffff",
                borderColor: "#e5e1da",
                color: "#1f1c19",
              },
            }}
          />

          {/* Danh sách kết quả tra cứu */}
          <UserSearchResults
            results={searchResults}
            onSelect={handleSelectUser}
            searching={searching}
            query={searchQuery}
            error={searchError}
            onSelectManualUsername={handleSelectManualUsername}
          />
        </Box>

        {/* Thông tin người dùng đã chọn để mời */}
        {selectedUser && (
          <InviteUserCard
            selectedUser={selectedUser}
            onClear={() => setSelectedUser(null)}
            permission={permission}
            onPermissionChange={setPermission}
            role={role}
            onRoleChange={setRole}
            inviting={inviting}
            onSendInvite={handleSendInvite}
          />
        )}

        {/* Thông báo trạng thái */}
        {statusMessage && (
          <Paper
            p="xs"
            radius="md"
            style={{
              backgroundColor:
                statusMessage.type === "success" ? "#f0fdf4" : "#fef2f2",
              border: `1px solid ${statusMessage.type === "success" ? "#bbf7d0" : "#fecaca"}`,
            }}
          >
            <Group gap="xs">
              {statusMessage.type === "success" ? (
                <IconCheck size={16} color="#16a34a" />
              ) : (
                <IconUserCheck size={16} color="#dc2626" />
              )}
              <Text
                fz="xs"
                c={statusMessage.type === "success" ? "#15803d" : "#b91c1c"}
                fw={500}
              >
                {statusMessage.text}
              </Text>
            </Group>
          </Paper>
        )}

        <Divider color="#e8e5de" />

        <Group justify="flex-end">
          <Button variant="default" size="xs" onClick={onClose}>
            Đóng
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
