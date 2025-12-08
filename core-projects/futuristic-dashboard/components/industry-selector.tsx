"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getAllIndustries, type IndustryType } from "@/lib/industry-adapter"
import {
  Building2,
  Server,
  Factory,
  DollarSign,
  Heart,
  Zap,
  ShoppingCart,
  Truck,
  Sprout,
  UtensilsCrossed,
  TrendingUp,
  Users,
  Film,
  Code,
  Palette,
  School,
  Leaf,
  Briefcase,
  Building,
  Car,
  Bed,
  User,
} from "lucide-react"

const iconMap = {
  Sprout,
  UtensilsCrossed,
  TrendingUp,
  Building2,
  Users,
  Heart,
  Film,
  Factory,
  Code,
  Palette,
  School,
  Zap,
  Leaf,
  Briefcase,
  Truck,
  Building,
  ShoppingCart,
  Car,
  Bed,
  User,
  Server,
  DollarSign,
}

interface IndustrySelectorProps {
  currentIndustry: IndustryType
  onIndustryChange: (industry: IndustryType) => void
}

export function IndustrySelector({ currentIndustry, onIndustryChange }: IndustrySelectorProps) {
  const industries = getAllIndustries()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50"
      >
        <Building2 className="mr-2 h-4 w-4" />
        切换行业场景
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <Card className="absolute top-12 left-0 z-50 w-[700px] max-h-[600px] overflow-y-auto bg-slate-900/95 border-slate-700/50 backdrop-blur-sm shadow-2xl">
            <CardHeader className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 z-10">
              <CardTitle className="text-slate-100">选择行业场景</CardTitle>
              <CardDescription>系统将根据所选行业自动调整监控指标和 AI 模型（共24个行业）</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-3">
                {industries.map((industry) => {
                  const Icon = iconMap[industry.icon as keyof typeof iconMap] || Building2
                  const isActive = industry.id === currentIndustry

                  return (
                    <Button
                      key={industry.id}
                      variant="outline"
                      className={`h-auto p-4 flex flex-col items-start space-y-2 transition-all ${
                        isActive
                          ? "bg-cyan-500/20 border-cyan-500/50 hover:bg-cyan-500/30"
                          : "bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50"
                      }`}
                      onClick={() => {
                        onIndustryChange(industry.id)
                        setIsOpen(false)
                      }}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-2">
                          <Icon className={`h-5 w-5 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                          <Badge variant="outline" className="text-xs bg-slate-700/50 border-slate-600/50">
                            {industry.code}
                          </Badge>
                        </div>
                        {isActive && (
                          <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50 text-xs">当前</Badge>
                        )}
                      </div>
                      <div className="text-left w-full">
                        <div className="font-medium text-slate-100">{industry.name}</div>
                        <div className="text-xs text-slate-400 mt-1 line-clamp-2">{industry.description}</div>
                      </div>
                    </Button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
