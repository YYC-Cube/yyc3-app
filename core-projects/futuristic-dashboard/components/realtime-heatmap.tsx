"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface HeatmapCell {
  x: number
  y: number
  value: number
  label: string
}

export function RealtimeHeatmap() {
  const [heatmapData, setHeatmapData] = useState<HeatmapCell[]>([])

  const rows = 8
  const cols = 12

  useEffect(() => {
    // 初始化热力图数据
    const initialData: HeatmapCell[] = []
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        initialData.push({
          x,
          y,
          value: Math.random() * 100,
          label: `节点-${y * cols + x + 1}`,
        })
      }
    }
    setHeatmapData(initialData)

    // 定期更新数据
    const interval = setInterval(() => {
      setHeatmapData((prev) =>
        prev.map((cell) => ({
          ...cell,
          value: Math.max(0, Math.min(100, cell.value + (Math.random() - 0.5) * 20)),
        })),
      )
    }, 1500)

    return () => clearInterval(interval)
  }, [])

  const getColor = (value: number) => {
    if (value < 20) return "bg-blue-500/20"
    if (value < 40) return "bg-cyan-500/40"
    if (value < 60) return "bg-green-500/60"
    if (value < 80) return "bg-amber-500/80"
    return "bg-red-500"
  }

  return (
    <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
      <CardHeader className="border-b border-slate-700/50 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-slate-100 text-base">集群负载热力图</CardTitle>
          <Badge variant="outline" className="bg-slate-800/50 text-cyan-400 border-cyan-500/50 text-xs">
            {rows * cols} 节点
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {heatmapData.map((cell, idx) => (
            <div
              key={idx}
              className={`aspect-square rounded ${getColor(cell.value)} transition-colors duration-300 hover:ring-2 hover:ring-cyan-500 cursor-pointer`}
              title={`${cell.label}: ${cell.value.toFixed(1)}%`}
            />
          ))}
        </div>
        <div className="flex items-center justify-between mt-4 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-blue-500/20"></div>
            <span>低负载</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-green-500/60"></div>
            <span>正常</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-amber-500/80"></div>
            <span>较高</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-red-500"></div>
            <span>高负载</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
