#!/bin/bash
# =============================================================================
# 0379.email 项目 - 每日备份脚本
# =============================================================================

set -euo pipefail

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 配置变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_DIR/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 备份函数
backup_redis() {
    log_info "备份 Redis 数据..."
    docker-compose exec -T redis redis-cli -a HAtwyyb34murBW7jzkUmag8x BGSAVE
    sleep 5
    docker cp $(docker-compose ps -q redis):/data/dump.rdb "$BACKUP_DIR/redis_$DATE.rdb"
    log_success "Redis 备份完成"
}

backup_mongodb() {
    log_info "备份 MongoDB 数据..."
    docker-compose exec -T mongodb mongodump --uri="mongodb://admin:5LUg9loJ0io6e4R5PJ6lfmhd@localhost:27017" --out="/tmp/mongodb_$DATE"
    docker cp $(docker-compose ps -q mongodb):/tmp/mongodb_$DATE "$BACKUP_DIR/"
    log_success "MongoDB 备份完成"
}

backup_postgres() {
    log_info "备份 PostgreSQL 数据..."
    docker-compose exec -T postgres pg_dump -U postgres -d 0379email > "$BACKUP_DIR/postgres_$DATE.sql"
    log_success "PostgreSQL 备份完成"
}

backup_configs() {
    log_info "备份配置文件..."
    tar -czf "$BACKUP_DIR/configs_$DATE.tar.gz" -C "$PROJECT_DIR" configs/ docker-compose*.yml
    log_success "配置文件备份完成"
}

backup_keys() {
    log_info "备份密钥文件..."
    tar -czf "$BACKUP_DIR/keys_$DATE.tar.gz" -C "$PROJECT_DIR" keys/
    chmod 600 "$BACKUP_DIR/keys_$DATE.tar.gz"
    log_success "密钥文件备份完成"
}

# 清理旧备份
cleanup_old_backups() {
    log_info "清理 7 天前的备份文件..."
    find "$BACKUP_DIR" -name "*.sql" -mtime +7 -delete
    find "$BACKUP_DIR" -name "*.rdb" -mtime +7 -delete
    find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete
    find "$BACKUP_DIR" -type d -name "mongodb_*" -mtime +7 -exec rm -rf {} + 2>/dev/null || true
    log_success "旧备份清理完成"
}

# 主函数
main() {
    log_info "开始执行每日备份 - $DATE"
    echo ""

    # 执行备份
    backup_redis
    backup_mongodb
    backup_postgres
    backup_configs
    backup_keys

    echo ""
    cleanup_old_backups

    echo ""
    log_success "🎉 每日备份完成！"
    log_info "备份位置: $BACKUP_DIR"
}

# 执行主函数
main
