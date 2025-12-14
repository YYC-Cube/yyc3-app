#!/bin/bash

# === SSH密钥生成脚本 ===
# 功能：根据ssh_config_example中的配置，为各设备及服务器生成对应的SSH密钥对
# 作者：系统自动生成
# 日期：$(date +"%Y-%m-%d")

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
    log_info "脚本执行完毕，正在清理..."
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

# 生成密钥函数
generate_key() {
    local key_path=$1
    local comment=$2
    local key_type=${3:-"ed25519"} # 默认使用更安全的ed25519类型
    
    # 展开~符号
    local expanded_path=$(echo "$key_path" | sed "s,^~,$HOME,")
    
    # 如果密钥已存在，提示用户
    if [[ -f "$expanded_path" ]]; then
        log_warn "密钥文件已存在: $expanded_path"
        read -p "是否覆盖现有密钥？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "跳过密钥生成: $expanded_path"
            return 0
        fi
    fi
    
    log_info "生成密钥: $expanded_path (类型: $key_type)"
    
    # 生成密钥，不使用密码保护
    ssh-keygen -t "$key_type" -f "$expanded_path" -N "" -C "$comment"</dev/null
    
    # 设置正确的权限
    chmod 600 "$expanded_path"
    chmod 644 "${expanded_path}.pub"
    
    log_success "密钥生成成功: $expanded_path"
}

# 从配置文件中提取密钥路径
extract_key_paths_from_config() {
    local config_file=$1
    
    if [[ ! -f "$config_file" ]]; then
        log_error "配置文件不存在: $config_file"
        return 1
    fi
    
    # 提取IdentityFile路径并去重
    mapfile -t identity_files < <(grep -i "^[[:space:]]*IdentityFile" "$config_file" | awk '{print $2}' | sort | uniq)
    
    echo "${identity_files[@]}"
}

# 显示密钥信息
show_key_info() {
    local key_path=$1
    
    # 展开~符号
    local expanded_path=$(echo "$key_path" | sed "s,^~,$HOME,")
    
    if [[ -f "$expanded_path" ]]; then
        log_info "密钥信息: $key_path"
        ssh-keygen -l -f "$expanded_path" 2>/dev/null || log_warn "无法显示密钥详细信息"
    else
        log_warn "密钥文件不存在: $key_path"
    fi
}

# 显示所有密钥的公钥
show_public_keys() {
    log_info "\n所有生成的公钥内容:"
    
    for key_file in "$HOME/.ssh/id_rsa_"* "$HOME/.ssh/id_ed25519_"*; do
        if [[ -f "${key_file}.pub" ]]; then
            log_info "文件: ${key_file}.pub"
            cat "${key_file}.pub"
            echo
        fi
    done
}

# 帮助信息
show_help() {
    echo -e "${BLUE}SSH密钥生成工具${NC}"
    echo -e "用途: 根据SSH配置文件生成对应的SSH密钥对"
    echo -e "\n用法: $0 [选项]"
    echo -e "\n选项:"
    echo -e "  -c, --config <path>  指定SSH配置文件路径 (默认: /Users/yanyu/www/app/scripts/ssh_config_example)"
    echo -e "  -t, --type <type>    密钥类型: rsa 或 ed25519 (默认: ed25519)"
    echo -e "  -d, --display        显示已生成的密钥信息"
    echo -e "  -h, --help           显示此帮助信息"
    echo -e "\n示例:"
    echo -e "  $0                    使用默认配置生成ed25519类型密钥"
    echo -e "  $0 --type rsa         生成RSA类型密钥"
    echo -e "  $0 --display          显示密钥信息"
    echo -e "\n注意:"
    echo -e "  - 建议使用ed25519类型密钥，更安全且性能更好"
    echo -e "  - RSA密钥默认长度为2048位"
    echo -e "  - 生成的密钥将保存在~/.ssh/目录下"
    echo -e "  - 请妥善保管您的私钥文件"
}

# 主函数
main() {
    # 默认参数
    local config_file="/Users/yanyu/www/app/scripts/ssh_config_example"
    local key_type="ed25519"
    local display_only=false
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case "$1" in
            -c|--config)
                config_file="$2"
                shift 2
                ;;
            -t|--type)
                key_type="$2"
                if [[ "$key_type" != "rsa" && "$key_type" != "ed25519" ]]; then
                    log_error "无效的密钥类型: $key_type，仅支持 rsa 或 ed25519"
                    show_help
                    exit 1
                fi
                shift 2
                ;;
            -d|--display)
                display_only=true
                shift
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
    
    if $display_only; then
        log_info "显示已生成的密钥信息..."
        
        # 从配置文件获取密钥路径
        local identity_files=($(extract_key_paths_from_config "$config_file"))
        
        if [[ ${#identity_files[@]} -eq 0 ]]; then
            log_warn "未找到密钥路径"
        else
            for key_path in "${identity_files[@]}"; do
                show_key_info "$key_path"
            done
        fi
        
        show_public_keys
        exit 0
    fi
    
    # 密钥配置映射
    declare -A key_configs
    key_configs["~/.ssh/id_rsa_local"]="本地局域网设备密钥"
    key_configs["~/.ssh/id_rsa_aliyun"]="阿里云服务器密钥"
    key_configs["~/.ssh/id_rsa_dev"]="开发环境服务器密钥"
    key_configs["~/.ssh/id_rsa_prod"]="生产环境服务器密钥"
    key_configs["~/.ssh/id_rsa_github_cube"]="GitHub主仓(YYC-Cube)密钥"
    key_configs["~/.ssh/id_rsa_github_neuxs"]="GitHub副仓(YY-Neuxs)密钥"
    key_configs["~/.ssh/id_rsa_docker"]="Docker远程访问密钥"
    
    # 从配置文件中提取额外的密钥路径
    log_info "从配置文件读取密钥路径: $config_file"
    
    # 检查配置文件是否存在
    if [[ -f "$config_file" ]]; then
        # 从配置文件中提取IdentityFile路径
        local extracted_files=($(extract_key_paths_from_config "$config_file"))
        
        if [[ ${#extracted_files[@]} -gt 0 ]]; then
            log_info "找到 ${#extracted_files[@]} 个密钥路径"
            
            # 添加提取的密钥路径到配置映射
            for key_path in "${extracted_files[@]}"; do
                # 避免重复添加
                if [[ -z "${key_configs["$key_path"]}" ]]; then
                    # 根据路径生成描述
                    local key_name=$(basename "$key_path")
                    key_configs["$key_path"]="配置文件中的密钥: $key_name"
                fi
            done
        fi
    else
        log_warn "配置文件不存在: $config_file，使用默认密钥配置"
    fi
    
    log_info "\n开始生成密钥对 (类型: $key_type)..."
    
    # 生成所有配置的密钥
    for key_path in "${!key_configs[@]}"; do
        local comment="${key_configs["$key_path"]}"
        generate_key "$key_path" "$comment" "$key_type"
    done
    
    log_success "\n所有密钥生成完成！"
    
    # 显示密钥摘要
    log_info "\n密钥生成摘要:"
    log_info "- 密钥类型: $key_type"
    log_info "- 生成数量: ${#key_configs[@]}"
    log_info "- 密钥目录: ~/.ssh/"
    
    # 显示公钥内容
    show_public_keys
    
    # 提供使用建议
    log_info "\n使用建议:"
    log_info "1. 将公钥复制到对应服务器:"
    log_info "   - ssh-copy-id -i ~/.ssh/id_rsa_local.pub user@server"
    log_info "   - 或手动将公钥内容添加到服务器的 ~/.ssh/authorized_keys 文件"
    log_info "2. 使用同步脚本将默认密钥同步至这些路径:"
    log_info "   - /Users/yanyu/www/app/scripts/sync-ssh-keys.sh"
    log_info "3. 设置SSH配置文件:"
    log_info "   - cp /Users/yanyu/www/app/scripts/ssh_config_example ~/.ssh/config"
    log_info "   - chmod 600 ~/.ssh/config"
}

# 执行主函数
main "$@"
