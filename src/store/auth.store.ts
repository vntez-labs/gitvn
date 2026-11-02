import { create } from "zustand";
import type { GitHubUser } from "@/interfaces/github";

interface AuthState {
  user: GitHubUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: GitHubUser | null) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true, // Ban đầu mặc định là true để chờ fetch
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  clearAuth: () =>
    set({ user: null, isAuthenticated: false, isLoading: false }),
}));
