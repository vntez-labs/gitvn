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
import { formatRelativeTime } from "@/lib/time";

interface CommitGraphRowProps {
  item: any;
  layout: GitGraphLayoutItem;
  currentBranch: string;
  onSelect: (sha: string) => void;
}

export function CommitGraphRow({
  item,
  layout,
  currentBranch,
  onSelect,
}: CommitGraphRowProps) {
  const commit = item.commit;
  const author = item.author;
  const title = commit?.message?.split("\n")[0] || "Commit không có tiêu đề";
  const shaShort = item.sha?.slice(0, 7);

  // SVG lane dimensions (GitLens / GitKraken style)
  const laneWidth = 52;
  const x0 = 16; // Trunk Lane (Main)
  const x1 = 36; // Branch Lane (Feature / PR)
  const cy = 24; // Center Y of node in row

  const nodeCx = layout.lane === 0 ? x0 : x1;

  return (
    <Box
      onClick={() => onSelect(item.sha)}
      style={{
        display: "flex",
        alignItems: "stretch",
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #f1ede6",
        cursor: "pointer",
        transition: "background-color 0.12s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "#f5f3ee";
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
          {/* Trunk line (Lane 0) */}
          {layout.trunkIn && (
            <line
              x1={x0}
              y1={0}
              x2={x0}
              y2={layout.lane === 0 ? cy : "100%"}
              stroke="#cbd5e1"
              strokeWidth={2}
            />
          )}
          {layout.trunkOut && (
            <line
              x1={x0}
              y1={layout.lane === 0 ? cy : 0}
              x2={x0}
              y2="100%"
              stroke="#cbd5e1"
              strokeWidth={2}
            />
          )}

          {/* Branch line (Lane 1) */}
          {layout.branchIn && (
            <line
              x1={x1}
              y1={0}
              x2={x1}
              y2={layout.lane === 1 ? cy : "100%"}
              stroke="#8b5cf6"
              strokeWidth={2}
            />
          )}
          {layout.branchOut && (
            <line
              x1={x1}
              y1={cy}
              x2={x1}
              y2="100%"
              stroke="#8b5cf6"
              strokeWidth={2}
            />
          )}

          {/* Smooth Merge Curve: từ Lane 1 phía dưới nhập vào node ở Lane 0 */}
          {layout.mergeFromBranch && (
            <path
              d={`M ${x1} 64 C ${x1} ${cy + 10}, ${x0 + 8} ${cy}, ${x0} ${cy}`}
              fill="none"
              stroke="#8b5cf6"
              strokeWidth={2}
            />
          )}

          {/* Smooth Fork Curve: từ node ở Lane 1 tẽ về Trunk Lane 0 phía dưới */}
          {layout.forkToBranch && (
            <path
              d={`M ${x1} ${cy} C ${x1} ${cy + 12}, ${x0 + 8} 64, ${x0} 64`}
              fill="none"
              stroke="#8b5cf6"
              strokeWidth={2}
            />
          )}

          {/* Node Circle */}
          {layout.isHead ? (
            <g>
              {/* Glowing halo for HEAD */}
              <circle
                cx={nodeCx}
                cy={cy}
                r={8.5}
                fill="rgba(251, 41, 26, 0.16)"
              />
              <circle
                cx={nodeCx}
                cy={cy}
                r={5}
                fill="#fb291a"
                stroke="#ffffff"
                strokeWidth={2}
              />
            </g>
          ) : layout.isMerge ? (
            <circle
              cx={nodeCx}
              cy={cy}
              r={5}
              fill="#6366f1"
              stroke="#ffffff"
              strokeWidth={2}
            />
          ) : layout.lane === 1 ? (
            <circle
              cx={nodeCx}
              cy={cy}
              r={4.5}
              fill="#8b5cf6"
              stroke="#ffffff"
              strokeWidth={2}
            />
          ) : (
            <circle
              cx={nodeCx}
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
            {layout.isHead && (
              <Badge size="xs" color="vntez" variant="filled">
                HEAD
              </Badge>
            )}
            {layout.isHead && (
              <Badge size="xs" color="vntez" variant="outline">
                {currentBranch}
              </Badge>
            )}
            {layout.isMerge && (
              <Badge
                size="xs"
                color="indigo"
                variant="light"
                leftSection={<IconGitMerge size={11} />}
              >
                Merge
              </Badge>
            )}
            <Text fz={13.5} fw={600} c="#1f1c19" truncate>
              {title}
            </Text>
          </Group>

          <Group gap={6} mt={3} align="center">
            <Avatar
              src={author?.avatar_url}
              alt={commit?.author?.name}
              size={18}
              radius="xl"
              style={{ border: "1px solid #e8e5de", flexShrink: 0 }}
            />
            <Text fz={11} c="#6e675f">
              <span style={{ color: "#1f1c19", fontWeight: 500 }}>
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
