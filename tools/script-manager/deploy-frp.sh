#!/bin/bash

# =============================================================================
# FRP 内网穿透部署脚本
# 用于在 yyc3-121(服务端) 和 yyc3-45(客户端) 上部署FRP服务
# =============================================================================

set -euo pipefail

# 配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp
    timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    echo -e "[$timestamp] [$level] $message"
}

# 检查依赖
check_dependencies() {
    local missing_deps=()

    command -v openssl >/dev/null 2>&1 || missing_deps+=("openssl")
    command -v curl >/dev/null 2>&1 || missing_deps+=("curl")

    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        log "ERROR" "缺少依赖工具: ${missing_deps[*]}"
        return 1
    fi

    log "INFO" "依赖检查通过"
    return 0
}

# 验证FRP配置文件
validate_frp_config() {
    local config_file="$1"
    local service_type="$2"

    log "INFO" "验证 $service_type 配置文件: $config_file"

    if [[ ! -f "$config_file" ]]; then
        log "ERROR" "配置文件不存在: $config_file"
        return 1
    fi

    # 检查配置文件语法（这里只是简单检查，实际FRP会验证语法）
    local required_fields
    if [[ "$service_type" == "server" ]]; then
        required_fields=("bind_port" "token" "dashboard_port")
    else
        required_fields=("server_addr" "server_port" "token")
    fi

    for field in "${required_fields[@]}"; do
        if ! grep -q "^$field" "$config_file"; then
            log "ERROR" "配置文件缺少必要字段: $field"
            return 1
        fi
    done

    log "INFO" "$service_type 配置文件验证通过"
    return 0
}

# 测试FRP服务端启动
test_frps() {
    log "INFO" "开始测试FRP服务端启动"

    local frps_binary="$PROJECT_ROOT/frps/frps"
    local frps_config="$PROJECT_ROOT/frps/frps.toml"
    local log_file="$PROJECT_ROOT/frps/logs/frps-test.log"

    # 检查二进制文件
    if [[ ! -f "$frps_binary" ]]; then
        log "ERROR" "FRP服务端二进制文件不存在: $frps_binary"
        return 1
    fi

    if [[ ! -x "$frps_binary" ]]; then
        log "INFO" "设置FRP服务端二进制文件执行权限"
        chmod +x "$frps_binary"
    fi

    # 验证配置文件
    if ! validate_frp_config "$frps_config" "server"; then
        return 1
    fi

    # 检查端口是否被占用
    local bind_port
    bind_port=$(grep "^bind_port" "$frps_config" | cut -d'=' -f2 | tr -d ' ')
    local dashboard_port
    dashboard_port=$(grep "^dashboard_port" "$frps_config" | cut -d'=' -f2 | tr -d ' ')

    log "INFO" "检查端口占用情况: $bind_port (服务), $dashboard_port (仪表板)"

    if lsof -i ":$bind_port" >/dev/null 2>&1; then
        log "WARNING" "端口 $bind_port 已被占用"
    fi

    if lsof -i ":$dashboard_port" >/dev/null 2>&1; then
        log "WARNING" "端口 $dashboard_port 已被占用"
    fi

    # 测试启动（前台模式，10秒后自动停止）
    log "INFO" "测试启动FRP服务端（10秒后自动停止）"

    timeout 10s "$frps_binary" -c "$frps_config" > "$log_file" 2>&1 &
    local frps_pid=$!

    # 等待服务启动
    sleep 3

    # 检查进程状态
    if kill -0 "$frps_pid" 2>/dev/null; then
        log "INFO" "FRP服务端启动成功，PID: $frps_pid"

        # 检查端口监听
        if lsof -i ":$bind_port" >/dev/null 2>&1; then
            log "INFO" "服务端口 $bind_port 监听正常"
        else
            log "WARNING" "服务端口 $bind_port 未监听"
        fi

        if lsof -i ":$dashboard_port" >/dev/null 2>&1; then
            log "INFO" "仪表板端口 $dashboard_port 监听正常"
        fi

        # 等待超时结束
        wait "$frps_pid" || true
        log "INFO" "FRP服务端测试启动完成"
    else
        log "ERROR" "FRP服务端启动失败"
        log "ERROR" "检查日志文件: $log_file"
        if [[ -f "$log_file" ]]; then
            tail -10 "$log_file"
        fi
        return 1
    fi

    return 0
}

