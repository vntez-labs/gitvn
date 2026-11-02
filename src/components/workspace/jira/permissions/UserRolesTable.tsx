"use client";

import {
  ActionIcon,
  Avatar,
  Badge,
  Group,
  Paper,
  Select,
  Table,
  Text,
  Tooltip,
} from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import type { ProjectRole } from "@/interfaces/jira";
import { getGitHubAvatarUrl } from "@/lib/avatar";

interface UserRolesTableProps {
  usersList: [string, ProjectRole][];
  repoOwner: string;
  currentUserLogin: string;
  canEdit: boolean;
  roleOptions: { value: string; label: string }[];
  roleLabels: Record<
    ProjectRole,
    { label: string; desc: string; color: string }
  >;
  onRoleChange: (username: string, role: ProjectRole) => void;
  onRemoveUser: (username: string) => void;
}

export function UserRolesTable({
  usersList,
  repoOwner,
  currentUserLogin,
  canEdit,
  roleOptions,
  roleLabels,
  onRoleChange,
  onRemoveUser,
}: UserRolesTableProps) {
  return (
    <Paper
      p={0}
      bg="#ffffff"
      radius="md"
      style={{ border: "1px solid #e8e5de", overflow: "hidden" }}
    >
      <Table horizontalSpacing="md" verticalSpacing="xs">
        <Table.Thead
          style={{
            backgroundColor: "#f5f3ee",
            borderBottom: "1px solid #e8e5de",
          }}
        >
          <Table.Tr>
            <Table.Th style={{ color: "#6e675f", fontSize: 11 }}>
              THÀNH VIÊN
            </Table.Th>
            <Table.Th style={{ color: "#6e675f", fontSize: 11 }}>
              VAI TRÒ
            </Table.Th>
            <Table.Th style={{ width: 50 }} />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {usersList.map(([username, role]) => {
            const isOwner = username.toLowerCase() === repoOwner.toLowerCase();
            const isCurrent =
              username.toLowerCase() === currentUserLogin.toLowerCase();
            const meta = roleLabels[role] || roleLabels.member;

            return (
              <Table.Tr
                key={username}
                style={{ borderBottom: "1px solid #f1ede6" }}
              >
                <Table.Td>
                  <Group gap={8} wrap="nowrap">
                    <Avatar
                      src={getGitHubAvatarUrl(username, 36)}
                      size={24}
                      radius="xl"
                    />
                    <Text
                      fz={13}
                      fw={600}
                      c="#1f1c19"
                      ff="var(--font-geist-mono), monospace"
                    >
                      @{username}
                    </Text>
                    {isOwner && (
                      <Badge size="xs" color="teal" variant="light">
                        Owner
                      </Badge>
                    )}
                    {isCurrent && (
                      <Badge size="xs" color="vntez" variant="outline">
                        Bạn
                      </Badge>
                    )}
                  </Group>
                </Table.Td>

                <Table.Td>
                  {canEdit && !isOwner ? (
                    <Select
                      size="xs"
                      data={roleOptions}
                      value={role}
                      onChange={(val) =>
                        onRoleChange(username, val as ProjectRole)
                      }
                      style={{ width: 170 }}
                      styles={{
                        input: {
                          backgroundColor: "#ffffff",
                          borderColor: "#e5e1da",
                          color: "#1f1c19",
                        },
                      }}
                    />
                  ) : (
                    <Badge size="sm" color={meta.color} variant="light">
                      {meta.label}
                    </Badge>
                  )}
                </Table.Td>

                <Table.Td>
                  {canEdit && !isOwner && (
                    <Tooltip label="Gỡ quyền thành viên" withArrow>
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        color="red"
                        onClick={() => onRemoveUser(username)}
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Paper>
  );
}
