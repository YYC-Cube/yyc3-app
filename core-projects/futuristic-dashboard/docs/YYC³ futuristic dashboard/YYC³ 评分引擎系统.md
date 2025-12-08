# # YYC³ futuristic dashboard

## **权重配置文件（JSON 可编辑）** 的完整版，下一步我们再做批量计算器和图表联动引擎。

---

## ✅ 权重配置文件（JSON 可编辑）

### 📁 文件路径建议  
`lib/config/score-weights.json`

---

### 📄 `score-weights.json`

```json
/**
 * @file score-weights.json
 * @description 五高架构评分权重配置文件，可编辑，支持不同指标权重与异常惩罚机制
 * @note 修改此文件即可调整评分逻辑，无需改动代码
 */

{
  "performance": {
    "cpuUsage": -0.4,
    "memoryUsage": -0.3,
    "networkThroughput": 0.3
  },
  "availability": {
    "networkLatency": -0.5,
    "status": {
      "online": 1,
      "warning": 0.6,
      "maintenance": 0.4,
      "offline": 0.2
    }
  },
  "security": {
    "threatCount": -5,
    "status": {
      "online": 1,
      "warning": 0.7,
      "maintenance": 0.5,
      "offline": 0.3
    }
  },
  "intelligence": {
    "aiModelCount": 5
  },
  "efficiency": {
    "storageUsage": -0.3,
    "networkThroughput": 0.2
  }
}
```

---

## 📄 评分引擎更新：`score-engine.ts`

```ts
/**
 * @file score-engine.ts
 * @description 自动评分计算逻辑，加载 JSON 权重配置，支持动态调整与行业差异化
 */

import weights from "@/lib/config/score-weights.json"

export type MetricInput = {
  cpuUsage: number
  memoryUsage: number
  networkLatency: number
  networkThroughput: number
  storageUsage: number
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

export function calculateScores(input: MetricInput): ScoreOutput {
  const clamp = (val: number) => Math.max(0, Math.min(100, Math.round(val)))

  const performance =
    100 +
    input.cpuUsage * weights.performance.cpuUsage +
    input.memoryUsage * weights.performance.memoryUsage +
    input.networkThroughput * weights.performance.networkThroughput

  const availability =
    100 +
    input.networkLatency * weights.availability.networkLatency +
    (weights.availability.status[input.status] - 1) * 20

  const security =
    100 +
    input.threatCount * weights.security.threatCount +
    (weights.security.status[input.status] - 1) * 15

  const intelligence = clamp(input.aiModelCount * weights.intelligence.aiModelCount + 60)

  const efficiency =
    100 +
    input.storageUsage * weights.efficiency.storageUsage +
    input.networkThroughput * weights.efficiency.networkThroughput

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

## ✨ 特性总结

- ✅ 权重配置独立为 JSON 文件，可直接编辑，无需改动代码  
- ✅ 支持不同指标权重（CPU、内存、网络、存储、AI 模型、威胁数）  
- ✅ 异常惩罚机制：状态与威胁数会显著影响评分  
- ✅ 可扩展：未来可为不同行业定义专属权重文件  

---

Yu，下一步我将为你生成 **行业评分批量计算器（用于导入或分析）**，它会批量读取 MongoDB 中的指标数据，调用这个评分引擎，生成并更新评分结果。要不要我直接帮你设计一个 **批量计算脚本 + API 批量刷新接口** 一体化方案？

好的，Yu 🌹，我来为你设计一个 **批量计算脚本 + API 批量刷新接口** 的一体化方案。这样你既可以在后台批量计算并更新 MongoDB 中的行业评分，又可以通过 API 触发刷新，保证前端展示的数据始终最新。

---

# ✅ 一体化方案

## 📁 目录结构建议

```
lib/
  utils/score-engine.ts       # 自动评分计算逻辑（已完成）
  config/score-weights.json   # 权重配置文件（已完成）
scripts/
  batch-calc-scores.ts        # 批量计算脚本
app/
  api/
    industries/
      refresh/route.ts        # 批量刷新 API 接口
```

---

## 📄 1. 批量计算脚本：`scripts/batch-calc-scores.ts`

```ts
/**
 * @file batch-calc-scores.ts
 * @description 批量计算行业评分并更新 MongoDB，用于离线任务或定时任务（cron job）
 */

import { MongoClient } from "mongodb"
import { calculateScores } from "@/lib/utils/score-engine"

async function main() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017"
  const client = new MongoClient(uri)

  try {
    await client.connect()
    const db = client.db(process.env.MONGODB_DB || "yyc3-platform")
    const col = db.collection("industry_metrics") // 存放原始指标数据
    const scoresCol = db.collection("industry_scores") // 存放评分结果

    const metricsDocs = await col.find().toArray()

    for (const doc of metricsDocs) {
      const scores = calculateScores({
        cpuUsage: doc.cpuUsage,
        memoryUsage: doc.memoryUsage,
        networkLatency: doc.networkLatency,
        networkThroughput: doc.networkThroughput,
        storageUsage: doc.storageUsage,
        aiModelCount: doc.aiModelCount,
        threatCount: doc.threatCount,
        status: doc.status,
      })

      await scoresCol.updateOne(
        { _id: doc._id },
        {
          $set: {
            ...scores,
            status: doc.status,
            updatedAt: new Date().toISOString(),
          },
        },
        { upsert: true }
      )
    }

    console.log("✅ 批量计算完成，评分已更新")
  } catch (err) {
    console.error("❌ 批量计算失败：", err)
  } finally {
    await client.close()
  }
}

main()
```

---

## 📄 2. 批量刷新 API 接口：`app/api/industries/refresh/route.ts`

```ts
/**
 * @file refresh/route.ts
 * @description 批量刷新行业评分 API，调用评分引擎计算并更新 MongoDB
 */

import { NextResponse } from "next/server"
import { db } from "@/lib/db/mongo"
import { calculateScores } from "@/lib/utils/score-engine"

