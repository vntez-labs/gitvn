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
}

export function RepoListItem({
  repo,
  isSelected,
  onSelect,
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
        padding: "6px 10px 6px 12px",
        borderRadius: 6,
        backgroundColor: isSelected ? "#ffffff" : "transparent",
        border: isSelected ? "1px solid #e8e5de" : "1px solid transparent",
        boxShadow: isSelected ? "0 1px 2px rgba(31, 28, 25, 0.05)" : "none",
        transition: "all 0.15s ease",
        width: "100%",
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
      <Group
        gap={8}
        wrap="nowrap"
        style={{ overflow: "hidden", flex: 1, minWidth: 0 }}
      >
        <RepoLangIcon repo={repo} />
        <Text
          fz={13}
          ff="monospace"
          fw={isSelected ? 600 : 500}
          c={isSelected ? "#0f172a" : "#334155"}
          truncate
        >
          {repo.name}
        </Text>
      </Group>

      <Group gap={6} wrap="nowrap" style={{ flexShrink: 0 }}>
        {repo.private && (
          <Tooltip label="Private repo" withArrow>
            <Box style={{ display: "flex", alignItems: "center" }}>
              <IconLock size={13} color="#94a3b8" />
            </Box>
          </Tooltip>
        )}

        {starCount > 0 && (
          <Group gap={3} wrap="nowrap">
            <IconStar size={12} color="#ca8a04" fill="#ca8a04" />
            <Text fz={11} c="#64748b" ff="monospace" fw={600}>
              {formatCompactNumber(starCount)}
            </Text>
          </Group>
        )}
      </Group>
    </UnstyledButton>
  );
}
