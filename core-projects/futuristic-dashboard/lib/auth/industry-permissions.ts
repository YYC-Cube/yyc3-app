/**
 * @file 行业权限管理模块
 * @description 处理用户对不同行业的权限控制和验证
 * @module auth/industry-permissions
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

import type { Permission, UserIndustryPermissions, User } from './types'

/**
 * 检查用户是否有权限访问特定行业
 * @param user 用户对象
 * @param industryId 行业ID
 * @returns 是否有权限访问
 */
export function canAccessIndustry(user: User | null, industryId: string): boolean {
  if (!user) return false
  
  // 超级管理员可以访问所有行业
  if (user.role === 'super_admin') return true
  
  // 这里可以根据用户的行业权限设置进行检查
  // 暂时返回true，实际项目中需要根据后端返回的数据进行验证
  return true
}

/**
 * 检查用户是否有权限切换到特定行业
 * @param user 用户对象
 * @param industryId 行业ID
 * @returns 是否有权限切换
 */
export function canSwitchToIndustry(user: User | null, industryId: string): boolean {
  if (!user) return false
  
  // 检查用户是否拥有切换行业的基本权限
  if (!user.permissions.includes('switch:industry')) {
    return false
  }
  
  // 检查是否可以访问该行业
  return canAccessIndustry(user, industryId)
}

/**
 * 检查用户是否拥有特定行业的权限
 * @param user 用户对象
 * @param industryId 行业ID
 * @param permission 权限标识
 * @returns 是否拥有该行业的指定权限
 */
export function hasIndustryPermission(
  user: User | null, 
  industryId: string, 
  permission: Permission
): boolean {
  if (!user) return false
  
  // 超级管理员拥有所有行业的所有权限
  if (user.role === 'super_admin') return true
  
  // 首先检查是否可以访问该行业
  if (!canAccessIndustry(user, industryId)) {
    return false
  }
  
  // 检查用户是否拥有基本权限
  return user.permissions.includes(permission)
}

/**
 * 检查用户是否拥有特定行业的任意一个权限
 * @param user 用户对象
 * @param industryId 行业ID
 * @param permissions 权限列表
 * @returns 是否拥有任一权限
 */
export function hasAnyIndustryPermission(
  user: User | null, 
  industryId: string, 
  permissions: Permission[]
): boolean {
  return permissions.some(permission => 
    hasIndustryPermission(user, industryId, permission)
  )
}

/**
 * 检查用户是否拥有特定行业的所有权限
 * @param user 用户对象
 * @param industryId 行业ID
 * @param permissions 权限列表
 * @returns 是否拥有所有权限
 */
export function hasAllIndustryPermissions(
  user: User | null, 
  industryId: string, 
  permissions: Permission[]
): boolean {
  return permissions.every(permission => 
    hasIndustryPermission(user, industryId, permission)
  )
}

/**
 * 获取用户在特定行业的权限列表
 * @param user 用户对象
 * @param industryId 行业ID
 * @returns 用户在该行业的权限列表
 */
export function getUserIndustryPermissions(
  user: User | null, 
  industryId: string
): Permission[] {
  if (!user || !canAccessIndustry(user, industryId)) {
    return []
  }
  
  // 超级管理员返回所有权限
  if (user.role === 'super_admin') {
    return [
      'view:dashboard', 'view:analytics', 'view:data', 'view:network',
      'view:security', 'view:insights', 'manage:users', 'manage:roles',
      'manage:settings', 'manage:resources', 'execute:commands', 'export:data',
      'view:industry', 'manage:industry', 'switch:industry', 'view:industry:data',
      'manage:industry:config', 'manage:industry:permissions'
    ]
  }
  
  // 其他角色返回其拥有的权限（实际项目中需要根据后端数据过滤）
  return user.permissions
}

/**
 * 生成用户行业权限对象
 * @param user 用户对象
 * @param industryId 行业ID
 * @returns 用户行业权限对象
 */
export function generateUserIndustryPermissions(
  user: User | null, 
  industryId: string
): UserIndustryPermissions | null {
  if (!user || !canAccessIndustry(user, industryId)) {
    return null
  }
  
  return {
    userId: user.id,
    industryId,
    permissions: getUserIndustryPermissions(user, industryId),
    canSwitchTo: canSwitchToIndustry(user, industryId),
    canManage: hasIndustryPermission(user, industryId, 'manage:industry')
  }
}

/**
 * 验证用户对行业数据的访问权限
 * @param user 用户对象
 * @param industryId 行业ID
 * @param dataType 数据类型
 * @returns 是否有权限访问该行业的数据
 */
export function canAccessIndustryData(
  user: User | null, 
  industryId: string,
  dataType: 'read' | 'write' | 'delete'
): boolean {
  if (!user || !canAccessIndustry(user, industryId)) {
    return false
  }
  
  // 基础读取权限检查
  if (dataType === 'read') {
    return hasIndustryPermission(user, industryId, 'view:industry:data')
  }
  
  // 写入和删除操作需要管理权限
  return hasIndustryPermission(user, industryId, 'manage:industry:config')
}