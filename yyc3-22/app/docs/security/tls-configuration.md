# TLS 配置与证书管理

## 证书路径

- **证书文件**：`/etc/letsencrypt/live/0379.email/fullchain.pem`
- **私钥文件**：`/etc/letsencrypt/live/0379.email/privkey.pem`

## Nginx 配置示例

### API 服务配置

```nginx
server {
    listen 443 ssl;
    server_name api.0379.email;

    # SSL 配置
    ssl_certificate /etc/letsencrypt/live/0379.email/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/0379.email/privkey.pem;

    # SSL 协议与加密套件
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # 会话缓存
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # 访问日志与错误日志
    access_log /Users/yanyu/www/yyc3-22/app/api/logs/access.log;
    error_log /Users/yanyu/www/yyc3-22/app/api/logs/error.log;

    # 代理配置
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# HTTP 自动跳转 HTTPS
server {
    listen 80;
    server_name api.0379.email;
    return 301 https://$host$request_uri;
}
```

### 其他服务配置

其他服务（admin、llm、mail）的配置结构相同，只需修改 `server_name` 和 `proxy_pass` 指向的端口即可。

## 证书申请与续期

### 使用 Certbot 申请通配符证书

```bash
# 安装 Certbot
apt update
apt install certbot

# 申请通配符证书（需要 DNS 验证）
certbot certonly --manual --preferred-challenges=dns --server https://acme-v02.api.letsencrypt.org/directory -d *.0379.email
```

### 自动续期配置

创建续期脚本 `/etc/cron.daily/renew-certbot`：

```bash
#!/bin/bash
certbot renew --quiet
# 续期成功后重载 Nginx
if [ $? -eq 0 ]; then
    systemctl reload nginx
fi
```

设置执行权限：

```bash
chmod +x /etc/cron.daily/renew-certbot
```

## 安全最佳实践

### 1. 定期更新证书

- 确保证书在到期前续期（Let's Encrypt 证书默认有效期为 90 天）
- 配置自动续期任务

### 2. 安全的 SSL/TLS 配置

- 仅支持 TLSv1.2 和 TLSv1.3 协议
- 使用强加密套件
- 启用 HSTS（HTTP Strict Transport Security）

### 3. 私钥保护

- 确保私钥文件权限设置为 600
- 不要在代码仓库中存储私钥
- 考虑使用密钥管理服务

### 4. Nginx 安全配置

- 禁用服务器版本信息
- 配置适当的超时设置
- 限制请求大小

## 安全检查工具

使用以下工具检查 TLS 配置安全：

### SSL Labs Test

```bash
# 可以访问 https://www.ssllabs.com/ssltest/ 进行在线测试
```

### 使用 openssl 检查证书信息

```bash
openssl x509 -in /etc/letsencrypt/live/0379.email/fullchain.pem -text -noout
```

### 检查证书有效期

```bash
openssl x509 -in /etc/letsencrypt/live/0379.email/fullchain.pem -text -noout | grep -A 2 "Validity"
```

## TLS 相关文件路径总结

| 文件类型         | 路径                                                 |
| ---------------- | ---------------------------------------------------- |
| 完整证书         | /etc/letsencrypt/live/0379.email/fullchain.pem       |
| 私钥             | /etc/letsencrypt/live/0379.email/privkey.pem         |
| Nginx API 配置   | /etc/nginx/sites-available/api.0379.email.ssl.conf   |
| Nginx Admin 配置 | /etc/nginx/sites-available/admin.0379.email.ssl.conf |
| Nginx LLM 配置   | /etc/nginx/sites-available/llm.0379.email.ssl.conf   |
| Nginx Mail 配置  | /etc/nginx/sites-available/mail.0379.email.ssl.conf  |
