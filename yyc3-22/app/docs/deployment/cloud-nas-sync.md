# yyc3-33云服务器部署与yyc3-45 NAS同步指南

## 📋 概述

本文档详细说明0379.email项目在**yyc3-33云服务器**的部署流程以及与**yyc3-45本地NAS服务器**的数据同步配置。

## 🌐 yyc3-33 云服务器配置

### 基本信息

- **服务器地址**: yyc3-33 (IP: 8.152.195.33)
- **SSH端口**: 22
- **用户名**: root
- **系统**: Linux (Alibaba Cloud Linux)
- **应用目录**: `/root/www/yyc3`
- **数据目录**: `/root/www/yyc3`

### 环境要求

- Node.js 18+
- Redis 7+
- PostgreSQL 15+
- Docker 24+
- Nginx 1.20+

## 📁 yyc3-45 NAS服务器配置

### 基本信息

- **服务器地址**: yyc3-45 (IP: 192.168.3.45)
- **SSH端口**: 9557
- **用户名**: YYC
- **共享路径**: `/Volume2/www`
- **备份目录**: `/Volume2/www/backup`
- **同步频率**: 每日自动同步

## 🚀 yyc3-33 云服务器部署步骤

### 1. 准备工作

```bash
# 连接到云服务器
ssh root@yyc3-33

# 更新系统
yum update -y

# 安装必要的依赖
yum install -y git curl wget gcc-c++ make
```

### 2. 安装 Node.js

```bash
# 使用 nvm 安装 Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 18
nvm use 18
node -v
```

### 3. 克隆项目代码

```bash
# 创建项目目录
mkdir -p /root/www
cd /root/www

# 克隆项目
git clone https://github.com/your-org/0379.email.git yyc3
cd yyc3

# 安装依赖
npm install
```

### 4. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
nano .env

# 关键配置项
# DATABASE_URL=postgres://user:password@localhost:5432/yyc3db
# REDIS_HOST=localhost
# REDIS_PORT=6379
# NODE_ENV=production
# PORT=3000
```

### 5. 构建项目

```bash
# 构建项目
npm run build

# 启动服务（使用 PM2）
npm install -g pm2
pm2 start start:prod
```

### 6. 配置 Nginx

```bash
# 安装 Nginx
yum install -y nginx

