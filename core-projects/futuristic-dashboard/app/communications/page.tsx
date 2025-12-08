"use client"

import { useState } from "react"
import { Send, Search, Phone, Video, MoreVertical, ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"

export default function CommunicationsPage() {
  const [selectedChat, setSelectedChat] = useState<string | null>("system-admin")
  const [message, setMessage] = useState("")

  const chats = [
    {
      id: "system-admin",
      name: "系统管理员",
      avatar: "/placeholder.svg?height=40&width=40",
      lastMessage: "计划维护将在 02:00 进行",
      time: "15:42",
      unread: 3,
      online: true,
    },
    {
      id: "security",
      name: "安全模块",
      avatar: "/placeholder.svg?height=40&width=40",
      lastMessage: "已阻止异常登录尝试",
      time: "14:30",
      unread: 2,
      online: true,
    },
    {
      id: "network",
      name: "网络控制",
      avatar: "/placeholder.svg?height=40&width=40",
      lastMessage: "带宽分配已调整",
      time: "12:15",
      unread: 1,
      online: false,
    },
    {
      id: "data-center",
      name: "数据中心",
      avatar: "/placeholder.svg?height=40&width=40",
      lastMessage: "备份验证完成",
      time: "09:05",
      unread: 0,
      online: true,
    },
  ]

  const messages = [
    {
      id: 1,
      sender: "system-admin",
      content: "系统状态正常，所有服务运行稳定",
      time: "15:30",
      isOwn: false,
    },
    {
      id: 2,
      sender: "me",
      content: "收到，请继续监控",
      time: "15:35",
      isOwn: true,
    },
    {
      id: 3,
      sender: "system-admin",
      content: "计划维护将在 02:00 进行。所有系统将暂时离线。",
      time: "15:42",
      isOwn: false,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-slate-900 text-slate-100 p-4">
      <div className="container mx-auto max-w-7xl">
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
                通讯中心
              </h1>
              <p className="text-sm text-slate-400">实时系统通讯与协作</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Chat List */}
          <div className="lg:col-span-4">
            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="搜索对话..."
                    className="bg-slate-800/50 border-slate-700/50"
                    prefix={<Search className="h-4 w-4 text-slate-400" />}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-700/30">
                  {chats.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => setSelectedChat(chat.id)}
                      className={`w-full p-4 flex items-center space-x-3 hover:bg-slate-800/50 transition-colors ${
                        selectedChat === chat.id ? "bg-slate-800/70" : ""
                      }`}
                    >
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={chat.avatar || "/placeholder.svg"} alt={chat.name} />
                          <AvatarFallback className="bg-slate-700 text-cyan-500">{chat.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        {chat.online && (
                          <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-slate-900"></div>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-slate-200">{chat.name}</div>
                          <div className="text-xs text-slate-500">{chat.time}</div>
                        </div>
                        <div className="text-sm text-slate-400 truncate">{chat.lastMessage}</div>
                      </div>
                      {chat.unread > 0 && <Badge className="bg-cyan-500 text-white">{chat.unread}</Badge>}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Window */}
          <div className="lg:col-span-8">
            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm h-[600px] flex flex-col">
              {/* Chat Header */}
              <CardHeader className="border-b border-slate-700/50 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src="/placeholder.svg?height=40&width=40" alt="系统管理员" />
                      <AvatarFallback className="bg-slate-700 text-cyan-500">系</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-slate-200">系统管理员</div>
                      <div className="text-xs text-green-400">在线</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-100">
                      <Phone className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-100">
                      <Video className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-100">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        msg.isOwn ? "bg-cyan-600 text-white" : "bg-slate-800/50 text-slate-200"
                      }`}
                    >
                      <div className="text-sm">{msg.content}</div>
                      <div className={`text-xs mt-1 ${msg.isOwn ? "text-cyan-200" : "text-slate-500"}`}>{msg.time}</div>
                    </div>
                  </div>
                ))}
              </CardContent>

              {/* Message Input */}
              <div className="border-t border-slate-700/50 p-4">
                <div className="flex items-center space-x-2">
                  <Textarea
                    placeholder="输入消息..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="bg-slate-800/50 border-slate-700/50 resize-none"
                    rows={1}
                  />
                  <Button className="bg-cyan-600 hover:bg-cyan-700">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
