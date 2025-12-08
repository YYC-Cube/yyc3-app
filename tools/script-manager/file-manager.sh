#!/bin/bash

# ===== YYC³ 智能文件管理脚本 =====
# 整合到现有开发工作流中
# 版本: v1.0
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

# 路径配置
WORKSPACE_ROOT="/Users/yanyu/www"
SMART_MANAGER_DIR="${WORKSPACE_ROOT}/智能文件管理系统"
WWW_DIR="${WORKSPACE_ROOT}"
WORKSPACE_DIR="/Users/yanyu/yyc3-workspace"
NAS_MOUNT="/Volumes/NAS-YYC3"

# 显示文件管理状态
show_file_status() {
    echo -e "${CYAN}📊 文件管理状态${NC}"
    echo "=================================="
    
    # 检查目录大小
    if [ -d "$WWW_DIR" ]; then
        local www_size=$(du -sh "$WWW_DIR" 2>/dev/null | cut -f1)
        echo -e "${GREEN}📁 WWW目录: $www_size${NC}"
    fi
    
    if [ -d "$WORKSPACE_DIR" ]; then
        local workspace_size=$(du -sh "$WORKSPACE_DIR" 2>/dev/null | cut -f1)
        echo -e "${GREEN}💼 工作空间: $workspace_size${NC}"
    fi
    
    # 检查重复文件
    echo -e "${BLUE}🔍 扫描重复文件...${NC}"
    local duplicates=$(find "$WWW_DIR" "$WORKSPACE_DIR" -name "*.js" -o -name "*.ts" -o -name "*.json" -o -name "*.md" | xargs basename -a | sort | uniq -d | wc -l)
    echo -e "${YELLOW}⚠️ 发现 $duplicates 个可能重复的文件${NC}"
    
    # 检查临时文件
    local temp_files=$(find "$WWW_DIR" -name "*.tmp" -o -name "*.log" -o -name "node_modules" -type d 2>/dev/null | wc -l)
    echo -e "${YELLOW}🗂️ 发现 $temp_files 个临时文件/目录${NC}"
    
    # 检查NAS连接
    if [ -d "$NAS_MOUNT" ]; then
        echo -e "${GREEN}☁️ NAS连接: 正常${NC}"
    else
        echo -e "${RED}☁️ NAS连接: 断开${NC}"
    fi
    
    echo "=================================="
}

# 启动智能文件管理器
start_smart_manager() {
    echo -e "${CYAN}🚀 启动智能文件管理器...${NC}"
    
    if [ ! -d "$SMART_MANAGER_DIR" ]; then
        echo -e "${RED}❌ 智能文件管理系统未安装${NC}"
        echo -e "${YELLOW}💡 请运行: install-smart-manager${NC}"
        return 1
    fi
    
    cd "$SMART_MANAGER_DIR"
    
    # 检查依赖
    if [ ! -d "node_modules" ]; then
        echo -e "${BLUE}📦 安装依赖...${NC}"
        npm install
    fi
    
    # 启动系统
    if [ -f "quick-start.sh" ]; then
        ./quick-start.sh start
    else
        npm start
    fi
}

# 停止智能文件管理器
stop_smart_manager() {
    echo -e "${CYAN}🛑 停止智能文件管理器...${NC}"
    
    if [ -f "$SMART_MANAGER_DIR/quick-start.sh" ]; then
        cd "$SMART_MANAGER_DIR"
        ./quick-start.sh stop
    else
        pkill -f "SmartFileManager" 2>/dev/null || true
        echo -e "${GREEN}✅ 智能文件管理器已停止${NC}"
    fi
}

# 手动文件同步
sync_files() {
    echo -e "${CYAN}🔄 执行文件同步...${NC}"
    
    # 同步www到workspace
    if [ -d "$WWW_DIR" ] && [ -d "$WORKSPACE_DIR" ]; then
        echo -e "${BLUE}📤 同步 www -> workspace${NC}"
        rsync -av --delete --exclude='node_modules' --exclude='.git' --exclude='*.log' \
            --exclude='temp' --exclude='backups' \
            "$WWW_DIR/" "$WORKSPACE_DIR/"
        echo -e "${GREEN}✅ www -> workspace 同步完成${NC}"
    fi
    
    # 同步workspace到www
    if [ -d "$WORKSPACE_DIR" ] && [ -d "$WWW_DIR" ]; then
        echo -e "${BLUE}📥 同步 workspace -> www${NC}"
        rsync -av --delete --exclude='node_modules' --exclude='.git' --exclude='*.log' \
            --exclude='temp' --exclude='backups' \
            "$WORKSPACE_DIR/" "$WWW_DIR/"
        echo -e "${GREEN}✅ workspace -> www 同步完成${NC}"
    fi
}

# 清理重复文件
cleanup_duplicates() {
    echo -e "${CYAN}🧹 清理重复文件...${NC}"
    
    # 清理npm依赖
    find "$WWW_DIR" "$WORKSPACE_DIR" -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
    
    # 清理临时文件
    find "$WWW_DIR" "$WORKSPACE_DIR" -name "*.tmp" -delete 2>/dev/null || true
    find "$WWW_DIR" "$WORKSPACE_DIR" -name "*.log" -mtime +7 -delete 2>/dev/null || true
    
    # 清理备份文件
    find "$WWW_DIR" "$WORKSPACE_DIR" -name "*.bak" -mtime +30 -delete 2>/dev/null || true
    
    echo -e "${GREEN}✅ 重复文件清理完成${NC}"
}

