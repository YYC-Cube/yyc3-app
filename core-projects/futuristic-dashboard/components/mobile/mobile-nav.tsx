"use client"

import { useState } from "react"
import { Menu, Home, Activity, Database, Globe, Shield, Terminal, MessageSquare, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

interface MobileNavProps {
  activeItem?: string
  onItemClick?: (item: string) => void
}

export function MobileNav({ activeItem = "仪表板", onItemClick }: MobileNavProps) {
  const [open, setOpen] = useState(false)

  const navItems = [
    { icon: Home, label: "仪表板" },
    { icon: Activity, label: "系统诊断" },
    { icon: Database, label: "数据中心" },
    { icon: Globe, label: "网络监控" },
    { icon: Shield, label: "安全防护" },
    { icon: Terminal, label: "控制台" },
    { icon: MessageSquare, label: "通讯中心" },
    { icon: Settings, label: "系统设置" },
  ]

  const handleItemClick = (label: string) => {
    onItemClick?.(label)
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden text-slate-400 hover:text-slate-100">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="bg-slate-900 border-slate-700 w-[280px]">
        <SheetHeader>
          <SheetTitle className="text-slate-100 text-left">导航菜单</SheetTitle>
        </SheetHeader>
        <nav className="mt-6 space-y-2">
          {navItems.map((item) => (
            <Button
              key={item.label}
              variant="ghost"
              className={`w-full justify-start ${
                activeItem === item.label ? "bg-slate-800/70 text-cyan-400" : "text-slate-400 hover:text-slate-100"
              }`}
              onClick={() => handleItemClick(item.label)}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.label}
            </Button>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
