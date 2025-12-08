/**
 * @file 行业权限控制组件
 * @description 基于行业ID进行权限控制的组件，用于保护特定行业的UI内容
 * @module auth/industry-permission-gate
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

"use client"

import { useAuth } from "@/lib/auth/auth-context"
import type { Permission } from "@/lib/auth/types"
import { 
  hasIndustryPermission, 
  hasAnyIndustryPermission, 
  hasAllIndustryPermissions 
} from "@/lib/auth/industry-permissions"
import type { ReactNode } from "react"

interface IndustryPermissionGateProps {
  children: ReactNode
  industryId: string
  permission?: Permission
  permissions?: Permission[]
  requireAll?: boolean
  fallback?: ReactNode
}

/**
 * 行业权限控制组件
 * 用于检查用户是否具有特定行业的权限
 */
export function IndustryPermissionGate({
  children,
  industryId,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
}: IndustryPermissionGateProps) {
  const { user } = useAuth()

  // 检查单个行业权限
  if (permission && !hasIndustryPermission(user, industryId, permission)) {
    return <>{fallback}</>
  }

  // 检查多个行业权限
  if (permissions) {
    const hasAccess = requireAll 
      ? hasAllIndustryPermissions(user, industryId, permissions)
      : hasAnyIndustryPermission(user, industryId, permissions)

    if (!hasAccess) {
      return <>{fallback}</>
    }
  }

  return <>{children}</>
}

interface IndustryGateProps {
  children: ReactNode
  industryId: string
  fallback?: ReactNode
}

/**
 * 简化版行业访问控制组件
 * 仅检查用户是否可以访问特定行业
 */
export function IndustryGate({
  children,
  industryId,
  fallback = null,
}: IndustryGateProps) {
  const { user } = useAuth()
  
  // 这里可以直接使用canAccessIndustry函数
  // 暂时简化为检查基本的行业访问权限
  if (!user || !user.permissions.includes('view:industry')) {
    return <>{fallback}</>
  }
  
  // 在实际应用中，应该使用canAccessIndustry函数进行更精确的检查
  // const canAccess = canAccessIndustry(user, industryId)
  // if (!canAccess) {
  //   return <>{fallback}</>
  // }
  
  return <>{children}</>
}