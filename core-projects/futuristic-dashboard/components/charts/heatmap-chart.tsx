"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity } from "lucide-react"

interface HeatmapData {
  day: string
  hour: number
  value: number
}

interface HeatmapChartProps {
  title: string
  data: HeatmapData[]
}

export function HeatmapChart({ title, data }: HeatmapChartProps) {
  const safeData = data || []
  const safeTitle = title || "热力图"

  const days = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
  const hours = Array.from({ length: 24 }, (_, i) => i)

  const getValueForCell = (day: string, hour: number) => {
    const cell = safeData.find((d) => d.day === day && d.hour === hour)
    return cell?.value || 0
  }

  const maxValue = safeData.length > 0 ? Math.max(...safeData.map((d) => d.value)) : 100

  const getColorIntensity = (value: number) => {
    if (maxValue === 0) return "bg-slate-800"

    const intensity = value / maxValue
    if (intensity > 0.8) return "bg-cyan-500"
    if (intensity > 0.6) return "bg-cyan-600"
    if (intensity > 0.4) return "bg-cyan-700"
    if (intensity > 0.2) return "bg-cyan-800"
    if (intensity > 0) return "bg-cyan-900"
    return "bg-slate-800"
  }

  return (
    <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-slate-100 flex items-center text-base">
          <Activity className="mr-2 h-5 w-5 text-cyan-500" />
          {safeTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* 小时标签 */}
            <div className="flex mb-1">
              <div className="w-12"></div>
              {hours.map((hour) => (
                <div key={hour} className="w-6 text-center">
                  {hour % 4 === 0 && <div className="text-xs text-slate-500">{hour}</div>}
                </div>
              ))}
            </div>

            {/* 热力图网格 */}
            {days.map((day) => (
              <div key={day} className="flex items-center mb-1">
                <div className="w-12 text-xs text-slate-400">{day}</div>
                {hours.map((hour) => {
                  const value = getValueForCell(day, hour)
                  return (
                    <div
                      key={`${day}-${hour}`}
                      className={`w-6 h-6 ${getColorIntensity(value)} rounded-sm mx-0.5 transition-all hover:scale-110 cursor-pointer relative group`}
                      title={`${day} ${hour}:00 - ${value}%`}
                    >
                      <div className="absolute hidden group-hover:block bg-slate-800 text-white text-xs rounded px-2 py-1 -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap z-10 border border-slate-700">
                        {day} {hour}:00
                        <div className="text-cyan-400">{value}%</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}

            {/* 图例 */}
            <div className="flex items-center justify-center mt-4 space-x-2">
              <div className="text-xs text-slate-500">低</div>
              <div className="flex space-x-1">
                <div className="w-6 h-4 bg-slate-800 rounded-sm"></div>
                <div className="w-6 h-4 bg-cyan-900 rounded-sm"></div>
                <div className="w-6 h-4 bg-cyan-800 rounded-sm"></div>
                <div className="w-6 h-4 bg-cyan-700 rounded-sm"></div>
                <div className="w-6 h-4 bg-cyan-600 rounded-sm"></div>
                <div className="w-6 h-4 bg-cyan-500 rounded-sm"></div>
              </div>
              <div className="text-xs text-slate-500">高</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
