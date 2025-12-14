#!/bin/bash
# === 自动化生成 HTTPS Nginx 配置 ===
set -euo pipefail

# 域名与端口映射（按需增减）
SERVICES=(
  "api 3000 api.0379.email"
  "admin 3001 admin.0379.email"
  "llm 3002 llm.0379.email"
  "mail 3003 mail.0379.email"
)

CERT_FULLCHAIN="/etc/letsencrypt/live/0379.email/fullchain.pem"
CERT_PRIVKEY="/etc/letsencrypt/live/0379.email/privkey.pem"

SITES_AVAILABLE="/etc/nginx/sites-available"
SITES_ENABLED="/etc/nginx/sites-enabled"

require_root() {
  if [ "${EUID}" -ne 0 ]; then
    echo "🚨 请使用 root 身份执行此脚本" >&2
    exit 1
  fi
}

create_conf() {
  local name="$1" port="$2" domain="$3"
  local conf_path="${SITES_AVAILABLE}/${domain}.ssl.conf"

  cat >"${conf_path}" <<CONF
server {
    listen 443 ssl;
    server_name ${domain};

    ssl_certificate ${CERT_FULLCHAIN};
    ssl_certificate_key ${CERT_PRIVKEY};
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://127.0.0.1:${port};
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
CONF

  ln -sf "${conf_path}" "${SITES_ENABLED}/$(basename "${conf_path}")"
  echo "✅ 生成并启用 ${domain}.ssl.conf -> 代理 127.0.0.1:${port}"
}

main() {
  require_root
  for svc in "${SERVICES[@]}"; do
    set -- ${svc}
    create_conf "$1" "$2" "$3"
  done
  nginx -t && systemctl reload nginx
  echo "✅ Nginx 配置已重载"
}

main "$@"
