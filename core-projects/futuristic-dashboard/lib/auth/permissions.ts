import type { Permission, UserRole } from "./types"

// ✅ 权限标签映射（用于 UI 显示）
export const PermissionLabels: Record<Permission, string> = {
  "view:dashboard": "查看仪表板",
  "view:analytics": "查看数据分析",
  "view:data": "查看数据中心",
  "view:network": "查看网络监控",
  "view:security": "查看安全防护",
  "view:insights": "查看 AI 洞察",
  "manage:users": "管理用户",
  "manage:roles": "管理角色",
  "manage:settings": "管理系统设置",
  "manage:resources": "管理资源",
  "execute:commands": "执行系统命令",
  "export:data": "导出数据",
}

// ✅ 角色权限映射（用于默认权限配置）
export const RolePermissionMap: Record<UserRole, Permission[]> = {
  super_admin: [
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
  ],
  admin: [
    "view:dashboard",
    "view:analytics",
    "view:data",
    "view:network",
    "view:security",
    "manage:users",
    "manage:roles",
    "manage:settings",
    "export:data",
  ],
  manager: ["view:dashboard", "view:data", "view:network", "view:security", "manage:resources"],
  operator: ["view:dashboard", "view:data", "view:network", "execute:commands"],
  viewer: ["view:dashboard", "view:data"],
}

export const ROLE_PERMISSIONS = RolePermissionMap

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  super_admin: "拥有系统所有权限，可以管理整个平台",
  admin: "管理员角色，可以管理用户、角色和系统设置",
  manager: "经理角色，可以查看数据和管理资源",
  operator: "操作员角色，可以查看数据和执行命令",
  viewer: "查看者角色，只能查看基础数据",
}

/**
 * 根据角色获取权限列表
 */
export function getPermissionsByRole(role: UserRole): Permission[] {
  return RolePermissionMap[role] || []
}

/**
 * 检查用户是否拥有特定权限
 */
export function hasPermission(userPermissions: Permission[], permission: Permission): boolean {
  return userPermissions.includes(permission)
}

/**
 * 检查用户是否拥有任意一个权限
 */
export function hasAnyPermission(userPermissions: Permission[], permissions: Permission[]): boolean {
  return permissions.some((permission) => userPermissions.includes(permission))
}

/**
 * 检查用户是否拥有所有权限
 */
export function hasAllPermissions(userPermissions: Permission[], permissions: Permission[]): boolean {
  return permissions.every((permission) => userPermissions.includes(permission))
}
