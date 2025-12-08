"use client"

import { Shield, Lock, AlertTriangle, CheckCircle, XCircle, Activity } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

export default function SecurityPage() {
  const threats = [
    { type: "端口扫描", source: "192.168.1.45", time: "14:32:12", severity: "中等", status: "已阻止" },
    { type: "暴力破解", source: "10.0.0.123", time: "13:45:06", severity: "高", status: "已阻止" },
    { type: "SQL注入尝试", source: "172.16.0.88", time: "12:18:33", severity: "高", status: "已阻止" },
    { type: "DDoS攻击", source: "203.0.113.0", time: "09:22:15", severity: "严重", status: "已阻止" },
  ]

  const securityModules = [
    { name: "防火墙", status: "已启用", health: 98 },
    { name: "入侵检测", status: "已启用", health: 95 },
    { name: "数据加密", status: "已启用", health: 100 },
    { name: "访问控制", status: "已启用", health: 92 },
    { name: "威胁情报", status: "已启用", health: 88 },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-slate-900 text-slate-100 p-6">
      <div className="container mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              安全防护
            </h1>
            <p className="text-slate-400 mt-1">实时监控和防御安全威胁</p>
          </div>
          <Link href="/">
            <Button variant="outline" className="border-slate-700 text-slate-300 bg-transparent">
              返回仪表板
            </Button>
          </Link>
        </div>

        {/* Security Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">安全等级</p>
                  <p className="text-2xl font-bold text-green-400">75%</p>
                </div>
                <Shield className="h-8 w-8 text-green-500" />
              </div>
              <Progress value={75} className="mt-3 h-2 bg-slate-700" />
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">已阻止威胁</p>
                  <p className="text-2xl font-bold text-cyan-400">1,245</p>
                </div>
                <XCircle className="h-8 w-8 text-cyan-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">活跃规则</p>
                  <p className="text-2xl font-bold text-purple-400">342</p>
                </div>
                <Lock className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">扫描次数</p>
                  <p className="text-2xl font-bold text-blue-400">24</p>
                </div>
                <Activity className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Security Modules */}
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5 text-green-500" />
                安全模块
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityModules.map((module, index) => (
                  <div key={index} className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="font-semibold text-slate-100">{module.name}</span>
                      </div>
                      <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                        {module.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">健康度</span>
                      <span className="text-sm text-cyan-400">{module.health}%</span>
                    </div>
                    <Progress value={module.health} className="mt-2 h-1.5 bg-slate-700" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Threat Log */}
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
                威胁日志
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList className="bg-slate-800/50 mb-4">
                  <TabsTrigger value="all">全部</TabsTrigger>
                  <TabsTrigger value="high">高危</TabsTrigger>
                  <TabsTrigger value="blocked">已阻止</TabsTrigger>
                </TabsList>

                <TabsContent value="all">
                  <div className="space-y-3">
                    {threats.map((threat, index) => (
                      <div key={index} className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-slate-100">{threat.type}</span>
                          <Badge
                            variant="outline"
                            className={
                              threat.severity === "严重"
                                ? "bg-red-500/10 text-red-400 border-red-500/30"
                                : threat.severity === "高"
                                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                  : "bg-blue-500/10 text-blue-400 border-blue-500/30"
                            }
                          >
                            {threat.severity}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">{threat.source}</span>
                          <span className="text-slate-500">{threat.time}</span>
                        </div>
                        <div className="mt-2">
                          <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                            {threat.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="high">
                  <div className="space-y-3">
                    {threats
                      .filter((t) => t.severity === "高" || t.severity === "严重")
                      .map((threat, index) => (
                        <div key={index} className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-slate-100">{threat.type}</span>
                            <Badge
                              variant="outline"
                              className={
                                threat.severity === "严重"
                                  ? "bg-red-500/10 text-red-400 border-red-500/30"
                                  : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                              }
                            >
                              {threat.severity}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-400">{threat.source}</span>
                            <span className="text-slate-500">{threat.time}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </TabsContent>

                <TabsContent value="blocked">
                  <div className="space-y-3">
                    {threats.map((threat, index) => (
                      <div key={index} className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-100">{threat.type}</span>
                          <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                            {threat.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
