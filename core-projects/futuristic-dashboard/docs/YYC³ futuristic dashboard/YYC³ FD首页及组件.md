# YYC³ futuristic dashboard

/**
 * @file README.md
 * @description YYC³ 智能行业平台部署说明（阿里云服务器 + Nginx 代理 + Vercel 项目集成）
 * @author YYC³
 * @version 1.0.0
 * @created 2025-10-15
 */

# YYC³ 智能行业平台部署说明

## 📍 服务器信息
- 云服务商：阿里云
- 公网 IP：`8.152.195.33`
- 操作系统：Alibaba Cloud Linux / Ubuntu
- Web 服务：Nginx + Docker（可选）

## 🌐 主域名与子域名解析

### 主域名
- `0379.world` → 解析至 `8.152.195.33`
- 用于部署仪表盘项目（Next.js）

### 子域名（行业项目代理）
所有子域名均解析至同一 IP，并由 Nginx 代理至 Vercel 项目或自定义域：

| 子域名             | 对应项目地址（Vercel 或自定义）         |
|--------------------|------------------------------------------|
| yyc3-agr.0379.world | https://yyc3-agr.vercel.app              |
| yyc3-fb.0379.world  | https://yyc3-fb.vercel.app               |
| yyc3-fn.0379.world  | https://yyc3-fn.vercel.app               |
| yyc3-gov.0379.world | https://yyc3-gov.vercel.app              |
| yyc3-hr.0379.world  | https://yyc3-hr.vercel.app               |
| yyc3-med.0379.world | https://yyc3-med.vercel.app              |
| yyc3-media.0379.world | https://yyc3-media.vercel.app          |
| yyc3-manu.0379.world | https://yyc3-manu.vercel.app            |
| yyc3-core.0379.world | https://yyc3-core.vercel.app            |
| yyc3-cultural.0379.world | https://yyc3-cultural.vercel.app     |
| yyc3-edu.0379.world | https://yyc3-edu.vercel.app              |
| yyc3-energy.0379.world | https://yyc3-energy.vercel.app         |
| yyc3-env.0379.world | https://yyc3-env.vercel.app              |
| yyc3-law.0379.world | https://yyc3-law.vercel.app              |
| yyc3-log.0379.world | https://yyc3-log.vercel.app              |
| yyc3-ent.0379.world | https://yyc3-ent.vercel.app              |
| yyc3-real.0379.world | https://yyc3-real.vercel.app            |
| yyc3-retail.0379.world | https://yyc3-retail.vercel.app         |
| yyc3-traffic.0379.world | https://yyc3-traffic.vercel.app       |
| yyc3-tourism.0379.world | https://yyc3-tourism.vercel.app       |
| yyc3-elder.0379.world | https://yyc3-elder.vercel.app          |
| yyc3-api.0379.world | https://yyc3-api.vercel.app              |
| yyc3-dc.0379.world  | https://yyc3-dc.vercel.app               |
| yyc3-finance.0379.world | https://yyc3-finance.vercel.app       |
| yyc3-cdc.0379.world | https://yyc3-cdc.vercel.app              |
| yyc3-edc.0379.world | https://yyc3-edc.vercel.app              |
| yyc3-Edge.0379.world | https://yyc3-edge.vercel.app            |
| yyc3-edu-basic.0379.world | https://yyc3-edu-basic.vercel.app   |
| yyc3-edu-higher.0379.world | https://yyc3-edu-higher.vercel.app |

> 所有子域名需在阿里云 DNS 控制台中添加 A 记录，指向 `8.152.195.33`

---

## 🧱 Nginx 配置建议

每个子域名配置一个 `server` 块，代理至对应 Vercel 项目：

```nginx
server {
    listen 80;
    server_name yyc3-agr.0379.world;
    location / {
        proxy_pass https://yyc3-agr.vercel.app;
    }
}

## 主域名仪表盘项目：

nginx

server {
    listen 80;
    server_name 0379.world;
    location / {
        proxy_pass http://127.0.0.1:3000; # Next.js 仪表盘项目
    }
}

## 📦 仪表盘项目部署

### 项目框架：Next.js + Tailwind + TypeScript

启动方式：Docker 或 Node.js

端口：默认 3333

功能：展示所有行业入口、状态、评分、AI模型等

————————————————————————————————————————————

## 📝 `app/industries/page.tsx` 中构建了行业详情页，现在生成一个 **行业导航组件**，用于首页或仪表盘中展示所有行业卡片，并支持点击跳转到 `/industries/[id]` 的详情页。

---

## ✅ 行业导航组件：`app/industries-list/page.tsx`

```tsx
/**
 * @file industries-list/page.tsx
 * @description 行业导航组件，用于展示所有行业卡片并跳转至详情页（/industries/[id]），适用于仪表盘首页集成入口展示模块
 * @author YYC³
 * @version 1.0.0
 * @created 2025-10-15
 */

"use client"

import Link from "next/link"
import { getAllIndustries } from "@/lib/data/industry-loader"

