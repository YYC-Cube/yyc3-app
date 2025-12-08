#!/bin/bash

# ===== YYC³ 统一开发工作流脚本 =====
# 版本: v2.0
# 最后更新: 2025-12-06

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 项目根目录
WORKSPACE_ROOT="/Users/yanyu/www"
CONFIGS_ROOT="${WORKSPACE_ROOT}/configs"
PROJECTS_ROOT="${WORKSPACE_ROOT}/projects"
LOGS_ROOT="${WORKSPACE_ROOT}/logs"

# 配置文件路径
STANDARD_CONFIG="${CONFIGS_ROOT}/.env.standard"
LOCAL_CONFIG="${CONFIGS_ROOT}/development/.env.local"
EMAIL_CONFIG="${CONFIGS_ROOT}/domains/0379.email.env"
WORLD_CONFIG="${CONFIGS_ROOT}/domains/0379.world.env"
DB_CONFIG="${CONFIGS_ROOT}/database/.env.nas-db"

# 日志文件
LOG_FILE="${LOGS_ROOT}/dev-workflow.log"
ERROR_LOG="${LOGS_ROOT}/dev-workflow-error.log"

# 创建必要的目录
create_directories() {
    echo -e "${CYAN}📁 创建必要的目录...${NC}"

    mkdir -p "${WORKSPACE_ROOT}"/{projects,configs,logs,backups,temp,scripts,deployments}
    mkdir -p "${CONFIGS_ROOT}"/{domains,database,development,ssl,servers}
    mkdir -p "${LOGS_ROOT}"
    mkdir -p "${PROJECTS_ROOT}"

    echo -e "${GREEN}✅ 目录创建完成${NC}"
}

# 加载配置文件
load_configs() {
    echo -e "${CYAN}⚙️ 加载配置文件...${NC}"

    if [[ -f "${STANDARD_CONFIG}" ]]; then
        source "${STANDARD_CONFIG}"
        echo -e "${GREEN}✅ 标准配置加载成功${NC}"
    else
        echo -e "${RED}❌ 标准配置文件不存在: ${STANDARD_CONFIG}${NC}"
        return 1
    fi

    if [[ -f "${LOCAL_CONFIG}" ]]; then
        source "${LOCAL_CONFIG}"
        echo -e "${GREEN}✅ 本地开发配置加载成功${NC}"
    else
        echo -e "${YELLOW}⚠️ 本地开发配置文件不存在，使用默认配置${NC}"
    fi

    if [[ -f "${DB_CONFIG}" ]]; then
        source "${DB_CONFIG}"
        echo -e "${GREEN}✅ 数据库配置加载成功${NC}"
    else
        echo -e "${YELLOW}⚠️ 数据库配置文件不存在${NC}"
    fi
}

# 检查网络连接
check_network() {
    echo -e "${CYAN}🌐 检查网络连接...${NC}"

    # 检查本地网络
    if ping -c 1 192.168.3.45 >/dev/null 2>&1; then
        echo -e "${GREEN}✅ NAS服务器 (192.168.3.45) 连接正常${NC}"
    else
        echo -e "${RED}❌ NAS服务器连接失败${NC}"
    fi

    # 检查ECS服务器
    if timeout 5 bash -c "</dev/tcp/8.152.195.33/22" 2>/dev/null; then
        echo -e "${GREEN}✅ ECS邮件服务器 (8.152.195.33) 连接正常${NC}"
    else
        echo -e "${YELLOW}⚠️ ECS邮件服务器连接超时或不可达${NC}"
    fi

    if timeout 5 bash -c "</dev/tcp/8.130.127.121/22" 2>/dev/null; then
        echo -e "${GREEN}✅ ECS世界服务器 (8.130.127.121) 连接正常${NC}"
    else
        echo -e "${YELLOW}⚠️ ECS世界服务器连接超时或不可达${NC}"
    fi
}

