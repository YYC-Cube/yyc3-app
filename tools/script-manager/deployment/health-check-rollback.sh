#!/bin/bash
# === 脚本健康检查头 ===
set -euo pipefail  # 严格模式
trap "cleanup" EXIT INT TERM

# ======================================================
# 微服务部署健康检查与回滚机制脚本
# ======================================================
# 功能: 提供服务健康检查、自动回滚、部署验证等核心功能
# 作者: YYC
# 版本: 1.0.0
# 创建日期: 2024-10-15
# ======================================================

# 全局配置变量
SERVICE_NAME=""                # 服务名称
DEPLOY_ENV=""                 # 部署环境 (dev/staging/prod)
HEALTH_CHECK_URL=""           # 健康检查URL
HEALTH_CHECK_TIMEOUT=30       # 健康检查超时时间(秒)
HEALTH_CHECK_RETRIES=5        # 健康检查重试次数
HEALTH_CHECK_INTERVAL=5       # 健康检查间隔(秒)
DEPLOYMENT_TIMEOUT=300        # 部署总超时时间(秒)
PRE_DEPLOY_CHECKS=true        # 是否执行部署前检查
POST_DEPLOY_CHECKS=true       # 是否执行部署后检查
AUTO_ROLLBACK=true            # 是否自动回滚
ROLLBACK_TIMEOUT=120          # 回滚超时时间(秒)
LOG_LEVEL="info"              # 日志级别 (debug/info/warn/error)
BACKUP_ENABLED=true           # 是否启用备份
BACKUP_DIR=""                 # 备份目录
MONITORING_ENABLED=true       # 是否启用监控通知
METRICS_THRESHOLD_CPU=80      # CPU使用率阈值(%)
METRICS_THRESHOLD_MEMORY=85   # 内存使用率阈值(%)
SLACK_WEBHOOK=""              # Slack通知webhook
DISCORD_WEBHOOK=""           # Discord通知webhook
EMAIL_NOTIFICATION=""        # 邮件通知

# 颜色常量
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
RESET='\033[0m'

# 时间戳函数
function timestamp() {
  date "+%Y-%m-%d %H:%M:%S"
}

# 日志函数
function log() {
  local level=$1
  local message=$2
  local color=$RESET
  
  # 根据日志级别选择颜色
  case $level in
    "debug")
      color=$BLUE
      [ "$LOG_LEVEL" != "debug" ] && return 0
      ;;
    "info")
      color=$GREEN
      [ "$LOG_LEVEL" = "error" ] && return 0
      ;;
    "warn")
      color=$YELLOW
      [ "$LOG_LEVEL" = "error" ] && return 0
      ;;
    "error")
      color=$RED
      ;;
  esac
  
  echo -e "${color}[$(timestamp)] [${level^^}] ${message}${RESET}"
}

# 清理函数
function cleanup() {
  log "info" "执行清理操作..."
  
  # 清理临时文件
  if [ -d "$TMP_DIR" ]; then
    rm -rf "$TMP_DIR"
    log "debug" "已清理临时目录: $TMP_DIR"
  fi
  
  # 清理锁文件
  if [ -f "$LOCK_FILE" ]; then
    rm -f "$LOCK_FILE"
    log "debug" "已清理锁文件: $LOCK_FILE"
  fi
  
  # 重置状态
  if [ "$DEPLOY_IN_PROGRESS" = true ]; then
    log "error" "部署过程被中断，建议手动检查服务状态"
    send_notification "deploy_failed" "部署被中断: $SERVICE_NAME in $DEPLOY_ENV"
  fi
  
  log "info" "清理完成"
}

# 初始化临时目录和锁文件
TMP_DIR="/tmp/deploy_health_$(date +%s)"
LOCK_FILE="/tmp/deploy_health_${SERVICE_NAME}_${DEPLOY_ENV}.lock"
DEPLOY_IN_PROGRESS=false
DEPLOY_START_TIME=0
DEPLOY_STATUS="pending"
LAST_GOOD_DEPLOYMENT=""

