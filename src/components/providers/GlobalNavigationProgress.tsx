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

  // 2. Kích hoạt hiệu ứng tiến trình cho mọi request API Axios (YouTube-style)
  useEffect(() => {
    let activeRequests = 0;

    const reqInterceptor = axios.interceptors.request.use(
      (config) => {
        if (activeRequests === 0) {
          nprogress.start();
        }
        activeRequests++;
        return config;
      },
      (error) => {
        activeRequests--;
        if (activeRequests <= 0) {
          activeRequests = 0;
          nprogress.complete();
        }
        return Promise.reject(error);
      },
    );

    const resInterceptor = axios.interceptors.response.use(
      (response) => {
        activeRequests--;
        if (activeRequests <= 0) {
          activeRequests = 0;
          nprogress.complete();
        }
        return response;
      },
      (error) => {
        activeRequests--;
        if (activeRequests <= 0) {
          activeRequests = 0;
          nprogress.complete();
        }
        return Promise.reject(error);
      },
    );

    return () => {
      axios.interceptors.request.eject(reqInterceptor);
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
