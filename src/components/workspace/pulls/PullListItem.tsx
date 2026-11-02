"use client";

import { Box, Group, Text } from "@mantine/core";
import {
  IconGitMerge,
  IconGitPullRequest,
  IconMessageCircle,
} from "@tabler/icons-react";

interface PullListItemProps {
  pr: any;
  onClick: () => void;
}

export function PullListItem({ pr, onClick }: PullListItemProps) {
  const isMerged = !!pr.merged_at;
  const isOpen = pr.state === "open";

  return (
    <Box
      p="sm"
      onClick={onClick}
      style={{
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #e8e5de",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        cursor: "pointer",
        transition: "background-color 0.12s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f5f3ee")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
    >
      <Box mt={2}>
        {isMerged ? (
          <IconGitMerge size={16} color="#7c3aed" />
        ) : isOpen ? (
          <IconGitPullRequest size={16} color="#16a34a" />
        ) : (
          <IconGitPullRequest size={16} color="#dc2626" />
        )}
      </Box>

      <Box style={{ flex: 1, minWidth: 0 }}>
        <Text fz="sm" fw={600} c="#1f1c19">
          {pr.title}
        </Text>

        <Text fz={11} c="#6e675f" mt={4}>
          #{pr.number} mở bởi{" "}
          <span style={{ color: "#1f1c19", fontWeight: 500 }}>
            {pr.user?.login}
          </span>{" "}
          • {new Date(pr.created_at).toLocaleDateString()}
        </Text>
      </Box>

      {pr.comments > 0 && (
        <Group gap={4} c="#6e675f">
          <IconMessageCircle size={14} />
          <Text fz={11}>{pr.comments}</Text>
        </Group>
      )}
    </Box>
  );
}
