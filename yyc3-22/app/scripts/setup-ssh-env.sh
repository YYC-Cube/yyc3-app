#!/bin/bash

# === SSH环境设置启动脚本 ===
# 功能：整合密钥生成和同步功能，一键准备SSH密钥环境
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

# 脚本路径定义
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GENERATE_KEYS_SCRIPT="$SCRIPT_DIR/generate-ssh-keys.sh"
SYNC_KEYS_SCRIPT="$SCRIPT_DIR/sync-ssh-keys.sh"
SSH_CONFIG_EXAMPLE="$SCRIPT_DIR/ssh_config_example"

# 清理函数
cleanup() {
    log_info "SSH环境设置脚本执行完毕"
}

# 检查脚本是否存在
check_scripts() {
    if [[ ! -x "$GENERATE_KEYS_SCRIPT" ]]; then
        log_error "密钥生成脚本不存在或无执行权限: $GENERATE_KEYS_SCRIPT"
        return 1
    fi
    
    if [[ ! -x "$SYNC_KEYS_SCRIPT" ]]; then
        log_error "密钥同步脚本不存在或无执行权限: $SYNC_KEYS_SCRIPT"
        return 1
    fi
    
    if [[ ! -f "$SSH_CONFIG_EXAMPLE" ]]; then
        log_error "SSH配置示例文件不存在: $SSH_CONFIG_EXAMPLE"
        return 1
    fi
    
    return 0
}

# 显示环境信息
show_environment() {
    log_info "\n=== 环境信息 ==="
    log_info "操作系统: $(uname -a)"
    log_info "当前用户: $(whoami)"
    log_info "SSH目录: $HOME/.ssh"
    log_info "脚本目录: $SCRIPT_DIR"
    log_info "生成密钥脚本: $GENERATE_KEYS_SCRIPT"
    log_info "同步密钥脚本: $SYNC_KEYS_SCRIPT"
    log_info "配置示例文件: $SSH_CONFIG_EXAMPLE"
    log_info "================\n"
}

# 备份现有SSH配置
backup_existing() {
    if [[ -f "$HOME/.ssh/config" ]]; then
        local backup_file="$HOME/.ssh/config.$(date +"%Y%m%d_%H%M%S").bak"
        log_info "备份现有SSH配置: $HOME/.ssh/config -> $backup_file"
        cp "$HOME/.ssh/config" "$backup_file"
    fi
}

# 复制SSH配置文件
copy_ssh_config() {
    local dest_config="$HOME/.ssh/config"
    
    log_info "复制SSH配置文件: $SSH_CONFIG_EXAMPLE -> $dest_config"
    cp "$SSH_CONFIG_EXAMPLE" "$dest_config"
    chmod 600 "$dest_config"
    log_success "SSH配置文件已复制并设置权限"
}

# 执行完整设置流程
run_full_setup() {
    log_info "开始SSH环境完整设置流程..."
    
    # 1. 备份现有配置
    backup_existing
    
    # 2. 复制SSH配置文件
    copy_ssh_config
    
    # 3. 生成密钥对
    log_info "\n执行密钥生成脚本..."
    "$GENERATE_KEYS_SCRIPT"
    
    # 4. 同步密钥
    log_info "\n执行密钥同步脚本..."
    "$SYNC_KEYS_SCRIPT"
    
    log_success "\nSSH环境完整设置完成！"
}

# 显示SSH配置信息
show_ssh_config() {
    log_info "\n=== 当前SSH配置摘要 ==="
    if [[ -f "$HOME/.ssh/config" ]]; then
        log_info "主机配置列表:"
        grep -i "^[[:space:]]*Host " "$HOME/.ssh/config" | awk '{print "  " $2}'
        log_info "密钥文件列表:"
        grep -i "^[[:space:]]*IdentityFile " "$HOME/.ssh/config" | awk '{print "  " $2}'
    else
        log_warn "未找到SSH配置文件: $HOME/.ssh/config"
    fi
    log_info "=====================\n"
}

# 显示密钥状态
show_key_status() {
    log_info "\n=== 当前密钥状态 ==="
    if [[ -d "$HOME/.ssh" ]]; then
        log_info "密钥文件:"
        ls -la "$HOME/.ssh/" | grep -E "id_(rsa|ed25519)"
    else
        log_warn "未找到SSH目录: $HOME/.ssh"
    fi
    log_info "==================\n"
}

# 帮助信息
show_help() {
    echo -e "${BLUE}SSH环境设置启动脚本${NC}"
    echo -e "用途: 整合密钥生成和同步功能，一键准备SSH密钥环境"
    echo -e "\n用法: $0 [选项]"
    echo -e "\n选项:"
    echo -e "  --full               执行完整设置流程（备份配置、复制配置、生成密钥、同步密钥）"
    echo -e "  --generate           仅执行密钥生成"
    echo -e "  --sync               仅执行密钥同步"
    echo -e "  --copy-config        仅复制SSH配置文件（会备份现有配置）"
    echo -e "  --show-env           显示环境信息"
    echo -e "  --show-config        显示SSH配置摘要"
    echo -e "  --show-keys          显示密钥状态"
    echo -e "  -h, --help           显示此帮助信息"
    echo -e "\n示例:"
    echo -e "  $0 --full            执行完整设置流程"
    echo -e "  $0 --generate        仅生成密钥"
    echo -e "  $0 --sync            仅同步密钥"
    echo -e "  $0 --show-config     查看当前SSH配置"
}

# 主函数
main() {
    # 检查脚本是否存在
    if ! check_scripts; then
        log_error "必要的脚本文件缺失，请确保所有脚本都已创建并具有执行权限"
        exit 1
    fi
    
    # 如果没有参数，显示帮助信息
    if [[ $# -eq 0 ]]; then
        show_help
        exit 0
    fi
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --full)
                show_environment
                run_full_setup
                show_ssh_config
                show_key_status
                shift
                ;;
            --generate)
                log_info "执行密钥生成脚本..."
                "$GENERATE_KEYS_SCRIPT"
                shift
                ;;
            --sync)
                log_info "执行密钥同步脚本..."
                "$SYNC_KEYS_SCRIPT"
                shift
                ;;
            --copy-config)
                backup_existing
                copy_ssh_config
                shift
                ;;
            --show-env)
                show_environment
                shift
                ;;
            --show-config)
                show_ssh_config
                shift
                ;;
            --show-keys)
                show_key_status
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
    
    # 显示使用说明
    log_info "\n使用说明:"
    log_info "1. 连接服务器示例:"
    log_info "   - 连接本地MacBook: ssh yyc3-22"
    log_info "   - 连接阿里云服务器: ssh yyc3-121"
    log_info "2. 如需将公钥添加到服务器:"
    log_info "   - ssh-copy-id -i ~/.ssh/id_rsa_local.pub user@server"
    log_info "3. 如需重新生成或同步密钥，请再次运行此脚本"
}

# 执行主函数
main "$@"