# 检查是否有其他部署正在进行
function check_lock_file() {
  if [ -f "$LOCK_FILE" ]; then
    local pid=$(cat "$LOCK_FILE" 2>/dev/null || echo "unknown")
    log "error" "检测到另一个部署进程正在运行 (PID: $pid)"
    log "error" "请等待当前部署完成或手动移除锁文件: $LOCK_FILE"
    exit 1
  fi
  
  # 创建锁文件
  echo $$ > "$LOCK_FILE"
  log "debug" "已创建锁文件: $LOCK_FILE (PID: $$)"
}

# 加载配置
function load_config() {
  local config_file="$1"
  
  if [ ! -f "$config_file" ]; then
    log "error" "配置文件不存在: $config_file"
    return 1
  fi
  
  log "info" "加载配置文件: $config_file"
  
  # 加载配置文件中的变量
  source "$config_file"
  
  # 验证必需配置
  if [ -z "$SERVICE_NAME" ]; then
    log "error" "必须配置SERVICE_NAME"
    return 1
  fi
  
  if [ -z "$DEPLOY_ENV" ]; then
    log "error" "必须配置DEPLOY_ENV"
    return 1
  fi
  
  # 生成健康检查URL（如果未配置）
  if [ -z "$HEALTH_CHECK_URL" ]; then
    case $DEPLOY_ENV in
      "dev")
        HEALTH_CHECK_URL="http://localhost:3000/api/health"
        ;;
      "staging")
        HEALTH_CHECK_URL="https://staging-api.${SERVICE_NAME}.com/api/health"
        ;;
      "prod")
        HEALTH_CHECK_URL="https://api.${SERVICE_NAME}.com/api/health"
        ;;
      *)
        HEALTH_CHECK_URL="http://localhost:3000/api/health"
        ;;
    esac
  fi
  
  # 设置备份目录（如果未配置）
  if [ -z "$BACKUP_DIR" ]; then
    BACKUP_DIR="/var/backups/${SERVICE_NAME}/${DEPLOY_ENV}"
  fi
  
  log "debug" "配置加载完成"
  log "debug" "服务: $SERVICE_NAME, 环境: $DEPLOY_ENV"
  log "debug" "健康检查URL: $HEALTH_CHECK_URL"
  
  return 0
}

# 执行部署前检查
function run_pre_deploy_checks() {
  if [ "$PRE_DEPLOY_CHECKS" != true ]; then
    log "info" "跳过部署前检查"
    return 0
  fi
  
  log "info" "执行部署前检查..."
  
  # 1. 系统资源检查
  check_system_resources || {
    log "error" "系统资源检查失败，取消部署"
    return 1
  }
  
  # 2. 服务状态检查
  check_service_status || {
    log "warn" "当前服务状态检查失败，但继续部署（将尝试重启）"
  }
  
  # 3. 备份当前部署
  if [ "$BACKUP_ENABLED" = true ]; then
    backup_current_deployment || {
      log "error" "备份失败，取消部署"
      return 1
    }
  fi
  
  # 4. 网络连通性检查
  check_network_connectivity || {
    log "error" "网络连通性检查失败，取消部署"
    return 1
  }
  
  # 5. 依赖服务检查
  check_dependencies || {
    log "error" "依赖服务检查失败，取消部署"
    return 1
  }
  
  log "info" "部署前检查通过"
  return 0
}

