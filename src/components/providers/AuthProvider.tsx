'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading, clearAuth } = useAuthStore()

  useEffect(() => {
    async function fetchUser() {
      try {
        setLoading(true);
        const res = await fetch('/api/user');
        const data = await res.json();

        if (res.ok && data.user) {
          setUser(data.user);
        } else {
          clearAuth();
        }
      } catch (error) {
        console.error('Lỗi kiểm tra phiên đăng nhập:', error);
        clearAuth();
      } finally {
        // Bắt buộc phải tắt loading ở đây
        setLoading(false);
      }
    }

    fetchUser();
  }, [setUser, setLoading, clearAuth]);

  return <>{children}</>;
}