# 检查端口占用
check_ports() {
    echo -e "${CYAN}🔍 检查本地端口占用...${NC}"

    local ports=(3000 3001 3002 8000 8001 8002 9000 9001)

    for port in "${ports[@]}"; do
        if lsof -i :$port >/dev/null 2>&1; then
            echo -e "${RED}❌ 端口 $port 已被占用${NC}"
            lsof -i :$port | head -5
        else
            echo -e "${GREEN}✅ 端口 $port 可用${NC}"
        fi
    done
}

# 启动开发服务
start_dev_services() {
    echo -e "${CYAN}🚀 启动开发服务...${NC}"

    # 检查是否安装了必要的工具
    if ! command -v bun >/dev/null 2>&1; then
        echo -e "${RED}❌ 未找到 bun 包管理器，请先安装${NC}"
        return 1
    fi

    # 启动0379.email开发服务
    if [[ -d "${PROJECTS_ROOT}/0379-email-platform" ]]; then
        echo -e "${BLUE}🔧 启动 0379.email 开发服务...${NC}"
        cd "${PROJECTS_ROOT}/0379-email-platform"

        # 检查端口并选择可用端口
        local email_port=3000
        if lsof -i :$email_port >/dev/null 2>&1; then
            email_port=3001
            echo -e "${YELLOW}⚠️ 端口3000被占用，使用端口 $email_port${NC}"
        fi

        # PORT=$email_port bun run dev > "${LOGS_ROOT}/email-dev.log" 2>&1 &
        # EMAIL_PID=$!
        # echo $EMAIL_PID > "${LOGS_ROOT}/email-dev.pid"
        echo -e "${GREEN}✅ 0379.email 开发服务启动命令已准备 (端口: $email_port)${NC}"
    fi

    # 启动0379.world开发服务
    if [[ -d "${PROJECTS_ROOT}/0379-world-platform" ]]; then
        echo -e "${BLUE}🔧 启动 0379.world 开发服务...${NC}"
        cd "${PROJECTS_ROOT}/0379-world-platform"

        local world_port=3010
        if lsof -i :$world_port >/dev/null 2>&1; then
            world_port=3011
            echo -e "${YELLOW}⚠️ 端口3010被占用，使用端口 $world_port${NC}"
        fi

        # PORT=$world_port bun run dev > "${LOGS_ROOT}/world-dev.log" 2>&1 &
        # WORLD_PID=$!
        # echo $WORLD_PID > "${LOGS_ROOT}/world-dev.pid"
        echo -e "${GREEN}✅ 0379.world 开发服务启动命令已准备 (端口: $world_port)${NC}"
    fi

    echo -e "${GREEN}✅ 开发服务启动命令已准备${NC}"
    echo -e "${CYAN}💡 请手动在对应的项目目录中运行开发命令${NC}"
}

# 数据库连接测试
test_database_connection() {
    echo -e "${CYAN}🗄️ 测试数据库连接...${NC}"

    # 测试本地数据库
    if command -v psql >/dev/null 2>&1; then
        echo -e "${BLUE}🔍 测试本地 PostgreSQL...${NC}"
        if PGPASSWORD=dev_password_2025 psql -h localhost -U postgres -d postgres -c "SELECT version();" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ 本地 PostgreSQL 连接正常${NC}"
        else
            echo -e "${YELLOW}⚠️ 本地 PostgreSQL 连接失败${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️ 未找到 psql 命令${NC}"
    fi

    # 测试NAS数据库
    if PGPASSWORD=yyc3_db_master_2025 psql -h 192.168.3.45 -U postgres -d yyc3_main -c "SELECT version();" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ NAS PostgreSQL 连接正常${NC}"
    else
        echo -e "${YELLOW}⚠️ NAS PostgreSQL 连接失败${NC}"
    fi

    # 测试Redis连接
    if command -v redis-cli >/dev/null 2>&1; then
        echo -e "${BLUE}🔍 测试本地 Redis...${NC}"
        if redis-cli ping >/dev/null 2>&1; then
            echo -e "${GREEN}✅ 本地 Redis 连接正常${NC}"
        else
            echo -e "${YELLOW}⚠️ 本地 Redis 连接失败${NC}"
        fi

        echo -e "${BLUE}🔍 测试 NAS Redis...${NC}"
        if redis-cli -h 192.168.3.45 ping >/dev/null 2>&1; then
            echo -e "${GREEN}✅ NAS Redis 连接正常${NC}"
        else
            echo -e "${YELLOW}⚠️ NAS Redis 连接失败${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️ 未找到 redis-cli 命令${NC}"
    fi
}

