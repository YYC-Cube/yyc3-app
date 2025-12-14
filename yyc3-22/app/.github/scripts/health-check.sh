#!/bin/bash
# === 脚本健康检查头 ===
set -euo pipefail  # 严格模式
trap "cleanup" EXIT INT TERM

# 服务健康检查脚本 v1.1.0
# 检查服务状态、端口监听、资源使用和依赖服务

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 默认值
PROJECT_ROOT=""
APP_ROOT=""
ENVIRONMENT="development"
SERVICES=()
PORT_PATTERNS=()
RESOURCE_THRESHOLDS=("85" "70" "90")  # 内存、CPU、磁盘使用率阈值
CHECK_TIMEOUT=30  # 检查超时时间（秒）
VERBOSE=false
SKIP_DEPENDENCY=false

# 日志函数
log() {
    local level=$1
    local message=$2
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    local level_color=$NC
    
    case $level in
        "INFO") level_color=$BLUE ;;
        "SUCCESS") level_color=$GREEN ;;
        "WARNING") level_color=$YELLOW ;;
        "ERROR") level_color=$RED ;;
        "DEBUG") 
            if [ "$VERBOSE" = true ]; then
                level_color=$PURPLE
                echo -e "${timestamp} [${level_color}${level}${NC}] ${message}"
            fi
            return 0
            ;;
    esac
    
    echo -e "${timestamp} [${level_color}${level}${NC}] ${message}"
}

# 清理函数
cleanup() {
    log "INFO" "执行健康检查清理操作..."
    # 清理临时文件等
    log "INFO" "清理完成"
}

# 显示帮助信息
show_help() {
    echo -e "\n${YELLOW}使用方法:${NC} $0 [选项]"
    echo -e "\n${GREEN}选项:${NC}"
    echo -e "  -p, --project-root <路径>   指定项目根目录"
    echo -e "  -e, --environment <环境>    指定环境 (development, staging, production)"
    echo -e "  -s, --service <服务名>      指定要检查的服务（可多次使用）"
    echo -e "  -P, --port <端口号/模式>     指定要检查的端口（可多次使用）"
    echo -e "  --verbose                   显示详细输出"
    echo -e "  --skip-dependency           跳过依赖服务检查"
    echo -e "  --timeout <秒>              设置检查超时时间"
    echo -e "  -h, --help                  显示帮助信息"
    echo -e "\n${GREEN}示例:${NC}"
    echo -e "  检查所有服务: $0"
    echo -e "  检查特定环境: $0 --environment staging"
    echo -e "  检查特定服务: $0 --service api --service admin"
    echo -e "  检查特定端口: $0 --port 3000 --port 8080"
}

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case "$1" in
        -p|--project-root)
            PROJECT_ROOT="$2"
            shift 2
            ;;
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -s|--service)
            SERVICES+=("$2")
            shift 2
            ;;
        -P|--port)
            PORT_PATTERNS+=("$2")
            shift 2
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --skip-dependency)
            SKIP_DEPENDENCY=true
            shift
            ;;
        --timeout)
            CHECK_TIMEOUT="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            log "ERROR" "未知选项 $1"
            show_help
            exit 1
            ;;
    esac
done

# 初始化项目根目录
init_project_root() {
    if [ -z "$PROJECT_ROOT" ]; then
        # 尝试从脚本路径推断项目根目录
        SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
        PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
    fi
    
    if [ ! -d "$PROJECT_ROOT" ]; then
        log "ERROR" "项目根目录不存在: $PROJECT_ROOT"
        exit 1
    fi
    
    APP_ROOT="$PROJECT_ROOT/app"
    
    log "INFO" "项目根目录: $PROJECT_ROOT"
    log "INFO" "应用根目录: $APP_ROOT"
    log "INFO" "检查环境: $ENVIRONMENT"
}