# 系统资源检查
function check_system_resources() {
  log "debug" "检查系统资源..."
  
  # CPU使用率检查
  local cpu_usage
  if command -v top &> /dev/null; then
    cpu_usage=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
    log "debug" "当前CPU使用率: ${cpu_usage}%"
    
    if (( $(echo "$cpu_usage > $METRICS_THRESHOLD_CPU" | bc -l) )); then
      log "error" "CPU使用率(${cpu_usage}%)超过阈值(${METRICS_THRESHOLD_CPU}%)"
      return 1
    fi
  else
    log "warn" "无法检查CPU使用率: top命令不可用"
  fi
  
  # 内存使用率检查
  local memory_usage
  if command -v free &> /dev/null; then
    memory_usage=$(free | grep Mem | awk '{print $3/$2 * 100.0}')
    log "debug" "当前内存使用率: ${memory_usage}%"
    
    if (( $(echo "$memory_usage > $METRICS_THRESHOLD_MEMORY" | bc -l) )); then
      log "error" "内存使用率(${memory_usage}%)超过阈值(${METRICS_THRESHOLD_MEMORY}%)"
      return 1
    fi
  elif command -v vm_stat &> /dev/null; then
    # macOS 内存检查
    memory_usage=$(vm_stat | awk '\
      BEGIN { 
        RS="\n"; 
        FS=": *"; 
        page_size=4096; 
        mem_total=0; 
        mem_free=0; 
        mem_inactive=0; 
        mem_active=0;
      } \
      $1=="Pages free" { mem_free=$2; } \
      $1=="Pages active" { mem_active=$2; } \
      $1=="Pages inactive" { mem_inactive=$2; } \
      $1=="Pages speculative" { mem_speculative=$2; } \
      END { 
        mem_total=mem_free+mem_inactive+mem_active+mem_speculative; 
        mem_used=mem_total-mem_free; 
        printf "%.2f", mem_used/mem_total*100; 
      }'
    )
    
    log "debug" "当前内存使用率: ${memory_usage}%"
    
    if (( $(echo "$memory_usage > $METRICS_THRESHOLD_MEMORY" | bc -l) )); then
      log "error" "内存使用率(${memory_usage}%)超过阈值(${METRICS_THRESHOLD_MEMORY}%)"
      return 1
    fi
  else
    log "warn" "无法检查内存使用率: free/vm_stat命令不可用"
  fi
  
  # 磁盘空间检查
  local disk_usage
  if command -v df &> /dev/null; then
    disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    log "debug" "当前磁盘使用率: ${disk_usage}%"
    
    if [ "$disk_usage" -gt 90 ]; then
      log "error" "磁盘使用率(${disk_usage}%)超过90%"
      return 1
    fi
  else
    log "warn" "无法检查磁盘使用率: df命令不可用"
  fi
  
  log "debug" "系统资源检查通过"
  return 0
}

# 检查服务状态
function check_service_status() {
  log "debug" "检查当前服务状态..."
  
  if ! command -v curl &> /dev/null; then
    log "warn" "curl命令不可用，跳过服务状态检查"
    return 0
  fi
  
  local status_code
  status_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "$HEALTH_CHECK_URL" 2>/dev/null || echo "000")
  
  log "debug" "服务健康检查返回状态码: $status_code"
  
  if [ "$status_code" -ge 200 ] && [ "$status_code" -lt 300 ]; then
    log "info" "当前服务运行正常"
    return 0
  else
    log "warn" "当前服务不可用或状态异常"
    return 1
  fi
}

# 备份当前部署
function backup_current_deployment() {
  log "info" "备份当前部署..."
  
  # 创建备份目录
  mkdir -p "$BACKUP_DIR"
  
  # 生成备份文件名
  local backup_time=$(date +%Y%m%d_%H%M%S)
  local backup_file="${BACKUP_DIR}/${SERVICE_NAME}_${DEPLOY_ENV}_${backup_time}.tar.gz"
  
  # 确定服务目录（根据环境变量或使用默认值）
  local service_dir=${SERVICE_DIR:-"/opt/${SERVICE_NAME}"}
  
  if [ ! -d "$service_dir" ]; then
    log "warn" "服务目录不存在: $service_dir，跳过备份"
    return 0
  fi
  
  # 执行备份
  log "debug" "创建备份: $backup_file"
  
  if tar -czf "$backup_file" -C "$(dirname "$service_dir")" "$(basename "$service_dir")" 2>/dev/null; then
    log "info" "备份成功: $backup_file"
    
    # 保存最后一次成功备份的路径
    echo "$backup_file" > "${BACKUP_DIR}/last_backup.txt"
    
    # 清理旧备份（保留最近5个）
    cleanup_old_backups
    
    return 0
  else
    log "error" "备份失败: $backup_file"
    return 1
  fi
}

# 清理旧备份
function cleanup_old_backups() {
  log "debug" "清理旧备份..."
  
  # 保留最近5个备份
  ls -t "${BACKUP_DIR}/${SERVICE_NAME}_${DEPLOY_ENV}_"*.tar.gz 2>/dev/null | tail -n +6 | xargs -I {} rm -f "{}" || true
  
  log "debug" "备份清理完成"
}

