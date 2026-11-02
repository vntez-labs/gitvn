"use client";

import { Avatar, Box, Group, Text, UnstyledButton } from "@mantine/core";
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
        padding: "6px 10px 6px 12px",
        borderRadius: 6,
        backgroundColor: isSelected ? "#ffffff" : "transparent",
        border: isSelected ? "1px solid #e8e5de" : "1px solid transparent",
        boxShadow: isSelected ? "0 1px 2px rgba(31, 28, 25, 0.05)" : "none",
        transition: "all 0.15s ease",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = "#eae5dc";
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      {/* Inset vertical accent indicator */}
      {isSelected && (
        <Box
          style={{
            position: "absolute",
            left: 0,
            top: 6,
            bottom: 6,
            width: 3,
            backgroundColor: "#fb291a",
            borderRadius: "0 3px 3px 0",
          }}
        />
      )}
      <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
        <Avatar src={org.avatar_url} size={22} radius="xl" />
        <Text
          fz={13}
          fw={isSelected ? 600 : 500}
          c={isSelected ? "#0f172a" : "#334155"}
          truncate
          style={{ flex: 1 }}
        >
          {org.login}
        </Text>
        {(org as any).isUser && (
          <Text fz={10} c="#94a3b8" fw={500} style={{ flexShrink: 0 }}>
            You
          </Text>
        )}
      </Group>
    </UnstyledButton>
  );
}
