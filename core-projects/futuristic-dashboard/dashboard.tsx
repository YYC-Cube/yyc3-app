"use client"

import React from "react"

import { TooltipContent } from "@/components/ui/tooltip"

import { useEffect, useState, useRef, useCallback } from "react"
import {
  Activity,
  AlertTriangle as AlertCircle,
  BarChart3,
  X as CircleOff,
  Layout as Command,
  Cpu,
  Database,
  Download,
  Globe,
  HardDrive,
  Layout as Hexagon,
  TrendingUp as LineChart,
  Lock,
  MessageSquare,
  MessageSquare as Mic,
  Moon,
  Wifi as Radio,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Sun,
  Terminal,
  TrendingUp,
  Wifi,
  Zap,
} from "@/lib/icons"
import type { LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { MobileNav } from "@/components/mobile/mobile-nav"
import { MobileBottomNav } from "@/components/mobile/mobile-bottom-nav"
import { MobileStatsGrid } from "@/components/mobile/mobile-stats-grid"
import { useMobile } from "@/hooks/use-mobile"
import { NotificationCenter } from "@/components/notifications/notification-center"
import { AIInsightsPanel } from "@/components/ai-insights-panel"
import { useAIAnalysis } from "@/hooks/use-ai-analysis"
import { useAuth } from "@/lib/auth/auth-context"
import { PermissionGate } from "@/components/auth/permission-gate"
import { RealTimeGauge } from "@/components/charts/real-time-gauge"
import { RadialProgressChart } from "@/components/charts/radial-progress-chart"
import { IndustrySelector } from "@/components/industry-selector"
import { getIndustryConfig, generateIndustryMetrics, type IndustryType } from "@/lib/industry-adapter"
import { generateRealTimeInsights } from "@/lib/enhanced-ai-engine"
import Link from "next/link"

// Add missing imports
// 确保图标组件符合LucideIcon类型要求
const Info: LucideIcon = AlertCircle
const Check: LucideIcon = Shield

// 为图标组件设置displayName
Object.defineProperty(Info, "displayName", { value: "Info" })
Object.defineProperty(Check, "displayName", { value: "Check" })

export default function Dashboard() {
  const [theme, setTheme] = useState<"dark" | "light">("dark")
  const [currentIndustry, setCurrentIndustry] = useState<IndustryType>("yyc3-dc")
  const [industryMetrics, setIndustryMetrics] = useState<Record<string, number>>({})
  const [realTimeInsights, setRealTimeInsights] = useState<any[]>([])

  const [systemStatus, setSystemStatus] = useState(85)
  const [cpuUsage, setCpuUsage] = useState(42)
  const [memoryUsage, setMemoryUsage] = useState(68)
  const [networkStatus, setNetworkStatus] = useState(92)
  const [securityLevel, setSecurityLevel] = useState(75)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [showSearch, setShowSearch] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const canvasRef = useRef<HTMLCanvasElement>(null)

  const isMobile = useMobile()
  const [mobileTab, setMobileTab] = useState("home")

  const industryConfig = getIndustryConfig(currentIndustry)

  // AI analysis Hook
  const { predictions, anomalies, recommendations, runAnalysis } = useAIAnalysis()
  const { user, tenant } = useAuth()

  // 修复：使用 useCallback 包装 runAnalysis 调用，并添加防抖
  const analysisTimeoutRef = useRef<NodeJS.Timeout>()

  const runAnalysisDebounced = useCallback(
    (data: any) => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current)
      }

      analysisTimeoutRef.current = setTimeout(() => {
        runAnalysis(data)
      }, 1000) // 1秒防抖，避免频繁调用
    },
    [runAnalysis],
  )

  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const metrics = generateIndustryMetrics(currentIndustry)
    setIndustryMetrics(metrics)

    // 生成实时洞察
    const insights = generateRealTimeInsights(metrics, currentIndustry)
    setRealTimeInsights(insights)
  }, [currentIndustry])

  useEffect(() => {
    if (!industryConfig) return

    const interval = setInterval(() => {
      const metrics = generateIndustryMetrics(currentIndustry)
      setIndustryMetrics(metrics)

      const insights = generateRealTimeInsights(metrics, currentIndustry)
      setRealTimeInsights(insights)
    }, industryConfig.dashboardLayout.refreshInterval)

    return () => clearInterval(interval)
  }, [currentIndustry, industryConfig])

  // Update time - 修复Hydration错误，确保只在客户端渲染时初始化和更新时间
  useEffect(() => {
    // 首次在客户端渲染时设置初始时间
    setCurrentTime(new Date())
    
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Simulate changing data
  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage(Math.floor(Math.random() * 30) + 30)
      setMemoryUsage(Math.floor(Math.random() * 20) + 60)
      setNetworkStatus(Math.floor(Math.random() * 15) + 80)
      setSystemStatus(Math.floor(Math.random() * 10) + 80)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  // Particle effect
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const particles: Particle[] = []
    const particleCount = 100

    class Particle {
      x: number
      y: number
      size: number
      speedX: number
      speedY: number
      color: string

      constructor() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.size = Math.random() * 3 + 1
        this.speedX = (Math.random() - 0.5) * 0.5
        this.speedY = (Math.random() - 0.5) * 0.5
        this.color = `rgba(${Math.floor(Math.random() * 100) + 100}, ${Math.floor(Math.random() * 100) + 150}, ${Math.floor(Math.random() * 55) + 200}, ${Math.random() * 0.5 + 0.2})`
      }

      update() {
        this.x += this.speedX
        this.y += this.speedY

        if (this.x > canvas.width) this.x = 0
        if (this.x < 0) this.x = canvas.width
        if (this.y > canvas.height) this.y = 0
        if (this.y < 0) this.y = canvas.height
      }

      draw() {
        if (!ctx) return
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle())
    }

    function animate() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const particle of particles) {
        particle.update()
        particle.draw()
      }

      requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      if (!canvas) return
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  // 修复：Run AI analysis on data update - 使用防抖版本
  useEffect(() => {
    if (!isLoading) {
      runAnalysisDebounced({
        cpu: cpuUsage,
        memory: memoryUsage,
        network: networkStatus,
        security: securityLevel,
      })
    }
  }, [cpuUsage, memoryUsage, networkStatus, securityLevel, isLoading, runAnalysisDebounced])

  // 清理 timeout
  useEffect(() => {
    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current)
      }
    }
  }, [])

  // Toggle theme
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  // Format time - 增加null检查和错误处理以避免Hydration错误
  const formatTime = (date: Date | null) => {
    if (!date) return '--:--:--';
    try {
      return date.toLocaleTimeString("zh-CN", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch (error) {
      console.error('时间格式化错误:', error);
      return '--:--:--';
    }
  }

  // Format date - 增加null检查以避免Hydration错误
  const formatDate = (date: Date | null) => {
    if (!date) return '--/--/----';
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // 如果配置不存在，显示错误状态
  if (!industryConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black to-slate-900 text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">配置加载失败</h2>
          <p className="text-slate-400">无法加载行业配置，请刷新页面重试</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`${theme} min-h-screen bg-gradient-to-br from-black to-slate-900 text-slate-100 relative overflow-hidden`}
    >
      {/* Background particle effect */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-30" />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="flex flex-col items-center">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 border-4 border-cyan-500/30 rounded-full animate-ping"></div>
              <div className="absolute inset-2 border-4 border-t-cyan-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-4 border-4 border-r-purple-500 border-t-transparent border-b-transparent border-l-transparent rounded-full animate-spin-slow"></div>
              <div className="absolute inset-6 border-4 border-b-blue-500 border-t-transparent border-r-transparent border-l-transparent rounded-full animate-spin-slower"></div>
              <div className="absolute inset-8 border-4 border-l-green-500 border-t-transparent border-r-transparent border-b-transparent rounded-full animate-spin"></div>
            </div>
            <div className="mt-4 text-cyan-500 font-mono text-sm tracking-wider">系统初始化中</div>
          </div>
        </div>
      )}

      <div className="container mx-auto p-4 relative z-10 pb-20 md:pb-4">
        {/* Header */}
        <header className="flex items-center justify-between py-4 border-b border-slate-700/50 mb-6">
          <div className="flex items-center space-x-2">
            <MobileNav />
            <img src="/logo.png" alt="星云操作系统" className="h-8 w-8 object-contain" />
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              星云操作系统
            </span>
            {tenant && (
              <Badge variant="outline" className="ml-2 bg-slate-800/50 text-slate-400 border-slate-600/50 text-xs">
                {tenant.name}
              </Badge>
            )}
            <Badge variant="outline" className="ml-2 bg-cyan-500/20 text-cyan-400 border-cyan-500/50 text-xs">
              {industryConfig.name}
            </Badge>
          </div>

          <div className="flex items-center space-x-3 md:space-x-6">
            <div className="hidden lg:flex items-center space-x-1 bg-slate-800/50 rounded-full px-3 py-1.5 border border-slate-700/50 backdrop-blur-sm">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="搜索系统..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchQuery.trim()) {
                    console.log("[v0] 搜索:", searchQuery)
                    // 这里可以添加实际的搜索逻辑
                  }
                }}
                className="bg-transparent border-none focus:outline-none text-sm w-40 placeholder:text-slate-500"
              />
            </div>

            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="hidden lg:block">
                <IndustrySelector currentIndustry={currentIndustry} onIndustryChange={setCurrentIndustry} />
              </div>

              <NotificationCenter />

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleTheme}
                      className="text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
                    >
                      {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{theme === "dark" ? "切换到浅色模式" : "切换到深色模式"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className="relative hidden md:block">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded-full"
                      >
                        <Avatar className="cursor-pointer hover:ring-2 hover:ring-cyan-500 transition-all">
                          <AvatarImage src="/placeholder.svg?height=40&width=40" alt={user?.name || "用户"} />
                          <AvatarFallback className="bg-slate-700 text-cyan-500">
                            {user?.name?.charAt(0) || "管"}
                          </AvatarFallback>
                        </Avatar>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{user?.name || "用户菜单"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                    <div className="p-4 border-b border-slate-700/50 bg-slate-800/50">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src="/placeholder.svg?height=40&width=40" alt={user?.name || "用户"} />
                          <AvatarFallback className="bg-slate-700 text-cyan-500">
                            {user?.name?.charAt(0) || "管"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium text-slate-100">{user?.name || "管理员"}</div>
                          <div className="text-xs text-slate-400">{user?.email || "admin@system.com"}</div>
                        </div>
                      </div>
                    </div>

                    <div className="py-2">
                      <Link href="/settings" className="block">
                        <button
                          onClick={() => setShowUserMenu(false)}
                          className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-800/50 flex items-center"
                        >
                          <Settings className="h-4 w-4 mr-2 text-slate-400" />
                          系统设置
                        </button>
                      </Link>

                      <button
                        onClick={() => {
                          setShowUserMenu(false)
                          console.log("[v0] 切换账户")
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-800/50 flex items-center"
                      >
                        <Avatar className="h-4 w-4 mr-2" />
                        切换账户
                      </button>

                      <div className="border-t border-slate-700/50 my-2"></div>

                      <button
                        onClick={() => {
                          setShowUserMenu(false)
                          console.log("[v0] 退出登录")
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-slate-800/50 flex items-center"
                      >
                        <CircleOff className="h-4 w-4 mr-2" />
                        退出登录
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="hidden md:block md:col-span-3 lg:col-span-2">
            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm h-full">
              <CardContent className="p-4">
                <nav className="space-y-2">
                  <Link href="/" className="block">
                    <NavItem icon={Command} label="仪表板" active />
                  </Link>
                  <Link href="/industries" className="block">
                    <NavItem icon={Hexagon} label="行业管理" />
                  </Link>
                  <PermissionGate permission="view:analytics">
                    <Link href="/analytics" className="block">
                      <NavItem icon={Activity} label="数据分析" />
                    </Link>
                  </PermissionGate>
                  <PermissionGate permission="view:data">
                    <Link href="/data-center" className="block">
                      <NavItem icon={Database} label="数据中心" />
                    </Link>
                  </PermissionGate>
                  <PermissionGate permission="view:network">
                    <Link href="/network" className="block">
                      <NavItem icon={Globe} label="网络监控" />
                    </Link>
                  </PermissionGate>
                  <PermissionGate permission="view:security">
                    <Link href="/security" className="block">
                      <NavItem icon={Shield} label="安全防护" />
                    </Link>
                  </PermissionGate>
                  <PermissionGate permission="execute:commands">
                    <Link href="/console" className="block">
                      <NavItem icon={Terminal} label="控制台" />
                    </Link>
                  </PermissionGate>
                  <Link href="/communications" className="block">
                    <NavItem icon={MessageSquare} label="通讯中心" />
                  </Link>
                  <PermissionGate permission="manage:settings">
                    <Link href="/settings" className="block">
                      <NavItem icon={Settings} label="系统设置" />
                    </Link>
                  </PermissionGate>
                </nav>

                <div className="mt-8 pt-6 border-t border-slate-700/50">
                  <div className="text-xs text-slate-500 mb-2 font-mono">系统状态</div>
                  <div className="space-y-3">
                    <StatusItem label="核心系统" value={systemStatus} color="cyan" />
                    <StatusItem label="安全等级" value={securityLevel} color="green" />
                    <StatusItem label="网络状态" value={networkStatus} color="blue" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main dashboard */}
          <div className="col-span-1 md:col-span-9 lg:col-span-7">
            <div className="grid gap-6">
              <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="border-b border-slate-700/50 pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-slate-100 flex items-center">
                      <Activity className="mr-2 h-5 w-5 text-cyan-500" />
                      {industryConfig.name} - 实时监控
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="bg-slate-800/50 text-cyan-400 border-cyan-500/50 text-xs">
                        <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 mr-1 animate-pulse"></div>
                        实时
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {industryConfig.metrics.slice(0, 4).map((metric) => {
                      const value = industryMetrics[metric.id] || 0
                      const [min, max] = metric.normalRange
                      const percentage = Math.round(((value - min) / (max - min)) * 100)
                      const isWarning = value > metric.criticalThreshold

                      return (
                        <div
                          key={metric.id}
                          className={`bg-slate-800/50 rounded-lg border p-4 relative overflow-hidden ${
                            isWarning ? "border-red-500/50" : "border-slate-700/50"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-slate-400">{metric.name}</div>
                            {isWarning && <AlertCircle className="h-4 w-4 text-red-500" />}
                          </div>
                          <div className="text-2xl font-bold mb-1 text-slate-100">
                            {value}
                            <span className="text-sm text-slate-400 ml-1">{metric.unit}</span>
                          </div>
                          <div className="text-xs text-slate-500">
                            正常范围: {min}-{max} {metric.unit}
                          </div>
                          <Progress className="h-1 mt-2 bg-slate-700" value={Math.min(100, Math.max(0, percentage))}>
                            <div
                              className={`h-full rounded-full ${
                                isWarning ? "bg-red-500" : "bg-gradient-to-r from-cyan-500 to-blue-500"
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                            />
                          </Progress>
                        </div>
                      )
                    })}
                  </div>

                  {realTimeInsights.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-slate-700/50">
                      <div className="text-sm font-medium text-slate-300 mb-3 flex items-center">
                        <TrendingUp className="h-4 w-4 mr-2 text-cyan-500" />
                        AI 实时洞察
                      </div>
                      <div className="space-y-2">
                        {realTimeInsights.slice(0, 3).map((insight) => (
                          <div
                            key={insight.id}
                            className={`bg-slate-800/30 rounded-md p-3 border ${
                              insight.priority === "critical"
                                ? "border-red-500/50"
                                : insight.priority === "high"
                                  ? "border-amber-500/50"
                                  : insight.priority === "optimization"
                                    ? "border-blue-500/50"
                                    : "border-slate-700/50"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${
                                      insight.type === "opportunity"
                                        ? "bg-green-500/20 text-green-400 border-green-500/50"
                                        : insight.type === "risk"
                                          ? "bg-red-500/20 text-red-400 border-red-500/50"
                                          : insight.type === "optimization"
                                            ? "bg-blue-500/20 text-blue-400 border-blue-500/50"
                                            : "bg-amber-500/20 text-amber-400 border-amber-500/50"
                                    }`}
                                  >
                                    {insight.type === "opportunity"
                                      ? "机会"
                                      : insight.type === "risk"
                                        ? "风险"
                                        : insight.type === "optimization"
                                          ? "优化"
                                          : "警报"}
                                  </Badge>
                                  <span className="text-sm font-medium text-slate-200">{insight.title}</span>
                                </div>
                                <p className="text-xs text-slate-400">{insight.description}</p>
                                {insight.suggestedActions.length > 0 && (
                                  <div className="mt-2 text-xs text-cyan-400">建议: {insight.suggestedActions[0]}</div>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 ml-2">{Math.round(insight.confidence * 100)}%</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* System overview */}
              <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="border-b border-slate-700/50 pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-slate-100 flex items-center">
                      <Activity className="mr-2 h-5 w-5 text-cyan-500" />
                      系统概览
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="bg-slate-800/50 text-cyan-400 border-cyan-500/50 text-xs">
                        <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 mr-1 animate-pulse"></div>
                        实时
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  {isMobile ? (
                    <MobileStatsGrid
                      cpu={cpuUsage}
                      memory={memoryUsage}
                      network={networkStatus}
                      security={securityLevel}
                    />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <MetricCard
                        title="CPU 使用率"
                        value={cpuUsage}
                        icon={Cpu}
                        trend="up"
                        color="cyan"
                        detail="3.8 GHz | 12 核心"
                      />
                      <MetricCard
                        title="内存占用"
                        value={memoryUsage}
                        icon={HardDrive}
                        trend="stable"
                        color="purple"
                        detail="16.4 GB / 24 GB"
                      />
                      <MetricCard
                        title="网络状态"
                        value={networkStatus}
                        icon={Wifi}
                        trend="down"
                        color="blue"
                        detail="1.2 GB/s | 42ms"
                      />
                    </div>
                  )}

                  <div className="mt-8">
                    <Tabs defaultValue="performance" className="w-full">
                      <div className="flex items-center justify-between mb-4">
                        <TabsList className="bg-slate-800/50 p-1">
                          <TabsTrigger
                            value="performance"
                            className="data-[state=active]:bg-slate-700 data-[state=active]:text-cyan-400"
                          >
                            性能监控
                          </TabsTrigger>
                          <TabsTrigger
                            value="processes"
                            className="data-[state=active]:bg-slate-700 data-[state=active]:text-cyan-400"
                          >
                            进程管理
                          </TabsTrigger>
                          <TabsTrigger
                            value="storage"
                            className="data-[state=active]:bg-slate-700 data-[state=active]:text-cyan-400"
                          >
                            存储空间
                          </TabsTrigger>
                        </TabsList>

                        <div className="flex items-center space-x-2 text-xs text-slate-400">
                          <div className="flex items-center">
                            <div className="h-2 w-2 rounded-full bg-cyan-500 mr-1"></div>
                            CPU
                          </div>
                          <div className="flex items-center">
                            <div className="h-2 w-2 rounded-full bg-purple-500 mr-1"></div>
                            内存
                          </div>
                          <div className="flex items-center">
                            <div className="h-2 w-2 rounded-full bg-blue-500 mr-1"></div>
                            网络
                          </div>
                        </div>
                      </div>

                      <TabsContent value="performance" className="mt-0">
                        <div className="h-64 w-full relative bg-slate-800/30 rounded-lg border border-slate-700/50 overflow-hidden">
                          <PerformanceChart />
                          <div className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur-sm rounded-md px-3 py-2 border border-slate-700/50">
                            <div className="text-xs text-slate-400">系统负载</div>
                            <div className="text-lg font-mono text-cyan-400">{cpuUsage}%</div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="processes" className="mt-0">
                        <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 overflow-hidden">
                          <div className="grid grid-cols-12 text-xs text-slate-400 p-3 border-b border-slate-700/50 bg-slate-800/50">
                            <div className="col-span-1">进程ID</div>
                            <div className="col-span-4">进程名称</div>
                            <div className="col-span-2">用户</div>
                            <div className="col-span-2">CPU</div>
                            <div className="col-span-2">内存</div>
                            <div className="col-span-1">状态</div>
                          </div>

                          <div className="divide-y divide-slate-700/30">
                            <ProcessRow
                              pid="1024"
                              name="system_core.exe"
                              user="系统"
                              cpu={12.4}
                              memory={345}
                              status="运行中"
                            />
                            <ProcessRow
                              pid="1842"
                              name="nexus_service.exe"
                              user="系统"
                              cpu={8.7}
                              memory={128}
                              status="运行中"
                            />
                            <ProcessRow
                              pid="2156"
                              name="security_monitor.exe"
                              user="管理员"
                              cpu={5.2}
                              memory={96}
                              status="运行中"
                            />
                            <ProcessRow
                              pid="3012"
                              name="network_manager.exe"
                              user="系统"
                              cpu={3.8}
                              memory={84}
                              status="运行中"
                            />
                            <ProcessRow
                              pid="4268"
                              name="user_interface.exe"
                              user="用户"
                              cpu={15.3}
                              memory={256}
                              status="运行中"
                            />
                            <ProcessRow
                              pid="5124"
                              name="data_analyzer.exe"
                              user="管理员"
                              cpu={22.1}
                              memory={512}
                              status="运行中"
                            />
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="storage" className="mt-0">
                        <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <StorageItem name="系统盘 (C:)" total={512} used={324} type="固态硬盘" />
                            <StorageItem name="数据盘 (D:)" total={2048} used={1285} type="机械硬盘" />
                            <StorageItem name="备份盘 (E:)" total={4096} used={1865} type="机械硬盘" />
                            <StorageItem name="外置盘 (F:)" total={1024} used={210} type="固态硬盘" />
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </CardContent>
              </Card>

              {/* Security & Alerts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PermissionGate permission="view:security">
                  <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-slate-100 flex items-center text-base">
                        <Shield className="mr-2 h-5 w-5 text-green-500" />
                        安全状态
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-slate-400">防火墙</div>
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/50">已启用</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-slate-400">入侵检测</div>
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/50">已启用</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-slate-400">数据加密</div>
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/50">已启用</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-slate-400">威胁数据库</div>
                          <div className="text-sm text-cyan-400">
                            已更新 <span className="text-slate-500">12 分钟前</span>
                          </div>
                        </div>

                        <div className="pt-2 mt-2 border-t border-slate-700/50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-medium">安全等级</div>
                            <div className="text-sm text-cyan-400">{securityLevel}%</div>
                          </div>
                          <Progress className="h-2 bg-slate-700" value={securityLevel}>
                            <div
                              className="h-full bg-gradient-to-r from-green-500 to-cyan-500 rounded-full"
                              style={{ width: `${securityLevel}%` }}
                            />
                          </Progress>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </PermissionGate>

                <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-slate-100 flex items-center text-base">
                      <AlertCircle className="mr-2 h-5 w-5 text-amber-500" />
                      系统警报
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <AlertItem title="安全扫描完成" time="14:32:12" description="系统扫描未发现威胁" type="info" />
                      <AlertItem
                        title="检测到带宽峰值"
                        time="13:45:06"
                        description="443 端口出现异常网络活动"
                        type="warning"
                      />
                      <AlertItem
                        title="系统更新可用"
                        time="09:12:45"
                        description="版本 12.4.5 已准备好安装"
                        type="update"
                      />
                      <AlertItem title="备份已完成" time="04:30:00" description="增量备份到 E 盘成功" type="success" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Communications */}
              <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-slate-100 flex items-center text-base">
                    <MessageSquare className="mr-2 h-5 w-5 text-blue-500" />
                    通讯日志
                  </CardTitle>
                  <Badge variant="outline" className="bg-slate-800/50 text-blue-400 border-blue-500/50">
                    4 条新消息
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <CommunicationItem
                      sender="系统管理员"
                      time="15:42:12"
                      message="计划维护将在 02:00 进行。所有系统将暂时离线。"
                      avatar="/placeholder.svg?height=40&width=40"
                      unread
                    />
                    <CommunicationItem
                      sender="安全模块"
                      time="14:30:45"
                      message="已阻止来自 IP 192.168.1.45 的异常登录尝试。已添加到监控列表。"
                      avatar="/placeholder.svg?height=40&width=40"
                      unread
                    />
                    <CommunicationItem
                      sender="网络控制"
                      time="12:15:33"
                      message="已调整高峰时段优先服务的带宽分配。"
                      avatar="/placeholder.svg?height=40&width=40"
                      unread
                    />
                    <CommunicationItem
                      sender="数据中心"
                      time="09:05:18"
                      message="备份验证完成。所有数据完整性检查通过。"
                      avatar="/placeholder.svg?height=40&width=40"
                      unread
                    />
                  </div>
                </CardContent>
                <CardFooter className="border-t border-slate-700/50 pt-4">
                  <div className="flex items-center w-full space-x-2">
                    <input
                      type="text"
                      placeholder="输入消息..."
                      className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                    <Button size="icon" className="bg-blue-600 hover:bg-blue-700">
                      <Mic className="h-4 w-4" />
                    </Button>
                    <Button size="icon" className="bg-cyan-600 hover:bg-cyan-700">
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>

              {/* AI Insights Panel */}
              <PermissionGate permission="view:insights">
                <div className="lg:hidden">
                  <AIInsightsPanel predictions={predictions} anomalies={anomalies} recommendations={recommendations} />
                </div>
              </PermissionGate>

              {/* Advanced Charts Preview */}
              <PermissionGate permission="view:analytics">
                <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-slate-100 flex items-center text-base">
                      <TrendingUp className="mr-2 h-5 w-5 text-cyan-500" />
                      实时性能监控
                    </CardTitle>
                    <Link href="/analytics">
                      <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300">
                        查看详情 →
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                        <RealTimeGauge value={cpuUsage} max={100} label="CPU" color="cyan" size="small" />
                      </div>
                      <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                        <RealTimeGauge value={memoryUsage} max={100} label="内存" color="purple" size="small" />
                      </div>
                      <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                        <RealTimeGauge value={networkStatus} max={100} label="网络" color="blue" size="small" />
                      </div>
                      <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                        <RealTimeGauge value={systemStatus} max={100} label="系统" color="green" size="small" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </PermissionGate>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="hidden lg:block lg:col-span-3">
            <div className="grid gap-6">
              {/* AI Insights Panel */}
              <PermissionGate permission="view:insights">
                <AIInsightsPanel predictions={predictions} anomalies={anomalies} recommendations={recommendations} />
              </PermissionGate>

              {/* System time */}
              <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 border-b border-slate-700/50">
                    <div className="text-center">
                      <div className="text-xs text-slate-500 mb-1 font-mono">系统时间</div>
                      <div className="text-3xl font-mono text-cyan-400 mb-1">{currentTime ? formatTime(currentTime) : '--:--:--'}</div>
                      <div className="text-sm text-slate-400">{currentTime ? formatDate(currentTime) : '--/--/----'}</div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-800/50 rounded-md p-3 border border-slate-700/50">
                        <div className="text-xs text-slate-500 mb-1">运行时间</div>
                        <div className="text-sm font-mono text-slate-200">14天 06:42:18</div>
                      </div>
                      <div className="bg-slate-800/50 rounded-md p-3 border border-slate-700/50">
                        <div className="text-xs text-slate-500 mb-1">时区</div>
                        <div className="text-sm font-mono text-slate-200">UTC+08:00</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick actions */}
              <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-slate-100 text-base">快捷操作</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <ActionButton icon={Shield} label="安全扫描" />
                    <ActionButton icon={RefreshCw} label="同步数据" />
                    <ActionButton icon={Download} label="备份" />
                    <ActionButton icon={Terminal} label="控制台" />
                  </div>
                </CardContent>
              </Card>

              {/* Resource allocation */}
              <PermissionGate permission="manage:resources">
                <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-slate-100 text-base">资源分配</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-sm text-slate-400">处理能力</div>
                          <div className="text-xs text-cyan-400">已分配 42%</div>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                            style={{ width: "42%" }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-sm text-slate-400">内存分配</div>
                          <div className="text-xs text-purple-400">已分配 68%</div>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                            style={{ width: "68%" }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-sm text-slate-400">网络带宽</div>
                          <div className="text-xs text-blue-400">已分配 35%</div>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                            style={{ width: "35%" }}
                          ></div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-700/50">
                        <div className="flex items-center justify-between text-sm">
                          <div className="text-slate-400">优先级</div>
                          <div className="flex items-center">
                            <Slider defaultValue={[3]} max={5} step={1} className="w-24 mr-2" />
                            <span className="text-cyan-400">3/5</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </PermissionGate>

              {/* Environment controls */}
              <PermissionGate permission="manage:settings">
                <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-slate-100 text-base">环境控制</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Radio className="text-cyan-500 mr-2 h-4 w-4" />
                          <Label className="text-sm text-slate-400">电源管理</Label>
                        </div>
                        <Switch />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Lock className="text-cyan-500 mr-2 h-4 w-4" />
                          <Label className="text-sm text-slate-400">安全协议</Label>
                        </div>
                        <Switch defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Zap className="text-cyan-500 mr-2 h-4 w-4" />
                          <Label className="text-sm text-slate-400">节能模式</Label>
                        </div>
                        <Switch />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <CircleOff className="text-cyan-500 mr-2 h-4 w-4" />
                          <Label className="text-sm text-slate-400">自动关机</Label>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </PermissionGate>

              {/* Quick Metrics with Radial Chart */}
              <PermissionGate permission="view:analytics">
                <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-slate-100 text-base">系统指标</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadialProgressChart 
                      title="系统性能指标"
                      metrics={[
                        { label: 'CPU', value: 65, color: '#06b6d4' },
                        { label: '内存', value: 78, color: '#8b5cf6' },
                        { label: '存储', value: 42, color: '#ec4899' },
                        { label: '网络', value: 35, color: '#10b981' }
                      ]}
                    />
                  </CardContent>
                </Card>
              </PermissionGate>
            </div>
          </div>
        </div>
      </div>

      {showUserMenu && <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />}

      <MobileBottomNav activeTab={mobileTab} onTabChange={setMobileTab} />
    </div>
  )
}

// Component for nav items
function NavItem({ icon: Icon, label, active = false }: { icon: LucideIcon; label: string; active?: boolean }) {
  return (
    <Button
      variant="ghost"
      className={`w-full justify-start ${active ? "bg-slate-800/70 text-cyan-400" : "text-slate-400 hover:text-slate-100"}`}
    >
      <Icon className="mr-2 h-4 w-4" />
      {label}
    </Button>
  )
}

// Component for status items
function StatusItem({ label, value, color }: { label: string; value: number; color: string }) {
  const getColor = () => {
    switch (color) {
      case "cyan":
        return "from-cyan-500 to-blue-500"
      case "green":
        return "from-green-500 to-emerald-500"
      case "blue":
        return "from-blue-500 to-indigo-500"
      case "purple":
        return "from-purple-500 to-pink-500"
      default:
        return "from-cyan-500 to-blue-500"
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="text-xs text-slate-400">{label}</div>
        <div className="text-xs text-slate-400">{value}%</div>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${getColor()} rounded-full`} style={{ width: `${value}%` }}></div>
      </div>
    </div>
  )
}

// Component for metric cards
function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  color,
  detail,
}: {
  title: string
  value: number
  icon: LucideIcon
  trend: "up" | "down" | "stable"
  color: string
  detail: string
}) {
  const getColor = () => {
    switch (color) {
      case "cyan":
        return "from-cyan-500 to-blue-500 border-cyan-500/30"
      case "green":
        return "from-green-500 to-emerald-500 border-green-500/30"
      case "blue":
        return "from-blue-500 to-indigo-500 border-blue-500/30"
      case "purple":
        return "from-purple-500 to-pink-500 border-purple-500/30"
      default:
        return "from-cyan-500 to-blue-500 border-cyan-500/30"
    }
  }

  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <BarChart3 className="h-4 w-4 text-amber-500" />
      case "down":
        return <BarChart3 className="h-4 w-4 rotate-180 text-green-500" />
      case "stable":
        return <LineChart className="h-4 w-4" />
      default:
        return null
    }
  }

  return (
    <div className={`bg-slate-800/50 rounded-lg border ${getColor()} p-4 relative overflow-hidden`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-slate-400">{title}</div>
        <Icon className={`h-5 w-5 text-${color}-500`} />
      </div>
      <div className="text-2xl font-bold mb-1 bg-gradient-to-r bg-clip-text text-transparent from-slate-100 to-slate-300">
        {value}%
      </div>
      <div className="text-xs text-slate-500">{detail}</div>
      <div className="absolute bottom-2 right-2 flex items-center">{getTrendIcon()}</div>
      <div className="absolute -bottom-6 -right-6 h-16 w-16 rounded-full bg-gradient-to-r opacity-20 blur-xl from-cyan-500 to-blue-500"></div>
    </div>
  )
}

// Performance chart component
function PerformanceChart() {
  // 使用useState和useEffect确保只在客户端渲染时设置高度，避免Hydration Warning
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="h-full w-full flex items-end justify-between px-4 pt-4 pb-8 relative">
      {/* Y-axis labels */}
      <div className="absolute left-2 top-0 h-full flex flex-col justify-between py-4">
        <div className="text-xs text-slate-500">100%</div>
        <div className="text-xs text-slate-500">75%</div>
        <div className="text-xs text-slate-500">50%</div>
        <div className="text-xs text-slate-500">25%</div>
        <div className="text-xs text-slate-500">0%</div>
      </div>

      {/* X-axis grid lines */}
      <div className="absolute left-0 right-0 top-0 h-full flex flex-col justify-between py-4 px-10">
        <div className="border-b border-slate-700/30 w-full"></div>
        <div className="border-b border-slate-700/30 w-full"></div>
        <div className="border-b border-slate-700/30 w-full"></div>
        <div className="border-b border-slate-700/30 w-full"></div>
        <div className="border-b border-slate-700/30 w-full"></div>
      </div>

      {/* Chart bars */}
      <div className="flex-1 h-full flex items-end justify-between px-2 z-10">
        {Array.from({ length: 24 }).map((_, i) => {
          const cpuHeight = Math.floor(Math.random() * 60) + 20
          const memHeight = Math.floor(Math.random() * 40) + 40
          const netHeight = Math.floor(Math.random() * 30) + 30

          return (
            <div key={i} className="flex space-x-0.5">
              <div
                className="w-1 bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t-sm"
                style={isClient ? { height: `${cpuHeight}%` } : { height: 0 }}
              ></div>
              <div
                className="w-1 bg-gradient-to-t from-purple-500 to-purple-400 rounded-t-sm"
                style={isClient ? { height: `${memHeight}%` } : { height: 0 }}
              ></div>
              <div
                className="w-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm"
                style={isClient ? { height: `${netHeight}%` } : { height: 0 }}
              ></div>
            </div>
          )
        })}
      </div>

      {/* X-axis labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-10">
        <div className="text-xs text-slate-500">00:00</div>
        <div className="text-xs text-slate-500">06:00</div>
        <div className="text-xs text-slate-500">12:00</div>
        <div className="text-xs text-slate-500">18:00</div>
        <div className="text-xs text-slate-500">24:00</div>
      </div>
    </div>
  )
}

// Process row component
function ProcessRow({
  pid,
  name,
  user,
  cpu,
  memory,
  status,
}: {
  pid: string
  name: string
  user: string
  cpu: number
  memory: number
  status: string
}) {
  return (
    <div className="grid grid-cols-12 py-2 px-3 text-sm hover:bg-slate-800/50">
      <div className="col-span-1 text-slate-500">{pid}</div>
      <div className="col-span-4 text-slate-300">{name}</div>
      <div className="col-span-2 text-slate-400">{user}</div>
      <div className="col-span-2 text-cyan-400">{cpu}%</div>
      <div className="col-span-2 text-purple-400">{memory} MB</div>
      <div className="col-span-1">
        <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30 text-xs">
          {status}
        </Badge>
      </div>
    </div>
  )
}

// Storage item component
function StorageItem({
  name,
  total,
  used,
  type,
}: {
  name: string
  total: number
  used: number
  type: string
}) {
  const percentage = Math.round((used / total) * 100)

  return (
    <div className="bg-slate-800/50 rounded-md p-3 border border-slate-700/50">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-slate-300">{name}</div>
        <Badge variant="outline" className="bg-slate-700/50 text-slate-300 border-slate-600/50 text-xs">
          {type}
        </Badge>
      </div>
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <div className="text-xs text-slate-500">
            {used} GB / {total} GB
          </div>
          <div className="text-xs text-slate-400">{percentage}%</div>
        </div>
        <Progress className="h-1.5 bg-slate-700" value={Math.min(100, Math.max(0, percentage))}>
          <div
            className={`h-full rounded-full ${
              percentage > 90 ? "bg-red-500" : percentage > 70 ? "bg-amber-500" : "bg-cyan-500"
            }`}
            style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
          />
        </Progress>
      </div>
      <div className="flex items-center justify-between text-xs">
        <div className="text-slate-500">可用: {total - used} GB</div>
        <Button variant="ghost" size="sm" className="h-6 text-xs px-2 text-slate-400 hover:text-slate-100">
          详情
        </Button>
      </div>
    </div>
  )
}

// Alert item component
function AlertItem({
  title,
  time,
  description,
  type,
}: {
  title: string
  time: string
  description: string
  type: "info" | "warning" | "error" | "success" | "update"
}) {
  const getTypeStyles = () => {
    switch (type) {
      case "info":
        return { icon: Info, color: "text-blue-500 bg-blue-500/10 border-blue-500/30" }
      case "warning":
        return { icon: AlertCircle, color: "text-amber-500 bg-amber-500/10 border-amber-500/30" }
      case "error":
        return { icon: AlertCircle, color: "text-red-500 bg-red-500/10 border-red-500/30" }
      case "success":
        return { icon: Check, color: "text-green-500 bg-green-500/10 border-green-500/30" }
      case "update":
        return { icon: Download, color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/30" }
      default:
        return { icon: Info, color: "text-blue-500 bg-blue-500/10 border-blue-500/30" }
    }
  }

  const { icon: Icon, color } = getTypeStyles()

  return (
    <div className="flex items-start space-x-3">
      <div className={`mt-0.5 p-1 rounded-full ${color.split(" ")[1]} ${color.split(" ")[2]}`}>
        <Icon className={`h-3 w-3 ${color.split(" ")[0]}`} />
      </div>
      <div>
        <div className="flex items-center">
          <div className="text-sm font-medium text-slate-200">{title}</div>
          <div className="ml-2 text-xs text-slate-500">{time}</div>
        </div>
        <div className="text-xs text-slate-400">{description}</div>
      </div>
    </div>
  )
}

// Communication item component
function CommunicationItem({
  sender,
  time,
  message,
  avatar,
  unread,
}: {
  sender: string
  time: string
  message: string
  avatar: string
  unread?: boolean
}) {
  return (
    <div className={`flex space-x-3 p-2 rounded-md ${unread ? "bg-slate-800/50 border border-slate-700/50" : ""}`}>
      <Avatar className="h-8 w-8">
        <AvatarImage src={avatar || "/placeholder.svg"} alt={sender} />
        <AvatarFallback className="bg-slate-700 text-cyan-500">{sender.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-slate-200">{sender}</div>
          <div className="text-xs text-slate-500">{time}</div>
        </div>
        <div className="text-xs text-slate-400 mt-1">{message}</div>
      </div>
      {unread && (
        <div className="flex-shrink-0 self-center">
          <div className="h-2 w-2 rounded-full bg-cyan-500"></div>
        </div>
      )}
    </div>
  )
}

// Action button component
function ActionButton({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <Button
      variant="outline"
      className="h-auto py-3 px-3 border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 flex flex-col items-center justify-center space-y-1 w-full"
    >
      <Icon className="h-5 w-5 text-cyan-500" />
      <span className="text-xs">{label}</span>
    </Button>
  )
}
