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
  IconBrandFacebook,
  IconBrandLinkedin,
  IconBrandX,
  IconExternalLink,
  IconLink,
  IconMail,
  IconMapPin,
  IconStar,
  IconUsers,
} from "@tabler/icons-react";

interface UserProfileSidebarProps {
  data: any;
}

export function UserProfileSidebar({ data }: UserProfileSidebarProps) {
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
        <Group gap={6} mt={3} align="center" wrap="wrap">
          <Text fz={15} c="#64748b" ff="monospace">
            {user?.login}
          </Text>
          {user?.pronouns && (
            <Text fz={13} c="#64748b">
              · {user.pronouns}
            </Text>
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
        {user?.socialAccounts?.map((social: any, idx: number) => {
          const isFb =
            social.provider === "FACEBOOK" ||
            social.url?.includes("facebook.com") ||
            social.url?.includes("fb.com");
          const isTwitter =
            social.provider === "TWITTER" ||
            social.url?.includes("twitter.com") ||
            social.url?.includes("x.com");
          const isLinkedin =
            social.provider === "LINKEDIN" ||
            social.url?.includes("linkedin.com");

          return (
            <Group key={idx} gap="xs">
              {isFb ? (
                <IconBrandFacebook size={14} color="#1877f2" />
              ) : isTwitter ? (
                <IconBrandX size={14} color="#0f172a" />
              ) : isLinkedin ? (
                <IconBrandLinkedin size={14} color="#0a66c2" />
              ) : (
                <IconLink size={14} />
              )}
              <Text
                component="a"
                href={social.url}
                target="_blank"
                fz={12}
                c="#334155"
                truncate
                style={{ textDecoration: "none" }}
              >
                {social.displayName ||
                  social.url.replace(/^https?:\/\/(www\.)?/, "")}
              </Text>
            </Group>
          );
        })}
      </Stack>

      {/* ACHIEVEMENTS */}
      {data.achievements?.length > 0 && (
        <Box pt="xs" style={{ borderTop: "1px solid #e2e8f0" }}>
          <Group justify="space-between" mb="xs">
            <Text fz={12} fw={700} c="#0f172a">
              Achievements
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
                  style={{ position: "relative", display: "inline-block" }}
                >
                  <img
                    src={item.iconUrl}
                    alt={item.name}
                    width={56}
                    height={56}
                    style={{ display: "block", objectFit: "contain" }}
                  />
                  {item.tier && (
                    <Box
                      style={{
                        position: "absolute",
                        bottom: 0,
                        right: -2,
                        backgroundColor: "#ffffff",
                        border: "1.5px solid #d97706",
                        borderRadius: 9999,
                        fontSize: 9,
                        fontWeight: 700,
                        color: "#b45309",
                        padding: "0 4px",
                        lineHeight: "14px",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                      }}
                    >
                      {item.tier}
                    </Box>
                  )}
                </Box>
              </Tooltip>
            ))}
          </Group>
        </Box>
      )}

      {/* HIGHLIGHTS */}
      {data.isPro && (
        <Box pt="xs" style={{ borderTop: "1px solid #e2e8f0" }}>
          <Text fz={12} fw={700} c="#0f172a" mb={6}>
            Highlights
          </Text>
          <Group gap={6}>
            <Badge
              size="sm"
              variant="outline"
              color="gray"
              radius="sm"
              leftSection={<IconStar size={11} color="#64748b" />}
              styles={{
                root: {
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: 11,
                  height: 22,
                  padding: "0 8px",
                  borderColor: "#cbd5e1",
                  color: "#334155",
                },
              }}
            >
              PRO
            </Badge>
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
                  size={32}
                  radius="sm"
                  component="a"
                  href={org.url || `https://github.com/${org.login}`}
                  target="_blank"
                  style={{
                    border: "1px solid #e2e8f0",
                    transition: "transform 0.1s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.transform = "scale(1.08)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = "scale(1)")
                  }
                />
              </Tooltip>
            ))}
          </Group>
        </Box>
      )}
    </Stack>
  );
}