# 网络连通性检查
function check_network_connectivity() {
  log "debug" "检查网络连通性..."
  
  # 检查健康检查URL的连通性
  if command -v curl &> /dev/null; then
    if curl -s --connect-timeout 5 "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
      log "debug" "网络连通性检查通过"
      return 0
    else
      log "error" "无法连接到健康检查URL: $HEALTH_CHECK_URL"
      return 1
    fi
  else
    log "warn" "curl命令不可用，跳过网络连通性检查"
    return 0
  fi
}

# 依赖服务检查
function check_dependencies() {
  log "debug" "检查依赖服务..."
  
  # 如果没有配置依赖服务，则跳过
  if [ -z "${DEPENDENCIES:-}" ]; then
    log "debug" "未配置依赖服务，跳过检查"
    return 0
  fi
  
  local all_healthy=true
  
  # 分割依赖列表（格式: "service1:host1:port1 service2:host2:port2"）
  for dep in $DEPENDENCIES; do
    IFS=':' read -r service host port <<< "$dep"
    
    if [ -n "$host" ] && [ -n "$port" ]; then
      log "debug" "检查依赖服务: $service ($host:$port)"
      
      # 使用nc或curl检查服务可用性
      if command -v nc &> /dev/null; then
        if nc -z -w 3 "$host" "$port" 2>/dev/null; then
          log "debug" "依赖服务 $service 可用"
        else
          log "error" "依赖服务 $service ($host:$port) 不可用"
          all_healthy=false
        fi
      else
        log "warn" "nc命令不可用，跳过依赖服务 $service 检查"
      fi
    fi
  done
  
  if [ "$all_healthy" = true ]; then
    log "debug" "所有依赖服务检查通过"
    return 0
  else
    log "error" "部分依赖服务不可用"
    return 1
  fi
}

# 执行健康检查
function check_health() {
  log "info" "开始健康检查: $HEALTH_CHECK_URL"
  
  if ! command -v curl &> /dev/null; then
    log "error" "curl命令不可用，无法执行健康检查"
    return 1
  fi
  
  local retry=0
  local max_retries=$HEALTH_CHECK_RETRIES
  local interval=$HEALTH_CHECK_INTERVAL
  local timeout=$HEALTH_CHECK_TIMEOUT
  
  while [ $retry -lt $max_retries ]; do
    log "debug" "健康检查尝试 #$((retry + 1))/$max_retries"
    
    # 执行健康检查
    local result
    result=$(curl -s -m "$timeout" -H "Content-Type: application/json" "$HEALTH_CHECK_URL" 2>/dev/null)
    local status_code=$?
    
    if [ $status_code -eq 0 ]; then
      # 解析JSON响应
      local healthy=false
      
      # 尝试使用jq解析（如果可用）
      if command -v jq &> /dev/null; then
        if echo "$result" | jq -e '.status == "ok" or .healthy == true' &> /dev/null; then
          healthy=true
        fi
      else
        # 简单的字符串检查
        if echo "$result" | grep -q '"status":"ok"\|"healthy":true'; then
          healthy=true
        fi
      fi
      
      if [ "$healthy" = true ]; then
        log "${GREEN}健康检查通过!${RESET}"
        log "debug" "健康检查响应: $result"
        return 0
      else
        log "warn" "健康检查状态异常，响应: $result"
      fi
    else
      log "warn" "健康检查请求失败，退出码: $status_code"
    fi
    
    # 增加重试计数
    retry=$((retry + 1))
    
    # 如果不是最后一次尝试，等待一段时间
    if [ $retry -lt $max_retries ]; then
      log "debug" "等待 $interval 秒后重试..."
      sleep $interval
    fi
  done
  
  log "error" "健康检查失败，已重试 $max_retries 次"
  return 1
}

# 执行部署后检查
function run_post_deploy_checks() {
  if [ "$POST_DEPLOY_CHECKS" != true ]; then
    log "info" "跳过部署后检查"
    return 0
  fi
  
  log "info" "执行部署后检查..."
  
  # 1. 健康检查
  if ! check_health; then
    log "error" "健康检查失败"
    return 1
  fi
  
  # 2. 性能指标检查
  if ! check_performance_metrics; then
    log "warn" "性能指标检查异常，但继续部署"
  fi
  
  # 3. 功能验证检查
  if ! run_smoke_tests; then
    log "error" "功能验证测试失败"
    return 1
  fi
  
  log "info" "部署后检查通过"
  return 0
}

