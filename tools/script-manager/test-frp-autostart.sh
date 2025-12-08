#!/bin/bash
# =============================================================================
# FRP 自启动功能测试脚本
# =============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 测试结果统计
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0

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

log_test() {
    ((TESTS_TOTAL++))
    echo -e "${CYAN}[TEST]${NC} $1"
}

# 测试结果记录
record_result() {
    local test_name="$1"
    local result="$2"
    local details="$3"

    if [[ "$result" == "PASS" ]]; then
        ((TESTS_PASSED++))
        echo -e "  ${GREEN}✅ PASS${NC}: $test_name"
    else
        ((TESTS_FAILED++))
        echo -e "  ${RED}❌ FAIL${NC}: $test_name"
        [[ -n "$details" ]] && echo -e "    ${YELLOW}详情:${NC} $details"
    fi
}

# 显示测试标题
show_test_header() {
    echo -e "${CYAN}==============================================================================${NC}"
    echo -e "${CYAN}                  FRP 自启动功能测试${NC}"
    echo -e "${CYAN}==============================================================================${NC}"
    echo -e "${BLUE}测试时间: $(date "+%Y-%m-%d %H:%M:%S")${NC}"
    echo ""
}

# 测试FRP服务端自启动
test_server_autostart() {
    log_test "FRP服务端自启动配置"

    # 检查systemd服务文件
    if [[ -f "/etc/systemd/system/frps.service" ]]; then
        record_result "SystemD服务文件" "PASS"
    elif [[ -f "/etc/systemd/system/frp-server.service" ]]; then
        record_result "SystemD服务文件" "PASS" "(frp-server.service)"
    else
        record_result "SystemD服务文件" "FAIL" "服务文件不存在"
        return
    fi

    # 检查服务是否启用
    if systemctl is-enabled frps >/dev/null 2>&1; then
        record_result "服务自启动启用" "PASS"
    elif systemctl is-enabled frp-server >/dev/null 2>&1; then
        record_result "服务自启动启用" "PASS" "(frp-server)"
    else
        record_result "服务自启动启用" "FAIL" "服务未启用自启动"
    fi

    # 检查服务状态
    if systemctl is-active frps >/dev/null 2>&1; then
        record_result "服务运行状态" "PASS"
    elif systemctl is-active frp-server >/dev/null 2>&1; then
        record_result "服务运行状态" "PASS" "(frp-server)"
    else
        record_result "服务运行状态" "FAIL" "服务未运行"
    fi

    # 检查端口监听
    if netstat -tuln 2>/dev/null | grep -q ":17000 "; then
        record_result "端口监听" "PASS" "17000端口"
    else
        record_result "端口监听" "FAIL" "17000端口未监听"
    fi

    # 检查配置文件
    if [[ -f "/opt/frp/conf/frps.toml" ]]; then
        record_result "配置文件" "PASS" "/opt/frp/conf/frps.toml"
    else
        record_result "配置文件" "FAIL" "配置文件不存在"
    fi

    # 检查FRP进程
    if pgrep -f "frps" >/dev/null 2>&1; then
        record_result "FRPS进程" "PASS" "进程PID: $(pgrep -f 'frps' | head -1)"
    else
        record_result "FRPS进程" "FAIL" "进程未运行"
    fi
}

# 测试FRP客户端自启动
test_client_autostart() {
    log_test "FRP客户端自启动配置"

    # 检查systemd服务文件
    if [[ -f "/etc/systemd/system/frpc.service" ]]; then
        record_result "SystemD服务文件" "PASS"
    elif [[ -f "/etc/systemd/system/frp-client.service" ]]; then
        record_result "SystemD服务文件" "PASS" "(frp-client.service)"
    else
        record_result "SystemD服务文件" "FAIL" "服务文件不存在"
        return
    fi

    # 检查服务是否启用
    if systemctl is-enabled frpc >/dev/null 2>&1; then
        record_result "服务自启动启用" "PASS"
    elif systemctl is-enabled frp-client >/dev/null 2>&1; then
        record_result "服务自启动启用" "PASS" "(frp-client)"
    else
        record_result "服务自启动启用" "FAIL" "服务未启用自启动"
    fi

    # 检查服务状态
    if systemctl is-active frpc >/dev/null 2>&1; then
        record_result "服务运行状态" "PASS"
    elif systemctl is-active frp-client >/dev/null 2>&1; then
        record_result "服务运行状态" "PASS" "(frp-client)"
    else
        record_result "服务运行状态" "FAIL" "服务未运行"
    fi

    # 检查FRP进程
    if pgrep -f "frpc" >/dev/null 2>&1; then
        record_result "FRPC进程" "PASS" "进程PID: $(pgrep -f 'frpc' | head -1)"
    else
        record_result "FRPC进程" "FAIL" "进程未运行"
    fi

    # 检查配置文件
    if [[ -f "/opt/frpc/conf/frpc.toml" ]]; then
        record_result "配置文件" "PASS" "/opt/frpc/conf/frpc.toml"
    else
        record_result "配置文件" "FAIL" "配置文件不存在"
    fi

    # 检查日志文件
    if [[ -f "/opt/frpc/logs/frpc.log" ]]; then
        record_result "日志文件" "PASS" "/opt/frpc/logs/frpc.log"
        # 检查日志文件权限
        if [[ -r "/opt/frpc/logs/frpc.log" ]]; then
            record_result "日志文件权限" "PASS" "可读"
        else
            record_result "日志文件权限" "FAIL" "无读取权限"
        fi
    else
        record_result "日志文件" "FAIL" "日志文件不存在"
    fi
}

