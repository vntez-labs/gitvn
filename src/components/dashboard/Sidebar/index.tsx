"use client";

import {
  ActionIcon,
  Box,
  Group,
  Skeleton,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconBrandFacebook,
  IconBrandGithub,
  IconPlus,
} from "@tabler/icons-react";
import { useState } from "react";
import { CreateRepoModal } from "@/components/dashboard/CreateRepoModal";
import { useAuthStore } from "@/store/auth.store";
import { useDashboardStore } from "@/store/dashboard.store";
import { OrgListItem } from "./OrgListItem";
import { RepoListItem } from "./RepoListItem";

export function DashboardSidebar() {
  const { user } = useAuthStore();
  const {
    orgs,
    repos,
    dataLoading,
    selectedOrg,
    selectedRepo,
    selectOrg,
    selectRepo,
  } = useDashboardStore();

  const [createModalOpen, setCreateModalOpen] = useState(false);

  if (!user) return null;

  const filteredRepos = repos.filter((repo) =>
    selectedOrg
      ? repo.owner.login.toLowerCase() === selectedOrg.toLowerCase()
      : repo.owner.login.toLowerCase() === user.login.toLowerCase(),
  );

  return (
    <Box
      w={270}
      style={{
        borderRight: "1px solid #e4e4e7",
        backgroundColor: "#f4f4f5",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <Box
        className="hide-scrollbar"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 10px 10px",
          minHeight: 0,
        }}
      >
        {/* ORGANIZATIONS */}
        <Text
          fz={11}
          fw={700}
          c="#71717a"
          mb={8}
          px="xs"
          style={{ letterSpacing: "0.08em", fontFamily: "monospace" }}
        >
          ORGANIZATIONS
        </Text>

        {dataLoading ? (
          <Stack gap="xs" px="xs" mb="md">
            <Skeleton height={32} radius="sm" />
            <Skeleton height={32} radius="sm" />
          </Stack>
        ) : (
          <Stack gap={2} mb="lg">
            {orgs.length > 0 ? (
              orgs.map((org) => {
                const isSelected = selectedOrg
                  ? selectedOrg.toLowerCase() === org.login.toLowerCase()
                  : org.login.toLowerCase() === user.login.toLowerCase();

                return (
                  <OrgListItem
                    key={org.id}
                    org={org}
                    isSelected={isSelected}
                    onSelect={() => {
                      if (
                        (org as any).isUser ||
                        org.login.toLowerCase() === user.login.toLowerCase()
                      ) {
                        selectOrg(null);
                      } else {
                        selectOrg(org.login);
                      }
                    }}
                  />
                );
              })
            ) : (
              <Text fz={12} c="#a1a1aa" px="xs">
                Không có organization nào.
              </Text>
            )}
          </Stack>
        )}

        {/* REPOSITORIES HEADER */}
        <Group justify="space-between" mb={8} px="xs" align="center">
          <Text
            fz={11}
            fw={700}
            c="#71717a"
            style={{ letterSpacing: "0.08em", fontFamily: "monospace" }}
          >
            {selectedOrg
              ? `REPOS CỦA ${selectedOrg.toUpperCase()}`
              : "REPOS CÁ NHÂN"}
          </Text>
          <Group gap={4} wrap="nowrap">
            {selectedOrg && (
              <Tooltip label="Quay lại cá nhân" withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="gray"
                  onClick={() => selectOrg(null)}
                >
                  <IconArrowLeft size={14} color="#71717a" />
                </ActionIcon>
              </Tooltip>
            )}
            <Tooltip label="Tạo Repository mới" withArrow>
              <ActionIcon
                size="sm"
                variant="subtle"
                color="indigo"
                onClick={() => setCreateModalOpen(true)}
              >
                <IconPlus size={15} color="#4f46e5" />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>

        {/* DANH SÁCH REPO */}
        {dataLoading ? (
          <Stack gap="xs" px="xs">
            <Skeleton height={32} radius="sm" />
            <Skeleton height={32} radius="sm" />
            <Skeleton height={32} radius="sm" />
          </Stack>
        ) : (
          <Stack gap={2}>
            {filteredRepos.length > 0 ? (
              filteredRepos.map((repo) => (
                <RepoListItem
                  key={repo.id}
                  repo={repo}
                  isSelected={selectedRepo?.id === repo.id}
                  onSelect={() => selectRepo(repo)}
                />
              ))
            ) : (
              <Text fz={12} c="#a1a1aa" px="xs">
                Không có repository nào.
              </Text>
            )}
          </Stack>
        )}
      </Box>

      {/* AUTHOR / CREATOR FOOTER */}
      <Box
        p="xs"
        style={{
          borderTop: "1px solid #e4e4e7",
          backgroundColor: "#f4f4f5",
          flexShrink: 0,
        }}
      >
        <Group justify="space-between" align="center" wrap="nowrap">
          <Box style={{ minWidth: 0 }}>
            <Text
              fz={10}
              c="#71717a"
              fw={700}
              style={{ letterSpacing: "0.05em", fontFamily: "monospace" }}
            >
              TÁC GIẢ
            </Text>
            <Text fz={12} fw={600} c="#18181b" truncate>
              Nguyễn Hoàng Nam
            </Text>
          </Box>
          <Group gap={4} wrap="nowrap">
            <Tooltip label="github/hnamhocit" withArrow>
              <ActionIcon
                component="a"
                href="https://github.com/hnamhocit"
                target="_blank"
                rel="noopener noreferrer"
                size="sm"
                variant="subtle"
                color="gray"
              >
                <IconBrandGithub size={15} color="#52525b" />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="facebook/hnamhocit" withArrow>
              <ActionIcon
                component="a"
                href="https://facebook.com/hnamhocit"
                target="_blank"
                rel="noopener noreferrer"
                size="sm"
                variant="subtle"
                color="indigo"
              >
                <IconBrandFacebook size={15} color="#4f46e5" />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </Box>

      <CreateRepoModal
        opened={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </Box>
  );
}