# 检查性能指标
function check_performance_metrics() {
  log "debug" "检查性能指标..."
  
  # 如果没有配置性能指标URL，跳过
  if [ -z "${METRICS_URL:-}" ]; then
    log "debug" "未配置性能指标URL，跳过检查"
    return 0
  fi
  
  # 尝试获取性能指标
  if command -v curl &> /dev/null; then
    local metrics_result
    metrics_result=$(curl -s -m 10 "$METRICS_URL" 2>/dev/null)
    
    if [ $? -eq 0 ]; then
      log "debug" "成功获取性能指标"
      # 这里可以根据实际需求解析和检查指标
      return 0
    else
      log "warn" "无法获取性能指标"
      return 1
    fi
  else
    log "warn" "curl命令不可用，跳过性能指标检查"
    return 0
  fi
}

# 运行冒烟测试
function run_smoke_tests() {
  log "debug" "运行功能验证测试..."
  
  # 如果没有配置冒烟测试，跳过
  if [ -z "${SMOKE_TESTS:-}" ]; then
    log "debug" "未配置冒烟测试，跳过检查"
    return 0
  fi
  
  # 创建临时测试目录
  mkdir -p "$TMP_DIR/smoke_tests"
  
  # 保存冒烟测试脚本
  echo "$SMOKE_TESTS" > "$TMP_DIR/smoke_tests/run_tests.sh"
  chmod +x "$TMP_DIR/smoke_tests/run_tests.sh"
  
  # 运行冒烟测试
  log "debug" "执行冒烟测试脚本"
  if bash "$TMP_DIR/smoke_tests/run_tests.sh"; then
    log "info" "冒烟测试通过"
    return 0
  else
    log "error" "冒烟测试失败"
    return 1
  fi
}

# 执行回滚操作
function rollback() {
  log "${RED}开始回滚操作...${RESET}"
  
  # 设置回滚超时
  local rollback_start=$(date +%s)
  local rollback_end=$((rollback_start + ROLLBACK_TIMEOUT))
  
  # 获取最后一次成功的备份
  local last_backup
  last_backup=$(cat "${BACKUP_DIR}/last_backup.txt" 2>/dev/null || echo "")
  
  if [ -z "$last_backup" ] || [ ! -f "$last_backup" ]; then
    log "error" "未找到可用的备份文件，无法回滚"
    send_notification "rollback_failed" "回滚失败: 找不到备份文件"
    return 1
  fi
  
  log "info" "使用备份文件回滚: $last_backup"
  
  # 确定服务目录
  local service_dir=${SERVICE_DIR:-"/opt/${SERVICE_NAME}"}
  local service_backup="${service_dir}.bak.$(date +%s)"
  
  # 停止服务
  stop_service || {
    log "warn" "停止服务失败，但继续回滚"
  }
  
  # 备份当前（可能损坏的）部署
  if [ -d "$service_dir" ]; then
    log "debug" "备份当前部署到: $service_backup"
    mv "$service_dir" "$service_backup" || {
      log "error" "无法备份当前部署"
      return 1
    }
  fi
  
  # 创建服务目录
  mkdir -p "$(dirname "$service_dir")"
  
  # 从备份恢复
  log "debug" "从备份恢复部署..."
  if tar -xzf "$last_backup" -C "$(dirname "$service_dir")"; then
    log "info" "成功从备份恢复"
    
    # 启动服务
    start_service || {
      log "error" "回滚后启动服务失败"
      send_notification "rollback_failed" "回滚后服务启动失败"
      return 1
    }
    
    # 验证回滚
    log "info" "验证回滚是否成功..."
    if check_health; then
      log "${GREEN}回滚成功!${RESET}"
      send_notification "rollback_success" "回滚成功: $SERVICE_NAME in $DEPLOY_ENV"
      return 0
    else
      log "error" "回滚后健康检查失败"
      send_notification "rollback_failed" "回滚后服务不健康"
      return 1
    fi
  else
    log "error" "从备份恢复失败"
    
    # 尝试恢复原始部署
    if [ -d "$service_backup" ]; then
      log "debug" "尝试恢复原始部署"
      mv "$service_backup" "$service_dir" || {
        log "error" "无法恢复原始部署"
      }
    fi
    
    send_notification "rollback_failed" "备份恢复失败"
    return 1
  fi
}

