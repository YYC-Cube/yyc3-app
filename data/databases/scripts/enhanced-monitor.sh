#!/bin/bash
# === 脚本健康检查头 ===
set -euo pipefail  # 严格模式
trap "cleanup" EXIT INT TERM

# === 配置参数 ===
REDIS_HOST="${REDIS_HOST:-localhost}"
REDIS_PORT="${REDIS_PORT:-6379}"
REDIS_PASSWORD="${REDIS_PASSWORD:-redis_yyc3}"
CHECK_INTERVAL="${CHECK_INTERVAL:-30}"  # 检查间隔（秒）
LOG_FILE="${LOG_FILE:-/tmp/redis-monitor.log}"
ALERT_THRESHOLD="${ALERT_THRESHOLD:-80}"  # 内存使用告警阈值（百分比）
ENABLE_ALERTS="${ENABLE_ALERTS:-false}"  # 是否启用告警

# === 颜色定义 ===
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# === 函数定义 ===
log() {
  local level="$1"
  local message="$2"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  
  echo -e "${timestamp} [${level}] ${message}"
  echo "${timestamp} [${level}] ${message}" >> "$LOG_FILE"
}

alert() {
  local message="$1"
  
  if [ "$ENABLE_ALERTS" = "true" ]; then
    log "ALERT" "${RED}${message}${NC}"
    # 这里可以添加更多告警渠道，如邮件、Slack等
    # echo "$message" | mail -s "Redis Alert" admin@example.com
  else
    log "WARNING" "${YELLOW}${message}${NC}"
  fi
}

check_memory_usage() {
  local info=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" info memory 2>/dev/null)
  
  if [ $? -ne 0 ]; then
    alert "无法连接到Redis服务器进行内存检查"
    return 1
  fi
  
  local used_memory_human=$(echo "$info" | grep used_memory_human | cut -d':' -f2 | tr -d ' \t\r\n')
  local used_memory_rss_human=$(echo "$info" | grep used_memory_rss_human | cut -d':' -f2 | tr -d ' \t\r\n')
  local used_memory_perc=$(echo "$info" | grep mem_fragmentation_ratio | cut -d':' -f2 | tr -d ' \t\r\n')
  
  # 获取最大内存和使用百分比
  local maxmemory=$(echo "$info" | grep maxmemory | cut -d':' -f2 | tr -d ' \t\r\n')
  local used_memory=$(echo "$info" | grep used_memory | grep -v "human\|rss" | cut -d':' -f2 | tr -d ' \t\r\n')
  
  local memory_percent=0
  if [ "$maxmemory" -gt 0 ]; then
    memory_percent=$(echo "scale=2; $used_memory * 100 / $maxmemory" | bc)
    memory_percent_int=$(echo "$memory_percent" | cut -d'.' -f1)
    
    if [ "$memory_percent_int" -ge "$ALERT_THRESHOLD" ]; then
      alert "内存使用过高: ${memory_percent}% (${used_memory_human})"
    else
      log "INFO" "内存使用: ${memory_percent}% (${used_memory_human}) RSS: ${used_memory_rss_human}"
    fi
  else
    log "INFO" "内存使用: ${used_memory_human} RSS: ${used_memory_rss_human} (未设置maxmemory)"
  fi
}

check_connection_count() {
  local info=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" info clients 2>/dev/null)
  
  if [ $? -ne 0 ]; then
    alert "无法连接到Redis服务器进行连接数检查"
    return 1
  fi
  
  local connected_clients=$(echo "$info" | grep connected_clients | cut -d':' -f2 | tr -d ' \t\r\n')
  local blocked_clients=$(echo "$info" | grep blocked_clients | cut -d':' -f2 | tr -d ' \t\r\n')
  local maxclients=$(echo "$info" | grep maxclients | cut -d':' -f2 | tr -d ' \t\r\n')
  
  # 计算连接数百分比
  local connection_percent=0
  if [ "$maxclients" -gt 0 ]; then
    connection_percent=$(echo "scale=2; $connected_clients * 100 / $maxclients" | bc)
    connection_percent_int=$(echo "$connection_percent" | cut -d'.' -f1)
    
    if [ "$connection_percent_int" -ge "$ALERT_THRESHOLD" ]; then
      alert "客户端连接数过高: ${connected_clients}/${maxclients} (${connection_percent}%)"
    else
      log "INFO" "客户端连接: ${connected_clients}/${maxclients} (${connection_percent}%), 阻塞连接: ${blocked_clients}"
    fi
  else
    log "INFO" "客户端连接: ${connected_clients}, 阻塞连接: ${blocked_clients}"
  fi
}