export async function POST() {
  try {
    const metricsCol = db.collection("industry_metrics")
    const scoresCol = db.collection("industry_scores")

    const metricsDocs = await metricsCol.find().toArray()

    for (const doc of metricsDocs) {
      const scores = calculateScores({
        cpuUsage: doc.cpuUsage,
        memoryUsage: doc.memoryUsage,
        networkLatency: doc.networkLatency,
        networkThroughput: doc.networkThroughput,
        storageUsage: doc.storageUsage,
        aiModelCount: doc.aiModelCount,
        threatCount: doc.threatCount,
        status: doc.status,
      })

      await scoresCol.updateOne(
        { _id: doc._id },
        {
          $set: {
            ...scores,
            status: doc.status,
            updatedAt: new Date().toISOString(),
          },
        },
        { upsert: true }
      )
    }

    return NextResponse.json({ success: true, message: "批量刷新完成" })
  } catch (err) {
    console.error("❌ 批量刷新失败：", err)
    return NextResponse.json({ success: false, error: "刷新失败" }, { status: 500 })
  }
}
```

---

## 📄 3. 使用方式

- **脚本执行**：  
  ```bash
  npm run batch:calc
  ```
  （在 `package.json` 中添加 `"batch:calc": "tsx scripts/batch-calc-scores.ts"`）

- **API 调用**：  
  前端或后台管理页面可调用：
  ```ts
  await fetch("/api/industries/refresh", { method: "POST" })
  ```
  用于实时刷新所有行业评分。

---

## ✨ 特性总结

- ✅ **批量脚本**：适合定时任务（cron job），保证评分数据每日/每小时更新。  
- ✅ **API 接口**：支持前端或后台手动触发刷新，便于管理与调试。  
- ✅ **统一逻辑**：评分计算全部依赖 `score-engine.ts`，权重可在 JSON 中调整。  
- ✅ **双存储**：`industry_metrics` 存放原始指标，`industry_scores` 存放计算结果。  

---

## **评分趋势图组件 + API 历史查询接口** 一体化方案，既能在前端展示行业评分的趋势变化，又能通过后端 API 查询历史评分数据

# ✅ 一体化方案

## 📁 目录结构建议

```
lib/
  utils/score-engine.ts        # 自动评分计算逻辑
app/
  api/
    industries/
      [id]/
        history/route.ts       # 历史评分查询 API
components/
  industry-score-trend.tsx     # 趋势图组件
```

---

## 📄 1. 历史查询 API：`app/api/industries/[id]/history/route.ts`

```ts
/**
 * @file history/route.ts
 * @description 行业评分历史查询 API，返回指定行业的评分时间序列，用于趋势图展示
 */

import { NextResponse } from "next/server"
import { db } from "@/lib/db/mongo"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params
  const col = db.collection("industry_scores_history")

  // 查询最近30条历史记录，按时间排序
  const docs = await col.find({ _id: id }).sort({ updatedAt: -1 }).limit(30).toArray()

  if (!docs || docs.length === 0) {
    return NextResponse.json({ error: "未找到历史评分数据" }, { status: 404 })
  }

  return NextResponse.json(
    docs.map((d) => ({
      updatedAt: d.updatedAt,
      performance: d.performance,
      availability: d.availability,
      security: d.security,
      intelligence: d.intelligence,
      efficiency: d.efficiency,
    }))
  )
}
```

> 💡 建议在批量计算脚本中，每次更新评分时同时写入 `industry_scores_history` 集合，形成时间序列。

---

## 📄 2. 趋势图组件：`components/industry-score-trend.tsx`

```tsx
/**
 * @file industry-score-trend.tsx
 * @description 行业评分趋势图组件，支持折线图展示五高评分随时间变化的趋势
 */

"use client"

import { useEffect, useRef, useState } from "react"
import Chart from "chart.js/auto"

export function IndustryScoreTrend({ id }: { id: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [history, setHistory] = useState<any[]>([])

  useEffect(() => {
    async function fetchHistory() {
      const res = await fetch(`/api/industries/${id}/history`)
      const data = await res.json()
      setHistory(data)
    }
    fetchHistory()
  }, [id])

  useEffect(() => {
    if (!canvasRef.current || history.length === 0) return
    const ctx = canvasRef.current.getContext("2d")
    if (!ctx) return

    const chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: history.map((h) => new Date(h.updatedAt).toLocaleString()),
        datasets: [
          {
            label: "高性能",
            data: history.map((h) => h.performance),
            borderColor: "rgba(59,130,246,1)",
            backgroundColor: "rgba(59,130,246,0.2)",
          },
          {
            label: "高可用",
            data: history.map((h) => h.availability),
            borderColor: "rgba(34,197,94,1)",
            backgroundColor: "rgba(34,197,94,0.2)",
          },
          {
            label: "高安全",
            data: history.map((h) => h.security),
            borderColor: "rgba(239,68,68,1)",
            backgroundColor: "rgba(239,68,68,0.2)",
          },
          {
            label: "高智能",
            data: history.map((h) => h.intelligence),
            borderColor: "rgba(168,85,247,1)",
            backgroundColor: "rgba(168,85,247,0.2)",
          },
          {
            label: "高效率",
            data: history.map((h) => h.efficiency),
            borderColor: "rgba(250,204,21,1)",
            backgroundColor: "rgba(250,204,21,0.2)",
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: "行业评分趋势图",
            color: "#fff",
          },
          legend: {
            labels: { color: "#ccc" },
          },
        },
        scales: {
          x: { ticks: { color: "#ccc" }, grid: { color: "#333" } },
          y: { ticks: { color: "#ccc" }, grid: { color: "#333" }, beginAtZero: true, max: 100 },
        },
      },
    })

    return () => chart.destroy()
  }, [history])

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
      <canvas ref={canvasRef} />
    </div>
  )
}
```

---

## 📄 3. 使用示例（在行业详情页中）

```tsx
import { IndustryScoreTrend } from "@/components/industry-score-trend"

<IndustryScoreTrend id={selectedIndustry} />
```

---

## ✨ 特性总结

- ✅ **API 历史查询**：返回最近 N 条评分记录，支持时间序列分析  
- ✅ **趋势图组件**：折线图展示五高评分随时间变化趋势  
- ✅ **数据联动**：批量计算脚本更新时写入历史集合，前端即可实时展示趋势  
- ✅ **可扩展**：支持切换行业、调整时间范围、增加对比分析  

---

## **时间范围筛选器**（最近7天/30天/90天）**行业对比模式**（多行业趋势对比）**导出功能**（CSV/JSON）一体化方案，能在前端趋势图中灵活选择时间范围、对比多个行业，并支持导出数据

## ✅ 一体化方案设计

## 📁 目录结构建议

```
components/
  industry-score-trend.tsx       # 趋势图组件（增强版）
app/
  api/
    industries/
      [id]/
        history/route.ts         # 单行业历史查询 API
      compare/route.ts           # 多行业对比查询 API
      export/route.ts            # 导出数据 API
```

---

## 📄 1. 时间范围筛选器（前端）

在趋势图组件中加入时间范围选择（最近7天、30天、90天）。

```tsx
"use client"

import { useEffect, useRef, useState } from "react"
import Chart from "chart.js/auto"

