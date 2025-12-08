"use client"

import { useState } from "react"
import { Users, UserPlus, MoreVertical, Search, Filter } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import type { User, UserRole } from "@/lib/auth/types"

export function UserManagementPanel() {
  const [searchQuery, setSearchQuery] = useState("")

  // 模拟用户数据
  const mockUsers: User[] = [
    {
      id: "1",
      name: "张伟",
      email: "zhang.wei@example.com",
      role: "admin",
      tenantId: "tenant-001",
      permissions: [],
      createdAt: new Date("2024-01-15"),
      lastLogin: new Date(),
      status: "active",
    },
    {
      id: "2",
      name: "李娜",
      email: "li.na@example.com",
      role: "manager",
      tenantId: "tenant-001",
      permissions: [],
      createdAt: new Date("2024-02-20"),
      lastLogin: new Date(Date.now() - 3600000),
      status: "active",
    },
    {
      id: "3",
      name: "王强",
      email: "wang.qiang@example.com",
      role: "operator",
      tenantId: "tenant-001",
      permissions: [],
      createdAt: new Date("2024-03-10"),
      lastLogin: new Date(Date.now() - 86400000),
      status: "active",
    },
    {
      id: "4",
      name: "刘芳",
      email: "liu.fang@example.com",
      role: "viewer",
      tenantId: "tenant-001",
      permissions: [],
      createdAt: new Date("2024-03-25"),
      lastLogin: new Date(Date.now() - 172800000),
      status: "inactive",
    },
  ]

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

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400 border-green-500/50"
      case "inactive":
        return "bg-slate-500/20 text-slate-400 border-slate-500/50"
      case "suspended":
        return "bg-red-500/20 text-red-400 border-red-500/50"
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/50"
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: "活跃",
      inactive: "未活跃",
      suspended: "已暂停",
    }
    return labels[status] || status
  }

  const formatLastLogin = (date: Date) => {
    const now = Date.now()
    const diff = now - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "刚刚"
    if (minutes < 60) return `${minutes} 分钟前`
    if (hours < 24) return `${hours} 小时前`
    return `${days} 天前`
  }

  return (
    <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-slate-100 flex items-center text-base">
            <Users className="mr-2 h-5 w-5 text-cyan-500" />
            用户管理
          </CardTitle>
          <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700">
            <UserPlus className="mr-2 h-4 w-4" />
            添加用户
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 搜索和筛选 */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="搜索用户..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-800/50 border-slate-700/50"
              />
            </div>
            <Button variant="outline" size="icon" className="border-slate-700 bg-slate-800/50">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* 用户列表 */}
          <div className="space-y-3">
            {mockUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between bg-slate-800/30 rounded-lg p-3 border border-slate-700/50 hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center space-x-3 flex-1">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                    <AvatarFallback className="bg-slate-700 text-cyan-400">{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <div className="text-sm font-medium text-slate-200 truncate">{user.name}</div>
                      <Badge variant="outline" className={getRoleBadgeColor(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                      <Badge variant="outline" className={getStatusBadgeColor(user.status)}>
                        {getStatusLabel(user.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-3 mt-1">
                      <div className="text-xs text-slate-400 truncate">{user.email}</div>
                      {user.lastLogin && (
                        <div className="text-xs text-slate-500">最后登录: {formatLastLogin(user.lastLogin)}</div>
                      )}
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                    <DropdownMenuItem className="text-slate-200 focus:bg-slate-700 focus:text-slate-100">
                      编辑用户
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-slate-200 focus:bg-slate-700 focus:text-slate-100">
                      修改权限
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-slate-200 focus:bg-slate-700 focus:text-slate-100">
                      重置密码
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-400 focus:bg-red-500/20 focus:text-red-300">
                      删除用户
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>

          {/* 统计信息 */}
          <div className="grid grid-cols-4 gap-3 pt-3 border-t border-slate-700/50">
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">{mockUsers.length}</div>
              <div className="text-xs text-slate-500">总用户数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {mockUsers.filter((u) => u.status === "active").length}
              </div>
              <div className="text-xs text-slate-500">活跃用户</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {mockUsers.filter((u) => u.role === "admin" || u.role === "super_admin").length}
              </div>
              <div className="text-xs text-slate-500">管理员</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {mockUsers.filter((u) => u.lastLogin && Date.now() - u.lastLogin.getTime() < 86400000).length}
              </div>
              <div className="text-xs text-slate-500">今日活跃</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
