import axios from "axios";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { TreeNode } from "@/components/FileTree";
import type { GitHubOrg, GitHubRepo } from "@/interfaces/github";
import { getDocumentFormat } from "@/lib/document-format";

interface DashboardState {
  repos: GitHubRepo[];
  orgs: GitHubOrg[];
  invitations: any[];
  dataLoading: boolean;

  selectedOrg: string | null;
  selectedRepo: GitHubRepo | null;
  currentBranch: string; // <-- THÊM ĐÂY

  tree: TreeNode[];
  loadingTree: boolean;
  treeError: string | null;
  activeFile: string | null;
  fileContent: string;
  fileSha: string | null;
  loadingContent: boolean;
  contentError: string | null;

  fetchInitialData: (forceRefresh?: boolean) => Promise<void>;
  acceptInvitation: (invitationId: number) => Promise<boolean>;
  selectOrg: (org: string | null) => void;
  selectRepo: (
    repo: GitHubRepo | null,
    targetFile?: string | null,
    targetBranch?: string | null,
  ) => Promise<void>;
  addRepo: (repo: GitHubRepo) => void;
  changeBranch: (branch: string) => Promise<void>; // <-- THÊM ACTION ĐỔI BRANCH
  selectFile: (path: string, branch?: string) => Promise<void>;
  resetWorkspace: () => void;
}

let treeRequest = 0;
let contentRequest = 0;

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      repos: [],
      orgs: [],
      invitations: [],
      dataLoading: true,
      selectedOrg: null,
      selectedRepo: null,
      currentBranch: "main",
      tree: [],
      loadingTree: false,
      treeError: null,
      activeFile: null,
      fileContent: "",
      fileSha: null,
      loadingContent: false,
      contentError: null,

      fetchInitialData: async (forceRefresh = false) => {
        set({ dataLoading: true });
        try {
          const url = forceRefresh
            ? "/api/user/data?refresh=true"
            : "/api/user/data";
          const { data } = await axios.get(url);
          set({
            repos: data.repos || [],
            orgs: data.orgs || [],
            invitations: data.invitations || [],
            dataLoading: false,
          });
        } catch (error) {
          console.error("Lỗi lấy dữ liệu:", error);
          set({ dataLoading: false });
        }
      },

      acceptInvitation: async (invitationId: number) => {
        try {
          await axios.patch("/api/github/invitations", { invitationId });
          await get().fetchInitialData();
          return true;
        } catch (error) {
          console.error("Lỗi chấp nhận lời mời repo:", error);
          return false;
        }
      },

      selectOrg: (org) => {
        treeRequest++;
        contentRequest++;
        set({
          selectedOrg: org,
          selectedRepo: null,
          tree: [],
          activeFile: null,
          fileContent: "",
          fileSha: null,
          loadingTree: false,
          treeError: null,
          loadingContent: false,
          contentError: null,
        });
      },

      selectRepo: async (repo, targetFile = null, targetBranch = null) => {
        if (!repo) {
          get().resetWorkspace();
          return;
        }

        const request = ++treeRequest;
        contentRequest++;
        const branch = targetBranch || repo.default_branch || "main";
        set({
          selectedRepo: repo,
          currentBranch: branch,
          loadingTree: true,
          treeError: null,
          tree: [],
          activeFile: targetFile,
          fileContent: "",
          fileSha: null,
          loadingContent: false,
          contentError: null,
        });

        try {
          const { data } = await axios.get(
            `/api/github/tree?owner=${repo.owner.login}&repo=${repo.name}&branch=${encodeURIComponent(branch)}`,
          );
          if (request !== treeRequest) return;
          const treeData: TreeNode[] = data.tree || [];
          set({ tree: treeData, loadingTree: false });

          // Kiểm tra nếu file trước đó vẫn tồn tại trong branch mới
          if (
            targetFile &&
            treeData.some((f) => f.type === "blob" && f.path === targetFile)
          ) {
            await get().selectFile(targetFile, branch);
            return;
          }

          // Fallback mở file README.md
          const readme = treeData.find(
            (f) => f.type === "blob" && f.path.toLowerCase() === "readme.md",
          );
          if (readme) {
            await get().selectFile(readme.path, branch);
          } else {
            set({ activeFile: null, fileContent: "", fileSha: null });
          }
        } catch (error) {
          if (request !== treeRequest) return;
          console.error("Lỗi lấy tree:", error);
          set({
            loadingTree: false,
            treeError: axios.isAxiosError<{ error?: string }>(error)
              ? error.response?.data?.error || "Không thể tải danh sách file."
              : "Không thể tải danh sách file.",
          });
        }
      },

      addRepo: (repo) => {
        treeRequest++;
        contentRequest++;
        set((state) => ({
          repos: [repo, ...state.repos.filter((r) => r.id !== repo.id)],
          selectedRepo: repo,
          currentBranch: repo.default_branch || "main",
          tree: [],
          activeFile: null,
          fileContent: "",
          fileSha: null,
          loadingTree: false,
          treeError: null,
          loadingContent: false,
          contentError: null,
        }));
      },

      // ACTION ĐỔI BRANCH: Tải lại toàn bộ Tree & File Content theo Branch mới
      changeBranch: async (newBranch: string) => {
        const repo = get().selectedRepo;
        if (!repo) return;

        const currentActiveFile = get().activeFile;
        await get().selectRepo(repo, currentActiveFile, newBranch);
      },

      selectFile: async (path, customBranch) => {
        const repo = get().selectedRepo;
        if (!repo) return;

        const branch = customBranch || get().currentBranch;
        const request = ++contentRequest;
        const format = getDocumentFormat(path);
        set({
          activeFile: path,
          fileContent: "",
          fileSha: null,
          loadingContent: !format,
          contentError: null,
        });
        if (format) return;

        const isCurrent = () => {
          const state = get();
          return (
            request === contentRequest &&
            state.selectedRepo?.id === repo.id &&
            state.currentBranch === branch &&
            state.activeFile === path
          );
        };

        try {
          const { data } = await axios.get(
            `/api/github/content?owner=${repo.owner.login}&repo=${repo.name}&path=${encodeURIComponent(path)}&ref=${encodeURIComponent(branch)}`,
          );
          if (!isCurrent()) return;
          set({
            fileContent: data.content || "",
            fileSha: data.sha ?? null,
            loadingContent: false,
          });
        } catch (error) {
          if (!isCurrent()) return;
          console.error("Lỗi lấy nội dung file:", error);
          set({
            contentError: "Không thể tải nội dung file.",
            loadingContent: false,
          });
        }
      },

      resetWorkspace: () => {
        treeRequest++;
        contentRequest++;
        set({
          selectedRepo: null,
          tree: [],
          activeFile: null,
          fileContent: "",
          fileSha: null,
          loadingTree: false,
          treeError: null,
          loadingContent: false,
          contentError: null,
        });
      },
    }),
    {
      name: "gitvn-dashboard-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        selectedOrg: state.selectedOrg,
        selectedRepo: state.selectedRepo,
        currentBranch: state.currentBranch,
        activeFile: state.activeFile,
      }),
    },
  ),
);
