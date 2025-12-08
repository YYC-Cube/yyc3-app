"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from "lucide-react"

interface MetricData {
  id: string
  label: string
  value: number
  unit: string
  change: number
  status: "normal" | "warning" | "critical" | "good"
  threshold: number
}

export function RealtimeMetricsGrid() {
  const [metrics, setMetrics] = useState<MetricData[]>([
    { id: "cpu", label: "CPU 使用率", value: 45, unit: "%", change: 2.3, status: "normal", threshold: 80 },
    { id: "memory", label: "内存占用", value: 68, unit: "%", change: -1.2, status: "normal", threshold: 85 },
    { id: "disk", label: "磁盘 I/O", value: 32, unit: "MB/s", change: 5.6, status: "good", threshold: 100 },
    { id: "network", label: "网络流量", value: 156, unit: "Mbps", change: 12.4, status: "normal", threshold: 1000 },
    { id: "requests", label: "请求数", value: 2847, unit: "req/s", change: 8.9, status: "good", threshold: 5000 },
    { id: "latency", label: "响应延迟", value: 23, unit: "ms", change: -3.1, status: "good", threshold: 100 },
    { id: "errors", label: "错误率", value: 0.12, unit: "%", change: -0.05, status: "good", threshold: 1 },
    { id: "connections", label: "活跃连接", value: 1234, unit: "个", change: 15.2, status: "normal", threshold: 5000 },
  ])

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) =>
        prev.map((metric) => {
          const variance = (Math.random() - 0.5) * 10
          let newValue = metric.value + variance

          // 确保值在合理范围内
          if (metric.id === "cpu" || metric.id === "memory") {
            newValue = Math.max(20, Math.min(95, newValue))
          } else if (metric.id === "errors") {
            newValue = Math.max(0, Math.min(2, newValue))
          } else if (metric.id === "latency") {
            newValue = Math.max(10, Math.min(150, newValue))
          }

          const change = newValue - metric.value

          // 更新状态
          let status: "normal" | "warning" | "critical" | "good" = "normal"
          if (metric.id === "errors") {
            if (newValue > metric.threshold * 0.8) status = "critical"
            else if (newValue > metric.threshold * 0.5) status = "warning"
            else status = "good"
          } else if (metric.id === "latency") {
            if (newValue > metric.threshold * 0.8) status = "warning"
            else if (newValue < metric.threshold * 0.3) status = "good"
            else status = "normal"
          } else {
            if (newValue > metric.threshold * 0.9) status = "critical"
            else if (newValue > metric.threshold * 0.7) status = "warning"
            else if (newValue < metric.threshold * 0.5) status = "good"
            else status = "normal"
          }

          return { ...metric, value: newValue, change, status }
        }),
      )
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "good":
        return "border-green-500/50 bg-green-500/5"
      case "warning":
        return "border-amber-500/50 bg-amber-500/5"
      case "critical":
        return "border-red-500/50 bg-red-500/5"
      default:
        return "border-slate-700/50 bg-slate-800/30"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "good":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-amber-500" />
      case "critical":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => (
        <Card key={metric.id} className={`border ${getStatusColor(metric.status)} backdrop-blur-sm`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-slate-400">{metric.label}</div>
              {getStatusIcon(metric.status)}
            </div>
            <div className="mb-2">
              <div className="text-2xl font-bold text-slate-100">
                {metric.value.toFixed(metric.id === "errors" ? 2 : 0)}
                <span className="text-sm text-slate-400 ml-1">{metric.unit}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                {metric.change > 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span className={`text-xs ${metric.change > 0 ? "text-green-500" : "text-red-500"}`}>
                  {Math.abs(metric.change).toFixed(1)}%
                </span>
              </div>
              <div className="text-xs text-slate-500">阈值: {metric.threshold}</div>
            </div>
            <Progress value={(metric.value / metric.threshold) * 100} className="h-1 mt-2 bg-slate-700">
              <div
                className={`h-full rounded-full ${
                  metric.status === "critical"
                    ? "bg-red-500"
                    : metric.status === "warning"
                      ? "bg-amber-500"
                      : metric.status === "good"
                        ? "bg-green-500"
                        : "bg-cyan-500"
                }`}
                style={{ width: `${Math.min(100, (metric.value / metric.threshold) * 100)}%` }}
              />
            </Progress>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