# 加载环境配置
load_environment_config() {
    log "INFO" "加载环境配置..."
    
    # 检查环境文件
    local env_file="$APP_ROOT/.env.$ENVIRONMENT"
    if [ -f "$env_file" ]; then
        log "INFO" "加载环境文件: $env_file"
        export $(grep -v '^#' "$env_file" | xargs)
    else
        log "WARNING" "未找到环境文件: $env_file"
    fi
    
    # 设置默认服务和端口
    if [ ${#SERVICES[@]} -eq 0 ]; then
        SERVICES=("api" "admin" "llm" "mail")
        log "INFO" "使用默认服务列表: ${SERVICES[*]}"
    fi
    
    # 设置默认端口模式
    if [ ${#PORT_PATTERNS[@]} -eq 0 ]; then
        case "$ENVIRONMENT" in
            "development")
                PORT_PATTERNS=("3000" "8000" "8080")
                ;;
            "staging")
                PORT_PATTERNS=("8001" "8081")
                ;;
            "production")
                PORT_PATTERNS=("80" "443" "8000")
                ;;
        esac
        log "INFO" "使用默认端口列表: ${PORT_PATTERNS[*]}"
    fi
}

# 检查系统资源
check_system_resources() {
    log "INFO" "检查系统资源使用情况..."
    local memory_threshold=${RESOURCE_THRESHOLDS[0]}
    local cpu_threshold=${RESOURCE_THRESHOLDS[1]}
    local disk_threshold=${RESOURCE_THRESHOLDS[2]}
    local issues_found=0
    
    # 检查内存使用
    if command -v free &> /dev/null; then
        local memory_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
        log "DEBUG" "内存使用率: ${memory_usage}% (阈值: ${memory_threshold}%)"
        
        if [ "$memory_usage" -gt "$memory_threshold" ]; then
            log "ERROR" "内存使用率过高: ${memory_usage}% (阈值: ${memory_threshold}%)"
            issues_found=$((issues_found + 1))
        else
            log "SUCCESS" "内存使用率正常: ${memory_usage}%"
        fi
    else
        log "WARNING" "无法检查内存使用情况，free 命令不可用"
    fi
    
    # 检查 CPU 使用
    if command -v top &> /dev/null; then
        local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{printf "%.0f", $2 + $4}')
        log "DEBUG" "CPU 使用率: ${cpu_usage}% (阈值: ${cpu_threshold}%)"
        
        if [ "$cpu_usage" -gt "$cpu_threshold" ]; then
            log "ERROR" "CPU 使用率过高: ${cpu_usage}% (阈值: ${cpu_threshold}%)"
            issues_found=$((issues_found + 1))
        else
            log "SUCCESS" "CPU 使用率正常: ${cpu_usage}%"
        fi
    else
        log "WARNING" "无法检查 CPU 使用情况，top 命令不可用"
    fi
    
    # 检查磁盘空间
    if command -v df &> /dev/null; then
        local disk_usage=$(df -h / | awk 'NR==2{print $5}' | sed 's/%//')
        log "DEBUG" "磁盘使用率: ${disk_usage}% (阈值: ${disk_threshold}%)"
        
        if [ "$disk_usage" -gt "$disk_threshold" ]; then
            log "ERROR" "磁盘使用率过高: ${disk_usage}% (阈值: ${disk_threshold}%)"
            issues_found=$((issues_found + 1))
        else
            log "SUCCESS" "磁盘使用率正常: ${disk_usage}%"
        fi
    else
        log "WARNING" "无法检查磁盘使用情况，df 命令不可用"
    fi
    
    # 检查系统负载
    if command -v uptime &> /dev/null; then
        local system_load=$(uptime | awk -F'load average: ' '{print $2}')
        log "SUCCESS" "系统负载: ${system_load}"
    else
        log "WARNING" "无法检查系统负载，uptime 命令不可用"
    fi
    
    if [ $issues_found -eq 0 ]; then
        log "SUCCESS" "系统资源检查通过"
        return 0
    else
        log "ERROR" "系统资源检查发现 $issues_found 个问题"
        return 1
    fi
}

# 检查进程状态
check_process_status() {
    log "INFO" "检查进程状态..."
    local issues_found=0
    
    for service in "${SERVICES[@]}"; do
        log "DEBUG" "检查服务进程: $service"
        
        # 查找进程
        local pids=$(pgrep -f "$service" | wc -l)
        
        if [ "$pids" -eq 0 ]; then
            log "ERROR" "服务进程未运行: $service"
            issues_found=$((issues_found + 1))
            
            # 检查 PID 文件
            local pid_file="/var/run/${service}.pid"
            if [ -f "$pid_file" ]; then
                log "WARNING" "发现 PID 文件但进程不存在: $pid_file"
                # 尝试清理 PID 文件
                rm -f "$pid_file" && log "INFO" "已清理过时的 PID 文件"
            fi
        else
            log "SUCCESS" "服务进程运行正常: $service (找到 $pids 个进程)"
            
            # 显示进程详细信息
            if [ "$VERBOSE" = true ]; then
                log "DEBUG" "进程详细信息:"
                ps -ef | grep "$service" | grep -v grep
            fi
        fi
    done
    
    if [ $issues_found -eq 0 ]; then
        log "SUCCESS" "进程状态检查通过"
        return 0
    else
        log "ERROR" "进程状态检查发现 $issues_found 个问题"
        return 1
    fi
}

# 检查端口监听
check_port_listening() {
    log "INFO" "检查端口监听状态..."
    local issues_found=0
    
    for port in "${PORT_PATTERNS[@]}"; do
        log "DEBUG" "检查端口: $port"
        
        # 检查端口是否在监听
        if command -v netstat &> /dev/null; then
            local port_status=$(netstat -tuln | grep -E ":$port\s+")
            if [ -n "$port_status" ]; then
                log "SUCCESS" "端口正在监听: $port"
                
                # 显示端口详细信息
                if [ "$VERBOSE" = true ]; then
                    log "DEBUG" "端口详细信息:"
                    echo "$port_status"
                fi
            else
                log "ERROR" "端口未在监听: $port"
                issues_found=$((issues_found + 1))
            fi
        elif command -v ss &> /dev/null; then
            local port_status=$(ss -tuln | grep -E ":$port\s+")
            if [ -n "$port_status" ]; then
                log "SUCCESS" "端口正在监听: $port"
                
                # 显示端口详细信息
                if [ "$VERBOSE" = true ]; then
                    log "DEBUG" "端口详细信息:"
                    echo "$port_status"
                fi
            else
                log "ERROR" "端口未在监听: $port"
                issues_found=$((issues_found + 1))
            fi
        else
            log "WARNING" "无法检查端口状态，netstat 和 ss 命令均不可用"
        fi
    done
    
    if [ $issues_found -eq 0 ]; then
        log "SUCCESS" "端口监听状态检查通过"
        return 0
    else
        log "ERROR" "端口监听状态检查发现 $issues_found 个问题"
        return 1
    fi
}

# 检查依赖服务
check_dependency_services() {
    if [ "$SKIP_DEPENDENCY" = true ]; then
        log "INFO" "跳过依赖服务检查"
        return 0
    fi
    
    log "INFO" "检查依赖服务..."
    local issues_found=0
    
    # 定义常见依赖服务
    local dependencies=(
        "redis"
        "postgres"
        "mysql"
        "mongodb"
    )
    
    for dep in "${dependencies[@]}"; do
        log "DEBUG" "检查依赖服务: $dep"
        
        # 检查服务状态
        if command -v systemctl &> /dev/null; then
            if systemctl is-active --quiet "$dep"; then
                log "SUCCESS" "依赖服务运行正常: $dep"
            else
                log "WARNING" "依赖服务未运行: $dep"
                # 非关键依赖，只警告不报错
            fi
        elif command -v service &> /dev/null; then
            if service "$dep" status | grep -q "running"; then
                log "SUCCESS" "依赖服务运行正常: $dep"
            else
                log "WARNING" "依赖服务未运行: $dep"
            fi
        else
            log "WARNING" "无法检查服务状态，systemctl 和 service 命令均不可用"
        fi
    done
    
    # 检查 Node.js 版本
    if command -v node &> /dev/null; then
        local node_version=$(node -v)
        log "SUCCESS" "Node.js 版本: $node_version"
    else
        log "ERROR" "Node.js 未安装或不可用"
        issues_found=$((issues_found + 1))
    fi
    
    # 检查 npm 版本
    if command -v npm &> /dev/null; then
        local npm_version=$(npm -v)
        log "SUCCESS" "npm 版本: $npm_version"
    else
        log "ERROR" "npm 未安装或不可用"
        issues_found=$((issues_found + 1))
    fi
    
    if [ $issues_found -eq 0 ]; then
        log "SUCCESS" "依赖服务检查通过"
        return 0
    else
        log "ERROR" "依赖服务检查发现 $issues_found 个问题"
        return 1
    fi
}

# 检查应用健康端点
check_application_health() {
    log "INFO" "检查应用健康端点..."
    local issues_found=0
    
    # 定义健康检查端点
    local health_endpoints=()
    
    case "$ENVIRONMENT" in
        "development")
            health_endpoints=("http://localhost:3000/api/health")
            ;;
        "staging")
            health_endpoints=("http://localhost:8001/api/health")
            ;;
        "production")
            health_endpoints=("http://localhost:8000/api/health")
            ;;
    esac
    
    # 添加自定义端点
    if [ -n "${HEALTH_ENDPOINTS:-}" ]; then
        IFS=',' read -ra custom_endpoints <<< "$HEALTH_ENDPOINTS"
        health_endpoints+=("${custom_endpoints[@]}")
    fi
    
    for endpoint in "${health_endpoints[@]}"; do
        log "DEBUG" "检查健康端点: $endpoint"
        
        # 使用 curl 或 wget 检查端点
        if command -v curl &> /dev/null; then
            if curl -s -o /dev/null -w "%{http_code}" --max-time "$CHECK_TIMEOUT" "$endpoint" | grep -q "^200"; then
                log "SUCCESS" "健康端点响应正常: $endpoint"
            else
                log "ERROR" "健康端点响应异常: $endpoint"
                issues_found=$((issues_found + 1))
            fi
        elif command -v wget &> /dev/null; then
            if wget -q -T "$CHECK_TIMEOUT" -O /dev/null "$endpoint"; then
                log "SUCCESS" "健康端点响应正常: $endpoint"
            else
                log "ERROR" "健康端点响应异常: $endpoint"
                issues_found=$((issues_found + 1))
            fi
        else
            log "WARNING" "无法检查健康端点，curl 和 wget 命令均不可用"
        fi
    done
    
    if [ $issues_found -eq 0 ]; then
        log "SUCCESS" "应用健康端点检查通过"
        return 0
    else
        log "ERROR" "应用健康端点检查发现 $issues_found 个问题"
        return 1
    fi
}

