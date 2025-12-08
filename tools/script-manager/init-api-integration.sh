#!/bin/bash

# === 脚本健康检查头 ===
set -euo pipefail  # 严格模式
trap "cleanup" EXIT INT TERM

# 脚本配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_DIR="$ROOT_DIR/logs"
LOG_FILE="$LOG_DIR/api-integration-$(date +%Y%m%d_%H%M%S).log"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
RESET='\033[0m'

# 进度条配置
BAR_WIDTH=50
COMPLETE_CHAR="█"
INCOMPLETE_CHAR="░"

# 清理函数
cleanup() {
  echo -e "\n${YELLOW}正在清理临时资源...${RESET}"
  # 这里可以添加需要清理的内容
  echo -e "${GREEN}清理完成${RESET}"
}

# 日志函数
log() {
  local level="$1"
  local message="$2"
  local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
  
  echo -e "[$timestamp] [$level] $message"
  echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

# 进度条函数
show_progress() {
  local current=$1
  local total=$2
  local label=$3
  
  local percentage=$((current * 100 / total))
  local completed=$((percentage * BAR_WIDTH / 100))
  local incomplete=$((BAR_WIDTH - completed))
  
  local progress_bar=""
  for ((i=0; i<completed; i++)); do progress_bar+="$COMPLETE_CHAR"; done
  for ((i=0; i<incomplete; i++)); do progress_bar+="$INCOMPLETE_CHAR"; done
  
  printf "\r${CYAN}%s [${RESET}${GREEN}%s${RESET}${CYAN}] ${RESET}${YELLOW}%3d%%${RESET}" "$label" "$progress_bar" "$percentage"
  
  if [ $current -eq $total ]; then
    echo ""
  fi
}

# 系统健康检查
check_system_health() {
  log "INFO" "执行系统健康检查"
  show_progress 1 5 "系统健康检查"
  
  # 检查内存使用
  if [ -f /proc/meminfo ]; then
    local memory_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    if [ $memory_usage -gt 85 ]; then
      log "WARNING" "内存使用率过高: ${memory_usage}%"
      echo -e "\n${YELLOW}警告: 内存使用率过高，可能影响性能${RESET}"
    else
      log "INFO" "内存使用率正常: ${memory_usage}%"
    fi
  else
    log "INFO" "无法检查内存使用(非Linux系统)"
  fi
  
  # 检查Docker是否运行
  if ! command -v docker &> /dev/null; then
    log "ERROR" "Docker未安装"
    echo -e "\n${RED}错误: Docker未安装，请先安装Docker${RESET}"
    return 1
  fi
  
  if ! docker info &> /dev/null; then
    log "ERROR" "Docker服务未启动"
    echo -e "\n${RED}错误: Docker服务未启动，请先启动Docker${RESET}"
    return 1
  fi
  
  log "INFO" "Docker服务正常"
  show_progress 2 5 "Docker检查"
  
  # 检查Node.js是否安装
  if ! command -v node &> /dev/null; then
    log "ERROR" "Node.js未安装"
    echo -e "\n${RED}错误: Node.js未安装，请先安装Node.js${RESET}"
    return 1
  fi
  
  local node_version=$(node -v)
  log "INFO" "Node.js版本: ${node_version}"
  show_progress 3 5 "Node.js检查"
  
  # 检查必要目录是否存在
  for dir in "$ROOT_DIR/redis-config" "$ROOT_DIR/app" "$ROOT_DIR/shared-lib"; do
    if [ ! -d "$dir" ]; then
      log "ERROR" "目录不存在: $dir"
      echo -e "\n${RED}错误: 目录不存在: $dir${RESET}"
      return 1
    fi
  done
  
  log "INFO" "所有必要目录存在"
  show_progress 4 5 "目录检查"
  
  # 创建日志目录
  mkdir -p "$LOG_DIR"
  log "INFO" "日志目录创建成功: $LOG_DIR"
  show_progress 5 5 "准备完成"
  
  return 0
}

# 环境变量同步
 sync_environment() {
  log "INFO" "开始环境变量同步"
  show_progress 1 5 "环境变量同步"
  
  # 运行同步脚本
  if [ -f "$SCRIPT_DIR/sync-api-settings.sh" ]; then
    log "INFO" "执行同步脚本: $SCRIPT_DIR/sync-api-settings.sh"
    bash "$SCRIPT_DIR/sync-api-settings.sh" >> "$LOG_FILE" 2>&1
    if [ $? -eq 0 ]; then
      log "INFO" "环境变量同步成功"
      show_progress 3 5 "同步完成"
    else
      log "ERROR" "环境变量同步失败"
      echo -e "\n${RED}错误: 环境变量同步失败，请检查日志${RESET}"
      return 1
    fi
  else
    log "ERROR" "同步脚本不存在: $SCRIPT_DIR/sync-api-settings.sh"
    echo -e "\n${RED}错误: 同步脚本不存在${RESET}"
    return 1
  fi
  
  # 验证同步结果
  log "INFO" "验证环境变量同步结果"
  
  # 检查Redis配置文件
  local redis_env_files=("$ROOT_DIR/redis-config/.env.local" "$ROOT_DIR/app/.env.local" "$ROOT_DIR/redis-config/config/.env")
  
  for env_file in "${redis_env_files[@]}"; do
    if [ -f "$env_file" ]; then
      log "INFO" "环境文件存在: $env_file"
      local password=$(grep "REDIS_PROD_PASSWORD" "$env_file" | cut -d'=' -f2 | tr -d '\r')
      if [ -n "$password" ]; then
        log "INFO" "$env_file 包含REDIS_PROD_PASSWORD"
      else
        log "WARNING" "$env_file 缺少REDIS_PROD_PASSWORD"
      fi
    else
      log "WARNING" "环境文件不存在: $env_file"
      echo -e "${YELLOW}警告: 环境文件不存在: $env_file${RESET}"
    fi
  done
  
  show_progress 5 5 "验证完成"
  return 0
}

# 启动Docker容器
start_docker_containers() {
  log "INFO" "开始启动Docker容器"
  show_progress 1 5 "启动Docker容器"
  
  # 检查Docker Compose文件是否存在
  if [ ! -f "$ROOT_DIR/docker-compose-api.yml" ]; then
    log "ERROR" "Docker Compose文件不存在: $ROOT_DIR/docker-compose-api.yml"
    echo -e "\n${RED}错误: Docker Compose文件不存在${RESET}"
    return 1
  fi
  
  # 停止现有的容器（如果有）
  log "INFO" "停止现有的容器（如果有）"
  docker compose -f "$ROOT_DIR/docker-compose-api.yml" down >> "$LOG_FILE" 2>&1 || true
  show_progress 2 5 "清理旧容器"
  
  # 启动容器
  log "INFO" "启动Redis和API容器"
  docker compose -f "$ROOT_DIR/docker-compose-api.yml" up -d redis redis-api app-api
  if [ $? -eq 0 ]; then
    log "INFO" "容器启动成功"
    show_progress 4 5 "容器启动"
  else
    log "ERROR" "容器启动失败"
    echo -e "\n${RED}错误: 容器启动失败，请检查日志${RESET}"
    return 1
  fi
  
  # 等待容器启动完成
  log "INFO" "等待容器启动完成（10秒）"
  sleep 10
  show_progress 5 5 "启动完成"
  
  # 显示容器状态
  echo -e "\n${BLUE}容器状态:${RESET}"
  docker compose -f "$ROOT_DIR/docker-compose-api.yml" ps
  
  return 0
}

# 运行集成测试
run_integration_tests() {
  log "INFO" "开始运行集成测试"
  show_progress 1 5 "运行集成测试"
  
  # 检查测试脚本是否存在
  if [ -f "$SCRIPT_DIR/test-api-integration.js" ]; then
    log "INFO" "执行测试脚本: $SCRIPT_DIR/test-api-integration.js"
    node "$SCRIPT_DIR/test-api-integration.js" >> "$LOG_FILE" 2>&1
    if [ $? -eq 0 ]; then
      log "INFO" "测试执行完成"
      show_progress 5 5 "测试完成"
    else
      log "WARNING" "测试执行过程中可能有错误"
      show_progress 5 5 "测试完成（有警告）"
    fi
  else
    log "ERROR" "测试脚本不存在: $SCRIPT_DIR/test-api-integration.js"
    echo -e "\n${RED}错误: 测试脚本不存在${RESET}"
    return 1
  fi
  
  # 显示测试报告位置
  local report_file="$ROOT_DIR/docs/api-integration-report.json"
  if [ -f "$report_file" ]; then
    echo -e "\n${GREEN}测试报告已生成: $report_file${RESET}"
    
    # 显示测试结果摘要
    echo -e "\n${BLUE}测试结果摘要:${RESET}"
    grep '"overall":' "$report_file" | head -1
  fi
  
  return 0
}

# 运行同步服务
run_sync_service() {
  log "INFO" "开始运行API同步服务"
  show_progress 1 3 "运行同步服务"
  
  # 运行同步服务容器
  docker compose -f "$ROOT_DIR/docker-compose-api.yml" --profile sync run --rm api-sync
  if [ $? -eq 0 ]; then
    log "INFO" "同步服务执行成功"
    show_progress 3 3 "同步服务完成"
  else
    log "WARNING" "同步服务执行可能有错误"
    show_progress 3 3 "同步服务完成（有警告）"
  fi
  
  return 0
}

# 显示连接信息
show_connection_info() {
  echo -e "\n${PURPLE}========================================${RESET}"
  echo -e "${CYAN}            API集成完成信息              ${RESET}"
  echo -e "${PURPLE}========================================${RESET}"
  
  echo -e "${GREEN}1. 服务地址:${RESET}"
  echo -e "   Redis服务: ${YELLOW}redis://localhost:6380${RESET}"
  echo -e "   Redis API: ${YELLOW}http://localhost:3000${RESET}"
  echo -e "   App API:   ${YELLOW}http://localhost:3001${RESET}"
  
  echo -e "\n${GREEN}2. 健康检查地址:${RESET}"
  echo -e "   Redis API状态: ${YELLOW}http://localhost:3000/status${RESET}"
  echo -e "   App API状态:   ${YELLOW}http://localhost:3001/api/status${RESET}"
  
  echo -e "\n${GREEN}3. 配置文件:${RESET}"
  echo -e "   API集成文档: ${YELLOW}$ROOT_DIR/docs/API-INTEGRATION.md${RESET}"
  echo -e "   Docker Compose: ${YELLOW}$ROOT_DIR/docker-compose-api.yml${RESET}"
  echo -e "   同步脚本: ${YELLOW}$SCRIPT_DIR/sync-api-settings.sh${RESET}"
  echo -e "   测试脚本: ${YELLOW}$SCRIPT_DIR/test-api-integration.js${RESET}"
  
  echo -e "\n${GREEN}4. 日志信息:${RESET}"
  echo -e "   执行日志: ${YELLOW}$LOG_FILE${RESET}"
  echo -e "   服务日志: ${YELLOW}$LOG_DIR${RESET}"
  
  echo -e "\n${GREEN}5. 常用命令:${RESET}"
  echo -e "   停止服务: ${YELLOW}docker compose -f $ROOT_DIR/docker-compose-api.yml down${RESET}"
  echo -e "   查看日志: ${YELLOW}docker compose -f $ROOT_DIR/docker-compose-api.yml logs -f${RESET}"
  echo -e "   重新测试: ${YELLOW}node $SCRIPT_DIR/test-api-integration.js${RESET}"
  
  echo -e "\n${PURPLE}========================================${RESET}"
}

# 主函数
main() {
  echo -e "${CYAN}\n============================================${RESET}"
  echo -e "${PURPLE}        API服务联动初始化与审核工具         ${RESET}"
  echo -e "${CYAN}============================================${RESET}\n"
  
  echo -e "${GREEN}1. 系统健康检查${RESET}"
  if ! check_system_health; then
    echo -e "\n${RED}系统健康检查失败，请修复问题后重试${RESET}"
    return 1
  fi
  
  echo -e "\n${GREEN}2. 环境变量同步${RESET}"
  if ! sync_environment; then
    echo -e "\n${RED}环境变量同步失败，请修复问题后重试${RESET}"
    return 1
  fi
  
  echo -e "\n${GREEN}3. 启动Docker容器${RESET}"
  if ! start_docker_containers; then
    echo -e "\n${RED}容器启动失败，请修复问题后重试${RESET}"
    return 1
  fi
  
  echo -e "\n${GREEN}4. 运行集成测试${RESET}"
  run_integration_tests  # 不阻止继续执行
  
  echo -e "\n${GREEN}5. 运行API同步服务${RESET}"
  run_sync_service  # 不阻止继续执行
  
  echo -e "\n${GREEN}6. 显示连接信息${RESET}"
  show_connection_info
  
  echo -e "\n${GREEN}✅ API集成初始化与审核完成！${RESET}"
  echo -e "${BLUE}请检查以上信息，确保所有服务正常运行${RESET}"
  echo -e "${YELLOW}如有问题，请查看日志文件获取详细信息${RESET}"
  
  return 0
}

# 执行主函数
main
