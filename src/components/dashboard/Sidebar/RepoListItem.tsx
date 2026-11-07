"use client";

import { Box, Group, Text, Tooltip, UnstyledButton } from "@mantine/core";
import { IconLock, IconStar } from "@tabler/icons-react";
import type { GitHubRepo } from "@/interfaces/github";
import { formatCompactNumber } from "@/lib/time";
import { RepoLangIcon } from "./RepoLangIcon";

interface RepoListItemProps {
  repo: GitHubRepo;
  isSelected: boolean;
  onSelect: () => void;
  showOwner?: boolean;
}

export function RepoListItem({
  repo,
  isSelected,
  onSelect,
  showOwner = false,
}: RepoListItemProps) {
  const starCount = repo.stargazers_count ?? 0;

  return (
    <UnstyledButton
      onClick={onSelect}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        padding: "6px 10px 6px 12px",
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
        gap={8}
        wrap="nowrap"
        style={{ overflow: "hidden", flex: 1, minWidth: 0, paddingLeft: 4 }}
      >
        <Box style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
          <RepoLangIcon repo={repo} />
        </Box>
        <Box style={{ overflow: "hidden", flex: 1, minWidth: 0 }}>
          <Text
            fz={13}
            ff="monospace"
            fw={isSelected ? 600 : 400}
            c={isSelected ? "#18181b" : "#52525b"}
            truncate
            title={repo.name}
          >
            {repo.name}
          </Text>
          {showOwner && repo.owner?.login && (
            <Text
              fz={10}
              c="#71717a"
              truncate
              style={{ lineHeight: 1.2, marginTop: 1 }}
            >
              @{repo.owner.login}
            </Text>
          )}
        </Box>
      </Group>

      <Group gap={6} wrap="nowrap" style={{ flexShrink: 0, marginLeft: 6 }}>
        {repo.private && (
          <Tooltip label="Repository riêng tư (Private)" withArrow>
            <Box
              style={{
                display: "flex",
                alignItems: "center",
                color: "#a1a1aa",
              }}
            >
              <IconLock size={12} stroke={2} />
            </Box>
          </Tooltip>
        )}
        {starCount > 0 && (
          <Group
            gap={3}
            wrap="nowrap"
            px={5}
            py={1.5}
            style={{
              backgroundColor: isSelected
                ? "#f4f4f5"
                : "rgba(228, 228, 231, 0.5)",
              borderRadius: 4,
              border: "1px solid",
              borderColor: isSelected ? "#e4e4e7" : "transparent",
            }}
          >
            <IconStar size={11} color="#eab308" fill="#eab308" stroke={1.5} />
            <Text
              fz={11}
              fw={isSelected ? 600 : 500}
              c={isSelected ? "#3f3f46" : "#71717a"}
              ff="monospace"
            >
              {formatCompactNumber(starCount)}
            </Text>
          </Group>
        )}
      </Group>
    </UnstyledButton>
  );
}
