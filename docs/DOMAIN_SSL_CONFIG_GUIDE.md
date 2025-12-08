# 域名解析和SSL配置指南

**配置时间**: 2025-11-10
**目标**: 完整的外网访问配置

## 🌐 域名解析配置

### 需要配置的域名记录

#### 1. 主要服务域名

| 域名 | 类型 | 目标IP | 用途 | 状态 |
|------|------|--------|------|------|
| api.0379.email | A | 8.130.127.121 | API服务外网访问 | 🔄 待配置 |
| admin.0379.email | A | 8.130.127.121 | 管理面板外网访问 | 🔄 待配置 |
| llm.0379.email | A | 8.130.127.121 | AI服务外网访问 | 🔄 待配置 |
| mail.0379.email | A | 8.130.127.121 | 邮件服务外网访问 | 🔄 待配置 |
| nas.0379.email | A | 8.130.127.121 | NAS管理外网访问 | 🔄 待配置 |
| docker.0379.email | A | 8.130.127.121 | Docker管理外网访问 | 🔄 待配置 |

#### 2. 特殊服务域名 (带端口)

| 域名 | 类型 | 目标 | 端口 | 用途 |
|------|------|------|------|------|
| mysql.0379.email | A | 8.130.127.121 | 3307 | 数据库外网访问 |
| redis.0379.email | A | 8.130.127.121 | 6378 | 缓存外网访问 |
| files.0379.email | A | 8.130.127.121 | - | 文件服务外网访问 |
| backup.0379.email | A | 8.130.127.121 | - | 备份服务外网访问 |
| monitor.0379.email | A | 8.130.127.121 | - | 监控服务外网访问 |

### DNS配置示例

#### Cloudflare 配置 (推荐)

```bash
# 1. 登录Cloudflare管理面板
# 2. 添加0379.email域名到Cloudflare
# 3. 配置以下DNS记录:

# A记录 (主要服务)
api.0379.email      A    8.130.127.121    Proxy: 关闭
admin.0379.email    A    8.130.127.121    Proxy: 关闭
llm.0379.email      A    8.130.127.121    Proxy: 关闭
mail.0379.email     A    8.130.127.121    Proxy: 关闭
nas.0379.email      A    8.130.127.121    Proxy: 关闭

# A记录 (特殊服务)
mysql.0379.email    A    8.130.127.121    Proxy: 关闭
redis.0379.email    A    8.130.127.121    Proxy: 关闭
files.0379.email    A    8.130.127.121    Proxy: 关闭
```

#### 阿里云DNS配置

```bash
# 登录阿里云DNS控制台
# 为0379.email添加以下解析记录:

# API服务
主机记录: api
记录类型: A
记录值: 8.130.127.121
TTL: 600

# 管理面板
主机记录: admin
记录类型: A
记录值: 8.130.127.121
TTL: 600

# AI服务
主机记录: llm
记录类型: A
记录值: 8.130.127.121
TTL: 600

# 邮件服务
主机记录: mail
记录类型: A
记录值: 8.130.127.121
TTL: 600

# NAS管理
主机记录: nas
记录类型: A
记录值: 8.130.127.121
TTL: 600
```

## 🔒 SSL证书配置

### SSL证书状态

- **已有证书**: ✅ 真实SSL证书已存在
- **证书路径**: `/Users/yanyu/www/ssl-certs/live/0379.email/`
- **有效期**: 至2026年11月 ✅
- **证书类型**: Let's Encrypt (或其他CA)

### SSL文件清单

```bash
# 证书文件位置
/Users/yanyu/www/ssl-certs/live/0379.email/
├── fullchain.pem    # 完整证书链
├── privkey.pem      # 私钥文件
├── chain.pem        # 中间证书
└── cert.pem         # 域名证书
```

### Nginx SSL配置

#### 1. 更新Nginx主配置

```nginx
# 在 /Users/yanyu/www/docker/nginx/conf/nginx.conf 中添加:

# SSL配置
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;

# SSL证书路径
ssl_certificate /etc/nginx/ssl/fullchain.pem;
ssl_certificate_key /etc/nginx/ssl/privkey.pem;

# HTTP到HTTPS重定向
server {
    listen 80;
    server_name .0379.email;
    return 301 https://$server_name$request_uri;
}
```

#### 2. HTTPS服务配置

```nginx
server {
    listen 443 ssl http2;
    server_name api.0379.email;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    # API代理配置
    location / {
        proxy_pass http://api-service:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### FRP SSL配置

#### 1. FRP服务端SSL配置

```toml
# 在 /opt/frp/frps.toml 中启用TLS:

