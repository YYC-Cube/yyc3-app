/**
 * @file YYC³ UI组件使用示例
 * @description 展示如何使用设计令牌和组件模板创建一致的UI组件
 * @module component-examples
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

import React from 'react'
import { motion } from 'framer-motion'
import { FuturisticCard, FuturisticButton, MetricCard } from '@/lib/component-templates'
import tokens, { cn } from '@/lib/design-tokens'

// ==================== 📊 数据展示组件示例 ====================

/**
 * 数据仪表盘网格组件
 */
export const DataDashboard: React.FC = () => {
  const metrics = [
    {
      title: '系统负载',
      value: '78%',
      change: { value: 12, type: 'increase' as const },
      icon: '⚡'
    },
    {
      title: '在线用户',
      value: '2,345',
      change: { value: 8, type: 'increase' as const },
      icon: '👥'
    },
    {
      title: '服务器响应',
      value: '120ms',
      change: { value: 5, type: 'decrease' as const },
      icon: '⚡'
    },
    {
      title: '错误率',
      value: '0.02%',
      change: { value: 15, type: 'decrease' as const },
      icon: '🛡️'
    }
  ]

  return (
    <div className={cn(
      "grid gap-6",
      "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
      "p-6"
    )}>
      {metrics.map((metric, index) => (
        <MetricCard
          key={metric.title}
          title={metric.title}
          value={metric.value}
          change={metric.change}
          icon={metric.icon}
          delay={index * 0.1}
        />
      ))}
    </div>
  )
}

/**
 * 实时数据流组件
 */
export const RealtimeDataStream: React.FC = () => {
  return (
    <FuturisticCard
      title="实时数据流"
      subtitle="系统实时监控"
      variant="neon"
      glowColor="cyan"
      delay={0.2}
    >
      <div className="space-y-4">
        {/* 数据点列表 */}
        <div className="space-y-3">
          {[
            { label: 'CPU使用率', value: '45%', trend: 'up' },
            { label: '内存使用率', value: '67%', trend: 'stable' },
            { label: '网络流量', value: '1.2GB/s', trend: 'up' }
          ].map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50"
            >
              <span className="text-slate-300">{item.label}</span>
              <span className="text-white font-mono">{item.value}</span>
            </motion.div>
          ))}
        </div>
        
        {/* 控制按钮 */}
        <div className="flex gap-3 pt-4 border-t border-slate-700/50">
          <FuturisticButton
            variant="neon"
            glowColor="blue"
            size="sm"
          >
            开始监控
          </FuturisticButton>
          <FuturisticButton
            variant="ghost"
            size="sm"
          >
            重置
          </FuturisticButton>
        </div>
      </div>
    </FuturisticCard>
  )
}

// ==================== 🎮 交互式组件示例 ====================

/**
 * 科技感控制面板
 */
