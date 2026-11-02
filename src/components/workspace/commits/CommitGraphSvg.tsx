"use client";

import { Box } from "@mantine/core";
import type { GitGraphLayoutItem } from "@/lib/git-graph-layout";

interface CommitGraphSvgProps {
  layout: GitGraphLayoutItem;
  nodeCx: number;
  laneWidth: number;
  rowHeight: number;
  cy: number;
  getX: (lane: number) => number;
}

export function CommitGraphSvg({
  layout,
  nodeCx,
  laneWidth,
  rowHeight,
  cy,
  getX,
}: CommitGraphSvgProps) {
  return (
    <Box
      style={{
        width: laneWidth,
        height: rowHeight,
        flexShrink: 0,
        position: "relative",
      }}
    >
      <svg
        width={laneWidth}
        height={rowHeight}
        style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
      >
        {/* Các lane chạy xuyên qua từ hàng trên xuống hàng dưới */}
        {layout.lanesIn.map((slot) => {
          const hasOut = layout.lanesOut.some((o) => o.lane === slot.lane);
          if (!hasOut) return null;
          const x = getX(slot.lane);
          return (
            <line
              key={`pass-${slot.lane}`}
              x1={x}
              y1={0}
              x2={x}
              y2={rowHeight}
              stroke={slot.color}
              strokeWidth={2}
            />
          );
        })}

        {/* Đường vào node commit hiện tại từ hàng trên */}
        {layout.hadLaneIn && (
          <line
            x1={nodeCx}
            y1={0}
            x2={nodeCx}
            y2={cy}
            stroke={layout.color}
            strokeWidth={2}
          />
        )}

        {/* Đường ra từ node commit hiện tại xuống hàng dưới */}
        {layout.hasLaneOut && (
          <line
            x1={nodeCx}
            y1={cy}
            x2={nodeCx}
            y2={rowHeight}
            stroke={layout.color}
            strokeWidth={2}
          />
        )}

        {/* Đường cong Merge từ commit hiện tại tỏa xuống nhánh phụ */}
        {layout.mergeToLanes.map((slot) => {
          const targetX = getX(slot.lane);
          return (
            <path
              key={`merge-${slot.lane}`}
              d={`M ${nodeCx} ${cy} C ${nodeCx} ${cy + 14}, ${targetX} ${cy + 6}, ${targetX} ${rowHeight}`}
              fill="none"
              stroke={slot.color}
              strokeWidth={2}
            />
          );
        })}

        {/* Đường cong Fork từ nhánh phụ ở trên rẽ nhập vào node hiện tại */}
        {layout.forkFromLanes.map((slot) => {
          const sourceX = getX(slot.lane);
          return (
            <path
              key={`fork-${slot.lane}`}
              d={`M ${sourceX} 0 C ${sourceX} ${cy - 12}, ${nodeCx} ${cy - 6}, ${nodeCx} ${cy}`}
              fill="none"
              stroke={slot.color}
              strokeWidth={2}
            />
          );
        })}

        {/* Điểm nút Commit (Node) */}
        {layout.isHead ? (
          <g>
            <circle cx={nodeCx} cy={cy} r={8} fill="rgba(251, 41, 26, 0.16)" />
            <circle
              cx={nodeCx}
              cy={cy}
              r={4.5}
              fill="#fb291a"
              stroke="#ffffff"
              strokeWidth={2}
            />
          </g>
        ) : layout.isMerge ? (
          <g>
            <circle
              cx={nodeCx}
              cy={cy}
              r={5.5}
              fill="#ffffff"
              stroke={layout.color}
              strokeWidth={2.5}
            />
            <circle cx={nodeCx} cy={cy} r={2} fill={layout.color} />
          </g>
        ) : (
          <circle
            cx={nodeCx}
            cy={cy}
            r={4.5}
            fill={layout.color}
            stroke="#ffffff"
            strokeWidth={1.5}
          />
        )}
      </svg>
    </Box>
  );
}
