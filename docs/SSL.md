# SSL/TLS 配置指南

本文档详细说明了 0379.email 项目的 SSL/TLS 配置、管理和最佳实践。

## 概述

项目使用 Let's Encrypt 提供的免费 SSL 证书，实现全站 HTTPS 加密，确保数据传输安全。

## 架构设计

### SSL 终止

- **Nginx** 作为 SSL 终止代理
- 处理 SSL/TLS 握手和证书验证
- 将解密后的请求转发给后端服务

### 证书管理

- **自动获取**: 使用 Certbot 自动获取证书
- **自动续期**: 配置定时任务自动续期
- **备份策略**: 自动备份证书和配置

## 域名和证书

### 主要域名

- `0379.email` - 主站点
- `api.0379.email` - API 服务
- `admin.0379.email` - 管理面板
- `mail.0379.email` - 邮件服务
- `wiki.0379.email` - Wiki 服务

### 证书配置

```bash
# 证书文件位置
/etc/letsencrypt/live/
├── 0379.email/
│   ├── fullchain.pem    # 完整证书链
│   ├── privkey.pem      # 私钥
│   └── chain.pem        # 中间证书
├── api.0379.email/
├── admin.0379.email/
├── mail.0379.email/
└── wiki.0379.email/
```

## 安全配置

### SSL 协议

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
```

### 安全 HTTP 头

```nginx
# HSTS (HTTP Strict Transport Security)
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

# 防止点击劫持
add_header X-Frame-Options SAMEORIGIN always;

# 防止 MIME 类型嗅探
add_header X-Content-Type-Options nosniff always;

# XSS 保护
add_header X-XSS-Protection "1; mode=block" always;

# 引用策略
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# 内容安全策略
add_header Content-Security-Policy "default-src 'self'; ..." always;
```

## 证书管理

### 初始设置

```bash
# 使用 SSL 管理脚本
./scripts/ssl/ssl-manager.sh setup

# 或直接运行设置脚本
sudo ./scripts/ssl/setup-ssl.sh
```

### 自动续期

```bash
# 设置自动续期任务
./scripts/ssl/ssl-manager.sh auto-renew

# 或手动设置
./scripts/ssl/setup-crontab.sh
```

### 手动续期

```bash
# 手动续期所有证书
sudo certbot renew

# 续期特定域名
sudo certbot renew --cert-name 0379.email

# 测试续期流程
sudo certbot renew --dry-run
```

## 证书监控

### 检查证书状态

```bash
# 使用 SSL 管理脚本
./scripts/ssl/ssl-manager.sh status

# 或使用 Certbot
sudo certbot certificates

# 检查特定域名
openssl x509 -in /etc/letsencrypt/live/0379.email/fullchain.pem -noout -dates
```

### 证书测试

```bash
# 完整 SSL 测试
./scripts/ssl/test-ssl.sh

# 仅测试本地证书
./scripts/ssl/test-ssl.sh --local-only

# 仅测试远程连接
./scripts/ssl/test-ssl.sh --remote-only
```

### 监控脚本

系统提供以下监控功能：

1. **自动检查**: 每天凌晨 2 点自动检查证书有效期
2. **提前预警**: 证书到期前 30 天开始预警
3. **状态报告**: 每周一生成详细的证书状态报告
4. **自动备份**: 续期前自动备份当前证书

## 配置文件

### Nginx 配置

- **主配置**: `configs/nginx/nginx.conf`
- **站点配置**: `configs/nginx/conf.d/0379email.conf`

### Docker 配置

- **SSL 环境**: `docker-compose.ssl.yml`

### 管理脚本

- **SSL 管理**: `scripts/ssl/ssl-manager.sh`
- **证书设置**: `scripts/ssl/setup-ssl.sh`
- **自动续期**: `scripts/ssl/auto-renew-ssl.sh`
- **证书测试**: `scripts/ssl/test-ssl.sh`
- **定时任务**: `scripts/ssl/setup-crontab.sh`

## 故障排除

### 常见问题

#### 1. 证书获取失败

```bash
# 检查域名解析
nslookup 0379.email

