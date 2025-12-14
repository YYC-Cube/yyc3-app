#!/bin/bash

# === 脚本健康检查头 ===
set -euo pipefail  # 严格模式
trap "cleanup" EXIT INT TERM

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 清理函数
cleanup() {
    # 清理临时文件或资源
    log_info "脚本执行完毕，正在清理..."
}

# 检查系统类型
detect_os() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "linux"
    elif [[ "$OSTYPE" == "msys"* ]] || [[ "$OSTYPE" == "win32"* ]]; then
        echo "windows"
    else
        echo "unknown"
    fi
}

# 检查SSH目录是否存在并创建
ensure_ssh_directory() {
    local ssh_dir="$HOME/.ssh"
    if [[ ! -d "$ssh_dir" ]]; then
        log_info "创建SSH目录: $ssh_dir"
        mkdir -p "$ssh_dir"
        chmod 700 "$ssh_dir"
    fi
}

# 复制密钥函数（保留原始密钥）
copy_key() {
    local source_key=$1
    local target_key=$2
    
    if [[ -f "$source_key" ]]; then
        log_info "复制密钥: $source_key -> $target_key"
        cp "$source_key" "$target_key"
        chmod 600 "$target_key"
        
        # 如果存在公钥，也一起复制
        if [[ -f "${source_key}.pub" ]]; then
            log_info "复制公钥: ${source_key}.pub -> ${target_key}.pub"
            cp "${source_key}.pub" "${target_key}.pub"
            chmod 644 "${target_key}.pub"
        fi
        return 0
    else
        log_warn "源密钥文件不存在: $source_key"
        return 1
    fi
}

# 创建符号链接函数（不复制，仅链接）
link_key() {
    local source_key=$1
    local target_key=$2
    
    if [[ -f "$source_key" ]]; then
        log_info "创建链接: $source_key -> $target_key"
        # 如果目标链接已存在，先删除
        if [[ -L "$target_key" ]]; then
            rm "$target_key"
        elif [[ -f "$target_key" ]]; then
            log_warn "目标文件已存在且不是链接: $target_key，将其备份"
            mv "$target_key" "${target_key}.bak"
        fi
        ln -s "$source_key" "$target_key"
        
        # 如果存在公钥，也一起创建链接
        if [[ -f "${source_key}.pub" ]]; then
            if [[ -L "${target_key}.pub" ]]; then
                rm "${target_key}.pub"
            elif [[ -f "${target_key}.pub" ]]; then
                log_warn "目标公钥文件已存在且不是链接: ${target_key}.pub，将其备份"
                mv "${target_key}.pub" "${target_key}.pub.bak"
            fi
            ln -s "${source_key}.pub" "${target_key}.pub"
        fi
        return 0
    else
        log_warn "源密钥文件不存在: $source_key"
        return 1
    fi
}

