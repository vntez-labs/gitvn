"use client";

import {
  Anchor,
  Avatar,
  Badge,
  Box,
  Button,
  Group,
  Paper,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import {
  IconBrandGithub,
  IconBriefcase,
  IconCalendar,
  IconExternalLink,
  IconLink,
  IconMail,
  IconMapPin,
  IconTrophy,
} from "@tabler/icons-react";
import type { ProfileInsights } from "@/interfaces/profile-insights";

export function UserProfileSidebar({
  user,
  organizations,
  achievements = [],
  isPro,
  isOwnProfile,
}: Pick<
  ProfileInsights,
  "user" | "organizations" | "achievements" | "isPro" | "isOwnProfile"
>) {
  const joined = new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(user.createdAt));
  const website =
    user.websiteUrl && /^https?:\/\//i.test(user.websiteUrl)
      ? user.websiteUrl
      : null;

  return (
    <Paper withBorder radius="lg" p={{ base: "md", sm: "lg" }}>
      <Stack gap="md">
        <Stack gap="sm">
          <Avatar
            src={user.avatarUrl}
            radius="xl"
            size={108}
            className="ring-1 ring-zinc-200 ring-offset-4 ring-offset-white"
          />
          <Box miw={0}>
            <Text
              component="h1"
              fz={{ base: 23, xl: 26 }}
              fw={750}
              lh={1.14}
              style={{ overflowWrap: "anywhere" }}
            >
              {user.name || user.login}
            </Text>
            <Group gap={7} mt={5} fz={14} c="#52525b">
              <Text size="inherit">@{user.login}</Text>
              {isPro && (
                <Badge variant="light" color="violet" size="md">
                  Pro
                </Badge>
              )}
              {user.pronouns && <Text size="inherit">· {user.pronouns}</Text>}
            </Group>
          </Box>
        </Stack>
        {user.bio && (
          <Text fz={14} lh={1.55} style={{ overflowWrap: "anywhere" }}>
            {user.bio}
          </Text>
        )}
        <Group gap="md" fz={13} c="#52525b">
          <Text size="inherit">
            <b>{user.followers.totalCount.toLocaleString("vi-VN")}</b> người
            theo dõi
          </Text>
          <Text size="inherit">
            <b>{user.following.totalCount.toLocaleString("vi-VN")}</b> đang theo
            dõi
          </Text>
        </Group>
        <Stack gap={8} c="#52525b">
          {user.company && (
            <Group gap="xs" wrap="nowrap">
              <IconBriefcase size={16} />
              <Text fz={13}>{user.company}</Text>
            </Group>
          )}
          {user.location && (
            <Group gap="xs" wrap="nowrap">
              <IconMapPin size={16} />
              <Text fz={13}>{user.location}</Text>
            </Group>
          )}
          <Group gap="xs" wrap="nowrap">
            <IconCalendar size={16} />
            <Text fz={13}>Tham gia {joined}</Text>
          </Group>
          {user.email && (
            <Group gap="xs" wrap="nowrap">
              <IconMail size={16} />
              <Anchor href={`mailto:${user.email}`} fz={13} truncate>
                {user.email}
              </Anchor>
            </Group>
          )}
          {(user.socialAccounts?.nodes ?? [])
            .filter((entry) => /^https?:\/\//i.test(entry.url))
            .map((entry) => (
              <Group key={entry.url} gap="xs" wrap="nowrap">
                <IconLink size={16} />
                <Anchor
                  href={entry.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  fz={13}
                  truncate
                >
                  {entry.displayName || entry.url}
                </Anchor>
              </Group>
            ))}
          {website && (
            <Group gap="xs" wrap="nowrap">
              <IconLink size={16} />
              <Anchor
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                fz={13}
                truncate
              >
                {website.replace(/^https?:\/\//i, "")}
              </Anchor>
            </Group>
          )}
        </Stack>
        <Button
          component="a"
          href={user.url}
          target="_blank"
          rel="noopener noreferrer"
          variant="default"
          leftSection={<IconBrandGithub size={17} />}
          rightSection={<IconExternalLink size={14} />}
        >
          Hồ sơ GitHub
        </Button>
        {achievements.length > 0 && (
          <Box pt="sm" className="border-t border-zinc-100">
            <Group justify="space-between" mb="xs">
              <Text component="h2" fz={14} fw={700}>
                Thành tích GitHub
              </Text>
              <IconTrophy size={16} color="#71717a" />
            </Group>
            <Group gap="sm">
              {achievements.map(({ iconUrl, name, tier }) => (
                <Tooltip key={name} label={tier ? `${name} · ${tier}` : name}>
                  <Box
                    component="a"
                    href={`${user.url}?tab=achievements`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={tier ? `${name}, ${tier}` : name}
                    className="relative inline-flex"
                  >
                    <Avatar src={iconUrl} size={43} radius="xl" alt="" />
                    {tier && (
                      <Badge
                        variant="white"
                        color="orange"
                        size="xs"
                        className="absolute -bottom-1 -right-2"
                      >
                        {tier}
                      </Badge>
                    )}
                  </Box>
                </Tooltip>
              ))}
            </Group>
          </Box>
        )}
        {organizations.length > 0 && (
          <Box pt="sm" className="border-t border-zinc-100">
            <Text component="h2" fz={14} fw={700} mb="xs">
              {isOwnProfile ? "Tổ chức của bạn" : "Tổ chức công khai"}
            </Text>
            <Group gap="xs">
              {organizations.map((org) => (
                <Tooltip key={org.login} label={org.login}>
                  <Avatar
                    component="a"
                    href={`https://github.com/${encodeURIComponent(org.login)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    src={org.avatar_url}
                    aria-label={org.login}
                    size={32}
                    radius="md"
                  />
                </Tooltip>
              ))}
            </Group>
          </Box>
        )}
      </Stack>
    </Paper>
  );
}
