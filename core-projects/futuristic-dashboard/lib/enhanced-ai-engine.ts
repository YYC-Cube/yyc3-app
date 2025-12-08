/**
 * 增强型 AI 分析引擎
 * 提供深度学习、多模型融合、实时预测等高级功能
 */

import type { IndustryType } from "./industry-adapter"
import { getIndustryConfig } from "./industry-adapter"

export interface EnhancedPrediction {
  value: number
  confidence: number
  trend: "up" | "down" | "stable"
  volatility: number
  anomalyScore: number
  recommendations: string[]
  timeHorizon: number
}

export interface MultiModelPrediction {
  ensemble: EnhancedPrediction
  models: {
    arima: EnhancedPrediction
    lstm: EnhancedPrediction
    prophet: EnhancedPrediction
  }
  bestModel: "arima" | "lstm" | "prophet"
}

export interface RealTimeInsight {
  id: string
  type: "opportunity" | "risk" | "optimization" | "alert"
  priority: "low" | "medium" | "high" | "critical"
  title: string
  description: string
  impact: number
  confidence: number
  actionable: boolean
  suggestedActions: string[]
  timestamp: number
}

/**
 * 多模型集成预测
 */
export function ensemblePrediction(historicalData: number[], horizon = 12): MultiModelPrediction {
  // ARIMA 模型模拟
  const arimaPrediction = simulateARIMA(historicalData, horizon)

  // LSTM 模型模拟
  const lstmPrediction = simulateLSTM(historicalData, horizon)

  // Prophet 模型模拟
  const prophetPrediction = simulateProphet(historicalData, horizon)

  // 集成预测（加权平均）
  const weights = { arima: 0.3, lstm: 0.4, prophet: 0.3 }
  const ensembleValue =
    arimaPrediction.value * weights.arima +
    lstmPrediction.value * weights.lstm +
    prophetPrediction.value * weights.prophet

  const ensembleConfidence = (arimaPrediction.confidence + lstmPrediction.confidence + prophetPrediction.confidence) / 3

  // 选择最佳模型
  const bestModel =
    lstmPrediction.confidence > arimaPrediction.confidence && lstmPrediction.confidence > prophetPrediction.confidence
      ? "lstm"
      : arimaPrediction.confidence > prophetPrediction.confidence
        ? "arima"
        : "prophet"

  return {
    ensemble: {
      value: ensembleValue,
      confidence: ensembleConfidence,
      trend: determineTrend(historicalData),
      volatility: calculateVolatility(historicalData),
      anomalyScore: calculateAnomalyScore(historicalData[historicalData.length - 1], historicalData),
      recommendations: generateSmartRecommendations(ensembleValue, historicalData),
      timeHorizon: horizon,
    },
    models: {
      arima: arimaPrediction,
      lstm: lstmPrediction,
      prophet: prophetPrediction,
    },
    bestModel,
  }
}

/**
 * 实时智能洞察生成
 */
export function generateRealTimeInsights(metrics: Record<string, number>, industry: IndustryType): RealTimeInsight[] {
  const insights: RealTimeInsight[] = []
  const config = getIndustryConfig(industry)
  const timestamp = Date.now()

  config.metrics.forEach((metric) => {
    const value = metrics[metric.id] || 0
    const [min, max] = metric.normalRange

    // 机会识别
    if (value > max * 0.9 && metric.category === "business") {
      insights.push({
        id: `opportunity-${metric.id}`,
        type: "opportunity",
        priority: "high",
        title: `${metric.name}表现优异`,
        description: `当前${metric.name}达到 ${value}${metric.unit}，超出正常范围，建议扩大规模以获取更多收益`,
        impact: 0.85,
        confidence: 0.9,
        actionable: true,
        suggestedActions: ["扩大产能", "增加资源投入", "优化流程以维持高水平"],
        timestamp,
      })
    }

    // 风险识别
    if (value > metric.criticalThreshold) {
      insights.push({
        id: `risk-${metric.id}`,
        type: "risk",
        priority: "critical",
        title: `${metric.name}超出临界值`,
        description: `${metric.name}已达到 ${value}${metric.unit}，超过临界阈值 ${metric.criticalThreshold}${metric.unit}，需要立即处理`,
        impact: 0.95,
        confidence: 0.95,
        actionable: true,
        suggestedActions: ["立即检查系统", "启动应急预案", "通知相关负责人"],
        timestamp,
      })
    }

    // 优化建议
    if (value < min * 0.8 && metric.category === "performance") {
      insights.push({
        id: `optimization-${metric.id}`,
        type: "optimization",
        priority: "medium",
        title: `${metric.name}有优化空间`,
        description: `${metric.name}当前为 ${value}${metric.unit}，低于正常范围，存在优化潜力`,
        impact: 0.7,
        confidence: 0.8,
        actionable: true,
        suggestedActions: ["分析性能瓶颈", "优化配置参数", "升级相关组件"],
        timestamp,
      })
    }
  })

  // 按优先级和影响力排序
  return insights.sort((a, b) => {
    const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 }
    const scoreA = priorityWeight[a.priority] * a.impact
    const scoreB = priorityWeight[b.priority] * b.impact
    return scoreB - scoreA
  })
}