# 停止服务
function stop_service() {
  log "debug" "停止服务: $SERVICE_NAME"
  
  # 根据环境变量使用不同的停止方式
  if [ -n "${STOP_COMMAND:-}" ]; then
    log "debug" "使用自定义停止命令: $STOP_COMMAND"
    eval "$STOP_COMMAND" || {
      log "error" "自定义停止命令执行失败"
      return 1
    }
  elif command -v systemctl &> /dev/null; then
    # 尝试使用systemd
    log "debug" "使用systemctl停止服务"
    sudo systemctl stop "$SERVICE_NAME" || {
      log "error" "systemctl停止服务失败"
      return 1
    }
  elif command -v service &> /dev/null; then
    # 尝试使用service
    log "debug" "使用service停止服务"
    sudo service "$SERVICE_NAME" stop || {
      log "error" "service停止服务失败"
      return 1
    }
  else
    log "warn" "无法确定如何停止服务，跳过停止步骤"
    return 0
  fi
  
  log "debug" "服务已停止"
  return 0
}

# 启动服务
function start_service() {
  log "debug" "启动服务: $SERVICE_NAME"
  
  # 根据环境变量使用不同的启动方式
  if [ -n "${START_COMMAND:-}" ]; then
    log "debug" "使用自定义启动命令: $START_COMMAND"
    eval "$START_COMMAND" || {
      log "error" "自定义启动命令执行失败"
      return 1
    }
  elif command -v systemctl &> /dev/null; then
    # 尝试使用systemd
    log "debug" "使用systemctl启动服务"
    sudo systemctl start "$SERVICE_NAME" || {
      log "error" "systemctl启动服务失败"
      return 1
    }
  elif command -v service &> /dev/null; then
    # 尝试使用service
    log "debug" "使用service启动服务"
    sudo service "$SERVICE_NAME" start || {
      log "error" "service启动服务失败"
      return 1
    }
  else
    log "warn" "无法确定如何启动服务，跳过启动步骤"
    return 0
  fi
  
  log "debug" "服务已启动"
  return 0
}

# 发送通知
function send_notification() {
  local event_type=$1
  local message=$2
  
  if [ "$MONITORING_ENABLED" != true ]; then
    log "debug" "监控通知已禁用，跳过发送"
    return 0
  fi
  
  log "debug" "发送通知: $event_type - $message"
  
  # 构建完整消息
  local full_message="[${DEPLOY_ENV^^}] ${SERVICE_NAME} - $message"
  local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  
  # 发送Slack通知
  if [ -n "$SLACK_WEBHOOK" ]; then
    send_slack_notification "$full_message" "$event_type" "$timestamp"
  fi
  
  # 发送Discord通知
  if [ -n "$DISCORD_WEBHOOK" ]; then
    send_discord_notification "$full_message" "$event_type" "$timestamp"
  fi
  
  # 发送邮件通知
  if [ -n "$EMAIL_NOTIFICATION" ]; then
    send_email_notification "$full_message" "$event_type"
  fi
  
  return 0
}

# 发送Slack通知
function send_slack_notification() {
  local message=$1
  local event_type=$2
  local timestamp=$3
  
  log "debug" "发送Slack通知"
  
  # 根据事件类型选择颜色
  local color="#36a64f" # 绿色
  case $event_type in
    "deploy_success") color="#36a64f" ;;
    "deploy_failed") color="#ff0000" ;;
    "rollback_success") color="#008000" ;;
    "rollback_failed") color="#ff6600" ;;
    *) color="#808080" ;;
  esac
  
  # 构建Slack消息
  local slack_payload='{"attachments":[{"color":"'"$color"'","title":"部署通知","text":"'"$message"'","ts":"'"$timestamp"'"}]}'
  
  # 发送通知
  if command -v curl &> /dev/null; then
    curl -s -X POST -H "Content-type: application/json" \
      --data "$slack_payload" \
      "$SLACK_WEBHOOK" > /dev/null 2>&1 || {
      log "warn" "Slack通知发送失败"
    }
  fi
}

