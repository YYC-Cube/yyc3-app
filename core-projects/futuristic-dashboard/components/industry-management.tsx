'use client';

/**
 * @file 行业管理组件
 * @description 处理行业数据的增删改查、权限管理等功能
 * @module components/industry
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

import React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  Eye,
  PlusCircle,
  AlertCircle,
  CheckCircle,
  RefreshCw as Refresh,
} from "lucide-react"
import {
  getAllIndustries,
  getIndustryConfig,
  getIndustryHighScores,
  type IndustryType,
  type IndustryConfig,
} from "@/lib/industry-adapter"

// 行业分类类型
type IndustryCategory = "business" | "technology" | "service" | "government" | "all"

// 通知状态类型
enum NotificationStatus {
  READ = 'READ',
  UNREAD = 'UNREAD'
}

// 筛选选项接口
interface FilterOptions {
  searchTerm: string
  category: IndustryCategory
  enabledOnly: boolean
  sortBy: "name" | "code" | "performance"
  sortDirection: "asc" | "desc"
}

// 行业管理组件接口
interface IndustryManagementProps {
  onIndustrySelect?: (industry: IndustryType) => void
  onEditIndustry?: (industry: IndustryConfig) => void
  onDeleteIndustry?: (industryId: IndustryType) => void
  onViewIndustry?: (industry: IndustryConfig) => void
  onAddIndustry?: () => void
}

/**
 * 行业管理组件 - 实现行业列表展示和筛选功能
 */
// 模拟通知服务
const notificationService = {
  getNotifications: async ({ limit, status }: { limit: number; status: string }) => {
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      items: [
        {
          id: '1',
          title: '新行业数据已更新',
          message: '有5个行业的数据已完成更新',
          status: NotificationStatus.UNREAD,
          createdAt: new Date().toISOString(),
          type: 'industry_update'
        },
        {
          id: '2',
          title: '性能警报',
          message: '行业ID: TECH-001 性能下降超过20%',
          status: NotificationStatus.UNREAD,
          createdAt: new Date().toISOString(),
          type: 'performance_alert'
        }
      ]
    };
  },
  updateNotificationStatus: async (notificationId: string, status: NotificationStatus) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { success: true, notificationId, status };
  },
  markAllAsRead: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true, updatedCount: 2 };
  }
};