# 检查端口占用
netstat -tuln | grep :80
netstat -tuln | grep :443

# 停止占用端口的服务
sudo systemctl stop nginx
docker-compose stop nginx
```

#### 2. 证书续期失败

```bash
# 检查 Certbot 日志
sudo journalctl -u certbot
tail -f /var/log/letsencrypt/letsencrypt.log

# 检查证书权限
sudo ls -la /etc/letsencrypt/live/

# 手动续期测试
sudo certbot renew --dry-run
```

#### 3. Nginx 配置错误

```bash
# 测试 Nginx 配置
sudo nginx -t

# 检查错误日志
sudo tail -f /var/log/nginx/error.log

# 重新加载配置
sudo nginx -s reload
```

#### 4. SSL 连接问题

```bash
# 测试 SSL 连接
openssl s_client -connect 0379.email:443

# 检查证书链
openssl verify -CAfile /etc/letsencrypt/live/0379.email/chain.pem /etc/letsencrypt/live/0379.email/fullchain.pem

# 使用在线工具测试
curl -I https://0379.email
```

### 恢复程序

#### 从备份恢复证书

```bash
# 查看备份
ls -la certbot/backup/

# 恢复证书
sudo cp -r certbot/backup/latest/letsencrypt/ /etc/
sudo systemctl restart nginx
```

#### 重新生成证书

```bash
# 备份当前证书
./scripts/ssl/ssl-manager.sh backup

# 撤销旧证书（如果需要）
sudo certbot revoke --cert-path /etc/letsencrypt/live/0379.email/fullchain.pem

# 重新获取证书
sudo ./scripts/ssl/setup-ssl.sh
```

## 最佳实践

### 1. 定期监控

- 每周检查证书状态
- 监控续期日志
- 设置告警通知

### 2. 安全配置

- 使用强加密协议
- 定期更新 Nginx 和系统
- 配置防火墙规则

### 3. 备份策略

- 定期备份证书
- 离线存储备份
- 测试恢复流程

### 4. 性能优化

- 启用 HTTP/2
- 配置 SSL 缓存
- 优化 SSL 会话

## 合规性

### 安全标准

- **PCI DSS**: 符合支付卡行业数据安全标准
- **GDPR**: 符合欧盟通用数据保护条例
- **ISO 27001**: 符合信息安全管理体系

### 审计要求

- 证书到期监控
- 访问日志记录
- 配置变更追踪

## 支持和资源

### 官方文档

- [Let's Encrypt](https://letsencrypt.org/docs/)
- [Certbot](https://certbot.eff.org/docs/)
- [Nginx SSL](https://nginx.org/en/docs/http/configuring_https_servers.html)

### 在线工具

- [SSL Labs Test](https://www.ssllabs.com/ssltest/)
- [Certificate Decoder](https://certificatedecoder.com/)

### 社区支持

- [Let's Encrypt Community](https://community.letsencrypt.org/)
- [Nginx Forums](https://forum.nginx.org/)

---

## 快速参考

### 常用命令

```bash
# SSL 管理菜单
./scripts/ssl/ssl-manager.sh

# 检查所有证书
sudo certbot certificates

# 手动续期
sudo certbot renew

# 测试配置
./scripts/ssl/test-ssl.sh

# 查看日志
tail -f logs/ssl-renew.log
```

### 重要文件

- 证书目录: `/etc/letsencrypt/live/`
- 配置目录: `configs/nginx/`
- 脚本目录: `scripts/ssl/`
- 日志文件: `logs/ssl-renew.log`

### 紧急联系

- 技术支持: <support@0379.email>
- 安全问题: <security@0379.email>

---

*最后更新: 2024-11-10*
*版本: v1.0.0*