tls_enable = true
tls_cert_file = "/etc/ssl/certs/0379.email/fullchain.pem"
tls_key_file = "/etc/ssl/private/0379.email/privkey.pem"
tls_trusted_ca_file = "/etc/ssl/certs/0379.email/chain.pem"
```

#### 2. FRP客户端SSL配置

```toml
# 在NAS客户端配置 /Volume1/www/frpc/frpc.toml 中:

tls_enable = true
tls_trusted_ca_file = "/Volume1/www/frpc/ca.pem"
```

## 🚀 自动化配置脚本

### DNS配置验证脚本

```bash
#!/bin/bash
# 创建DNS验证脚本

domains=("api.0379.email" "admin.0379.email" "llm.0379.email" "mail.0379.email" "nas.0379.email")
target_ip="8.130.127.121"

echo "=== DNS解析验证 ==="
for domain in "${domains[@]}"; do
    echo -n "$domain: "
    resolved_ip=$(nslookup $domain | grep -A1 "Name:" | grep "Address:" | awk '{print $2}' | head -1)
    if [[ "$resolved_ip" == "$target_ip" ]]; then
        echo "✅ 正确 ($resolved_ip)"
    else
        echo "❌ 错误 (期望: $target_ip, 实际: $resolved_ip)"
    fi
done
```

### SSL证书部署脚本

```bash
#!/bin/bash
# SSL证书自动部署脚本

CERT_SOURCE="/Users/yanyu/www/ssl-certs/live/0379.email"
CERT_DEST_FRP="/etc/ssl/certs/0379.email"
CERT_DEST_NGINX="/Users/yanyu/www/docker/nginx/ssl"

echo "=== SSL证书部署 ==="

# 1. 为FRP服务端部署证书
echo "为FRP服务端部署SSL证书..."
ssh root@yyc3-121 << EOF
    mkdir -p $CERT_DEST_FRP
    mkdir -p /etc/ssl/private/0379.email
EOF

scp "$CERT_SOURCE/fullchain.pem" root@yyc3-121:$CERT_DEST_FRP/
scp "$CERT_SOURCE/privkey.pem" root@yyc3-121:/etc/ssl/private/0379.email/
scp "$CERT_SOURCE/chain.pem" root@yyc3-121:$CERT_DEST_FRP/

# 2. 为本地Nginx部署证书
echo "为本地Nginx部署SSL证书..."
mkdir -p "$CERT_DEST_NGINX"
cp "$CERT_SOURCE/fullchain.pem" "$CERT_DEST_NGINX/"
cp "$CERT_SOURCE/privkey.pem" "$CERT_DEST_NGINX/"

echo "SSL证书部署完成"
```

## 📋 配置检查清单

### DNS配置检查

- [ ] 所有A记录已添加到DNS服务商
- [ ] TTL设置为合理值 (建议600秒)
- [ ] 代理模式已关闭 (除非需要CDN)
- [ ] DNS解析已生效 (使用nslookup验证)

### SSL证书检查

- [ ] 证书文件已复制到正确位置
- [ ] 证书有效期确认
- [ ] 私钥文件权限设置正确 (600)
- [ ] Nginx SSL配置已更新
- [ ] FRP SSL配置已更新

### 服务配置检查

- [ ] Nginx已重启并加载SSL配置
- [ ] FRP服务端已重启并启用TLS
- [ ] 防火墙允许443端口访问
- [ ] HTTP到HTTPS重定向正常工作

## 🧪 测试验证

### 1. DNS解析测试

```bash
# 测试所有域名的DNS解析
for domain in api.0379.email admin.0379.email llm.0379.email mail.0379.email nas.0379.email; do
    echo "Testing $domain:"
    nslookup $domain
    echo "---"
done
```

### 2. SSL证书测试

```bash
# 测试SSL证书
openssl s_client -connect api.0379.email:443 -servername api.0379.email

# 检查证书信息
curl -I https://api.0379.email
```

### 3. 端到端访问测试

```bash
# 测试HTTPS访问
curl -k https://api.0379.email/health

# 测试HTTP重定向
curl -I http://api.0379.email
```

## ⚠️ 注意事项

1. **DNS生效时间**: DNS更改可能需要几分钟到几小时生效
2. **证书续期**: 确保Let's Encrypt自动续期配置正确
3. **防火墙设置**: 确保服务器防火墙允许443端口
4. **监控告警**: 配置SSL证书过期监控告警

---

**配置完成后，系统将提供完整的外网HTTPS访问能力！**

*本配置指南应在NAS客户端部署完成后执行*
