# API 文档

## Hooks API

### useAuth

用户认证和权限管理 Hook。

\`\`\`typescript
import { useAuth } from '@/lib/auth/auth-context'

const {
  user,              // 当前用户信息
  tenant,            // 当前租户信息
  hasPermission,     // 权限检查函数
  hasAnyPermission,  // 多权限检查函数
  login,             // 登录函数
  logout,            // 登出函数
  switchTenant       // 切换租户函数
} = useAuth()
\`\`\`

**类型定义:**
\`\`\`typescript
interface User {
  id: string
  name: string
  email: string
  role: Role
  avatar?: string
  tenantId: string
}

type Role = 'super_admin' | 'admin' | 'manager' | 'operator' | 'viewer'

type Permission = 
  | 'view:dashboard'
  | 'view:analytics'
  | 'view:data'
  | 'view:network'
  | 'view:security'
  | 'view:ai-insights'
  | 'manage:users'
  | 'manage:roles'
  | 'manage:settings'
  | 'manage:resources'
  | 'execute:commands'
  | 'export:data'
\`\`\`

### useAIAnalysis

AI 智能分析 Hook。

\`\`\`typescript
import { useAIAnalysis } from '@/hooks/use-ai-analysis'

const {
  predictions,      // 预测结果数组
  anomalies,        // 异常检测结果数组
  recommendations,  // 智能建议数组
  isAnalyzing,      // 分析状态
  runAnalysis       // 执行分析函数
} = useAIAnalysis()
\`\`\`

**使用示例:**
\`\`\`typescript
// 运行分析
runAnalysis({
  cpu: 42,
  memory: 68,
  network: 92,
  security: 75
})

// 访问结果
predictions.forEach(pred => {
  console.log(`${pred.metric}: ${pred.value}`)
})
\`\`\`

### useNotifications

通知系统 Hook。

\`\`\`typescript
import { useNotifications } from '@/hooks/use-notifications'

const {
  notifications,     // 通知列表
  unreadCount,       // 未读数量
  addNotification,   // 添加通知
  markAsRead,        // 标记已读
  markAllAsRead,     // 全部标记已读
  deleteNotification,// 删除通知
  clearAll           // 清空所有
} = useNotifications()
\`\`\`

**通知类型:**
\`\`\`typescript
interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error' | 'system'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  timestamp: Date
  read: boolean
  actionUrl?: string
  actionLabel?: string
}
\`\`\`

### useMobile

移动端检测 Hook。

\`\`\`typescript
import { useMobile } from '@/hooks/use-mobile'

const isMobile = useMobile()

// 条件渲染
{isMobile ? <MobileView /> : <DesktopView />}
\`\`\`

## 组件 API

### PermissionGate

权限门控组件，用于条件渲染需要特定权限的内容。

\`\`\`typescript
import { PermissionGate } from '@/components/auth/permission-gate'

<PermissionGate permission="view:analytics">
  <AnalyticsContent />
</PermissionGate>

// 多权限（任一满足）
<PermissionGate permissions={['manage:users', 'manage:roles']}>
  <AdminPanel />
</PermissionGate>

// 自定义无权限提示
<PermissionGate 
  permission="manage:settings"
  fallback={<div>您没有权限访问此功能</div>}
>
  <SettingsPanel />
</PermissionGate>
\`\`\`

**Props:**
\`\`\`typescript
interface PermissionGateProps {
  permission?: Permission
  permissions?: Permission[]
  fallback?: React.ReactNode
  children: React.ReactNode
}
\`\`\`

### AIInsightsPanel

AI 洞察面板组件。

\`\`\`typescript
import { AIInsightsPanel } from '@/components/ai-insights-panel'

<AIInsightsPanel
  predictions={predictions}
  anomalies={anomalies}
  recommendations={recommendations}
/>
\`\`\`

**Props:**
\`\`\`typescript
interface AIInsightsPanelProps {
  predictions: Prediction[]
  anomalies: Anomaly[]
  recommendations: Recommendation[]
}

interface Prediction {
  metric: string
  value: number
  confidence: number
  trend: 'up' | 'down' | 'stable'
}

interface Anomaly {
  metric: string
  value: number
  threshold: number
  severity: 'low' | 'medium' | 'high'
  timestamp: Date
}

interface Recommendation {
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  action?: string
}
\`\`\`

### RealTimeGauge

实时仪表盘组件。

\`\`\`typescript
import { RealTimeGauge } from '@/components/charts/real-time-gauge'

<RealTimeGauge
  value={75}
  max={100}
  label="CPU 使用率"
  color="cyan"
  size="medium"
/>
\`\`\`

**Props:**
\`\`\`typescript
interface RealTimeGaugeProps {
  value: number
  max: number
  label: string
  color?: 'cyan' | 'purple' | 'blue' | 'green' | 'red'
  size?: 'small' | 'medium' | 'large'
  showValue?: boolean
  unit?: string
}
\`\`\`

### NotificationCenter

通知中心组件。

\`\`\`typescript
import { NotificationCenter } from '@/components/notifications/notification-center'

<NotificationCenter />
\`\`\`

该组件自动连接到通知系统，无需额外配置。

## 工具函数 API

### AI Engine

\`\`\`typescript
import { 
  predictTimeSeries,
  detectAnomalies,
  analyzeTrend,
  generateRecommendations 
} from '@/lib/ai-engine'

// 时间序列预测
const prediction = predictTimeSeries(historicalData, 5)

// 异常检测
const anomalies = detectAnomalies(dataPoints, 2.0)

// 趋势分析
const trend = analyzeTrend(dataPoints)

// 生成建议
const recommendations = generateRecommendations(metrics)
\`\`\`

### 权限检查

\`\`\`typescript
import { hasPermission, hasAnyPermission } from '@/lib/auth/permissions'

// 单个权限检查
const canView = hasPermission(user, 'view:analytics')

// 多个权限检查（任一满足）
const canManage = hasAnyPermission(user, ['manage:users', 'manage:roles'])
\`\`\`

### 图表数据生成

\`\`\`typescript
import {
  generateTimeSeriesData,
  generateHeatmapData,
  generateMetricsData
} from '@/lib/chart-data-generator'

// 生成时间序列数据
const timeData = generateTimeSeriesData(24, 0, 100)

// 生成热力图数据
const heatData = generateHeatmapData(7, 24)

// 生成指标数据
const metrics = generateMetricsData(['cpu', 'memory', 'network'])
\`\`\`

## 类型定义

### 用户和权限

\`\`\`typescript
// 用户类型
interface User {
  id: string
  name: string
  email: string
  role: Role
  avatar?: string
  tenantId: string
  createdAt: Date
  lastLogin?: Date
}

// 角色类型
type Role = 'super_admin' | 'admin' | 'manager' | 'operator' | 'viewer'

// 权限类型
type Permission = 
  | 'view:dashboard'
  | 'view:analytics'
  | 'view:data'
  | 'view:network'
  | 'view:security'
  | 'view:ai-insights'
  | 'manage:users'
  | 'manage:roles'
  | 'manage:settings'
  | 'manage:resources'
  | 'execute:commands'
  | 'export:data'

// 租户类型
interface Tenant {
  id: string
  name: string
  plan: 'free' | 'pro' | 'enterprise'
  createdAt: Date
}
\`\`\`

### AI 分析

\`\`\`typescript
// 预测结果
interface Prediction {
  metric: string
  value: number
  confidence: number
  trend: 'up' | 'down' | 'stable'
  timestamp: Date
}

// 异常检测
interface Anomaly {
  metric: string
  value: number
  threshold: number
  severity: 'low' | 'medium' | 'high'
  timestamp: Date
  description: string
}

// 智能建议
interface Recommendation {
  id: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  action?: string
  category: 'performance' | 'security' | 'optimization'
}
\`\`\`

### 通知

\`\`\`typescript
// 通知类型
interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error' | 'system'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  timestamp: Date
  read: boolean
  actionUrl?: string
  actionLabel?: string
  metadata?: Record<string, any>
}

// 通知配置
interface NotificationConfig {
  enableSound?: boolean
  enableBrowserNotification?: boolean
  maxNotifications?: number
  autoMarkReadAfter?: number
}
\`\`\`

## 事件系统

### 通知事件

\`\`\`typescript
// 订阅通知更新
const unsubscribe = NotificationManager.getInstance().subscribe((notifications) => {
  console.log('通知更新:', notifications)
})

// 取消订阅
unsubscribe()
\`\`\`

### 自定义事件

\`\`\`typescript
// 发送自定义事件
window.dispatchEvent(new CustomEvent('system:update', {
  detail: { version: '1.0.1' }
}))

// 监听自定义事件
window.addEventListener('system:update', (event) => {
  console.log('系统更新:', event.detail)
})
\`\`\`

---

本 API 文档涵盖了系统的主要接口和使用方法。更多详细信息请参考源代码注释。
