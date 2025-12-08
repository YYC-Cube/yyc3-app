"use client"

import { useAuth } from "@/lib/auth/auth-context"
import type { Permission } from "@/lib/auth/types"
import { useRouter } from "next/navigation"
import { useEffect, type ReactNode } from "react"

interface AuthGuardProps {
  children: ReactNode
  requiredPermission?: Permission
  requiredPermissions?: Permission[]
  requireAll?: boolean
  fallback?: ReactNode
}

export function AuthGuard({
  children,
  requiredPermission,
  requiredPermissions,
  requireAll = false,
  fallback,
}: AuthGuardProps) {
  const { isAuthenticated, hasPermission, hasAnyPermission, hasAllPermissions } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return fallback || null
  }

  // 检查单个权限
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return fallback || <div className="text-center p-8 text-slate-400">您没有访问此功能的权限</div>
  }

  // 检查多个权限
  if (requiredPermissions) {
    const hasAccess = requireAll ? hasAllPermissions(requiredPermissions) : hasAnyPermission(requiredPermissions)

    if (!hasAccess) {
      return fallback || <div className="text-center p-8 text-slate-400">您没有访问此功能的权限</div>
    }
  }

  return <>{children}</>
}
