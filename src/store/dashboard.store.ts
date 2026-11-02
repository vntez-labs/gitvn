import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axios from 'axios';
import { GitHubRepo, GitHubOrg } from '@/interfaces/github';
import { TreeNode } from '@/components/FileTree';

interface DashboardState {
  repos: GitHubRepo[];
  orgs: GitHubOrg[];
  dataLoading: boolean;

  selectedOrg: string | null;
  selectedRepo: GitHubRepo | null;
  currentBranch: string; // <-- THÊM ĐÂY

  tree: TreeNode[];
  loadingTree: boolean;
  activeFile: string | null;
  fileContent: string;
  loadingContent: boolean;

  fetchInitialData: () => Promise<void>;
  selectOrg: (org: string | null) => void;
  selectRepo: (repo: GitHubRepo | null, targetFile?: string | null, targetBranch?: string | null) => Promise<void>;
  addRepo: (repo: GitHubRepo) => void;
  changeBranch: (branch: string) => Promise<void>; // <-- THÊM ACTION ĐỔI BRANCH
  selectFile: (path: string, branch?: string) => Promise<void>;
  resetWorkspace: () => void;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      repos: [],
      orgs: [],
      dataLoading: true,
      selectedOrg: null,
      selectedRepo: null,
      currentBranch: 'main',
      tree: [],
      loadingTree: false,
      activeFile: null,
      fileContent: '',
      loadingContent: false,

      fetchInitialData: async () => {
        set({ dataLoading: true });
        try {
          const { data } = await axios.get('/api/user/data');
          set({
            repos: data.repos || [],
            orgs: data.orgs || [],
            dataLoading: false,
          });

          const currentRepo = get().selectedRepo;
          const currentFile = get().activeFile;
          const branch = get().currentBranch;

          if (currentRepo) {
            await get().selectRepo(currentRepo, currentFile, branch);
          }
        } catch (error) {
          console.error('Lỗi lấy dữ liệu:', error);
          set({ dataLoading: false });
        }
      },

      selectOrg: (org) => {
        set({ selectedOrg: org, selectedRepo: null, tree: [], activeFile: null, fileContent: '' });
      },

      selectRepo: async (repo, targetFile = null, targetBranch = null) => {
        if (!repo) {
          get().resetWorkspace();
          return;
        }

        const branch = targetBranch || (repo as any).default_branch || 'main';
        set({
          selectedRepo: repo,
          currentBranch: branch,
          loadingTree: true,
          tree: [],
          activeFile: targetFile,
        });

        try {
          const { data } = await axios.get(
            `/api/github/tree?owner=${repo.owner.login}&repo=${repo.name}&branch=${encodeURIComponent(branch)}`
          );
          const treeData: TreeNode[] = data.tree || [];
          set({ tree: treeData, loadingTree: false });

          // Kiểm tra nếu file trước đó vẫn tồn tại trong branch mới
          if (targetFile && treeData.some((f) => f.path === targetFile)) {
            await get().selectFile(targetFile, branch);
            return;
          }

          // Fallback mở file README.md
          const readme = treeData.find((f) => f.path.toLowerCase() === 'readme.md');
          if (readme) {
            await get().selectFile(readme.path, branch);
          } else {
            set({ activeFile: null, fileContent: '' });
          }
        } catch (error) {
          console.error('Lỗi lấy tree:', error);
          set({ loadingTree: false, tree: [], activeFile: null, fileContent: '' });
        }
      },

      addRepo: (repo) => {
        set((state) => ({
          repos: [repo, ...state.repos.filter((r) => r.id !== repo.id)],
          selectedRepo: repo,
          currentBranch: (repo as any).default_branch || 'main',
          tree: [],
          activeFile: null,
          fileContent: '',
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
        set({ activeFile: path, loadingContent: true });

        try {
          const { data } = await axios.get(
            `/api/github/content?owner=${repo.owner.login}&repo=${repo.name}&path=${encodeURIComponent(path)}&ref=${encodeURIComponent(branch)}`
          );
          set({ fileContent: data.content || '', loadingContent: false });
        } catch (error) {
          console.error('Lỗi lấy nội dung file:', error);
          set({ fileContent: 'Lỗi không thể tải nội dung file.', loadingContent: false });
        }
      },

      resetWorkspace: () => {
        set({
          selectedRepo: null,
          tree: [],
          activeFile: null,
          fileContent: '',
        });
      },
    }),
    {
      name: 'gitvn-dashboard-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        selectedOrg: state.selectedOrg,
        selectedRepo: state.selectedRepo,
        currentBranch: state.currentBranch,
        activeFile: state.activeFile,
      }),
    }
  )
);
