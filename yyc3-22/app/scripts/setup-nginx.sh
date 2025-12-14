#!/bin/bash
set -e

DOMAIN="0379.email"
CERT_PATH="/etc/letsencrypt/live/${DOMAIN}"
NGINX_CONF_DIR="/etc/nginx/conf.d"

# 服务配置
declare -A SERVICES=(
    ["api"]="3000"
    ["admin"]="3001" 
    ["llm"]="3002"
    ["mail"]="3003"
)

# 创建日志目录
create_log_dirs() {
    echo "Creating log directories..."
    for service in "${!SERVICES[@]}"; do
        mkdir -p "/www/app/${service}/logs"
        chown -R www-data:www-data "/www/app/${service}/logs"
        echo "✅ Created /www/app/${service}/logs"
    done
}

# 生成HTTP重定向配置
generate_http_config() {
    local service=$1
    local port=$2
    local subdomain="${service}.${DOMAIN}"
    
    cat > "$NGINX_CONF_DIR/${subdomain}.conf" << CONF_EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${subdomain};

    access_log /www/app/${service}/logs/access.log;
    error_log /www/app/${service}/logs/error.log;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        try_files \$uri =404;
    }

    location / {
        return 301 https://\$server_name\$request_uri;
    }
}
CONF_EOF
    echo "Generated HTTP config: ${subdomain}.conf"
}

# 生成HTTPS服务配置
generate_https_config() {
    local service=$1
    local port=$2
    local subdomain="${service}.${DOMAIN}"
    
    cat > "$NGINX_CONF_DIR/${subdomain}.ssl.conf" << CONF_EOF
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${subdomain};

    # SSL Configuration
    ssl_certificate ${CERT_PATH}/fullchain.pem;
    ssl_certificate_key ${CERT_PATH}/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

    # Security Headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=63072000" always;

    # Logging
    access_log /www/app/${service}/logs/access.log;
    error_log /www/app/${service}/logs/error.log;

    # Health Check
    location /health {
        proxy_pass http://127.0.0.1:${port};
        proxy_set_header Host \$host;
        access_log off;
    }

    # Main Application
    location / {
        proxy_pass http://127.0.0.1:${port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \$connection_upgrade;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # Static Files (if any)
    location /static/ {
        alias /www/app/${service}/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
CONF_EOF
    echo "Generated HTTPS config: ${subdomain}.ssl.conf"
}



# 主执行函数
main() {
    echo "🚀 Setting up Nginx configurations for email services..."
    
    if [[ $EUID -ne 0 ]]; then
        echo "❌ This script must be run as root"
        exit 1
    fi

    create_log_dirs
    
    for service in "${!SERVICES[@]}"; do
        echo "🔧 Configuring ${service} service..."
        generate_http_config "$service" "${SERVICES[$service]}"
        generate_https_config "$service" "${SERVICES[$service]}"

        echo ""
    done

    echo "🧪 Testing Nginx configuration..."
    if nginx -t; then
        systemctl reload nginx
        echo "✅ Nginx configuration applied successfully!"
        
        echo ""
        echo "📋 Service Endpoints:"
        for service in "${!SERVICES[@]}"; do
            echo "   🌐 https://${service}.${DOMAIN}"
        done
    else
        echo "❌ Nginx configuration test failed"
        exit 1
    fi
}

main "$@"