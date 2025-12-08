"use client"

import { useState } from "react"
import { Database, Server, Activity, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function DataCenterPage() {
  const [databases] = useState([
    { name: "主数据库", type: "PostgreSQL", size: 245, status: "运行中", connections: 142 },
    { name: "缓存数据库", type: "Redis", size: 12, status: "运行中", connections: 89 },
    { name: "分析数据库", type: "MongoDB", size: 512, status: "运行中", connections: 34 },
    { name: "备份数据库", type: "PostgreSQL", size: 245, status: "待机", connections: 0 },
  ])

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-slate-900 text-slate-100 p-6">
      <div className="container mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              数据中心
            </h1>
            <p className="text-slate-400 mt-1">管理和监控所有数据库实例</p>
          </div>
          <Link href="/">
            <Button variant="outline" className="border-slate-700 text-slate-300 bg-transparent">
              返回仪表板
            </Button>
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">总存储</p>
                  <p className="text-2xl font-bold text-cyan-400">1.2 TB</p>
                </div>
                <Database className="h-8 w-8 text-cyan-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">活跃连接</p>
                  <p className="text-2xl font-bold text-purple-400">265</p>
                </div>
                <Activity className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">查询/秒</p>
                  <p className="text-2xl font-bold text-blue-400">1,245</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">数据库实例</p>
                  <p className="text-2xl font-bold text-green-400">4</p>
                </div>
                <Server className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Database List */}
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="mr-2 h-5 w-5 text-cyan-500" />
              数据库实例
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="bg-slate-800/50 mb-4">
                <TabsTrigger value="all">全部</TabsTrigger>
                <TabsTrigger value="running">运行中</TabsTrigger>
                <TabsTrigger value="standby">待机</TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <div className="space-y-4">
                  {databases.map((db, index) => (
                    <div
                      key={index}
                      className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50 hover:border-cyan-500/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="bg-slate-700/50 p-3 rounded-lg">
                            <Database className="h-6 w-6 text-cyan-500" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-100">{db.name}</h3>
                            <p className="text-sm text-slate-400">{db.type}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-6">
                          <div className="text-right">
                            <p className="text-sm text-slate-400">存储大小</p>
                            <p className="font-semibold text-slate-200">{db.size} GB</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-slate-400">活跃连接</p>
                            <p className="font-semibold text-slate-200">{db.connections}</p>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              db.status === "运行中"
                                ? "bg-green-500/10 text-green-400 border-green-500/30"
                                : "bg-slate-500/10 text-slate-400 border-slate-500/30"
                            }
                          >
                            {db.status}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            管理
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="running">
                <div className="space-y-4">
                  {databases
                    .filter((db) => db.status === "运行中")
                    .map((db, index) => (
                      <div key={index} className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="bg-slate-700/50 p-3 rounded-lg">
                              <Database className="h-6 w-6 text-cyan-500" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-100">{db.name}</h3>
                              <p className="text-sm text-slate-400">{db.type}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                            {db.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="standby">
                <div className="space-y-4">
                  {databases
                    .filter((db) => db.status === "待机")
                    .map((db, index) => (
                      <div key={index} className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="bg-slate-700/50 p-3 rounded-lg">
                              <Database className="h-6 w-6 text-slate-500" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-100">{db.name}</h3>
                              <p className="text-sm text-slate-400">{db.type}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-slate-500/10 text-slate-400 border-slate-500/30">
                            {db.status}
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
  )
}
