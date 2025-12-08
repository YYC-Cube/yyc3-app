#!/bin/bash

# YYC3全栈服务启动脚本
# 启动所有YYC3平台服务
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

# 配置
BASE_DIR="/Users/yanyu/www/yyc3-22"
LOG_DIR="/Users/yanyu/www/logs"
SERVICES=(
    "API服务:6600:api"
    "管理后台:6601:admin"
    "LLM服务:6602:llm"
    "邮件服务:6603:mail"
    "AI服务:6604:ai-fcp"
    "应用服务:6605:app"
    "Redis服务:6606:redis"
)

# 创建日志目录
mkdir -p "$LOG_DIR"

echo -e "${CYAN}🚀 YYC3全栈服务启动器${NC}"
echo "=================================="
echo -e "基础目录: ${BLUE}$BASE_DIR${NC}"
echo -e "日志目录: ${BLUE}$LOG_DIR${NC}"
echo ""

# 检查端口占用
check_port() {
    local port=$1
    if lsof -i :$port > /dev/null 2>&1; then
        return 1  # 端口被占用
    else
        return 0  # 端口可用
    fi
}

# 启动单个服务
start_service() {
    local name=$1
    local port=$2
    local service=$3

    echo -e "${BLUE}🔧 启动 $name (端口: $port)...${NC}"

    # 检查端口是否被占用
    if ! check_port $port; then
        echo -e "${YELLOW}⚠️ 端口 $port 已被占用，跳过 $name${NC}"
        return 1
    fi

    # 启动服务
    case $service in
        "api")
            cd "$BASE_DIR" && nohup node services/dynamic-api-server.js > "$LOG_DIR/api-service.log" 2>&1 &
            ;;
        "admin")
            cd "$BASE_DIR" && nohup node services/dynamic-admin-server.js > "$LOG_DIR/admin-service.log" 2>&1 &
            ;;
        "llm")
            cd "$BASE_DIR" && LLM_PORT=6602 nohup node services/dynamic-llm-server.js > "$LOG_DIR/llm-service.log" 2>&1 &
            ;;
        "mail")
            cd "$BASE_DIR" && MAIL_PORT=6603 nohup node services/dynamic-mail-server.js > "$LOG_DIR/mail-service.log" 2>&1 &
            ;;
        "ai-fcp")
            cd "$BASE_DIR" && AI_PORT=6604 nohup node services/dynamic-ai-fcp-server.js > "$LOG_DIR/ai-fcp-service.log" 2>&1 &
            ;;
        "app")
            cd "$BASE_DIR" && APP_PORT=6605 nohup node services/dynamic-app-server.js > "$LOG_DIR/app-service.log" 2>&1 &
            ;;
        "redis")
            cd "$BASE_DIR" && REDIS_PORT=6606 nohup node services/dynamic-redis-server.js > "$LOG_DIR/redis-service.log" 2>&1 &
            ;;
        *)
            echo -e "${RED}❌ 未知服务: $service${NC}"
            return 1
            ;;
    esac

    # 等待服务启动
    sleep 2

    # 检查服务是否启动成功
    if check_port $port; then
        echo -e "${RED}❌ $name 启动失败${NC}"
        return 1
    else
        echo -e "${GREEN}✅ $name 启动成功${NC}"
        return 0
    fi
}

# 显示服务状态
show_status() {
    echo ""
    echo -e "${CYAN}📊 服务状态总览${NC}"
    echo "=================================="

    for service_info in "${SERVICES[@]}"; do
        IFS=':' read -r name port service <<< "$service_info"

        if check_port $port; then
            echo -e "${RED}❌ $name (端口: $port) - 未运行${NC}"
        else
            echo -e "${GREEN}✅ $name (端口: $port) - 运行中${NC}"
        fi
    done
}

# 健康检查
health_check() {
    echo ""
    echo -e "${CYAN}🏥 健康检查${NC}"
    echo "=================================="

    for service_info in "${SERVICES[@]}"; do
        IFS=':' read -r name port service <<< "$service_info"

        if ! check_port $port; then
            echo -n "检查 $name (端口: $port)... "

            # 使用curl进行健康检查
            if curl -f -s "http://localhost:$port/health" > /dev/null 2>&1; then
                echo -e "${GREEN}✅ 健康${NC}"
            elif curl -f -s "http://localhost:$port" > /dev/null 2>&1; then
                echo -e "${YELLOW}⚠️ 响应正常但无健康检查端点${NC}"
            else
                echo -e "${RED}❌ 无响应${NC}"
            fi
        fi
    done
}

