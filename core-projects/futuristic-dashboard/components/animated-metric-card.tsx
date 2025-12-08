"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cardEnterAnimation, animateNumber } from "@/lib/animations"
import type { LucideIcon } from "lucide-react"

interface AnimatedMetricCardProps {
  title: string
  value: number
  unit: string
  icon: LucideIcon
  color: "cyan" | "purple" | "blue" | "green" | "amber" | "red"
  trend?: "up" | "down" | "stable"
  percentage?: number
  delay?: number
}

export function AnimatedMetricCard({
  title,
  value,
  unit,
  icon: Icon,
  color,
  trend,
  percentage,
  delay = 0,
}: AnimatedMetricCardProps) {
  const valueRef = useRef<HTMLDivElement>(null)
  const [displayValue, setDisplayValue] = useState(0)

  const colorMap = {
    cyan: "from-cyan-500 to-blue-500 text-cyan-400",
    purple: "from-purple-500 to-pink-500 text-purple-400",
    blue: "from-blue-500 to-indigo-500 text-blue-400",
    green: "from-green-500 to-emerald-500 text-green-400",
    amber: "from-amber-500 to-orange-500 text-amber-400",
    red: "from-red-500 to-rose-500 text-red-400",
  }

  useEffect(() => {
    if (valueRef.current) {
      animateNumber(valueRef.current, displayValue, value, 1000, 1)
      setDisplayValue(value)
    }
  }, [value])

  return (
    <motion.div
      initial={cardEnterAnimation.initial}
      animate={{
        ...cardEnterAnimation.animate,
        transition: {
          ...cardEnterAnimation.animate.transition,
          delay,
        },
      }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm overflow-hidden relative group">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-slate-400">{title}</div>
            <motion.div
              whileHover={{ rotate: 360, scale: 1.2 }}
              transition={{ duration: 0.5 }}
              className={`p-2 rounded-lg bg-gradient-to-br ${colorMap[color]} bg-opacity-10`}
            >
              <Icon className={`h-5 w-5 ${colorMap[color].split(" ")[2]}`} />
            </motion.div>
          </div>
          <div className="mb-2">
            <div className="flex items-baseline">
              <div ref={valueRef} className={`text-3xl font-bold ${colorMap[color].split(" ")[2]}`}>
                {value.toFixed(1)}
              </div>
              <span className="text-sm text-slate-400 ml-2">{unit}</span>
            </div>
          </div>
          {percentage !== undefined && (
            <div className="mt-3">
              <Progress value={percentage} className="h-2 bg-slate-700">
                <motion.div
                  className={`h-full bg-gradient-to-r ${colorMap[color].split(" ")[0]} ${colorMap[color].split(" ")[1]} rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 1, delay: delay + 0.3 }}
                />
              </Progress>
            </div>
          )}
          <div
            className={`absolute -bottom-10 -right-10 h-24 w-24 rounded-full bg-gradient-to-br ${colorMap[color].split(" ")[0]} ${colorMap[color].split(" ")[1]} opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-300`}
          />
        </CardContent>
      </Card>
    </motion.div>
  )
}
