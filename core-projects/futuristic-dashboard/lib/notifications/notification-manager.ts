/**
 * 通知管理器 - 处理通知的创建、存储和分发
 */

import type { Notification } from "./notification-types"

class NotificationManager {
  private notifications: Notification[] = []
  private listeners: Set<(notifications: Notification[]) => void> = new Set()
  private unreadCount = 0
  private isClient = false

  constructor() {
    this.isClient = typeof window !== "undefined"

    // 初始化一些示例通知
    if (this.isClient) {
      this.addNotification({
        type: "system",
        priority: "medium",
        title: "系统更新",
        message: "新版本 v2.4.5 已准备就绪，建议在非高峰时段更新",
      })

      this.addNotification({
        type: "warning",
        priority: "high",
        title: "CPU 使用率警告",
        message: "CPU 使用率持续超过 85%，建议检查系统负载",
      })

      this.addNotification({
        type: "success",
        priority: "low",
        title: "备份完成",
        message: "系统数据已成功备份到远程存储",
      })
    }
  }

  addNotification(data: Omit<Notification, "id" | "timestamp" | "read">) {
    const notification: Notification = {
      ...data,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    }

    this.notifications.unshift(notification)
    this.unreadCount++

    // 限制通知数量
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100)
    }

    this.notifyListeners()

    // 如果是高优先级，触发浏览器通知
    if (notification.priority === "urgent" || notification.priority === "high") {
      this.showBrowserNotification(notification)
    }

    return notification
  }

  markAsRead(notificationId: string) {
    const notification = this.notifications.find((n) => n.id === notificationId)
    if (notification && !notification.read) {
      notification.read = true
      this.unreadCount = Math.max(0, this.unreadCount - 1)
      this.notifyListeners()
    }
  }

  markAllAsRead() {
    this.notifications.forEach((n) => {
      n.read = true
    })
    this.unreadCount = 0
    this.notifyListeners()
  }

  deleteNotification(notificationId: string) {
    const index = this.notifications.findIndex((n) => n.id === notificationId)
    if (index !== -1) {
      const notification = this.notifications[index]
      if (!notification.read) {
        this.unreadCount = Math.max(0, this.unreadCount - 1)
      }
      this.notifications.splice(index, 1)
      this.notifyListeners()
    }
  }

  clearAll() {
    this.notifications = []
    this.unreadCount = 0
    this.notifyListeners()
  }

  getNotifications() {
    return this.notifications
  }

  getUnreadCount() {
    return this.unreadCount
  }

  subscribe(listener: (notifications: Notification[]) => void) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => {
      listener([...this.notifications])
    })
  }

  private showBrowserNotification(notification: Notification) {
    if (!this.isClient) return

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(notification.title, {
        body: notification.message,
        icon: "/favicon.ico",
        tag: notification.id,
      })
    }
  }

  requestPermission() {
    if (!this.isClient) return

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }
}

export const notificationManager = new NotificationManager()