# 发送Discord通知
function send_discord_notification() {
  local message=$1
  local event_type=$2
  local timestamp=$3
  
  log "debug" "发送Discord通知"
  
  # 根据事件类型选择颜色
  local color=5763719 # 绿色
  case $event_type in
    "deploy_success") color=5763719 ;;
    "deploy_failed") color=16711680 ;;
    "rollback_success") color=5763719 ;;
    "rollback_failed") color=16744192 ;;
    *) color=8421504 ;;
  esac
  
  # 构建Discord消息
  local discord_payload='{"embeds":[{"color":'"$color"',"title":"部署通知","description":"'"$message"'","timestamp":"'"$timestamp"'"}]}'
  
  # 发送通知
  if command -v curl &> /dev/null; then
    curl -s -X POST -H "Content-type: application/json" \
      --data "$discord_payload" \
      "$DISCORD_WEBHOOK" > /dev/null 2>&1 || {
      log "warn" "Discord通知发送失败"
    }
  fi
}

# 发送邮件通知
function send_email_notification() {
  local message=$1
  local event_type=$2
  
  log "debug" "发送邮件通知"
  
  # 构建邮件主题
  local subject="[部署通知] ${SERVICE_NAME} - ${DEPLOY_ENV^^}"
  
  # 发送邮件
  if command -v mail &> /dev/null; then
    echo "$message" | mail -s "$subject" "$EMAIL_NOTIFICATION" || {
      log "warn" "邮件通知发送失败"
    }
  fi
}

# 主函数
function main() {
  # 解析命令行参数
  while [[ $# -gt 0 ]]; do
    case $1 in
      -c|--config)
        CONFIG_FILE="$2"
        shift 2
        ;;
      -s|--service)
        SERVICE_NAME="$2"
        shift 2
        ;;
      -e|--env)
        DEPLOY_ENV="$2"
        shift 2
        ;;
      --health-url)
        HEALTH_CHECK_URL="$2"
        shift 2
        ;;
      --no-rollback)
        AUTO_ROLLBACK=false
        shift
        ;;
      --no-pre-checks)
        PRE_DEPLOY_CHECKS=false
        shift
        ;;
      --no-post-checks)
        POST_DEPLOY_CHECKS=false
        shift
        ;;
      --debug)
        LOG_LEVEL="debug"
        shift
        ;;
      -h|--help)
        show_help
        exit 0
        ;;
      *)
        log "error" "未知参数: $1"
        show_help
        exit 1
        ;;
    esac
