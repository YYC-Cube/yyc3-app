"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cardEnterAnimation, hoverLift, tapScale } from "@/lib/animations"
import type { ReactNode } from "react"

interface AnimatedCardProps {
  title?: string
  children: ReactNode
  delay?: number
  className?: string
  enableHover?: boolean
  enableTap?: boolean
}

export function AnimatedCard({
  title,
  children,
  delay = 0,
  className = "",
  enableHover = true,
  enableTap = true,
}: AnimatedCardProps) {
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
      whileHover={enableHover ? hoverLift : undefined}
      whileTap={enableTap ? tapScale : undefined}
    >
      <Card className={`bg-slate-900/50 border-slate-700/50 backdrop-blur-sm ${className}`}>
        {title && (
          <CardHeader className="border-b border-slate-700/50 pb-3">
            <CardTitle className="text-slate-100 text-base">{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent className={title ? "p-4" : "p-0"}>{children}</CardContent>
      </Card>
    </motion.div>
  )
}