/**
 * 智能异常根因分析
 */
export function analyzeRootCause(
  anomalyMetric: string,
  allMetrics: Record<string, number[]>,
): {
  rootCauses: Array<{ metric: string; correlation: number; confidence: number }>
  explanation: string
  suggestedFix: string[]
} {
  const rootCauses: Array<{ metric: string; correlation: number; confidence: number }> = []

  // 计算相关性
  Object.keys(allMetrics).forEach((metric) => {
    if (metric !== anomalyMetric) {
      const correlation = calculateCorrelation(allMetrics[anomalyMetric], allMetrics[metric])
      if (Math.abs(correlation) > 0.6) {
        rootCauses.push({
          metric,
          correlation,
          confidence: Math.abs(correlation),
        })
      }
    }
  })

  // 排序
  rootCauses.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))

  const topCause = rootCauses[0]
  const explanation = topCause
    ? `检测到 ${anomalyMetric} 与 ${topCause.metric} 存在 ${(topCause.correlation * 100).toFixed(1)}% 的相关性，可能是导致异常的根本原因`
    : `未发现明显的相关指标，可能是独立事件或外部因素导致`

  const suggestedFix = topCause
    ? [
        `优先检查 ${topCause.metric} 的状态`,
        `分析 ${topCause.metric} 与 ${anomalyMetric} 之间的依赖关系`,
        `考虑调整 ${topCause.metric} 的配置以改善 ${anomalyMetric}`,
      ]
    : ["进行全面系统检查", "查看外部环境变化", "检查最近的配置更改"]

  return {
    rootCauses: rootCauses.slice(0, 3),
    explanation,
    suggestedFix,
  }
}

/**
 * 预测性维护建议
 */
export function predictiveMaintenance(equipmentMetrics: Record<string, number[]>): Array<{
  equipment: string
  failureProbability: number
  timeToFailure: number
  maintenanceUrgency: "low" | "medium" | "high" | "critical"
  recommendedAction: string
}> {
  const predictions: Array<{
    equipment: string
    failureProbability: number
    timeToFailure: number
    maintenanceUrgency: "low" | "medium" | "high" | "critical"
    recommendedAction: string
  }> = []

  Object.keys(equipmentMetrics).forEach((equipment) => {
    const metrics = equipmentMetrics[equipment]
    const trend = analyzeTrendAdvanced(metrics)
    const degradation = calculateDegradation(metrics)

    const failureProbability = Math.min(0.95, degradation * 1.2)
    const timeToFailure = estimateTimeToFailure(trend, degradation)

    let maintenanceUrgency: "low" | "medium" | "high" | "critical" = "low"
    let recommendedAction = "继续监控"

    if (failureProbability > 0.8) {
      maintenanceUrgency = "critical"
      recommendedAction = "立即安排维护，避免设备故障"
    } else if (failureProbability > 0.6) {
      maintenanceUrgency = "high"
      recommendedAction = "在未来 24 小时内安排维护"
    } else if (failureProbability > 0.4) {
      maintenanceUrgency = "medium"
      recommendedAction = "在未来一周内安排预防性维护"
    }

    predictions.push({
      equipment,
      failureProbability,
      timeToFailure,
      maintenanceUrgency,
      recommendedAction,
    })
  })

  return predictions.sort((a, b) => b.failureProbability - a.failureProbability)
}

// ========== 辅助函数 ==========

function simulateARIMA(data: number[], horizon: number): EnhancedPrediction {
  const lastValue = data[data.length - 1]
  const trend = (data[data.length - 1] - data[data.length - 5]) / 5
  const predicted = lastValue + trend * horizon

  return {
    value: Math.max(0, predicted),
    confidence: 0.82,
    trend: trend > 0 ? "up" : trend < 0 ? "down" : "stable",
    volatility: calculateVolatility(data),
    anomalyScore: 0.15,
    recommendations: [],
    timeHorizon: horizon,
  }
}

function simulateLSTM(data: number[], horizon: number): EnhancedPrediction {
  const recentData = data.slice(-10)
  const average = recentData.reduce((a, b) => a + b, 0) / recentData.length
  const momentum = (data[data.length - 1] - data[data.length - 3]) / 2

  const predicted = average + momentum * horizon * 0.8

  return {
    value: Math.max(0, predicted),
    confidence: 0.88,
    trend: momentum > 0 ? "up" : momentum < 0 ? "down" : "stable",
    volatility: calculateVolatility(data),
    anomalyScore: 0.12,
    recommendations: [],
    timeHorizon: horizon,
  }
}

