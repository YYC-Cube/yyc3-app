"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EnhancedAIPanel } from "@/components/enhanced-ai-panel"
import { generateIndustryMetrics, type IndustryType } from "@/lib/industry-adapter"
import { Brain, ArrowLeft, RefreshCw } from "lucide-react"
import Link from "next/link"

export default function AIAnalysisPage() {
  const [industry] = useState<IndustryType>("data-center")
  const [metrics, setMetrics] = useState<Record<string, number>>({})
  const [historicalData, setHistoricalData] = useState<Record<string, number[]>>({})

  useEffect(() => {
    // 生成初始指标
    const initialMetrics = generateIndustryMetrics(industry)
    setMetrics(initialMetrics)

    // 生成历史数据
    const historical: Record<string, number[]> = {}
    Object.keys(initialMetrics).forEach((key) => {
      historical[key] = Array.from({ length: 48 }, () => Math.floor(Math.random() * 50) + 30)
    })
    setHistoricalData(historical)

    // 定期更新指标
    const interval = setInterval(() => {
      const newMetrics = generateIndustryMetrics(industry)
      setMetrics(newMetrics)
    }, 5000)

    return () => clearInterval(interval)
  }, [industry])

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
                AI 智能分析中心
              </h1>
              <p className="text-sm text-slate-400 mt-1">多模型集成预测 · 异常根因分析 · 预测性维护</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50">
              <Brain className="h-3 w-3 mr-1" />
              AI 驱动
            </Badge>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-100">
              <RefreshCw className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Current Metrics */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader className="border-b border-slate-700/50 pb-3">
                <CardTitle className="text-slate-100 text-base">当前指标</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {Object.entries(metrics).map(([key, value]) => (
                    <div key={key} className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                      <div className="text-xs text-slate-500 mb-1">{key}</div>
                      <div className="text-xl font-bold text-cyan-400">{value}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Enhanced AI Panel */}
          <div className="lg:col-span-2">
            <EnhancedAIPanel industry={industry} metrics={metrics} historicalData={historicalData} />
          </div>
        </div>
      </div>
    </div>
  )
}
