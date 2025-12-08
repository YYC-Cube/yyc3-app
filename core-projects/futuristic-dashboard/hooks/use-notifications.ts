"use client"

import { useState, useEffect } from "react"
import { notificationManager } from "@/lib/notifications/notification-manager"
import type { Notification } from "@/lib/notifications/notification-types"

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // 初始化
    setNotifications(notificationManager.getNotifications())
    setUnreadCount(notificationManager.getUnreadCount())

    // 订阅更新
    const unsubscribe = notificationManager.subscribe((updatedNotifications) => {
      setNotifications(updatedNotifications)
      setUnreadCount(notificationManager.getUnreadCount())
    })

    return unsubscribe
  }, [])

  return {
    notifications,
    unreadCount,
    addNotification: notificationManager.addNotification.bind(notificationManager),
    markAsRead: notificationManager.markAsRead.bind(notificationManager),
    markAllAsRead: notificationManager.markAllAsRead.bind(notificationManager),
    deleteNotification: notificationManager.deleteNotification.bind(notificationManager),
    clearAll: notificationManager.clearAll.bind(notificationManager),
    requestPermission: notificationManager.requestPermission.bind(notificationManager),
  }
}