export default function IndustriesListPage() {
  const industries = getAllIndustries()

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-blue-400">行业导航中心</h1>
        <p className="text-slate-400">点击进入对应行业详情页，查看五高评分、AI模型与核心指标</p>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-6">
          {industries.map((industry) => (
            <Link
              key={industry.id}
              href={`/industries/${industry.id}`}
              className="bg-slate-900/60 border border-slate-700 rounded-lg p-4 hover:bg-slate-800 transition-all"
            >
              <div className="text-3xl mb-2">{getIndustryIcon(industry.icon)}</div>
              <div className="text-sm font-semibold">{industry.name}</div>
              <div className="text-xs text-slate-400">{industry.code}</div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}

function getIndustryIcon(iconName: string): string {
  const iconMap: Record<string, string> = {
    Sprout: "🌱",
    Utensils: "🍽️",
    TrendingUp: "📈",
    Building2: "🏢",
    Users: "👥",
    Heart: "❤️",
    Film: "🎬",
    Factory: "🏭",
    Code: "💻",
    Palette: "🎨",
    GraduationCap: "🎓",
    Zap: "⚡",
    Leaf: "🍃",
    Scale: "⚖️",
    Truck: "🚚",
    Briefcase: "💼",
    Home: "🏠",
    ShoppingCart: "🛒",
    Car: "🚗",
    Plane: "✈️",
    HeartPulse: "💓",
    Cpu: "🖥️",
    Database: "💾",
    DollarSign: "💰"
  }
  return iconMap[iconName] || "🔷"
}
```

---

## ✨ 特性说明

- ✅ **响应式布局**：支持移动端、平板、桌面端自动适配。
- ✅ **图标渲染**：调用 `getIndustryIcon` 显示 emoji 图标。
- ✅ **跳转逻辑**：点击卡片跳转至 `/industries/[id]` 页面。
- ✅ **数据来源**：调用 `getAllIndustries()`，自动加载 JSON 配置。

---

## 📁 路由建议

可以在仪表盘首页 `/` 中嵌入该组件，或将其作为独立页面 `/industries-list` 使用。也可以在 `app/page.tsx` 中引入：

```tsx
import IndustriesListPage from "./industries-list/page"

export default function Home() {
  return (
    <>
      <IndustriesListPage />
    </>
  )
}
```

---

## **完整版 industries.json 与 industry-loader.ts**

---

## 📄 1. 完整版 `industries.json`

建议路径：`lib/config/industries.json`

```json
/**
 * @file industries.json
 * @description YYC³ 智能行业平台行业分类配置（含中英文名称、缩写、图标、路径），支持动态路由与国际化展示
 * @author YYC³
 * @version 1.0.0
 * @created 2025-10-15
 */

[
  { "id": "yyc3-agr", "name": "智慧农业", "enName": "Smart Agriculture", "code": "AGR", "icon": "Sprout", "path": "/industries/agr" },
  { "id": "yyc3-fb", "name": "餐饮服务", "enName": "Food & Beverage", "code": "FB", "icon": "Utensils", "path": "/industries/fb" },
  { "id": "yyc3-fn", "name": "股票金融", "enName": "Financial Markets", "code": "FN", "icon": "TrendingUp", "path": "/industries/fn" },
  { "id": "yyc3-fin", "name": "金融", "enName": "Traditional Finance", "code": "FIN", "icon": "DollarSign", "path": "/industries/fin" },
  { "id": "yyc3-finance", "name": "金融科技", "enName": "Financial Technology", "code": "FINTECH", "icon": "DollarSign", "path": "/industries/finance" },
  { "id": "yyc3-gov", "name": "智慧城市", "enName": "Smart Government", "code": "GOV", "icon": "Building2", "path": "/industries/gov" },
  { "id": "yyc3-hr", "name": "人力资源", "enName": "Human Resources", "code": "HR", "icon": "Users", "path": "/industries/hr" },
  { "id": "yyc3-med", "name": "医疗健康", "enName": "Healthcare", "code": "MED", "icon": "Heart", "path": "/industries/med" },
  { "id": "yyc3-media", "name": "媒体娱乐", "enName": "Media & Entertainment", "code": "MEDIA", "icon": "Film", "path": "/industries/media" },
  { "id": "yyc3-manu", "name": "智能制造", "enName": "Smart Manufacturing", "code": "MANU", "icon": "Factory", "path": "/industries/manu" },
  { "id": "yyc3-core", "name": "智能编程", "enName": "Intelligent Programming", "code": "CORE", "icon": "Code", "path": "/industries/core" },
  { "id": "yyc3-cultural", "name": "智能文创", "enName": "Cultural Innovation", "code": "CULTURAL", "icon": "Palette", "path": "/industries/cultural" },
  { "id": "yyc3-edu", "name": "智能教育", "enName": "Smart Education", "code": "EDU", "icon": "GraduationCap", "path": "/industries/edu" },
  { "id": "yyc3-edu-basic", "name": "基础教育", "enName": "Basic Education", "code": "EDU-BASIC", "icon": "GraduationCap", "path": "/industries/edu-basic" },
  { "id": "yyc3-edu-higher", "name": "高等教育", "enName": "Higher Education", "code": "EDU-HIGHER", "icon": "GraduationCap", "path": "/industries/edu-higher" },
  { "id": "yyc3-energy", "name": "能源管理", "enName": "Energy Management", "code": "ENERGY", "icon": "Zap", "path": "/industries/energy" },
  { "id": "yyc3-env", "name": "环境保护", "enName": "Environmental Protection", "code": "ENV", "icon": "Leaf", "path": "/industries/env" },
  { "id": "yyc3-law", "name": "法律服务", "enName": "Legal Services", "code": "LAW", "icon": "Scale", "path": "/industries/law" },
  { "id": "yyc3-log", "name": "智慧物流", "enName": "Smart Logistics", "code": "LOG", "icon": "Truck", "path": "/industries/log" },
  { "id": "yyc3-ent", "name": "实体经管", "enName": "Enterprise Operations", "code": "ENT", "icon": "Briefcase", "path": "/industries/ent" },
  { "id": "yyc3-real", "name": "地产建筑", "enName": "Real Estate & Construction", "code": "REAL", "icon": "Home", "path": "/industries/real" },
  { "id": "yyc3-retail", "name": "智慧零售", "enName": "Smart Retail", "code": "RETAIL", "icon": "ShoppingCart", "path": "/industries/retail" },
  { "id": "yyc3-traffic", "name": "智能交通", "enName": "Intelligent Transportation", "code": "TRAFFIC", "icon": "Car", "path": "/industries/traffic" },
  { "id": "yyc3-tourism", "name": "旅游酒店", "enName": "Tourism & Hospitality", "code": "TOURISM", "icon": "Plane", "path": "/industries/tourism" },
  { "id": "yyc3-elder", "name": "智慧养老", "enName": "Elderly Care", "code": "ELDER", "icon": "HeartPulse", "path": "/industries/elder" },
  { "id": "yyc3-api", "name": "技术集成", "enName": "API Integration", "code": "API", "icon": "Cpu", "path": "/industries/api" },
  { "id": "yyc3-cdc", "name": "疾控中心", "enName": "Disease Control Center", "code": "CDC", "icon": "Database", "path": "/industries/cdc" },
  { "id": "yyc3-edc", "name": "教育数据中心", "enName": "Education Data Center", "code": "EDC", "icon": "Database", "path": "/industries/edc" },
  { "id": "yyc3-dc", "name": "数据中心", "enName": "Data Center", "code": "DC", "icon": "Database", "path": "/industries/dc" },
  { "id": "yyc3-Edge", "name": "边缘数据中心", "enName": "Edge Computing Center", "code": "EDGE", "icon": "Database", "path": "/industries/edge" }
]
```

---

## 📄 2. 完整版 `industry-loader.ts`

建议路径：`lib/data/industry-loader.ts`

```ts
/**
 * @file industry-loader.ts
 * @description 行业分类加载器，支持中英文展示与动态评分状态 API 集成，提供统一查询方法与数据封装逻辑
 * @author YYC³
 * @version 1.0.0
 * @created 2025-10-15
 */

import type { Industry } from "@/lib/types/industry"
import industriesData from "@/lib/config/industries.json"

// 获取所有行业
export function getAllIndustries(): Industry[] {
  return industriesData as Industry[]
}

// 根据 ID 获取行业
export function getIndustryById(id: string): Industry | undefined {
  return (industriesData as Industry[]).find((item) => item.id === id)
}

// 动态加载行业评分与状态（模拟 API 调用）
export async function getIndustryScores(id: string) {
  const res = await fetch(`/api/industries/${id}/scores`)
  if (!res.ok) throw new Error("无法获取行业评分")
  return res.json()
}

export async function getIndustryStatus(id: string) {
  const res = await fetch(`/api/industries/${id}/status`)
  if (!res.ok) throw new Error("无法获取行业状态")
  return res.json()
}
```

---

## 📄 3. API 路由示例（Next.js App Router）

 **行业评分 API** 的实现示例，并同时给出 **行业状态 API**，这样前端就能通过 `industry-loader.ts` 动态调用评分与状态数据。

---

## 📄 `app/api/industries/[id]/scores/route.ts`

```ts
/**
 * @file scores/route.ts
 * @description 行业评分 API，返回五高架构评分（高性能、高可用、高安全、高智能、高效率）
 * @author YYC³
 * @version 1.0.0
 * @created 2025-10-15
 */

import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params

  // 模拟评分数据，可替换为数据库或外部服务调用
  const scores = {
    id,
    performance: Math.floor(Math.random() * 20) + 80, // 80-100
    availability: Math.floor(Math.random() * 20) + 75, // 75-95
    security: Math.floor(Math.random() * 20) + 70,     // 70-90
    intelligence: Math.floor(Math.random() * 20) + 85, // 85-100
    efficiency: Math.floor(Math.random() * 20) + 80    // 80-100
  }

  return NextResponse.json(scores)
}
```

---

## 📄 `app/api/industries/[id]/status/route.ts`

```ts
/**
 * @file status/route.ts
 * @description 行业状态 API，返回行业运行状态（在线、异常、维护中等）及更新时间戳
 * @author YYC³
 * @version 1.0.0
 * @created 2025-10-15
 */

import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params

  // 模拟状态数据，可替换为数据库或监控系统调用
  const states = ["online", "warning", "maintenance", "offline"]
  const status = states[Math.floor(Math.random() * states.length)]

  return NextResponse.json({
    id,
    status,
    updatedAt: new Date().toISOString()
  })
}
```

---

## 📄 前端调用示例（在行业详情页中）

```tsx
"use client"

import { useEffect, useState } from "react"

export default function IndustryScores({ id }: { id: string }) {
  const [scores, setScores] = useState<any>(null)
  const [status, setStatus] = useState<any>(null)

  useEffect(() => {
    async function fetchData() {
      const scoresRes = await fetch(`/api/industries/${id}/scores`)
      const statusRes = await fetch(`/api/industries/${id}/status`)
      setScores(await scoresRes.json())
      setStatus(await statusRes.json())
    }
    fetchData()
  }, [id])

  if (!scores || !status) return <p className="text-slate-400">加载中...</p>

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">动态评分与状态</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>高性能: {scores.performance}%</div>
        <div>高可用: {scores.availability}%</div>
        <div>高安全: {scores.security}%</div>
        <div>高智能: {scores.intelligence}%</div>
        <div>高效率: {scores.efficiency}%</div>
      </div>
      <div className="mt-4">
        <span className="font-medium">当前状态:</span> {status.status}  
        <span className="text-xs text-slate-400 ml-2">更新时间 {status.updatedAt}</span>
      </div>
    </div>
  )
}
```

---

## ✨ 整体效果

- **scores API**：返回五高架构评分，前端可实时展示行业健康度。  
- **status API**：返回行业运行状态（在线/异常/维护/离线），前端可动态刷新。  
- **前端调用**：在行业详情页中加载评分与状态，用户可直观查看行业运行情况。  

---

## ✅ 1. 在 `layout.tsx` 中加入 `<head>` 标签内容（SEO + 分享优化）

```tsx
/**
 * @file layout.tsx
 * @description 全局布局，增加 SEO 与分享优化标签，支持主题切换 Provider
 * @author YYC³
 * @version 1.0.0
 * @created 2025-10-15
 */

