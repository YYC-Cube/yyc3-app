#!/bin/bash

# YYC³智能文件管理系统 - 快速启动脚本
# 创建时间: 2025-12-08
# 维护团队: YYC3 AI Family

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# 系统信息
SYSTEM_DIR="/Users/yanyu/www/智能文件管理系统"
PID_FILE="$SYSTEM_DIR/filemanager.pid"
LOG_FILE="$SYSTEM_DIR/logs/filemanager.log"

echo -e "${CYAN}🚀 YYC³智能文件管理系统快速启动${NC}"
echo "=================================="
echo ""

# 检查系统目录
if [ ! -d "$SYSTEM_DIR" ]; then
    echo -e "${RED}❌ 系统目录不存在: $SYSTEM_DIR${NC}"
    exit 1
fi

cd "$SYSTEM_DIR"

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 未安装${NC}"
    echo -e "${YELLOW}请访问 https://nodejs.org 安装Node.js${NC}"
    exit 1
fi

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 安装依赖包...${NC}"
    npm install
fi

# 检查配置文件
if [ ! -f "config.json" ]; then
    echo -e "${YELLOW}⚠️ 配置文件不存在，运行配置向导...${NC}"
    node setup.js
fi

# 功能菜单
show_menu() {
    echo -e "${CYAN}📋 功能菜单${NC}"
    echo "=================================="
    echo -e "1. ${GREEN}启动系统${NC}"
    echo -e "2. ${BLUE}停止系统${NC}"
    echo -e "3. ${YELLOW}重启系统${NC}"
    echo -e "4. ${PURPLE}查看状态${NC}"
    echo -e "5. ${CYAN}扫描文件${NC}"
    echo -e "6. ${GREEN}手动同步${NC}"
    echo -e "7. ${YELLOW}清理文件${NC}"
    echo -e "8. ${PURPLE}备份数据${NC}"
    echo -e "9. ${BLUE}生成报告${NC}"
    echo -e "10. ${RED}退出${NC}"
    echo ""
    echo -n "请选择功能 (1-10): "
}

# 检查系统状态
check_status() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ 系统正在运行 (PID: $pid)${NC}"
            return 0
        else
            echo -e "${RED}❌ PID文件存在但进程未运行${NC}"
            rm -f "$PID_FILE"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️ 系统未运行${NC}"
        return 1
    fi
}

# 启动系统
start_system() {
    if check_status > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️ 系统已在运行${NC}"
        return 0
    fi

    echo -e "${BLUE}🚀 启动智能文件管理系统...${NC}"
    
    # 创建日志目录
    mkdir -p logs
    
    # 启动系统
    nohup node SmartFileManager.js > "$LOG_FILE" 2>&1 &
    local pid=$!
    
    # 保存PID
    echo "$pid" > "$PID_FILE"
    
    # 等待启动
    sleep 2
    
    if ps -p "$pid" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 系统启动成功 (PID: $pid)${NC}"
        echo -e "${CYAN}📊 查看日志: tail -f $LOG_FILE${NC}"
    else
        echo -e "${RED}❌ 系统启动失败${NC}"
        echo -e "${YELLOW}查看日志: cat $LOG_FILE${NC}"
        rm -f "$PID_FILE"
        return 1
    fi
}

# 停止系统
stop_system() {
    if ! check_status > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️ 系统未运行${NC}"
        return 0
    fi

    local pid=$(cat "$PID_FILE")
    echo -e "${BLUE}🛑 停止系统 (PID: $pid)...${NC}"
    
    # 发送TERM信号
    kill -TERM "$pid" 2>/dev/null || true
    
    # 等待进程停止
    local count=0
    while ps -p "$pid" > /dev/null 2>&1 && [ $count -lt 10 ]; do
        sleep 1
        ((count++))
    done
    
    # 如果仍在运行，强制停止
    if ps -p "$pid" > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️ 强制停止...${NC}"
        kill -KILL "$pid" 2>/dev/null || true
        sleep 1
    fi
    
    # 清理PID文件
    rm -f "$PID_FILE"
    
    if ps -p "$pid" > /dev/null 2>&1; then
        echo -e "${RED}❌ 停止失败${NC}"
        return 1
    else
        echo -e "${GREEN}✅ 系统已停止${NC}"
        return 0
    fi
}