# 检查日志文件
check_log_files() {
    log "INFO" "检查日志文件..."
    local issues_found=0
    
    # 定义日志目录
    local log_dirs=(
        "$APP_ROOT/logs"
        "/var/log/app"
    )
    
    for log_dir in "${log_dirs[@]}"; do
        if [ -d "$log_dir" ]; then
            log "SUCCESS" "日志目录存在: $log_dir"
            
            # 检查错误日志
            local error_log="$log_dir/error.log"
            if [ -f "$error_log" ]; then
                local error_count=$(grep -i "error\|exception\|fail\|critical" "$error_log" | wc -l)
                if [ "$error_count" -gt 0 ]; then
                    log "WARNING" "错误日志中发现 $error_count 个错误记录: $error_log"
                    
                    # 显示最新错误
                    if [ "$VERBOSE" = true ]; then
                        log "DEBUG" "最新错误记录:"
                        grep -i "error\|exception\|fail\|critical" "$error_log" | tail -n 5
                    fi
                else
                    log "SUCCESS" "错误日志中未发现错误记录"
                fi
            else
                log "WARNING" "未找到错误日志文件: $error_log"
            fi
        else
            log "WARNING" "日志目录不存在: $log_dir"
        fi
    done
    
    if [ $issues_found -eq 0 ]; then
        log "SUCCESS" "日志文件检查通过"
        return 0
    else
        log "ERROR" "日志文件检查发现 $issues_found 个问题"
        return 1
    fi
}