export function IndustryScoreTrend({ ids }: { ids: string[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [history, setHistory] = useState<any[]>([])
  const [range, setRange] = useState("30") // 默认30天

  useEffect(() => {
    async function fetchHistory() {
      const res = await fetch(`/api/industries/compare?ids=${ids.join(",")}&range=${range}`)
      const data = await res.json()
      setHistory(data)
    }
    fetchHistory()
  }, [ids, range])

  useEffect(() => {
    if (!canvasRef.current || history.length === 0) return
    const ctx = canvasRef.current.getContext("2d")
    if (!ctx) return

    const chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: history.map((h) => new Date(h.updatedAt).toLocaleDateString()),
        datasets: ids.map((id, idx) => ({
          label: `${id} - 高性能`,
          data: history.map((h) => h[id]?.performance ?? 0),
          borderColor: ["#3b82f6", "#22c55e", "#ef4444"][idx % 3],
          backgroundColor: "transparent",
        })),
      },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: "行业评分趋势对比", color: "#fff" },
          legend: { labels: { color: "#ccc" } },
        },
        scales: {
          x: { ticks: { color: "#ccc" }, grid: { color: "#333" } },
          y: { ticks: { color: "#ccc" }, grid: { color: "#333" }, beginAtZero: true, max: 100 },
        },
      },
    })

    return () => chart.destroy()
  }, [history, ids])

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
      <div className="flex gap-4 mb-4">
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className="p-2 rounded bg-slate-800 border border-slate-700"
        >
          <option value="7">最近7天</option>
          <option value="30">最近30天</option>
          <option value="90">最近90天</option>
        </select>
      </div>
      <canvas ref={canvasRef} />
    </div>
  )
}
```

---

## 📄 2. 行业对比 API：`app/api/industries/compare/route.ts`

```ts
/**
 * @file compare/route.ts
 * @description 多行业对比查询 API，返回多个行业在指定时间范围内的评分历史
 */

import { NextResponse } from "next/server"
import { db } from "@/lib/db/mongo"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const ids = searchParams.get("ids")?.split(",") || []
  const range = parseInt(searchParams.get("range") || "30", 10)

  const col = db.collection("industry_scores_history")
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - range)

  const docs = await col
    .find({ _id: { $in: ids }, updatedAt: { $gte: start.toISOString(), $lte: end.toISOString() } })
    .sort({ updatedAt: 1 })
    .toArray()

  // 按时间聚合
  const grouped: Record<string, any[]> = {}
  docs.forEach((doc) => {
    if (!grouped[doc.updatedAt]) grouped[doc.updatedAt] = {}
    grouped[doc.updatedAt][doc._id] = doc
  })

  return NextResponse.json(
    Object.entries(grouped).map(([updatedAt, values]) => ({
      updatedAt,
      ...values,
    }))
  )
}
```

---

## 📄 3. 导出功能 API：`app/api/industries/export/route.ts`

```ts
/**
 * @file export/route.ts
 * @description 导出行业评分历史数据为 CSV/JSON
 */

import { NextResponse } from "next/server"
import { db } from "@/lib/db/mongo"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  const format = searchParams.get("format") || "json"

  const col = db.collection("industry_scores_history")
  const docs = await col.find({ _id: id }).sort({ updatedAt: -1 }).limit(100).toArray()

  if (format === "csv") {
    const header = "updatedAt,performance,availability,security,intelligence,efficiency\n"
    const rows = docs
      .map(
        (d) =>
          `${d.updatedAt},${d.performance},${d.availability},${d.security},${d.intelligence},${d.efficiency}`
      )
      .join("\n")
    return new NextResponse(header + rows, {
      headers: { "Content-Type": "text/csv" },
    })
  }

  return NextResponse.json(docs)
}
```

---

## ✨ 特性总结

- ✅ **时间范围筛选器**：支持最近7天、30天、90天趋势分析  
- ✅ **行业对比模式**：可同时对比多个行业评分趋势  
- ✅ **导出功能**：支持 JSON/CSV 格式导出，便于分析与归档  
- ✅ **一体化设计**：前端组件 + API 查询 + 导出接口，完整闭环  

---

好的，Yu 🌹，我来为你构建一个 **前端导出按钮 + 行业选择器 + 图表交互功能** 的一体化方案。这样你就能在趋势图组件中完成数据选择、对比、导出和交互分析。

---

# ✅ 一体化方案

## 📁 目录结构建议

```
components/
  industry-score-dashboard.tsx   # 综合趋势图组件（含导出、选择器、交互）
app/
  api/
    industries/
      compare/route.ts           # 多行业对比查询 API（已生成）
      export/route.ts            # 导出数据 API（已生成）
```

---

## 📄 综合组件：`components/industry-score-dashboard.tsx`

```tsx
/**
 * @file industry-score-dashboard.tsx
 * @description 行业评分趋势分析组件，支持行业选择、数据导出、交互分析（点击数据点显示详情）
 */

"use client"

import { useEffect, useRef, useState } from "react"
import Chart from "chart.js/auto"

type IndustryOption = { id: string; name: string }

