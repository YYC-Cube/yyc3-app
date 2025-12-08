"use client"

import { Brain, TrendingUp, AlertTriangle, Lightbulb, Activity } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { PredictionResult, AnomalyDetection } from "@/lib/ai-engine"

interface AIInsightsPanelProps {
  predictions: {
    cpu: PredictionResult | null
    memory: PredictionResult | null
    network: PredictionResult | null
  }
  anomalies: {
    cpu: AnomalyDetection | null
    memory: AnomalyDetection | null
    network: AnomalyDetection | null
  }
  recommendations: Array<{
    type: "optimization" | "warning" | "info"
    title: string
    description: string
    priority: "low" | "medium" | "high"
  }>
}

export function AIInsightsPanel({ predictions, anomalies, recommendations }: AIInsightsPanelProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/20 text-red-400 border-red-500/50"
      case "high":
        return "bg-orange-500/20 text-orange-400 border-orange-500/50"
      case "medium":
        return "bg-amber-500/20 text-amber-400 border-amber-500/50"
      case "low":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/50"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/20 text-red-400 border-red-500/50"
      case "medium":
        return "bg-amber-500/20 text-amber-400 border-amber-500/50"
      case "low":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50"
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/50"
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return "↗"
      case "down":
        return "↘"
      default:
        return "→"
    }
  }

  return (
    <div className="grid gap-6">
      {/* AI 预测面板 */}
      <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-slate-100 flex items-center text-base">
            <Brain className="mr-2 h-5 w-5 text-purple-500" />
            AI 智能预测
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {predictions.cpu && (
              <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-slate-300">CPU 使用率预测</div>
                  <Badge variant="outline" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50">
                    {getTrendIcon(predictions.cpu.trend)}{" "}
                    {predictions.cpu.trend === "up" ? "上升" : predictions.cpu.trend === "down" ? "下降" : "稳定"}
                  </Badge>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-2xl font-bold text-cyan-400">{predictions.cpu.predicted.toFixed(1)}%</div>
                    <div className="text-xs text-slate-500">
                      置信度: {(predictions.cpu.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                  <Progress value={predictions.cpu.confidence * 100} className="w-24 h-2" />
                </div>
              </div>
            )}

            {predictions.memory && (
              <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-slate-300">内存占用预测</div>
                  <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/50">
                    {getTrendIcon(predictions.memory.trend)}{" "}
                    {predictions.memory.trend === "up" ? "上升" : predictions.memory.trend === "down" ? "下降" : "稳定"}
                  </Badge>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-2xl font-bold text-purple-400">{predictions.memory.predicted.toFixed(1)}%</div>
                    <div className="text-xs text-slate-500">
                      置信度: {(predictions.memory.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                  <Progress value={predictions.memory.confidence * 100} className="w-24 h-2" />
                </div>
              </div>
            )}

            {predictions.network && (
              <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-slate-300">网络状态预测</div>
                  <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                    {getTrendIcon(predictions.network.trend)}{" "}
                    {predictions.network.trend === "up"
                      ? "上升"
                      : predictions.network.trend === "down"
                        ? "下降"
                        : "稳定"}
                  </Badge>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-2xl font-bold text-blue-400">{predictions.network.predicted.toFixed(1)}%</div>
                    <div className="text-xs text-slate-500">
                      置信度: {(predictions.network.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                  <Progress value={predictions.network.confidence * 100} className="w-24 h-2" />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 异常检测面板 */}
      <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-slate-100 flex items-center text-base">
            <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
            异常检测
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {anomalies.cpu?.isAnomaly && (
              <div className="flex items-start space-x-3 bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                <Activity className="h-4 w-4 text-cyan-500 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-medium text-slate-200">CPU 异常</div>
                    <Badge variant="outline" className={getSeverityColor(anomalies.cpu.severity)}>
                      {anomalies.cpu.severity === "critical"
                        ? "严重"
                        : anomalies.cpu.severity === "high"
                          ? "高"
                          : anomalies.cpu.severity === "medium"
                            ? "中"
                            : "低"}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-400">{anomalies.cpu.reason}</div>
                </div>
              </div>
            )}

            {anomalies.memory?.isAnomaly && (
              <div className="flex items-start space-x-3 bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                <Activity className="h-4 w-4 text-purple-500 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-medium text-slate-200">内存异常</div>
                    <Badge variant="outline" className={getSeverityColor(anomalies.memory.severity)}>
                      {anomalies.memory.severity === "critical"
                        ? "严重"
                        : anomalies.memory.severity === "high"
                          ? "高"
                          : anomalies.memory.severity === "medium"
                            ? "中"
                            : "低"}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-400">{anomalies.memory.reason}</div>
                </div>
              </div>
            )}

            {anomalies.network?.isAnomaly && (
              <div className="flex items-start space-x-3 bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                <Activity className="h-4 w-4 text-blue-500 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-medium text-slate-200">网络异常</div>
                    <Badge variant="outline" className={getSeverityColor(anomalies.network.severity)}>
                      {anomalies.network.severity === "critical"
                        ? "严重"
                        : anomalies.network.severity === "high"
                          ? "高"
                          : anomalies.network.severity === "medium"
                            ? "中"
                            : "低"}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-400">{anomalies.network.reason}</div>
                </div>
              </div>
            )}

            {!anomalies.cpu?.isAnomaly && !anomalies.memory?.isAnomaly && !anomalies.network?.isAnomaly && (
              <div className="text-center py-6 text-slate-500">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <div className="text-sm">系统运行正常，未检测到异常</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 智能建议面板 */}
      <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-slate-100 flex items-center text-base">
            <Lightbulb className="mr-2 h-5 w-5 text-yellow-500" />
            智能建议
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recommendations.length > 0 ? (
              recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 bg-slate-800/30 rounded-lg p-3 border border-slate-700/50"
                >
                  <TrendingUp className="h-4 w-4 text-cyan-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-medium text-slate-200">{rec.title}</div>
                      <Badge variant="outline" className={getPriorityColor(rec.priority)}>
                        {rec.priority === "high" ? "高优先级" : rec.priority === "medium" ? "中优先级" : "低优先级"}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-400">{rec.description}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-slate-500">
                <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <div className="text-sm">系统运行良好，暂无优化建议</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
