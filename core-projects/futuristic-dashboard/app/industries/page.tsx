"use client"

import { useState } from "react"
import {
  getAllIndustries,
  getIndustryConfig,
  generateIndustryMetrics,
  getIndustryHighScores,
  type IndustryType,
} from "@/lib/industry-adapter"

export default function IndustriesPage() {
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType>("yyc3-dc")
  const industries = getAllIndustries()
  const currentConfig = getIndustryConfig(selectedIndustry)
  const metrics = generateIndustryMetrics(selectedIndustry)
  const highScores = getIndustryHighScores(selectedIndustry)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white p-6">
      {/* 头部 */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center gap-3 mb-4">
          <img src="/logo.png" alt="星云操作系统" className="h-12 w-12 object-contain" />
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              星云操作系统 - 24行业AI智能管理平台
            </h1>
            <p className="text-slate-400">基于"五高五标五化"理念的企业级智能管理系统</p>
          </div>
        </div>
      </div>

      {/* 行业选择器 */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">🏢</span>
            选择行业场景
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {industries.map((industry) => (
              <button
                key={industry.id}
                onClick={() => setSelectedIndustry(industry.id)}
                className={`p-4 rounded-lg border transition-all ${
                  selectedIndustry === industry.id
                    ? "bg-blue-600 border-blue-500 shadow-lg shadow-blue-500/50"
                    : "bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800"
                }`}
              >
                <div className="text-2xl mb-2">{getIndustryIcon(industry.icon)}</div>
                <div className="text-sm font-medium">{industry.name}</div>
                <div className="text-xs text-slate-400 mt-1">{industry.code}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 当前行业详情 */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 行业信息 */}
        <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-lg p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="text-5xl">{getIndustryIcon(currentConfig.icon)}</div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{currentConfig.name}</h2>
              <p className="text-slate-400 mb-3">{currentConfig.description}</p>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded-full text-sm">
                  {currentConfig.code}
                </span>
                <span className="px-3 py-1 bg-green-600/20 border border-green-500/30 rounded-full text-sm">
                  {currentConfig.id}
                </span>
              </div>
            </div>
          </div>

          {/* 行业指标 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">核心监控指标</h3>
            <div className="grid grid-cols-2 gap-3">
              {currentConfig.metrics.slice(0, 4).map((metric) => (
                <div key={metric.id} className="bg-slate-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">{metric.name}</span>
                    <span className="text-xs text-slate-500">{metric.category}</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-400">
                    {metrics[metric.id] || 0}
                    <span className="text-sm text-slate-400 ml-1">{metric.unit}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    正常范围: {metric.normalRange[0]}-{metric.normalRange[1]}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI 模型 */}
          <div>
            <h3 className="text-lg font-semibold mb-3">AI 智能模型</h3>
            <div className="space-y-2">
              {currentConfig.aiModels.map((model) => (
                <div key={model.id} className="bg-slate-800/50 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{model.name}</div>
                    <div className="text-xs text-slate-400">类型: {model.type}</div>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs ${
                      model.enabled
                        ? "bg-green-600/20 border border-green-500/30 text-green-400"
                        : "bg-slate-700/50 border border-slate-600 text-slate-400"
                    }`}
                  >
                    {model.enabled ? "已启用" : "未启用"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 五高架构评分 */}
        <div className="space-y-6">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">五高架构评分</h3>
            <div className="space-y-4">
              {[
                { label: "高性能", value: highScores.performance, color: "blue" },
                { label: "高可用", value: highScores.availability, color: "green" },
                { label: "高安全", value: highScores.security, color: "red" },
                { label: "高智能", value: highScores.intelligence, color: "purple" },
                { label: "高效率", value: highScores.efficiency, color: "yellow" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">{item.label}</span>
                    <span className="text-sm font-bold">{item.value}%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r from-${item.color}-600 to-${item.color}-400 transition-all duration-500`}
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 五标体系 */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">五标体系配置</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">API 标准</span>
                <span className="text-xs px-2 py-1 bg-blue-600/20 border border-blue-500/30 rounded">
                  {currentConfig.standards.apiStandard}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">数据格式</span>
                <span className="text-xs px-2 py-1 bg-green-600/20 border border-green-500/30 rounded">
                  {currentConfig.standards.dataFormat}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">监控协议</span>
                <span className="text-xs px-2 py-1 bg-purple-600/20 border border-purple-500/30 rounded">
                  {currentConfig.standards.monitoringProtocol}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">服务等级</span>
                <span className="text-xs px-2 py-1 bg-yellow-600/20 border border-yellow-500/30 rounded">
                  {currentConfig.standards.serviceLevel}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部说明 */}
      <div className="max-w-7xl mx-auto mt-8 text-center text-sm text-slate-500">
        <p>支持24个行业场景 | 基于"五高五标五化"理念 | 企业级AI智能管理平台</p>
      </div>
    </div>
  )
}

// 简单的图标映射函数
function getIndustryIcon(iconName: string): string {
  const iconMap: Record<string, string> = {
    Sprout: "🌱",
    Utensils: "🍽️",
    TrendingUp: "📈",
    Building2: "🏢",
    Users: "👥",
    Heart: "❤️",
    Film: "🎬",
    Factory: "🏭",
    Code: "💻",
    Palette: "🎨",
    GraduationCap: "🎓",
    Zap: "⚡",
    Leaf: "🍃",
    Scale: "⚖️",
    Truck: "🚚",
    Briefcase: "💼",
    Home: "🏠",
    ShoppingCart: "🛒",
    Car: "🚗",
    Plane: "✈️",
    HeartPulse: "💓",
    Cpu: "🖥️",
    Database: "💾",
    DollarSign: "💰",
  }
  return iconMap[iconName] || "🔷"
}
