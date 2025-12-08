#!/bin/bash
# === 系统健康检查脚本 ===
# @description 监控API服务、Redis、数据库等核心服务的健康状态
# @author YYC
# @created 2024-10-15
# @version 1.0.0

set -euo pipefail  # 严格模式
trap "cleanup" EXIT INT TERM

# 配置变量
API_SERVICE_URL="http://localhost:3000"
REDIS_HOST="localhost"
REDIS_PORT="6380"
LOG_FILE="/Users/yanyu/www/.trae/logs/health_check.log"
ALERT_THRESHOLD=3  # 连续失败阈值

# 创建日志目录
mkdir -p "$(dirname "$LOG_FILE")"

# 清理函数
cleanup() {
  echo "[$(date "+%Y-%m-%d %H:%M:%S")] 健康检查脚本结束" >> "$LOG_FILE"
}

# 日志函数
log() {
  local level=$1
  local message=$2
  echo "[$(date "+%Y-%m-%d %H:%M:%S")] [$level] $message" >> "$LOG_FILE"
  echo "[$(date "+%Y-%m-%d %H:%M:%S")] [$level] $message"
}

# 检查系统资源
check_system_resources() {
  log "INFO" "开始检查系统资源..."
  
  # 检查内存使用情况
  local memory_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
  if [ -z "$memory_usage" ]; then
    # macOS 兼容方式
    memory_usage=$(vm_stat | grep 'Pages active' | awk '{print $3 * 4096 / (1024*1024*1024)}' | xargs printf "%.0f")
    total_memory=$(sysctl hw.memsize | awk '{print $2 / (1024*1024*1024)}' | xargs printf "%.0f")
    memory_usage=$(echo "scale=0; $memory_usage * 100 / $total_memory" | bc)
  fi
  
  log "INFO" "内存使用率: ${memory_usage}%"
  if [ "$memory_usage" -gt 85 ]; then
    log "WARNING" "内存使用率过高: ${memory_usage}%"
  fi
  
  # 检查CPU使用情况
  local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2 + $4}')
  if [ -z "$cpu_usage" ]; then
    # macOS 兼容方式
    cpu_usage=$(top -l 1 | grep "CPU usage" | awk '{print $3}' | sed 's/%//')
  fi
  
  log "INFO" "CPU使用率: ${cpu_usage}%"
  if (( $(echo "$cpu_usage > 85" | bc -l) )); then
    log "WARNING" "CPU使用率过高: ${cpu_usage}%"
  fi
  
  # 检查磁盘空间
  local disk_usage=$(df -h / | awk 'NR==2{print $5}' | sed 's/%//')
  log "INFO" "磁盘使用率: ${disk_usage}%"
  if [ "$disk_usage" -gt 85 ]; then
    log "WARNING" "磁盘空间不足: ${disk_usage}%"
  fi
}

# 检查Redis连接
check_redis() {
  log "INFO" "检查Redis连接..."
  
  if command -v redis-cli >/dev/null 2>&1; then
    if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping >/dev/null 2>&1; then
      log "INFO" "Redis连接正常"
      return 0
    else
      log "ERROR" "Redis连接失败: $REDIS_HOST:$REDIS_PORT"
      return 1
    fi
  else
    log "WARNING" "未找到redis-cli命令，跳过Redis检查"
    return 0
  fi
}

# 检查API服务
check_api_service() {
  log "INFO" "检查API服务..."
  
  if command -v curl >/dev/null 2>&1; then
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$API_SERVICE_URL/health")
    if [ "$response" -eq 200 ] || [ "$response" -eq 503 ]; then
      # 允许503状态码，表示服务启动但依赖可能有问题
      log "INFO" "API服务响应: $response"
      return 0
    else
      log "ERROR" "API服务异常: $response"
      return 1
    fi
  else
    log "WARNING" "未找到curl命令，跳过API服务检查"
    return 0
  fi
}

# 检查数据库连接
check_database() {
  log "INFO" "检查数据库连接..."
  
  # 尝试通过API服务间接检查数据库连接
  if command -v curl >/dev/null 2>&1; then
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$API_SERVICE_URL/api/info")
    if [ "$response" -eq 200 ]; then
      log "INFO" "数据库连接正常"
      return 0
    else
      log "ERROR" "数据库连接异常或API信息端点不可用"
      return 1
    fi
  else
    log "WARNING" "未找到curl命令，跳过数据库检查"
    return 0
  fi
}

# 自动修复Redis连接问题
repair_redis() {
  log "INFO" "尝试修复Redis连接问题..."
  
  # 检查Redis服务是否运行
  if command -v pgrep >/dev/null 2>&1; then
    if ! pgrep redis-server >/dev/null 2>&1; then
      log "WARNING" "Redis服务未运行，尝试启动..."
      # 这里添加启动Redis的命令，根据系统环境调整
      if [ -f "/Users/yanyu/www/redis-config/redis-server" ]; then
        /Users/yanyu/www/redis-config/redis-server /Users/yanyu/www/redis-config/config/redis.conf || log "ERROR" "Redis启动失败"
      else
        log "ERROR" "未找到Redis服务器可执行文件"
      fi
    fi
  fi
}

# 自动重启API服务
restart_api_service() {
  log "INFO" "尝试重启API服务..."
  
  # 查找并停止现有的API服务进程
  if command -v pkill >/dev/null 2>&1; then
    pkill -f "npm run dev" || true
    sleep 2
  fi
  
  # 启动API服务
  log "INFO" "启动API服务..."
  cd /Users/yanyu/www/api-service && npm run dev > /dev/null 2>&1 &
  log "INFO" "API服务重启命令已执行"
}

# 主检查函数
run_health_check() {
  log "INFO" "========== 开始系统健康检查 =========="
  
  # 重置失败计数器
  local redis_failures=0
  local api_failures=0
  local db_failures=0
  
  # 检查系统资源
  check_system_resources
  
  # 检查核心服务
  check_redis || redis_failures=$((redis_failures + 1))
  check_api_service || api_failures=$((api_failures + 1))
  check_database || db_failures=$((db_failures + 1))
  
  # 尝试自动修复
  if [ "$redis_failures" -gt 0 ]; then
    repair_redis
    # 再次检查
    sleep 3
    check_redis
  fi
  
  if [ "$api_failures" -gt 0 ]; then
    restart_api_service
    # 等待服务启动
    sleep 5
    check_api_service
  fi
  
  log "INFO" "========== 健康检查完成 =========="
}

# 执行检查
run_health_check
