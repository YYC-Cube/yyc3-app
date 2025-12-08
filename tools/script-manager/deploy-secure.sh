#!/bin/bash
# =============================================================================
# 0379.email 项目 - 安全部署脚本
# =============================================================================

set -euo pipefail

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 配置变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SERVER_HOST="yyc3-121"
SERVER_USER="yanyu"
DEPLOY_DIR="/home/yanyu/www/email"
BACKUP_DIR="/home/yanyu/backups"
LOG_FILE="$PROJECT_DIR/logs/deploy.log"

# 创建必要的目录
mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "$PROJECT_DIR/keys"

# 检查必要的环境变量
check_environment() {
    log_info "检查部署环境..."

    local required_vars=(
        "REDIS_PASSWORD"
        "JWT_SECRET"
        "API_KEY"
        "ADMIN_PASSWORD"
    )

    local secrets_file="$PROJECT_DIR/keys/production-secrets.env"
    if [[ ! -f "$secrets_file" ]]; then
        log_error "密钥文件不存在: $secrets_file"
        log_info "请先运行: ./scripts/update-secure-configs.sh"
        exit 1
    fi

    # 加载密钥
    source "$secrets_file"

    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            log_error "环境变量 $var 未设置"
            exit 1
        fi
    done

    log_success "环境检查通过"
}

# 验证SSH连接
verify_ssh_connection() {
    log_info "验证SSH连接..."

    if ! ssh -o ConnectTimeout=10 -o BatchMode=yes "$SERVER_USER@$SERVER_HOST" "echo 'SSH连接成功'" 2>/dev/null; then
        log_error "无法连接到服务器 $SERVER_HOST"
        log_info "请确保："
        log_info "1. SSH密钥已正确配置"
        log_info "2. 服务器地址正确: $SERVER_HOST"
        log_info "3. 防火墙允许SSH连接"
        exit 1
    fi

    log_success "SSH连接验证通过"
}

# 备份当前部署
backup_current_deployment() {
    log_info "备份当前部署..."

    local backup_name="email-backup-$(date +%Y%m%d_%H%M%S)"
    local remote_backup_dir="$BACKUP_DIR/$backup_name"

    ssh "$SERVER_USER@$SERVER_HOST" "
        set -e
        mkdir -p '$remote_backup_dir'
        if [[ -d '$DEPLOY_DIR' ]]; then
            cp -r '$DEPLOY_DIR' '$remote_backup_dir/'
            echo '备份完成: $remote_backup_dir'
        else
            echo '部署目录不存在，跳过备份'
        fi
    "

    log_success "备份完成: $backup_name"
}

# 同步文件到服务器
sync_files() {
    log_info "同步文件到服务器..."

    # 排除不需要的文件
    local exclude_args=(
        --exclude='node_modules'
        --exclude='.git'
        --exclude='logs'
        --exclude='*.log'
        --exclude='keys'
        --exclude='.DS_Store'
        --exclude='backup*'
        --exclude='*.backup.*'
        --exclude='scripts/secure-passwords-generator.sh'
    )

    # 使用 rsync 同步
    rsync -avz --delete "${exclude_args[@]}" \
        -e "ssh -o StrictHostKeyChecking=yes" \
        "$PROJECT_DIR/" "$SERVER_USER@$SERVER_HOST:$DEPLOY_DIR/"

    log_success "文件同步完成"
}

# 同步密钥文件
sync_secrets() {
    log_info "同步密钥文件..."

    local secrets_file="$PROJECT_DIR/keys/production-secrets.env"
    local remote_secrets="$DEPLOY_DIR/.env.production"

    # 安全传输密钥文件
    scp -o StrictHostKeyChecking=yes "$secrets_file" "$SERVER_USER@$SERVER_HOST:$remote_secrets"

    # 设置正确的权限
    ssh "$SERVER_USER@$SERVER_HOST" "chmod 600 '$remote_secrets'"

    log_success "密钥文件同步完成"
}

# 部署 Docker 服务
deploy_docker() {
    log_info "部署 Docker 服务..."

    ssh "$SERVER_USER@$SERVER_HOST" "
        set -e
        cd '$DEPLOY_DIR'

        # 创建必要的目录
        mkdir -p logs uploads ssl monitoring

        # 复制安全配置
        cp docker-compose.secure.yml docker-compose.yml
        cp nginx/nginx.secure.conf nginx/nginx.conf

        # 停止现有服务
        docker-compose down --remove-orphans 2>/dev/null || true

        # 拉取最新镜像
        docker-compose pull

        # 启动服务
        docker-compose up -d

        # 等待服务启动
        sleep 30

        # 检查服务状态
        docker-compose ps
    "

    log_success "Docker 服务部署完成"
}