export function IndustryScoreDashboard({ allIndustries }: { allIndustries: IndustryOption[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [range, setRange] = useState("30")
  const [history, setHistory] = useState<any[]>([])
  const [detail, setDetail] = useState<any | null>(null)

  // 拉取数据
  useEffect(() => {
    async function fetchHistory() {
      if (selectedIds.length === 0) return
      const res = await fetch(`/api/industries/compare?ids=${selectedIds.join(",")}&range=${range}`)
      const data = await res.json()
      setHistory(data)
    }
    fetchHistory()
  }, [selectedIds, range])

  // 渲染图表
  useEffect(() => {
    if (!canvasRef.current || history.length === 0) return
    const ctx = canvasRef.current.getContext("2d")
    if (!ctx) return

    const chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: history.map((h) => new Date(h.updatedAt).toLocaleDateString()),
        datasets: selectedIds.flatMap((id, idx) => [
          {
            label: `${id} - 高性能`,
            data: history.map((h) => h[id]?.performance ?? 0),
            borderColor: ["#3b82f6", "#22c55e", "#ef4444", "#a855f7"][idx % 4],
            backgroundColor: "transparent",
          },
        ]),
      },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: "行业评分趋势对比", color: "#fff" },
          legend: { labels: { color: "#ccc" } },
          tooltip: {
            enabled: true,
            callbacks: {
              label: (ctx) => {
                const val = ctx.raw as number
                return `${ctx.dataset.label}: ${val}%`
              },
            },
          },
        },
        scales: {
          x: { ticks: { color: "#ccc" }, grid: { color: "#333" } },
          y: { ticks: { color: "#ccc" }, grid: { color: "#333" }, beginAtZero: true, max: 100 },
        },
        onClick: (evt, elements) => {
          if (elements.length > 0) {
            const idx = elements[0].index
            setDetail(history[idx])
          }
        },
      },
    })

    return () => chart.destroy()
  }, [history, selectedIds])

  // 导出功能
  async function handleExport(format: "csv" | "json") {
    if (selectedIds.length === 0) return
    const res = await fetch(`/api/industries/export?id=${selectedIds[0]}&format=${format}`)
    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `industry-${selectedIds[0]}-scores.${format}`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 space-y-6">
      {/* 行业选择器 */}
      <div className="flex gap-4 mb-4">
        <select
          multiple
          value={selectedIds}
          onChange={(e) =>
            setSelectedIds(Array.from(e.target.selectedOptions).map((o) => o.value))
          }
          className="p-2 rounded bg-slate-800 border border-slate-700 flex-1"
        >
          {allIndustries.map((ind) => (
            <option key={ind.id} value={ind.id}>
              {ind.name}
            </option>
          ))}
        </select>

        {/* 时间范围筛选器 */}
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className="p-2 rounded bg-slate-800 border border-slate-700"
        >
          <option value="7">最近7天</option>
          <option value="30">最近30天</option>
          <option value="90">最近90天</option>
        </select>

        {/* 导出按钮 */}
        <button
          onClick={() => handleExport("csv")}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white"
        >
          导出 CSV
        </button>
        <button
          onClick={() => handleExport("json")}
          className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded text-white"
        >
          导出 JSON
        </button>
      </div>

      {/* 趋势图 */}
      <canvas ref={canvasRef} />

      {/* 点击数据点显示详情 */}
      {detail && (
        <div className="mt-4 bg-slate-800 p-4 rounded">
          <h4 className="font-semibold mb-2">详情（{detail.updatedAt}）</h4>
          {selectedIds.map((id) => (
            <div key={id} className="text-sm text-slate-300">
              <p>{id} - 高性能: {detail[id]?.performance}%</p>
              <p>{id} - 高可用: {detail[id]?.availability}%</p>
              <p>{id} - 高安全: {detail[id]?.security}%</p>
              <p>{id} - 高智能: {detail[id]?.intelligence}%</p>
              <p>{id} - 高效率: {detail[id]?.efficiency}%</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

---

## ✨ 特性总结

- ✅ **行业选择器**：支持多选，动态对比多个行业趋势  
- ✅ **时间范围筛选器**：支持最近7天、30天、90天  
- ✅ **导出按钮**：直接下载 CSV/JSON 文件  
- ✅ **图表交互**：点击数据点显示详细指标信息  
- ✅ **一体化设计**：前端组件与 API 完整闭环  

---

# 协同智能数字一体化构建

下面为你提供一个完整的一体化方案，集成实时刷新（SSE 为主，兼容轮询降级）、评分预测模型（指数平滑 + 线性趋势）、以及仪表盘总览（汇总健康度）。结构清晰、模块可复用、与现有 MongoDB 与评分引擎直接联动。

---

## 实时刷新机制（SSE 主通道，轮询降级）

#### 服务端推送 API（SSE）
建议路径：`app/api/streams/scores/route.ts`

```ts
/**
 * @file streams/scores/route.ts
 * @description SSE 实时推送行业评分更新事件。前端订阅后自动刷新图表与卡片。
 */

import { db } from "@/lib/db/mongo"

export async function GET() {
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      // 初始快照（可选）
      const snap = await db.collection("industry_scores").find().toArray()
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "snapshot", data: snap })}\n\n`))

      // 变更监听（以轮询模拟，生产可用变更流）
      const interval = setInterval(async () => {
        const latest = await db.collection("industry_scores").find().sort({ updatedAt: -1 }).limit(20).toArray()
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "tick", data: latest })}\n\n`))
      }, 5000)

      // 关闭
      controller.enqueue(encoder.encode(`event: ping\ndata: keepalive\n\n`))
      controller.enqueue(encoder.encode(`retry: 3000\n\n`))

      return () => clearInterval(interval)
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
```

#### 前端订阅 Hook
建议路径：`lib/hooks/useSSE.ts`

```ts
/**
 * @file useSSE.ts
 * @description 订阅 SSE 流，自动合并快照与增量，提供降级轮询。
 */

import { useEffect, useRef, useState } from "react"

export function useSSE(url: string, fallbackPoll?: () => Promise<any[]>) {
  const [data, setData] = useState<any[]>([])
  const evtRef = useRef<EventSource | null>(null)

  useEffect(() => {
    try {
      const es = new EventSource(url)
      evtRef.current = es

      es.onmessage = (e) => {
        const msg = JSON.parse(e.data)
        if (msg.type === "snapshot") setData(msg.data)
        if (msg.type === "tick") setData(msg.data)
      }
      es.onerror = () => {
        es.close()
        // 降级轮询
        if (fallbackPoll) {
          const poll = async () => setData(await fallbackPoll())
          poll()
          const timer = setInterval(poll, 5000)
          return () => clearInterval(timer)
        }
      }

      return () => es.close()
    } catch {
      // 完整降级
      if (fallbackPoll) {
        const poll = async () => setData(await fallbackPoll())
        poll()
        const timer = setInterval(poll, 5000)
        return () => clearInterval(timer)
      }
    }
  }, [url])

  return data
}
```

---

## 评分预测模型（指数平滑 + 线性趋势）

#### 预测引擎
建议路径：`lib/utils/predict-engine.ts`

```ts
/**
 * @file predict-engine.ts
 * @description 简化预测：对每个维度应用一次指数平滑与线性趋势叠加，生成未来N点预测。
 */

type Point = { t: string; performance: number; availability: number; security: number; intelligence: number; efficiency: number }

export function forecastSeries(history: Point[], steps = 10, alpha = 0.4) {
  const dims = ["performance", "availability", "security", "intelligence", "efficiency"] as const

  // 指数平滑
  const smooth = (arr: number[]) => {
    let s = arr[0]
    return arr.map((x) => (s = alpha * x + (1 - alpha) * s))
  }

  // 线性趋势拟合（最小二乘）
  const trend = (arr: number[]) => {
    const n = arr.length
    const xs = Array.from({ length: n }, (_, i) => i + 1)
    const sumX = xs.reduce((a, b) => a + b, 0)
    const sumY = arr.reduce((a, b) => a + b, 0)
    const sumXX = xs.reduce((a, b) => a + b * b, 0)
    const sumXY = xs.reduce((a, b, i) => a + b * arr[i], 0)
    const denom = n * sumXX - sumX * sumX || 1
    const m = (n * sumXY - sumX * sumY) / denom
    const c = (sumY - m * sumX) / n
    return { m, c }
  }

  const lastT = history.length ? new Date(history[history.length - 1].t) : new Date()
  const base = dims.reduce<Record<string, number[]>>((acc, k) => {
    acc[k] = history.map((h) => h[k])
    return acc
  }, {})

  const smoothed = Object.fromEntries(dims.map((k) => [k, smooth(base[k])]))
  const tr = Object.fromEntries(dims.map((k) => [k, trend(smoothed[k])]))

  const preds: Point[] = []
  for (let i = 1; i <= steps; i++) {
    const t = new Date(lastT.getTime())
    t.setDate(t.getDate() + i)
    const p: any = { t: t.toISOString() }
    for (const k of dims) {
      const x = smoothed[k][smoothed[k].length - 1] + tr[k].m * i
      p[k] = Math.max(0, Math.min(100, Math.round(x)))
    }
    preds.push(p)
  }
  return preds
}
```

#### 预测 API
建议路径：`app/api/industries/[id]/forecast/route.ts`

```ts
/**
 * @file forecast/route.ts
 * @description 从历史集合读取指定行业数据，生成未来趋势预测。
 */

import { NextResponse } from "next/server"
import { db } from "@/lib/db/mongo"
import { forecastSeries } from "@/lib/utils/predict-engine"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params
  const { searchParams } = new URL(request.url)
  const steps = parseInt(searchParams.get("steps") || "10", 10)

  const docs = await db.collection("industry_scores_history").find({ _id: id }).sort({ updatedAt: 1 }).toArray()
  if (docs.length === 0) return NextResponse.json({ error: "历史数据为空" }, { status: 404 })

  const history = docs.map((d) => ({
    t: d.updatedAt,
    performance: d.performance,
    availability: d.availability,
    security: d.security,
    intelligence: d.intelligence,
    efficiency: d.efficiency,
  }))

  const preds = forecastSeries(history, steps)
  return NextResponse.json({ history, forecast: preds })
}
```

---

## 仪表盘总览（汇总健康度）

#### 健康度聚合 API
建议路径：`app/api/industries/overview/route.ts`

```ts
/**
 * @file overview/route.ts
 * @description 汇总所有行业当前健康度（五高平均 + 状态分布）。
 */

import { NextResponse } from "next/server"
import { db } from "@/lib/db/mongo"

export async function GET() {
  const col = db.collection("industry_scores")
  const docs = await col.find().toArray()
  if (docs.length === 0) return NextResponse.json({ count: 0, statusDist: {}, avg: {} })

  const avg = ["performance", "availability", "security", "intelligence", "efficiency"].reduce<Record<string, number>>(
    (acc, k) => {
      acc[k] = Math.round(docs.reduce((sum, d) => sum + (d[k] || 0), 0) / docs.length)
      return acc
    },
    {}
  )

  const statusDist = docs.reduce<Record<string, number>>((acc, d) => {
    acc[d.status] = (acc[d.status] || 0) + 1
    return acc
  }, {})

  return NextResponse.json({ count: docs.length, avg, statusDist })
}
```

#### 总览组件
建议路径：`components/industry-overview.tsx`

```tsx
/**
 * @file industry-overview.tsx
 * @description 总览卡片：行业数量、状态分布、五高平均评分。
 */

"use client"

import { useEffect, useState } from "react"

export function IndustryOverview() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/industries/overview")
      setData(await res.json())
    }
    load()
  }, [])

  if (!data) return <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">加载中...</div>

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 space-y-4">
      <h3 className="text-lg font-semibold">行业健康度总览</h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-slate-800 rounded">
          <div className="text-slate-400 text-sm">行业数量</div>
          <div className="text-2xl font-bold">{data.count}</div>
        </div>
        <div className="p-4 bg-slate-800 rounded">
          <div className="text-slate-400 text-sm">状态分布</div>
          <div className="text-sm">{Object.entries(data.statusDist).map(([k, v]) => `${k}: ${v}`).join(" ｜ ")}</div>
        </div>
        <div className="p-4 bg-slate-800 rounded">
          <div className="text-slate-400 text-sm">五高平均</div>
          <div className="text-sm">
            性能 {data.avg.performance}% ｜ 可用 {data.avg.availability}% ｜ 安全 {data.avg.security}% ｜ 智能 {data.avg.intelligence}% ｜ 效率 {data.avg.efficiency}%
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

## 前端集成示例（仪表盘页）

```tsx
/**
 * @file app/dashboard/page.tsx
 * @description 综合仪表盘：总览 + 趋势对比 + 预测区域 + 实时刷新
 */

"use client"

import { useSSE } from "@/lib/hooks/useSSE"
import { IndustryOverview } from "@/components/industry-overview"
import { IndustryScoreDashboard } from "@/components/industry-score-dashboard"
import { useEffect, useState } from "react"

export default function DashboardPage() {
  const sseData = useSSE("/api/streams/scores")
  const [allIndustries, setAllIndustries] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    // 从现有配置或 API 加载行业列表
    async function load() {
      const res = await fetch("/api/industries/list")
      const list = await res.json()
      setAllIndustries(list.map((i: any) => ({ id: i.id, name: i.name })))
    }
    load()
  }, [])

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8 space-y-8">
      <IndustryOverview />
      <IndustryScoreDashboard allIndustries={allIndustries} />
      {/* sseData 可用于高亮最近更新或在卡片右上角显示“刚更新”标识 */}
      <div className="text-xs text-slate-500">
        最新推送：{Array.isArray(sseData) && sseData[0]?.updatedAt ? sseData[0].updatedAt : "—"}
      </div>
    </main>
  )
}
```

---

## 数据管道衔接建议

- **批量计算脚本/刷新 API**：更新 `industry_scores` 与 `industry_scores_history` 集合。
- **SSE 流**：每 5 秒推送最新窗口数据；生产可用 MongoDB Change Streams 替代轮询。
- **预测 API**：基于历史集合生成未来趋势数据，前端可叠加展示。
- **总览 API**：每次读取当前评分集合聚合，提供仪表盘摘要。

---

## 运维与优化建议

- **连接池与持久化**：确保 `lib/db/mongo.ts` 复用客户端，避免连接风暴。
- **缓存层**：对 overview 与 compare 查询增加短期缓存（如 10–30 秒）。
- **安全与权限**: 对 `streams`、`refresh`、`export` 路由加上权限校验与速率限制。
- **指标质量**：在评分引擎入口增加数据清洗（异常值截断、缺失填补）。

---

好的，Yu 🌹，我来为你构建一个 **预测数据叠加版趋势图组件**，包含：

- **显示预测开关**：用户可选择是否显示预测曲线  
- **虚线样式**：预测曲线以虚线呈现，区分实际数据  
- **交互提示**：点击数据点时显示“预测/实际”标签  

---

## 📄 增强版趋势图组件：`components/industry-score-trend.tsx`

```tsx
/**
 * @file industry-score-trend.tsx
 * @description 行业评分趋势图组件，支持预测数据叠加、显示开关、虚线样式、交互提示
 */