import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth/auth-context"
import { ThemeProvider } from "@/components/theme-provider" // 示例主题 Provider

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "星云操作系统 - 企业级 AI 智能管理平台",
  description: "基于 AI 的企业级智能管理系统，提供实时监控、预测分析、异常检测和智能建议",
  generator: "v0.app",
  icons: {
    icon: "/favicon.ico",
    apple: "/logo.png",
  },
  openGraph: {
    title: "星云操作系统",
    description: "企业级 AI 智能管理平台",
    url: "https://0379.world",
    siteName: "YYC³ 星云操作系统",
    images: [
      {
        url: "/banner.png",
        width: 1200,
        height: 630,
        alt: "星云操作系统 Banner",
      },
    ],
    locale: "zh_CN",
    type: "website",
  },
}

export function reportWebVitals(metric: any) {
  if (metric.label === "web-vital") {
    console.log("📊 Web Vitals:", metric)
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider defaultTheme="dark" enableSystem>
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
```

---

## ✅ 2. 在 `industries-list/page.tsx` 中加入搜索栏、筛选器、权限过滤器

```tsx
/**
 * @file industries-list/page.tsx
 * @description 行业导航组件，增加搜索栏、筛选器、权限过滤器，提升导航体验与可控性
 * @author YYC³
 * @version 1.0.0
 * @created 2025-10-15
 */

"use client"

import { useState } from "react"
import Link from "next/link"
import { getAllIndustries } from "@/lib/data/industry-loader"
import { PermissionGate } from "@/components/permission-gate"

export default function IndustriesListPage() {
  const industries = getAllIndustries()
  const [search, setSearch] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")

  const filteredIndustries = industries.filter((industry) => {
    const matchSearch =
      industry.name.includes(search) || industry.enName.toLowerCase().includes(search.toLowerCase())
    const matchCategory = filterCategory === "all" || industry.code.startsWith(filterCategory)
    return matchSearch && matchCategory
  })

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-blue-400">行业导航中心</h1>

        {/* 搜索栏与筛选器 */}
        <div className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="搜索行业..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 p-2 rounded bg-slate-800 border border-slate-700"
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="p-2 rounded bg-slate-800 border border-slate-700"
          >
            <option value="all">全部</option>
            <option value="EDU">教育类</option>
            <option value="FIN">金融类</option>
            <option value="DC">数据中心类</option>
          </select>
        </div>

        {/* 行业卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredIndustries.map((industry) => (
            <PermissionGate key={industry.id} permission={industry.code}>
              <Link
                href={`/industries/${industry.id}`}
                className="bg-slate-900/60 border border-slate-700 rounded-lg p-4 hover:bg-slate-800 transition-all"
              >
                <div className="text-3xl mb-2">{getIndustryIcon(industry.icon)}</div>
                <div className="text-sm font-semibold">{industry.name}</div>
                <div className="text-xs text-slate-400">{industry.enName}</div>
              </Link>
            </PermissionGate>
          ))}
        </div>
      </div>
    </main>
  )
}

function getIndustryIcon(iconName: string): string {
  const iconMap: Record<string, string> = {
    Sprout: "🌱",
    Utensils: "🍽️",
    TrendingUp: "📈",
    Building2: "🏢",
    Users: "👥",
    Heart: "❤️",
    Film: "🎬",
    Factory: "🏭",
    Code: "💻",
    Palette: "🎨",
    GraduationCap: "🎓",
    Zap: "⚡",
    Leaf: "🍃",
    Scale: "⚖️",
    Truck: "🚚",
    Briefcase: "💼",
    Home: "🏠",
    ShoppingCart: "🛒",
    Car: "🚗",
    Plane: "✈️",
    HeartPulse: "💓",
    Cpu: "🖥️",
    Database: "💾",
    DollarSign: "💰"
  }
  return iconMap[iconName] || "🔷"
}
```

---

## ✨ 整体效果

- **layout.tsx**：SEO 优化（favicon、viewport、Open Graph），主题切换支持。  
- **industries-list/page.tsx**：搜索栏（模糊匹配）、筛选器（按类别）、权限过滤器（按角色/权限显示）。  
- **用户体验**：首页导航更直观，支持暗色模式，行业入口更可控。  

---

## 把 **动态评分与状态模块**直接集成到现有的 `IndustriesPage` 中，让它和“核心指标”“AI模型”一起展示。下面是完整的增强版代码：

---

## ✅ 增强版 `app/industries/page.tsx`

```tsx
/**
 * @file page.tsx
 * @description 行业详情页，集成核心指标、AI模型、动态评分与状态模块，形成完整的行业监控面板
 * @author YYC³
 * @version 1.0.0
 * @created 2025-10-15
 */

"use client"

import { useState, useEffect } from "react"
import {
  getAllIndustries,
  getIndustryConfig,
  generateIndustryMetrics,
  getIndustryHighScores,
  type IndustryType,
} from "@/lib/industry-adapter"

export default function IndustriesPage() {
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType>("yyc3-dc")
  const industries = getAllIndustries()
  const currentConfig = getIndustryConfig(selectedIndustry)
  const metrics = generateIndustryMetrics(selectedIndustry)
  const highScores = getIndustryHighScores(selectedIndustry)

  // 动态评分与状态
  const [dynamicScores, setDynamicScores] = useState<any>(null)
  const [dynamicStatus, setDynamicStatus] = useState<any>(null)

  useEffect(() => {
    async function fetchData() {
      const scoresRes = await fetch(`/api/industries/${selectedIndustry}/scores`)
      const statusRes = await fetch(`/api/industries/${selectedIndustry}/status`)
      setDynamicScores(await scoresRes.json())
      setDynamicStatus(await statusRes.json())
    }
    fetchData()
  }, [selectedIndustry])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white p-6">
      {/* 头部 */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center gap-3 mb-4">
          <img src="/logo.png" alt="星云操作系统" className="h-12 w-12 object-contain" />
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              星云操作系统 - 24行业AI智能管理平台
            </h1>
            <p className="text-slate-400">基于"五高五标五化"理念的企业级智能管理系统</p>
          </div>
        </div>
      </div>

      {/* 行业选择器 */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">🏢</span>
            选择行业场景
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {industries.map((industry) => (
              <button
                key={industry.id}
                onClick={() => setSelectedIndustry(industry.id)}
                className={`p-4 rounded-lg border transition-all ${
                  selectedIndustry === industry.id
                    ? "bg-blue-600 border-blue-500 shadow-lg shadow-blue-500/50"
                    : "bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800"
                }`}
              >
                <div className="text-2xl mb-2">{getIndustryIcon(industry.icon)}</div>
                <div className="text-sm font-medium">{industry.name}</div>
                <div className="text-xs text-slate-400 mt-1">{industry.code}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 当前行业详情 */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 行业信息 */}
        <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-lg p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="text-5xl">{getIndustryIcon(currentConfig.icon)}</div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{currentConfig.name}</h2>
              <p className="text-slate-400 mb-3">{currentConfig.description}</p>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded-full text-sm">
                  {currentConfig.code}
                </span>
                <span className="px-3 py-1 bg-green-600/20 border border-green-500/30 rounded-full text-sm">
                  {currentConfig.id}
                </span>
              </div>
            </div>
          </div>

          {/* 行业指标 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">核心监控指标</h3>
            <div className="grid grid-cols-2 gap-3">
              {currentConfig.metrics.slice(0, 4).map((metric) => (
                <div key={metric.id} className="bg-slate-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">{metric.name}</span>
                    <span className="text-xs text-slate-500">{metric.category}</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-400">
                    {metrics[metric.id] || 0}
                    <span className="text-sm text-slate-400 ml-1">{metric.unit}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    正常范围: {metric.normalRange[0]}-{metric.normalRange[1]}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI 模型 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">AI 智能模型</h3>
            <div className="space-y-2">
              {currentConfig.aiModels.map((model) => (
                <div key={model.id} className="bg-slate-800/50 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{model.name}</div>
                    <div className="text-xs text-slate-400">类型: {model.type}</div>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs ${
                      model.enabled
                        ? "bg-green-600/20 border border-green-500/30 text-green-400"
                        : "bg-slate-700/50 border border-slate-600 text-slate-400"
                    }`}
                  >
                    {model.enabled ? "已启用" : "未启用"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 动态评分与状态 */}
          <div>
            <h3 className="text-lg font-semibold mb-3">动态评分与状态</h3>
            {!dynamicScores || !dynamicStatus ? (
              <p className="text-slate-400">加载中...</p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>高性能: {dynamicScores.performance}%</div>
                  <div>高可用: {dynamicScores.availability}%</div>
                  <div>高安全: {dynamicScores.security}%</div>
                  <div>高智能: {dynamicScores.intelligence}%</div>
                  <div>高效率: {dynamicScores.efficiency}%</div>
                </div>
                <div className="mt-4">
                  <span className="font-medium">当前状态:</span> {dynamicStatus.status}
                  <span className="text-xs text-slate-400 ml-2">更新时间 {dynamicStatus.updatedAt}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 五高架构评分（静态参考） */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-lg p-6">
         <h3 className="text-lg font-semibold mb-4">五高架构评分（静态参考）</h3>
         <div className="space-y-4">
          {[
          { label: "高性能", value: highScores.performance, color: "blue" },
          { label: "高可用", value: highScores.availability, color: "green" },
          { label: "高安全", value: highScores.security, color: "red" },
          { label: "高智能", value: highScores.intelligence, color: "purple" },
          { label: "高效率", value: highScores.efficiency, color: "yellow" },
        ].map((item) => (
          <div key={item.label}>
            <div className="flex justify-between mb-1">
             <span className="text-sm">{item.label}</span>
             <span className="text-sm font-bold">{item.value}%</span>
            </div>
           <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
             <div
               className={`h-full bg-gradient-to-r from-${item.color}-600   to-${item.color}-400 transition-all duration-500`}
               style={{ width: `${item.value}%` }}
             />
           </div>
          </div>
        ))}
      </div>
    </div>

✅ 整体结构回顾
你现在的 IndustriesPage 页面已经具备以下完整模块：
✅ 行业选择器（24+模块切换）
✅ 行业信息卡片（图标、名称、描述、标识）
✅ 核心监控指标（metric + 正常范围）
✅ AI 智能模型（启用状态）
✅ 动态评分与状态（API集成）
✅ 五高架构评分（静态参考）
✅ 五标体系配置（标准化字段）

## ✅ 图表展示组件（Radar + Bar + Line）

### 📁 文件路径建议  
`components/industry-score-chart.tsx`

---

### 📄 `IndustryScoreChart.tsx`

```tsx
/**
 * @file industry-score-chart.tsx
 * @description 行业评分图表组件，支持雷达图、柱状图、折线图展示五高架构评分，适用于动态与静态数据可视化分析场景
 * @author YYC³
 * @version 1.0.0
 * @created 2025-10-15
 */

"use client"

import { useEffect, useRef } from "react"
import Chart from "chart.js/auto"

export interface ScoreChartProps {
  data: {
    performance: number
    availability: number
    security: number
    intelligence: number
    efficiency: number
  }
  type?: "radar" | "bar" | "line"
  title?: string
}

export function IndustryScoreChart({ data, type = "radar", title = "五高架构评分图表" }: ScoreChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx) return

    const chart = new Chart(ctx, {
      type,
      data: {
        labels: ["高性能", "高可用", "高安全", "高智能", "高效率"],
        datasets: [
          {
            label: "评分 (%)",
            data: [
              data.performance,
              data.availability,
              data.security,
              data.intelligence,
              data.efficiency,
            ],
            backgroundColor: type === "radar" ? "rgba(59,130,246,0.2)" : "rgba(59,130,246,0.6)",
            borderColor: "rgba(59,130,246,1)",
            borderWidth: 2,
            fill: type === "radar",
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: title,
            color: "#fff",
            font: { size: 16 },
          },
          legend: {
            labels: { color: "#ccc" },
          },
        },
        scales: type !== "radar" ? {
          x: { ticks: { color: "#ccc" }, grid: { color: "#333" } },
          y: { ticks: { color: "#ccc" }, grid: { color: "#333" }, beginAtZero: true, max: 100 },
        } : {},
      },
    })

    return () => chart.destroy()
  }, [data, type, title])

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
      <canvas ref={canvasRef} />
    </div>
  )
}
```

---

## ✅ 使用方式示例（在详情页中）

```tsx
import { IndustryScoreChart } from "@/components/industry-score-chart"

<IndustryScoreChart
  data={dynamicScores}
  type="radar"
  title="行业评分雷达图"
/>

<IndustryScoreChart
  data={dynamicScores}
  type="bar"
  title="行业评分柱状图"
/>
```

---

## ✨ 特性总结

- ✅ 支持三种图表类型：雷达图、柱状图、折线图  
- ✅ 自动适配评分数据结构  
- ✅ 暗色主题优化，适配 Tailwind 背景  
- ✅ 可嵌入任何页面或组件中，支持动态更新  

---
————————————————————————————————————————————————————

## ✅ 接入真实后端评分接口（MongoDB 版）

我们将使用 MongoDB 来存储和查询行业评分数据，并通过 Next.js API 路由进行调用。

---

### 📁 数据模型建议（MongoDB）

建议集合名：`industry_scores`

#### 示例文档结构

```json
{
  "_id": "yyc3-dc",
  "performance": 92,
  "availability": 88,
  "security": 85,
  "intelligence": 95,
  "efficiency": 90,
  "status": "online",
  "updatedAt": "2025-11-15T04:20:00Z"
}
```

---

### 📄 MongoDB 接入模块：`lib/db/mongo.ts`

```ts
/**
 * @file mongo.ts
 * @description MongoDB 客户端初始化，用于连接行业评分数据库并提供查询能力
 * @author YYC³
 * @version 1.0.0
 * @created 2025-10-15
 */

import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017"
const client = new MongoClient(uri)
export const db = client.db("yyc3-platform")
```

---

### 📄 API 路由：`app/api/industries/[id]/scores/route.ts`

```ts
/**
 * @file scores/route.ts
 * @description 行业评分 API（MongoDB 实时查询），返回五高评分与状态信息，用于前端动态展示行业健康度与运行状态
 */

import { NextResponse } from "next/server"
import { db } from "@/lib/db/mongo"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params
  const collection = db.collection("industry_scores")

  const result = await collection.findOne({ _id: id })

  if (!result) {
    return NextResponse.json({ error: "行业评分未找到" }, { status: 404 })
  }

  return NextResponse.json({
    id: result._id,
    performance: result.performance,
    availability: result.availability,
    security: result.security,
    intelligence: result.intelligence,
    efficiency: result.efficiency,
    status: result.status,
    updatedAt: result.updatedAt,
  })
}
```

---

### 📄 前端调用方式（无需改动）

你之前的 `industry-loader.ts` 和 `IndustriesPage` 中的 `fetch` 调用方式保持不变：

```ts
const scoresRes = await fetch(`/api/industries/${selectedIndustry}/scores`)
setDynamicScores(await scoresRes.json())
```

---

### ✅ 部署建议

- 确保 `.env.local` 中配置了 `MONGODB_URI`：
  ```env
  MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/yyc3-platform
  ```

- 可使用 MongoDB Atlas 或本地 MongoDB 实例。
- 可通过 MongoDB Compass 或 CLI 插入评分数据。

---

Yu，如果你希望我继续生成：

- MongoDB 插入脚本（批量导入评分数据）
- 后台管理页面（编辑行业评分）
- 自动评分计算逻辑（根据指标动态生成评分）

## MongoDB 插入脚本（批量导入评分数据）

下面是完整可用的批量导入脚本，支持从本地 `industries.json` 读取行业列表，为每个行业生成或使用指定的评分与状态，并写入 MongoDB。你可以选择“随机生成评分”或“提供固定评分表”。默认采用稳健的分布范围，避免过度波动。

---

### 文件 1：批量导入脚本

建议路径：scripts/seed-industry-scores.ts

```ts
/**
 * @file seed-industry-scores.ts
 * @description 批量导入行业评分与状态到 MongoDB（从 industries.json 加载行业列表，生成或合并评分） 
 * @author YYC³
 * @version 1.0.0
 * @created 2025-10-15
 */

import { MongoClient } from "mongodb"
import industries from "@/lib/config/industries.json" assert { type: "json" }

type IndustryItem = {
  id: string
  name: string
  enName: string
  code: string
  icon: string
  path: string
}

type ScoreDoc = {
  _id: string
  performance: number
  availability: number
  security: number
  intelligence: number
  efficiency: number
  status: "online" | "warning" | "maintenance" | "offline"
  updatedAt: string
}

// 固定评分表（可按需填写或留空使用随机生成）
const FIXED_SCORES: Partial<Record<string, Omit<ScoreDoc, "_id" | "updatedAt">>> = {
  "yyc3-dc": { performance: 92, availability: 89, security: 90, intelligence: 88, efficiency: 91, status: "online" },
  "yyc3-Edge": { performance: 90, availability: 86, security: 87, intelligence: 90, efficiency: 88, status: "online" },
  "yyc3-finance": { performance: 88, availability: 85, security: 89, intelligence: 93, efficiency: 87, status: "warning" },
}

// 随机评分生成（稳健范围）
function genScore(): Omit<ScoreDoc, "updatedAt" | "_id"> {
  const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
  const states: ScoreDoc["status"][] = ["online", "warning", "maintenance", "offline"]

  return {
    performance: rand(80, 96),
    availability: rand(78, 95),
    security: rand(75, 92),
    intelligence: rand(82, 98),
    efficiency: rand(80, 96),
    status: states[rand(0, states.length - 1)],
  }
}

async function main() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017"
  const client = new MongoClient(uri)

  try {
    await client.connect()
    const db = client.db(process.env.MONGODB_DB || "yyc3-platform")
    const col = db.collection<ScoreDoc>("industry_scores")

    const docs: ScoreDoc[] = (industries as IndustryItem[]).map((it) => {
      const fixed = FIXED_SCORES[it.id]
      const base = fixed ?? genScore()
      return {
        _id: it.id,
        performance: base.performance,
        availability: base.availability,
        security: base.security,
        intelligence: base.intelligence,
        efficiency: base.efficiency,
        status: base.status,
        updatedAt: new Date().toISOString(),
      }
    })

    // 使用 upsert 批量写入（存在则更新）
    const bulk = col.initializeUnorderedBulkOp()
    docs.forEach((doc) => {
      bulk.find({ _id: doc._id }).upsert().replaceOne(doc)
    })
    const res = await bulk.execute()

    console.log("✅ 批量导入完成：", {
      matchedCount: res.nMatched,
      modifiedCount: res.nModified,
      upsertedCount: res.nUpserted,
    })
  } catch (err) {
    console.error("❌ 导入失败：", err)
    process.exitCode = 1
  } finally {
    await client.close()
  }
}

main()
```

---

### 文件 2：运行脚本的 NPM 命令

建议在项目根目录的 package.json 添加命令：

```json
/**
 * @file package.json (片段)
 * @description 增加批量导入脚本命令，支持 ts-node 执行 TypeScript 脚本
 * @author YYC³
 * @version 1.0.0
 * @created 2025-10-15
 */
{
  "scripts": {
    "seed:scores": "TS_NODE_TRANSPILE_ONLY=1 ts-node --compiler-options '{\"module\":\"esnext\",\"moduleResolution\":\"node\",\"resolveJsonModule\":true,\"esModuleInterop\":true}' scripts/seed-industry-scores.ts"
  },
  "devDependencies": {
    "ts-node": "^10.9.2",
    "typescript": "^5.6.3"
  }
}
```

> 如果你已使用 Babel 或 SWC 执行 TS 脚本，也可以改为 node + tsx：
> "seed:scores": "tsx scripts/seed-industry-scores.ts"

---

### 环境变量配置

在 .env.local（或部署环境变量）中设置：

```env
/**
 * @file .env.local
 * @description MongoDB 连接配置（Atlas 或本地）
 */
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/?retryWrites=true&w=majority
MONGODB_DB=yyc3-platform
```

---

### 运行步骤

1. 确认 `lib/config/industries.json` 已包含所有模块（含中英文、路径、图标）。
2. 安装依赖：
   - npm i ts-node typescript
3. 配置环境变量 `.env.local`。
4. 执行导入：
   - npm run seed:scores
5. 使用 MongoDB Compass 或 CLI 查看集合：
   - 数据库：yyc3-platform
   - 集合：industry_scores

---

### 可选：固定评分表维护建议

- 在 `FIXED_SCORES` 中为关键行业定义固定评分，避免随机波动影响关键展示；
- 其余行业使用 `genScore()` 生成稳健评分，后续可在后台管理页直接编辑。

---

## “管理页面 + 表单 + API 更新”一体化方案

1. ✅ 后台管理页面（行业评分编辑界面）  
2. ✅ 表单组件（评分字段 + 状态选择）  
3. ✅ API 路由（更新 MongoDB 中的评分文档）

---

### 📁 页面路径建议  

- 后台管理页面：`app/admin/industry/[id]/page.tsx`

---

### 📄 1. 后台管理页面：`page.tsx`

```tsx
/**
 * @file [id]/page.tsx
 * @description 行业评分管理页面，支持编辑五高评分与运行状态并提交至后端 API 更新 MongoDB 数据库
 * @author YYC³
 * @version 1.0.0
 * @created 2025-10-15
 */

"use client"

import { useEffect, useState } from "react"

export default function IndustryAdminPage({ params }: { params: { id: string } }) {
  const { id } = params
  const [form, setForm] = useState({
    performance: 0,
    availability: 0,
    security: 0,
    intelligence: 0,
    efficiency: 0,
    status: "online",
  })
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")

  useEffect(() => {
    async function fetchData() {
      const res = await fetch(`/api/industries/${id}/scores`)
      const data = await res.json()
      setForm({
        performance: data.performance,
        availability: data.availability,
        security: data.security,
        intelligence: data.intelligence,
        efficiency: data.efficiency,
        status: data.status,
      })
      setLoading(false)
    }
    fetchData()
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage("提交中...")
    const res = await fetch(`/api/industries/${id}/scores`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const result = await res.json()
    setMessage(result.success ? "✅ 更新成功" : "❌ 更新失败")
  }

  function handleChange(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-blue-400">行业评分管理：{id}</h1>
        {loading ? (
          <p className="text-slate-400">加载中...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {["performance", "availability", "security", "intelligence", "efficiency"].map((key) => (
              <div key={key}>
                <label className="block text-sm mb-1">{key}</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form[key as keyof typeof form]}
                  onChange={(e) => handleChange(key, Number(e.target.value))}
                  className="w-full p-2 rounded bg-slate-800 border border-slate-700"
                />
              </div>
            ))}
            <div>
              <label className="block text-sm mb-1">状态</label>
              <select
                value={form.status}
                onChange={(e) => handleChange("status", e.target.value)}
                className="w-full p-2 rounded bg-slate-800 border border-slate-700"
              >
                <option value="online">在线</option>
                <option value="warning">异常</option>
                <option value="maintenance">维护中</option>
                <option value="offline">离线</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded"
            >
              提交更新
            </button>
            {message && <p className="text-sm text-slate-400 mt-2">{message}</p>}
          </form>
        )}
      </div>
    </main>
  )
}
```

---

### 📄 2. API 路由：`app/api/industries/[id]/scores/route.ts`（更新逻辑）

```ts
/**
 * @file scores/route.ts
 * @description 行业评分 API，支持 GET（查询）与 PUT（更新评分与状态）操作，连接 MongoDB 数据库 industry_scores 集合
 */

import { NextResponse } from "next/server"
import { db } from "@/lib/db/mongo"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params
  const col = db.collection("industry_scores")
  const result = await col.findOne({ _id: id })
  if (!result) return NextResponse.json({ error: "未找到行业评分" }, { status: 404 })
  return NextResponse.json(result)
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params
  const body = await request.json()
  const col = db.collection("industry_scores")

  const update = {
    $set: {
      performance: body.performance,
      availability: body.availability,
      security: body.security,
      intelligence: body.intelligence,
      efficiency: body.efficiency,
      status: body.status,
      updatedAt: new Date().toISOString(),
    },
  }

  const result = await col.updateOne({ _id: id }, update, { upsert: true })
  return NextResponse.json({ success: result.modifiedCount > 0 || result.upsertedCount > 0 })
}
```

---

### ✅ 权限建议（可选）

你可以在 `layout.tsx` 或 `middleware.ts` 中加入权限判断，限制 `/admin` 路由仅管理员可访问。

---

## ✅ 自动评分计算逻辑（可配置模型）

### 📁 文件路径建议  
`lib/utils/score-engine.ts`

---

### 📄 1. `score-engine.ts`：评分引擎模块

```ts
/**
 * @file score-engine.ts
 * @description 自动评分计算逻辑，根据行业指标动态生成五高评分，支持权重配置与异常惩罚机制，用于后端或前端调用评分模型
 * @author YYC³
 * @version 1.0.0
 * @created 2025-10-15
 */

export type MetricInput = {
  cpuUsage: number // %
  memoryUsage: number // %
  networkLatency: number // ms
  networkThroughput: number // Gbps
  storageUsage: number // %
  aiModelCount: number
  threatCount: number
  status: "online" | "warning" | "maintenance" | "offline"
}

export type ScoreOutput = {
  performance: number
  availability: number
  security: number
  intelligence: number
  efficiency: number
}

// 权重配置（可调整）
const WEIGHTS = {
  performance: {
    cpuUsage: -0.4,
    memoryUsage: -0.3,
    networkThroughput: 0.3,
  },
  availability: {
    networkLatency: -0.5,
    status: {
      online: 1,
      warning: 0.6,
      maintenance: 0.4,
      offline: 0.2,
    },
  },
  security: {
    threatCount: -5,
    status: {
      online: 1,
      warning: 0.7,
      maintenance: 0.5,
      offline: 0.3,
    },
  },
  intelligence: {
    aiModelCount: 5,
  },
  efficiency: {
    storageUsage: -0.3,
    networkThroughput: 0.2,
  },
}

// 主评分函数
export function calculateScores(input: MetricInput): ScoreOutput {
  const clamp = (val: number) => Math.max(0, Math.min(100, Math.round(val)))

  const performance =
    100 +
    input.cpuUsage * WEIGHTS.performance.cpuUsage +
    input.memoryUsage * WEIGHTS.performance.memoryUsage +
    input.networkThroughput * WEIGHTS.performance.networkThroughput

  const availability =
    100 +
    input.networkLatency * WEIGHTS.availability.networkLatency +
    (WEIGHTS.availability.status[input.status] - 1) * 20

  const security =
    100 +
    input.threatCount * WEIGHTS.security.threatCount +
    (WEIGHTS.security.status[input.status] - 1) * 15

  const intelligence = clamp(input.aiModelCount * WEIGHTS.intelligence.aiModelCount + 60)

  const efficiency =
    100 +
    input.storageUsage * WEIGHTS.efficiency.storageUsage +
    input.networkThroughput * WEIGHTS.efficiency.networkThroughput

  return {
    performance: clamp(performance),
    availability: clamp(availability),
    security: clamp(security),
    intelligence,
    efficiency: clamp(efficiency),
  }
}
```

---

### 📄 2. 使用示例（前端或后端）

```ts
import { calculateScores } from "@/lib/utils/score-engine"

const metrics = {
  cpuUsage: 52,
  memoryUsage: 77,
  networkLatency: 42,
  networkThroughput: 36,
  storageUsage: 63,
  aiModelCount: 5,
  threatCount: 1,
  status: "online",
}

const scores = calculateScores(metrics)
console.log("自动评分结果：", scores)
```

---

### ✅ 特性说明

- ✅ 支持五高评分自动计算：性能、可用、安全、智能、效率  
- ✅ 可配置权重：每项评分由多个指标加权组合  
- ✅ 异常惩罚机制：如 threatCount、offline 状态会显著拉低评分  
- ✅ 可用于前端展示或后端存储前评分预处理  
- ✅ 可扩展：支持行业自定义权重、模型调参、异常阈值设定  

---