# 健康检查
health_check() {
    log_info "执行健康检查..."

    local max_attempts=30
    local attempt=1

    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s "https://0379.email/health" >/dev/null 2>&1; then
            log_success "健康检查通过"
            return 0
        fi

        log_info "健康检查失败，重试 $attempt/$max_attempts..."
        sleep 10
        ((attempt++))
    done

    log_error "健康检查失败，请检查服务状态"
    return 1
}

# 安全验证
security_verification() {
    log_info "执行安全验证..."

    # 检查端口绑定
    ssh "$SERVER_USER@$SERVER_HOST" "
        set -e
        echo '检查端口绑定...'
        netstat -tuln | grep -E ':(80|443|3000|3001|6379|5432)'
    "

    # 检查容器安全配置
    ssh "$SERVER_USER@$SERVER_HOST" "
        set -e
        cd '$DEPLOY_DIR'
        echo '检查容器用户配置...'
        docker-compose exec api whoami
        docker-compose exec redis whoami
    "

    log_success "安全验证通过"
}

# 清理旧备份
cleanup_old_backups() {
    log_info "清理旧备份..."

    ssh "$SERVER_USER@$SERVER_HOST" "
        set -e
        cd '$BACKUP_DIR'
        # 保留最近7天的备份
        find . -maxdepth 1 -type d -name 'email-backup-*' -mtime +7 -exec rm -rf {} +
        echo '旧备份清理完成'
    "

    log_success "备份清理完成"
}

# 部署后操作
post_deploy() {
    log_info "执行部署后操作..."

    # 更新监控配置
    ssh "$SERVER_USER@$SERVER_HOST" "
        set -e
        cd '$DEPLOY_DIR'

        # 重新加载 Nginx 配置
        docker-compose exec nginx nginx -s reload

        # 设置日志轮转
        cat > /etc/logrotate.d/0379-email << 'EOF'
$DEPLOY_DIR/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $SERVER_USER $SERVER_USER
    postrotate
        docker-compose exec nginx nginx -s reload
    endscript
}
EOF
    "

    log_success "部署后操作完成"
}

# 回滚函数
rollback() {
    log_warning "开始回滚到上一个版本..."

    local latest_backup=$(ssh "$SERVER_USER@$SERVER_HOST" "
        cd '$BACKUP_DIR'
        ls -t email-backup-* 2>/dev/null | head -1
    ")

    if [[ -z "$latest_backup" ]]; then
        log_error "没有找到可用的备份"
        exit 1
    fi

    log_info "回滚到备份: $latest_backup"

    ssh "$SERVER_USER@$SERVER_HOST" "
        set -e
        cd '$BACKUP_DIR/$latest_backup'

        # 停止当前服务
        cd '$DEPLOY_DIR'
        docker-compose down

        # 恢复备份
        rm -rf '$DEPLOY_DIR'/*
        cp -r email/* '$DEPLOY_DIR/'

        # 重启服务
        cd '$DEPLOY_DIR'
        docker-compose up -d
    "

    log_success "回滚完成"
}

# 显示帮助信息
show_help() {
    cat << EOF
0379.email 项目安全部署脚本

用法: $0 [选项]

选项:
    -h, --help      显示此帮助信息
    -r, --rollback  回滚到上一个版本
    -c, --check     仅执行健康检查
    -b, --backup    仅执行备份操作

示例:
    $0              # 执行完整部署
    $0 -r           # 回滚到上一个版本
    $0 -c           # 检查服务状态
    $0 -b           # 创建备份

环境要求:
    - SSH 密钥已配置
    - 生产密钥文件已生成
    - Docker 已安装在服务器上

EOF
}

# 主函数
main() {
    local action="deploy"

    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -r|--rollback)
                action="rollback"
                shift
                ;;
            -c|--check)
                action="check"
                shift
                ;;
            -b|--backup)
                action="backup"
                shift
                ;;
            *)
                log_error "未知选项: $1"
                show_help
                exit 1
                ;;
        esac
    done

    # 记录开始时间
    local start_time=$(date +%s)

    log_info "开始 0379.email 项目安全部署..."
    log_info "目标服务器: $SERVER_HOST"
    log_info "部署目录: $DEPLOY_DIR"

    case $action in
        "deploy")
            check_environment
            verify_ssh_connection
            backup_current_deployment
            sync_files
            sync_secrets
            deploy_docker
            health_check
            security_verification
            post_deploy
            cleanup_old_backups
            ;;
        "rollback")
            verify_ssh_connection
            rollback
            ;;
        "check")
            verify_ssh_connection
            health_check
            security_verification
            ;;
        "backup")
            verify_ssh_connection
            backup_current_deployment
            ;;
    esac

    # 计算耗时
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    log_success "操作完成！耗时: ${duration}s"
    log_info "部署日志: $LOG_FILE"
}

# 错误处理
trap 'log_error "部署过程中发生错误，请检查日志"; exit 1' ERR

# 执行主函数
main "$@"