# 项目状态检查
check_project_status() {
    echo -e "${CYAN}📊 检查项目状态...${NC}"

    # 检查Git状态
    if [[ -d "${WORKSPACE_ROOT}/.git" ]]; then
        echo -e "${BLUE}🔍 检查 Git 状态...${NC}"
        cd "${WORKSPACE_ROOT}"

        local git_status=$(git status --porcelain)
        if [[ -n "$git_status" ]]; then
            echo -e "${YELLOW}⚠️ 存在未提交的更改${NC}"
            git status --short
        else
            echo -e "${GREEN}✅ Git 工作区干净${NC}"
        fi

        local current_branch=$(git branch --show-current)
        echo -e "${BLUE}📂 当前分支: ${current_branch}${NC}"
    fi

    # 检查项目结构
    echo -e "${BLUE}📁 检查项目结构...${NC}"

    local required_dirs=("configs" "projects" "scripts" "logs" "deployments")
    for dir in "${required_dirs[@]}"; do
        if [[ -d "${WORKSPACE_ROOT}/${dir}" ]]; then
            echo -e "${GREEN}✅ ${dir}/ 目录存在${NC}"
        else
            echo -e "${RED}❌ ${dir}/ 目录不存在${NC}"
        fi
    done
}

# 显示开发环境信息
show_dev_info() {
    echo -e "${CYAN}📋 开发环境信息${NC}"
    echo -e "${PURPLE}=====================================${NC}"
    echo -e "${BLUE}🖥️  本地开发机: ${LOCAL_DEV_NAME} (${LOCAL_DEV_HOST})${NC}"
    echo -e "${BLUE}📁 工作区目录: ${WORKSPACE_ROOT}${NC}"
    echo -e "${BLUE}🗄️  数据库服务器: ${NAS_HOST}${NC}"
    echo -e "${BLUE}📧 邮件服务器: ${ECS_EMAIL_SERVER}${NC}"
    echo -e "${BLUE}🌐 世界服务器: ${ECS_WORLD_SERVER}${NC}"
    echo -e "${PURPLE}=====================================${NC}"
    echo -e "${GREEN}🔗 常用链接:${NC}"
    echo -e "  - 0379.email: https://0379.email"
    echo -e "  - 0379.world: https://0379.world"
    echo -e "  - 管理面板: http://localhost:3001"
    echo -e "  - API文档: http://localhost:8000/docs"
}

# 帮助信息
show_help() {
    echo -e "${CYAN}📖 YYC³ 开发工作流脚本帮助${NC}"
    echo -e "${PURPLE}=====================================${NC}"
    echo -e "${GREEN}用法: $0 [选项]${NC}"
    echo ""
    echo -e "${BLUE}选项:${NC}"
    echo -e "  ${GREEN}init${NC}         初始化开发环境"
    echo -e "  ${GREEN}check${NC}        检查环境和配置"
    echo -e "  ${GREEN}start${NC}        启动开发服务"
    echo -e "  ${GREEN}stop${NC}         停止开发服务"
    echo -e "  ${GREEN}restart${NC}      重启开发服务"
    echo -e "  ${GREEN}status${NC}       显示服务状态"
    echo -e "  ${GREEN}db-test${NC}      测试数据库连接"
    echo -e "  ${GREEN}deploy-email${NC} 部署到0379.email服务器"
    echo -e "  ${GREEN}deploy-world${NC} 部署到0379.world服务器"
    echo -e "  ${GREEN}clean${NC}        清理临时文件"
    echo -e "  ${GREEN}help${NC}         显示此帮助信息"
    echo ""
    echo -e "${YELLOW}示例:${NC}"
    echo -e "  $0 init     # 初始化开发环境"
    echo -e "  $0 check    # 检查环境配置"
    echo -e "  $0 start    # 启动开发服务"
}