check_commands_stats() {
  local info=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" info stats 2>/dev/null)
  
  if [ $? -ne 0 ]; then
    alert "无法连接到Redis服务器进行命令统计检查"
    return 1
  fi
  
  local total_commands_processed=$(echo "$info" | grep total_commands_processed | cut -d':' -f2 | tr -d ' \t\r\n')
  local instantaneous_ops_per_sec=$(echo "$info" | grep instantaneous_ops_per_sec | cut -d':' -f2 | tr -d ' \t\r\n')
  
  log "INFO" "命令处理: ${total_commands_processed} 总命令, ${instantaneous_ops_per_sec} ops/sec"
}

check_health() {
  # 基本连通性检查
  if ! redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" ping >/dev/null 2>&1; then
    alert "Redis服务不可用！无法ping通服务器"
    return 1
  fi
  
  # 使用之前的深度健康检查逻辑
  local result=$(bash "$(dirname "$0")/health-keys.sh" 2>/dev/null)
  if [ $? -ne 0 ]; then
    alert "Redis深度健康检查失败: $result"
    return 1
  fi
  
  log "INFO" "${GREEN}Redis服务健康检查通过${NC}"
  return 0
}

check_persistence() {
  local info=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" info persistence 2>/dev/null)
  
  if [ $? -ne 0 ]; then
    alert "无法连接到Redis服务器进行持久化检查"
    return 1
  fi
  
  local rdb_last_bgsave_status=$(echo "$info" | grep rdb_last_bgsave_status | cut -d':' -f2 | tr -d ' \t\r\n')
  local aof_enabled=$(echo "$info" | grep aof_enabled | cut -d':' -f2 | tr -d ' \t\r\n')
  local aof_last_bgrewrite_status=""
  local aof_last_write_status=""
  
  if [ "$aof_enabled" -eq 1 ]; then
    aof_last_bgrewrite_status=$(echo "$info" | grep aof_last_bgrewrite_status | cut -d':' -f2 | tr -d ' \t\r\n')
    aof_last_write_status=$(echo "$info" | grep aof_last_write_status | cut -d':' -f2 | tr -d ' \t\r\n')
  fi
  
  if [ "$rdb_last_bgsave_status" != "ok" ]; then
    alert "RDB持久化失败: $rdb_last_bgsave_status"
  else
    log "INFO" "RDB持久化状态: OK"
  fi
  
  if [ "$aof_enabled" -eq 1 ]; then
    if [ "$aof_last_write_status" != "ok" ]; then
      alert "AOF写入失败: $aof_last_write_status"
    elif [ "$aof_last_bgrewrite_status" != "ok" ]; then
      alert "AOF重写失败: $aof_last_bgrewrite_status"
    else
      log "INFO" "AOF持久化状态: OK (已启用)"
    fi
  else
    log "INFO" "AOF持久化: 未启用"
  fi
}

check_keyspace() {
  local info=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" info keyspace 2>/dev/null)
  
  if [ $? -ne 0 ]; then
    alert "无法连接到Redis服务器进行键空间检查"
    return 1
  fi
  
  local db_info=$(echo "$info" | grep -v "^#")
  if [ -z "$db_info" ]; then
    log "INFO" "键空间: 无数据库信息"
  else
    log "INFO" "键空间信息:\n$db_info"
  fi
}

perform_full_check() {
  log "INFO" "${BLUE}开始执行完整监控检查...${NC}"
  
  # 1. 基本健康检查
  check_health
  
  # 2. 内存使用检查
  check_memory_usage
  
  # 3. 连接数检查
  check_connection_count
  
  # 4. 命令处理统计
  check_commands_stats
  
  # 5. 持久化状态检查
  check_persistence
  
  # 6. 键空间信息
  check_keyspace
  
  log "INFO" "${BLUE}监控检查完成${NC}"
  echo ""
}

cleanup() {
  log "INFO" "监控服务已停止"
}

# === 主程序 ===
echo -e "${GREEN}Redis增强监控服务已启动${NC}"
echo -e "监控目标: ${REDIS_HOST}:${REDIS_PORT}"
echo -e "检查间隔: ${CHECK_INTERVAL}秒"
echo -e "日志文件: ${LOG_FILE}"
echo -e "告警阈值: ${ALERT_THRESHOLD}%"
echo -e "告警功能: ${ENABLE_ALERTS}"
echo ""

log "INFO" "监控服务已启动"

# 执行初始检查
perform_full_check

# 循环监控
while true; do
  sleep "$CHECK_INTERVAL"
  perform_full_check
done
