#!/bin/bash

# ===== YYC³ 清理和标准化脚本 =====
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
NC='\033[0m'

# 项目根目录
WORKSPACE_ROOT="/Users/yanyu/www"
BACKUP_ROOT="${WORKSPACE_ROOT}/backups/cleanup-$(date +%Y%m%d-%H%M%S)"

# 要保留的核心文件和目录
KEEP_DIRS=(
    "configs"
    "scripts"
    "projects"
    "deployments"
    "active-projects"
    "claude-workspace"
    "logs"
    "backups"
    "yyc3-22"
    "0379-email-platform"
    "components"
    "hooks"
    "security"
    "servers"
    ".git"
    ".github"
)

KEEP_FILES=(
    ".env"
    ".gitignore"
    "package.json"
    "README.md"
    "CLAUDE.md"
    "yyc3"
    "yyc3-simple"
    "yyc3-clean"
)

# 要清理的文件模式
CLEAN_PATTERNS=(
    "*.zip"
    "*.tar.gz"
    "*.log"
    "*.tmp"
    "*.bak"
    ".DS_Store"
    "Thumbs.db"
    "node_modules"
    ".next"
    "dist"
    "build"
    ".cache"
    ".nyc_output"
    "coverage"
    "*.pid"
    "*.lock"
    ".env.local"
    ".env.development"
    ".env.production"
)

# 要移动到备份的文件模式
BACKUP_PATTERNS=(
    "*.sh"
    "*.md"
    "*.conf"
    "*.toml"
    "*.yml"
    "*.yaml"
    "*.json"
    "*.js"
    "*.html"
    "*.css"
)

# 创建备份目录
create_backup() {
    echo -e "${CYAN}💾 创建备份目录...${NC}"
    mkdir -p "${BACKUP_ROOT}"
    mkdir -p "${BACKUP_ROOT}/scripts"
    mkdir -p "${BACKUP_ROOT}/configs"
    mkdir -p "${BACKUP_ROOT}/docs"
    mkdir -p "${BACKUP_ROOT}/temp"
    mkdir -p "${BACKUP_ROOT}/duplicates"
}

