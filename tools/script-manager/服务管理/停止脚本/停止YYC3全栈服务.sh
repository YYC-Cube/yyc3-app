#!/bin/bash

# YYC3全栈服务停止脚本
# 优雅停止所有YYC3平台服务
# 创建时间: 2025-12-08

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# 服务配置
SERVICES=(
    "6600:API服务"
    "6601:管理后台"
    "6602:LLM服务"
    "6603:邮件服务"
    "6604:AI服务"
    "6605:应用服务"
    "6606:Redis服务"
)

# 服务进程名称
PROCESS_PATTERNS=(
    "dynamic-api-server.js"
    "dynamic-admin-server.js"
    "dynamic-llm-server.js"
    "dynamic-mail-server.js"
    "dynamic-ai-fcp-server.js"
    "dynamic-app-server.js"
    "dynamic-redis-server.js"
)

echo -e "${CYAN}🛑 YYC3全栈服务停止器${NC}"
echo "=================================="
echo ""

# 检查端口是否被占用
check_port() {
    local port=$1
    if lsof -i :$port > /dev/null 2>&1; then
        return 1  # 端口被占用
    else
        return 0  # 端口可用
    fi
}

# 查找进程ID
find_process() {
    local pattern=$1
    local pid=$(pgrep -f "$pattern" | head -1)
    echo "$pid"
}

# 优雅停止单个服务
stop_service() {
    local port=$1
    local name=$2
    local pattern=$3

    echo -e "${BLUE}🔄 停止 $name (端口: $port)...${NC}"

    # 检查端口是否被占用
    if check_port $port; then
        echo -e "${YELLOW}⚠️ $name 未运行${NC}"
        return 0
    fi

    # 查找进程
    local pid=$(find_process "$pattern")

    if [ -z "$pid" ]; then
        echo -e "${YELLOW}⚠️ 未找到 $name 的进程${NC}"
        return 0
    fi

    # 尝试优雅停止 (SIGTERM)
    echo -e "${BLUE}📤 发送停止信号到进程 $pid...${NC}"
    if kill -TERM "$pid" 2>/dev/null; then
        # 等待进程停止
        local wait_time=0
        local max_wait=10

        while [ $wait_time -lt $max_wait ]; do
            if ! kill -0 "$pid" 2>/dev/null; then
                echo -e "${GREEN}✅ $name 已优雅停止${NC}"
                return 0
            fi
            sleep 1
            ((wait_time++))
        done

        # 如果优雅停止失败，强制停止
        echo -e "${YELLOW}⚠️ 优雅停止超时，强制停止...${NC}"
        if kill -KILL "$pid" 2>/dev/null; then
            echo -e "${GREEN}✅ $name 已强制停止${NC}"
            return 0
        else
            echo -e "${RED}❌ 无法停止 $name${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ 无法发送停止信号到进程 $pid${NC}"
        return 1
    fi
}

# 强制停止所有服务
force_stop_all() {
    echo -e "${RED}🔨 强制停止所有YYC3服务进程...${NC}"
    echo ""

    local patterns=("dynamic-*-server.js" "yyc3" "YYC3")

    for pattern in "${patterns[@]}"; do
        echo -e "${BLUE}🔍 查找进程模式: $pattern${NC}"
        local pids=$(pgrep -f "$pattern" 2>/dev/null || true)

        if [ -n "$pids" ]; then
            echo -e "${YELLOW}⚠️ 找到进程: $pids${NC}"
            for pid in $pids; do
                echo -e "${RED}🔨 强制停止进程 $pid${NC}"
                kill -KILL "$pid" 2>/dev/null || true
            done
        else
            echo -e "${GREEN}✅ 未找到匹配进程${NC}"
        fi
        echo ""
    done
}

# 显示服务状态
show_status() {
    echo ""
    echo -e "${CYAN}📊 服务状态检查${NC}"
    echo "=================================="

    for i in "${!SERVICES[@]}"; do
        IFS=':' read -r port name <<< "${SERVICES[$i]}"

        if check_port $port; then
            echo -e "${GREEN}✅ $name (端口: $port) - 已停止${NC}"
        else
            echo -e "${RED}❌ $name (端口: $port) - 仍在运行${NC}"
        fi
    done
}

