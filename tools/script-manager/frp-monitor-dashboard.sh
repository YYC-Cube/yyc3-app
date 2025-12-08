#!/bin/bash
# =============================================================================
# FRP 综合监控面板脚本
# 用于监控FRP服务端和客户端的运行状态
# =============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 配置变量
SERVER_IP="8.130.127.121"
SERVER_PORT="17000"
SERVER_DASHBOARD="http://127.0.0.1:7500"
CLIENT_DASHBOARD="http://127.0.0.1:7400"
LOCAL_SERVICES=("192.168.3.45:3000" "192.168.3.45:3001" "192.168.3.45:8000" "192.168.3.45:3003" "192.168.3.45:22")
REMOTE_SERVICES=("api.0379.email:5001" "admin.0379.email:5003" "llm.0379.email:5002" "mail.0379.email:5004" "nas.0379.email:5005")

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 清屏函数
clear_screen() {
    clear
}

# 显示标题
show_header() {
    echo -e "${CYAN}==============================================================================${NC}"
    echo -e "${CYAN}                    FRP 综合监控面板${NC}"
    echo -e "${CYAN}==============================================================================${NC}"
    echo -e "${BLUE}检查时间: $(date "+%Y-%m-%d %H:%M:%S")${NC}"
    echo -e "${BLUE}监控服务器: $SERVER_IP:$SERVER_PORT${NC}"
    echo ""
}

# 检查FRP服务端状态
check_server_status() {
    echo -e "${YELLOW}📡 FRP服务端状态${NC}"
    echo "----------------------------------------"

    # 检查服务器连接
    if timeout 5 bash -c "</dev/tcp/$SERVER_IP/$SERVER_PORT"; then
        echo -e "服务器连接: ${GREEN}✅ 正常${NC} ($SERVER_IP:$SERVER_PORT)"
    else
        echo -e "服务器连接: ${RED}❌ 失败${NC} ($SERVER_IP:$SERVER_PORT)"
        return 1
    fi

    # 检查本地FRPS进程
    if pgrep -f "frps" > /dev/null; then
        echo -e "FRPS进程: ${GREEN}✅ 运行中${NC} (PID: $(pgrep -f 'frps' | head -1))"
    else
        echo -e "FRPS进程: ${RED}❌ 未运行${NC}"
    fi

    # 检查systemd服务状态
    if command -v systemctl >/dev/null 2>&1; then
        if systemctl is-active --quiet frps 2>/dev/null; then
            echo -e "系统服务: ${GREEN}✅ frps 运行中${NC}"
        elif systemctl is-active --quiet frp-server 2>/dev/null; then
            echo -e "系统服务: ${GREEN}✅ frp-server 运行中${NC}"
        else
            echo -e "系统服务: ${RED}❌ 服务未运行${NC}"
        fi
    fi

    echo ""
}

# 检查FRP客户端状态
check_client_status() {
    echo -e "${YELLOW}🔌 FRP客户端状态${NC}"
    echo "----------------------------------------"

    # 检查本地FRPC进程
    if pgrep -f "frpc" > /dev/null; then
        echo -e "FRPC进程: ${GREEN}✅ 运行中${NC} (PID: $(pgrep -f 'frpc' | head -1))"
    else
        echo -e "FRPC进程: ${RED}❌ 未运行${NC}"
    fi

    # 检查systemd服务状态
    if command -v systemctl >/dev/null 2>&1; then
        if systemctl is-active --quiet frpc 2>/dev/null; then
            echo -e "系统服务: ${GREEN}✅ frpc 运行中${NC}"
        elif systemctl is-active --quiet frp-client 2>/dev/null; then
            echo -e "系统服务: ${GREEN}✅ frp-client 运行中${NC}"
        else
            echo -e "系统服务: ${RED}❌ 服务未运行${NC}"
        fi
    fi

    # 检查客户端管理面板
    if curl -s --max-time 3 "$CLIENT_DASHBOARD" >/dev/null; then
        echo -e "管理面板: ${GREEN}✅ 可访问${NC} ($CLIENT_DASHBOARD)"
    else
        echo -e "管理面板: ${RED}❌ 不可访问${NC} ($CLIENT_DASHBOARD)"
    fi

    echo ""
}

