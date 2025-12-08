"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3 } from "@/lib/icons"
import { Badge } from "@/components/ui/badge"

interface DataSeries {
  label: string
  data: number[]
  color: string
}

interface AreaComparisonChartProps {
  title: string
  labels: string[]
  series: DataSeries[]
  height?: number
}

export function AreaComparisonChart({
  title = "数据对比",
  labels = [],
  series = [],
  height = 300,
}: AreaComparisonChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !series || series.length === 0 || !labels || labels.length === 0) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const validSeries = series.filter((s) => s && Array.isArray(s.data) && s.data.length > 0)
    if (validSeries.length === 0) return

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1
    const rect = canvas.getBoundingClientRect()

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr

    ctx.scale(dpr, dpr)

    const width = rect.width
    const height = rect.height
    const padding = { top: 20, right: 20, bottom: 40, left: 50 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    ctx.clearRect(0, 0, width, height)

    // 获取最大值
    const maxValue = Math.max(...validSeries.flatMap((s) => s.data), 1) // 添加最小值 1 防止除零

    // 绘制网格
    ctx.strokeStyle = "rgba(148, 163, 184, 0.1)"
    ctx.lineWidth = 1

    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight / 5) * i
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(padding.left + chartWidth, y)
      ctx.stroke()

      const value = maxValue - (maxValue / 5) * i
      ctx.fillStyle = "rgba(148, 163, 184, 0.6)"
      ctx.font = "11px monospace"
      ctx.textAlign = "right"
      ctx.fillText(value.toFixed(0), padding.left - 10, y + 4)
    }

    // 绘制每个数据系列
    validSeries.forEach((dataSeries) => {
      // 渐变填充
      const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight)
      gradient.addColorStop(0, `${dataSeries.color}30`)
      gradient.addColorStop(1, `${dataSeries.color}00`)

      ctx.beginPath()
      const dataLength = Math.max(dataSeries.data.length - 1, 1) // 防止除零
      dataSeries.data.forEach((value, index) => {
        const x = padding.left + (chartWidth / dataLength) * index
        const y = padding.top + chartHeight - (value / maxValue) * chartHeight

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

      // 线条
      ctx.beginPath()
      ctx.strokeStyle = dataSeries.color
      ctx.lineWidth = 2

      dataSeries.data.forEach((value, index) => {
        const x = padding.left + (chartWidth / dataLength) * index
        const y = padding.top + chartHeight - (value / maxValue) * chartHeight

        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })

      ctx.stroke()
    })

    // X轴标签
    ctx.fillStyle = "rgba(148, 163, 184, 0.6)"
    ctx.font = "10px monospace"
    ctx.textAlign = "center"

    const labelStep = Math.max(Math.ceil(labels.length / 6), 1) // 防止除零
    labels.forEach((label, index) => {
      if (index % labelStep === 0 || index === labels.length - 1) {
        const x = padding.left + (chartWidth / Math.max(labels.length - 1, 1)) * index
        ctx.fillText(label, x, height - 10)
      }
    })
  }, [labels, series])

  return (
    <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-slate-100 flex items-center text-base">
            <BarChart3 className="mr-2 h-5 w-5 text-cyan-500" />
            {title}
          </CardTitle>
          <div className="flex items-center space-x-2">
            {series &&
              Array.isArray(series) &&
              series.map((s) => (
                <Badge key={s.label} variant="outline" className="bg-slate-800/50 border-slate-700/50">
                  <div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: s.color }}></div>
                  {s.label}
                </Badge>
              ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <canvas ref={canvasRef} style={{ width: "100%", height: `${height}px` }} />
      </CardContent>
    </Card>
  )
}
