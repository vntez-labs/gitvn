"use client";

import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  CopyButton,
  Group,
  Text,
  Tooltip,
} from "@mantine/core";
import {
  IconCheck,
  IconCopy,
  IconGitCommit,
  IconGitMerge,
} from "@tabler/icons-react";
import type { GitGraphLayoutItem } from "@/lib/git-graph-layout";
import { getGitHubAvatarUrl } from "@/lib/avatar";
import { formatRelativeTime } from "@/lib/time";
import { CommitGraphSvg } from "./CommitGraphSvg";

interface CommitGraphRowProps {
  item: any;
  layout: GitGraphLayoutItem;
  currentBranch: string;
  onSelect: (sha: string) => void;
}

const LANE_STEP = 18;
const getX = (lane: number) => 16 + lane * LANE_STEP;
const cy = 24;
const ROW_HEIGHT = 48;

export function CommitGraphRow({
  item,
  layout,
  onSelect,
}: CommitGraphRowProps) {
  const commit = item.commit;
  const author = item.author;
  const title = commit?.message?.split("\n")[0] || "Commit không có tiêu đề";
  const shaShort = item.sha?.slice(0, 7);

  const nodeCx = getX(layout.lane);
  const laneWidth = Math.max(52, 16 + (layout.maxLane + 1) * LANE_STEP + 8);

  return (
    <Box
      onClick={() => onSelect(item.sha)}
      style={{
        display: "flex",
        alignItems: "center",
        height: ROW_HEIGHT,
        minHeight: ROW_HEIGHT,
        maxHeight: ROW_HEIGHT,
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #f1ede6",
        cursor: "pointer",
        transition: "background-color 0.12s ease",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "#f5f3ee";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "#ffffff";
      }}
    >
      {/* Cột Git DAG Graph SVG */}
      <CommitGraphSvg
        layout={layout}
        nodeCx={nodeCx}
        laneWidth={laneWidth}
        rowHeight={ROW_HEIGHT}
        cy={cy}
        getX={getX}
      />

      {/* Thông tin commit & Tác giả */}
      <Box
        px="sm"
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Group gap={6} wrap="nowrap" align="center">
            {layout.isHead && (
              <Badge
                size="xs"
                variant="filled"
                color="red"
                radius="sm"
                style={{ fontSize: 10, height: 18, padding: "0 6px" }}
              >
                HEAD
              </Badge>
            )}

            {layout.isMerge && (
              <Badge
                size="xs"
                variant="light"
                color="violet"
                radius="sm"
                leftSection={<IconGitMerge size={10} />}
                style={{ fontSize: 10, height: 18, padding: "0 6px" }}
              >
                MERGE
              </Badge>
            )}

            <Text
              fz="xs"
              fw={600}
              c="#1f1c19"
              truncate
              title={title}
              style={{ flex: 1 }}
            >
              {title}
            </Text>
          </Group>

          <Group gap={6} mt={2} align="center">
            <Avatar
              src={getGitHubAvatarUrl(
                author || {
                  login: commit?.author?.name,
                  avatar_url: author?.avatar_url,
                },
                32,
              )}
              alt={commit?.author?.name}
              size={15}
              radius="xl"
            />
            <Text fz={11} c="#6e675f">
              <span style={{ fontWeight: 600, color: "#1f1c19" }}>
                {commit?.author?.name || author?.login || "Vô danh"}
              </span>{" "}
              committed {formatRelativeTime(commit?.author?.date)}
            </Text>
          </Group>
        </Box>

        {/* SHA & Nút copy */}
        <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
          <CopyButton value={item.sha}>
            {({ copied, copy }) => (
              <Tooltip
                label={copied ? "Đã sao chép SHA" : "Sao chép SHA"}
                withArrow
                position="top"
              >
                <Badge
                  variant="outline"
                  color={copied ? "teal" : "gray"}
                  size="sm"
                  radius="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    copy();
                  }}
                  leftSection={
                    copied ? <IconCheck size={10} /> : <IconCopy size={10} />
                  }
                  style={{
                    cursor: "pointer",
                    fontFamily: "monospace",
                    borderColor: "#e5e1da",
                    color: copied ? "#0d9488" : "#6e675f",
                    backgroundColor: "#faf8f6",
                    fontSize: 11,
                  }}
                >
                  {shaShort}
                </Badge>
              </Tooltip>
            )}
          </CopyButton>

          <Tooltip label="Xem chi tiết commit" withArrow position="top">
            <ActionIcon
              size="sm"
              variant="subtle"
              color="gray"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(item.sha);
              }}
              style={{ color: "#8c827a" }}
            >
              <IconGitCommit size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Box>
    </Box>
  );
}
