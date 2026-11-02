export interface GitGraphLaneSlot {
  lane: number;
  color: string;
}

export interface GitGraphLayoutItem {
  sha: string;
  lane: number;
  color: string;
  isHead: boolean;
  isMerge: boolean;
  hadLaneIn: boolean;
  hasLaneOut: boolean;
  lanesIn: GitGraphLaneSlot[];
  lanesOut: GitGraphLaneSlot[];
  mergeToLanes: GitGraphLaneSlot[];
  forkFromLanes: GitGraphLaneSlot[];
  maxLane: number;
}

export const GIT_LANE_COLORS = [
  "#0284c7", // Sky Blue (Trunk / Main)
  "#8b5cf6", // Purple (Feature / PR)
  "#10b981", // Emerald Green
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#6366f1", // Indigo
  "#14b8a6", // Teal
  "#f97316", // Orange
];

interface LaneState {
  sha: string;
  colorIdx: number;
}

/**
 * Thuật toán tính toán DAG multi-lane Git Graph chuẩn xác (tương tự GitLens / GitKraken).
 * Phân bổ làn (lane) tự động dựa trên parent SHAs, phát hiện nhánh rẽ (fork) và nhánh gộp (merge).
 */
export function computeGitGraphLayout(commits: any[]): GitGraphLayoutItem[] {
  const total = commits.length;
  if (total === 0) return [];

  const activeLanes: (LaneState | null)[] = [];
  const layout: GitGraphLayoutItem[] = [];

  for (let i = 0; i < total; i++) {
    const item = commits[i];
    const sha = item.sha;
    const isHead = i === 0;

    // Lấy danh sách parent SHAs
    const rawParents = item.parents || [];
    const parentShas: string[] = rawParents.map((p: any) =>
      typeof p === "string" ? p : p.sha,
    );

    const isMerge =
      parentShas.length >= 2 ||
      (item.commit?.message || "").startsWith("Merge ");

    // 1. Tìm lane hiện tại cho commit này
    let lane = -1;
    let colorIdx = 0;

    for (let idx = 0; idx < activeLanes.length; idx++) {
      const slot = activeLanes[idx];
      if (slot && slot.sha === sha) {
        lane = idx;
        colorIdx = slot.colorIdx;
        break;
      }
    }

    const hadLaneIn = lane !== -1;

    // Nếu commit chưa có lane chờ sẵn (ví dụ HEAD hoặc commit độc lập)
    if (lane === -1) {
      colorIdx =
        layout.length === 0 ? 0 : activeLanes.length % GIT_LANE_COLORS.length;
      const freeIdx = activeLanes.indexOf(null);
      if (freeIdx !== -1) {
        lane = freeIdx;
        activeLanes[lane] = { sha, colorIdx };
      } else {
        lane = activeLanes.length;
        activeLanes.push({ sha, colorIdx });
      }
    }

    // Các lane đang chạy qua từ hàng trên (ngoại trừ lane của commit này)
    const lanesIn: GitGraphLaneSlot[] = [];
    for (let idx = 0; idx < activeLanes.length; idx++) {
      const slot = activeLanes[idx];
      if (slot && idx !== lane) {
        lanesIn.push({
          lane: idx,
          color: GIT_LANE_COLORS[slot.colorIdx % GIT_LANE_COLORS.length],
        });
      }
    }

    // Kiểm tra các nhánh khác cũng đang trỏ về commit này (điểm hợp dòng / fork)
    const forkFromLanes: GitGraphLaneSlot[] = [];
    for (let idx = 0; idx < activeLanes.length; idx++) {
      if (idx !== lane) {
        const slot = activeLanes[idx];
        if (slot && slot.sha === sha) {
          forkFromLanes.push({
            lane: idx,
            color: GIT_LANE_COLORS[slot.colorIdx % GIT_LANE_COLORS.length],
          });
          activeLanes[idx] = null; // Đóng nhánh này lại
        }
      }
    }

    // 2. Cập nhật parent chính (tiếp tục đi xuống trên cùng lane)
    if (parentShas.length > 0) {
      activeLanes[lane] = { sha: parentShas[0], colorIdx };
    } else {
      activeLanes[lane] = null;
    }

    // 3. Phân bổ lane cho các parent phụ (nhánh được merge vào)
    const mergeToLanes: GitGraphLaneSlot[] = [];
    for (let pIdx = 1; pIdx < parentShas.length; pIdx++) {
      const pSha = parentShas[pIdx];

      // Xem parent phụ đã có lane chờ sẵn chưa
      let existingLane = -1;
      for (let idx = 0; idx < activeLanes.length; idx++) {
        const slot = activeLanes[idx];
        if (slot && slot.sha === pSha) {
          existingLane = idx;
          break;
        }
      }

      if (existingLane !== -1) {
        const slot = activeLanes[existingLane]!;
        mergeToLanes.push({
          lane: existingLane,
          color: GIT_LANE_COLORS[slot.colorIdx % GIT_LANE_COLORS.length],
        });
      } else {
        // Cấp lane mới cho nhánh được merge
        const newColorIdx = (colorIdx + 1) % GIT_LANE_COLORS.length;
        const freeIdx = activeLanes.indexOf(null);
        let targetLane = -1;
        if (freeIdx !== -1) {
          targetLane = freeIdx;
          activeLanes[targetLane] = { sha: pSha, colorIdx: newColorIdx };
        } else {
          targetLane = activeLanes.length;
          activeLanes.push({ sha: pSha, colorIdx: newColorIdx });
        }
        mergeToLanes.push({
          lane: targetLane,
          color: GIT_LANE_COLORS[newColorIdx % GIT_LANE_COLORS.length],
        });
      }
    }

    // Dọn các ô null ở đuôi mảng
    while (
      activeLanes.length > 0 &&
      activeLanes[activeLanes.length - 1] === null
    ) {
      activeLanes.pop();
    }

    const hasLaneOut = lane < activeLanes.length && activeLanes[lane] !== null;

    // Các lane tiếp tục chạy xuống hàng dưới (ngoại trừ lane của commit này)
    const lanesOut: GitGraphLaneSlot[] = [];
    for (let idx = 0; idx < activeLanes.length; idx++) {
      const slot = activeLanes[idx];
      if (slot && idx !== lane) {
        lanesOut.push({
          lane: idx,
          color: GIT_LANE_COLORS[slot.colorIdx % GIT_LANE_COLORS.length],
        });
      }
    }

    // Tính max lane để định dạng chiều rộng SVG
    const allLanes = [
      lane,
      ...lanesIn.map((l) => l.lane),
      ...lanesOut.map((l) => l.lane),
      ...mergeToLanes.map((l) => l.lane),
      ...forkFromLanes.map((l) => l.lane),
    ];
    const maxLane = Math.max(0, ...allLanes);

    layout.push({
      sha,
      lane,
      color: GIT_LANE_COLORS[colorIdx % GIT_LANE_COLORS.length],
      isHead,
      isMerge,
      hadLaneIn,
      hasLaneOut,
      lanesIn,
      lanesOut,
      mergeToLanes,
      forkFromLanes,
      maxLane,
    });
  }

  return layout;
}
