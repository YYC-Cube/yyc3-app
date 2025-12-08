/**
 * 性能模块：包含 Web Vitals 上报与性能数据获取
 */

export function reportWebVitals(metric: any) {
  if (metric.label === "web-vital") {
    console.log("📊 Web Vitals:", metric)

    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(metric),
    }).catch((err) => {
      console.warn("⚠️ 性能指标发送失败:", err)
    })
  }
}

export function fetchPerformance() {
  fetch("/api/performance", {
    method: "GET",
  })
    .then((res) => res.json())
    .then((data) => {
      console.log(data)
    })
    .catch((error) => {
      console.error(error)
    })
}
