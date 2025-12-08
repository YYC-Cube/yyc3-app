"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RealtimeDataStream } from "@/components/realtime-data-stream"
import { RealtimeMetricsGrid } from "@/components/realtime-metrics-grid"
import { RealtimeHeatmap } from "@/components/realtime-heatmap"
import { Activity, ArrowLeft, Maximize2, Minimize2 } from "lucide-react"
import Link from "next/link"

export default function RealtimeDashboardPage() {
  const [isFullscreen, setIsFullscreen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-slate-900 text-slate-100">
      <div className="container mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-100">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                实时数据看板
              </h1>
              <p className="text-sm text-slate-400 mt-1">实时监控 · 动态更新 · 多维度分析</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50">
              <Activity className="h-3 w-3 mr-1 animate-pulse" />
              实时更新
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="text-slate-400 hover:text-slate-100"
            >
              {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-200 mb-4">关键指标</h2>
          <RealtimeMetricsGrid />
        </div>

        {/* Data Streams */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-200 mb-4">实时数据流</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <RealtimeDataStream title="CPU 使用率" unit="%" color="cyan" valueRange={[20, 80]} updateInterval={1000} />
            <RealtimeDataStream title="内存占用" unit="%" color="purple" valueRange={[40, 85]} updateInterval={1000} />
            <RealtimeDataStream
              title="网络吞吐量"
              unit="Mbps"
              color="blue"
              valueRange={[50, 200]}
              updateInterval={1000}
            />
            <RealtimeDataStream
              title="磁盘 I/O"
              unit="MB/s"
              color="green"
              valueRange={[10, 100]}
              updateInterval={1000}
            />
            <RealtimeDataStream
              title="请求响应时间"
              unit="ms"
              color="amber"
              valueRange={[10, 100]}
              updateInterval={1000}
            />
            <RealtimeDataStream
              title="活跃连接数"
              unit="个"
              color="red"
              valueRange={[500, 2000]}
              updateInterval={1000}
            />
          </div>
        </div>

        {/* Heatmap */}
        <div>
          <h2 className="text-lg font-semibold text-slate-200 mb-4">集群状态</h2>
          <RealtimeHeatmap />
        </div>
      </div>
    </div>
  )
}
