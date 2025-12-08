"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, TrendingUp, TrendingDown, Minus } from "lucide-react"

interface DataPoint {
  timestamp: number
  value: number
  label: string
}

interface RealtimeDataStreamProps {
  title: string
  unit: string
  color?: "cyan" | "purple" | "blue" | "green" | "amber" | "red"
  maxDataPoints?: number
  updateInterval?: number
  valueRange?: [number, number]
}

export function RealtimeDataStream({
  title,
  unit,
  color = "cyan",
  maxDataPoints = 50,
  updateInterval = 1000,
  valueRange = [0, 100],
}: RealtimeDataStreamProps) {
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([])
  const [currentValue, setCurrentValue] = useState(0)
  const [trend, setTrend] = useState<"up" | "down" | "stable">("stable")
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const colorMap = {
    cyan: { primary: "rgb(34, 211, 238)", gradient: "rgba(34, 211, 238, 0.2)", text: "text-cyan-400" },
    purple: { primary: "rgb(168, 85, 247)", gradient: "rgba(168, 85, 247, 0.2)", text: "text-purple-400" },
    blue: { primary: "rgb(59, 130, 246)", gradient: "rgba(59, 130, 246, 0.2)", text: "text-blue-400" },
    green: { primary: "rgb(34, 197, 94)", gradient: "rgba(34, 197, 94, 0.2)", text: "text-green-400" },
    amber: { primary: "rgb(251, 191, 36)", gradient: "rgba(251, 191, 36, 0.2)", text: "text-amber-400" },
    red: { primary: "rgb(239, 68, 68)", gradient: "rgba(239, 68, 68, 0.2)", text: "text-red-400" },
  }

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      const [min, max] = valueRange
      const newValue = Math.random() * (max - min) + min

      setDataPoints((prev) => {
        const updated = [...prev, { timestamp: now, value: newValue, label: new Date(now).toLocaleTimeString() }]
        return updated.slice(-maxDataPoints)
      })

      // 计算趋势
      if (dataPoints.length > 5) {
        const recent = dataPoints.slice(-5)
        const avg = recent.reduce((sum, p) => sum + p.value, 0) / recent.length
        if (newValue > avg * 1.05) setTrend("up")
        else if (newValue < avg * 0.95) setTrend("down")
        else setTrend("stable")
      }

      setCurrentValue(newValue)
    }, updateInterval)

    return () => clearInterval(interval)
  }, [dataPoints, maxDataPoints, updateInterval, valueRange])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || dataPoints.length < 2) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    ctx.clearRect(0, 0, width, height)

    const [min, max] = valueRange
    const xStep = width / (maxDataPoints - 1)

    // 绘制网格线
    ctx.strokeStyle = "rgba(100, 116, 139, 0.1)"
    ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const y = (height / 4) * i
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    // 绘制渐变填充
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, colorMap[color].gradient)
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)")

    ctx.beginPath()
    dataPoints.forEach((point, index) => {
      const x = index * xStep
      const y = height - ((point.value - min) / (max - min)) * height
      if (index === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.lineTo(width, height)
    ctx.lineTo(0, height)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()

    // 绘制线条
    ctx.strokeStyle = colorMap[color].primary
    ctx.lineWidth = 2
    ctx.beginPath()
    dataPoints.forEach((point, index) => {
      const x = index * xStep
      const y = height - ((point.value - min) / (max - min)) * height
      if (index === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()

    // 绘制当前值点
    if (dataPoints.length > 0) {
      const lastPoint = dataPoints[dataPoints.length - 1]
      const x = (dataPoints.length - 1) * xStep
      const y = height - ((lastPoint.value - min) / (max - min)) * height

      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fillStyle = colorMap[color].primary
      ctx.fill()

      ctx.beginPath()
      ctx.arc(x, y, 8, 0, Math.PI * 2)
      ctx.strokeStyle = colorMap[color].primary
      ctx.lineWidth = 2
      ctx.stroke()
    }
  }, [dataPoints, color, maxDataPoints, valueRange])

  return (
    <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-slate-100 text-sm font-medium">{title}</CardTitle>
          <div className="flex items-center space-x-2">
            {trend === "up" && <TrendingUp className="h-4 w-4 text-green-500" />}
            {trend === "down" && <TrendingDown className="h-4 w-4 text-red-500" />}
            {trend === "stable" && <Minus className="h-4 w-4 text-blue-500" />}
            <Badge variant="outline" className="bg-slate-800/50 text-cyan-400 border-cyan-500/50 text-xs">
              <Activity className="h-3 w-3 mr-1" />
              实时
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="mb-3">
          <div className={`text-3xl font-bold ${colorMap[color].text}`}>
            {currentValue.toFixed(1)}
            <span className="text-sm text-slate-400 ml-2">{unit}</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {dataPoints.length > 0 && dataPoints[dataPoints.length - 1].label}
          </div>
        </div>
        <div className="relative">
          <canvas ref={canvasRef} width={400} height={120} className="w-full h-[120px]" />
        </div>
      </CardContent>
    </Card>
  )
}
