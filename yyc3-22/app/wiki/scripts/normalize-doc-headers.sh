#!/bin/bash
# === 脚本健康检查头 ===
set -euo pipefail  # 严格模式
trap "cleanup" EXIT INT TERM

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WIKI_ROOT="$(cd "$SCRIPT_DIR/../" && pwd)"

# 日志函数
log() {
    echo "[${1}] $(date +"%Y-%m-%d %H:%M:%S"): ${2}"
}

# 清理函数
cleanup() {
    log "INFO" "脚本执行结束，执行清理"
    # 在这里添加任何需要的清理操作
}

# 检查系统健康
check_system_health() {
    log "INFO" "执行系统健康检查"
    # 检查磁盘空间
    local disk_usage=$(df -h "$WIKI_ROOT" | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 90 ]; then
        log "ERROR" "磁盘空间不足: ${disk_usage}%"
        exit 1
    fi
    log "INFO" "系统健康检查通过"
}

# 生成标准文档头部
generate_header() {
    local file_path="$1"
    local file_name=$(basename "$file_path")
    local module=$(echo "$file_path" | sed -E 's|^'"$WIKI_ROOT"'/(.*)/[^/]+$|\1|' | sed 's|/|-|g')
    local description="$2"
    local author="YYC"
    local version="1.0.0"
    local created_date=$(date +"%Y-%m-%d")
    local updated_date=$(date +"%Y-%m-%d")
    
    # 检查文件是否已经存在，获取创建日期
    if [ -f "$file_path" ]; then
        local file_creation=$(stat -f "%Sm" -t "%Y-%m-%d" "$file_path")
        created_date="$file_creation"
    fi
    
    cat <<EOF
/** 
 * @file ${file_name} 
 * @description ${description} 
 * @module ${module:-wiki} 
 * @author ${author} 
 * @version ${version} 
 * @created ${created_date} 
 * @updated ${updated_date} 
 */
EOF
}

# 为单个文件添加标准头部
add_header_to_file() {
    local file_path="$1"
    local description="$2"
    
    if [ ! -f "$file_path" ]; then
        log "ERROR" "文件不存在: $file_path"
        return 1
    fi
    
    # 检查文件是否已经有标准头部
    if grep -q "@file" "$file_path" && grep -q "@description" "$file_path"; then
        log "INFO" "文件已有标准头部，跳过: $file_path"
        return 0
    fi
    
    log "INFO" "为文件添加标准头部: $file_path"
    
    # 生成临时文件
    local temp_file="${file_path}.tmp"
    
    # 写入标准头部
    generate_header "$file_path" "$description" > "$temp_file"
    
    # 添加原文件内容
    cat "$file_path" >> "$temp_file"
    
    # 替换原文件
    mv "$temp_file" "$file_path"
    
    log "INFO" "文件头部标准化完成: $file_path"
    return 0
}

# 批量处理目录中的所有markdown文件
batch_process_directory() {
    local directory="$1"
    local default_desc="$2"
    
    log "INFO" "开始批量处理目录: $directory"
    
    find "$directory" -type f -name "*.md" | while read -r file; do
        local rel_path=$(realpath --relative-to="$WIKI_ROOT" "$file")
        local file_name=$(basename "$file")
        local file_desc="$default_desc"
        
        # 根据文件路径生成更具体的描述
        if [[ "$rel_path" == Services/* ]]; then
            file_desc="${file_name%.md} 服务详细说明文档"
        elif [[ "$rel_path" == Deployment/* ]]; then
            file_desc="${file_name%.md} 部署配置和指南"
        elif [[ "$rel_path" == Security/* ]]; then
            file_desc="${file_name%.md} 安全配置和最佳实践"
        elif [[ "$rel_path" == FAQ/* ]]; then
            file_desc="${file_name%.md} 常见问题解答文档"
        elif [[ "$file_name" == "Home.md" ]]; then
            file_desc="邮件系统整体架构和功能概述"
        elif [[ "$file_name" == "README.md" ]]; then
            file_desc="文档中心导航和使用说明"
        fi
        
        add_header_to_file "$file" "$file_desc"
    done
    
    log "INFO" "目录批量处理完成: $directory"
}

# 显示帮助信息
show_help() {
    cat <<EOF
文档头部标准化工具

用法:
  $0 [选项] [文件/目录路径]

选项:
  -f, --file FILE_PATH     处理单个文件
  -d, --dir DIRECTORY      批量处理目录中的所有Markdown文件
  -h, --help               显示帮助信息
  -v, --version            显示版本信息

示例:
  # 处理单个文件
  $0 -f ../Home.md "邮件系统概览文档"

  # 批量处理目录
  $0 -d ../Services "服务配置文档"

  # 处理整个wiki目录
  $0 -d .. "邮件系统文档"
EOF
}

# 主函数
main() {
    log "INFO" "文档头部标准化工具启动"
    
    # 执行系统健康检查
    check_system_health
    
    # 解析命令行参数
    if [ $# -eq 0 ]; then
        show_help
        exit 1
    fi
    
    while [ $# -gt 0 ]; do
        case "$1" in
            -f|--file)
                if [ $# -lt 3 ]; then
                    log "ERROR" "缺少文件描述参数"
                    show_help
                    exit 1
                fi
                add_header_to_file "$2" "$3"
                shift 3
                ;;
            -d|--dir)
                if [ $# -lt 3 ]; then
                    log "ERROR" "缺少默认描述参数"
                    show_help
                    exit 1
                fi
                batch_process_directory "$2" "$3"
                shift 3
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            -v|--version)
                echo "文档头部标准化工具 v1.0.0"
                exit 0
                ;;
            *)
                log "ERROR" "未知选项: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    log "INFO" "文档头部标准化工具执行完成"
}

# 执行主函数
main "$@"