# 测试服务连通性
test_service_connectivity() {
    log_test "服务连通性测试"

    # 测试FRP服务端连接
    SERVER_IP="8.130.127.121"
    SERVER_PORT="17000"

    if timeout 5 bash -c "</dev/tcp/$SERVER_IP/$SERVER_PORT" 2>/dev/null; then
        record_result "服务端连接" "PASS" "$SERVER_IP:$SERVER_PORT"
    else
        record_result "服务端连接" "FAIL" "$SERVER_IP:$SERVER_PORT"
    fi

    # 测试本地服务
    local_services=("192.168.3.45:3000" "192.168.3.45:3001" "192.168.3.45:8000" "192.168.3.45:3003")

    for service in "${local_services[@]}"; do
        ip=$(echo $service | cut -d: -f1)
        port=$(echo $service | cut -d: -f2)

        case $port in
            3000) service_name="API服务" ;;
            3001) service_name="管理后台" ;;
            8000) service_name="AI服务" ;;
            3003) service_name="邮件服务" ;;
            *) service_name="服务($port)" ;;
        esac

        if timeout 3 bash -c "</dev/tcp/$ip/$port" 2>/dev/null; then
            record_result "本地服务-$service_name" "PASS" "$ip:$port"
        else
            record_result "本地服务-$service_name" "FAIL" "$ip:$port"
        fi
    done

    # 测试外网服务
    remote_services=("api.0379.email:5001" "admin.0379.email:5003" "llm.0379.email:5002" "mail.0379.email:5004" "nas.0379.email:5005")

    for service in "${remote_services[@]}"; do
        domain=$(echo $service | cut -d: -f1)
        port=$(echo $service | cut -d: -f2)

        case $port in
            5001) service_name="API服务" ;;
            5002) service_name="AI服务" ;;
            5003) service_name="管理后台" ;;
            5004) service_name="邮件服务" ;;
            5005) service_name="NAS管理" ;;
            *) service_name="服务($port)" ;;
        esac

        if timeout 10 curl -s --connect-timeout 5 "http://$domain:$port/health" >/dev/null 2>&1; then
            record_result "外网服务-$service_name" "PASS" "$domain:$port"
        else
            record_result "外网服务-$service_name" "FAIL" "$domain:$port"
        fi
    done
}

# 测试监控脚本
test_monitoring_scripts() {
    log_test "监控脚本功能"

    # 检查服务端监控脚本
    if [[ -f "/opt/frp/scripts/monitor.sh" ]]; then
        record_result "服务端监控脚本" "PASS" "/opt/frp/scripts/monitor.sh"
        # 检查脚本权限
        if [[ -x "/opt/frp/scripts/monitor.sh" ]]; then
            record_result "服务端监控脚本权限" "PASS"
        else
            record_result "服务端监控脚本权限" "FAIL" "无执行权限"
        fi
    else
        record_result "服务端监控脚本" "FAIL" "脚本文件不存在"
    fi

    # 检查客户端监控脚本
    if [[ -f "/opt/frpc/scripts/monitor.sh" ]]; then
        record_result "客户端监控脚本" "PASS" "/opt/frpc/scripts/monitor.sh"
        # 检查脚本权限
        if [[ -x "/opt/frpc/scripts/monitor.sh" ]]; then
            record_result "客户端监控脚本权限" "PASS"
        else
            record_result "客户端监控脚本权限" "FAIL" "无执行权限"
        fi
    else
        record_result "客户端监控脚本" "FAIL" "脚本文件不存在"
    fi

    # 检查健康检查脚本
    if [[ -f "/opt/frpc/scripts/health_check.sh" ]]; then
        record_result "健康检查脚本" "PASS" "/opt/frpc/scripts/health_check.sh"
        # 检查脚本权限
        if [[ -x "/opt/frpc/scripts/health_check.sh" ]]; then
            record_result "健康检查脚本权限" "PASS"
        else
            record_result "健康检查脚本权限" "FAIL" "无执行权限"
        fi
    else
        record_result "健康检查脚本" "FAIL" "健康检查脚本不存在"
    fi

    # 检查crontab配置
    if crontab -l 2>/dev/null | grep -q "monitor.sh"; then
        record_result "监控定时任务" "PASS" "已配置crontab"
    else
        record_result "监控定时任务" "FAIL" "未配置crontab"
    fi
}

