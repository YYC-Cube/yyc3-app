"use client"

import { ArrowLeft, Shield, Bell, Lock, Palette } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { UserManagementPanel } from "@/components/auth/user-management-panel"
import { RolePermissionsPanel } from "@/components/auth/role-permissions-panel"

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-slate-900 text-slate-100 p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-100">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                系统设置
              </h1>
              <p className="text-sm text-slate-400">配置系统参数与权限管理</p>
            </div>
          </div>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="bg-slate-800/50 p-1 mb-6">
            <TabsTrigger value="general" className="data-[state=active]:bg-slate-700 data-[state=active]:text-cyan-400">
              常规设置
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="data-[state=active]:bg-slate-700 data-[state=active]:text-cyan-400"
            >
              安全设置
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-slate-700 data-[state=active]:text-cyan-400">
              用户管理
            </TabsTrigger>
            <TabsTrigger
              value="permissions"
              className="data-[state=active]:bg-slate-700 data-[state=active]:text-cyan-400"
            >
              权限管理
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-100">
                  <Palette className="mr-2 h-5 w-5 text-cyan-500" />
                  界面设置
                </CardTitle>
                <CardDescription>自定义系统外观和行为</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-200">深色模式</Label>
                    <p className="text-sm text-slate-400">启用深色主题界面</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-200">动画效果</Label>
                    <p className="text-sm text-slate-400">启用界面过渡动画</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-200">语言</Label>
                  <Select defaultValue="zh-CN">
                    <SelectTrigger className="bg-slate-800/50 border-slate-700/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zh-CN">简体中文</SelectItem>
                      <SelectItem value="en-US">English</SelectItem>
                      <SelectItem value="ja-JP">日本語</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-100">
                  <Bell className="mr-2 h-5 w-5 text-cyan-500" />
                  通知设置
                </CardTitle>
                <CardDescription>管理系统通知偏好</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-200">桌面通知</Label>
                    <p className="text-sm text-slate-400">允许浏览器推送通知</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-200">声音提示</Label>
                    <p className="text-sm text-slate-400">新消息时播放提示音</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-200">邮件通知</Label>
                    <p className="text-sm text-slate-400">重要事件发送邮件</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-100">
                  <Shield className="mr-2 h-5 w-5 text-cyan-500" />
                  安全选项
                </CardTitle>
                <CardDescription>配置系统安全策略</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-200">双因素认证</Label>
                    <p className="text-sm text-slate-400">启用 2FA 增强账户安全</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-200">自动登出</Label>
                    <p className="text-sm text-slate-400">30分钟无操作自动登出</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-200">密码策略</Label>
                  <Select defaultValue="strong">
                    <SelectTrigger className="bg-slate-800/50 border-slate-700/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">基础（8位以上）</SelectItem>
                      <SelectItem value="medium">中等（包含数字和字母）</SelectItem>
                      <SelectItem value="strong">强（包含特殊字符）</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-100">
                  <Lock className="mr-2 h-5 w-5 text-cyan-500" />
                  访问控制
                </CardTitle>
                <CardDescription>管理IP白名单和访问限制</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-200">IP 白名单</Label>
                    <p className="text-sm text-slate-400">仅允许特定IP访问</p>
                  </div>
                  <Switch />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-200">允许的IP地址</Label>
                  <Input placeholder="192.168.1.0/24" className="bg-slate-800/50 border-slate-700/50" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Management */}
          <TabsContent value="users">
            <UserManagementPanel />
          </TabsContent>

          {/* Permissions Management */}
          <TabsContent value="permissions">
            <RolePermissionsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