done

  # 如果指定了配置文件，加载它
  if [ -n "${CONFIG_FILE:-}" ]; then
    load_config "$CONFIG_FILE" || exit 1
  fi

  # 验证必需参数
  if [ -z "$SERVICE_NAME" ]; then
    log "error" "必须指定服务名称 (-s 或 --service)"
    exit 1
  fi

  if [ -z "$DEPLOY_ENV" ]; then
    log "error" "必须指定部署环境 (-e 或 --env)"
    exit 1
  fi

  # 创建临时目录
  mkdir -p "$TMP_DIR"

  # 检查锁文件
  check_lock_file

  # 记录部署开始
  DEPLOY_IN_PROGRESS=true
  DEPLOY_START_TIME=$(date +%s)
  DEPLOY_STATUS="in_progress"

  log "${CYAN}=========================================${RESET}"
  log "${CYAN}开始部署: $SERVICE_NAME (环境: $DEPLOY_ENV)${RESET}"
  log "${CYAN}=========================================${RESET}"

  # 发送部署开始通知
  send_notification "deploy_start" "开始部署: $SERVICE_NAME in $DEPLOY_ENV"

  # 运行部署前检查
  if ! run_pre_deploy_checks; then
    log "error" "部署前检查失败，取消部署"
    send_notification "deploy_failed" "部署前检查失败: $SERVICE_NAME in $DEPLOY_ENV"
    exit 1
  fi

  # 执行部署（这里应该调用实际的部署脚本）
  log "info" "执行部署..."

  # 这里添加实际的部署命令
  # 如果用户提供了自定义部署命令，则执行它
  if [ -n "${DEPLOY_COMMAND:-}" ]; then
    log "debug" "执行自定义部署命令: $DEPLOY_COMMAND"
    
    # 设置部署超时
    local deploy_timeout=$DEPLOYMENT_TIMEOUT
    local deploy_end=$((DEPLOY_START_TIME + deploy_timeout))
    
    # 执行部署命令
    if eval "$DEPLOY_COMMAND"; then
      log "info" "部署命令执行成功"
    else
      log "error" "部署命令执行失败"
      
      # 执行回滚
      if [ "$AUTO_ROLLBACK" = true ]; then
        rollback || {
          log "error" "回滚也失败了，需要手动干预!"
          send_notification "deploy_failed" "部署失败且回滚失败: $SERVICE_NAME in $DEPLOY_ENV"
          exit 1
        }
        
        exit 1
      else
        send_notification "deploy_failed" "部署失败（未自动回滚）: $SERVICE_NAME in $DEPLOY_ENV"
        exit 1
      fi
    fi
  else
    log "warn" "未配置部署命令，跳过部署步骤"
  fi

  # 运行部署后检查
  if ! run_post_deploy_checks; then
    log "error" "部署后检查失败"
    
    # 执行回滚
    if [ "$AUTO_ROLLBACK" = true ]; then
      rollback || {
        log "error" "回滚也失败了，需要手动干预!"
        send_notification "deploy_failed" "部署后检查失败且回滚失败: $SERVICE_NAME in $DEPLOY_ENV"
        exit 1
      }
      
      exit 1
    else
      send_notification "deploy_failed" "部署后检查失败（未自动回滚）: $SERVICE_NAME in $DEPLOY_ENV"
      exit 1
    fi
  fi

  # 计算部署时间
  local deploy_end=$(date +%s)
  local deploy_time=$((deploy_end - DEPLOY_START_TIME))
  
  # 更新部署状态
  DEPLOY_STATUS="success"
  DEPLOY_IN_PROGRESS=false

  log "${GREEN}=========================================${RESET}"
  log "${GREEN}部署成功!${RESET}"
  log "${GREEN}服务: $SERVICE_NAME${RESET}"
  log "${GREEN}环境: $DEPLOY_ENV${RESET}"
  log "${GREEN}耗时: ${deploy_time} 秒${RESET}"
  log "${GREEN}=========================================${RESET}"

  # 发送部署成功通知
  send_notification "deploy_success" "部署成功: $SERVICE_NAME in $DEPLOY_ENV (耗时: ${deploy_time}秒)"

  exit 0
}

# 显示帮助信息
function show_help() {
  echo -e "\n${PURPLE}微服务部署健康检查与回滚机制脚本${RESET}"
  echo -e "${BLUE}=====================================${RESET}\n"
  echo -e "${GREEN}用法:${RESET}"
  echo -e "  $0 -s <service_name> -e <environment> [options]"
  echo -e "  $0 --config <config_file>"
  echo -e "\n${GREEN}必需参数:${RESET}"
  echo -e "  -s, --service <name>     服务名称"
  echo -e "  -e, --env <env>          部署环境 (dev/staging/prod)"
  echo -e "\n${GREEN}选项参数:${RESET}"
  echo -e "  -c, --config <file>      配置文件路径"
  echo -e "  --health-url <url>       健康检查URL"
  echo -e "  --no-rollback            禁用自动回滚"
  echo -e "  --no-pre-checks          跳过部署前检查"
  echo -e "  --no-post-checks         跳过部署后检查"
  echo -e "  --debug                  启用调试日志"
  echo -e "  -h, --help               显示帮助信息"
  echo -e "\n${GREEN}配置文件环境变量:${RESET}"
  echo -e "  SERVICE_NAME             服务名称"
  echo -e "  DEPLOY_ENV               部署环境"
  echo -e "  HEALTH_CHECK_URL         健康检查URL"
  echo -e "  HEALTH_CHECK_TIMEOUT     健康检查超时(秒)"
  echo -e "  HEALTH_CHECK_RETRIES     健康检查重试次数"
  echo -e "  AUTO_ROLLBACK            是否自动回滚(true/false)"
  echo -e "  DEPLOY_COMMAND           自定义部署命令"
  echo -e "  STOP_COMMAND             自定义停止命令"
  echo -e "  START_COMMAND            自定义启动命令"
  echo -e "  BACKUP_DIR               备份目录路径"
  echo -e "  SLACK_WEBHOOK            Slack通知webhook"
  echo -e "  DISCORD_WEBHOOK          Discord通知webhook"
  echo -e "  EMAIL_NOTIFICATION       邮件通知地址"
}

# 启动脚本
main "$@"
