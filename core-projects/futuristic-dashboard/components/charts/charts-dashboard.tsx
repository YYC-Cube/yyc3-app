"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdvancedLineChart } from "./advanced-line-chart"
import { HeatmapChart } from "./heatmap-chart"
import { RadialProgressChart } from "./radial-progress-chart"
import { AreaComparisonChart } from "./area-comparison-chart"
import { RealTimeGauge } from "./real-time-gauge"
import { BarChart3, Activity } from "lucide-react"
import { generateTimeSeriesData } from "@/lib/chart-data-generator"

export function ChartsDashboard() {
  const performanceData = generateTimeSeriesData(24, 30, 90)

  const comparisonLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`)
  const comparisonSeries = [
    {
      label: "CPU",
      data: Array.from({ length: 24 }, () => Math.random() * 80 + 20),
      color: "#06b6d4",
    },
    {
      label: "内存",
      data: Array.from({ length: 24 }, () => Math.random() * 70 + 30),
      color: "#8b5cf6",
    },
    {
      label: "网络",
      data: Array.from({ length: 24 }, () => Math.random() * 60 + 40),
      color: "#3b82f6",
    },
  ]

  const days = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
  const heatmapData = days.flatMap((day) =>
    Array.from({ length: 24 }, (_, hour) => ({
      day,
      hour,
      value: Math.floor(Math.random() * 100),
    })),
  )

  return (
    <div className="grid gap-6">
      <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-slate-100 flex items-center text-base">
            <BarChart3 className="mr-2 h-5 w-5 text-cyan-500" />
            高级数据可视化
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="trends" className="w-full">
            <TabsList className="bg-slate-800/50 p-1 mb-4">
              <TabsTrigger
                value="trends"
                className="data-[state=active]:bg-slate-700 data-[state=active]:text-cyan-400"
              >
                趋势分析
              </TabsTrigger>
              <TabsTrigger
                value="comparison"
                className="data-[state=active]:bg-slate-700 data-[state=active]:text-cyan-400"
              >
                对比分析
              </TabsTrigger>
              <TabsTrigger
                value="heatmap"
                className="data-[state=active]:bg-slate-700 data-[state=active]:text-cyan-400"
              >
                热力图
              </TabsTrigger>
              <TabsTrigger
                value="gauges"
                className="data-[state=active]:bg-slate-700 data-[state=active]:text-cyan-400"
              >
                实时仪表
              </TabsTrigger>
            </TabsList>

            <TabsContent value="trends" className="mt-0">
              <div className="space-y-4">
                <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium text-slate-300">系统性能趋势</div>
                    <div className="text-xs text-slate-500">过去 24 小时</div>
                  </div>
                  <AdvancedLineChart title="CPU 使用率趋势" data={performanceData} color="#06b6d4" height={300} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="comparison" className="mt-0">
              <div className="space-y-4">
                <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium text-slate-300">多指标对比分析</div>
                    <div className="text-xs text-slate-500">实时数据</div>
                  </div>
                  <AreaComparisonChart
                    title="系统资源对比"
                    labels={comparisonLabels}
                    series={comparisonSeries}
                    height={300}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="heatmap" className="mt-0">
              <div className="space-y-4">
                <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium text-slate-300">24 小时活动热力图</div>
                    <div className="text-xs text-slate-500">按小时统计</div>
                  </div>
                  <HeatmapChart title="系统活动热力图" data={heatmapData} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="gauges" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                  <div className="text-sm font-medium text-slate-300 mb-3">CPU 负载</div>
                  <RealTimeGauge value={65} max={100} label="CPU" color="cyan" />
                </div>
                <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                  <div className="text-sm font-medium text-slate-300 mb-3">内存使用</div>
                  <RealTimeGauge value={72} max={100} label="内存" color="purple" />
                </div>
                <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                  <div className="text-sm font-medium text-slate-300 mb-3">网络吞吐</div>
                  <RealTimeGauge value={88} max={100} label="网络" color="blue" />
                </div>
                <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                  <div className="text-sm font-medium text-slate-300 mb-3">系统健康度</div>
                  <RealTimeGauge value={92} max={100} label="健康" color="green" />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Radial Progress Overview */}
      <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-slate-100 flex items-center text-base">
            <Activity className="mr-2 h-5 w-5 text-purple-500" />
            系统指标概览
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadialProgressChart />
        </CardContent>
      </Card>
    </div>
  )
}
