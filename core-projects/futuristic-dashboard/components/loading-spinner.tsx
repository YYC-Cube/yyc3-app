"use client"

import { motion } from "framer-motion"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  color?: "cyan" | "purple" | "blue"
}

export function LoadingSpinner({ size = "md", color = "cyan" }: LoadingSpinnerProps) {
  const sizeMap = {
    sm: "w-8 h-8",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  }

  const colorMap = {
    cyan: "border-cyan-500",
    purple: "border-purple-500",
    blue: "border-blue-500",
  }

  return (
    <div className="flex items-center justify-center">
      <div className={`relative ${sizeMap[size]}`}>
        <motion.div
          className={`absolute inset-0 border-4 ${colorMap[color]} border-opacity-30 rounded-full`}
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
        <motion.div
          className={`absolute inset-2 border-4 border-t-${color}-500 border-r-transparent border-b-transparent border-l-transparent rounded-full`}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        />
        <motion.div
          className={`absolute inset-4 border-4 border-r-${color}-500 border-t-transparent border-b-transparent border-l-transparent rounded-full`}
          animate={{ rotate: -360 }}
          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        />
        <motion.div
          className={`absolute inset-6 border-4 border-b-${color}-500 border-t-transparent border-r-transparent border-l-transparent rounded-full`}
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        />
      </div>
    </div>
  )
}
