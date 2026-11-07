"use client";

import { NavigationProgress, nprogress } from "@mantine/nprogress";
import axios from "axios";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

export function GlobalNavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  // 1. Kích hoạt hiệu ứng tiến trình khi chuyển trang (Next.js route change)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    nprogress.start();
    const timer = setTimeout(() => {
      nprogress.complete();
    }, 200);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  // 2. Interceptor tự động refresh token khi gặp lỗi 401 (hoàn toàn không kích hoạt progress bar toàn trang)
  useEffect(() => {
    const resInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        // Tự động thử làm mới token nếu gặp 401 Unauthorized
        const originalRequest = error.config;
        if (
          error.response?.status === 401 &&
          originalRequest &&
          !originalRequest._retry &&
          !originalRequest.url?.includes("/api/auth/")
        ) {
          originalRequest._retry = true;
          try {
            const refreshRes = await axios.post("/api/auth/refresh");
            if (refreshRes.status === 200 && refreshRes.data?.success) {
              return axios(originalRequest);
            }
          } catch {
            // Không thể refresh (token bị revoke hoặc hết hạn 6 tháng)
          }
        }

        return Promise.reject(error);
      },
    );

    return () => {
      axios.interceptors.response.eject(resInterceptor);
    };
  }, []);

  return (
    <NavigationProgress
      color="#fb291a"
      size={3}
      zIndex={99999}
      stepInterval={120}
    />
  );
}
