"use client"

import { Cpu, HardDrive, Wifi, Shield } from "lucide-react"

interface MobileStatsGridProps {
  cpu: number
  memory: number
  network: number
  security: number
}

export function MobileStatsGrid({ cpu, memory, network, security }: MobileStatsGridProps) {
  const stats = [
    { label: "CPU", value: cpu, icon: Cpu, color: "cyan" },
    { label: "内存", value: memory, icon: HardDrive, color: "purple" },
    { label: "网络", value: network, icon: Wifi, color: "blue" },
    { label: "安全", value: security, icon: Shield, color: "green" },
  ]

  const getColorClass = (color: string) => {
    switch (color) {
      case "cyan":
        return "text-cyan-400"
      case "purple":
        return "text-purple-400"
      case "blue":
        return "text-blue-400"
      case "green":
        return "text-green-400"
      default:
        return "text-cyan-400"
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <stat.icon className={`h-5 w-5 ${getColorClass(stat.color)}`} />
            <div className={`text-2xl font-bold ${getColorClass(stat.color)}`}>{stat.value}%</div>
          </div>
          <div className="text-sm text-slate-400">{stat.label}</div>
          <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r from-${stat.color}-500 to-${stat.color}-600 rounded-full transition-all duration-500`}
              style={{ width: `${stat.value}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