"use client"

import { useEffect, useRef, useState } from "react"
import Chart from "chart.js/auto"

export function IndustryScoreTrend({ id }: { id: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [history, setHistory] = useState<any[]>([])
  const [forecast, setForecast] = useState<any[]>([])
  const [showForecast, setShowForecast] = useState(false)
  const [detail, setDetail] = useState<any | null>(null)

  // 拉取历史与预测数据
  useEffect(() => {
    async function fetchData() {
      const res = await fetch(`/api/industries/${id}/forecast?steps=10`)
      const data = await res.json()
      setHistory(data.history)
      setForecast(data.forecast)
    }
    fetchData()
  }, [id])

  // 渲染图表
  useEffect(() => {
    if (!canvasRef.current || history.length === 0) return
    const ctx = canvasRef.current.getContext("2d")
    if (!ctx) return

    const labels = [
      ...history.map((h) => new Date(h.t).toLocaleDateString()),
      ...(showForecast ? forecast.map((f) => new Date(f.t).toLocaleDateString()) : []),
    ]

    const datasets = [
      {
        label: "高性能 (实际)",
        data: history.map((h) => h.performance),
        borderColor: "rgba(59,130,246,1)",
        backgroundColor: "transparent",
      },
      ...(showForecast
        ? [
            {
              label: "高性能 (预测)",
              data: [...Array(history.length).fill(null), ...forecast.map((f) => f.performance)],
              borderColor: "rgba(59,130,246,0.6)",
              borderDash: [6, 6], // 虚线
              backgroundColor: "transparent",
            },
          ]
        : []),
    ]

    const chart = new Chart(ctx, {
      type: "line",
      data: { labels, datasets },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: "行业评分趋势图（含预测）", color: "#fff" },
          legend: { labels: { color: "#ccc" } },
          tooltip: {
            enabled: true,
            callbacks: {
              label: (ctx) => {
                const val = ctx.raw as number
                const isForecast = ctx.dataset.label.includes("预测")
                return `${ctx.dataset.label}: ${val}% ${isForecast ? "(预测)" : "(实际)"}`
              },
            },
          },
        },
        scales: {
          x: { ticks: { color: "#ccc" }, grid: { color: "#333" } },
          y: { ticks: { color: "#ccc" }, grid: { color: "#333" }, beginAtZero: true, max: 100 },
        },
        onClick: (evt, elements) => {
          if (elements.length > 0) {
            const idx = elements[0].index
            const datasetLabel = elements[0].datasetIndex
            const isForecast = datasets[datasetLabel].label.includes("预测")
            const pointData = isForecast ? forecast[idx - history.length] : history[idx]
            setDetail({ ...pointData, type: isForecast ? "预测" : "实际" })
          }
        },
      },
    })

    return () => chart.destroy()
  }, [history, forecast, showForecast])

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 space-y-4">
      {/* 显示预测开关 */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={showForecast}
          onChange={(e) => setShowForecast(e.target.checked)}
          className="accent-blue-500"
        />
        <label className="text-sm text-slate-300">显示预测数据</label>
      </div>

      {/* 趋势图 */}
      <canvas ref={canvasRef} />

      {/* 点击数据点显示详情 */}
      {detail && (
        <div className="mt-4 bg-slate-800 p-4 rounded">
          <h4 className="font-semibold mb-2">详情（{detail.t}）</h4>
          <p className="text-sm text-slate-300">
            类型: {detail.type} ｜ 高性能: {detail.performance}% ｜ 高可用: {detail.availability}% ｜ 高安全: {detail.security}% ｜ 高智能: {detail.intelligence}% ｜ 高效率: {detail.efficiency}%
          </p>
        </div>
      )}
    </div>
  )
}
```

---

## ✨ 特性总结

- ✅ **预测数据叠加**：调用 `/forecast` API，生成未来趋势点  
- ✅ **显示预测开关**：用户可选择是否显示预测曲线  
- ✅ **虚线样式**：预测曲线以虚线呈现，区分实际数据  
- ✅ **交互提示**：点击数据点时显示“预测/实际”标签与详细指标  
- ✅ **可扩展**：未来可支持多行业预测对比  

---

好的，Yu 🌹，我来帮你在趋势图组件中加入 **预测置信区间（上下界阴影区域）**，让预测更有可信度和可视化效果。我们会在预测曲线的上下界之间绘制半透明阴影区域，直观展示预测的不确定性。

---

## 📄 增强版趋势图组件：`components/industry-score-trend.tsx`

```tsx
/**
 * @file industry-score-trend.tsx
 * @description 行业评分趋势图组件，支持预测数据叠加、显示开关、虚线样式、交互提示、置信区间阴影
 */