# 重启系统
restart_system() {
    echo -e "${BLUE}🔄 重启系统...${NC}"
    stop_system
    sleep 1
    start_system
}

# 查看详细状态
show_detailed_status() {
    echo -e "${CYAN}📊 系统详细状态${NC}"
    echo "=================================="
    
    # 检查进程状态
    check_status
    
    # 显示PID文件信息
    if [ -f "$PID_FILE" ]; then
        echo -e "📄 PID文件: $PID_FILE"
        echo -e "📋 进程ID: $(cat $PID_FILE)"
    fi
    
    # 显示日志文件信息
    if [ -f "$LOG_FILE" ]; then
        local log_size=$(du -h "$LOG_FILE" | cut -f1)
        echo -e "📝 日志文件: $LOG_FILE (${log_size})"
        echo -e "🕐 最后更新: $(stat -f "%Sm" "$LOG_FILE")"
    fi
    
    # 显示配置文件信息
    if [ -f "config.json" ]; then
        echo -e "⚙️ 配置文件: config.json"
        local www_dir=$(grep '"wwwDir"' config.json | cut -d'"' -f4)
        local workspace_dir=$(grep '"workspaceDir"' config.json | cut -d'"' -f4)
        echo -e "📁 WWW目录: $www_dir"
        echo -e "💼 工作空间: $workspace_dir"
    fi
    
    # 显示NAS连接状态
    if ping -c 1 192.168.1.12 &>/dev/null; then
        echo -e "☁️ NAS连接: ${GREEN}正常${NC}"
    else
        echo -e "☁️ NAS连接: ${RED}断开${NC}"
    fi
    
    # 显示磁盘使用情况
    echo -e "💾 磁盘使用:"
    df -h | grep -E "(Filesystem|/dev/)"
    
    echo "=================================="
}

# 扫描文件
scan_files() {
    echo -e "${BLUE}🔍 扫描现有文件...${NC}"
    npm run scan
}

# 手动同步
sync_files() {
    echo -e "${BLUE}🔄 执行手动同步...${NC}"
    npm run sync
}

# 清理文件
cleanup_files() {
    echo -e "${BLUE}🧹 执行智能清理...${NC}"
    npm run cleanup
}

# 备份数据
backup_data() {
    echo -e "${BLUE}💾 执行数据备份...${NC}"
    npm run backup
}

# 生成报告
generate_report() {
    echo -e "${BLUE}📊 生成系统报告...${NC}"
    npm run report
}

# 主循环
main() {
    while true; do
        show_menu
        read -r choice
        
        case $choice in
            1)
                start_system
                ;;
            2)
                stop_system
                ;;
            3)
                restart_system
                ;;
            4)
                show_detailed_status
                ;;
            5)
                scan_files
                ;;
            6)
                sync_files
                ;;
            7)
                cleanup_files
                ;;
            8)
                backup_data
                ;;
            9)
                generate_report
                ;;
            10)
                echo -e "${GREEN}👋 再见！${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}❌ 无效选择，请输入1-10${NC}"
                ;;
        esac
        
        echo ""
        echo -e "${CYAN}按回车键继续...${NC}"
        read -r
        clear
    done
}

# 处理命令行参数
case "${1:-}" in
    start)
        start_system
        ;;
    stop)
        stop_system
        ;;
    restart)
        restart_system
        ;;
    status)
        show_detailed_status
        ;;
    scan)
        scan_files
        ;;
    sync)
        sync_files
        ;;
    cleanup)
        cleanup_files
        ;;
    backup)
        backup_data
        ;;
    report)
        generate_report
        ;;
    *)
        main
        ;;
esac
