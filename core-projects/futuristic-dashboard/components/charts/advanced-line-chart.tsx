"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"

interface DataPoint {
  time: string
  value: number
}

interface AdvancedLineChartProps {
  title?: string
  data?: DataPoint[]
  color?: string
  height?: number
}

export function AdvancedLineChart({
  title = "数据趋势",
  data = [],
  color = "#06b6d4",
  height = 300,
}: AdvancedLineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !data || !Array.isArray(data) || data.length === 0) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr

    ctx.scale(dpr, dpr)

    const width = rect.width
    const chartHeight = height - 20 - 40 // Adjusted for padding top and bottom

    const padding = { top: 20, right: 20, bottom: 40, left: 50 }
    const chartWidth = width - padding.left - padding.right

    // 清空画布
    ctx.clearRect(0, 0, width, height)

    // 获取数据范围
    const values = data.map((d) => d.value)
    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)
    const valueRange = maxValue - minValue || 1

    // 绘制网格线
    ctx.strokeStyle = "rgba(148, 163, 184, 0.1)"
    ctx.lineWidth = 1

    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight / 5) * i
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(padding.left + chartWidth, y)
      ctx.stroke()

      // Y轴标签
      const value = maxValue - (valueRange / 5) * i
      ctx.fillStyle = "rgba(148, 163, 184, 0.6)"
      ctx.font = "11px monospace"
      ctx.textAlign = "right"
      ctx.fillText(value.toFixed(0), padding.left - 10, y + 4)
    }

    // 绘制渐变填充
    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight)
    gradient.addColorStop(0, `${color}40`)
    gradient.addColorStop(1, `${color}00`)

    ctx.beginPath()
    data.forEach((point, index) => {
      const x = padding.left + (data.length > 1 ? (chartWidth / (data.length - 1)) * index : chartWidth / 2)
      const y = padding.top + chartHeight - ((point.value - minValue) / valueRange) * chartHeight

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight)
    ctx.lineTo(padding.left, padding.top + chartHeight)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()

    // 绘制主线条
    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.lineWidth = 2

    data.forEach((point, index) => {
      const x = padding.left + (data.length > 1 ? (chartWidth / (data.length - 1)) * index : chartWidth / 2)
      const y = padding.top + chartHeight - ((point.value - minValue) / valueRange) * chartHeight

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.stroke()

    // 绘制数据点
    data.forEach((point, index) => {
      const x = padding.left + (data.length > 1 ? (chartWidth / (data.length - 1)) * index : chartWidth / 2)
      const y = padding.top + chartHeight - ((point.value - minValue) / valueRange) * chartHeight

      // 外圈
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()

      // 内圈
      ctx.beginPath()
      ctx.arc(x, y, 2, 0, Math.PI * 2)
      ctx.fillStyle = "#0f172a"
      ctx.fill()
    })

    // X轴标签
    ctx.fillStyle = "rgba(148, 163, 184, 0.6)"
    ctx.font = "10px monospace"
    ctx.textAlign = "center"

    const labelStep = Math.max(1, Math.ceil(data.length / 6))
    data.forEach((point, index) => {
      if (index % labelStep === 0 || index === data.length - 1) {
        const x = padding.left + (data.length > 1 ? (chartWidth / (data.length - 1)) * index : chartWidth / 2)
        ctx.fillText(point.time, x, height - 10)
      }
    })
  }, [data, color])

  return (
    <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-slate-100 flex items-center text-base">
          <TrendingUp className="mr-2 h-5 w-5 text-cyan-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!data || data.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-slate-500">暂无数据</div>
        ) : (
          <canvas ref={canvasRef} style={{ width: "100%", height: `${height}px` }} />
        )}
      </CardContent>
    </Card>
  )
}
