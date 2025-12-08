import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { AuthProviderWrapper } from "./providers/auth-provider-wrapper"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "星云操作系统 - 企业级 AI 智能管理平台",
  description: "基于 AI 的企业级智能管理系统，提供实时监控、预测分析、异常检测和智能建议",
  generator: "v0.app",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
}

export function reportWebVitals(metric: any) {
  if (metric.label === "web-vital") {
    console.log("📊 Web Vitals:", metric)
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className={inter.className}>
        <AuthProviderWrapper>{children}</AuthProviderWrapper>
      </body>
    </html>
  )
}
