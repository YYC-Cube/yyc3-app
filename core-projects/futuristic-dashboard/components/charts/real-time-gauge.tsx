"use client"

import { useEffect, useRef, useState } from "react"

interface RealTimeGaugeProps {
  value: number
  max?: number
  label?: string
  color?: "cyan" | "purple" | "blue" | "green"
  size?: "small" | "medium" | "large"
}

export function RealTimeGauge({ value, max = 100, label = "", color = "cyan", size = "medium" }: RealTimeGaugeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [animatedValue, setAnimatedValue] = useState(0)

  const sizeConfig = {
    small: { width: 120, height: 120, fontSize: 20, labelSize: 10 },
    medium: { width: 200, height: 200, fontSize: 36, labelSize: 14 },
    large: { width: 280, height: 280, fontSize: 48, labelSize: 16 },
  }

  const config = sizeConfig[size]

  useEffect(() => {
    const duration = 1000
    const startTime = Date.now()
    const startValue = animatedValue

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const currentValue = startValue + (value - startValue) * easeOutQuart

      setAnimatedValue(currentValue)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    animate()
  }, [value, animatedValue])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = config.width * dpr
    canvas.height = config.height * dpr
    ctx.scale(dpr, dpr)

    const width = config.width
    const height = config.height
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(width, height) / 2 - 20

    ctx.clearRect(0, 0, width, height)

    const colorMap = {
      cyan: ["#06b6d4", "#0891b2"],
      purple: ["#a855f7", "#9333ea"],
      blue: ["#3b82f6", "#2563eb"],
      green: ["#10b981", "#059669"],
    }

    const [color1, color2] = colorMap[color]

    // 背景圆环
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.strokeStyle = "rgba(148, 163, 184, 0.1)"
    ctx.lineWidth = size === "small" ? 8 : 12
    ctx.stroke()

    // 进度圆环
    const progress = animatedValue / max
    const endAngle = -Math.PI / 2 + Math.PI * 2 * progress

    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, color1)
    gradient.addColorStop(1, color2)

    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, -Math.PI / 2, endAngle)
    ctx.strokeStyle = gradient
    ctx.lineWidth = size === "small" ? 8 : 12
    ctx.lineCap = "round"
    ctx.stroke()

    // 中心值
    ctx.fillStyle = color1
    ctx.font = `bold ${config.fontSize}px sans-serif`
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(animatedValue.toFixed(0), centerX, centerY - (size === "small" ? 5 : 10))

    // 标签
    if (label) {
      ctx.fillStyle = "rgba(148, 163, 184, 0.6)"
      ctx.font = `${config.labelSize}px sans-serif`
      ctx.fillText(label, centerX, centerY + (size === "small" ? 15 : 25))
    }
  }, [animatedValue, max, label, color, size, config])

  return <canvas ref={canvasRef} style={{ width: config.width, height: config.height }} />
}
