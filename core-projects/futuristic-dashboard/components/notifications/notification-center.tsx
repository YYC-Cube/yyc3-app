"use client"

import { useState } from "react"
import { Bell, Check, Trash2, Settings, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useNotifications } from "@/hooks/use-notifications"
import type { Notification, NotificationType } from "@/lib/notifications/notification-types"

export function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAll } = useNotifications()
  const [filter, setFilter] = useState<"all" | "unread">("all")

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.read
    return true
  })

  const getNotificationIcon = (type: NotificationType) => {
    const icons = {
      info: "ℹ️",
      success: "✓",
      warning: "⚠️",
      error: "✕",
      system: "⚙️",
      user: "👤",
      alert: "🔔",
    }
    return icons[type] || "ℹ️"
  }

  const getNotificationColor = (type: NotificationType) => {
    const colors = {
      info: "bg-blue-500/20 text-blue-400 border-blue-500/50",
      success: "bg-green-500/20 text-green-400 border-green-500/50",
      warning: "bg-amber-500/20 text-amber-400 border-amber-500/50",
      error: "bg-red-500/20 text-red-400 border-red-500/50",
      system: "bg-purple-500/20 text-purple-400 border-purple-500/50",
      user: "bg-cyan-500/20 text-cyan-400 border-cyan-500/50",
      alert: "bg-orange-500/20 text-orange-400 border-orange-500/50",
    }
    return colors[type] || colors.info
  }

  const formatTime = (date: Date | null) => {
    if (!date) return "刚刚";
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-slate-100">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-cyan-500 text-white text-xs">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[400px] bg-slate-900 border-slate-700 p-0">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-cyan-500" />
            <h3 className="font-semibold text-slate-100">通知中心</h3>
            {unreadCount > 0 && (
              <Badge variant="outline" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50">
                {unreadCount} 条未读
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-slate-100"
              onClick={markAllAsRead}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-slate-100"
              onClick={clearAll}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-100">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full" onValueChange={(v) => setFilter(v as "all" | "unread")}>
          <TabsList className="w-full bg-slate-800/50 p-1 rounded-none border-b border-slate-700">
            <TabsTrigger value="all" className="flex-1 data-[state=active]:bg-slate-700">
              全部 ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex-1 data-[state=active]:bg-slate-700">
              未读 ({unreadCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="m-0">
            <ScrollArea className="h-[400px]">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[400px] text-slate-500">
                  <Bell className="h-12 w-12 mb-2 opacity-50" />
                  <p className="text-sm">暂无通知</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  {filteredNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onDelete={deleteNotification}
                      getNotificationIcon={getNotificationIcon}
                      getNotificationColor={getNotificationColor}
                      formatTime={formatTime}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="unread" className="m-0">
            <ScrollArea className="h-[400px]">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[400px] text-slate-500">
                  <Check className="h-12 w-12 mb-2 opacity-50" />
                  <p className="text-sm">没有未读通知</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  {filteredNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onDelete={deleteNotification}
                      getNotificationIcon={getNotificationIcon}
                      getNotificationColor={getNotificationColor}
                      formatTime={formatTime}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  getNotificationIcon,
  getNotificationColor,
  formatTime,
}: {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
  getNotificationIcon: (type: NotificationType) => string
  getNotificationColor: (type: NotificationType) => string
  formatTime: (date: Date | null) => string
}) {
  return (
    <div
      className={`p-4 hover:bg-slate-800/50 transition-colors ${!notification.read ? "bg-slate-800/30" : ""}`}
      onClick={() => !notification.read && onMarkAsRead(notification.id)}
    >
      <div className="flex items-start space-x-3">
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getNotificationColor(notification.type)}`}
        >
          <span className="text-sm">{getNotificationIcon(notification.type)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <div className="font-medium text-slate-200 text-sm">{notification.title}</div>
            {!notification.read && <div className="flex-shrink-0 w-2 h-2 rounded-full bg-cyan-500 ml-2"></div>}
          </div>
          <p className="text-xs text-slate-400 mb-2">{notification.message}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">{formatTime(notification.timestamp)}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-slate-500 hover:text-red-400"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(notification.id)
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
