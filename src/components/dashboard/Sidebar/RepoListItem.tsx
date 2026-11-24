"use client";

import { Box, Group, Text, Tooltip, UnstyledButton } from "@mantine/core";
import {
  IconLock,
  IconLockFilled,
  IconStar,
  IconStarFilled,
} from "@tabler/icons-react";
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
      aria-current={isSelected ? "page" : undefined}
      className="dashboard-repo-item"
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        padding: "6px 10px 6px 12px",
        borderRadius: 8,
        border: "1px solid",
        borderColor: isSelected ? "#fecaca" : "transparent",
        minHeight: 38,
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
            width: 3.5,
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
            fz={14}
            fw={isSelected ? 650 : 500}
            c={isSelected ? "#b91c1c" : "#3f3f46"}
            truncate
            title={repo.name}
          >
            {repo.name}
          </Text>
          {showOwner && repo.owner?.login && (
            <Text
              fz={12}
              c={isSelected ? "#b91c1c" : "#71717a"}
              truncate
              style={{
                lineHeight: 1.2,
                marginTop: 1,
                opacity: isSelected ? 0.8 : 1,
              }}
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
                color: isSelected ? "#dc2626" : "#a1a1aa",
              }}
            >
              {isSelected ? (
                <IconLockFilled size={12} />
              ) : (
                <IconLock size={12} stroke={1.75} />
              )}
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
              backgroundColor: isSelected ? "#fee2e2" : "#f4f4f5",
              borderRadius: 4,
              border: "1px solid",
              borderColor: isSelected ? "#fca5a5" : "#e4e4e7",
            }}
          >
            {isSelected ? (
              <IconStarFilled size={11} color="#eab308" />
            ) : (
              <IconStar size={11} color="#ca8a04" stroke={1.75} />
            )}
            <Text
              fz={12}
              fw={isSelected ? 600 : 500}
              c={isSelected ? "#991b1b" : "#71717a"}
            >
              {formatCompactNumber(starCount)}
            </Text>
          </Group>
        )}
      </Group>
    </UnstyledButton>
  );
}