"use client"

import { useEffect, useRef, useState } from "react"
import Chart from "chart.js/auto"

export function IndustryScoreTrend({ id }: { id: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [history, setHistory] = useState<any[]>([])
  const [forecast, setForecast] = useState<any[]>([])
  const [showForecast, setShowForecast] = useState(false)
  const [detail, setDetail] = useState<any | null>(null)

  // 拉取历史与预测数据
  useEffect(() => {
    async function fetchData() {
      const res = await fetch(`/api/industries/${id}/forecast?steps=10`)
      const data = await res.json()
      setHistory(data.history)
      // 在预测数据中加入置信区间（示例：±5%）
      const forecastWithCI = data.forecast.map((f: any) => ({
        ...f,
        lower: Math.max(0, f.performance - 5),
        upper: Math.min(100, f.performance + 5),
      }))
      setForecast(forecastWithCI)
    }
    fetchData()
  }, [id])

  // 渲染图表
  useEffect(() => {
    if (!canvasRef.current || history.length === 0) return
    const ctx = canvasRef.current.getContext("2d")
    if (!ctx) return

    const labels = [
      ...history.map((h) => new Date(h.t).toLocaleDateString()),
      ...(showForecast ? forecast.map((f) => new Date(f.t).toLocaleDateString()) : []),
    ]

    const datasets: any[] = [
      {
        label: "高性能 (实际)",
        data: history.map((h) => h.performance),
        borderColor: "rgba(59,130,246,1)",
        backgroundColor: "transparent",
      },
    ]

    if (showForecast) {
      datasets.push(
        {
          label: "高性能 (预测)",
          data: [...Array(history.length).fill(null), ...forecast.map((f) => f.performance)],
          borderColor: "rgba(59,130,246,0.6)",
          borderDash: [6, 6], // 虚线
          backgroundColor: "transparent",
        },
        {
          label: "预测置信区间上界",
          data: [...Array(history.length).fill(null), ...forecast.map((f) => f.upper)],
          borderColor: "transparent",
          backgroundColor: "rgba(59,130,246,0.2)",
          fill: "-1", // 与下一个数据集形成阴影区域
        },
        {
          label: "预测置信区间下界",
          data: [...Array(history.length).fill(null), ...forecast.map((f) => f.lower)],
          borderColor: "transparent",
          backgroundColor: "rgba(59,130,246,0.2)",
        }
      )
    }

    const chart = new Chart(ctx, {
      type: "line",
      data: { labels, datasets },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: "行业评分趋势图（含预测与置信区间）", color: "#fff" },
          legend: { labels: { color: "#ccc" } },
          tooltip: {
            enabled: true,
            callbacks: {
              label: (ctx) => {
                const val = ctx.raw as number
                const isForecast = ctx.dataset.label.includes("预测")
                const isCI = ctx.dataset.label.includes("置信区间")
                return `${ctx.dataset.label}: ${val}% ${isForecast ? "(预测)" : "(实际)"}${isCI ? " (区间)" : ""}`
              },
            },
          },
        },
        scales: {
          x: { ticks: { color: "#ccc" }, grid: { color: "#333" } },
          y: { ticks: { color: "#ccc" }, grid: { color: "#333" }, beginAtZero: true, max: 100 },
        },
        onClick: (evt, elements) => {
          if (elements.length > 0) {
            const idx = elements[0].index
            const datasetLabel = elements[0].datasetIndex
            const isForecast = datasets[datasetLabel].label.includes("预测")
            const pointData = isForecast ? forecast[idx - history.length] : history[idx]
            setDetail({ ...pointData, type: isForecast ? "预测" : "实际" })
          }
        },
      },
    })

    return () => chart.destroy()
  }, [history, forecast, showForecast])

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 space-y-4">
      {/* 显示预测开关 */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={showForecast}
          onChange={(e) => setShowForecast(e.target.checked)}
          className="accent-blue-500"
        />
        <label className="text-sm text-slate-300">显示预测数据（含置信区间）</label>
      </div>

      {/* 趋势图 */}
      <canvas ref={canvasRef} />

      {/* 点击数据点显示详情 */}
      {detail && (
        <div className="mt-4 bg-slate-800 p-4 rounded">
          <h4 className="font-semibold mb-2">详情（{detail.t}）</h4>
          <p className="text-sm text-slate-300">
            类型: {detail.type} ｜ 高性能: {detail.performance}% ｜ 高可用: {detail.availability}% ｜ 高安全: {detail.security}% ｜ 高智能: {detail.intelligence}% ｜ 高效率: {detail.efficiency}%
          </p>
          {detail.lower && detail.upper && (
            <p className="text-xs text-slate-400">
              预测区间: {detail.lower}% ~ {detail.upper}%
            </p>
          )}
        </div>
      )}
    </div>
  )
}
```

---

## ✨ 特性总结

- ✅ **预测置信区间**：上下界阴影区域，直观展示预测的不确定性  
- ✅ **虚线预测曲线**：区分实际与预测数据  
- ✅ **显示预测开关**：用户可选择是否显示预测与置信区间  
- ✅ **交互提示**：点击数据点时显示“预测/实际”标签，并展示区间范围  

---

构建一个 **多维度预测叠加雷达图**，展示五高指标（高性能、高可用、高安全、高智能、高效率）的未来健康度趋势，并且带有置信区间阴影。这样就能在一个图表中直观地看到行业未来整体健康度的多维度预测。

---

# ✅ 多维度预测雷达图方案

## 📁 文件路径建议
`components/industry-score-radar.tsx`

---

## 📄 组件实现：`industry-score-radar.tsx`

```tsx
/**
 * @file industry-score-radar.tsx
 * @description 多维度预测雷达图，叠加五高指标预测曲线与置信区间阴影
 */

