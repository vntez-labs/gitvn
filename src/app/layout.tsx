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
import { NavigationProgress } from "@mantine/nprogress";
import { theme } from "./theme";
import { AuthProvider } from "../components/providers/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VNTEZ Workspace",
  description: "Next generation cloud developer platform",
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
        <ColorSchemeScript defaultColorScheme="auto" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <MantineProvider theme={theme} defaultColorScheme="dark">
          {/* Thanh loading tiến trình trên đầu trang */}
          <NavigationProgress />

          {/* Container hiển thị toast notifications */}
          <Notifications position="top-right" zIndex={1000} />

          <AuthProvider>
            {children}
          </AuthProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
