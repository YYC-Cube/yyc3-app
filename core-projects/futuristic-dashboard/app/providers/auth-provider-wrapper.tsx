"use client"

import { AuthProvider } from "@/lib/auth/auth-context"
import type { ReactNode } from "react"

/**
 * @description AuthProvider的客户端包装组件
 * 用于在服务器组件中安全地使用AuthProvider
 */
export function AuthProviderWrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}
