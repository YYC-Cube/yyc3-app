/**
 * AI 智能分析引擎
 * 提供预测分析、异常检测、趋势预测等核心 AI 功能
 */

export interface MetricData {
  timestamp: number
  value: number
  label?: string
}

export interface PredictionResult {
  predicted: number
  confidence: number
  trend: "up" | "down" | "stable"
  anomaly: boolean
}

export interface AnomalyDetection {
  isAnomaly: boolean
  severity: "low" | "medium" | "high" | "critical"
  confidence: number
  reason: string
}

/**
 * 时间序列预测 - 使用简单移动平均和趋势分析
 */
export function predictNextValue(data: MetricData[]): PredictionResult {
  if (data.length < 3) {
    return {
      predicted: data[data.length - 1]?.value || 0,
      confidence: 0.3,
      trend: "stable",
      anomaly: false,
    }
  }

  // 计算移动平均
  const recentValues = data.slice(-5).map((d) => d.value)
  const average = recentValues.reduce((a, b) => a + b, 0) / recentValues.length

  // 计算趋势
  const oldAverage =
    data
      .slice(-10, -5)
      .map((d) => d.value)
      .reduce((a, b) => a + b, 0) / 5
  const trendDiff = average - oldAverage

  let trend: "up" | "down" | "stable" = "stable"
  if (trendDiff > 2) trend = "up"
  else if (trendDiff < -2) trend = "down"

  // 预测下一个值
  const predicted = average + trendDiff * 0.5

  // 计算置信度
  const variance = recentValues.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / recentValues.length
  const confidence = Math.max(0.4, Math.min(0.95, 1 - variance / 100))

  return {
    predicted: Math.max(0, Math.min(100, predicted)),
    confidence,
    trend,
    anomaly: false,
  }
}

/**
 * 异常检测 - 使用统计方法检测异常值
 */
export function detectAnomaly(currentValue: number, historicalData: MetricData[]): AnomalyDetection {
  if (historicalData.length < 10) {
    return {
      isAnomaly: false,
      severity: "low",
      confidence: 0.3,
      reason: "历史数据不足",
    }
  }

  const values = historicalData.map((d) => d.value)
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  const stdDev = Math.sqrt(variance)

  // Z-score 计算
  const zScore = Math.abs((currentValue - mean) / stdDev)

  let isAnomaly = false
  let severity: "low" | "medium" | "high" | "critical" = "low"
  let reason = "正常范围内"

  if (zScore > 3) {
    isAnomaly = true
    severity = "critical"
    reason = `值偏离均值 ${zScore.toFixed(1)} 个标准差（严重异常）`
  } else if (zScore > 2.5) {
    isAnomaly = true
    severity = "high"
    reason = `值偏离均值 ${zScore.toFixed(1)} 个标准差（高度异常）`
  } else if (zScore > 2) {
    isAnomaly = true
    severity = "medium"
    reason = `值偏离均值 ${zScore.toFixed(1)} 个标准差（中度异常）`
  } else if (zScore > 1.5) {
    isAnomaly = true
    severity = "low"
    reason = `值偏离均值 ${zScore.toFixed(1)} 个标准差（轻度异常）`
  }

  const confidence = Math.min(0.95, zScore / 3)

  return {
    isAnomaly,
    severity,
    confidence,
    reason,
  }
}

/**
 * 趋势分析 - 分析数据趋势和模式
 */
export function analyzeTrend(data: MetricData[]): {
  direction: "up" | "down" | "stable"
  strength: number
  volatility: number
  pattern: "linear" | "exponential" | "cyclical" | "random"
} {
  if (data.length < 5) {
    return {
      direction: "stable",
      strength: 0,
      volatility: 0,
      pattern: "random",
    }
  }

  const values = data.map((d) => d.value)

  // 线性回归计算趋势
  const n = values.length
  const sumX = (n * (n - 1)) / 2
  const sumY = values.reduce((a, b) => a + b, 0)
  const sumXY = values.reduce((sum, val, i) => sum + i * val, 0)
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)

  let direction: "up" | "down" | "stable" = "stable"
  if (slope > 0.5) direction = "up"
  else if (slope < -0.5) direction = "down"

  const strength = Math.min(1, Math.abs(slope) / 2)

  // 计算波动性
  const mean = sumY / n
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n
  const volatility = Math.sqrt(variance) / mean

  // 简单模式识别
  let pattern: "linear" | "exponential" | "cyclical" | "random" = "linear"
  if (volatility > 0.3) pattern = "random"
  else if (Math.abs(slope) > 1) pattern = "exponential"

  return {
    direction,
    strength,
    volatility,
    pattern,
  }
}

/**
 * 智能建议生成器
 */
export function generateRecommendations(metrics: {
  cpu: number
  memory: number
  network: number
  security: number
}): Array<{
  type: "optimization" | "warning" | "info"
  title: string
  description: string
  priority: "low" | "medium" | "high"
}> {
  const recommendations = []

  // CPU 分析
  if (metrics.cpu > 80) {
    recommendations.push({
      type: "warning",
      title: "CPU 使用率过高",
      description: "建议检查高负载进程，考虑优化或增加计算资源",
      priority: "high",
    })
  } else if (metrics.cpu < 20) {
    recommendations.push({
      type: "optimization",
      title: "CPU 资源利用率低",
      description: "可以考虑降低资源配置以节省成本",
      priority: "low",
    })
  }

  // 内存分析
  if (metrics.memory > 85) {
    recommendations.push({
      type: "warning",
      title: "内存使用接近上限",
      description: "建议清理缓存或增加内存容量，避免系统性能下降",
      priority: "high",
    })
  }

  // 网络分析
  if (metrics.network < 70) {
    recommendations.push({
      type: "warning",
      title: "网络性能下降",
      description: "检测到网络延迟增加，建议检查网络连接和带宽",
      priority: "medium",
    })
  }

  // 安全分析
  if (metrics.security < 80) {
    recommendations.push({
      type: "warning",
      title: "安全等级需要提升",
      description: "建议更新安全策略，启用所有防护功能",
      priority: "high",
    })
  }

  // 综合优化建议
  if (metrics.cpu > 70 && metrics.memory > 70) {
    recommendations.push({
      type: "optimization",
      title: "系统负载较高",
      description: "建议启用负载均衡或扩展系统资源",
      priority: "medium",
    })
  }

  return recommendations
}