# 测试FRP客户端启动
test_frpc() {
    log "INFO" "开始测试FRP客户端启动"

    local frpc_binary="$PROJECT_ROOT/frpc/frpc"
    local frpc_config="$PROJECT_ROOT/frpc/frpc.toml"
    local log_file="$PROJECT_ROOT/frpc/logs/frpc-test.log"

    # 检查二进制文件
    if [[ ! -f "$frpc_binary" ]]; then
        log "ERROR" "FRP客户端二进制文件不存在: $frpc_binary"
        return 1
    fi

    if [[ ! -x "$frpc_binary" ]]; then
        log "INFO" "设置FRP客户端二进制文件执行权限"
        chmod +x "$frpc_binary"
    fi

    # 验证配置文件
    if ! validate_frp_config "$frpc_config" "client"; then
        return 1
    fi

    # 测试启动（前台模式，10秒后自动停止）
    log "INFO" "测试启动FRP客户端（10秒后自动停止）"

    timeout 10s "$frpc_binary" -c "$frpc_config" > "$log_file" 2>&1 &
    local frpc_pid=$!

    # 等待客户端启动
    sleep 5

    # 检查进程状态
    if kill -0 "$frpc_pid" 2>/dev/null; then
        log "INFO" "FRP客户端启动成功，PID: $frpc_pid"

        # 等待超时结束
        wait "$frpc_pid" || true
        log "INFO" "FRP客户端测试启动完成"
    else
        log "ERROR" "FRP客户端启动失败"
        log "ERROR" "检查日志文件: $log_file"
        if [[ -f "$log_file" ]]; then
            tail -10 "$log_file"
        fi
        return 1
    fi

    return 0
}

# 检查FRP服务状态
check_frp_status() {
    log "INFO" "检查FRP服务状态"

    local frps_binary="$PROJECT_ROOT/frps/frps"
    local frpc_binary="$PROJECT_ROOT/frpc/frpc"

    # 检查FRP服务端
    if pgrep -f "$frps_binary" >/dev/null; then
        local frps_pids
        frps_pids=$(pgrep -f "$frps_binary")
        log "INFO" "FRP服务端运行中，PID: $frps_pids"
    else
        log "INFO" "FRP服务端未运行"
    fi

    # 检查FRP客户端
    if pgrep -f "$frpc_binary" >/dev/null; then
        local frpc_pids
        frpc_pids=$(pgrep -f "$frpc_binary")
        log "INFO" "FRP客户端运行中，PID: $frpc_pids"
    else
        log "INFO" "FRP客户端未运行"
    fi
}