export const TechControlPanel: React.FC = () => {
  const [isActive, setIsActive] = React.useState(false)

  return (
    <div className={cn(
      "grid gap-6",
      "grid-cols-1 lg:grid-cols-2",
      "p-6"
    )}>
      
      {/* 主控制单元 */}
      <FuturisticCard
        title="主控制单元"
        variant="hologram"
        interactive
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-300">系统状态</span>
            <div className={cn(
              "w-3 h-3 rounded-full",
              isActive ? "bg-green-400 shadow-lg shadow-green-400/50" : "bg-red-400"
            )} />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm text-slate-400">功率调节</label>
            <div className="relative">
              <input
                type="range"
                min="0"
                max="100"
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <FuturisticButton
              variant="glow"
              glowColor="blue"
              onClick={() => setIsActive(!isActive)}
            >
              {isActive ? '关闭' : '启动'}
            </FuturisticButton>
          </div>
        </div>
      </FuturisticCard>

      {/* 数据分析单元 */}
      <FuturisticCard
        title="数据分析"
        subtitle="实时性能指标"
        variant="glass"
        interactive
      >
        <div className="space-y-4">
          {/* 模拟图表 */}
          <div className="h-32 bg-slate-800/30 rounded-lg border border-slate-700/30 p-4">
            <div className="flex items-end justify-between h-full gap-1">
              {[40, 65, 45, 80, 55, 70, 90].map((height, index) => (
                <motion.div
                  key={index}
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  className="bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t-sm min-w-[8px] flex-1"
                />
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">95.2%</div>
              <div className="text-slate-400">准确率</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">23ms</div>
              <div className="text-slate-400">延迟</div>
            </div>
          </div>
          
          <FuturisticButton
            variant="outline"
            size="sm"
            className="w-full"
          >
            查看详细分析
          </FuturisticButton>
        </div>
      </FuturisticCard>
    </div>
  )
}

// ==================== 📱 响应式布局示例 ====================

/**
 * 自适应仪表盘布局
 */
export const AdaptiveDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-6">
      {/* 头部区域 */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "mb-8",
          "flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        )}
      >
        <div>
          <h1 className={cn(
            "text-2xl md:text-3xl font-bold text-white mb-2",
            tokens.typography.fontSize['3xl']
          )}>
            YYC³ 未来科技控制台
          </h1>
          <p className="text-slate-400">
            实时监控与管理您的智能系统
          </p>
        </div>
        
        <div className="flex gap-3">
          <FuturisticButton variant="neon" glowColor="blue" size="sm">
            设置
          </FuturisticButton>
          <FuturisticButton variant="ghost" size="sm">
            帮助
          </FuturisticButton>
        </div>
      </motion.header>

      {/* 主要内容区域 */}
      <main className="space-y-6">
        {/* 数据指标网格 - 响应式 */}
        <DataDashboard />
        
        {/* 控制面板网格 - 响应式 */}
        <TechControlPanel />
        
        {/* 底部状态栏 */}
        <FuturisticCard variant="default" className="text-center">
          <div className="flex items-center justify-center gap-6 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span>系统运行正常</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🕒</span>
              <span>{new Date().toLocaleTimeString('zh-CN')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🔒</span>
              <span>安全连接</span>
            </div>
          </div>
        </FuturisticCard>
      </main>
    </div>
  )
}

// ==================== 🎨 主题切换示例 ====================

/**
 * 主题切换控制组件
 */
export const ThemeSwitcher: React.FC = () => {
  const [currentTheme, setCurrentTheme] = React.useState<'default' | 'neon' | 'glass'>('default')

  const themes = [
    { id: 'default', name: '默认主题', color: 'slate' },
    { id: 'neon', name: '霓虹主题', color: 'blue' },
    { id: 'glass', name: '玻璃主题', color: 'purple' }
  ] as const

  return (
    <FuturisticCard title="主题切换" className="w-full max-w-md">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {themes.map((theme) => (
            <motion.button
              key={theme.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentTheme(theme.id)}
              className={cn(
                "p-3 rounded-lg border-2 transition-all duration-300",
                currentTheme === theme.id
                  ? `border-${theme.color}-500 bg-${theme.color}-500/20`
                  : "border-slate-600 hover:border-slate-500"
              )}
            >
              <div className="text-sm font-medium">{theme.name}</div>
            </motion.button>
          ))}
        </div>
        
        {/* 预览区域 */}
        <div className={cn(
          "p-4 rounded-lg border",
          currentTheme === 'neon' && "bg-blue-900/20 border-blue-500/50",
          currentTheme === 'glass' && "bg-white/10 border-white/20 backdrop-blur-md",
          currentTheme === 'default' && "bg-slate-900/50 border-slate-700/50"
        )}>
          <p className="text-sm text-slate-300">
            当前主题: {themes.find(t => t.id === currentTheme)?.name}
          </p>
        </div>
      </div>
    </FuturisticCard>
  )
}

// ==================== 📋 组件使用指南 ====================

/**
 * 组件开发指南示例
 */
export const ComponentGuide: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">
          YYC³ UI组件开发指南
        </h1>
        <p className="text-slate-400 text-lg">
          探索如何使用设计令牌和组件模板构建一致的UI
        </p>
      </div>

      {/* 设计令牌使用示例 */}
      <FuturisticCard title="设计令牌使用" variant="neon">
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* 颜色展示 */}
            <div>
              <div className="text-sm text-slate-400 mb-2">主色调</div>
              <div className={cn(
                "w-full h-12 rounded-lg",
                "bg-gradient-to-br from-blue-500 to-blue-600"
              )} />
            </div>
            
            {/* 间距展示 */}
            <div>
              <div className="text-sm text-slate-400 mb-2">间距系统</div>
              <div className="space-y-2">
                <div className={cn("bg-blue-500/30", tokens.spacing.xs)} />
                <div className={cn("bg-cyan-500/30", tokens.spacing.sm)} />
                <div className={cn("bg-purple-500/30", tokens.spacing.md)} />
              </div>
            </div>
            
            {/* 字体展示 */}
            <div>
              <div className="text-sm text-slate-400 mb-2">字体层级</div>
              <div className="space-y-1">
                <div className={cn("text-white", tokens.typography.fontSize.xl)}>大标题</div>
                <div className={cn("text-slate-300", tokens.typography.fontSize.base)}>正文内容</div>
                <div className={cn("text-slate-400", tokens.typography.fontSize.sm)}>辅助文字</div>
              </div>
            </div>
            
            {/* 阴影展示 */}
            <div>
              <div className="text-sm text-slate-400 mb-2">阴影效果</div>
              <div className="space-y-2">
                <div className={cn("w-8 h-8 bg-slate-700 rounded", tokens.shadows.sm)} />
                <div className={cn("w-8 h-8 bg-slate-700 rounded", tokens.shadows.md)} />
                <div className={cn("w-8 h-8 bg-slate-700 rounded", tokens.shadows.lg)} />
              </div>
            </div>
          </div>
        </div>
      </FuturisticCard>

      {/* 组件变体展示 */}
      <FuturisticCard title="组件变体展示" variant="glass">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 默认卡片 */}
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-3">默认卡片</h4>
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4">
              <p className="text-sm text-slate-400">基础的科技感卡片</p>
            </div>
          </div>
          
          {/* 霓虹卡片 */}
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-3">霓虹卡片</h4>
            <div className="bg-transparent border-2 border-blue-500/50 rounded-lg p-4 shadow-lg shadow-blue-500/20">
              <p className="text-sm text-blue-400">发光的霓虹效果</p>
            </div>
          </div>
          
          {/* 玻璃卡片 */}
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-3">玻璃卡片</h4>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-4">
              <p className="text-sm text-white">毛玻璃质感效果</p>
            </div>
          </div>
        </div>
      </FuturisticCard>

      {/* 按钮变体展示 */}
      <FuturisticCard title="按钮样式变体" variant="hologram">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <FuturisticButton variant="default">默认按钮</FuturisticButton>
          <FuturisticButton variant="neon" glowColor="blue">霓虹按钮</FuturisticButton>
          <FuturisticButton variant="glow" glowColor="cyan">发光按钮</FuturisticButton>
          <FuturisticButton variant="outline">轮廓按钮</FuturisticButton>
        </div>
      </FuturisticCard>

      {/* 代码示例 */}
      <FuturisticCard title="使用代码示例" variant="neon">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-2">导入设计令牌</h4>
            <pre className="bg-slate-800/50 p-4 rounded-lg text-sm text-green-400 overflow-x-auto">
{`import tokens from '@/lib/design-tokens'

// 使用颜色
const buttonStyle = tokens.colors.tech.blue

// 使用间距
const cardPadding = tokens.spacing.lg

// 使用动画
const animation = tokens.animations.duration.normal`}
            </pre>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-2">使用组件模板</h4>
            <pre className="bg-slate-800/50 p-4 rounded-lg text-sm text-cyan-400 overflow-x-auto">
{`import { FuturisticCard, FuturisticButton } from '@/lib/component-templates'

// 创建科技感卡片
<FuturisticCard
  title="数据监控"
  variant="neon"
  glowColor="blue"
>
  <div>监控内容</div>
</FuturisticCard>

// 创建发光按钮
<FuturisticButton
  variant="glow"
  glowColor="cyan"
>
  立即执行
</FuturisticButton>`}
            </pre>
          </div>
        </div>
      </FuturisticCard>
    </div>
  )
}

// ==================== 📤 导出所有示例组件 ====================

export const examples = {
  DataDashboard,
  RealtimeDataStream,
  TechControlPanel,
  AdaptiveDashboard,
  ThemeSwitcher,
  ComponentGuide
}

export default examples