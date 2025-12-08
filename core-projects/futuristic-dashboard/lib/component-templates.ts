/**
 * @file YYC³ 组件开发模板
 * @description 提供标准化的组件开发模板，确保UI风格一致性
 * @module component-templates
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

import { motion, Variants } from 'framer-motion'
import { cn } from '@/lib/utils'
import tokens from './design-tokens'

// ==================== 🎯 通用组件模板 ====================

/**
 * 基础组件模板
 */
export interface BaseComponentProps {
  className?: string
  children: React.ReactNode
  delay?: number
}

/**
 * 未来科技风格卡片模板
 */
export interface FuturisticCardProps extends BaseComponentProps {
  title?: string
  subtitle?: string
  variant?: 'default' | 'neon' | 'glass' | 'hologram'
  glowColor?: 'blue' | 'cyan' | 'purple'
  interactive?: boolean
}

/**
 * 科技感按钮模板
 */
export interface FuturisticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'neon' | 'glow' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  glowColor?: 'blue' | 'cyan' | 'purple'
  loading?: boolean
  icon?: React.ReactNode
}

/**
 * 数据展示组件模板
 */
export interface MetricCardProps extends BaseComponentProps {
  title: string
  value: string | number
  change?: {
    value: number
    type: 'increase' | 'decrease' | 'neutral'
  }
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'stable'
}

// ==================== 🎨 动画变体库 ====================

export const cardAnimations: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: tokens.animations.duration.normal,
      ease: tokens.animations.easing.futuristic
    }
  },
  hover: {
    y: -4,
    scale: 1.02,
    boxShadow: tokens.shadows.glow.blue,
    transition: {
      duration: tokens.animations.duration.fast,
      ease: tokens.animations.easing.easeOut
    }
  }
}

export const buttonAnimations: Variants = {
  hover: {
    scale: 1.05,
    y: -2,
    transition: {
      duration: tokens.animations.duration.fast,
      ease: tokens.animations.easing.smooth
    }
  },
  tap: {
    scale: 0.95,
    y: 0,
    transition: {
      duration: tokens.animations.duration.fast
    }
  },
  loading: {
    opacity: [1, 0.5, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: tokens.animations.easing.easeInOut
    }
  }
}

export const metricAnimations: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: tokens.animations.duration.slow,
      ease: tokens.animations.easing.bounce
    }
  }
}

// ==================== 🧩 组件实现示例 ====================

/**
 * 未来科技风格卡片组件
 */