# 测试日志轮转
test_log_rotation() {
    log_test "日志轮转配置"

    # 检查服务端日志轮转
    if [[ -f "/etc/logrotate.d/frps" ]]; then
        record_result "服务端日志轮转" "PASS" "/etc/logrotate.d/frps"
    elif [[ -f "/etc/logrotate.d/frp-server" ]]; then
        record_result "服务端日志轮转" "PASS" "/etc/logrotate.d/frp-server"
    else
        record_result "服务端日志轮转" "FAIL" "日志轮转配置不存在"
    fi

    # 检查客户端日志轮转
    if [[ -f "/etc/logrotate.d/frpc" ]]; then
        record_result "客户端日志轮转" "PASS" "/etc/logrotate.d/frpc"
    elif [[ -f "/etc/logrotate.d/frp-client" ]]; then
        record_result "客户端日志轮转" "PASS" "/etc/logrotate.d/frp-client"
    else
        record_result "客户端日志轮转" "FAIL" "日志轮转配置不存在"
    fi
}

# 测试防火墙配置
test_firewall() {
    log_test "防火墙配置"

    # 检查开放的FRP端口
    frp_ports=("17000" "7500" "9557")

    for port in "${frp_ports[@]}"; do
        if command -v ufw >/dev/null 2>&1; then
            # Ubuntu/Debian UFW
            if ufw status | grep -q "$port"; then
                record_result "UFW端口开放" "PASS" "端口$port"
            else
                record_result "UFW端口开放" "FAIL" "端口$port未开放"
            fi
        elif command -v firewall-cmd >/dev/null 2>&1; then
            # CentOS/RHEL firewalld
            if firewall-cmd --list-ports | grep -q "$port"; then
                record_result "FirewallD端口开放" "PASS" "端口$port"
            else
                record_result "FirewallD端口开放" "FAIL" "端口$port未开放"
            fi
        else
            record_result "防火墙检查" "WARN" "未检测到防火墙工具"
            break
        fi
    done
}

# 显示测试摘要
show_test_summary() {
    echo ""
    echo -e "${CYAN}==============================================================================${NC}"
    echo -e "${CYAN}                          测试结果摘要${NC}"
    echo -e "${CYAN}==============================================================================${NC}"
    echo -e "${BLUE}测试时间: $(date "+%Y-%m-%d %H:%M:%S")${NC}"
    echo ""

    # 显示测试统计
    echo -e "${YELLOW}测试统计:${NC}"
    echo -e "  总测试数: ${CYAN}$TESTS_TOTAL${NC}"

    if [[ $TESTS_PASSED -gt 0 ]]; then
        echo -e "  通过测试: ${GREEN}$TESTS_PASSED${NC}"
    fi

    if [[ $TESTS_FAILED -gt 0 ]]; then
        echo -e "  失败测试: ${RED}$TESTS_FAILED${NC}"
    fi

    # 计算通过率
    local pass_rate=0
    if [[ $TESTS_TOTAL -gt 0 ]]; then
        pass_rate=$((TESTS_PASSED * 100 / TESTS_TOTAL))
    fi

    if [[ $pass_rate -eq 100 ]]; then
        echo -e "  通过率: ${GREEN}$pass_rate%${NC} 🎉"
    elif [[ $pass_rate -ge 80 ]]; then
        echo -e "  通过率: ${YELLOW}$pass_rate%${NC} ⚠️"
    else
        echo -e "  通过率: ${RED}$pass_rate%${NC} ❌"
    fi

    echo ""

    # 显示状态
    if [[ $TESTS_FAILED -eq 0 ]]; then
        echo -e "${GREEN}🎉 所有测试通过！FRP自启动功能配置完成！${NC}"
    else
        echo -e "${RED}❌ 有 $TESTS_FAILED 个测试失败，请检查配置！${NC}"
        echo ""
        echo -e "${YELLOW}建议:${NC}"
        echo "1. 检查systemd服务配置"
        echo "2. 确认服务权限设置正确"
        echo "3. 验证防火墙规则配置"
        echo "4. 检查日志文件权限"
        echo "5. 重新运行自启动配置脚本"
    fi

    echo ""
}

# 主函数
main() {
    # 检查是否为root用户
    if [[ $EUID -ne 0 ]]; then
        log_error "此脚本需要root权限运行"
        exit 1
    fi

    show_test_header

    # 执行测试
    test_server_autostart
    test_client_autostart
    test_service_connectivity
    test_monitoring_scripts
    test_log_rotation
    test_firewall

    show_test_summary

    # 返回适当的退出码
    if [[ $TESTS_FAILED -eq 0 ]]; then
        exit 0
    else
        exit 1
    fi
}

# 运行主函数
main "$@"