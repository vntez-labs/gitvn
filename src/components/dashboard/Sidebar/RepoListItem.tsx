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
        backgroundColor: isSelected
          ? "rgba(255, 255, 255, 0.1)"
          : "transparent",
        border: isSelected
          ? "1px solid rgba(255, 255, 255, 0.12)"
          : "1px solid transparent",
        transition: "all 0.15s ease",
        width: "100%",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.06)";
        }
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
          fw={isSelected ? 600 : 400}
          c={isSelected ? "#ffffff" : "#e4e4e7"}
          truncate
        >
          {repo.name}
        </Text>
      </Group>

      <Group gap={6} wrap="nowrap" style={{ flexShrink: 0 }}>
        {repo.private && (
          <Tooltip label="Private repo" withArrow>
            <Box style={{ display: "flex", alignItems: "center" }}>
              <IconLock size={13} color="#71717a" />
            </Box>
          </Tooltip>
        )}
        {starCount > 0 && (
          <Group gap={2} wrap="nowrap">
            <IconStar size={11} color="#eab308" fill="#eab308" />
            <Text fz={11} c="#a1a1aa" ff="monospace">
              {formatCompactNumber(starCount)}
            </Text>
          </Group>
        )}
      </Group>
    </UnstyledButton>
  );
}
