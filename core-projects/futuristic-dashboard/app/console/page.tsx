"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Terminal, Send, Trash2, Download } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default function ConsolePage() {
  const [commands, setCommands] = useState<Array<{ input: string; output: string; timestamp: string }>>([
    {
      input: "system status",
      output: "系统运行正常\nCPU: 42% | 内存: 68% | 网络: 92%",
      timestamp: new Date().toLocaleTimeString("zh-CN"),
    },
  ])
  const [currentCommand, setCurrentCommand] = useState("")
  const consoleEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [commands])

  const executeCommand = () => {
    if (!currentCommand.trim()) return

    const timestamp = new Date().toLocaleTimeString("zh-CN")
    let output = ""

    // 模拟命令执行
    switch (currentCommand.toLowerCase().trim()) {
      case "help":
        output = `可用命令:
- system status: 查看系统状态
- network info: 查看网络信息
- security scan: 执行安全扫描
- clear: 清空控制台
- help: 显示帮助信息`
        break
      case "system status":
        output = `系统运行正常
CPU: ${Math.floor(Math.random() * 30) + 30}%
内存: ${Math.floor(Math.random() * 20) + 60}%
网络: ${Math.floor(Math.random() * 15) + 80}%
运行时间: 14天 06:42:18`
        break
      case "network info":
        output = `网络配置信息:
IP地址: 192.168.1.100
子网掩码: 255.255.255.0
网关: 192.168.1.1
DNS: 8.8.8.8, 8.8.4.4
带宽: 1000 Mbps
延迟: ${Math.floor(Math.random() * 30) + 30}ms`
        break
      case "security scan":
        output = `正在执行安全扫描...
[✓] 防火墙检查 - 通过
[✓] 端口扫描 - 通过
[✓] 漏洞检测 - 通过
[✓] 恶意软件扫描 - 通过
扫描完成，未发现安全威胁`
        break
      case "clear":
        setCommands([])
        setCurrentCommand("")
        return
      default:
        output = `未知命令: ${currentCommand}\n输入 'help' 查看可用命令`
    }

    setCommands([...commands, { input: currentCommand, output, timestamp }])
    setCurrentCommand("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      executeCommand()
    }
  }

  const clearConsole = () => {
    setCommands([])
  }

  const downloadLog = () => {
    const log = commands.map((cmd) => `[${cmd.timestamp}] > ${cmd.input}\n${cmd.output}`).join("\n\n")
    const blob = new Blob([log], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `console-log-${new Date().toISOString()}.txt`
    a.click()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-slate-900 text-slate-100 p-6">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              系统控制台
            </h1>
            <p className="text-slate-400 mt-1">执行系统命令和查看日志</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadLog}
              className="border-slate-700 text-slate-300 bg-transparent"
            >
              <Download className="h-4 w-4 mr-2" />
              导出日志
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearConsole}
              className="border-slate-700 text-slate-300 bg-transparent"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              清空
            </Button>
            <Link href="/">
              <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 bg-transparent">
                返回仪表板
              </Button>
            </Link>
          </div>
        </div>

        {/* Console */}
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardHeader className="border-b border-slate-700/50">
            <CardTitle className="flex items-center">
              <Terminal className="mr-2 h-5 w-5 text-cyan-500" />
              终端
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Console Output */}
            <div className="bg-black/50 p-6 font-mono text-sm h-[500px] overflow-y-auto">
              <div className="text-cyan-400 mb-4">星云操作系统 v12.4.5</div>
              <div className="text-slate-400 mb-4">输入 'help' 查看可用命令</div>

              {commands.map((cmd, index) => (
                <div key={index} className="mb-4">
                  <div className="flex items-center space-x-2 text-green-400">
                    <span className="text-slate-500">[{cmd.timestamp}]</span>
                    <span>{">"}</span>
                    <span>{cmd.input}</span>
                  </div>
                  <div className="text-slate-300 mt-1 ml-4 whitespace-pre-wrap">{cmd.output}</div>
                </div>
              ))}

              <div ref={consoleEndRef} />
            </div>

            {/* Command Input */}
            <div className="border-t border-slate-700/50 p-4 bg-slate-800/30">
              <div className="flex items-center space-x-2">
                <span className="text-green-400 font-mono">{">"}</span>
                <Input
                  value={currentCommand}
                  onChange={(e) => setCurrentCommand(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="输入命令..."
                  className="flex-1 bg-transparent border-none focus-visible:ring-0 font-mono text-slate-100"
                />
                <Button onClick={executeCommand} size="sm" className="bg-cyan-600 hover:bg-cyan-700">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Commands */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button
            variant="outline"
            onClick={() => {
              setCurrentCommand("system status")
              setTimeout(executeCommand, 100)
            }}
            className="border-slate-700 text-slate-300"
          >
            系统状态
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setCurrentCommand("network info")
              setTimeout(executeCommand, 100)
            }}
            className="border-slate-700 text-slate-300"
          >
            网络信息
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setCurrentCommand("security scan")
              setTimeout(executeCommand, 100)
            }}
            className="border-slate-700 text-slate-300"
          >
            安全扫描
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setCurrentCommand("help")
              setTimeout(executeCommand, 100)
            }}
            className="border-slate-700 text-slate-300"
          >
            帮助
          </Button>
        </div>
      </div>
    </div>
  )
}
