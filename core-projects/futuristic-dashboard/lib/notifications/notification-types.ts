/**
 * 实时通知系统 - 类型定义
 */

export type NotificationType = "info" | "success" | "warning" | "error" | "system" | "user" | "alert"

export type NotificationPriority = "low" | "medium" | "high" | "urgent"

export interface Notification {
  id: string
  type: NotificationType
  priority: NotificationPriority
  title: string
  message: string
  timestamp: Date
  read: boolean
  actionUrl?: string
  actionLabel?: string
  metadata?: Record<string, any>
  userId?: string
  userName?: string
  userAvatar?: string
}

export interface NotificationSettings {
  enabled: boolean
  sound: boolean
  desktop: boolean
  email: boolean
  types: {
    [key in NotificationType]: boolean
  }
}
