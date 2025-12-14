/**
 * @file Next.js 根布局
 * @description 配置应用的根布局，引入全局样式和组件
 * @module app/layout
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Layout from "@/components/layout/Layout";
import { ThemeProvider } from "@/theme";
import { EmailProvider } from "@/context/EmailContext";
import { ClientBody } from "./client-body";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 应用元数据
export const metadata: Metadata = {
  title: "邮件平台",
  description: "现代化的邮件管理平台，高效处理您的邮件通信",
  icons: {
    icon: "/favicon.ico",
  },
};



/**
 * 根布局组件
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 根布局保持简单，将布局切换逻辑移到中间件或子组件中处理

  return (
    <html lang="zh-CN">
      <ClientBody
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <EmailProvider>
            <Layout>{children}</Layout> // 使用统一布局
          </EmailProvider>
        </ThemeProvider>
      </ClientBody>
    </html>
  );
}