# 显示磁盘使用情况
show_disk_usage() {
    echo -e "${CYAN}💽 当前磁盘使用情况:${NC}"
    du -sh "${WORKSPACE_ROOT}"
    echo ""
    echo -e "${CYAN}📊 最大的10个目录:${NC}"
    du -sh "${WORKSPACE_ROOT}"/* 2>/dev/null | sort -hr | head -10 | nl
}

# 分析文件类型
analyze_files() {
    echo -e "${CYAN}📈 文件类型分析:${NC}"

    # 统计文件类型
    echo "文件扩展名统计:"
    find "${WORKSPACE_ROOT}" -type f -name "*.*" | sed 's/.*\.//' | sort | uniq -c | sort -nr | head -20

    echo ""
    echo "脚本文件统计:"
    echo -n "Shell脚本: "; find "${WORKSPACE_ROOT}" -name "*.sh" | wc -l
    echo -n "JavaScript文件: "; find "${WORKSPACE_ROOT}" -name "*.js" | wc -l
    echo -n "TypeScript文件: "; find "${WORKSPACE_ROOT}" -name "*.ts" | wc -l
    echo -n "配置文件: "; find "${WORKSPACE_ROOT}" -name "*.conf" -o -name "*.toml" -o -name "*.yml" -o -name "*.yaml" | wc -l
    echo -n "文档文件: "; find "${WORKSPACE_ROOT}" -name "*.md" | wc -l
}

# 查找重复文件
find_duplicates() {
    echo -e "${CYAN}🔍 查找重复文件...${NC}"

    # 查找重复的脚本文件
    echo "重复的脚本文件:"
    find "${WORKSPACE_ROOT}" -name "*.sh" -type f -exec basename {} \; | sort | uniq -d | while read file; do
        echo "  - ${file}"
        find "${WORKSPACE_ROOT}" -name "${file}" -type f
        echo ""
    done

    # 查找重复的配置文件
    echo "重复的配置文件:"
    find "${WORKSPACE_ROOT}" -name "*.conf" -o -name "*.toml" -o -name "*.env*" -type f -exec basename {} \; | sort | uniq -d | while read file; do
        echo "  - ${file}"
        find "${WORKSPACE_ROOT}" -name "${file}" -type f
        echo ""
    done
}

# 备份重要文件
backup_important_files() {
    echo -e "${CYAN}💾 备份重要文件...${NC}"

    # 备份所有脚本文件
    find "${WORKSPACE_ROOT}" -maxdepth 1 -name "*.sh" -type f -not -path "${BACKUP_ROOT}/*" -exec cp {} "${BACKUP_ROOT}/scripts/" \;

    # 备份配置文件
    find "${WORKSPACE_ROOT}" -maxdepth 1 -name "*.conf" -o -name "*.toml" -o -name "*.yml" -o -name "*.yaml" -type f -not -path "${BACKUP_ROOT}/*" -exec cp {} "${BACKUP_ROOT}/configs/" \;

    # 备份文档文件
    find "${WORKSPACE_ROOT}" -maxdepth 1 -name "*.md" -type f -not -path "${BACKUP_ROOT}/*" -exec cp {} "${BACKUP_ROOT}/docs/" \;

    # 备份临时文件
    find "${WORKSPACE_ROOT}" -maxdepth 1 -name "deploy-*.sh" -o -name "setup-*.sh" -o -name "test-*.sh" -type f -not -path "${BACKUP_ROOT}/*" -exec cp {} "${BACKUP_ROOT}/temp/" \;

    echo -e "${GREEN}✅ 文件备份完成: ${BACKUP_ROOT}${NC}"
}

# 清理临时和垃圾文件
cleanup_temp_files() {
    echo -e "${CYAN}🧹 清理临时和垃圾文件...${NC}"

    local cleaned_files=0
    local cleaned_size=0

    # 清理各种临时文件
    for pattern in "${CLEAN_PATTERNS[@]}"; do
        while IFS= read -r -d '' file; do
            if [[ -f "$file" ]]; then
                local size=$(du -k "$file" | cut -f1)
                rm -f "$file"
                ((cleaned_files++))
                ((cleaned_size += size))
                echo -e "  ${YELLOW}删除: $file ($size KB)${NC}"
            fi
        done < <(find "${WORKSPACE_ROOT}" -name "$pattern" -type f -not -path "${BACKUP_ROOT}/*" -print0 2>/dev/null)
    done

    # 清理空的目录
    find "${WORKSPACE_ROOT}" -type d -empty -not -path "${BACKUP_ROOT}/*" -delete 2>/dev/null || true

    echo -e "${GREEN}✅ 清理完成: ${cleaned_files} 个文件, ${cleaned_size} KB${NC}"
}

# 移动重复文件到备份
move_duplicates() {
    echo -e "${CYAN}📦 移动重复文件到备份...${NC}"

    # 移动重复的部署脚本
    local deploy_scripts=(
        "deploy-multi-subdomain.sh"
        "deploy-to-yyc3-202.sh"
        "deploy-yyc3-202-auto.sh"
        "deploy-multi-service-deploy.sh"
        "deploy-smb*.sh"
        "multi-service-api*.sh"
    )

    for script in "${deploy_scripts[@]}"; do
        find "${WORKSPACE_ROOT}" -maxdepth 1 -name "$script" -type f -not -path "${BACKUP_ROOT}/*" -exec mv {} "${BACKUP_ROOT}/temp/" \; 2>/dev/null || true
    done

    # 移动重复的配置文件
    local config_files=(
        "nginx*.conf"
        "docker-compose*.yml"
        "frpc*.toml"
        "api-*.conf"
    )

    for config in "${config_files[@]}"; do
        find "${WORKSPACE_ROOT}" -maxdepth 1 -name "$config" -type f -not -path "${BACKUP_ROOT}/*" -exec mv {} "${BACKUP_ROOT}/configs/" \; 2>/dev/null || true
    done

    echo -e "${GREEN}✅ 重复文件移动完成${NC}"
}

# 整理项目结构
organize_projects() {
    echo -e "${CYAN}📁 整理项目结构...${NC}"

    # 确保核心目录存在
    for dir in "${KEEP_DIRS[@]}"; do
        if [[ ! -d "${WORKSPACE_ROOT}/${dir}" ]]; then
            mkdir -p "${WORKSPACE_ROOT}/${dir}"
            echo -e "${BLUE}创建目录: ${dir}${NC}"
        fi
    done

    # 移动散落的项目文件到projects目录
    find "${WORKSPACE_ROOT}" -maxdepth 1 -type d -name "*-platform" -o -name "*-dashboard" -o -name "*-system" | while read dir; do
        if [[ -d "$dir" && "$dir" != "${WORKSPACE_ROOT}/projects" ]]; then
            local basename=$(basename "$dir")
            if [[ ! -d "${WORKSPACE_ROOT}/projects/${basename}" ]]; then
                mv "$dir" "${WORKSPACE_ROOT}/projects/"
                echo -e "${BLUE}移动项目: ${basename} -> projects/${basename}${NC}"
            fi
        fi
    done

    # 移动开发相关的文件到claude-workspace
    local workspace_files=(
        "claude-*.md"
        "claude-*.sh"
        "CLAUDE_*.md"
        "MCP*.md"
        "MCP*.sh"
        "MCP*.json"
    )

    for file_pattern in "${workspace_files[@]}"; do
        find "${WORKSPACE_ROOT}" -maxdepth 1 -name "$file_pattern" -type f -not -path "${BACKUP_ROOT}/*" -exec mv {} "${WORKSPACE_ROOT}/claude-workspace/" \; 2>/dev/null || true
    done

    echo -e "${GREEN}✅ 项目结构整理完成${NC}"
}

# 创建标准化的符号链接
create_symlinks() {
    echo -e "${CYAN}🔗 创建标准化符号链接...${NC}"

    # 创建快速访问脚本
    ln -sf "${WORKSPACE_ROOT}/scripts/yy3-dev-workflow.sh" "${WORKSPACE_ROOT}/dev"
    ln -sf "${WORKSPACE_ROOT}/scripts/cleanup-and-standardize.sh" "${WORKSPACE_ROOT}/cleanup"

    # 创建配置文件符号链接
    ln -sf "${WORKSPACE_ROOT}/configs/.env.standard" "${WORKSPACE_ROOT}/.env.standard"
    ln -sf "${WORKSPACE_ROOT}/configs/development/.env.local" "${WORKSPACE_ROOT}/.env.local"

    echo -e "${GREEN}✅ 符号链接创建完成${NC}"
}

# 验证标准化结果
verify_standardization() {
    echo -e "${CYAN}✅ 验证标准化结果...${NC}"

    # 检查核心文件是否存在
    local missing_files=0
    for file in "${KEEP_FILES[@]}"; do
        if [[ ! -f "${WORKSPACE_ROOT}/${file}" ]]; then
            echo -e "${RED}❌ 缺失核心文件: ${file}${NC}"
            ((missing_files++))
        fi
    done

    # 检查核心目录是否存在
    for dir in "${KEEP_DIRS[@]}"; do
        if [[ ! -d "${WORKSPACE_ROOT}/${dir}" ]]; then
            echo -e "${RED}❌ 缺失核心目录: ${dir}${NC}"
            ((missing_files++))
        fi
    done

    if [[ $missing_files -eq 0 ]]; then
        echo -e "${GREEN}✅ 所有核心文件和目录都存在${NC}"
    else
        echo -e "${YELLOW}⚠️ 发现 $missing_files 个缺失的核心文件或目录${NC}"
    fi

    # 显示整理后的目录结构
    echo ""
    echo -e "${CYAN}📋 整理后的目录结构:${NC}"
    tree "${WORKSPACE_ROOT}" -L 2 -I 'node_modules|.git|.DS_Store' || ls -la "${WORKSPACE_ROOT}"
}

# 生成清理报告
generate_report() {
    echo -e "${CYAN}📊 生成清理报告...${NC}"

    local report_file="${BACKUP_ROOT}/cleanup-report.md"

    cat > "${report_file}" << EOF
# YYC³ 清理和标准化报告

**执行时间**: $(date)
**备份目录**: ${BACKUP_ROOT}

## 清理统计

- 清理前大小: $(du -sh "${WORKSPACE_ROOT}" 2>/dev/null | cut -f1)
- 清理后大小: $(du -sh "${WORKSPACE_ROOT}" 2>/dev/null | cut -f1)
- 备份大小: $(du -sh "${BACKUP_ROOT}" 2>/dev/null | cut -f1)

## 核心目录结构

\`\`\`
${WORKSPACE_ROOT}/
├── configs/          # 统一配置文件
├── scripts/          # 工作流脚本
├── projects/         # 项目文件
├── deployments/      # 部署配置
├── active-projects/  # 活跃项目
├── claude-workspace/ # Claude工作区
├── logs/            # 日志文件
├── backups/         # 备份文件
├── yyc3-22/         # 本地设备配置
└── 0379-email-platform/ # 邮件平台
\`\`\`

## 环境配置

- **标准配置**: \`${WORKSPACE_ROOT}/configs/.env.standard\`
- **本地开发配置**: \`${WORKSPACE_ROOT}/configs/development/.env.local\`
- **0379.email配置**: \`${WORKSPACE_ROOT}/configs/domains/0379.email.env\`
- **0379.world配置**: \`${WORKSPACE_ROOT}/configs/domains/0379.world.env\`
- **数据库配置**: \`${WORKSPACE_ROOT}/configs/database/.env.nas-db\`

## 快速开始

1. 初始化开发环境:
   \`\`\`bash
   ./dev init
   \`\`\`

2. 检查环境状态:
   \`\`\`bash
   ./dev check
   \`\`\`

3. 启动开发服务:
   \`\`\`bash
   ./dev start
   \`\`\`

## 服务器信息

- **0379.email服务器**: 8.152.195.33
- **0379.world服务器**: 8.130.127.121
- **NAS数据库服务器**: 192.168.3.45
- **本地开发机**: 192.168.3.22

EOF

    echo -e "${GREEN}✅ 报告已生成: ${report_file}${NC}"
}

# 主函数
main() {
    echo -e "${CYAN}🚀 YYC³ 清理和标准化脚本启动${NC}"

    # 创建备份目录
    create_backup

    # 显示清理前状态
    echo -e "${PURPLE}===== 清理前状态 =====${NC}"
    show_disk_usage
    echo ""

    # 分析文件
    analyze_files
    echo ""

    # 查找重复文件
    find_duplicates
    echo ""

    # 备份重要文件
    backup_important_files
    echo ""

    # 移动重复文件
    move_duplicates
    echo ""

    # 清理临时文件
    cleanup_temp_files
    echo ""

    # 整理项目结构
    organize_projects
    echo ""

    # 创建符号链接
    create_symlinks
    echo ""

    # 验证结果
    verify_standardization
    echo ""

    # 显示清理后状态
    echo -e "${PURPLE}===== 清理后状态 =====${NC}"
    show_disk_usage
    echo ""

    # 生成报告
    generate_report

    echo -e "${GREEN}🎉 清理和标准化完成！${NC}"
    echo -e "${CYAN}💾 备份位置: ${BACKUP_ROOT}${NC}"
    echo -e "${CYAN}📋 使用 './dev help' 查看开发工作流帮助${NC}"
}

# 错误处理
trap 'echo -e "${RED}❌ 脚本执行出错${NC}"; exit 1' ERR

# 执行主函数
main "$@"