# 检查本地服务状态
check_local_services() {
    echo -e "${YELLOW}🏠 本地服务状态${NC}"
    echo "----------------------------------------"

    for service in "${LOCAL_SERVICES[@]}"; do
        ip=$(echo $service | cut -d: -f1)
        port=$(echo $service | cut -d: -f2)

        # 根据端口确定服务名称
        case $port in
            3000) service_name="API服务" ;;
            3001) service_name="管理后台" ;;
            8000) service_name="AI服务" ;;
            3003) service_name="邮件服务" ;;
            22) service_name="SSH服务" ;;
            *) service_name="服务($port)" ;;
        esac

        if timeout 3 bash -c "</dev/tcp/$ip/$port"; then
            echo -e "$service_name: ${GREEN}✅ 可达${NC} ($ip:$port)"
        else
            echo -e "$service_name: ${RED}❌ 不可达${NC} ($ip:$port)"
        fi
    done

    echo ""
}

# 检查外网服务状态
check_remote_services() {
    echo -e "${YELLOW}🌐 外网服务状态${NC}"
    echo "----------------------------------------"

    for service in "${REMOTE_SERVICES[@]}"; do
        domain=$(echo $service | cut -d: -f1)
        port=$(echo $service | cut -d: -f2)

        # 根据端口确定服务名称
        case $port in
            5001) service_name="API服务" ;;
            5002) service_name="AI服务" ;;
            5003) service_name="管理后台" ;;
            5004) service_name="邮件服务" ;;
            5005) service_name="NAS管理" ;;
            *) service_name="服务($port)" ;;
        esac

        # 使用curl检查外网连接
        if timeout 10 curl -s --connect-timeout 5 "http://$domain:$port/health" >/dev/null 2>&1; then
            echo -e "$service_name: ${GREEN}✅ 可访问${NC} ($domain:$port)"
        else
            echo -e "$service_name: ${RED}❌ 不可访问${NC} ($domain:$port)"
        fi
    done

    echo ""
}

# 显示系统资源使用情况
show_system_resources() {
    echo -e "${YELLOW}💻 系统资源使用${NC}"
    echo "----------------------------------------"

    # CPU使用率
    cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
    echo -e "CPU使用率: ${YELLOW}$cpu_usage%${NC}"

    # 内存使用率
    mem_info=$(free -h | grep "Mem:")
    mem_used=$(echo $mem_info | awk '{print $3}')
    mem_total=$(echo $mem_info | awk '{print $2}')
    echo -e "内存使用: ${YELLOW}$mem_used / $mem_total${NC}"

    # 磁盘使用率
    disk_usage=$(df -h / | tail -1 | awk '{print $5}')
    echo -e "磁盘使用: ${YELLOW}$disk_usage${NC}"

    # 网络连接数
    connections=$(netstat -an 2>/dev/null | grep ":ESTABLISHED" | wc -l)
    echo -e "网络连接: ${YELLOW}$connections${NC}"

    # 系统负载
    if [[ -f "/proc/loadavg" ]]; then
        load_avg=$(cat /proc/loadavg | awk '{print $1}')
        echo -e "系统负载: ${YELLOW}$load_avg${NC}"
    fi

    echo ""
}

