/**
 * 多租户权限管理系统 - 类型定义
 */

// ✅ 用户角色定义
export type UserRole = "super_admin" | "admin" | "manager" | "operator" | "viewer"

// ✅ 权限常量数组（用于枚举与 UI 显示）
export const PERMISSIONS = [
  "view:dashboard",
  "view:analytics",
  "view:data",
  "view:network",
  "view:security",
  "view:insights",
  "manage:users",
  "manage:roles",
  "manage:settings",
  "manage:resources",
  "execute:commands",
  "export:data",
] as const

// ✅ 权限类型（自动推导）
export type Permission = typeof PERMISSIONS[number]

// ✅ 用户结构定义
export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: UserRole
  tenantId: string
  permissions: Permission[]
  createdAt: Date
  lastLogin?: Date
  status: "active" | "inactive" | "suspended"
}

// ✅ 租户结构定义
export interface Tenant {
  id: string
  name: string
  domain: string
  plan: "free" | "pro" | "enterprise"
  status: "active" | "trial" | "suspended"
  createdAt: Date
  settings: {
    maxUsers: number
    features: string[]
    customBranding?: {
      logo?: string
      primaryColor?: string
    }
  }
}

// ✅ 角色权限映射结构
export interface RolePermissions {
  role: UserRole
  permissions: Permission[]
  description: string
}
