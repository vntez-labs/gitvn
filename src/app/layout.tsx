import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

// 1. Core styles bắt buộc phải import đầu tiên
import "@mantine/core/styles.css";

// 2. Styles của các package mở rộng
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/code-highlight/styles.css";
import "@mantine/spotlight/styles.css";
import "@mantine/charts/styles.css";
import "@mantine/dropzone/styles.css";
import "@mantine/nprogress/styles.css";

// 3. Global CSS của dự án (đặt sau cùng để có thể override khi cần)
import "./globals.css";

import {
  ColorSchemeScript,
  MantineProvider,
  mantineHtmlProps,
} from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { Suspense } from "react";
import { AuthProvider } from "../components/providers/AuthProvider";
import { GlobalNavigationProgress } from "../components/providers/GlobalNavigationProgress";
import { theme } from "./theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://gitvn.vercel.app"),
  title: {
    default: "GitVN — Nền tảng Git Workspace, Agile Kanban & Sprint Planner",
    template: "%s | GitVN — VNTEZ",
  },
  description:
    "GitVN là nền tảng quản lý mã nguồn, bảng Kanban Agile, chu kỳ Sprint và tài liệu MDX chuẩn hoá tích hợp trực tiếp với GitHub từ hệ sinh thái VNTEZ.",
  keywords: [
    "GitVN",
    "VNTEZ",
    "vntez.vercel.app",
    "Git Workspace",
    "Kanban board",
    "Agile Scrum",
    "Sprint Planning",
    "GitHub integration",
    "MDX Docs",
    "Developer platform",
    "Quản lý dự án lập trình",
    "Next.js Mantine",
  ],
  authors: [{ name: "VNTEZ Labs", url: "https://vntez.vercel.app" }],
  creator: "VNTEZ Labs",
  publisher: "VNTEZ",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "https://gitvn.vercel.app",
    siteName: "GitVN Workspace",
    title: "GitVN — Nền tảng Git Workspace, Agile Kanban & Sprint Planner",
    description:
      "Nền tảng quản lý mã nguồn, bảng Kanban Agile, chu kỳ Sprint và tài liệu MDX chuẩn hoá từ hệ sinh thái VNTEZ.",
    images: [
      {
        url: "https://gitvn.vercel.app/og-image.png",
        secureUrl: "https://gitvn.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        type: "image/png",
        alt: "GitVN Workspace Banner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GitVN — Nền tảng Git Workspace, Agile Kanban & Sprint Planner",
    description:
      "Nền tảng quản lý mã nguồn, bảng Kanban Agile, chu kỳ Sprint và tài liệu MDX từ VNTEZ.",
    creator: "@vntez",
    images: ["https://gitvn.vercel.app/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      {...mantineHtmlProps}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body className="min-h-full flex flex-col bg-white text-slate-900">
        <MantineProvider
          theme={theme}
          defaultColorScheme="light"
          forceColorScheme="light"
        >
          {/* Thanh loading tiến trình trên đầu trang kiểu YouTube (#fb291a) */}
          <Suspense fallback={null}>
            <GlobalNavigationProgress />
          </Suspense>

          {/* Container hiển thị toast notifications */}
          <Notifications position="top-right" zIndex={1000} />

          <AuthProvider>{children}</AuthProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
