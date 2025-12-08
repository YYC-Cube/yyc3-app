"use client"

import { Shield, Check, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { UserRole, Permission } from "@/lib/auth/types"
import { ROLE_PERMISSIONS, ROLE_DESCRIPTIONS } from "@/lib/auth/permissions"

export function RolePermissionsPanel() {
  const roles: UserRole[] = ["super_admin", "admin", "manager", "operator", "viewer"]

  const permissionLabels: Record<Permission, string> = {
    "system:read": "查看系统",
    "system:write": "修改系统",
    "system:delete": "删除系统",
    "users:read": "查看用户",
    "users:write": "管理用户",
    "users:delete": "删除用户",
    "analytics:read": "查看分析",
    "analytics:export": "导出数据",
    "security:read": "查看安全",
    "security:write": "管理安全",
    "settings:read": "查看设置",
    "settings:write": "修改设置",
  }

  const allPermissions: Permission[] = [
    "system:read",
    "system:write",
    "system:delete",
    "users:read",
    "users:write",
    "users:delete",
    "analytics:read",
    "analytics:export",
    "security:read",
    "security:write",
    "settings:read",
    "settings:write",
  ]

  const getRoleLabel = (role: UserRole) => {
    const labels: Record<UserRole, string> = {
      super_admin: "超级管理员",
      admin: "管理员",
      manager: "经理",
      operator: "操作员",
      viewer: "查看者",
    }
    return labels[role]
  }

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case "super_admin":
        return "bg-red-500/20 text-red-400 border-red-500/50"
      case "admin":
        return "bg-purple-500/20 text-purple-400 border-purple-500/50"
      case "manager":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50"
      case "operator":
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/50"
      case "viewer":
        return "bg-slate-500/20 text-slate-400 border-slate-500/50"
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/50"
    }
  }

  const hasPermission = (role: UserRole, permission: Permission) => {
    return ROLE_PERMISSIONS[role]?.includes(permission) || false
  }

  return (
    <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-slate-100 flex items-center text-base">
          <Shield className="mr-2 h-5 w-5 text-purple-500" />
          角色权限矩阵
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* 角色说明 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {roles.map((role) => (
              <div key={role} className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className={getRoleBadgeColor(role)}>
                    {getRoleLabel(role)}
                  </Badge>
                  <div className="text-xs text-slate-500">{ROLE_PERMISSIONS[role]?.length || 0} 项权限</div>
                </div>
                <div className="text-xs text-slate-400">{ROLE_DESCRIPTIONS[role]}</div>
              </div>
            ))}
          </div>

          {/* 权限矩阵 */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left py-3 px-2 text-sm font-medium text-slate-300">权限</th>
                  {roles.map((role) => (
                    <th key={role} className="text-center py-3 px-2">
                      <Badge variant="outline" className={`${getRoleBadgeColor(role)} text-xs`}>
                        {getRoleLabel(role)}
                      </Badge>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allPermissions.map((permission, index) => (
                  <tr
                    key={permission}
                    className={`border-b border-slate-700/30 ${index % 2 === 0 ? "bg-slate-800/20" : ""}`}
                  >
                    <td className="py-2 px-2 text-sm text-slate-300">{permissionLabels[permission]}</td>
                    {roles.map((role) => (
                      <td key={`${role}-${permission}`} className="text-center py-2 px-2">
                        {hasPermission(role, permission) ? (
                          <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20">
                            <Check className="h-4 w-4 text-green-400" />
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-700/30">
                            <X className="h-4 w-4 text-slate-600" />
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
