/**
 * @file 服务初始化脚本
 * @description 多服务平台一键初始化脚本
 * @module scripts/init
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

#!/bin/bash
# === 脚本健康检查头 ===
set -euo pipefail
trap "echo '初始化操作已完成'" EXIT INT TERM

# 项目根目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${SCRIPT_DIR}/.."
ENV_FILE="${PROJECT_ROOT}/services/.env.local"

# 读取.env.local文件
if [ -f "$ENV_FILE" ]; then
  # 使用更安全的方式读取环境变量，忽略包含空格的注释行
  while IFS='=' read -r key value; do
    # 跳过空行和注释行
    [[ -z "$key" || "$key" =~ ^# ]] && continue
    # 移除value中的引号
    value=$(echo "$value" | sed -e 's/^[\'"]//' -e 's/[\'"]$//')
    # 导出环境变量
    export "$key=$value"
  done < "$ENV_FILE"
else
  echo "❌ 未找到.env.local文件，请确保文件存在于$ENV_FILE"
  exit 1
fi

# 颜色定义
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

echo -e "${GREEN}🚀 0379.email 多服务平台一键初始化脚本${NC}"

# 项目根目录
SERVICES=('api' 'admin' 'llm' 'mail')
PORTS=(${PORT:-3000} ${PORT_ADMIN:-3001} ${PORT_LLM:-3002} ${PORT_MAIL:-3003})
DOMAIN_BASE="${EMAIL_DOMAIN:-0379.email}"
DOMAINS=('api.${DOMAIN_BASE}' 'admin.${DOMAIN_BASE}' 'llm.${DOMAIN_BASE}' 'mail.${DOMAIN_BASE}')
LOG_DIR="${PROJECT_ROOT}/logs"

# TLS证书配置
TLS_EMAIL="${EMAIL_SUPPORT:-admin@${DOMAIN_BASE}}"
TLS_CERT_PATH="${CERT_PATH:-/etc/letsencrypt/live/${DOMAIN_BASE}}"

# 确保日志目录存在
mkdir -p "$LOG_DIR"

# 日志函数
log_info() {
  echo -e "${GREEN}ℹ️  [INFO] $1${NC}"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] $1" >> "${LOG_DIR}/init.log"
}

log_warn() {
  echo -e "${YELLOW}⚠️  [WARN]${NC} $1"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [WARN] $1" >> "${LOG_DIR}/init.log"
}

log_error() {
  echo -e "${RED}❌ [ERROR]${NC} $1"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] $1" >> "${LOG_DIR}/error.log"
  return 1
}

log_success() {
  echo -e "${GREEN}✅ [SUCCESS]${NC} $1"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [SUCCESS] $1" >> "${LOG_DIR}/init.log"
}

# 检查系统依赖
check_dependencies() {
  log_info "检查系统依赖..."
  
  # 必需依赖
  for cmd in curl node npm; do
    if ! command -v $cmd &> /dev/null; then
      log_error "未找到 $cmd，请先安装"
      exit 1
    fi
    log_info "✅ $cmd 已安装"
  done
  
  # 可选依赖
  for cmd in nginx pm2; do
    if ! command -v $cmd &> /dev/null; then
      log_warn "未找到 $cmd，某些功能可能受限"
    else
      log_info "✅ $cmd 已安装"
    fi
  done
  
  log_success "系统依赖检查完成"
}

# 初始化.env文件
init_env_files() {
  log_info "初始化.env文件..."
  
  for i in "${!SERVICES[@]}"; do
    local service="${SERVICES[$i]}"
    local port="${PORTS[$i]}"
    local domain="${DOMAINS[$i]}"
    local service_dir="$PROJECT_ROOT/$service"
    local env_file="$service_dir/.env"
    local env_example_file="$service_dir/.env.example"
    
    # 确保服务目录存在
    mkdir -p "$service_dir"
    mkdir -p "$service_dir/logs"
    mkdir -p "$service_dir/static"
    mkdir -p "$service_dir/media"
    
    if [[ -f "$env_example_file" ]]; then
      # 如果服务目录下有.env.example，则使用它
      cp "$env_example_file" "$env_file"
      log_info "使用服务特定的 .env.example 创建 $service/.env"
    elif [[ -f "$PROJECT_ROOT/.env.example" ]]; then
      # 否则使用根目录的.env.example
      cp "$PROJECT_ROOT/.env.example" "$env_file"
      log_info "使用根目录 .env.example 创建 $service/.env"
    else
      # 如果都没有，创建基本的.env文件
      log_warn "未找到.env.example文件，创建基本的.env文件"
      cat > "$env_file" << EOF
# $service 服务配置
PORT=$port
HOST=0.0.0.0
NODE_ENV=development
SERVICE_NAME=$domain
# 数据库连接信息
DATABASE_URL=mongodb://localhost:27017/email_$service
# 日志级别
LOG_LEVEL=info
EOF
    fi
    
    # 更新端口和服务名称
    sed -i '' "s/PORT=[0-9]*/PORT=$port/g" "$env_file"
    # 确保不重复添加SERVICE_NAME
    if ! grep -q "^SERVICE_NAME=" "$env_file"; then
        echo "SERVICE_NAME=$domain" >> "$env_file"
    else
        sed -i '' "s/^SERVICE_NAME=.*/SERVICE_NAME=$domain/g" "$env_file"
    fi
    
    log_success "✅ 已初始化 $service/.env 文件，端口: $port"
  done
}

