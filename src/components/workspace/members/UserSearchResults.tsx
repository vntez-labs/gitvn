"use client";

import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Group,
  Paper,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { IconExternalLink } from "@tabler/icons-react";
import { getGitHubAvatarUrl } from "@/lib/avatar";

export interface SearchUser {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  isCollaborator?: boolean;
}

interface UserSearchResultsProps {
  results: SearchUser[];
  onSelect: (user: SearchUser) => void;
}

export function UserSearchResults({
  results,
  onSelect,
}: UserSearchResultsProps) {
  if (results.length === 0) return null;

  return (
    <Paper
      p="xs"
      radius="md"
      style={{
        position: "absolute",
        top: "100%",
        left: 0,
        right: 0,
        zIndex: 20,
        backgroundColor: "#ffffff",
        border: "1px solid #e8e5de",
        boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
        maxHeight: 220,
        overflowY: "auto",
        marginTop: 4,
      }}
    >
      <Stack gap={4}>
        {results.map((user) => (
          <Box
            key={user.id}
            p={6}
            onClick={() => onSelect(user)}
            style={{
              borderRadius: 6,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              transition: "background-color 0.1s ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f5f3ee")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <Group gap="xs">
              <Avatar
                src={getGitHubAvatarUrl(user, 36)}
                size={24}
                radius="xl"
              />
              <Text fz={12} fw={600} c="#1f1c19">
                @{user.login}
              </Text>
              {user.isCollaborator && (
                <Badge size="xs" color="teal" variant="light">
                  Đã là thành viên
                </Badge>
              )}
            </Group>
            <Tooltip label="Xem hồ sơ GitHub" withArrow>
              <ActionIcon
                size="xs"
                variant="subtle"
                color="gray"
                component="a"
                href={user.html_url}
                target="_blank"
                onClick={(e) => e.stopPropagation()}
              >
                <IconExternalLink size={12} />
              </ActionIcon>
            </Tooltip>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}
