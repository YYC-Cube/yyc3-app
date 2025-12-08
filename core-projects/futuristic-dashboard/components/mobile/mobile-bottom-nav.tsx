"use client"

import { Home, BarChart3, Bell, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MobileBottomNavProps {
  activeTab?: string
  onTabChange?: (tab: string) => void
}

export function MobileBottomNav({ activeTab = "home", onTabChange }: MobileBottomNavProps) {
  const tabs = [
    { id: "home", icon: Home, label: "首页" },
    { id: "analytics", icon: BarChart3, label: "分析" },
    { id: "notifications", icon: Bell, label: "通知" },
    { id: "settings", icon: Settings, label: "设置" },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-lg border-t border-slate-700 md:hidden z-50">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant="ghost"
            className={`flex-1 flex flex-col items-center space-y-1 h-auto py-2 ${
              activeTab === tab.id ? "text-cyan-400" : "text-slate-400"
            }`}
            onClick={() => onTabChange?.(tab.id)}
          >
            <tab.icon className="h-5 w-5" />
            <span className="text-xs">{tab.label}</span>
          </Button>
        ))}
      </div>
    </div>
  )
}
