/**
 * 图表数据生成器 - 用于演示和测试
 */

export function generateTimeSeriesData(points: number, baseValue = 50, variance = 20) {
  const data = []
  let currentValue = baseValue

  for (let i = 0; i < points; i++) {
    const change = (Math.random() - 0.5) * variance
    currentValue = Math.max(0, Math.min(100, currentValue + change))

    const hour = Math.floor((i * 24) / points)
    const minute = Math.floor(((i * 24) / points - hour) * 60)

    data.push({
      time: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
      value: Math.round(currentValue * 10) / 10,
    })
  }

  return data
}

export function generateHeatmapData() {
  const days = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
  const data = []

  for (const day of days) {
    for (let hour = 0; hour < 24; hour++) {
      // 模拟工作时间有更高的活动
      let baseValue = 20
      if (hour >= 9 && hour <= 18 && !["周六", "周日"].includes(day)) {
        baseValue = 70
      }

      const value = Math.max(0, Math.min(100, baseValue + (Math.random() - 0.5) * 30))

      data.push({
        day,
        hour,
        value: Math.round(value),
      })
    }
  }

  return data
}

export function generateComparisonData(points: number) {
  const labels = []
  const series1 = []
  const series2 = []
  const series3 = []

  for (let i = 0; i < points; i++) {
    labels.push(`${i}h`)
    series1.push(Math.random() * 60 + 20)
    series2.push(Math.random() * 50 + 30)
    series3.push(Math.random() * 40 + 40)
  }

  return {
    labels,
    series: [
      { label: "CPU", data: series1, color: "#06b6d4" },
      { label: "内存", data: series2, color: "#a855f7" },
      { label: "网络", data: series3, color: "#3b82f6" },
    ],
  }
}
