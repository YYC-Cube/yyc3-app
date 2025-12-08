import { ChartsDashboard } from "@/components/charts/charts-dashboard"
import { AuthGuard } from "@/components/auth/auth-guard"

export default function AnalyticsPage() {
  return (
    <AuthGuard requiredPermission="view:analytics">
      <div className="min-h-screen bg-gradient-to-br from-black to-slate-900 text-slate-100 p-6">
        <div className="container mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
              数据分析中心
            </h1>
            <p className="text-slate-400">深度分析系统性能指标与趋势</p>
          </div>
          <ChartsDashboard />
        </div>
      </div>
    </AuthGuard>
  )
}
