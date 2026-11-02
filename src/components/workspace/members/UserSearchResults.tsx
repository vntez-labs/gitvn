"use client";

import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Button,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconExternalLink,
  IconSearch,
  IconUserPlus,
} from "@tabler/icons-react";
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
  searching?: boolean;
  query?: string;
  error?: string | null;
  onSelectManualUsername?: (username: string) => void;
}

export function UserSearchResults({
  results,
  onSelect,
  searching = false,
  query = "",
  error = null,
  onSelectManualUsername,
}: UserSearchResultsProps) {
  const cleanQ = query.trim();

  // Nếu chưa nhập ít nhất 2 ký tự và không đang tìm kiếm
  if (!cleanQ || cleanQ.length < 2) return null;

  // Nếu không đang tìm, không có lỗi và kết quả rỗng
  const hasNoResults = !searching && !error && results.length === 0;

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
        boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
        maxHeight: 260,
        overflowY: "auto",
        marginTop: 4,
      }}
    >
      {/* 1. Trạng thái đang tải */}
      {searching && (
        <Group justify="center" p="sm" gap="xs">
          <Loader size={14} color="vntez" />
          <Text fz={12} c="#6e675f">
            Đang tra cứu tài khoản GitHub...
          </Text>
        </Group>
      )}

      {/* 2. Trạng thái lỗi */}
      {!searching && error && (
        <Group p="xs" gap="xs">
          <IconAlertCircle size={16} color="#dc2626" />
          <Text fz={12} c="#dc2626">
            {error}
          </Text>
        </Group>
      )}

      {/* 3. Trạng thái không tìm thấy */}
      {hasNoResults && (
        <Stack gap={6} p="xs">
          <Group gap={6}>
            <IconSearch size={14} color="#94a3b8" />
            <Text fz={12} fw={600} c="#1f1c19">
              Không tìm thấy tài khoản với &quot;{cleanQ}&quot;
            </Text>
          </Group>

          {cleanQ.includes("@") ? (
            <Text fz={11} c="#6e675f" lh={1.4}>
              GitHub mặc định ẩn email riêng tư. Bạn có thể thử tìm kiếm theo{" "}
              <Text span fw={600}>
                username GitHub
              </Text>{" "}
              (vd: @octocat) của thành viên.
            </Text>
          ) : (
            <Text fz={11} c="#6e675f" lh={1.4}>
              Hãy kiểm tra lại chính xác username hoặc mời trực tiếp người dùng
              này.
            </Text>
          )}

          {!cleanQ.includes(" ") && onSelectManualUsername && (
            <Button
              size="xs"
              variant="light"
              color="vntez"
              fullWidth
              mt={4}
              onClick={() => onSelectManualUsername(cleanQ.replace(/^@/, ""))}
              leftSection={<IconUserPlus size={14} />}
            >
              Mời trực tiếp @{cleanQ.replace(/^@/, "")}
            </Button>
          )}
        </Stack>
      )}

      {/* 4. Danh sách kết quả tìm thấy */}
      {!searching && results.length > 0 && (
        <Stack gap={4}>
          {results.map((user) => (
            <Box
              key={user.id || user.login}
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
                  size={26}
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
      )}
    </Paper>
  );
}
