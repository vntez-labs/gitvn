"use client";

import { Avatar, Badge, Box, Group, Text, UnstyledButton } from "@mantine/core";
import type { GitHubOrg } from "@/interfaces/github";

interface OrgListItemProps {
  org: GitHubOrg;
  isSelected: boolean;
  onSelect: () => void;
}

export function OrgListItem({ org, isSelected, onSelect }: OrgListItemProps) {
  return (
    <UnstyledButton
      onClick={onSelect}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        width: "100%",
        padding: "7px 10px 7px 12px",
        borderRadius: 8,
        backgroundColor: isSelected ? "#ffffff" : "transparent",
        border: "1px solid",
        borderColor: isSelected ? "#e4e4e7" : "transparent",
        boxShadow: isSelected
          ? "0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)"
          : "none",
        transition: "all 0.15s ease",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = "rgba(228, 228, 231, 0.6)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      {/* Sleek inset active indicator pill */}
      {isSelected && (
        <Box
          style={{
            position: "absolute",
            left: 4,
            top: "50%",
            transform: "translateY(-50%)",
            width: 3,
            height: 16,
            backgroundColor: "#dc2626",
            borderRadius: 9999,
          }}
        />
      )}
      <Group
        gap="xs"
        wrap="nowrap"
        style={{ flex: 1, minWidth: 0, paddingLeft: 4 }}
      >
        <Avatar
          src={org.avatar_url}
          size={22}
          radius="xl"
          style={{
            border: isSelected
              ? "1.5px solid #e4e4e7"
              : "1.5px solid transparent",
            flexShrink: 0,
          }}
        />
        <Text
          fz={13}
          fw={isSelected ? 600 : 500}
          c={isSelected ? "#18181b" : "#52525b"}
          truncate
          style={{ flex: 1 }}
        >
          {org.login}
        </Text>
        {(org as any).isUser && (
          <Badge
            size="xs"
            variant="light"
            radius="sm"
            styles={{
              root: {
                textTransform: "none",
                fontSize: 10,
                fontWeight: 600,
                height: 18,
                padding: "0 6px",
                backgroundColor: isSelected
                  ? "rgba(220, 38, 38, 0.08)"
                  : "#e4e4e7",
                color: isSelected ? "#dc2626" : "#71717a",
                flexShrink: 0,
              },
            }}
          >
            You
          </Badge>
        )}
      </Group>
    </UnstyledButton>
  );
}
