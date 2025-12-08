#!/bin/bash

# =============================================================================
# 0379.email 多项目协同智能平台 - 核心服务部署脚本
# 部署核心基础设施服务集群
# =============================================================================

set -e

# 颜色输出
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

# 检查系统环境
check_system() {
    log_info "检查系统环境..."

    # 检查Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装"
        exit 1
    fi

    # 检查Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose 未安装"
        exit 1
    fi

    # 检查Docker状态
    if ! docker info &> /dev/null; then
        log_error "Docker 服务未运行"
        exit 1
    fi

    # 检查端口占用
    log_info "检查端口占用情况..."
    local ports=(3000 3001 3002 3003 6379 3306 8000 8880 9090 3005)
    local port_conflicts=()

    for port in "${ports[@]}"; do
        if lsof -i :$port &> /dev/null; then
            port_conflicts+=($port)
        fi
    done

    if [ ${#port_conflicts[@]} -ne 0 ]; then
        log_warning "以下端口已被占用: ${port_conflicts[*]}"
        log_info "将自动清理冲突的容器..."

        # 清理可能冲突的容器
        docker-compose -f docker-compose-progressive.yml down &> /dev/null || true

        # 强制停止冲突的容器
        for port in "${port_conflicts[@]}"; do
            local pid=$(lsof -ti:$port 2>/dev/null || true)
            if [ -n "$pid" ]; then
                log_warning "停止占用端口 $port 的进程 (PID: $pid)"
                kill -9 $pid 2>/dev/null || true
            fi
        done
    fi

    log_success "系统环境检查完成"
}

# 创建必要的目录结构
create_directories() {
    log_info "创建必要的目录结构..."

    local directories=(
        "config/redis"
        "config/mariadb/init"
        "config/mariadb/conf"
        "config/nginx/conf.d"
        "config/monitoring"
        "logs"
        "data"
    )

    for dir in "${directories[@]}"; do
        mkdir -p "$dir"
    done

    log_success "目录结构创建完成"
}

# 生成配置文件
generate_configs() {
    log_info "生成配置文件..."

    # Redis配置
    cat > config/redis/redis-prod.conf << 'EOF'
# Redis生产环境配置
port 6379
bind 0.0.0.0
protected-mode yes
requirepass RedisSecurePass123456

# 内存配置
maxmemory 256mb
maxmemory-policy allkeys-lru

# 持久化配置
save 900 1
save 300 10
save 60 10000

# 日志配置
loglevel notice
logfile /var/log/redis/redis.log

# 性能配置
tcp-keepalive 300
timeout 0
EOF

    # MariaDB配置
    cat > config/mariadb/conf/my.cnf << 'EOF'
[mysqld]
# 基本设置
bind-address = 0.0.0.0
port = 3306
socket = /var/run/mysqld/mysqld.sock
datadir = /var/lib/mysql

# 字符集设置
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci
init-connect = 'SET NAMES utf8mb4'

# 性能设置
max_connections = 200
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
innodb_log_buffer_size = 16M

# 日志设置
log-error = /var/log/mysql/error.log
slow-query-log = 1
slow-query-log-file = /var/log/mysql/slow.log
long_query_time = 2

# 安全设置
local-infile = 0
EOF

    # Nginx配置
    cat > config/nginx/nginx-prod.conf << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # 日志格式
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    # 基本设置
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # 上游服务
    upstream api_backend {
        server api-service:3000;
    }

    upstream admin_backend {
        server admin-service:3001;
    }

    # 主服务器配置
    server {
        listen 8000;
        server_name localhost 0379.email;

        # API路由
        location /api/ {
            proxy_pass http://api_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # 超时设置
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
        }

        # 管理后台路由
        location /admin/ {
            proxy_pass http://admin_backend/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # 健康检查
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        # 默认页面
        location / {
            return 200 '0379.email Platform - Core Services\n';
            add_header Content-Type text/plain;
        }
    }
}
EOF

    log_success "配置文件生成完成"
}

# 部署核心服务
deploy_core_services() {
    log_info "开始部署核心服务..."

    # 检查docker-compose文件
    if [ ! -f "docker-compose-progressive.yml" ]; then
        log_error "docker-compose-progressive.yml 文件不存在"
        exit 1
    fi

    # 创建网络（如果不存在）
    log_info "创建Docker网络..."
    docker network create 0379-platform-network 2>/dev/null || true

    # 启动核心服务
    log_info "启动核心基础设施服务..."
    docker-compose -f docker-compose-progressive.yml up -d redis mariadb

    # 等待数据库启动
    log_info "等待数据库服务启动..."
    sleep 10

    # 启动应用服务
    log_info "启动应用服务..."
    docker-compose -f docker-compose-progressive.yml up -d api-service admin-service nginx

    # 等待服务启动
    log_info "等待所有服务启动..."
    sleep 15

    log_success "核心服务部署完成"
}

# 健康检查
health_check() {
    log_info "执行健康检查..."

    local services=(
        "Redis:redis:6379"
        "MariaDB:mariadb:3306"
        "API Service:api-service:3000"
        "Admin Service:admin-service:3001"
        "Nginx:nginx:8000"
    )

    local all_healthy=true

    for service in "${services[@]}"; do
        local name=$(echo $service | cut -d: -f1)
        local host=$(echo $service | cut -d: -f2)
        local port=$(echo $service | cut -d: -f3)

        log_info "检查 $name..."

        if nc -z $host $port 2>/dev/null; then
            log_success "$name ($host:$port) - 健康"
        else
            log_error "$name ($host:$port) - 不可达"
            all_healthy=false
        fi
    done

    if [ "$all_healthy" = true ]; then
        log_success "所有核心服务健康检查通过"
        return 0
    else
        log_error "部分服务健康检查失败"
        return 1
    fi
}

# 显示服务状态
show_status() {
    log_info "服务状态总览:"
    echo ""

    # Docker容器状态
    echo "=== Docker容器状态 ==="
    docker-compose -f docker-compose-progressive.yml ps
    echo ""

    # 端口监听状态
    echo "=== 端口监听状态 ==="
    local ports=(6379 3306 3000 3001 8000 8880)
    for port in "${ports[@]}"; do
        if lsof -i :$port &> /dev/null; then
            echo "✅ 端口 $port - 正在监听"
        else
            echo "❌ 端口 $port - 未监听"
        fi
    done
    echo ""

    # 服务访问地址
    echo "=== 服务访问地址 ==="
    echo "🚀 API服务:       http://localhost:3000"
    echo "🎛️ 管理后台:      http://localhost:3001"
    echo "🌐 Nginx网关:     http://localhost:8000"
    echo "🌐 Nginx备用:     http://localhost:8880"
    echo "🔴 Redis:         localhost:6379"
    echo "🗄️ MariaDB:       localhost:3306"
    echo ""

    # 健康检查端点
    echo "=== 健康检查端点 ==="
    echo "✅ API健康检查:   http://localhost:3000/health"
    echo "✅ 管理后台检查:  http://localhost:3001/health"
    echo "✅ Nginx健康检查: http://localhost:8000/health"
    echo ""
}

# 主函数
main() {
    echo "🚀 0379.email 多项目协同智能平台 - 核心服务部署"
    echo "=================================================================="
    echo ""

    # 检查是否在正确的目录
    if [ ! -f "docker-compose-progressive.yml" ]; then
        log_error "请在包含 docker-compose-progressive.yml 的目录中运行此脚本"
        exit 1
    fi

    # 执行部署步骤
    check_system
    create_directories
    generate_configs
    deploy_core_services

    # 健康检查
    if health_check; then
        echo ""
        log_success "🎉 核心服务部署成功！"
        show_status

        echo ""
        log_info "📖 使用指南:"
        echo "1. 查看服务状态: docker-compose -f docker-compose-progressive.yml ps"
        echo "2. 查看日志: docker-compose -f docker-compose-progressive.yml logs -f [service-name]"
        echo "3. 停止服务: docker-compose -f docker-compose-progressive.yml down"
        echo "4. 重启服务: docker-compose -f docker-compose-progressive.yml restart [service-name]"
        echo ""
        log_info "🚀 下一步: 运行 'bash deploy-advanced-services.sh' 部署高级功能服务"

    else
        log_error "❌ 部署过程中发现问题，请检查日志"
        echo ""
        log_info "🔍 故障排查:"
        echo "1. 查看容器日志: docker-compose -f docker-compose-progressive.yml logs"
        echo "2. 检查容器状态: docker ps -a"
        echo "3. 检查网络连接: docker network ls"
        exit 1
    fi
}

# 运行主函数
main "$@"