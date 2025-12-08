"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Brain, TrendingUp, AlertTriangle, Lightbulb, Target, Zap, Shield, ChevronRight, BarChart3 } from "lucide-react"
import {
  ensemblePrediction,
  generateRealTimeInsights,
  analyzeRootCause,
  predictiveMaintenance,
  type MultiModelPrediction,
  type RealTimeInsight,
} from "@/lib/enhanced-ai-engine"
import type { IndustryType } from "@/lib/industry-adapter"

interface EnhancedAIPanelProps {
  industry: IndustryType
  metrics: Record<string, number>
  historicalData?: Record<string, number[]>
}

export function EnhancedAIPanel({ industry, metrics, historicalData }: EnhancedAIPanelProps) {
  const [predictions, setPredictions] = useState<MultiModelPrediction | null>(null)
  const [insights, setInsights] = useState<RealTimeInsight[]>([])
  const [rootCauseAnalysis, setRootCauseAnalysis] = useState<any>(null)
  const [maintenancePredictions, setMaintenancePredictions] = useState<any[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  useEffect(() => {
    runEnhancedAnalysis()
  }, [metrics, industry])

  const runEnhancedAnalysis = () => {
    setIsAnalyzing(true)

    // 生成实时洞察
    const newInsights = generateRealTimeInsights(metrics, industry)
    setInsights(newInsights)

    // 多模型预测（使用模拟历史数据）
    const sampleHistoricalData = Array.from({ length: 24 }, () => Math.floor(Math.random() * 50) + 30)
    const prediction = ensemblePrediction(sampleHistoricalData, 12)
    setPredictions(prediction)

    // 异常根因分析
    if (historicalData) {
      const anomalyMetric = Object.keys(metrics)[0]
      const rootCause = analyzeRootCause(anomalyMetric, historicalData)
      setRootCauseAnalysis(rootCause)
    }

    // 预测性维护
    const equipmentMetrics: Record<string, number[]> = {
      "服务器-01": Array.from({ length: 48 }, (_, i) => 70 + Math.sin(i / 5) * 10 + Math.random() * 5),
      "服务器-02": Array.from({ length: 48 }, (_, i) => 85 + Math.sin(i / 3) * 8 + Math.random() * 3),
      "网络设备-01": Array.from({ length: 48 }, (_, i) => 60 + Math.cos(i / 4) * 12 + Math.random() * 4),
    }
    const maintenance = predictiveMaintenance(equipmentMetrics)
    setMaintenancePredictions(maintenance)

    setTimeout(() => setIsAnalyzing(false), 1000)
  }

  return (
    <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
      <CardHeader className="border-b border-slate-700/50 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-slate-100 flex items-center text-base">
            <Brain className="mr-2 h-5 w-5 text-cyan-500" />
            增强型 AI 分析
          </CardTitle>
          <div className="flex items-center space-x-2">
            {isAnalyzing && (
              <Badge variant="outline" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50 text-xs">
                <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 mr-1 animate-pulse"></div>
                分析中
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={runEnhancedAnalysis}
              className="h-7 text-xs text-slate-400 hover:text-slate-100"
            >
              重新分析
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <Tabs defaultValue="insights" className="w-full">
          <TabsList className="bg-slate-800/50 p-1 w-full grid grid-cols-4">
            <TabsTrigger
              value="insights"
              className="data-[state=active]:bg-slate-700 data-[state=active]:text-cyan-400 text-xs"
            >
              实时洞察
            </TabsTrigger>
            <TabsTrigger
              value="predictions"
              className="data-[state=active]:bg-slate-700 data-[state=active]:text-cyan-400 text-xs"
            >
              预测分析
            </TabsTrigger>
            <TabsTrigger
              value="rootcause"
              className="data-[state=active]:bg-slate-700 data-[state=active]:text-cyan-400 text-xs"
            >
              根因分析
            </TabsTrigger>
            <TabsTrigger
              value="maintenance"
              className="data-[state=active]:bg-slate-700 data-[state=active]:text-cyan-400 text-xs"
            >
              预测维护
            </TabsTrigger>
          </TabsList>

          <TabsContent value="insights" className="mt-4 space-y-3">
            {insights.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">暂无洞察数据</div>
            ) : (
              insights.map((insight) => (
                <div
                  key={insight.id}
                  className={`bg-slate-800/30 rounded-lg p-3 border ${
                    insight.priority === "critical"
                      ? "border-red-500/50"
                      : insight.priority === "high"
                        ? "border-amber-500/50"
                        : "border-slate-700/50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {insight.type === "opportunity" && <Target className="h-4 w-4 text-green-500" />}
                      {insight.type === "risk" && <AlertTriangle className="h-4 w-4 text-red-500" />}
                      {insight.type === "optimization" && <Zap className="h-4 w-4 text-blue-500" />}
                      {insight.type === "alert" && <Shield className="h-4 w-4 text-amber-500" />}
                      <span className="text-sm font-medium text-slate-200">{insight.title}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        insight.priority === "critical"
                          ? "bg-red-500/20 text-red-400 border-red-500/50"
                          : insight.priority === "high"
                            ? "bg-amber-500/20 text-amber-400 border-amber-500/50"
                            : insight.priority === "medium"
                              ? "bg-blue-500/20 text-blue-400 border-blue-500/50"
                              : "bg-slate-500/20 text-slate-400 border-slate-500/50"
                      }`}
                    >
                      {insight.priority === "critical"
                        ? "紧急"
                        : insight.priority === "high"
                          ? "高"
                          : insight.priority === "medium"
                            ? "中"
                            : "低"}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{insight.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="text-xs text-slate-500">影响力</div>
                      <Progress value={insight.impact * 100} className="h-1 w-16 bg-slate-700">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                          style={{ width: `${insight.impact * 100}%` }}
                        />
                      </Progress>
                      <div className="text-xs text-cyan-400">{Math.round(insight.impact * 100)}%</div>
                    </div>
                    <div className="text-xs text-slate-500">置信度 {Math.round(insight.confidence * 100)}%</div>
                  </div>
                  {insight.suggestedActions.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-700/50">
                      <div className="text-xs text-slate-500 mb-1">建议操作:</div>
                      <div className="space-y-1">
                        {insight.suggestedActions.slice(0, 2).map((action, idx) => (
                          <div key={idx} className="flex items-start space-x-2">
                            <ChevronRight className="h-3 w-3 text-cyan-500 mt-0.5 flex-shrink-0" />
                            <span className="text-xs text-cyan-400">{action}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="predictions" className="mt-4 space-y-4">
            {predictions ? (
              <>
                <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium text-slate-200">集成预测结果</div>
                    <Badge variant="outline" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50 text-xs">
                      最佳模型: {predictions.bestModel.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">预测值</div>
                      <div className="text-2xl font-bold text-cyan-400">
                        {predictions.ensemble.value.toFixed(1)}
                        <span className="text-sm text-slate-400 ml-1">单位</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">置信度</div>
                      <div className="text-2xl font-bold text-green-400">
                        {Math.round(predictions.ensemble.confidence * 100)}%
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-slate-800/50 rounded p-2">
                      <div className="text-xs text-slate-500 mb-1">趋势</div>
                      <div className="flex items-center space-x-1">
                        <TrendingUp
                          className={`h-3 w-3 ${
                            predictions.ensemble.trend === "up"
                              ? "text-green-500"
                              : predictions.ensemble.trend === "down"
                                ? "text-red-500 rotate-180"
                                : "text-blue-500"
                          }`}
                        />
                        <span className="text-xs text-slate-300">
                          {predictions.ensemble.trend === "up"
                            ? "上升"
                            : predictions.ensemble.trend === "down"
                              ? "下降"
                              : "稳定"}
                        </span>
                      </div>
                    </div>
                    <div className="bg-slate-800/50 rounded p-2">
                      <div className="text-xs text-slate-500 mb-1">波动性</div>
                      <div className="text-xs text-slate-300">
                        {(predictions.ensemble.volatility * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="bg-slate-800/50 rounded p-2">
                      <div className="text-xs text-slate-500 mb-1">异常分</div>
                      <div className="text-xs text-slate-300">
                        {(predictions.ensemble.anomalyScore * 100).toFixed(1)}
                      </div>
                    </div>
                  </div>
                  {predictions.ensemble.recommendations.length > 0 && (
                    <div className="pt-2 border-t border-slate-700/50">
                      <div className="text-xs text-slate-500 mb-2">AI 建议:</div>
                      <div className="space-y-1">
                        {predictions.ensemble.recommendations.map((rec, idx) => (
                          <div key={idx} className="flex items-start space-x-2">
                            <Lightbulb className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                            <span className="text-xs text-slate-300">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                  <div className="text-sm font-medium text-slate-200 mb-3">模型对比</div>
                  <div className="space-y-3">
                    <ModelComparisonRow
                      name="ARIMA"
                      value={predictions.models.arima.value}
                      confidence={predictions.models.arima.confidence}
                      isBest={predictions.bestModel === "arima"}
                    />
                    <ModelComparisonRow
                      name="LSTM"
                      value={predictions.models.lstm.value}
                      confidence={predictions.models.lstm.confidence}
                      isBest={predictions.bestModel === "lstm"}
                    />
                    <ModelComparisonRow
                      name="Prophet"
                      value={predictions.models.prophet.value}
                      confidence={predictions.models.prophet.confidence}
                      isBest={predictions.bestModel === "prophet"}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-slate-400 text-sm">正在生成预测...</div>
            )}
          </TabsContent>

          <TabsContent value="rootcause" className="mt-4 space-y-4">
            {rootCauseAnalysis ? (
              <>
                <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                  <div className="text-sm font-medium text-slate-200 mb-2">分析结论</div>
                  <p className="text-xs text-slate-400 leading-relaxed">{rootCauseAnalysis.explanation}</p>
                </div>

                {rootCauseAnalysis.rootCauses.length > 0 && (
                  <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                    <div className="text-sm font-medium text-slate-200 mb-3">相关指标</div>
                    <div className="space-y-2">
                      {rootCauseAnalysis.rootCauses.map((cause: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between bg-slate-800/50 rounded p-2">
                          <div className="flex items-center space-x-2">
                            <BarChart3 className="h-4 w-4 text-cyan-500" />
                            <span className="text-xs text-slate-300">{cause.metric}</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-xs text-slate-500">
                              相关性: {(Math.abs(cause.correlation) * 100).toFixed(1)}%
                            </div>
                            <Progress value={Math.abs(cause.correlation) * 100} className="h-1 w-16 bg-slate-700">
                              <div
                                className={`h-full rounded-full ${
                                  cause.correlation > 0 ? "bg-green-500" : "bg-red-500"
                                }`}
                                style={{ width: `${Math.abs(cause.correlation) * 100}%` }}
                              />
                            </Progress>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                  <div className="text-sm font-medium text-slate-200 mb-3">修复建议</div>
                  <div className="space-y-2">
                    {rootCauseAnalysis.suggestedFix.map((fix: string, idx: number) => (
                      <div key={idx} className="flex items-start space-x-2">
                        <div className="bg-cyan-500/20 rounded-full p-1 mt-0.5">
                          <div className="text-xs font-bold text-cyan-400 w-4 h-4 flex items-center justify-center">
                            {idx + 1}
                          </div>
                        </div>
                        <span className="text-xs text-slate-300 flex-1">{fix}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-slate-400 text-sm">暂无异常需要分析</div>
            )}
          </TabsContent>

          <TabsContent value="maintenance" className="mt-4 space-y-3">
            {maintenancePredictions.length > 0 ? (
              maintenancePredictions.map((pred, idx) => (
                <div
                  key={idx}
                  className={`bg-slate-800/30 rounded-lg p-3 border ${
                    pred.maintenanceUrgency === "critical"
                      ? "border-red-500/50"
                      : pred.maintenanceUrgency === "high"
                        ? "border-amber-500/50"
                        : "border-slate-700/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-slate-200">{pred.equipment}</div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        pred.maintenanceUrgency === "critical"
                          ? "bg-red-500/20 text-red-400 border-red-500/50"
                          : pred.maintenanceUrgency === "high"
                            ? "bg-amber-500/20 text-amber-400 border-amber-500/50"
                            : pred.maintenanceUrgency === "medium"
                              ? "bg-blue-500/20 text-blue-400 border-blue-500/50"
                              : "bg-green-500/20 text-green-400 border-green-500/50"
                      }`}
                    >
                      {pred.maintenanceUrgency === "critical"
                        ? "紧急"
                        : pred.maintenanceUrgency === "high"
                          ? "高优先级"
                          : pred.maintenanceUrgency === "medium"
                            ? "中优先级"
                            : "低优先级"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-2">
                    <div className="bg-slate-800/50 rounded p-2">
                      <div className="text-xs text-slate-500 mb-1">故障概率</div>
                      <div className="flex items-center space-x-2">
                        <Progress value={pred.failureProbability * 100} className="h-1.5 flex-1 bg-slate-700">
                          <div
                            className={`h-full rounded-full ${
                              pred.failureProbability > 0.7
                                ? "bg-red-500"
                                : pred.failureProbability > 0.4
                                  ? "bg-amber-500"
                                  : "bg-green-500"
                            }`}
                            style={{ width: `${pred.failureProbability * 100}%` }}
                          />
                        </Progress>
                        <span className="text-xs text-slate-300">{Math.round(pred.failureProbability * 100)}%</span>
                      </div>
                    </div>
                    <div className="bg-slate-800/50 rounded p-2">
                      <div className="text-xs text-slate-500 mb-1">预计故障时间</div>
                      <div className="text-xs text-slate-300">{pred.timeToFailure} 小时</div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-700/50">
                    <div className="flex items-start space-x-2">
                      <Lightbulb className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-slate-300">{pred.recommendedAction}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 text-sm">所有设备运行正常</div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function ModelComparisonRow({
  name,
  value,
  confidence,
  isBest,
}: {
  name: string
  value: number
  confidence: number
  isBest: boolean
}) {
  return (
    <div className={`flex items-center justify-between p-2 rounded ${isBest ? "bg-cyan-500/10" : "bg-slate-800/50"}`}>
      <div className="flex items-center space-x-2">
        <div className={`text-xs font-medium ${isBest ? "text-cyan-400" : "text-slate-300"}`}>{name}</div>
        {isBest && (
          <Badge variant="outline" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50 text-xs">
            最佳
          </Badge>
        )}
      </div>
      <div className="flex items-center space-x-3">
        <div className="text-xs text-slate-400">
          预测: <span className="text-slate-300">{value.toFixed(1)}</span>
        </div>
        <div className="text-xs text-slate-400">
          置信: <span className="text-slate-300">{Math.round(confidence * 100)}%</span>
        </div>
      </div>
    </div>
  )
}
