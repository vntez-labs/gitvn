export interface GitGraphLayoutItem {
  lane: 0 | 1;
  isHead: boolean;
  isLast: boolean;
  isMerge: boolean;
  trunkIn: boolean;
  trunkOut: boolean;
  branchIn: boolean;
  branchOut: boolean;
  mergeFromBranch: boolean;
  forkToBranch: boolean;
}

export function computeGitGraphLayout(commits: any[]): GitGraphLayoutItem[] {
  const total = commits.length;
  const layout: GitGraphLayoutItem[] = [];

  let activeBranchDepth = 0;

  for (let i = 0; i < total; i++) {
    const item = commits[i];
    const isHead = i === 0;
    const isLast = i === total - 1;
    const msg = (item.commit?.message || "").trim();
    const isMerge =
      (item.parents?.length || 0) >= 2 ||
      msg.startsWith("Merge ") ||
      msg.startsWith("Merge pull request");

    let lane: 0 | 1 = 0;
    let mergeFromBranch = false;
    let forkToBranch = false;
    let branchIn = false;
    let branchOut = false;

    if (isMerge) {
      lane = 0;
      mergeFromBranch = !isLast;
      activeBranchDepth = 2; // 2 commit tiếp theo sau merge là thuộc nhánh phụ
    } else if (activeBranchDepth > 0) {
      lane = 1;
      branchIn = true;
      activeBranchDepth--;
      if (activeBranchDepth === 0 || i === total - 1) {
        forkToBranch = true;
      } else {
        branchOut = true;
      }
    } else {
      lane = 0;
    }

    const trunkIn = !isHead;
    const trunkOut = !isLast;

    layout.push({
      lane,
      isHead,
      isLast,
      isMerge,
      trunkIn,
      trunkOut,
      branchIn,
      branchOut,
      mergeFromBranch,
      forkToBranch,
    });
  }

  return layout;
}
