# 0379-World 完整部署指南

## 📋 项目概述

基于对话记录和架构文档，0379-World 是一个完整的多域名AI智能平台，包含：

- **主域名**: `0379.world`
- **重定向域名**: `yanyu.red` → `0379.world`
- **子域名系统**: AI助手、未来仪表板、看板系统等
- **云服务器**: yyc3-33 (8.152.195.33)

## 🏗️ 项目架构

### 核心应用
```
0379-world/
├── apps/
│   ├── futuristic-dashboard/     # 未来仪表板 (端口: 3000, 3010)
│   ├── ai-assistant/            # AI助手 (端口: 3100)
│   ├── kanban-board/           # 看板系统 (端口: 3002)
│   ├── status-monitor/         # 状态监控 (端口: 3001)
│   └── dashboard/              # 主仪表板
├── packages/
│   ├── ui/                     # 共享UI组件
│   ├── utils/                  # 工具函数
│   ├── api/                    # API接口
│   └── config/                 # 配置管理
├── config/
│   ├── nginx/                  # Nginx配置
│   ├── docker/                 # Docker配置
│   ├── prometheus/             # 监控配置
│   └── grafana/                # Grafana配置
└── scripts/                    # 部署脚本
```

### 技术栈
- **前端**: Next.js 14, TypeScript, Tailwind CSS
- **包管理**: pnpm workspaces
- **后端**: Node.js, Express
- **数据库**: PostgreSQL (端口: 5432), MariaDB (端口: 3306)
- **监控**: Prometheus (端口: 9090), Grafana (端口: 3000)
- **容器化**: Docker, Docker Compose
- **CI/CD**: GitHub Actions, Vercel

## 🚀 部署步骤

### 第一步：SSH连接设置

```bash
# 1. 检查SSH密钥
ls -la ~/.ssh/

# 2. 如果没有密钥，创建一个
ssh-keygen -t rsa -b 4096 -C "yyc3-deployment"

# 3. 复制公钥到服务器
ssh-copy-id root@8.152.195.33

# 4. 测试连接
ssh root@8.152.195.33 "echo '连接成功'"
```

### 第二步：服务器环境准备

```bash
# 登录服务器
ssh root@8.152.195.33

# 更新系统
apt update && apt upgrade -y

# 安装必要软件
apt install -y curl wget git nginx certbot python3-certbot-nginx
apt install -y docker.io docker-compose nodejs npm

# 启动服务
systemctl enable nginx docker
systemctl start nginx docker

# 安装pnpm
npm install -g pnpm
```

### 第三步：项目同步

```bash
# 退出SSH，回到本地执行
cd /Users/yanyu/www

# 确保项目存在
ls -la 0379-world/

# 执行同步脚本
chmod +x deployments/0379-world-sync.sh
./deployments/0379-world-sync.sh
```

### 第四步：SSL证书配置

```bash
# 在服务器上执行
ssh root@8.152.195.33

# 获取SSL证书
certbot --nginx -d 0379.world -d www.0379.world \
    -d yanyu.red -d www.yanyu.red \
    --non-interactive --agree-tos \
    --email admin@0379.world
```

## 📊 服务配置

### Nginx配置示例

```nginx
# /etc/nginx/sites-available/0379-world
server {
    listen 80;
    server_name 0379.world www.0379.world;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name 0379.world www.0379.world;

    ssl_certificate /etc/letsencrypt/live/0379.world/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/0379.world/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# yanyu.red 重定向
server {
    listen 80;
    server_name yanyu.red www.yanyu.red;
    return 301 https://0379.world$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yanyu.red www.yanyu.red;

    ssl_certificate /etc/letsencrypt/live/yanyu.red/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yanyu.red/privkey.pem;

    location / {
        return 301 https://0379.world$request_uri;
    }
}
```

### Docker监控栈

```yaml
# /opt/0379-world/config/docker/docker-compose.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana

  postgres-exporter:
    image: prometheuscommunity/postgres-exporter
    environment:
      - DATA_SOURCE_NAME=postgresql://postgres:password@postgres:5432/postgres

volumes:
  prometheus_data:
  grafana_data:
```

## 🔧 管理命令

### 服务器管理

```bash
# 登录服务器
ssh root@8.152.195.33

# 运行管理脚本
/opt/0379-world/manage-0379-world.sh

# 查看服务状态
systemctl status nginx
docker ps

# 查看日志
journalctl -u nginx -f
docker-compose logs -f
```

### 数据库管理

```bash
# PostgreSQL管理
/opt/0379-world/scripts/manage-postgres.sh status
/opt/0379-world/scripts/manage-postgres.sh connect

# MariaDB管理
systemctl status mariadb
mysql -u root -p
```

### 应用部署

```bash
# 更新代码
cd /opt/0379-world
git pull origin main

# 安装依赖
pnpm install

# 构建项目
pnpm build

# 重启服务
systemctl restart nginx
docker-compose restart
```

## 🔍 监控和日志

### 访问地址

- **主站**: https://0379.world
- **重定向**: https://yanyu.red → https://0379.world
- **Grafana**: http://8.152.195.33:3001 (admin/admin)
- **Prometheus**: http://8.152.195.33:9090

### 监控指标

- **网站可用性**: HTTP状态码监控
- **服务器性能**: CPU、内存、磁盘使用率
- **数据库状态**: PostgreSQL连接池、查询性能
- **应用错误**: 异常日志收集

### 备份策略

```bash
# 数据库备份
pg_dump -h localhost -U yyc3_admin yyc3_main > backup_$(date +%Y%m%d).sql

# 文件备份
tar -czf /opt/backups/0379-world/backup_$(date +%Y%m%d_%H%M%S).tar.gz \
    /opt/0379-world --exclude=node_modules --exclude=.git
```

## 🛠️ 故障排除

### 常见问题

1. **SSH连接失败**
   ```bash
   # 检查密钥权限
   chmod 600 ~/.ssh/id_rsa

   # 重新生成密钥
   ssh-keygen -t rsa -b 4096
   ```

2. **SSL证书问题**
   ```bash
   # 检查证书状态
   certbot certificates

   # 重新申请证书
   certbot --nginx -d 0379.world --force-renewal
   ```

3. **服务无法启动**
   ```bash
   # 检查端口占用
   netstat -tulpn | grep :80

   # 查看错误日志
   journalctl -u nginx --no-pager
   ```

4. **数据库连接失败**
   ```bash
   # 检查PostgreSQL状态
   systemctl status postgresql

   # 测试连接
   psql -h localhost -U yyc3_admin -d yyc3_main
   ```

### 性能优化

1. **Nginx优化**
   ```nginx
   # 启用Gzip压缩
   gzip on;
   gzip_types text/plain application/json;

   # 缓存静态文件
   location ~* \.(js|css|png|jpg)$ {
       expires 1y;
       add_header Cache-Control "public, immutable";
   }
   ```

2. **PostgreSQL优化**
   ```sql
   -- 调整配置参数
   ALTER SYSTEM SET shared_buffers = '256MB';
   ALTER SYSTEM SET effective_cache_size = '1GB';
   SELECT pg_reload_conf();
   ```

## 📱 联系信息

- **管理员**: yyc3
- **邮箱**: admin@0379.world
- **文档**: https://docs.0379.world
- **GitHub**: https://github.com/yyc3/0379-world

---

**最后更新**: 2025年11月21日
**版本**: v1.0.0
**状态**: 生产就绪