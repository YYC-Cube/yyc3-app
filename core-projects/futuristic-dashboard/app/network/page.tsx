"use client"

import { useState, useEffect } from "react"
import { Globe, Wifi, Activity, TrendingUp, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"

export default function NetworkPage() {
  const [bandwidth, setBandwidth] = useState(84)
  const [latency, setLatency] = useState(42)

  useEffect(() => {
    const interval = setInterval(() => {
      setBandwidth(Math.floor(Math.random() * 20) + 75)
      setLatency(Math.floor(Math.random() * 30) + 30)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const networkDevices = [
    { name: "主路由器", ip: "192.168.1.1", status: "在线", traffic: 245 },
    { name: "交换机 A", ip: "192.168.1.10", status: "在线", traffic: 189 },
    { name: "交换机 B", ip: "192.168.1.11", status: "在线", traffic: 156 },
    { name: "防火墙", ip: "192.168.1.2", status: "在线", traffic: 98 },
    { name: "负载均衡器", ip: "192.168.1.20", status: "在线", traffic: 312 },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-slate-900 text-slate-100 p-6">
      <div className="container mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              网络监控
            </h1>
            <p className="text-slate-400 mt-1">实时监控网络状态和流量</p>
          </div>
          <Link href="/">
            <Button variant="outline" className="border-slate-700 text-slate-300 bg-transparent">
              返回仪表板
            </Button>
          </Link>
        </div>

        {/* Network Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">带宽使用</p>
                  <p className="text-2xl font-bold text-cyan-400">{bandwidth}%</p>
                </div>
                <Wifi className="h-8 w-8 text-cyan-500" />
              </div>
              <Progress value={bandwidth} className="mt-3 h-2 bg-slate-700" />
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">延迟</p>
                  <p className="text-2xl font-bold text-purple-400">{latency}ms</p>
                </div>
                <Activity className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">上行速率</p>
                  <p className="text-2xl font-bold text-blue-400">1.2 GB/s</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">在线设备</p>
                  <p className="text-2xl font-bold text-green-400">5</p>
                </div>
                <Globe className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Network Devices */}
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="mr-2 h-5 w-5 text-cyan-500" />
              网络设备
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {networkDevices.map((device, index) => (
                <div
                  key={index}
                  className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50 hover:border-cyan-500/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-slate-700/50 p-3 rounded-lg">
                        <Wifi className="h-6 w-6 text-cyan-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-100">{device.name}</h3>
                        <p className="text-sm text-slate-400">{device.ip}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <p className="text-sm text-slate-400">流量</p>
                        <p className="font-semibold text-slate-200">{device.traffic} MB/s</p>
                      </div>
                      <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {device.status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        详情
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
