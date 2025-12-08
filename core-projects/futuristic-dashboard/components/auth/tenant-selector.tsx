"use client"

import { useState } from "react"
import { Building2, Check, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import type { Tenant } from "@/lib/auth/types"

export function TenantSelector() {
  const [selectedTenant, setSelectedTenant] = useState<Tenant>({
    id: "tenant-001",
    name: "示例企业",
    domain: "example.com",
    plan: "enterprise",
    status: "active",
    createdAt: new Date(),
    settings: {
      maxUsers: 100,
      features: ["ai-analysis", "advanced-analytics"],
    },
  })

  // 模拟多个租户
  const tenants: Tenant[] = [
    selectedTenant,
    {
      id: "tenant-002",
      name: "测试公司",
      domain: "test.com",
      plan: "pro",
      status: "active",
      createdAt: new Date(),
      settings: {
        maxUsers: 50,
        features: ["basic-analytics"],
      },
    },
    {
      id: "tenant-003",
      name: "演示组织",
      domain: "demo.com",
      plan: "free",
      status: "trial",
      createdAt: new Date(),
      settings: {
        maxUsers: 10,
        features: [],
      },
    },
  ]

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case "enterprise":
        return "bg-purple-500/20 text-purple-400 border-purple-500/50"
      case "pro":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50"
      case "free":
        return "bg-slate-500/20 text-slate-400 border-slate-500/50"
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/50"
    }
  }

  const getPlanLabel = (plan: string) => {
    const labels: Record<string, string> = {
      enterprise: "企业版",
      pro: "专业版",
      free: "免费版",
    }
    return labels[plan] || plan
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 justify-between min-w-[200px]"
        >
          <div className="flex items-center">
            <Building2 className="mr-2 h-4 w-4 text-cyan-500" />
            <span className="text-sm">{selectedTenant.name}</span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 text-slate-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="bg-slate-800 border-slate-700 min-w-[250px]">
        {tenants.map((tenant) => (
          <DropdownMenuItem
            key={tenant.id}
            onClick={() => setSelectedTenant(tenant)}
            className="text-slate-200 focus:bg-slate-700 focus:text-slate-100 cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-cyan-500" />
                <div>
                  <div className="text-sm font-medium">{tenant.name}</div>
                  <div className="text-xs text-slate-400">{tenant.domain}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className={getPlanBadgeColor(tenant.plan)}>
                  {getPlanLabel(tenant.plan)}
                </Badge>
                {selectedTenant.id === tenant.id && <Check className="h-4 w-4 text-cyan-400" />}
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
