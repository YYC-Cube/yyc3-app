#!/bin/bash
# === RabbitMQ健康检查脚本 ===
set -euo pipefail  # 严格模式
trap "cleanup" EXIT INT TERM

# 脚本配置
RABBITMQ_HOST=${RABBITMQ_HOST:-localhost}
RABBITMQ_PORT=${RABBITMQ_PORT:-5672}
RABBITMQ_MANAGEMENT_PORT=${RABBITMQ_MANAGEMENT_PORT:-15672}
RABBITMQ_USER=${RABBITMQ_USER:-admin}
RABBITMQ_PASSWORD=${RABBITMQ_PASSWORD:-password}
TIMEOUT=${TIMEOUT:-10}
LOG_FILE=${LOG_FILE:-/var/log/rabbitmq/healthcheck.log}

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 清理函数
cleanup() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') - 健康检查脚本执行完毕" >> "$LOG_FILE"
}

# 日志函数
log() {
  local level="$1"
  local message="$2"
  local timestamp="$(date '+%Y-%m-%d %H:%M:%S')"
  
  echo -e "$timestamp - [$level] $message"
  echo "$timestamp - [$level] $message" >> "$LOG_FILE"
}

# 检查端口是否开放
check_port() {
  local host="$1"
  local port="$2"
  local timeout="$3"
  
  nc -z -v -w "$timeout" "$host" "$port" 2>&1 > /dev/null
  return $?
}

# 检查RabbitMQ连接状态
check_rabbitmq_connection() {
  log "INFO" "检查RabbitMQ AMQP连接..."
  
  if check_port "$RABBITMQ_HOST" "$RABBITMQ_PORT" "$TIMEOUT"; then
    log "INFO" "${GREEN}RabbitMQ AMQP端口($RABBITMQ_PORT)已开放${NC}"
    return 0
  else
    log "ERROR" "${RED}RabbitMQ AMQP端口($RABBITMQ_PORT)未开放${NC}"
    return 1
  fi
}

# 检查RabbitMQ管理界面
check_rabbitmq_management() {
  log "INFO" "检查RabbitMQ管理界面..."
  
  if check_port "$RABBITMQ_HOST" "$RABBITMQ_MANAGEMENT_PORT" "$TIMEOUT"; then
    log "INFO" "${GREEN}RabbitMQ管理界面端口($RABBITMQ_MANAGEMENT_PORT)已开放${NC}"
    return 0
  else
    log "ERROR" "${RED}RabbitMQ管理界面端口($RABBITMQ_MANAGEMENT_PORT)未开放${NC}"
    return 1
  fi
}

# 检查RabbitMQ服务状态
check_rabbitmq_status() {
  log "INFO" "检查RabbitMQ服务状态..."
  
  local status
  status=$(curl -s -u "$RABBITMQ_USER:$RABBITMQ_PASSWORD" "http://$RABBITMQ_HOST:$RABBITMQ_MANAGEMENT_PORT/api/healthchecks/node" 2>/dev/null)
  
  if [ $? -ne 0 ]; then
    log "ERROR" "${RED}无法连接到RabbitMQ管理API${NC}"
    return 1
  fi
  
  local status_result
  status_result=$(echo "$status" | grep -o '"status":"[^"]*"' | cut -d':' -f2 | tr -d '"')
  
  if [ "$status_result" = "ok" ]; then
    log "INFO" "${GREEN}RabbitMQ服务状态正常${NC}"
    return 0
  else
    log "ERROR" "${RED}RabbitMQ服务状态异常: $status_result${NC}"
    return 1
  fi
}

# 检查RabbitMQ队列状态
check_rabbitmq_queues() {
  log "INFO" "检查RabbitMQ队列状态..."
  
  local queues
  queues=$(curl -s -u "$RABBITMQ_USER:$RABBITMQ_PASSWORD" "http://$RABBITMQ_HOST:$RABBITMQ_MANAGEMENT_PORT/api/queues" 2>/dev/null)
  
  if [ $? -ne 0 ]; then
    log "ERROR" "${RED}无法获取RabbitMQ队列信息${NC}"
    return 1
  fi
  
  local queue_count
  queue_count=$(echo "$queues" | jq -r '. | length')
  
  if [ "$queue_count" -gt 0 ]; then
    log "INFO" "${GREEN}共找到 $queue_count 个队列${NC}"
    
    # 检查是否有队列存在警告或错误
    local has_errors
    has_errors=$(echo "$queues" | jq -r '.[] | select(.messages_ready > 1000 or .messages_unacknowledged > 1000) | .name')
    
    if [ -n "$has_errors" ]; then
      log "WARNING" "${YELLOW}以下队列可能存在问题:${NC}"
      echo "$has_errors" | while read -r queue_name; do
        log "WARNING" "  - $queue_name"
      done
      return 1
    fi
    
    return 0
  else
    log "WARNING" "${YELLOW}未找到队列${NC}"
    return 0
  fi
}

# 检查RabbitMQ交换器状态
check_rabbitmq_exchanges() {
  log "INFO" "检查RabbitMQ交换器状态..."
  
  local exchanges
  exchanges=$(curl -s -u "$RABBITMQ_USER:$RABBITMQ_PASSWORD" "http://$RABBITMQ_HOST:$RABBITMQ_MANAGEMENT_PORT/api/exchanges" 2>/dev/null)
  
  if [ $? -ne 0 ]; then
    log "ERROR" "${RED}无法获取RabbitMQ交换器信息${NC}"
    return 1
  fi
  
  local exchange_count
  exchange_count=$(echo "$exchanges" | jq -r '. | length')
  
  if [ "$exchange_count" -gt 0 ]; then
    log "INFO" "${GREEN}共找到 $exchange_count 个交换器${NC}"
    return 0
  else
    log "WARNING" "${YELLOW}未找到交换器${NC}"
    return 0
  fi
}

# 主函数
main() {
  log "INFO" "开始RabbitMQ健康检查..."
  
  local overall_status=0
  
  # 执行各项检查
  check_rabbitmq_connection || overall_status=1
  check_rabbitmq_management || overall_status=1
  check_rabbitmq_status || overall_status=1
  check_rabbitmq_queues || overall_status=1
  check_rabbitmq_exchanges || overall_status=1
  
  if [ "$overall_status" -eq 0 ]; then
    log "INFO" "${GREEN}所有健康检查通过，RabbitMQ服务状态正常${NC}"
    exit 0
  else
    log "ERROR" "${RED}部分健康检查未通过，RabbitMQ服务可能存在问题${NC}"
    exit 1
  fi
}

# 执行主函数
main
