"use client"

import { useState } from "react"
import { Users, Circle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface TeamMember {
  id: string
  name: string
  role: string
  avatar?: string
  status: "online" | "away" | "busy" | "offline"
  currentPage?: string
  lastActive?: Date
}

export function TeamPresence() {
  const [members, setMembers] = useState<TeamMember[]>([
    {
      id: "1",
      name: "张伟",
      role: "管理员",
      status: "online",
      currentPage: "系统监控",
      lastActive: new Date(),
    },
    {
      id: "2",
      name: "李娜",
      role: "经理",
      status: "online",
      currentPage: "数据分析",
      lastActive: new Date(),
    },
    {
      id: "3",
      name: "王强",
      role: "操作员",
      status: "away",
      lastActive: new Date(Date.now() - 300000),
    },
    {
      id: "4",
      name: "刘芳",
      role: "查看者",
      status: "offline",
      lastActive: new Date(Date.now() - 3600000),
    },
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500"
      case "away":
        return "bg-amber-500"
      case "busy":
        return "bg-red-500"
      case "offline":
        return "bg-slate-500"
      default:
        return "bg-slate-500"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "online":
        return "在线"
      case "away":
        return "离开"
      case "busy":
        return "忙碌"
      case "offline":
        return "离线"
      default:
        return "未知"
    }
  }

  const onlineCount = members.filter((m) => m.status === "online").length

  return (
    <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-slate-100 flex items-center text-base">
            <Users className="mr-2 h-5 w-5 text-cyan-500" />
            团队在线
          </CardTitle>
          <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50">
            {onlineCount} 人在线
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
                    <AvatarFallback className="bg-slate-700 text-cyan-400">{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${getStatusColor(member.status)} rounded-full border-2 border-slate-900`}
                  ></div>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-200">{member.name}</div>
                  <div className="text-xs text-slate-400">{member.role}</div>
                </div>
              </div>
              <div className="text-right">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="outline"
                        className={`${getStatusColor(member.status)}/20 border-${getStatusColor(member.status)}/50 text-xs`}
                      >
                        <Circle className={`h-2 w-2 mr-1 ${getStatusColor(member.status)}`} fill="currentColor" />
                        {getStatusLabel(member.status)}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      {member.currentPage ? (
                        <p>正在查看: {member.currentPage}</p>
                      ) : (
                        <p>最后活动: {member.lastActive?.toLocaleTimeString("zh-CN")}</p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