# 主启动流程
main() {
    echo -e "${BLUE}🔍 检查环境...${NC}"

    # 检查Node.js
    if ! command -v node >/dev/null 2>&1; then
        echo -e "${RED}❌ Node.js 未安装${NC}"
        exit 1
    fi

    # 检查基础目录
    if [ ! -d "$BASE_DIR" ]; then
        echo -e "${RED}❌ 基础目录不存在: $BASE_DIR${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ 环境检查通过${NC}"
    echo ""

    # 启动所有服务
    local started_count=0
    local total_count=${#SERVICES[@]}

    echo -e "${BLUE}🚀 开始启动服务...${NC}"
    echo ""

    for service_info in "${SERVICES[@]}"; do
        IFS=':' read -r name port service <<< "$service_info"

        if start_service "$name" "$port" "$service"; then
            ((started_count++))
        fi
        echo ""
    done

    # 等待所有服务完全启动
    echo -e "${BLUE}⏳ 等待服务完全启动...${NC}"
    sleep 5

    # 显示状态
    show_status

    # 健康检查
    health_check

    # 显示访问信息
    echo ""
    echo -e "${GREEN}🎉 服务启动完成！${NC}"
    echo ""
    echo -e "${CYAN}📋 服务访问地址${NC}"
    echo "=================================="
    echo -e "🔗 API服务:     ${GREEN}http://localhost:6600${NC}"
    echo -e "🎛️ 管理后台:    ${GREEN}http://localhost:6601${NC}"
    echo -e "🤖 LLM服务:     ${GREEN}http://localhost:6602${NC}"
    echo -e "📧 邮件服务:     ${GREEN}http://localhost:6603${NC}"
    echo -e "🧠 AI服务:      ${GREEN}http://localhost:6604${NC}"
    echo -e "📱 应用服务:     ${GREEN}http://localhost:6605${NC}"
    echo -e "🗄️ Redis服务:   ${GREEN}http://localhost:6606${NC}"
    echo ""
    echo -e "${CYAN}📝 日志文件${NC}"
    echo "=================================="
    echo -e "📊 API日志:     ${BLUE}$LOG_DIR/api-service.log${NC}"
    echo -e "🎛️ 管理日志:    ${BLUE}$LOG_DIR/admin-service.log${NC}"
    echo -e "🤖 LLM日志:     ${BLUE}$LOG_DIR/llm-service.log${NC}"
    echo -e "📧 邮件日志:     ${BLUE}$LOG_DIR/mail-service.log${NC}"
    echo -e "🧠 AI日志:      ${BLUE}$LOG_DIR/ai-fcp-service.log${NC}"
    echo -e "📱 应用日志:     ${BLUE}$LOG_DIR/app-service.log${NC}"
    echo -e "🗄️ Redis日志:   ${BLUE}$LOG_DIR/redis-service.log${NC}"
    echo ""
    echo -e "${CYAN}🔧 管理命令${NC}"
    echo "=================================="
    echo -e "查看日志:     ${YELLOW}tail -f $LOG_DIR/[service]-service.log${NC}"
    echo -e "停止所有服务: ${YELLOW}pkill -f 'dynamic-*-server.js'${NC}"
    echo -e "重启服务:     ${YELLOW}./重启YYC3服务.sh${NC}"
    echo ""
    echo -e "${GREEN}✨ YYC3全栈服务已成功启动！${NC}"

    # 显示统计信息
    echo ""
    echo -e "${BLUE}📈 启动统计${NC}"
    echo "=================================="
    echo -e "成功启动: ${GREEN}$started_count/$total_count${NC} 个服务"

    if [ $started_count -eq $total_count ]; then
        echo -e "${GREEN}🎉 所有服务启动成功！${NC}"
        exit 0
    else
        echo -e "${YELLOW}⚠️ 部分服务启动失败，请检查日志${NC}"
        exit 1
    fi
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi