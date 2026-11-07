"use client";

import {
  Avatar,
  Badge,
  Box,
  Button,
  Group,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import {
  IconExternalLink,
  IconLink,
  IconMail,
  IconMapPin,
  IconUsers,
} from "@tabler/icons-react";

interface UserProfileSidebarProps {
  data: any;
  formatCompactNumber: (n: number) => string;
}

export function UserProfileSidebar({
  data,
  formatCompactNumber,
}: UserProfileSidebarProps) {
  const user = data.user || {};

  return (
    <Stack gap="md">
      <Avatar
        src={user?.avatar_url}
        size={240}
        radius="50%"
        style={{
          border: "2px solid #e2e8f0",
          boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
          maxWidth: "100%",
        }}
      />

      <Box>
        <Text fz={22} fw={700} c="#0f172a" lh={1.2}>
          {user?.name || user?.login}
        </Text>
        <Group gap="xs" mt={3}>
          <Text fz={15} c="#64748b" ff="monospace">
            {user?.login}
          </Text>
          {data.isPro && (
            <Badge
              size="xs"
              variant="light"
              color="grape"
              radius="xl"
              style={{ fontWeight: 700 }}
            >
              ★ PRO
            </Badge>
          )}
        </Group>
      </Box>

      {user?.bio && (
        <Text fz={13} c="#334155" lh={1.5}>
          {user.bio}
        </Text>
      )}

      <Button
        component="a"
        href={user?.html_url}
        target="_blank"
        fullWidth
        size="xs"
        variant="default"
        rightSection={<IconExternalLink size={13} />}
      >
        Trang cá nhân GitHub
      </Button>

      <Group gap="xs" fz={12} c="#64748b">
        <IconUsers size={14} />
        <Text fz={12}>
          <b style={{ color: "#0f172a" }}>{user?.followers ?? 0}</b> followers •{" "}
          <b style={{ color: "#0f172a" }}>{user?.following ?? 0}</b> following
        </Text>
      </Group>

      <Stack gap={6} fz={12} c="#64748b">
        {user?.email && (
          <Group gap="xs">
            <IconMail size={14} />
            <Text fz={12}>{user.email}</Text>
          </Group>
        )}
        {user?.location && (
          <Group gap="xs">
            <IconMapPin size={14} />
            <Text fz={12}>{user.location}</Text>
          </Group>
        )}
        {user?.blog && (
          <Group gap="xs">
            <IconLink size={14} />
            <Text
              component="a"
              href={
                user.blog.startsWith("http")
                  ? user.blog
                  : `https://${user.blog}`
              }
              target="_blank"
              fz={12}
              c="#fb291a"
              truncate
            >
              {user.blog}
            </Text>
          </Group>
        )}
      </Stack>

      {/* ACHIEVEMENTS */}
      {data.achievements?.length > 0 && (
        <Box pt="xs" style={{ borderTop: "1px solid #e2e8f0" }}>
          <Group justify="space-between" mb="xs">
            <Text fz={12} fw={700} c="#0f172a">
              Achievements ({data.achievements.length})
            </Text>
            <Text
              component="a"
              href={`https://github.com/${user?.login}?tab=achievements`}
              target="_blank"
              fz={10}
              c="#fb291a"
            >
              Xác thực ↗
            </Text>
          </Group>

          <Group gap={8} wrap="wrap">
            {data.achievements.map((item: any, idx: number) => (
              <Tooltip
                key={`${item.name}-${idx}`}
                label={`${item.name} ${item.tier ? `(${item.tier})` : ""}`}
                withArrow
              >
                <Box
                  component="a"
                  href={`https://github.com/${user?.login}?tab=achievements`}
                  target="_blank"
                  style={{ position: "relative", display: "block" }}
                >
                  <img
                    src={item.iconUrl}
                    alt={item.name}
                    width={54}
                    height={54}
                    style={{ display: "block", objectFit: "contain" }}
                  />
                  {item.tier && (
                    <Badge
                      size="xs"
                      variant="filled"
                      color="gray"
                      radius="xl"
                      style={{
                        position: "absolute",
                        bottom: -2,
                        right: -4,
                        border: "1px solid #e2e8f0",
                        fontSize: 9,
                        padding: "0 4px",
                      }}
                    >
                      {item.tier}
                    </Badge>
                  )}
                </Box>
              </Tooltip>
            ))}
          </Group>
        </Box>
      )}

      {/* ORGANIZATIONS */}
      {data.orgs?.length > 0 && (
        <Box pt="xs" style={{ borderTop: "1px solid #e2e8f0" }}>
          <Text fz={12} fw={700} c="#0f172a" mb="xs">
            Organizations
          </Text>
          <Group gap={6} wrap="wrap">
            {data.orgs.map((org: any) => (
              <Tooltip key={org.login} label={org.login} withArrow>
                <Avatar
                  src={org.avatarUrl}
                  size={28}
                  radius="sm"
                  component="a"
                  href={org.url}
                  target="_blank"
                />
              </Tooltip>
            ))}
          </Group>
        </Box>
      )}
    </Stack>
  );
}