# 显示FRP日志摘要
show_log_summary() {
    echo -e "${YELLOW}📝 FRP日志摘要${NC}"
    echo "----------------------------------------"

    # 服务端日志
    if [[ -f "/opt/frp/logs/frps.log" ]]; then
        echo -e "服务端日志 (${CYAN}/opt/frp/logs/frps.log${NC}):"
        error_count=$(grep -c "ERROR" /opt/frp/logs/frps.log 2>/dev/null || echo "0")
        warning_count=$(grep -c "WARNING" /opt/frp/logs/frps.log 2>/dev/null || echo "0")
        echo -e "  错误: ${RED}$error_count${NC}, 警告: ${YELLOW}$warning_count${NC}"

        if [[ $error_count -gt 0 || $warning_count -gt 0 ]]; then
            echo "  最近的错误/警告:"
            grep -E "(ERROR|WARNING)" /opt/frp/logs/frps.log | tail -5 | sed 's/^/    /'
        fi
    else
        echo -e "服务端日志: ${RED}文件不存在${NC}"
    fi

    echo ""

    # 客户端日志
    if [[ -f "/opt/frpc/logs/frpc.log" ]]; then
        echo -e "客户端日志 (${CYAN}/opt/frpc/logs/frpc.log${NC}):"
        error_count=$(grep -c "ERROR" /opt/frpc/logs/frpc.log 2>/dev/null || echo "0")
        warning_count=$(grep -c "WARNING" /opt/frpc/logs/frpc.log 2>/dev/null || echo "0")
        echo -e "  错误: ${RED}$error_count${NC}, 警告: ${YELLOW}$warning_count${NC}"

        if [[ $error_count -gt 0 || $warning_count -gt 0 ]]; then
            echo "  最近的错误/警告:"
            grep -E "(ERROR|WARNING)" /opt/frpc/logs/frpc.log | tail -5 | sed 's/^/    /'
        fi
    else
        echo -e "客户端日志: ${RED}文件不存在${NC}"
    fi

    echo ""
}

# 显示连接统计
show_connection_stats() {
    echo -e "${YELLOW}📊 连接统计${NC}"
    echo "----------------------------------------"

    # 统计ESTABLISHED连接
    established=$(netstat -an 2>/dev/null | grep ":ESTABLISHED" | wc -l)
    echo -e "已建立连接: ${YELLOW}$established${NC}"

    # 统计监听端口
    listening=$(netstat -an 2>/dev/null | grep ":LISTEN" | wc -l)
    echo -e "监听端口数: ${YELLOW}$listening${NC}"

    # 统计TIME_WAIT连接
    time_wait=$(netstat -an 2>/dev/null | grep ":TIME_WAIT" | wc -l)
    echo -e "TIME_WAIT连接: ${YELLOW}$time_wait${NC}"

    # 显示FRP相关连接
    echo ""
    echo "FRP相关连接:"
    netstat -an 2>/dev/null | grep -E "(17000|5001|5002|5003|5004|5005|5006)" | \
        awk '{print $1 " " $4 " " $6}' | while read state local_ip remote_ip; do
        if [[ "$state" == "ESTABLISHED" ]]; then
            color=$GREEN
        else
            color=$YELLOW
        fi
        echo -e "  $color$state${NC} $local_ip → $remote_ip"
    done

    echo ""
}

# 显示管理命令
show_management_commands() {
    echo -e "${YELLOW}🛠️ 管理命令${NC}"
    echo "----------------------------------------"
    echo -e "${BLUE}服务端管理:${NC}"
    echo "  启动: systemctl start frps 或 systemctl start frp-server"
    echo "  停止: systemctl stop frps 或 systemctl stop frp-server"
    echo "  重启: systemctl restart frps 或 systemctl restart frp-server"
    echo "  状态: systemctl status frps 或 systemctl status frp-server"
    echo "  日志: journalctl -u frps -f 或 journalctl -u frp-server -f"
    echo "  面板: http://127.0.0.1:7500 (用户: frp_admin)"
    echo ""
    echo -e "${BLUE}客户端管理:${NC}"
    echo "  启动: systemctl start frpc 或 systemctl start frp-client"
    echo "  停止: systemctl stop frpc 或 systemctl stop frp-client"
    echo "  重启: systemctl restart frpc 或 systemctl restart frp-client"
    echo "  状态: systemctl status frpc 或 systemctl status frp-client"
    echo "  日志: journalctl -u frpc -f 或 journalctl -u frp-client -f"
    echo "  面板: http://127.0.0.1:7400 (用户: frp_admin)"
    echo ""
    echo -e "${BLUE}手动执行:${NC}"
    echo "  服务端: /opt/frp/bin/frps -c /opt/frp/conf/frps.toml"
    echo "  客户端: /opt/frpc/bin/frpc -c /opt/frpc/conf/frpc.toml"
    echo "  健康检查: /opt/frpc/scripts/health_check.sh"
    echo ""
}