# NAS备份
backup_to_nas() {
    echo -e "${CYAN}☁️ 备份到NAS...${NC}"
    
    if [ ! -d "$NAS_MOUNT" ]; then
        echo -e "${YELLOW}⚠️ 尝试挂载NAS...${NC}"
        mkdir -p "$NAS_MOUNT" 2>/dev/null || true
        
        # 尝试挂载
        if mount -t smbfs //192.168.1.12/volume1/YYC3-Backup "$NAS_MOUNT" 2>/dev/null; then
            echo -e "${GREEN}✅ NAS挂载成功${NC}"
        else
            echo -e "${RED}❌ NAS挂载失败${NC}"
            return 1
        fi
    fi
    
    # 创建备份目录
    local backup_dir="$NAS_MOUNT/backups/$(date +%Y-%m-%d_%H-%M-%S)"
    mkdir -p "$backup_dir"
    
    # 备份www目录
    if [ -d "$WWW_DIR" ]; then
        echo -e "${BLUE}💾 备份www目录...${NC}"
        rsync -av --exclude='node_modules' --exclude='temp' --exclude='backups' \
            "$WWW_DIR/" "$backup_dir/www/"
    fi
    
    # 备份workspace目录
    if [ -d "$WORKSPACE_DIR" ]; then
        echo -e "${BLUE}💾 备份workspace目录...${NC}"
        rsync -av --exclude='node_modules' --exclude='temp' \
            "$WORKSPACE_DIR/" "$backup_dir/workspace/"
    fi
    
    echo -e "${GREEN}✅ NAS备份完成: $backup_dir${NC}"
}

# 安装智能文件管理器
install_smart_manager() {
    echo -e "${CYAN}📦 安装智能文件管理器...${NC}"
    
    if [ -d "$SMART_MANAGER_DIR" ]; then
        echo -e "${YELLOW}⚠️ 智能文件管理器已存在${NC}"
        return 0
    fi
    
    echo -e "${BLUE}🔧 创建智能文件管理系统...${NC}"
    
    # 这里可以复制或创建必要的文件
    mkdir -p "$SMART_MANAGER_DIR"
    echo -e "${GREEN}✅ 智能文件管理系统目录已创建${NC}"
    echo -e "${YELLOW}💡 请手动配置智能文件管理器${NC}"
}

# 显示文件统计
show_file_stats() {
    echo -e "${CYAN}📈 文件统计信息${NC}"
    echo "=================================="
    
    # 文件类型统计
    echo -e "${BLUE}📄 文件类型分布:${NC}"
    if [ -d "$WWW_DIR" ]; then
        echo -n "  JavaScript: "
        find "$WWW_DIR" -name "*.js" 2>/dev/null | wc -l
        
        echo -n "  TypeScript: "
        find "$WWW_DIR" -name "*.ts" 2>/dev/null | wc -l
        
        echo -n "  JSON文件: "
        find "$WWW_DIR" -name "*.json" 2>/dev/null | wc -l
        
        echo -n "  Markdown: "
        find "$WWW_DIR" -name "*.md" 2>/dev/null | wc -l
    fi
    
    # 目录统计
    echo -e "${BLUE}📁 目录统计:${NC}"
    echo -n "  总目录数: "
    find "$WWW_DIR" -type d 2>/dev/null | wc -l
    
    echo -n "  总文件数: "
    find "$WWW_DIR" -type f 2>/dev/null | wc -l
    
    # 大文件统计
    echo -e "${BLUE}📊 大文件 (>10MB):${NC}"
    find "$WWW_DIR" -type f -size +10M -exec ls -lh {} \; 2>/dev/null | head -10
    
    echo "=================================="
}

# 帮助信息
show_help() {
    echo -e "${CYAN}📖 YYC³ 智能文件管理帮助${NC}"
    echo "=================================="
    echo -e "${GREEN}用法: $0 [选项]${NC}"
    echo ""
    echo -e "${BLUE}选项:${NC}"
    echo -e "  ${GREEN}status${NC}       显示文件管理状态"
    echo -e "  ${GREEN}start${NC}        启动智能文件管理器"
    echo -e "  ${GREEN}stop${NC}         停止智能文件管理器"
    echo -e "  ${GREEN}sync${NC}         手动同步文件"
    echo -e "  ${GREEN}cleanup${NC}      清理重复文件"
    echo -e "  ${GREEN}backup${NC}       备份到NAS"
    echo -e "  ${GREEN}install${NC}      安装智能文件管理器"
    echo -e "  ${GREEN}stats${NC}        显示文件统计"
    echo -e "  ${GREEN}help${NC}         显示此帮助信息"
    echo ""
    echo -e "${YELLOW}示例:${NC}"
    echo -e "  $0 status   # 查看文件状态"
    echo -e "  $0 sync     # 手动同步文件"
    echo -e "  $0 cleanup  # 清理重复文件"
    echo -e "  $0 backup   # 备份到NAS"
}

# 主函数
main() {
    case "${1:-help}" in
        "status")
            show_file_status
            ;;
        "start")
            start_smart_manager
            ;;
        "stop")
            stop_smart_manager
            ;;
        "sync")
            sync_files
            ;;
        "cleanup")
            cleanup_duplicates
            ;;
        "backup")
            backup_to_nas
            ;;
        "install")
            install_smart_manager
            ;;
        "stats")
            show_file_stats
            ;;
        "help"|*)
            show_help
            ;;
    esac
    
    echo -e "${GREEN}🎉 文件管理操作完成！${NC}"
}

# 执行主函数
main "$@"