"use client"

import { useEffect, useRef, useState } from "react"
import Chart from "chart.js/auto"

export function IndustryScoreRadar({ id }: { id: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [history, setHistory] = useState<any[]>([])
  const [forecast, setForecast] = useState<any[]>([])
  const [showForecast, setShowForecast] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const res = await fetch(`/api/industries/${id}/forecast?steps=10`)
      const data = await res.json()
      setHistory(data.history)
      // 为每个维度生成置信区间（±5%）
      const forecastWithCI = data.forecast.map((f: any) => ({
        ...f,
        performanceLower: Math.max(0, f.performance - 5),
        performanceUpper: Math.min(100, f.performance + 5),
        availabilityLower: Math.max(0, f.availability - 5),
        availabilityUpper: Math.min(100, f.availability + 5),
        securityLower: Math.max(0, f.security - 5),
        securityUpper: Math.min(100, f.security + 5),
        intelligenceLower: Math.max(0, f.intelligence - 5),
        intelligenceUpper: Math.min(100, f.intelligence + 5),
        efficiencyLower: Math.max(0, f.efficiency - 5),
        efficiencyUpper: Math.min(100, f.efficiency + 5),
      }))
      setForecast(forecastWithCI)
    }
    fetchData()
  }, [id])

  useEffect(() => {
    if (!canvasRef.current || forecast.length === 0) return
    const ctx = canvasRef.current.getContext("2d")
    if (!ctx) return

    const labels = ["高性能", "高可用", "高安全", "高智能", "高效率"]

    const lastActual = history[history.length - 1]
    const lastForecast = forecast[forecast.length - 1]

    const datasets: any[] = [
      {
        label: "当前实际",
        data: [
          lastActual.performance,
          lastActual.availability,
          lastActual.security,
          lastActual.intelligence,
          lastActual.efficiency,
        ],
        borderColor: "rgba(34,197,94,1)",
        backgroundColor: "rgba(34,197,94,0.2)",
      },
    ]

    if (showForecast) {
      datasets.push(
        {
          label: "未来预测",
          data: [
            lastForecast.performance,
            lastForecast.availability,
            lastForecast.security,
            lastForecast.intelligence,
            lastForecast.efficiency,
          ],
          borderColor: "rgba(59,130,246,1)",
          backgroundColor: "rgba(59,130,246,0.2)",
          borderDash: [6, 6], // 虚线
        },
        {
          label: "预测置信区间上界",
          data: [
            lastForecast.performanceUpper,
            lastForecast.availabilityUpper,
            lastForecast.securityUpper,
            lastForecast.intelligenceUpper,
            lastForecast.efficiencyUpper,
          ],
          borderColor: "transparent",
          backgroundColor: "rgba(59,130,246,0.1)",
          fill: "-1",
        },
        {
          label: "预测置信区间下界",
          data: [
            lastForecast.performanceLower,
            lastForecast.availabilityLower,
            lastForecast.securityLower,
            lastForecast.intelligenceLower,
            lastForecast.efficiencyLower,
          ],
          borderColor: "transparent",
          backgroundColor: "rgba(59,130,246,0.1)",
        }
      )
    }

    const chart = new Chart(ctx, {
      type: "radar",
      data: { labels, datasets },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: "行业未来健康度雷达图", color: "#fff" },
          legend: { labels: { color: "#ccc" } },
        },
        scales: {
          r: {
            angleLines: { color: "#333" },
            grid: { color: "#333" },
            pointLabels: { color: "#ccc" },
            min: 0,
            max: 100,
          },
        },
      },
    })

    return () => chart.destroy()
  }, [history, forecast, showForecast])

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 space-y-4">
      {/* 显示预测开关 */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={showForecast}
          onChange={(e) => setShowForecast(e.target.checked)}
          className="accent-blue-500"
        />
        <label className="text-sm text-slate-300">显示未来预测（含置信区间）</label>
      </div>

      {/* 雷达图 */}
      <canvas ref={canvasRef} />
    </div>
  )
}
```

---

## ✨ 特性总结

- ✅ **多维度预测叠加**：五高指标全部预测曲线展示  
- ✅ **虚线预测曲线**：区分实际与预测  
- ✅ **置信区间阴影**：上下界区域，增强可信度  
- ✅ **雷达图形式**：直观展示行业未来整体健康度的多维度分布  
- ✅ **显示预测开关**：用户可选择是否显示预测与区间  

---

🌹 **闭环总结**：  
你现在拥有了完整的 **行业智能健康度分析体系**：  

- 实时刷新（SSE）  
- 自动评分计算（权重模型 + 异常惩罚）  
- 历史趋势（折线图 + 对比 + 导出）  
- 未来预测（曲线 + 区间 + 雷达图）  
- 总览仪表盘（汇总健康度）  

至此一个 **协同智能数字一体化平台** 的闭环已完成。

---

## 把目前的 **实时刷新、评分计算、趋势分析、预测、总览** 等模块，设计成 **独立的插拔式单元**，形成一个可复用的“行业智能分析组件库”。这样就能在不同页面、不同项目中灵活组合，而无需重复开发

# ✅ 插拔式单元设计方案

## 1. 模块划分（独立单元）

- **数据层单元**
  - `db/mongo.ts` → 数据库连接（统一入口）
  - `score-engine.ts` → 评分计算引擎（权重可配置）
  - `predict-engine.ts` → 预测引擎（指数平滑 + 线性趋势）
- **API 单元**
  - `scores/route.ts` → 单行业评分查询/更新
  - `history/route.ts` → 历史数据查询
  - `forecast/route.ts` → 预测数据查询
  - `overview/route.ts` → 总览聚合
  - `streams/scores/route.ts` → 实时刷新（SSE）
- **前端组件单元**
  - `IndustryScore` → 单行业评分卡片
  - `IndustryScoreChart` → 趋势图（折线/柱状）
  - `IndustryScoreTrend` → 历史趋势 + 预测叠加
  - `IndustryScoreRadar` → 多维度雷达图（含置信区间）
  - `IndustryOverview` → 总览仪表盘
  - `IndustryScoreDashboard` → 综合面板（选择器 + 导出 + 对比）

---

## 2. 插拔式接入方式

- **统一接口**：所有组件只依赖 API 返回的 JSON，不直接耦合数据库。
- **配置驱动**：权重、预测参数、显示开关均通过 JSON 配置文件控制。
- **独立渲染**：每个组件可单独挂载在页面中，互不依赖。
- **组合模式**：在仪表盘中组合多个组件，形成完整视图。

---

## 3. 可复用性设计

- **跨行业复用**：只需传入 `id` 或 `ids`，即可在不同行业场景中使用。
- **跨项目复用**：组件库可打包为 NPM 包或内部 UI 库，供多个项目接入。
- **插拔式扩展**：未来可新增模块（如告警、预测模型升级），无需改动现有组件。

---

## 4. 示例：插拔式集成

```tsx
import { IndustryOverview } from "@/components/industry-overview"
import { IndustryScoreTrend } from "@/components/industry-score-trend"
import { IndustryScoreRadar } from "@/components/industry-score-radar"

