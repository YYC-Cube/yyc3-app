"use client"

import { useState, useEffect } from "react"
import { Activity, User, Settings, Database, Shield } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ActivityEvent {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  action: string
  target: string
  timestamp: Date
  type: "user" | "system" | "security" | "data"
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityEvent[]>([
    {
      id: "1",
      userId: "user-001",
      userName: "张伟",
      action: "修改了",
      target: "系统配置",
      timestamp: new Date(Date.now() - 300000),
      type: "system",
    },
    {
      id: "2",
      userId: "user-002",
      userName: "李娜",
      action: "创建了",
      target: "新用户账户",
      timestamp: new Date(Date.now() - 600000),
      type: "user",
    },
    {
      id: "3",
      userId: "user-003",
      userName: "王强",
      action: "导出了",
      target: "分析报告",
      timestamp: new Date(Date.now() - 900000),
      type: "data",
    },
    {
      id: "4",
      userId: "system",
      userName: "系统",
      action: "检测到",
      target: "异常登录尝试",
      timestamp: new Date(Date.now() - 1200000),
      type: "security",
    },
    {
      id: "5",
      userId: "user-001",
      userName: "张伟",
      action: "更新了",
      target: "安全策略",
      timestamp: new Date(Date.now() - 1800000),
      type: "security",
    },
  ])

  useEffect(() => {
    // 模拟实时活动更新
    const interval = setInterval(() => {
      const newActivity: ActivityEvent = {
        id: `activity-${Date.now()}`,
        userId: `user-${Math.floor(Math.random() * 3) + 1}`,
        userName: ["张伟", "李娜", "王强"][Math.floor(Math.random() * 3)],
        action: ["查看了", "修改了", "创建了", "删除了"][Math.floor(Math.random() * 4)],
        target: ["系统日志", "用户权限", "数据备份", "网络设置"][Math.floor(Math.random() * 4)],
        timestamp: new Date(),
        type: ["user", "system", "security", "data"][Math.floor(Math.random() * 4)] as any,
      }

      setActivities((prev) => [newActivity, ...prev.slice(0, 19)])
    }, 15000)

    return () => clearInterval(interval)
  }, [])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "user":
        return <User className="h-4 w-4 text-cyan-500" />
      case "system":
        return <Settings className="h-4 w-4 text-purple-500" />
      case "security":
        return <Shield className="h-4 w-4 text-red-500" />
      case "data":
        return <Database className="h-4 w-4 text-blue-500" />
      default:
        return <Activity className="h-4 w-4 text-slate-500" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case "user":
        return "bg-cyan-500/20 border-cyan-500/50"
      case "system":
        return "bg-purple-500/20 border-purple-500/50"
      case "security":
        return "bg-red-500/20 border-red-500/50"
      case "data":
        return "bg-blue-500/20 border-blue-500/50"
      default:
        return "bg-slate-500/20 border-slate-500/50"
    }
  }

  const formatTime = (date: Date | null) => {
    if (!date) return "刚刚";
    const now = Date.now()
    const diff = now - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)

    if (minutes < 1) return "刚刚"
    if (minutes < 60) return `${minutes} 分钟前`
    return `${hours} 小时前`
  }

  return (
    <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-slate-100 flex items-center text-base">
          <Activity className="mr-2 h-5 w-5 text-cyan-500" />
          实时活动
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {activities.map((activity, index) => (
              <div
                key={activity.id}
                className="flex items-start space-x-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 transition-colors"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={activity.userAvatar || "/placeholder.svg"} alt={activity.userName} />
                  <AvatarFallback className="bg-slate-700 text-cyan-400 text-xs">
                    {activity.userName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-slate-200">{activity.userName}</span>
                    <span className="text-xs text-slate-400">{activity.action}</span>
                    <span className="text-sm text-cyan-400">{activity.target}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={`${getActivityColor(activity.type)} text-xs`}>
                      {getActivityIcon(activity.type)}
                      <span className="ml-1">
                        {activity.type === "user"
                          ? "用户"
                          : activity.type === "system"
                            ? "系统"
                            : activity.type === "security"
                              ? "安全"
                              : "数据"}
                      </span>
                    </Badge>
                    <span className="text-xs text-slate-500">{formatTime(activity.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
