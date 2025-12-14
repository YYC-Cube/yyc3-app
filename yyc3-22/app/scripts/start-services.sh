#!/bin/bash
/**
 * @file 服务管理脚本
 * @description 统一管理项目各服务的启动、停止和重启
 * @module scripts/start-services
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

# === 脚本健康检查头 ===
set -euo pipefail
trap "echo '服务启动/停止操作已完成'" EXIT INT TERM

# 颜色定义
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

# 配置参数
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${SCRIPT_DIR}/.."
ENV_FILE="${PROJECT_ROOT}/services/.env.local"

# 读取.env.local文件
if [ -f "$ENV_FILE" ]; then
  # 使用source+进程替换方法读取环境变量
  source <(grep -v '^#' "$ENV_FILE" | sed 's/\r$//' | awk 'BEGIN {FS="="} {print "export \"" $1 "=\"" $2 "\""}')
fi

SERVICES=('api' 'admin' 'llm' 'mail')
PORTS=("${PORT:-3000}" "${PORT_ADMIN:-3001}" "${PORT_LLM:-3002}" "${PORT_MAIL:-3003}")
LOG_DIR="${PROJECT_ROOT}/logs"

# 确保日志目录存在
mkdir -p "$LOG_DIR"

# 日志函数
log_info() {
  echo -e "${GREEN}ℹ️  [INFO] $1${NC}"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] $1" >> "${LOG_DIR}/services.log"
}

log_error() {
  echo -e "${RED}❌ [ERROR] $1${NC}"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] $1" >> "${LOG_DIR}/error.log"
}

log_success() {
  echo -e "${GREEN}✅ [SUCCESS] $1${NC}"
}

# 服务启动函数
start_service() {
  local service=$1
  local port=$2
  local service_dir="${PROJECT_ROOT}/${service}"
  
  log_info "启动 ${service} 服务..."
  
  # 检查服务目录是否存在
  if [[ ! -d "$service_dir" ]]; then
    log_error "服务目录不存在: $service_dir"
    return 1
  fi
  
  # 检查服务是否已在运行
  if pgrep -f "node.*${service}" > /dev/null; then
    log_info "${service} 服务已经在运行"
    return 0
  fi
  
  # 切换到服务目录
  cd "$service_dir"
  
  # 检查是否存在package.json
  if [[ ! -f "package.json" ]]; then
    log_error "$service_dir 中未找到 package.json"
    return 1
  fi
  
  # 检查是否存在.env文件
  if [[ ! -f ".env" ]]; then
    log_error "$service_dir 中未找到 .env 文件，请先运行 init.sh"
    return 1
  fi
  
  # 确保服务日志目录存在
  mkdir -p "${service_dir}/logs"
  
  # 启动服务（使用PM2或直接启动）
  log_info "在端口 ${port} 上启动 ${service} 服务"
  
  # 使用PM2启动服务
  if command -v pm2 &> /dev/null; then
    pm2 start server.js --name "${service}" -- --port ${port} > "${service_dir}/logs/startup.log" 2>&1
    if [[ $? -eq 0 ]]; then
      log_success "${service} 服务已通过PM2成功启动"
    else
      log_error "${service} 服务启动失败，请检查 ${service_dir}/logs/startup.log"
      return 1
    fi
  else
    # 直接使用nohup启动
    log_info "PM2未安装，使用nohup启动服务"
    nohup node server.js --port ${port} > "${service_dir}/logs/startup.log" 2>&1 &
    
    # 等待服务启动
    sleep 3
    
    # 检查服务是否成功启动
    if pgrep -f "node.*${service}" > /dev/null; then
      log_success "${service} 服务已通过nohup成功启动"
    else
      log_error "${service} 服务启动失败，请检查 ${service_dir}/logs/startup.log"
      return 1
    fi
  fi
  
  return 0
}

# 服务停止函数
stop_service() {
  local service=$1
  
  log_info "停止 ${service} 服务..."
  
  # 使用PM2停止服务
  if command -v pm2 &> /dev/null; then
    if pm2 delete "${service}" > /dev/null 2>&1; then
      log_success "${service} 服务已通过PM2成功停止"
    else
      log_warn "PM2中未找到 ${service} 服务，尝试直接停止进程"
      # 尝试直接停止进程
      if pgrep -f "node.*${service}" > /dev/null; then
        pkill -f "node.*${service}"
        log_success "${service} 服务进程已成功停止"
      else
        log_info "${service} 服务未在运行"
      fi
    fi
  else
    # 直接停止进程
    if pgrep -f "node.*${service}" > /dev/null; then
      pkill -f "node.*${service}"
      log_success "${service} 服务进程已成功停止"
    else
      log_info "${service} 服务未在运行"
    fi
  fi
  
  return 0
}

# 服务状态检查函数
check_service_status() {
  local service=$1
  local port=$2
  
  log_info "检查 ${service} 服务状态..."
  
  # 检查进程是否运行
  if pgrep -f "node.*${service}" > /dev/null; then
    log_success "${service} 服务进程正在运行"
    
    # 尝试通过健康检查端点验证服务是否正常响应
    if command -v curl &> /dev/null; then
      local health_check_url="http://localhost:${port}/health"
      local response=$(curl -s -o /dev/null -w "%{http_code}" "$health_check_url" 2>/dev/null)
      
      if [[ -n "$response" && "$response" -eq 200 ]]; then
        log_success "${service} 服务健康检查通过"
      else
        log_warn "${service} 服务进程运行中，但健康检查失败或无法访问"
      fi
    else
      log_info "curl未安装，无法执行健康检查"
    fi
  else
    log_error "${service} 服务进程未在运行"
  fi
  
  return 0
}

# 帮助函数
show_help() {
  echo -e "\n${BLUE}🚀 0379.email 服务管理脚本${NC}\n"
  echo -e "${GREEN}用法:${NC} $0 {start|stop|restart|status|help}"
  echo -e "\n${GREEN}选项:${NC}"
  echo -e "  ${GREEN}start${NC}    - 启动所有服务"
  echo -e "  ${GREEN}stop${NC}     - 停止所有服务"
  echo -e "  ${GREEN}restart${NC}  - 重启所有服务"
  echo -e "  ${GREEN}status${NC}   - 检查所有服务状态"
  echo -e "  ${GREEN}help${NC}     - 显示此帮助信息"
  echo -e ""
  echo -e "${GREEN}示例:${NC}"
  echo -e "  $0 start      # 启动所有服务"
  echo -e "  $0 stop       # 停止所有服务"
  echo -e "  $0 restart    # 重启所有服务"
  echo -e "  $0 status     # 检查所有服务状态"
  echo -e ""
}

# 日志警告函数
log_warn() {
  echo -e "${YELLOW}⚠️  [WARN] $1${NC}"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [WARN] $1" >> "${LOG_DIR}/services.log"
}

# 主函数
main() {
  if [[ $# -eq 0 ]]; then
    show_help
    exit 0
  fi
  
  case "$1" in
    start)
      log_info "开始启动所有服务..."
      local success_count=0
      local fail_count=0
      
      for i in "${!SERVICES[@]}"; do
        local service="${SERVICES[$i]}"
        local port="${PORTS[$i]}"
        
        if start_service "$service" "$port"; then
          success_count=$((success_count + 1))
        else
          fail_count=$((fail_count + 1))
        fi
        echo ""
      done
      
      log_info "服务启动完成：成功 ${success_count}/${#SERVICES[@]}，失败 ${fail_count}/${#SERVICES[@]}"
      
      if [[ $fail_count -eq 0 ]]; then
        log_success "🎉 所有服务已成功启动！"
      else
        log_warn "⚠️  部分服务启动失败，请检查日志"
      fi
      ;;
      
    stop)
      log_info "开始停止所有服务..."
      
      for i in "${!SERVICES[@]}"; do
        local service="${SERVICES[$i]}"
        stop_service "$service"
        echo ""
      done
      
      log_success "🎉 所有服务停止操作已完成！"
      ;;
      
    restart)
      log_info "开始重启所有服务..."
      
      # 先停止所有服务
      for i in "${!SERVICES[@]}"; do
        local service="${SERVICES[$i]}"
        stop_service "$service"
        echo ""
      done
      
      # 等待一段时间确保服务完全停止
      log_info "等待5秒确保服务完全停止..."
      sleep 5
      
      # 再启动所有服务
      log_info "开始重新启动所有服务..."
      local success_count=0
      local fail_count=0
      
      for i in "${!SERVICES[@]}"; do
        local service="${SERVICES[$i]}"
        local port="${PORTS[$i]}"
        
        if start_service "$service" "$port"; then
          success_count=$((success_count + 1))
        else
          fail_count=$((fail_count + 1))
        fi
        echo ""
      done
      
      log_info "服务重启完成：成功 ${success_count}/${#SERVICES[@]}，失败 ${fail_count}/${#SERVICES[@]}"
      
      if [[ $fail_count -eq 0 ]]; then
        log_success "🎉 所有服务已成功重启！"
      else
        log_warn "⚠️  部分服务重启失败，请检查日志"
      fi
      ;;
      
    status)
      log_info "检查所有服务状态..."
      local running_count=0
      local stopped_count=0
      
      for i in "${!SERVICES[@]}"; do
        local service="${SERVICES[$i]}"
        local port="${PORTS[$i]}"
        
        check_service_status "$service" "$port"
        
        # 检查进程是否运行来统计状态
        if pgrep -f "node.*${service}" > /dev/null; then
          running_count=$((running_count + 1))
        else
          stopped_count=$((stopped_count + 1))
        fi
        echo ""
      done
      
      log_info "服务状态摘要：运行中 ${running_count}/${#SERVICES[@]}，已停止 ${stopped_count}/${#SERVICES[@]}"
      
      if [[ $stopped_count -eq 0 ]]; then
        log_success "🎉 所有服务运行正常！"
      else
        log_warn "⚠️  有 ${stopped_count} 个服务未运行，请检查"
      fi
      ;;
      
    help|--help|-h)
      show_help
      ;;
      
    *)
      log_error "未知命令: $1"
      show_help
      exit 1
      ;;
esac
}

# 执行主函数
main "$@"
