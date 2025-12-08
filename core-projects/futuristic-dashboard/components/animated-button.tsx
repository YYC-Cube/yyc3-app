"use client"

import type React from "react"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { hoverScale, tapScale, createRipple } from "@/lib/animations"
import type { ReactNode } from "react"

interface AnimatedButtonProps {
  children: ReactNode
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  variant?: "default" | "outline" | "ghost" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  disabled?: boolean
  rippleColor?: string
}

export function AnimatedButton({
  children,
  onClick,
  variant = "default",
  size = "default",
  className = "",
  disabled = false,
  rippleColor = "rgba(34, 211, 238, 0.5)",
}: AnimatedButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      createRipple(e, rippleColor)
      onClick?.(e)
    }
  }

  return (
    <motion.div whileHover={!disabled ? hoverScale : undefined} whileTap={!disabled ? tapScale : undefined}>
      <Button variant={variant} size={size} className={className} onClick={handleClick} disabled={disabled}>
        {children}
      </Button>
    </motion.div>
  )
}