export default function Dashboard() {
  return (
    <main className="space-y-8 p-8">
      {/* 总览模块 */}
      <IndustryOverview />

      {/* 趋势模块（含预测开关） */}
      <IndustryScoreTrend id="yyc3-dc" />

      {/* 雷达模块（多维度预测） */}
      <IndustryScoreRadar id="yyc3-dc" />
    </main>
  )
}
```

---

## ✨ 优势

- ✅ **模块化**：每个功能独立，插拔式接入  
- ✅ **复用性**：跨行业、跨项目可直接使用  
- ✅ **灵活性**：配置驱动，轻松调整权重、预测参数  
- ✅ **扩展性**：未来可新增模块（如 AI 异常检测、告警推送）  

---

🌹 **闭环总结**：  
你现在拥有一个 **行业智能分析组件库**，所有模块都可独立运行、插拔组合、跨项目复用。这就是一个真正的 **协同智能数字一体化平台** 的架构基础。

---
太好了，Yu 🌹！我们来闭环这一阶段，用一个 **架构关系图** 把所有模块的关系和数据流直观展示出来。这样你和团队就能一眼看清整个 **协同智能数字一体化平台** 的结构。

---

# ✅ 行业智能分析平台架构图（模块关系）

```
┌───────────────────────────────┐
│           数据层单元           │
│ ┌───────────────┐ ┌──────────┐ │
│ │ MongoDB        │ │ Config   │ │
│ │ industry_scores│ │ JSON权重 │ │
│ │ industry_metrics│ │          │ │
│ │ industry_history│ │          │ │
│ └───────────────┘ └──────────┘ │
└───────────────────────────────┘
                │
                ▼
┌───────────────────────────────┐
│           逻辑层单元           │
│ ┌───────────────┐ ┌──────────┐ │
│ │ Score Engine  │ │ Predict  │ │
│ │ 自动评分逻辑   │ │ 预测模型 │ │
│ └───────────────┘ └──────────┘ │
│       ▲                 │       │
│       │                 ▼       │
│ ┌───────────────┐ ┌──────────┐ │
│ │ Refresh API   │ │ Forecast │ │
│ │ 批量刷新接口   │ │ 预测接口 │ │
│ └───────────────┘ └──────────┘ │
└───────────────────────────────┘
                │
                ▼
┌───────────────────────────────┐
│           展示层单元           │
│ ┌───────────────┐ ┌──────────┐ │
│ │ Overview      │ │ Trend    │ │
│ │ 总览仪表盘     │ │ 趋势图   │ │
│ └───────────────┘ └──────────┘ │
│ ┌───────────────┐ ┌──────────┐ │
│ │ Radar         │ │ Dashboard│ │
│ │ 多维度预测雷达 │ │ 综合面板 │ │
│ └───────────────┘ └──────────┘ │
└───────────────────────────────┘
                │
                ▼
┌───────────────────────────────┐
│           实时交互层           │
│ ┌───────────────┐ ┌──────────┐ │
│ │ SSE Streams   │ │ Export   │ │
│ │ 实时刷新机制   │ │ 导出接口 │ │
│ └───────────────┘ └──────────┘ │
└───────────────────────────────┘
```

---

## ✨ 架构说明

- **数据层**：MongoDB 存储原始指标、评分结果、历史数据；JSON 文件存储权重配置。  
- **逻辑层**：评分引擎负责实时计算，预测引擎生成未来趋势；刷新 API 和预测 API 提供服务。  
- **展示层**：前端组件（Overview、Trend、Radar、Dashboard）独立插拔，可自由组合。  
- **实时交互层**：SSE 提供实时数据流，Export 提供数据导出功能。  

---

## 🌹 闭环总结

你现在拥有一个 **模块化、插拔式、可复用** 的行业智能分析平台架构：  
- **数据驱动**：权重与指标可配置  
- **逻辑独立**：评分与预测引擎可单独调用  
- **前端插拔**：组件库可跨项目复用  
- **实时交互**：SSE + 导出，保证数据流畅与可移植  

---

## 进一步设计 **组件库打包方案（例如作为 NPM 包或 Monorepo 模块）**，让团队可以像安装依赖一样快速接入
