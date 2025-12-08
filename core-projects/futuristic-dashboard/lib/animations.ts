import type React from "react"
/**
 * 动画工具库
 * 提供统一的动画配置和工具函数
 */

// Framer Motion 动画变体
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

export const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
}

export const slideInFromLeft = {
  initial: { opacity: 0, x: -50 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 },
}

export const slideInFromRight = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 50 },
}

export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
}

// 过渡配置
export const springTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
}

export const smoothTransition = {
  duration: 0.3,
  ease: "easeInOut",
}

export const fastTransition = {
  duration: 0.15,
  ease: "easeOut",
}

// 悬浮效果
export const hoverScale = {
  scale: 1.05,
  transition: springTransition,
}

export const hoverLift = {
  y: -4,
  transition: springTransition,
}

export const hoverGlow = {
  boxShadow: "0 0 20px rgba(34, 211, 238, 0.5)",
  transition: smoothTransition,
}

// 点击效果
export const tapScale = {
  scale: 0.95,
  transition: fastTransition,
}

// 加载动画
export const pulseAnimation = {
  scale: [1, 1.05, 1],
  opacity: [1, 0.8, 1],
  transition: {
    duration: 2,
    repeat: Number.POSITIVE_INFINITY,
    ease: "easeInOut",
  },
}

export const spinAnimation = {
  rotate: 360,
  transition: {
    duration: 1,
    repeat: Number.POSITIVE_INFINITY,
    ease: "linear",
  },
}

// 数字滚动动画
export function animateNumber(element: HTMLElement, start: number, end: number, duration = 1000, decimals = 0) {
  const startTime = Date.now()
  const range = end - start

  const animate = () => {
    const now = Date.now()
    const progress = Math.min((now - startTime) / duration, 1)
    const easeProgress = 1 - Math.pow(1 - progress, 3) // easeOutCubic

    const current = start + range * easeProgress
    element.textContent = current.toFixed(decimals)

    if (progress < 1) {
      requestAnimationFrame(animate)
    }
  }

  requestAnimationFrame(animate)
}

// 页面进入动画序列
export const pageEnterSequence = {
  initial: "initial",
  animate: "animate",
  exit: "exit",
  variants: {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
    exit: { opacity: 0 },
  },
}

// 卡片进入动画
export const cardEnterAnimation = {
  initial: { opacity: 0, y: 30, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
}

// 列表项动画
export const listItemAnimation = (index: number) => ({
  initial: { opacity: 0, x: -20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      delay: index * 0.05,
      duration: 0.3,
    },
  },
})

// 模态框动画
export const modalAnimation = {
  initial: { opacity: 0, scale: 0.9, y: 20 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    transition: {
      duration: 0.2,
    },
  },
}

// 背景动画
export const backgroundAnimation = {
  animate: {
    backgroundPosition: ["0% 0%", "100% 100%"],
    transition: {
      duration: 20,
      repeat: Number.POSITIVE_INFINITY,
      repeatType: "reverse" as const,
      ease: "linear",
    },
  },
}

// 粒子动画配置
export interface ParticleConfig {
  count: number
  speed: number
  size: { min: number; max: number }
  color: string
  opacity: { min: number; max: number }
}

export const defaultParticleConfig: ParticleConfig = {
  count: 50,
  speed: 0.5,
  size: { min: 1, max: 3 },
  color: "rgba(34, 211, 238, 1)",
  opacity: { min: 0.2, max: 0.6 },
}

// 波纹效果
export function createRipple(event: React.MouseEvent<HTMLElement>, color = "rgba(34, 211, 238, 0.5)") {
  const button = event.currentTarget
  const ripple = document.createElement("span")
  const rect = button.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height)
  const x = event.clientX - rect.left - size / 2
  const y = event.clientY - rect.top - size / 2

  ripple.style.width = ripple.style.height = `${size}px`
  ripple.style.left = `${x}px`
  ripple.style.top = `${y}px`
  ripple.style.position = "absolute"
  ripple.style.borderRadius = "50%"
  ripple.style.backgroundColor = color
  ripple.style.pointerEvents = "none"
  ripple.style.animation = "ripple-animation 0.6s ease-out"

  button.style.position = "relative"
  button.style.overflow = "hidden"
  button.appendChild(ripple)

  setTimeout(() => {
    ripple.remove()
  }, 600)
}

// CSS 动画关键帧（需要在 globals.css 中定义）
export const cssAnimations = `
@keyframes ripple-animation {
  from {
    transform: scale(0);
    opacity: 1;
  }
  to {
    transform: scale(2);
    opacity: 0;
  }
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 10px rgba(34, 211, 238, 0.3);
  }
  50% {
    box-shadow: 0 0 20px rgba(34, 211, 238, 0.6);
  }
}

@keyframes slide-in-bottom {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes fade-in-scale {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes rotate-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes gradient-shift {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}
`