# 根据SSH配置文件同步密钥
sync_keys_from_config() {
    local config_file=${1:-$HOME/.ssh/config}
    local mode=${2:-"copy"} # 可选值: copy, link
    local os_type=$(detect_os)
    
    log_info "检测到系统类型: $os_type"
    log_info "使用同步模式: $mode"
    
    # 定义默认密钥路径
    declare -A default_keys
    default_keys["macos"]="$HOME/.ssh/id_rsa"
    default_keys["linux"]="$HOME/.ssh/id_rsa"
    default_keys["windows"]="$HOME/.ssh/id_rsa"
    
    # 检测ed25519类型密钥（更安全）
    if [[ -f "$HOME/.ssh/id_ed25519" ]]; then
        default_keys["macos"]="$HOME/.ssh/id_ed25519"
        default_keys["linux"]="$HOME/.ssh/id_ed25519"
        default_keys["windows"]="$HOME/.ssh/id_ed25519"
        log_info "使用更安全的ED25519类型密钥"
    fi
    
    local default_key=${default_keys["$os_type"]}
    
    # 如果没有找到默认密钥，尝试创建一个
    if [[ ! -f "$default_key" ]]; then
        log_warn "未找到默认密钥，将创建新密钥: $default_key"
        ssh-keygen -t ed25519 -f "$default_key" -N "" -C "$(whoami)@$(hostname)"</dev/null
        chmod 600 "$default_key"
        chmod 644 "${default_key}.pub"
    fi
    
    # 读取配置文件中定义的自定义密钥路径
    log_info "从SSH配置文件读取自定义密钥路径: $config_file"
    
    # 检查配置文件是否存在
    if [[ ! -f "$config_file" ]]; then
        log_error "配置文件不存在: $config_file"
        log_info "将使用示例配置文件中的预设密钥路径"
        
        # 使用硬编码的预设路径
        declare -A custom_keys
        custom_keys["local"]="$HOME/.ssh/id_rsa_local"
        custom_keys["aliyun"]="$HOME/.ssh/id_rsa_aliyun"
        custom_keys["dev"]="$HOME/.ssh/id_rsa_dev"
        custom_keys["prod"]="$HOME/.ssh/id_rsa_prod"
        custom_keys["github_cube"]="$HOME/.ssh/id_rsa_github_cube"
        custom_keys["github_neuxs"]="$HOME/.ssh/id_rsa_github_neuxs"
        custom_keys["docker"]="$HOME/.ssh/id_rsa_docker"
        
        # 同步这些预设密钥
        for key_type in "${!custom_keys[@]}"; do
            target_key=${custom_keys["$key_type"]}
            
            if [[ "$mode" == "copy" ]]; then
                copy_key "$default_key" "$target_key"
            else
                link_key "$default_key" "$target_key"
            fi
        done
    else
        # 从配置文件中提取IdentityFile路径
        mapfile -t identity_files < <(grep -i "^[[:space:]]*IdentityFile" "$config_file" | awk '{print $2}' | sort | uniq)
        
        if [[ ${#identity_files[@]} -eq 0 ]]; then
            log_error "在配置文件中未找到IdentityFile配置"
            return 1
        fi
        
        log_info "找到 ${#identity_files[@]} 个自定义密钥路径"
        
        # 同步每个自定义密钥
        for identity_file in "${identity_files[@]}"; do
            # 展开~符号
            target_key=$(echo "$identity_file" | sed "s,^~,$HOME,")
            
            # 跳过已经是默认路径的密钥
            if [[ "$target_key" == "$default_key" ]]; then
                log_info "跳过默认密钥: $target_key"
                continue
            fi
            
            log_info "处理密钥: $target_key"
            
            # 根据模式复制或链接
            if [[ "$mode" == "copy" ]]; then
                copy_key "$default_key" "$target_key"
            else
                link_key "$default_key" "$target_key"
            fi
        done
    fi
    
    # 设置所有密钥文件的正确权限
    log_info "设置所有密钥文件的正确权限"
    chmod -f 600 "$HOME/.ssh/id_rsa_"* 2>/dev/null || true
    chmod -f 644 "$HOME/.ssh/id_rsa_"*.pub 2>/dev/null || true
    chmod -f 600 "$HOME/.ssh/id_ed25519_"* 2>/dev/null || true
    chmod -f 644 "$HOME/.ssh/id_ed25519_"*.pub 2>/dev/null || true
    
    log_success "密钥同步完成！"
    
    # 显示同步状态摘要
    log_info "\n密钥同步状态摘要:"
    log_info "默认密钥: $default_key"
    log_info "公钥文件: ${default_key}.pub"
    log_info "\n自定义密钥列表:"
    ls -la "$HOME/.ssh/id_rsa_"* 2>/dev/null || true
    ls -la "$HOME/.ssh/id_ed25519_"* 2>/dev/null || true
}

# 帮助信息
show_help() {
    echo -e "${BLUE}SSH密钥同步工具${NC}"
    echo -e "用途: 根据系统类型将默认路径的SSH密钥同步至预设路径"
    echo -e "\n用法: $0 [选项]"
    echo -e "\n选项:"
    echo -e "  -c, --config <path>  指定SSH配置文件路径 (默认: ~/.ssh/config)"
    echo -e "  -m, --mode <mode>    同步模式: copy (复制) 或 link (链接) (默认: copy)"
    echo -e "  -h, --help           显示此帮助信息"
    echo -e "\n示例:"
    echo -e "  $0                    使用默认配置复制密钥"
    echo -e "  $0 --mode link        使用链接模式同步密钥"
    echo -e "  $0 --config ~/.ssh/config.custom  使用自定义配置文件"
    echo -e "\n注意:"
    echo -e "  - copy模式: 复制密钥文件，修改不影响原文件"
    echo -e "  - link模式: 创建符号链接，节省空间但修改会相互影响"
    echo -e "  - 请确保您有权限访问和修改目标路径"
}

# 主函数
main() {
    # 默认参数
    local config_file="$HOME/.ssh/config"
    local mode="copy"
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case "$1" in
            -c|--config)
                config_file="$2"
                shift 2
                ;;
            -m|--mode)
                mode="$2"
                if [[ "$mode" != "copy" && "$mode" != "link" ]]; then
                    log_error "无效的同步模式: $mode，仅支持 copy 或 link"
                    show_help
                    exit 1
                fi
                shift 2
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log_error "未知选项: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 确保SSH目录存在
    ensure_ssh_directory
    
    # 同步密钥
    sync_keys_from_config "$config_file" "$mode"
}

# 执行主函数
main "$@"
