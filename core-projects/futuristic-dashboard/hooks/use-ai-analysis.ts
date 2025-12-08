"use client"

import { useState, useCallback } from "react"
import {
  predictNextValue,
  detectAnomaly,
  analyzeTrend,
  generateRecommendations,
  type MetricData,
  type PredictionResult,
  type AnomalyDetection,
} from "@/lib/ai-engine"

export function useAIAnalysis() {
  const [historicalData, setHistoricalData] = useState<{
    cpu: MetricData[]
    memory: MetricData[]
    network: MetricData[]
  }>({
    cpu: [],
    memory: [],
    network: [],
  })

  const [predictions, setPredictions] = useState<{
    cpu: PredictionResult | null
    memory: PredictionResult | null
    network: PredictionResult | null
  }>({
    cpu: null,
    memory: null,
    network: null,
  })

  const [anomalies, setAnomalies] = useState<{
    cpu: AnomalyDetection | null
    memory: AnomalyDetection | null
    network: AnomalyDetection | null
  }>({
    cpu: null,
    memory: null,
    network: null,
  })

  const [recommendations, setRecommendations] = useState<
    Array<{
      type: "optimization" | "warning" | "info"
      title: string
      description: string
      priority: "low" | "medium" | "high"
    }>
  >([])

  // 添加新的指标数据
  const addMetricData = useCallback((metric: "cpu" | "memory" | "network", value: number) => {
    const newData: MetricData = {
      timestamp: Date.now(),
      value,
    }

    setHistoricalData((prev) => ({
      ...prev,
      [metric]: [...prev[metric].slice(-99), newData], // 保留最近 100 个数据点
    }))
  }, [])

  // 执行 AI 分析
  const runAnalysis = useCallback(
    (currentMetrics: {
      cpu: number
      memory: number
      network: number
      security: number
    }) => {
      // 添加当前数据
      addMetricData("cpu", currentMetrics.cpu)
      addMetricData("memory", currentMetrics.memory)
      addMetricData("network", currentMetrics.network)

      // 预测分析
      if (historicalData.cpu.length >= 3) {
        setPredictions({
          cpu: predictNextValue(historicalData.cpu),
          memory: predictNextValue(historicalData.memory),
          network: predictNextValue(historicalData.network),
        })
      }

      // 异常检测
      if (historicalData.cpu.length >= 10) {
        setAnomalies({
          cpu: detectAnomaly(currentMetrics.cpu, historicalData.cpu),
          memory: detectAnomaly(currentMetrics.memory, historicalData.memory),
          network: detectAnomaly(currentMetrics.network, historicalData.network),
        })
      }

      // 生成建议
      const newRecommendations = generateRecommendations(currentMetrics)
      setRecommendations(newRecommendations)
    },
    [historicalData, addMetricData],
  )

  // 获取趋势分析
  const getTrendAnalysis = useCallback(
    (metric: "cpu" | "memory" | "network") => {
      if (historicalData[metric].length < 5) return null
      return analyzeTrend(historicalData[metric])
    },
    [historicalData],
  )

  return {
    predictions,
    anomalies,
    recommendations,
    historicalData,
    runAnalysis,
    getTrendAnalysis,
  }
}