# 清理函数
cleanup() {
    echo -e "${CYAN}🧹 清理临时文件...${NC}"

    # 清理日志文件
    find "${LOGS_ROOT}" -name "*.log" -type f -mtime +7 -delete 2>/dev/null || true

    # 清理临时目录
    rm -rf "${WORKSPACE_ROOT}/temp"/* 2>/dev/null || true

    # 清理备份文件
    find "${WORKSPACE_ROOT}" -name "*.bak" -type f -mtime +30 -delete 2>/dev/null || true

    echo -e "${GREEN}✅ 清理完成${NC}"
}

# 停止开发服务
stop_dev_services() {
    echo -e "${CYAN}🛑 停止开发服务...${NC}"

    # 停止Node.js进程
    pkill -f "bun.*dev" 2>/dev/null || true
    pkill -f "node.*dev" 2>/dev/null || true

    # 清理PID文件
    rm -f "${LOGS_ROOT}"/*.pid 2>/dev/null || true

    echo -e "${GREEN}✅ 开发服务已停止${NC}"
}

# 主函数
main() {
    # 创建日志文件
    mkdir -p "${LOGS_ROOT}"
    touch "${LOG_FILE}" "${ERROR_LOG}"

    echo -e "${CYAN}🚀 YYC³ 开发工作流脚本启动${NC}"
    echo -e "$(date "+%Y-%m-%d %H:%M:%S") - 开始执行工作流脚本" >> "${LOG_FILE}"

    case "${1:-help}" in
        "init")
            create_directories
            load_configs
            echo -e "${GREEN}✅ 开发环境初始化完成${NC}"
            ;;
        "check")
            check_network
            check_ports
            check_project_status
            echo -e "${GREEN}✅ 环境检查完成${NC}"
            ;;
        "start")
            load_configs
            check_ports
            start_dev_services
            show_dev_info
            echo -e "${GREEN}✅ 开发服务启动完成${NC}"
            ;;
        "stop")
            stop_dev_services
            echo -e "${GREEN}✅ 开发服务停止完成${NC}"
            ;;
        "restart")
            stop_dev_services
            sleep 2
            load_configs
            start_dev_services
            echo -e "${GREEN}✅ 开发服务重启完成${NC}"
            ;;
        "status")
            check_project_status
            show_dev_info
            ;;
        "db-test")
            load_configs
            test_database_connection
            echo -e "${GREEN}✅ 数据库连接测试完成${NC}"
            ;;
        "clean")
            cleanup
            echo -e "${GREEN}✅ 清理完成${NC}"
            ;;
        "deploy-email")
            echo -e "${CYAN}🚀 准备部署到 0379.email 服务器...${NC}"
            if [[ -f "${WORKSPACE_ROOT}/scripts/deploy-0379-email.sh" ]]; then
                bash "${WORKSPACE_ROOT}/scripts/deploy-0379-email.sh"
            else
                echo -e "${RED}❌ 部署脚本不存在${NC}"
            fi
            ;;
        "deploy-world")
            echo -e "${CYAN}🚀 准备部署到 0379.world 服务器...${NC}"
            if [[ -f "${WORKSPACE_ROOT}/scripts/deploy-0379-world.sh" ]]; then
                bash "${WORKSPACE_ROOT}/scripts/deploy-0379-world.sh"
            else
                echo -e "${RED}❌ 部署脚本不存在${NC}"
            fi
            ;;
        "help"|*)
            show_help
            ;;
    esac

    echo -e "$(date "+%Y-%m-%d %H:%M:%S") - 工作流脚本执行完成" >> "${LOG_FILE}"
    echo -e "${GREEN}🎉 工作流脚本执行完成！${NC}"
}

# 错误处理
trap 'echo -e "${RED}❌ 脚本执行出错${NC}"; echo "$(date "+%Y-%m-%d %H:%M:%S") - 脚本执行出错" >> "${ERROR_LOG}"; exit 1' ERR

# 执行主函数
main "$@"