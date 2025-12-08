"use client"

import { useAuth } from "@/lib/auth/auth-context"
import type { Permission } from "@/lib/auth/types"
import type { ReactNode } from "react"

interface PermissionGateProps {
  children: ReactNode
  permission?: Permission
  permissions?: Permission[]
  requireAll?: boolean
  fallback?: ReactNode
}

export function PermissionGate({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuth()

  // 检查单个权限
  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>
  }

  // 检查多个权限
  if (permissions) {
    const hasAccess = requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions)

    if (!hasAccess) {
      return <>{fallback}</>
    }
  }

  return <>{children}</>
}