# 生成健康报告
generate_health_report() {
    local checks_passed=0
    local checks_failed=0
    local all_passed=true
    
    # 执行各项检查
    check_system_resources
    if [ $? -eq 0 ]; then
        checks_passed=$((checks_passed + 1))
    else
        checks_failed=$((checks_failed + 1))
        all_passed=false
    fi
    
    check_process_status
    if [ $? -eq 0 ]; then
        checks_passed=$((checks_passed + 1))
    else
        checks_failed=$((checks_failed + 1))
        all_passed=false
    fi
    
    check_port_listening
    if [ $? -eq 0 ]; then
        checks_passed=$((checks_passed + 1))
    else
        checks_failed=$((checks_failed + 1))
        all_passed=false
    fi
    
    check_dependency_services
    if [ $? -eq 0 ]; then
        checks_passed=$((checks_passed + 1))
    else
        checks_failed=$((checks_failed + 1))
        all_passed=false
    fi
    
    check_application_health
    if [ $? -eq 0 ]; then
        checks_passed=$((checks_passed + 1))
    else
        checks_failed=$((checks_failed + 1))
        all_passed=false
    fi
    
    check_log_files
    if [ $? -eq 0 ]; then
        checks_passed=$((checks_passed + 1))
    else
        checks_failed=$((checks_failed + 1))
        all_passed=false
    fi
    
    # 生成报告
    log "INFO" "========================================"
    log "INFO" "            服务健康检查报告           "
    log "INFO" "========================================"
    log "INFO" "检查环境: $ENVIRONMENT"
    log "INFO" "检查时间: $(date +"%Y-%m-%d %H:%M:%S")"
    log "INFO" "检查项总数: 6"
    log "INFO" "通过项数: $checks_passed"
    log "INFO" "失败项数: $checks_failed"
    
    if [ "$all_passed" = true ]; then
        log "SUCCESS" "🎉 所有健康检查通过! 服务状态正常 ✅"
        return 0
    else
        log "ERROR" "🚨 健康检查未全部通过，发现 $checks_failed 个问题 ❌"
        return 1
    fi
}

# 主函数
main() {
    log "INFO" "========================================"
    log "INFO" "      服务健康检查脚本 v1.1.0         "
    log "INFO" "========================================"
    
    # 初始化项目根目录
    init_project_root
    
    # 加载环境配置
    load_environment_config
    
    # 生成健康报告
    generate_health_report
    local report_status=$?
    
    return $report_status
}

# 执行主函数
main