export const FuturisticCard: React.FC<FuturisticCardProps> = ({
  title,
  subtitle,
  children,
  className,
  variant = 'default',
  glowColor = 'blue',
  interactive = true,
  delay = 0
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'neon':
        return {
          card: cn(
            tokens.futuristicTheme.glassmorphism.dark,
            'border',
            glowColor === 'blue' ? 'border-blue-500/50' : 
            glowColor === 'cyan' ? 'border-cyan-500/50' : 'border-purple-500/50'
          ),
          glow: glowColor === 'blue' ? tokens.shadows.glow.blue :
                glowColor === 'cyan' ? tokens.shadows.glow.cyan : tokens.shadows.glow.purple
        }
      case 'glass':
        return {
          card: cn(
            'bg-white/10 backdrop-blur-md border border-white/20',
            'shadow-xl'
          ),
          glow: '0 8px 32px rgba(255, 255, 255, 0.1)'
        }
      case 'hologram':
        return {
          card: cn(
            'bg-gradient-to-br from-purple-900/30 to-blue-900/30',
            'border border-purple-500/30',
            'shadow-lg shadow-purple-500/10'
          ),
          glow: tokens.shadows.glow.purple
        }
      default:
        return {
          card: tokens.futuristicTheme.glassmorphism.medium,
          glow: tokens.shadows.md
        }
    }
  }

  const { card: cardStyles, glow } = getVariantStyles()

  return (
    <motion.div
      variants={cardAnimations}
      initial="hidden"
      animate="visible"
      whileHover={interactive ? "hover" : undefined}
      transition={{ delay }}
      className={cn(
        'rounded-lg p-6 relative overflow-hidden',
        'transition-all duration-300',
        cardStyles,
        className
      )}
      style={{
        boxShadow: interactive ? glow : undefined
      }}
    >
      {/* 装饰性背景元素 */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      
      {/* 标题区域 */}
      {(title || subtitle) && (
        <div className="relative z-10 mb-4">
          {title && (
            <h3 className="text-lg font-semibold text-slate-100 mb-1">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
      )}
      
      {/* 内容区域 */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  )
}

/**
 * 科技感按钮组件
 */
export const FuturisticButton: React.FC<FuturisticButtonProps> = ({
  children,
  variant = 'default',
  size = 'md',
  glowColor = 'blue',
  loading = false,
  icon,
  className,
  disabled,
  ...props
}) => {
  const getVariantStyles = () => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-300'
    
    switch (variant) {
      case 'neon':
        return cn(
          baseStyles,
          'bg-transparent border-2',
          glowColor === 'blue' ? 'border-blue-500 text-blue-400 hover:bg-blue-500/10' :
          glowColor === 'cyan' ? 'border-cyan-500 text-cyan-400 hover:bg-cyan-500/10' : 
          'border-purple-500 text-purple-400 hover:bg-purple-500/10',
          'shadow-lg hover:shadow-glow'
        )
      case 'glow':
        return cn(
          baseStyles,
          glowColor === 'blue' ? 'bg-blue-600/20 border border-blue-500/50 text-blue-400 hover:bg-blue-600/30' :
          glowColor === 'cyan' ? 'bg-cyan-600/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-600/30' : 
          'bg-purple-600/20 border border-purple-500/50 text-purple-400 hover:bg-purple-600/30'
        )
      case 'outline':
        return cn(
          baseStyles,
          'bg-transparent border border-slate-600 text-slate-300 hover:bg-slate-800/50 hover:text-white'
        )
      case 'ghost':
        return cn(
          baseStyles,
          'bg-transparent text-slate-400 hover:bg-slate-800/50 hover:text-white'
        )
      default:
        return cn(
          baseStyles,
          'bg-slate-700 text-white hover:bg-slate-600'
        )
    }
  }

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  }

  return (
    <motion.button
      variants={buttonAnimations}
      whileHover="hover"
      whileTap="tap"
      animate={loading ? "loading" : undefined}
      className={cn(
        getVariantStyles(),
        sizeStyles[size],
        'rounded-lg',
        'focus:outline-none focus:ring-2 focus:ring-blue-500/50',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        icon && <span className="flex-shrink-0">{icon}</span>
      )}
      <span>{children}</span>
    </motion.button>
  )
}

/**
 * 数据指标卡片组件
 */
export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon,
  trend,
  children,
  className,
  delay = 0
}) => {
  const getTrendColor = () => {
    if (!change) return 'text-slate-400'
    
    switch (change.type) {
      case 'increase':
        return 'text-emerald-400'
      case 'decrease':
        return 'text-red-400'
      default:
        return 'text-slate-400'
    }
  }

  const getTrendIcon = () => {
    if (!change) return null
    
    switch (change.type) {
      case 'increase':
        return '↗️'
      case 'decrease':
        return '↘️'
      default:
        return '→'
    }
  }

  return (
    <motion.div
      variants={metricAnimations}
      initial="hidden"
      animate="visible"
      transition={{ delay }}
      className={cn(
        'bg-slate-900/50 border border-slate-700/50 backdrop-blur-sm',
        'rounded-lg p-6 relative overflow-hidden',
        'transition-all duration-300 hover:shadow-lg hover:border-slate-600/50',
        className
      )}
    >
      {/* 背景装饰 */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full transform translate-x-10 -translate-y-10" />
      
      <div className="relative z-10">
        {/* 标题和图标 */}
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-slate-400">
            {title}
          </h4>
          {icon && (
            <div className="text-slate-400">
              {icon}
            </div>
          )}
        </div>
        
        {/* 主要数值 */}
        <div className="mb-3">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: delay + 0.2 }}
            className="text-3xl font-bold text-white"
          >
            {value}
          </motion.div>
        </div>
        
        {/* 变化指示器 */}
        {change && (
          <div className={cn('flex items-center gap-2 text-sm', getTrendColor())}>
            <span>{getTrendIcon()}</span>
            <span>{Math.abs(change.value)}%</span>
          </div>
        )}
        
        {/* 额外内容 */}
        {children && (
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            {children}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ==================== 🔧 工具函数 ====================

export const componentUtils = {
  /**
   * 生成一致的组件间距
   */
  getSpacing: (size: keyof typeof tokens.spacing) => tokens.spacing[size],
  
  /**
   * 生成一致的组件尺寸
   */
  getSize: (size: 'sm' | 'md' | 'lg') => {
    const sizes = {
      sm: { padding: tokens.spacing.sm, font: 'text-sm' },
      md: { padding: tokens.spacing.md, font: 'text-base' },
      lg: { padding: tokens.spacing.lg, font: 'text-lg' }
    }
    return sizes[size]
  },
  
  /**
   * 应用科技感主题
   */
  applyFuturisticTheme: (variant: 'default' | 'neon' | 'glass' | 'hologram') => {
    const themes = {
      default: 'bg-slate-900/50 border border-slate-700/50',
      neon: 'bg-transparent border border-blue-500/50 shadow-lg shadow-blue-500/20',
      glass: 'bg-white/10 backdrop-blur-md border border-white/20',
      hologram: 'bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/30'
    }
    return themes[variant]
  }
}

// ==================== 📝 组件检查清单 ====================

export const componentChecklist = {
  before: [
    '✅ 确定组件是否符合设计系统规范',
    '✅ 检查是否可以使用现有组件扩展',
    '✅ 定义清晰的TypeScript接口',
    '✅ 规划组件的响应式行为',
    '✅ 确定合适的动画效果'
  ],
  during: [
    '✅ 使用设计令牌中的颜色和间距',
    '✅ 遵循8px网格间距系统',
    '✅ 实现深色模式兼容性',
    '✅ 添加适当的无障碍性支持',
    '✅ 确保动画性能优化'
  ],
  after: [
    '✅ 进行视觉一致性审查',
    '✅ 测试响应式断点行为',
    '✅ 验证动画在不同设备上的表现',
    '✅ 检查TypeScript类型安全性',
    '✅ 更新组件文档'
  ]
}

export default {
  FuturisticCard,
  FuturisticButton,
  MetricCard,
  componentUtils,
  componentChecklist,
  cardAnimations,
  buttonAnimations,
  metricAnimations
}