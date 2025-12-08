"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import type { User, Tenant, Permission } from "./types"
import { hasPermission, hasAnyPermission, hasAllPermissions, getPermissionsByRole } from "./permissions"

interface AuthContextType {
  user: User | null
  tenant: Tenant | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  hasPermission: (permission: Permission) => boolean
  hasAnyPermission: (permissions: Permission[]) => boolean
  hasAllPermissions: (permissions: Permission[]) => boolean
  switchTenant: (tenantId: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  // 模拟当前用户和租户数据
  const [user, setUser] = useState<User | null>({
    id: "user-001",
    name: "系统管理员",
    email: "admin@example.com",
    role: "admin",
    tenantId: "tenant-001",
    permissions: getPermissionsByRole("admin"),
    createdAt: new Date(),
    lastLogin: new Date(),
    status: "active",
  })

  const [tenant, setTenant] = useState<Tenant | null>({
    id: "tenant-001",
    name: "示例企业",
    domain: "example.com",
    plan: "enterprise",
    status: "active",
    createdAt: new Date(),
    settings: {
      maxUsers: 100,
      features: ["ai-analysis", "advanced-analytics", "custom-branding"],
    },
  })

  const login = useCallback(async (email: string, password: string) => {
    // 模拟登录逻辑
    console.log("[v0] 登录请求:", email)
    // 实际应用中这里会调用 API
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setUser({
      id: "user-001",
      name: "系统管理员",
      email,
      role: "admin",
      tenantId: "tenant-001",
      permissions: getPermissionsByRole("admin"),
      createdAt: new Date(),
      lastLogin: new Date(),
      status: "active",
    })
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setTenant(null)
  }, [])

  const checkPermission = useCallback(
    (permission: Permission) => {
      if (!user) return false
      return hasPermission(user.permissions, permission)
    },
    [user],
  )

  const checkAnyPermission = useCallback(
    (permissions: Permission[]) => {
      if (!user) return false
      return hasAnyPermission(user.permissions, permissions)
    },
    [user],
  )

  const checkAllPermissions = useCallback(
    (permissions: Permission[]) => {
      if (!user) return false
      return hasAllPermissions(user.permissions, permissions)
    },
    [user],
  )

  const switchTenant = useCallback(async (tenantId: string) => {
    console.log("[v0] 切换租户:", tenantId)
    // 实际应用中这里会调用 API 切换租户
    await new Promise((resolve) => setTimeout(resolve, 500))
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        tenant,
        isAuthenticated: !!user,
        login,
        logout,
        hasPermission: checkPermission,
        hasAnyPermission: checkAnyPermission,
        hasAllPermissions: checkAllPermissions,
        switchTenant,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth 必须在 AuthProvider 内部使用")
  }
  return context
}