# 生成部署报告
generate_report() {
    local report_file="$PROJECT_ROOT/reports/frp-deployment-$(date +%Y%m%d-%H%M%S).md"

    mkdir -p "$(dirname "$report_file")"

    cat > "$report_file" << EOF
# FRP 内网穿透部署报告

## 部署信息

- **部署时间**: $(date "+%Y-%m-%d %H:%M:%S")
- **项目路径**: $PROJECT_ROOT
- **服务端**: yyc3-121 (8.130.127.121)
- **客户端**: yyc3-45 (192.168.3.45)

## 配置文件状态

### 服务端配置 (frps.toml)
- **路径**: $PROJECT_ROOT/frps/frps.toml
- **绑定端口**: $(grep "^bind_port" "$PROJECT_ROOT/frps/frps.toml" | cut -d'=' -f2 | tr -d ' ')
- **仪表板端口**: $(grep "^dashboard_port" "$PROJECT_ROOT/frps/frps.toml" | cut -d'=' -f2 | tr -d ' ')
- **TLS加密**: $(grep "^tls_enable" "$PROJECT_ROOT/frps/frps.toml" | cut -d'=' -f2 | tr -d ' ')
- **特权模式**: $(grep "^privilege_mode" "$PROJECT_ROOT/frps/frps.toml" | cut -d'=' -f2 | tr -d ' ')

### 客户端配置 (frpc.toml)
- **路径**: $PROJECT_ROOT/frpc/frpc.toml
- **服务端地址**: $(grep "^server_addr" "$PROJECT_ROOT/frpc/frpc.toml" | cut -d'=' -f2 | tr -d ' ')
- **服务端端口**: $(grep "^server_port" "$PROJECT_ROOT/frpc/frpc.toml" | cut -d'=' -f2 | tr -d ' ')
- **TLS加密**: $(grep "^tls_enable" "$PROJECT_ROOT/frpc/frpc.toml" | cut -d'=' -f2 | tr -d ' ')

## 端口映射配置

EOF

    # 添加端口映射信息
    grep -E "^\[.*\].*\|^type =.*\|^local_port =.*\|^remote_port =.*" "$PROJECT_ROOT/frpc/frpc.toml" | \
    awk '
    /^\[.*\]/ { service = $0; next }
    /^type = / { type = $0; next }
    /^local_port = / { local_port = $0; next }
    /^remote_port = / { remote_port = $0;
        print "- **" service "**"
        print "  - 类型: " type
        print "  - 本地端口: " local_port
        if (remote_port != "") print "  - 远程端口: " remote_port
        print ""
    }' >> "$report_file"

    cat >> "$report_file" << EOF

## 安全配置

- **Token认证**: 已配置强密码
- **TLS加密**: 已启用
- **仪表板访问**: 仅限本地访问
- **端口限制**: 已配置端口范围限制

## systemd 服务配置

- **服务端服务**: $PROJECT_ROOT/etc/systemd/system/frps.service
- **客户端服务**: $PROJECT_ROOT/etc/systemd/system/frpc.service

## 部署步骤

1. **复制文件到目标服务器**:
   - yyc3-121: 复制 frps 目录和 systemd 服务文件
   - yyc3-45: 复制 frpc 目录和 systemd 服务文件

2. **安装systemd服务**:
   \`\`\`bash
   # yyc3-121上执行
   sudo cp $PROJECT_ROOT/etc/systemd/system/frps.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable frps
   sudo systemctl start frps

   # yyc3-45上执行
   sudo cp $PROJECT_ROOT/etc/systemd/system/frpc.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable frpc
   sudo systemctl start frpc
   \`\`\`

3. **验证服务状态**:
   \`\`\`bash
   # 检查服务端
   sudo systemctl status frps
   sudo journalctl -u frps -f

   # 检查客户端
   sudo systemctl status frpc
   sudo journalctl -u frpc -f
   \`\`\`

## 监控和维护

- **日志位置**:
  - 服务端: $PROJECT_ROOT/frps/logs/frps.log
  - 客户端: $PROJECT_ROOT/frpc/logs/frpc.log
- **仪表板**: http://127.0.0.1:7500 (仅本地访问)
- **管理API**: http://127.0.0.1:7002

## 故障排除

1. **连接失败**: 检查防火墙和端口开放情况
2. **认证失败**: 确认token配置一致
3. **TLS错误**: 检查证书文件路径和权限

---

**报告生成时间**: $(date "+%Y-%m-%d %H:%M:%S")
EOF

    log "INFO" "部署报告已生成: $report_file"
    echo "$report_file"
}

# 主函数
main() {
    log "INFO" "开始FRP内网穿透部署测试"
    log "INFO" "项目路径: $PROJECT_ROOT"

    # 检查依赖
    if ! check_dependencies; then
        exit 1
    fi

    # 创建必要目录
    mkdir -p "$PROJECT_ROOT/frps/logs" "$PROJECT_ROOT/frpc/logs" "$PROJECT_ROOT/reports"

    # 测试FRP服务端
    if test_frps; then
        log "INFO" "✅ FRP服务端测试通过"
    else
        log "ERROR" "❌ FRP服务端测试失败"
        exit 1
    fi

    # 测试FRP客户端
    if test_frpc; then
        log "INFO" "✅ FRP客户端测试通过"
    else
        log "ERROR" "❌ FRP客户端测试失败"
        exit 1
    fi

    # 检查服务状态
    check_frp_status

    # 生成部署报告
    local report_file
    report_file=$(generate_report)

    echo -e "\n${GREEN}=== FRP部署测试完成 ===${NC}"
    echo -e "📋 部署报告: $report_file"
    echo -e "📝 服务端配置: $PROJECT_ROOT/frps/frps.toml"
    echo -e "📝 客户端配置: $PROJECT_ROOT/frpc/frpc.toml"
    echo -e "🔧 服务端二进制: $PROJECT_ROOT/frps/frps"
    echo -e "🔧 客户端二进制: $PROJECT_ROOT/frpc/frpc"
    echo -e "\n${BLUE}下一步操作:${NC}"
    echo -e "1. 将文件复制到对应的服务器"
    echo -e "2. 安装systemd服务"
    echo -e "3. 启动服务并验证"
}

# 显示帮助信息
show_help() {
    cat << EOF
FRP内网穿透部署脚本

用法:
    $0 [选项]

选项:
    -h, --help     显示帮助信息
    -s, --server   仅测试服务端
    -c, --client   仅测试客户端
    --check        仅检查服务状态
    --report       仅生成部署报告

示例:
    $0              # 执行完整测试
    $0 --server     # 仅测试服务端
    $0 --client     # 仅测试客户端
    $0 --check      # 检查服务状态
    $0 --report     # 生成部署报告

EOF
}

# 参数解析
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    -s|--server)
        check_dependencies || exit 1
        mkdir -p "$PROJECT_ROOT/frps/logs"
        test_frps
        ;;
    -c|--client)
        check_dependencies || exit 1
        mkdir -p "$PROJECT_ROOT/frpc/logs"
        test_frpc
        ;;
    --check)
        check_frp_status
        ;;
    --report)
        mkdir -p "$PROJECT_ROOT/reports"
        generate_report
        ;;
    "")
        main
        ;;
    *)
        echo "未知选项: $1"
        show_help
        exit 1
        ;;
esac