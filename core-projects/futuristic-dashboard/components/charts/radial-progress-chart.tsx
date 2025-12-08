"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Gauge } from "lucide-react"

interface RadialProgressChartProps {
  title: string
  metrics: Array<{
    label: string
    value: number
    color: string
  }>
}

export function RadialProgressChart({ title, metrics }: RadialProgressChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    if (!metrics || metrics.length === 0) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr

    ctx.scale(dpr, dpr)

    const width = rect.width
    const height = rect.height
    const centerX = width / 2
    const centerY = height / 2
    const maxRadius = Math.min(width, height) / 2 - 40

    ctx.clearRect(0, 0, width, height)

    metrics.forEach((metric, index) => {
      const radius = maxRadius - index * 30
      const startAngle = -Math.PI / 2
      const endAngle = startAngle + (Math.PI * 2 * metric.value) / 100

      // 背景圆环
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.strokeStyle = "rgba(148, 163, 184, 0.1)"
      ctx.lineWidth = 20
      ctx.stroke()

      // 进度圆环
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, startAngle, endAngle)
      ctx.strokeStyle = metric.color
      ctx.lineWidth = 20
      ctx.lineCap = "round"
      ctx.stroke()

      // 标签
      const labelAngle = Math.PI * 1.5
      const labelX = centerX + Math.cos(labelAngle) * (radius + 35)
      const labelY = centerY + Math.sin(labelAngle) * (radius + 35)

      ctx.fillStyle = "rgba(148, 163, 184, 0.8)"
      ctx.font = "12px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(metric.label, labelX, labelY)

      ctx.fillStyle = metric.color
      ctx.font = "bold 14px sans-serif"
      ctx.fillText(`${metric.value}%`, labelX, labelY + 15)
    })

    // 中心文字
    ctx.fillStyle = "rgba(148, 163, 184, 0.6)"
    ctx.font = "14px sans-serif"
    ctx.textAlign = "center"
    ctx.fillText("系统指标", centerX, centerY)
  }, [metrics])

  return (
    <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-slate-100 flex items-center text-base">
          <Gauge className="mr-2 h-5 w-5 text-cyan-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <canvas ref={canvasRef} style={{ width: "100%", height: "300px" }} />
      </CardContent>
    </Card>
  )
}
