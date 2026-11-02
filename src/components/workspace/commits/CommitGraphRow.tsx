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
import { formatRelativeTime } from "@/lib/time";

interface CommitGraphRowProps {
  item: any;
  index: number;
  total: number;
  currentBranch: string;
  onSelect: (sha: string) => void;
}

export function CommitGraphRow({
  item,
  index,
  total,
  currentBranch,
  onSelect,
}: CommitGraphRowProps) {
  const commit = item.commit;
  const author = item.author;
  const isHead = index === 0;
  const isLast = index === total - 1;
  const isMerge = (item.parents?.length || 0) >= 2;
  const title = commit?.message?.split("\n")[0] || "Commit không có tiêu đề";
  const shaShort = item.sha?.slice(0, 7);

  // SVG lane dimensions
  const laneWidth = 36;
  const cx = 18;
  const cy = 24;

  return (
    <Box
      onClick={() => onSelect(item.sha)}
      style={{
        display: "flex",
        alignItems: "stretch",
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #f1f5f9",
        cursor: "pointer",
        transition: "background-color 0.12s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "#f8fafc";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "#ffffff";
      }}
    >
      {/* Visual Commit Graph Node Column */}
      <Box
        style={{
          width: laneWidth,
          flexShrink: 0,
          position: "relative",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <svg
          width={laneWidth}
          height="100%"
          style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
        >
          {/* Vertical trunk line from top to node */}
          {!isHead && (
            <line
              x1={cx}
              y1={0}
              x2={cx}
              y2={cy}
              stroke="#cbd5e1"
              strokeWidth={2}
            />
          )}

          {/* Vertical trunk line from node to bottom */}
          {!isLast && (
            <line
              x1={cx}
              y1={cy}
              x2={cx}
              y2="100%"
              stroke="#cbd5e1"
              strokeWidth={2}
            />
          )}

          {/* Branch curve for merge commits */}
          {isMerge && (
            <path
              d={`M ${cx + 10} 0 Q ${cx + 8} ${cy - 4} ${cx} ${cy}`}
              fill="none"
              stroke="#6366f1"
              strokeWidth={2}
              strokeDasharray="3,2"
            />
          )}

          {/* Node Circle */}
          {isHead ? (
            <g>
              {/* Glowing halo for HEAD */}
              <circle cx={cx} cy={cy} r={8.5} fill="rgba(251, 41, 26, 0.16)" />
              <circle
                cx={cx}
                cy={cy}
                r={5}
                fill="#fb291a"
                stroke="#ffffff"
                strokeWidth={2}
              />
            </g>
          ) : isMerge ? (
            <circle
              cx={cx}
              cy={cy}
              r={5}
              fill="#6366f1"
              stroke="#ffffff"
              strokeWidth={2}
            />
          ) : (
            <circle
              cx={cx}
              cy={cy}
              r={4}
              fill="#ffffff"
              stroke="#fb291a"
              strokeWidth={2}
            />
          )}
        </svg>
      </Box>

      {/* Commit Info Column */}
      <Box
        style={{
          flex: 1,
          minWidth: 0,
          padding: "10px 14px 10px 4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Group gap={8} wrap="nowrap" align="center">
            {isHead && (
              <Badge size="xs" color="vntez" variant="filled">
                HEAD
              </Badge>
            )}
            {isHead && (
              <Badge size="xs" color="vntez" variant="outline">
                {currentBranch}
              </Badge>
            )}
            {isMerge && (
              <Badge
                size="xs"
                color="indigo"
                variant="light"
                leftSection={<IconGitMerge size={11} />}
              >
                Merge
              </Badge>
            )}
            <Text fz={13.5} fw={600} c="#0f172a" truncate>
              {title}
            </Text>
          </Group>

          <Group gap={6} mt={3} align="center">
            <Avatar
              src={author?.avatar_url}
              alt={commit?.author?.name}
              size={18}
              radius="xl"
              style={{ border: "1px solid #e2e8f0", flexShrink: 0 }}
            />
            <Text fz={11} c="#64748b">
              <span style={{ color: "#334155", fontWeight: 500 }}>
                {commit?.author?.name || author?.login || "Vô danh"}
              </span>
              {" committed "}
              {formatRelativeTime(commit?.author?.date)}
            </Text>
          </Group>
        </Box>

        {/* SHA Badge and Copy Actions */}
        <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
          <Badge
            size="sm"
            variant="light"
            color="vntez"
            ff="monospace"
            styles={{ root: { cursor: "pointer", fontWeight: 600 } }}
          >
            {shaShort}
          </Badge>

          <CopyButton value={item.sha}>
            {({ copied, copy }) => (
              <Tooltip
                label={copied ? "Đã sao chép SHA" : "Sao chép mã SHA"}
                withArrow
              >
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color={copied ? "teal" : "gray"}
                  onClick={(e) => {
                    e.stopPropagation();
                    copy();
                  }}
                  aria-label="Sao chép SHA"
                >
                  {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                </ActionIcon>
              </Tooltip>
            )}
          </CopyButton>
        </Group>
      </Box>
    </Box>
  );
}