export function IndustryManagement({
  onIndustrySelect,
  onEditIndustry,
  onDeleteIndustry,
  onViewIndustry,
  onAddIndustry
}: IndustryManagementProps) {
  // 通知相关状态
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(false);
  const [notificationLoading, setNotificationLoading] = React.useState(false);
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [notificationSuccess, setNotificationSuccess] = React.useState<string | null>(null);
  const [notificationError, setNotificationError] = React.useState<string | null>(null);
  const [notificationStatus, setNotificationStatus] = React.useState<NotificationStatus | null>(null);
  
  // 行业相关状态
  const [industries, setIndustries] = React.useState<IndustryConfig[]>([]);
  const [filteredIndustries, setFilteredIndustries] = React.useState<IndustryConfig[]>([]);
  const [selectedIndustries, setSelectedIndustries] = React.useState<IndustryConfig[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showFilters, setShowFilters] = React.useState(false);
  const [filters, setFilters] = React.useState<FilterOptions>({
    searchTerm: "",
    category: "all",
    enabledOnly: false,
    sortBy: "name",
    sortDirection: "asc"
  });
  
  // 异步加载通知
  const loadNotifications = async () => {
    if (!notificationsEnabled) return;
    
    try {
      setNotificationLoading(true);
      const response = await notificationService.getNotifications({ limit: 10, status: NotificationStatus.UNREAD });
      setNotifications(response.items);
      setUnreadCount(response.items.filter((item: any) => item.status === NotificationStatus.UNREAD).length);
    } catch (err) {
      console.error('加载通知失败:', err);
    } finally {
      setNotificationLoading(false);
    }
  };
  
  // 处理通知状态更新
  const handleNotificationUpdate = async (notificationId: string, status: NotificationStatus) => {
    try {
      await notificationService.updateNotificationStatus(notificationId, status);
      setNotifications(prev => prev.map(notification => 
        notification.id === notificationId ? { ...notification, status } : notification
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('更新通知状态失败:', err);
    }
  };
  
  // 切换通知功能
  const toggleNotifications = () => {
    setNotificationsEnabled(prev => !prev);
    if (!notificationsEnabled) {
      loadNotifications();
    }
  };
  
  // 确保所有JSX表达式都有父元素包裹
  return (
    <div className="space-y-4">
      {/* 通知相关UI - 使用正确的Badge组件 */}
      <div className="flex items-center justify-between">
        <h2>行业管理</h2>
        <div className="flex items-center space-x-2">
          <button onClick={toggleNotifications} className="flex items-center">
            通知
            {unreadCount > 0 && (
              <Badge className="ml-1 bg-red-500">{unreadCount.toString()}</Badge>
            )}
          </button>
          <button onClick={async () => {
            try {
              await notificationService.markAllAsRead();
              setUnreadCount(0);
              setNotifications(prev => prev.map(n => ({ ...n, status: NotificationStatus.READ })));
            } catch (err) {
              console.error('标记所有通知为已读失败:', err);
            }
          }}>
            全部已读
          </button>
        </div>
      </div>
      
      {/* 筛选和操作区域 - 使用正确的Badge组件 */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              type="search"
              placeholder="搜索行业..."
              className="w-[200px] pl-8 lg:w-[300px]"
              value={filters.searchTerm}
              onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
            />
          </div>
          <Popover open={showFilters} onOpenChange={setShowFilters}>
            <PopoverTrigger asChild>
              <Button variant="secondary" size="sm" className="gap-1">
                <Filter className="h-4 w-4" />
                筛选
                {showFilters && <Badge variant="outline" className="ml-2">已启用</Badge>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px]">
              <div className="space-y-2">
                <div className="space-y-1">
                  <label htmlFor="category" className="text-sm font-medium">
                    行业分类
                  </label>
                  <Select
                    value={filters.category}
                    onValueChange={(value) =>
                      setFilters({ ...filters, category: value as IndustryCategory })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择分类" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部</SelectItem>
                      <SelectItem value="business">商业</SelectItem>
                      <SelectItem value="technology">科技</SelectItem>
                      <SelectItem value="service">服务</SelectItem>
                      <SelectItem value="government">政府</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label htmlFor="sortBy" className="text-sm font-medium">
                    排序方式
                  </label>
                  <Select value={filters.sortBy} onValueChange={(value) =>
                    setFilters({ ...filters, sortBy: value as "name" | "code" | "performance" })
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="排序方式" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">名称</SelectItem>
                      <SelectItem value="code">代码</SelectItem>
                      <SelectItem value="performance">绩效</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">仅显示启用项</label>
                  <Checkbox
                    checked={filters.enabledOnly}
                    onCheckedChange={(checked) =>
                      setFilters({ ...filters, enabledOnly: Boolean(checked) })
                    }
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
          {filters.sortBy === "performance" && (
            <Badge variant="outline" className="border-blue-500 bg-blue-950/50 text-blue-400">绩效</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="gap-1"
            onClick={() => setSelectedIndustries([])}
            disabled={selectedIndustries.length === 0}
          >
            取消选择
          </Button>
          <Button size="sm" className="gap-1" onClick={onAddIndustry}>
            <PlusCircle className="h-4 w-4" />
            添加行业
          </Button>
        </div>
      </div>
      

      
      {/* 表格内容 */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={
                      industries.length > 0 && selectedIndustries.length === industries.length
                    }
                    onCheckedChange={(checked) =>
                      setSelectedIndustries(checked ? industries : [])
                    }
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>
                  名称
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() =>
                      setFilters({
                        ...filters,
                        sortBy: "name",
                        sortDirection: filters.sortDirection === "asc" ? "desc" : "asc",
                      })
                    }
                  >
                    {filters.sortBy === "name" ? (
                      filters.sortDirection === "asc" ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )
                    ) : null}
                  </Button>
                </TableHead>
                <TableHead>代码</TableHead>
                <TableHead>分类</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // 加载状态占位符
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Checkbox aria-label={`Select industry ${index + 1}`} />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-[150px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-[100px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-[80px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-[60px]" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-[120px]" />
                    </TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-[200px] text-center">
                    <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
                    <p className="mt-2 text-sm text-red-500">{error}</p>
                  </TableCell>
                </TableRow>
              ) : filteredIndustries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-[200px] text-center">
                    <Search className="mx-auto h-8 w-8 text-slate-400" />
                    <p className="mt-2 text-sm text-slate-500">没有找到匹配的行业</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredIndustries.map((industry) => (
                  <TableRow key={industry.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIndustries.some((i) => i.id === industry.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedIndustries((prev) => [...prev, industry]);
                          } else {
                            setSelectedIndustries((prev) =>
                              prev.filter((i) => i.id !== industry.id)
                            );
                          }
                        }}
                        aria-label={`Select ${industry.name}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{industry.name}</TableCell>
                    <TableCell>{industry.code}</TableCell>
                    <TableCell>
                      <Badge className="ml-1" variant={industry.code === 'GOV' ? 'secondary' : 'default'}>
                        {industry.code === 'GOV' ? '政府' : 
                         industry.code === 'AGR' ? '农业' :
                         industry.code === 'FB' ? '餐饮' :
                         industry.code === 'FN' ? '金融' :
                         industry.code === 'MED' ? '医疗' : '其他'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={(industry as any).enabled || true
                          ? "border-green-500 bg-green-950/50 text-green-400"
                          : "border-red-500 bg-red-950/50 text-red-400"
                        }
                      >
                        {(industry as any).enabled || true ? "启用" : "禁用"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => onViewIndustry?.(industry)}
                          aria-label={`View ${industry.name}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => onEditIndustry?.(industry)}
                          aria-label={`Edit ${industry.name}`}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => onDeleteIndustry?.(industry.id as IndustryType)}
                          aria-label={`Delete ${industry.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        {!loading && industries.length > 0 && (
          <CardFooter className="justify-between border-t px-6 py-4">
            <div className="text-sm text-slate-500">
              显示 {filteredIndustries.length} / {industries.length} 个行业
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={loadNotifications} disabled={notificationLoading}>
                {notificationLoading ? (
                  <Refresh className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                刷新数据
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
      
      {/* 通知成功/错误提示 */}
      {(notificationSuccess || notificationError) && (
        <div className="flex items-center justify-between p-4 rounded-md shadow-sm text-sm">
          {notificationSuccess && (
            <div className="flex items-center text-green-600">
              <CheckCircle className="mr-2 h-4 w-4" />
              <span>{notificationSuccess}</span>
            </div>
          )}
          {notificationError && (
            <div className="flex items-center text-red-600">
              <AlertCircle className="mr-2 h-4 w-4" />
              <span>{notificationError}</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => {
              setNotificationSuccess(null);
              setNotificationError(null);
            }}
          >
            ✕
          </Button>
        </div>
      )}
    </div>
  );
}