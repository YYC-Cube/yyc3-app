"use client"

import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface MobileMetricCardProps {
  title: string
  value: number
  icon: LucideIcon
  color: string
  detail: string
}

export function MobileMetricCard({ title, value, icon: Icon, color, detail }: MobileMetricCardProps) {
  const getColorClasses = () => {
    switch (color) {
      case "cyan":
        return "from-cyan-500 to-blue-500 border-cyan-500/30"
      case "purple":
        return "from-purple-500 to-pink-500 border-purple-500/30"
      case "blue":
        return "from-blue-500 to-indigo-500 border-blue-500/30"
      default:
        return "from-cyan-500 to-blue-500 border-cyan-500/30"
    }
  }

  return (
    <Card className={`bg-slate-800/50 rounded-lg border ${getColorClasses()} overflow-hidden`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-slate-400">{title}</div>
          <Icon className={`h-5 w-5 text-${color}-500`} />
        </div>
        <div className="mb-2">
          <div className="text-3xl font-bold text-slate-100">{value}%</div>
          <div className="text-xs text-slate-500 mt-1">{detail}</div>
        </div>
        <Progress value={value} className="h-2 bg-slate-700">
          <div className={`h-full bg-gradient-to-r ${getColorClasses()} rounded-full`} style={{ width: `${value}%` }} />
        </Progress>
      </CardContent>
    </Card>
  )
}