# 创建配置文件
nano /etc/nginx/conf.d/0379.email.conf
```

Nginx 配置示例：

```nginx
server {
    listen 80;
    server_name 0379.email www.0379.email;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name 0379.email www.0379.email;

    ssl_certificate /etc/nginx/ssl/0379.email.crt;
    ssl_certificate_key /etc/nginx/ssl/0379.email.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 7. 启动服务

```bash
# 启动 Nginx
systemctl enable nginx
systemctl start nginx

# 启动应用
cd /root/www/yyc3
pm2 start start:prod
```

## 🔄 yyc3-45 NAS 同步配置

### 1. SSH 密钥配置

```bash
# 在云服务器上生成 SSH 密钥
ssh-keygen -t ed25519 -f ~/.ssh/id_rsa_local -N ""

# 将公钥复制到 NAS 服务器
ssh-copy-id -i ~/.ssh/id_rsa_local.pub -p 9557 YYC@yyc3-45
```

### 2. 同步脚本配置

创建同步脚本 `/root/www/yyc3/scripts/sync-to-nas.sh`，内容如下：

```bash
#!/bin/bash
# === 脚本健康检查头 ===
set -euo pipefail

# 配置参数
LOCAL_DATA_DIR="/root/www/yyc3"
NAS_USER="YYC"
NAS_HOST="yyc3-45"
NAS_PORT="9557"
NAS_DIR="/Volume2/www"
LOG_FILE="/root/www/yyc3/logs/sync-nas.log"
SSH_KEY="~/.ssh/id_rsa_local"

# 确保日志目录存在
mkdir -p "$(dirname "$LOG_FILE")"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始同步到 NAS..." >> "$LOG_FILE"

# 使用 rsync 同步数据
rsync -avz -e "ssh -i $SSH_KEY -p $NAS_PORT" \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='logs' \
    "$LOCAL_DATA_DIR/" "$NAS_USER@$NAS_HOST:$NAS_DIR/"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 同步完成" >> "$LOG_FILE"
echo "✅ 数据已成功同步到 NAS 服务器"
```

### 3. 自动化同步设置

```bash
# 给脚本添加执行权限
chmod +x /root/www/yyc3/scripts/sync-to-nas.sh

# 设置定时任务 (每日凌晨 2 点执行)
crontab -e

# 添加以下内容
0 2 * * * /root/www/yyc3/scripts/sync-to-nas.sh >> /root/www/yyc3/logs/cron.log 2>&1
```

## 💾 NAS 备份配置

### 1. 备份脚本

创建备份脚本 `/root/www/yyc3/scripts/backup-to-nas.sh`，内容如下：

```bash
#!/bin/bash
# === 脚本健康检查头 ===
set -euo pipefail

# 配置参数
APP_DIR="/root/www/yyc3"
BACKUP_NAME="yyc3-backup-$(date +%Y%m%d)"
BACKUP_FILE="$BACKUP_NAME.tar.gz"
TEMP_DIR="/tmp"
NAS_USER="YYC"
NAS_HOST="yyc3-45"
NAS_PORT="9557"
NAS_BACKUP_DIR="/Volume2/yyc3-backup"
LOG_FILE="$APP_DIR/logs/backup-nas.log"
SSH_KEY="~/.ssh/id_rsa_local"

# 确保日志目录存在
mkdir -p "$(dirname "$LOG_FILE")"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始创建备份..." >> "$LOG_FILE"

# 创建备份文件
cd "$TEMP_DIR"
tar -czf "$BACKUP_FILE" -C "$(dirname "$APP_DIR")" "$(basename "$APP_DIR")" \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='logs'

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 备份文件创建完成: $BACKUP_FILE" >> "$LOG_FILE"

# 上传到 NAS
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始上传到 NAS..." >> "$LOG_FILE"
scp -i "$SSH_KEY" -P "$NAS_PORT" "$BACKUP_FILE" "$NAS_USER@$NAS_HOST:$NAS_BACKUP_DIR/"

# 清理临时文件
rm -f "$BACKUP_FILE"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 备份完成并上传到 NAS" >> "$LOG_FILE"
echo "✅ 备份已成功上传到 NAS 服务器: $BACKUP_FILE"
```

### 2. 备份自动化

```bash
# 给脚本添加执行权限
chmod +x /root/www/yyc3/scripts/backup-to-nas.sh

# 设置定时任务 (每周日凌晨 3 点执行)
crontab -e

# 添加以下内容
0 3 * * 0 /root/www/yyc3/scripts/backup-to-nas.sh >> /root/www/yyc3/logs/cron.log 2>&1
```

## ⚡ 快速部署脚本

创建快速部署脚本 `/Users/yanyu/www/yyc3-22/app/scripts/deploy-to-cloud.sh`，内容如下：

```bash
#!/bin/bash
# === 脚本健康检查头 ===
set -euo pipefail

# 颜色定义
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

# 配置参数
SERVER="yyc3-33"
USER="root"
APP_DIR="/root/www/yyc3"
LOG_FILE="logs/deploy.log"

# 确保日志目录存在
mkdir -p "$(dirname "$LOG_FILE")"

echo -e "${BLUE}🚀 开始部署到云服务器: $SERVER${NC}"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始部署..." >> "$LOG_FILE"

# 构建项目
echo -e "${YELLOW}🔨 正在构建项目...${NC}"
npm run build || {
  echo -e "${RED}❌ 构建失败${NC}"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] 构建失败" >> "$LOG_FILE"
  exit 1
}

# 复制构建文件到服务器
echo -e "${YELLOW}📤 正在上传文件到服务器...${NC}"
rsync -avz --exclude='node_modules' --exclude='.git' --exclude='logs' . "$USER@$SERVER:$APP_DIR/" || {
  echo -e "${RED}❌ 文件上传失败${NC}"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] 文件上传失败" >> "$LOG_FILE"
  exit 1
}

# 在服务器上安装依赖并启动
echo -e "${YELLOW}🔧 正在服务器上安装依赖...${NC}"
ssh "$USER@$SERVER" "cd $APP_DIR && npm install --production" || {
  echo -e "${RED}❌ 依赖安装失败${NC}"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] 依赖安装失败" >> "$LOG_FILE"
  exit 1
}

# 重启服务
echo -e "${YELLOW}🔄 正在重启服务...${NC}"
ssh "$USER@$SERVER" "cd $APP_DIR && pm2 restart ecosystem.config.js" || {
  echo -e "${RED}❌ 服务重启失败${NC}"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] 服务重启失败" >> "$LOG_FILE"
  exit 1
}

echo -e "${GREEN}✅ 部署成功!${NC}"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 部署成功" >> "$LOG_FILE"
```

## 📊 监控与维护

### 1. 健康检查

```bash
# 创建健康检查脚本
cd /root/www/yyc3/scripts/
./check-env.sh
```

### 2. 日志查看

```bash
# 查看应用日志
ssh root@yyc3-33
cd /root/www/yyc3
pm2 logs

# 查看同步日志
cat /root/www/yyc3/logs/sync-nas.log
```

### 3. 常见问题排查

#### 连接问题

- 确认防火墙设置，开放必要端口
- 验证 SSH 密钥配置
- 检查服务器运行状态

#### 同步失败

- 检查 NAS 存储空间是否充足
- 验证 SSH 连接权限
- 检查网络连接稳定性

#### 服务启动失败

- 检查环境变量配置
- 查看 Node.js 版本是否兼容
- 检查端口是否被占用

## 📝 注意事项

1. **安全提示**: 确保 SSH 密钥权限设置正确 (600)
2. **备份策略**: 定期检查备份完整性，建议保留最近 30 天的备份
3. **性能监控**: 定期监控服务器资源使用情况
4. **版本管理**: 部署前创建项目版本标签，便于回滚
5. **权限设置**: 确保所有脚本有执行权限

## 一键部署命令

在本地项目目录执行：

```bash
cd /Users/yanyu/www/yyc3-22/app
chmod +x scripts/deploy-to-cloud.sh
./scripts/deploy-to-cloud.sh
```

## 🔄 一键同步命令

在云服务器上执行：

```bash
cd /root/www/yyc3
./scripts/sync-to-nas.sh
```

## 📋 部署清单

- [ ] 服务器环境准备
- [ ] Node.js 安装配置
- [ ] 项目代码克隆
- [ ] 依赖安装
- [ ] 环境变量配置
- [ ] Nginx 配置
- [ ] 服务启动
- [ ] NAS 同步配置
- [ ] 备份策略设置
- [ ] 监控配置

---

文档更新时间: 2024-11-07
作者: YYC
版本: 1.0.0
