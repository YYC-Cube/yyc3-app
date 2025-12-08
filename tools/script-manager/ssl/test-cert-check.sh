#!/bin/bash

# 简单的证书检查测试脚本

set -euo pipefail

DOMAIN="0379.email"
CERT_PATH="/Users/yanyu/www/ssl-certs/live/0379.email/fullchain.pem"

echo "测试域名: $DOMAIN"
echo "证书路径: $CERT_PATH"

if [[ ! -f "$CERT_PATH" ]]; then
    echo "证书文件不存在"
    exit 1
fi

# 获取证书过期时间
expiry_date=$(openssl x509 -in "$CERT_PATH" -noout -enddate | cut -d= -f2)
echo "过期时间: $expiry_date"

# macOS日期转换
expiry_timestamp=$(date -j -f "%b %d %H:%M:%S %Y %Z" "$expiry_date" +%s)
current_timestamp=$(date +%s)
days_left=$(( (expiry_timestamp - current_timestamp) / 86400 ))

echo "当前时间戳: $current_timestamp"
echo "过期时间戳: $expiry_timestamp"
echo "剩余天数: $days_left"

# 测试JSON输出
json_output="{\"domain\":\"$DOMAIN\",\"status\":\"ok\",\"days_left\":$days_left,\"expiry_date\":\"$expiry_date\"}"
echo "JSON输出: $json_output"