# 安装项目依赖
install_dependencies() {
  log_info "检查并安装项目依赖..."
  
  # 检查项目根目录的依赖
  if [[ -f "$PROJECT_ROOT/package.json" ]]; then
    log_info "安装项目根目录依赖..."
    cd "$PROJECT_ROOT"
    npm install --production || log_warn "项目根目录依赖安装可能不完全成功"
  fi
  
  # 安装各服务的依赖
  for service in "${SERVICES[@]}"; do
    local service_dir="$PROJECT_ROOT/$service"
    if [[ -d "$service_dir" && -f "$service_dir/package.json" ]]; then
      log_info "安装 $service 服务依赖..."
      cd "$service_dir"
      npm install --production || log_warn "$service 服务依赖安装可能不完全成功"
    else
      log_warn "$service 服务目录或package.json不存在，跳过依赖安装"
    fi
  done
  
  log_success "✅ 依赖检查和安装完成"
}

# 配置TLS证书
setup_tls_secrets() {
  log_info "配置TLS证书..."
  local cert_path="/etc/letsencrypt/live/0379.email"
  local local_cert_dir="${PROJECT_ROOT}/cert"
  
  # 创建本地证书目录
  mkdir -p "$local_cert_dir"
  
  # 检查证书是否存在
  if [[ ! -d "$cert_path" ]]; then
    log_warn "未找到证书目录 $cert_path，将跳过TLS配置"
    log_warn "请确保已通过 certbot 申请证书: certbot certonly --standalone -d 0379.email -d *.0379.email"
    log_warn "或者手动将证书文件放置在: $local_cert_dir"
    return 0
  fi
  
  # 检查证书文件
  for cert_file in fullchain.pem privkey.pem; do
    if [[ -f "$cert_path/$cert_file" ]]; then
      # 复制证书到本地目录以便Nginx使用
      cp "$cert_path/$cert_file" "$local_cert_dir/"
      log_info "✅ 已复制证书文件: $cert_file"
    else
      log_error "未找到证书文件 $cert_path/$cert_file"
      return 1
    fi
  done
  
  log_success "✅ TLS证书配置完成"
  return 0
}