# 清理临时文件和日志
cleanup() {
    echo ""
    echo -e "${CYAN}🧹 清理临时文件${NC}"
    echo "=================================="

    # 清理Node.js临时文件
    echo -e "${BLUE}🗑️ 清理Node.js临时文件...${NC}"
    rm -rf ~/.npm/_cacache/tmp/* 2>/dev/null || true
    rm -rf /tmp/node-* 2>/dev/null || true

    # 清理YYC3临时文件
    echo -e "${BLUE}🗑️ 清理YYC3临时文件...${NC}"
    rm -rf /tmp/yyc3-* 2>/dev/null || true
    rm -rf /tmp/YYC3-* 2>/dev/null || true

    echo -e "${GREEN}✅ 临时文件清理完成${NC}"
}

# 主停止流程
main() {
    # 解析命令行参数
    local force_stop=false
    local cleanup_files=false

    while [[ $# -gt 0 ]]; do
        case $1 in
            --force|-f)
                force_stop=true
                shift
                ;;
            --cleanup|-c)
                cleanup_files=true
                shift
                ;;
            --help|-h)
                echo "用法: $0 [选项]"
                echo ""
                echo "选项:"
                echo "  --force, -f      强制停止所有服务"
                echo "  --cleanup, -c   停止后清理临时文件"
                echo "  --help, -h      显示帮助信息"
                exit 0
                ;;
            *)
                echo -e "${RED}❌ 未知选项: $1${NC}"
                exit 1
                ;;
        esac
    done

    echo -e "${BLUE}🔍 检查当前运行的服务...${NC}"
    echo ""

    # 检查是否有服务在运行
    local running_services=0
    for i in "${!SERVICES[@]}"; do
        IFS=':' read -r port name <<< "${SERVICES[$i]}"
        if ! check_port $port; then
            ((running_services++))
        fi
    done

    if [ $running_services -eq 0 ]; then
        echo -e "${GREEN}✅ 没有运行中的YYC3服务${NC}"
        exit 0
    fi

    echo -e "${BLUE}📊 发现 $running_services 个服务在运行${NC}"
    echo ""

    if [ "$force_stop" = true ]; then
        force_stop_all
    else
        # 优雅停止所有服务
        echo -e "${BLUE}🔄 开始优雅停止服务...${NC}"
        echo ""

        for i in "${!SERVICES[@]}"; do
            IFS=':' read -r port name <<< "${SERVICES[$i]}"
            pattern=${PROCESS_PATTERNS[$i]}
            stop_service "$port" "$name" "$pattern"
            echo ""
        done
    fi

    # 等待所有服务完全停止
    echo -e "${BLUE}⏳ 等待服务完全停止...${NC}"
    sleep 3

    # 显示最终状态
    show_status

    # 检查是否还有进程残留
    echo ""
    echo -e "${CYAN}🔍 检查进程残留${NC}"
    echo "=================================="

    local remaining_processes=0
    for pattern in "${PROCESS_PATTERNS[@]}"; do
        local pids=$(pgrep -f "$pattern" 2>/dev/null || true)
        if [ -n "$pids" ]; then
            echo -e "${YELLOW}⚠️ 发现残留进程: $pattern - PID: $pids${NC}"
            ((remaining_processes++))
        fi
    done

    if [ $remaining_processes -gt 0 ]; then
        echo ""
        echo -e "${RED}⚠️ 仍有 $remaining_processes 个进程残留${NC}"
        echo -e "${YELLOW}建议使用 --force 参数强制停止${NC}"
    else
        echo -e "${GREEN}✅ 所有服务进程已完全停止${NC}"
    fi

    # 清理临时文件
    if [ "$cleanup_files" = true ]; then
        cleanup
    fi

    # 显示完成信息
    echo ""
    echo -e "${GREEN}🎉 服务停止操作完成！${NC}"
    echo ""
    echo -e "${CYAN}📝 后续操作${NC}"
    echo "=================================="
    echo -e "🚀 重新启动:   ${YELLOW}./启动YYC3全栈服务.sh${NC}"
    echo -e "🔄 重启服务:   ${YELLOW}./重启YYC3服务.sh${NC}"
    echo -e "📊 查看状态:   ${YELLOW}./检查YYC3服务状态.sh${NC}"
    echo -e "🧹 清理文件:   ${YELLOW}./停止YYC3全栈服务.sh --cleanup${NC}"
    echo -e "🔨 强制停止:   ${YELLOW}./停止YYC3全栈服务.sh --force${NC}"
    echo ""

    if [ $remaining_processes -eq 0 ]; then
        echo -e "${GREEN}✨ YYC3全栈服务已成功停止！${NC}"
        exit 0
    else
        echo -e "${YELLOW}⚠️ 部分服务可能仍在运行，请检查${NC}"
        exit 1
    fi
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi