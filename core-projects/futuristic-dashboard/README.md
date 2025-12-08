# ![星云操作系统徽标](public/github.png)  
# 星云操作系统 - 企业级 AI 智能管理平台

<p align="center">
  <img src="public/github.png" alt="星云操作系统 Logo" width="120" />
</p>

<p align="center">
  <strong>星云操作系统 - 企业级 AI 智能管理平台</strong><br/>
  <em>万象归元于云枢，深栈智启新纪元。</em>
</p>

<p align="center">
  <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-16-blue?logo=next.js" alt="Next.js 16" /></a>
  <a href="https://react.dev"><img src="https://img.shields.io/badge/React-19.2-blue?logo=react" alt="React 19.2" /></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript" alt="TypeScript 5.0" /></a>
  <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/TailwindCSS-3.3-blue?logo=tailwindcss" alt="Tailwind CSS" /></a>
  <a href="https://github.com/shadcn/ui"><img src="https://img.shields.io/badge/shadcn/ui-组件库-blueviolet" alt="shadcn/ui" /></a>
  <a href="https://github.com/YYC-Cube/yyc3-Futuristic-Dashboard"><img src="https://img.shields.io/github/stars/YYC-Cube/yyc3-Futuristic-Dashboard?style=social" alt="GitHub Stars" /></a>
</p>

<p align="center">
  <a href="https://vercel.com"><img src="https://img.shields.io/badge/部署-Vercel-black?logo=vercel" alt="Vercel" /></a>
  <a href="#"><img src="https://img.shields.io/badge/环境变量-已配置-green" alt="Env Ready" /></a>
  <a href="#"><img src="https://img.shields.io/badge/权限系统-RBAC-orange" alt="RBAC" /></a>
  <a href="#"><img src="https://img.shields.io/badge/AI引擎-已集成-brightgreen" alt="AI Engine" /></a>
  <a href="#"><img src="https://img.shields.io/badge/响应式-移动端支持-blue" alt="Responsive" /></a>
  <a href="#"><img src="https://img.shields.io/badge/语言-中文支持-red" alt="中文支持" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="MIT License" /></a>
</p>


📦 项目特性

### 核心功能

- **AI 智能分析引擎** - 实时数据预测、异常检测和智能建议
- **多租户权限管理** - 基于 RBAC 的细粒度权限控制系统
- **高级数据可视化** - 5种专业图表组件（折线图、热力图、径向图、区域图、仪表盘）
- **实时协作通知** - 通知中心、活动流、团队在线状态
- **全平台响应式** - 完美适配桌面端和移动端
- **完整中文支持** - 所有界面和提示均为中文

🧱 技术栈

- **框架**: Next.js 16 (App Router)
- **UI 库**: React 19.2
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **组件库**: shadcn/ui
- **图标**: Lucide React
- **动画**: Framer Motion (可选)

📁 项目结构

\`\`\`
├── app/                          # Next.js App Router 页面
│   ├── layout.tsx               # 全局布局（包含 AuthProvider）
│   ├── page.tsx                 # 主页（仪表板）
│   ├── analytics/               # 数据分析页面
│   ├── communications/          # 通讯中心页面
│   ├── console/                 # 系统控制台页面
│   ├── data-center/            # 数据中心页面
│   ├── network/                # 网络监控页面
│   ├── security/               # 安全防护页面
│   └── settings/               # 系统设置页面
├── components/                  # React 组件
│   ├── ai-insights-panel.tsx   # AI 洞察面板
│   ├── auth/                   # 权限管理组件
│   │   ├── auth-context.tsx    # 权限上下文
│   │   ├── auth-guard.tsx      # 路由守卫
│   │   ├── permission-gate.tsx # 权限门控
│   │   ├── user-management-panel.tsx
│   │   ├── role-permissions-panel.tsx
│   │   └── tenant-selector.tsx
│   ├── charts/                 # 高级图表组件
│   │   ├── advanced-line-chart.tsx
│   │   ├── area-comparison-chart.tsx
│   │   ├── charts-dashboard.tsx
│   │   ├── heatmap-chart.tsx
│   │   ├── radial-progress-chart.tsx
│   │   └── real-time-gauge.tsx
│   ├── collaboration/          # 协作组件
│   │   ├── activity-feed.tsx
│   │   └── team-presence.tsx
│   ├── mobile/                 # 移动端组件
│   │   ├── mobile-bottom-nav.tsx
│   │   ├── mobile-metric-card.tsx
│   │   ├── mobile-nav.tsx
│   │   └── mobile-stats-grid.tsx
│   ├── notifications/          # 通知组件
│   │   └── notification-center.tsx
│   └── ui/                     # shadcn/ui 基础组件
├── lib/                        # 工具库和业务逻辑
│   ├── ai-engine.ts           # AI 分析引擎
│   ├── auth/                  # 权限管理逻辑
│   │   ├── types.ts           # 类型定义
│   │   ├── permissions.ts     # 权限验证
│   │   └── auth-context.tsx   # 权限上下文
│   ├── chart-data-generator.ts # 图表数据生成器
│   ├── notifications/         # 通知系统
│   │   ├── notification-types.ts
│   │   └── notification-manager.ts
│   └── utils.ts               # 工具函数
├── hooks/                     # React Hooks
│   ├── use-ai-analysis.ts    # AI 分析 Hook
│   ├── use-mobile.ts         # 移动端检测 Hook
│   └── use-notifications.ts  # 通知 Hook
├── dashboard.tsx             # 主仪表板组件
└── public/                   # 静态资源
\`\`\`

🚀 快速开始

### 安装依赖

\`\`\`bash
npm install
# 或
yarn install
# 或
pnpm install
\`\`\`

### 开发环境运行

\`\`\`bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
\`\`\`

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 生产构建

\`\`\`bash
npm run build
npm run start
\`\`\`

🔍 功能模块详解

### 1. AI 智能分析引擎

位置: `lib/ai-engine.ts`, `hooks/use-ai-analysis.ts`, `components/ai-insights-panel.tsx`

**功能:**
- 时间序列预测（移动平均算法）
- 异常检测（Z-score 统计方法）
- 趋势分析（线性回归）
- 智能建议生成

**使用示例:**
\`\`\`typescript
import { useAIAnalysis } from '@/hooks/use-ai-analysis'

const { predictions, anomalies, recommendations, runAnalysis } = useAIAnalysis()

// 运行分析
runAnalysis({
  cpu: 42,
  memory: 68,
  network: 92,
  security: 75
})
\`\`\`

### 2. 权限管理系统

位置: `lib/auth/`, `components/auth/`

**角色层级:**
- 超级管理员 (super_admin)
- 管理员 (admin)
- 经理 (manager)
- 操作员 (operator)
- 查看者 (viewer)

**权限类型:**
- view:dashboard - 查看仪表板
- view:analytics - 查看数据分析
- view:data - 查看数据中心
- view:network - 查看网络监控
- view:security - 查看安全防护
- view:ai-insights - 查看 AI 洞察
- manage:users - 管理用户
- manage:roles - 管理角色
- manage:settings - 管理系统设置
- manage:resources - 管理资源分配
- execute:commands - 执行系统命令
- export:data - 导出数据

**使用示例:**
\`\`\`typescript
import { useAuth } from '@/lib/auth/auth-context'
import { PermissionGate } from '@/components/auth/permission-gate'

// 在组件中使用
const { user, hasPermission } = useAuth()

// 条件渲染
{hasPermission('manage:users') && <UserManagementPanel />}

// 使用权限门控组件
<PermissionGate permission="view:analytics">
  <AnalyticsContent />
</PermissionGate>
\`\`\`

### 3. 高级数据可视化

位置: `components/charts/`

**图表类型:**
- **高级折线图** - 带渐变填充的时间序列图表
- **热力图** - 24小时活动热力分析
- **径向进度图** - 多指标环形展示
- **区域对比图** - 多数据系列对比分析
- **实时仪表盘** - 动画过渡的实时指标

**使用示例:**
\`\`\`typescript
import { RealTimeGauge } from '@/components/charts/real-time-gauge'

<RealTimeGauge 
  value={cpuUsage} 
  max={100} 
  label="CPU" 
  color="cyan" 
  size="medium" 
/>
\`\`\`

### 4. 实时通知系统

位置: `lib/notifications/`, `components/notifications/`

**通知类型:**
- info - 信息通知
- success - 成功通知
- warning - 警告通知
- error - 错误通知
- system - 系统通知

**优先级:**
- low - 低优先级
- medium - 中优先级
- high - 高优先级
- urgent - 紧急

**使用示例:**
\`\`\`typescript
import { useNotifications } from '@/hooks/use-notifications'

const { notifications, addNotification, markAsRead } = useNotifications()

// 添加通知
addNotification({
  title: '系统更新',
  message: '新版本已准备好安装',
  type: 'info',
  priority: 'medium'
})
\`\`\`

### 5. 移动端适配

位置: `components/mobile/`, `hooks/use-mobile.ts`

**移动端组件:**
- MobileNav - 侧边抽屉导航
- MobileBottomNav - 底部标签栏
- MobileMetricCard - 优化的指标卡片
- MobileStatsGrid - 统计数据网格

**使用示例:**
\`\`\`typescript
import { useMobile } from '@/hooks/use-mobile'

const isMobile = useMobile()

{isMobile ? <MobileView /> : <DesktopView />}
\`\`\`

## 页面路由

| 路由 | 页面 | 权限要求 |
|------|------|----------|
| `/` | 主仪表板 | view:dashboard |
| `/analytics` | 数据分析 | view:analytics |
| `/data-center` | 数据中心 | view:data |
| `/network` | 网络监控 | view:network |
| `/security` | 安全防护 | view:security |
| `/console` | 系统控制台 | execute:commands |
| `/communications` | 通讯中心 | 无 |
| `/settings` | 系统设置 | manage:settings |

## 环境变量

查看 `.env.example` 文件了解所需的环境变量配置。

## 自定义配置

### 修改主题颜色

编辑 `app/globals.css` 中的 CSS 变量:

\`\`\`css
:root {
  --background: 0 0% 0%;
  --foreground: 210 40% 98%;
  --primary: 189 94% 43%;
  --primary-foreground: 0 0% 100%;
  /* ... 更多颜色变量 */
}
\`\`\`

### 添加新的权限

1. 在 `lib/auth/types.ts` 中添加新的权限类型
2. 在 `lib/auth/permissions.ts` 中更新角色权限映射
3. 使用 `PermissionGate` 组件保护相关 UI

🧭 页面路由

路由	页面	权限要求
/	主仪表板	view:dashboard
/analytics	数据分析	view:analytics
/data-center	数据中心	view:data
/network	网络监控	view:network
/security	安全防护	view:security
/console	系统控制台	execute:commands
/communications	通讯中心	无
/settings	系统设置	manage:settings


🧪 性能优化

- 使用 React Server Components 减少客户端 JavaScript
- 图表组件使用 Canvas API 实现高性能渲染
- 移动端使用专用组件优化性能
- 使用 `useCallback` 和 `useMemo` 优化重渲染
- 懒加载非关键组件

🌐 浏览器支持

- Chrome (最新版本)
- Firefox (最新版本)
- Safari (最新版本)
- Edge (最新版本)

🤝 贡献指南
Fork 仓库：https://github.com/YYC-Cube/yyc3-Futuristic-Dashboard.git

创建分支

提交更改

开启 Pull Request

📜 许可证

本项目采用 MIT 许可证。

📮 技术支持

如有问题或建议，请通过以下方式联系:

提交 Issue
联系邮箱：admin@0379.email
查看项目文档

🕘 更新日志

### v1.0.0 (2025-01-25)

- 初始版本发布
- 完整的 AI 智能分析引擎
- 多租户权限管理系统
- 5种高级数据可视化组件
- 实时协作与通知系统
- 全平台响应式支持
- 完整中文本地化

---

**星云操作系统** - 打造下一代企业级智能管理平台