# 配置Nginx
setup_nginx() {
  log_info "配置Nginx..."
  
  # 检查Nginx是否安装
  if ! command -v nginx &> /dev/null; then
    log_warn "Nginx未安装，跳过Nginx配置"
    log_warn "请手动安装Nginx并配置或使用其他Web服务器"
    return 0
  fi
  
  # 确定Nginx配置目录（根据操作系统可能不同）
  local nginx_available
  local nginx_enabled
  
  if [[ -d "/usr/local/etc/nginx/sites-available" ]]; then
    # macOS Homebrew 安装的Nginx
    nginx_available="/usr/local/etc/nginx/sites-available"
    nginx_enabled="/usr/local/etc/nginx/sites-enabled"
  elif [[ -d "/etc/nginx/sites-available" ]]; then
    # Linux 标准位置
    nginx_available="/etc/nginx/sites-available"
    nginx_enabled="/etc/nginx/sites-enabled"
  else
    # 尝试查找nginx.conf位置并推断配置目录
    local nginx_conf=$(nginx -V 2>&1 | grep -o 'conf-path=[^ ]*' | cut -d'=' -f2)
    local nginx_dir=$(dirname "$nginx_conf")
    nginx_available="$nginx_dir/sites-available"
    nginx_enabled="$nginx_dir/sites-enabled"
  fi
  
  local local_cert_dir="${PROJECT_ROOT}/cert"
  local cert_path="$local_cert_dir"
  
  # 创建Nginx配置目录（如果不存在）
  mkdir -p "$nginx_available"
  mkdir -p "$nginx_enabled"
  
  # 为每个服务生成Nginx配置
  for i in "${!SERVICES[@]}"; do
    local service="${SERVICES[$i]}"
    local port="${PORTS[$i]}"
    local domain="${DOMAINS[$i]}"
    local conf_file="$nginx_available/${service}.0379.email.conf"
    
    log_info "生成 $domain 的Nginx配置..."
    
    # 生成Nginx配置文件（支持HTTP和HTTPS）
    cat > "$conf_file" <<EOF
# $service 服务的Nginx配置
server {
    listen 80;
    server_name $domain;
    
    # 重定向HTTP到HTTPS（如果证书存在）
    $(if [[ -f "$cert_path/fullchain.pem" ]]; then
      echo "    return 301 https://\$host\$request_uri;"
    else
      echo "    # 证书不存在，暂时使用HTTP"
      cat << HTTP_CONF
    location / {
        proxy_pass http://127.0.0.1:$port;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
HTTP_CONF
    fi)
}

$(if [[ -f "$cert_path/fullchain.pem" ]]; then
cat << SSL_CONF
server {
    listen 443 ssl;
    server_name $domain;

    ssl_certificate $cert_path/fullchain.pem;
    ssl_certificate_key $cert_path/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    location / {
        proxy_pass http://127.0.0.1:$port;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # WebSocket 支持
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass \$http_upgrade;
    }
    
    # 健康检查端点
    location /health {
        proxy_pass http://127.0.0.1:$port/health;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
SSL_CONF
fi)
EOF
    
    # 创建软链接
    if [[ -f "$nginx_enabled/${service}.0379.email.conf" ]]; then
      rm "$nginx_enabled/${service}.0379.email.conf"
    fi
    ln -s "$conf_file" "$nginx_enabled/"
    
    log_success "✅ 已配置 $domain 的Nginx"
  done
  
  # 测试Nginx配置
  log_info "测试Nginx配置..."
  if sudo nginx -t; then
    log_success "✅ Nginx配置测试通过"
    
    # 重载Nginx
    log_info "重载Nginx..."
    sudo nginx -s reload
    log_success "✅ Nginx已重载"
  else
    log_error "Nginx配置测试失败，请检查配置文件"
    log_warn "可以尝试手动修复Nginx配置后再重启服务"
  fi
}

# 注册服务到PM2
register_pm2() {
  log_info "注册服务到PM2..."
  
  # 检查PM2是否安装
  if ! command -v pm2 &> /dev/null; then
    log_warn "PM2未安装，跳过PM2配置"
    log_info "可以使用 ./scripts/start-services.sh 脚本手动启动服务"
    return 0
  fi
  
  # 检查或创建ecosystem.config.js
  local ecosystem_file="$PROJECT_ROOT/ecosystem.config.js"
  if [[ ! -f "$ecosystem_file" ]]; then
    log_info "创建PM2生态系统配置文件..."
    cat > "$ecosystem_file" << EOF
module.exports = {
  apps: [
    $(for i in "${!SERVICES[@]}"; do
      local service="${SERVICES[$i]}"
      local port="${PORTS[$i]}"
      echo "    {\n      name: '$service',\n      script: './$service/server.js',\n      args: ['--port=$port'],\n      instances: 1,\n      autorestart: true,\n      watch: false,\n      max_memory_restart: '1G',\n      env: {\n        NODE_ENV: 'development',\n        PORT: '$port'\n      },\n      log_file: './$service/logs/app.log',\n      error_file: './$service/logs/error.log',\n      out_file: './$service/logs/output.log'\n    }${i == ${#SERVICES[@]}-1 ? '' : ','}"
    done)
  ]
};
EOF
    log_success "✅ 已创建PM2配置文件: $ecosystem_file"
  fi
  
  # 停止现有服务（如果存在）
  log_info "停止现有服务..."
  pm2 delete all || true
  
  # 启动服务
  log_info "启动服务..."
  pm2 start "$ecosystem_file"
  
  # 保存PM2进程列表
  log_info "保存PM2进程列表..."
  pm2 save
  
  # 尝试设置PM2开机自启（可能需要sudo权限）
  log_info "设置PM2开机自启..."
  pm2 startup systemd -u $(whoami) --hp "$HOME" || log_warn "设置PM2开机自启可能需要管理员权限"
  
  log_success "✅ 服务已成功注册到PM2"
  
  # 显示服务状态
  log_info "当前服务状态："
  pm2 list
}

# 显示完成信息
show_completion_info() {
  log_success "🎉 0379.email 多服务平台初始化完成！"
  echo -e "\n${BLUE}📋 后续操作建议:${NC}\n"
  echo -e "  ${GREEN}1.${NC} ${BLUE}检查.env文件并根据需要更新配置${NC}"
  for service in "${SERVICES[@]}"; do
    echo -e "    - ${PROJECT_ROOT}/$service/.env"
  done
  echo -e "\n  ${GREEN}2.${NC} ${BLUE}启动服务:${NC}"
  echo -e "    - 使用PM2: ${GREEN}pm2 start all${NC}"
  echo -e "    - 或使用脚本: ${GREEN}./scripts/start-services.sh start${NC}"
  echo -e "\n  ${GREEN}3.${NC} ${BLUE}检查服务状态:${NC}"
  echo -e "    - 使用PM2: ${GREEN}pm2 list${NC}"
  echo -e "    - 或使用脚本: ${GREEN}./scripts/start-services.sh status${NC}"
  echo -e "\n  ${GREEN}4.${NC} ${BLUE}访问服务:${NC}"
  for i in "${!SERVICES[@]}"; do
    local service="${SERVICES[$i]}"
    local port="${PORTS[$i]}"
    local domain="${DOMAINS[$i]}"
    echo -e "    - http://localhost:$port"
    echo -e "    - https://$domain (如果已配置SSL)"
  done
  echo -e "\n  ${GREEN}5.${NC} ${BLUE}查看日志:${NC}"
  echo -e "    - 服务日志: ${PROJECT_ROOT}/*/logs/"
  echo -e "    - 系统日志: ${LOG_DIR}/"
  echo -e "\n${YELLOW}⚠️  注意:${NC} 如需使用域名访问，请确保DNS已正确配置或在hosts文件中添加相应条目"
}

# 主函数
main() {
  log_info "开始初始化 0379.email 多服务平台..."
  
  # 检查系统依赖
  check_dependencies
  
  # 初始化.env文件
  init_env_files
  
  # 安装项目依赖
  install_dependencies
  
  # 配置TLS证书
  setup_tls_secrets
  
  # 配置Nginx
  setup_nginx
  
  # 注册服务到PM2
  register_pm2
  
  # 显示完成信息
  show_completion_info
}

# 执行主函数
main "$@"