# 交互式菜单
interactive_menu() {
    while true; do
        clear_screen
        show_header

        echo -e "${CYAN}请选择操作:${NC}"
        echo "1) 完整状态检查"
        echo "2) 仅检查服务状态"
        echo "3) 仅检查本地服务"
        echo "4) 仅检查外网服务"
        echo "5) 系统资源监控"
        echo "6) 日志摘要"
        echo "7) 连接统计"
        echo "8) 显示管理命令"
        echo "9) 持续监控模式"
        echo "0) 退出"
        echo ""
        read -p "请输入选项 [0-9]: " choice

        case $choice in
            1)
                check_server_status
                check_client_status
                check_local_services
                check_remote_services
                show_system_resources
                show_log_summary
                show_connection_stats
                ;;
            2)
                check_server_status
                check_client_status
                ;;
            3)
                check_local_services
                ;;
            4)
                check_remote_services
                ;;
            5)
                show_system_resources
                ;;
            6)
                show_log_summary
                ;;
            7)
                show_connection_stats
                ;;
            8)
                show_management_commands
                ;;
            9)
                echo -e "${BLUE}进入持续监控模式 (按 Ctrl+C 退出)${NC}"
                echo ""
                while true; do
                    clear_screen
                    show_header
                    check_server_status
                    check_client_status
                    check_local_services
                    check_remote_services
                    show_system_resources
                    echo -e "${CYAN}下次检查: $(date "+%Y-%m-%d %H:%M:%S")${NC}"
                    sleep 10
                done
                ;;
            0)
                echo "退出监控面板"
                exit 0
                ;;
            *)
                echo -e "${RED}无效选项，请重新输入${NC}"
                sleep 2
                ;;
        esac

        echo ""
        read -p "按回车键继续..."
    done
}

# 主函数
main() {
    # 检查是否有命令行参数
    if [[ $# -eq 0 ]]; then
        interactive_menu
    else
        # 命令行模式
        clear_screen
        show_header

        case "$1" in
            "server")
                check_server_status
                ;;
            "client")
                check_client_status
                ;;
            "local")
                check_local_services
                ;;
            "remote")
                check_remote_services
                ;;
            "resources")
                show_system_resources
                ;;
            "logs")
                show_log_summary
                ;;
            "connections")
                show_connection_stats
                ;;
            "commands")
                show_management_commands
                ;;
            "full")
                check_server_status
                check_client_status
                check_local_services
                check_remote_services
                show_system_resources
                show_log_summary
                show_connection_stats
                ;;
            *)
                echo "用法: $0 [server|client|local|remote|resources|logs|connections|commands|full]"
                echo "  server    - 检查FRP服务端状态"
                echo "  client    - 检查FRP客户端状态"
                echo "  local     - 检查本地服务状态"
                echo "  remote    - 检查外网服务状态"
                echo "  resources - 显示系统资源使用"
                echo "  logs      - 显示日志摘要"
                echo "  connections- 显示连接统计"
                echo "  commands  - 显示管理命令"
                echo "  full      - 完整状态检查"
                echo "  无参数    - 进入交互式菜单"
                exit 1
                ;;
        esac
    fi
}

# 检查必要的工具
check_dependencies() {
    for cmd in curl timeout netstat pgrep; do
        if ! command -v "$cmd" >/dev/null 2>&1; then
            echo -e "${RED}错误: 缺少必要工具 $cmd${NC}"
            exit 1
        fi
    done
}

# 执行检查
check_dependencies

# 运行主函数
main "$@"