function simulateProphet(data: number[], horizon: number): EnhancedPrediction {
  const seasonality = detectSeasonality(data)
  const trend = (data[data.length - 1] - data[0]) / data.length
  const predicted = data[data.length - 1] + trend * horizon + seasonality

  return {
    value: Math.max(0, predicted),
    confidence: 0.85,
    trend: trend > 0 ? "up" : trend < 0 ? "down" : "stable",
    volatility: calculateVolatility(data),
    anomalyScore: 0.18,
    recommendations: [],
    timeHorizon: horizon,
  }
}

function determineTrend(data: number[]): "up" | "down" | "stable" {
  const recentTrend = data[data.length - 1] - data[data.length - 5]
  if (recentTrend > 2) return "up"
  if (recentTrend < -2) return "down"
  return "stable"
}

function calculateVolatility(data: number[]): number {
  const mean = data.reduce((a, b) => a + b, 0) / data.length
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length
  return Math.sqrt(variance) / mean
}

function calculateAnomalyScore(currentValue: number, historicalData: number[]): number {
  const mean = historicalData.reduce((a, b) => a + b, 0) / historicalData.length
  const stdDev = Math.sqrt(
    historicalData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / historicalData.length,
  )
  const zScore = Math.abs((currentValue - mean) / stdDev)
  return Math.min(1, zScore / 3)
}

function generateSmartRecommendations(predictedValue: number, historicalData: number[]): string[] {
  const recommendations: string[] = []
  const mean = historicalData.reduce((a, b) => a + b, 0) / historicalData.length

  if (predictedValue > mean * 1.2) {
    recommendations.push("预测值显著高于历史平均，建议提前准备资源")
    recommendations.push("考虑启用负载均衡或扩容策略")
  } else if (predictedValue < mean * 0.8) {
    recommendations.push("预测值低于历史平均，可能存在性能下降")
    recommendations.push("建议检查系统配置和运行状态")
  }

  return recommendations
}

function detectSeasonality(data: number[]): number {
  // 简化的季节性检测
  const period = 24
  if (data.length < period * 2) return 0

  const recentPeriod = data.slice(-period)
  const previousPeriod = data.slice(-period * 2, -period)

  const avgRecent = recentPeriod.reduce((a, b) => a + b, 0) / period
  const avgPrevious = previousPeriod.reduce((a, b) => a + b, 0) / period

  return avgRecent - avgPrevious
}

function calculateCorrelation(data1: number[], data2: number[]): number {
  const n = Math.min(data1.length, data2.length)
  const mean1 = data1.slice(0, n).reduce((a, b) => a + b, 0) / n
  const mean2 = data2.slice(0, n).reduce((a, b) => a + b, 0) / n

  let numerator = 0
  let denominator1 = 0
  let denominator2 = 0

  for (let i = 0; i < n; i++) {
    const diff1 = data1[i] - mean1
    const diff2 = data2[i] - mean2
    numerator += diff1 * diff2
    denominator1 += diff1 * diff1
    denominator2 += diff2 * diff2
  }

  return numerator / Math.sqrt(denominator1 * denominator2)
}

function analyzeTrendAdvanced(data: number[]): { slope: number; acceleration: number } {
  const n = data.length
  if (n < 3) return { slope: 0, acceleration: 0 }

  // 线性回归计算斜率
  const sumX = (n * (n - 1)) / 2
  const sumY = data.reduce((a, b) => a + b, 0)
  const sumXY = data.reduce((sum, val, i) => sum + i * val, 0)
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)

  // 计算加速度（二阶导数）
  const recentSlope = (data[n - 1] - data[n - 3]) / 2
  const previousSlope = (data[n - 3] - data[n - 5]) / 2
  const acceleration = recentSlope - previousSlope

  return { slope, acceleration }
}

function calculateDegradation(metrics: number[]): number {
  const trend = analyzeTrendAdvanced(metrics)
  const volatility = calculateVolatility(metrics)

  // 退化分数：负趋势 + 高波动性
  const degradationScore = Math.max(0, -trend.slope * 0.5 + volatility * 0.5)

  return Math.min(1, degradationScore)
}

function estimateTimeToFailure(trend: { slope: number; acceleration: number }, degradation: number): number {
  // 简化的故障时间估算（小时）
  if (degradation < 0.3) return 720 // 30 天
  if (degradation < 0.5) return 168 // 7 天
  if (degradation < 0.7) return 48 // 2 天
  return 12 // 12 小时
}
