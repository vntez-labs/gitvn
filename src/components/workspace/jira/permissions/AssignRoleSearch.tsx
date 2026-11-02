"use client";

import {
  Avatar,
  Box,
  Button,
  Group,
  Loader,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { IconSearch, IconUserPlus } from "@tabler/icons-react";
import axios from "axios";
import { useEffect, useState } from "react";
import type { ProjectRole } from "@/interfaces/jira";
import { getGitHubAvatarUrl } from "@/lib/avatar";

interface AssignRoleSearchProps {
  onAddUser: (username: string, role: ProjectRole) => void;
  roleOptions: { value: string; label: string }[];
}

export function AssignRoleSearch({
  onAddUser,
  roleOptions,
}: AssignRoleSearchProps) {
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<ProjectRole>("member");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    if (!username.trim() || username.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      setSearching(true);
      axios
        .get(
          `/api/github/users/search?q=${encodeURIComponent(username.trim())}`,
        )
        .then((res) => setSearchResults(res.data.users || []))
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [username]);

  const handleSelect = (target: string) => {
    onAddUser(target, role);
    setUsername("");
    setSearchResults([]);
  };

  return (
    <Box style={{ position: "relative" }}>
      <Text fz={12} fw={600} c="#334155" mb={6}>
        Tra cứu & Gán vai trò thành viên
      </Text>
      <Group gap="xs" align="flex-start">
        <TextInput
          placeholder="Nhập username GitHub để tra cứu..."
          size="xs"
          value={username}
          onChange={(e) => setUsername(e.currentTarget.value)}
          leftSection={<IconSearch size={14} color="#94a3b8" />}
          rightSection={searching ? <Loader size={12} color="vntez" /> : null}
          style={{ flex: 1 }}
          styles={{
            input: {
              backgroundColor: "#ffffff",
              borderColor: "#e5e1da",
              color: "#1f1c19",
            },
          }}
        />
        <Select
          size="xs"
          data={roleOptions}
          value={role}
          onChange={(val) => setRole((val as ProjectRole) || "member")}
          style={{ width: 170 }}
          styles={{
            input: {
              backgroundColor: "#ffffff",
              borderColor: "#e5e1da",
              color: "#1f1c19",
            },
          }}
        />
        <Button
          size="xs"
          color="vntez"
          leftSection={<IconUserPlus size={14} />}
          onClick={() => handleSelect(username)}
        >
          Gán quyền
        </Button>
      </Group>

      {/* Dropdown kết quả tra cứu GitHub */}
      {searchResults.length > 0 && (
        <Paper
          p="xs"
          radius="md"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 180,
            zIndex: 20,
            backgroundColor: "#ffffff",
            border: "1px solid #e8e5de",
            boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
            maxHeight: 180,
            overflowY: "auto",
            marginTop: 4,
          }}
        >
          <Stack gap={2}>
            {searchResults.map((u) => (
              <Box
                key={u.id}
                p={5}
                onClick={() => handleSelect(u.login)}
                style={{
                  borderRadius: 6,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f5f3ee")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                <Avatar src={getGitHubAvatarUrl(u, 32)} size={20} radius="xl" />
                <Text fz={12} fw={600} c="#1f1c19">
                  @{u.login}
                </Text>
              </Box>
            ))}
          </Stack>
        </Paper>
      )}
    </Box>
  );
}
