# NAS 生产环境部署指南

## 概述

本文档提供铁威马 F4-423 NAS (YanYuCloud) 生产环境的完整部署指南，包括FRP客户端、Docker容器、Web服务等的部署和配置。

## 系统配置信息

### 硬件配置

- **设备型号**: 铁威马 F4-423
- **处理器**: Intel Quad Core
- **内存**: 32GB
- **存储配置**:
  - Volume1 (SSD RAID1): 2x2TB SN850X - 系统和应用
  - Volume2 (HDD RAID6): 4x8T WD HA340 - 数据存储
- **网络**: 千兆以太网

### 软件环境

- **IP地址**: 192.168.3.45
- **SSH端口**: 57
- **域名**: nas.0379.email
- **已安装服务**: Docker, Web Server, MariaDB, SSH

## 🚀 部署步骤

### 第一阶段：系统准备

#### 1. 连接到NAS

```bash
# SSH连接（使用root用户）
ssh -p 57 root@192.168.3.45
```

#### 2. 创建目录结构

```bash
# Volume1 (SSD) - 系统和应用目录
mkdir -p /yyc3-hd/{www/{html,api,admin,llm,mail},docker/{redis,nginx,mariadb,monitoring,files,backup},app/{api,admin,llm,mail},logs}

# Volume2 (HDD) - 数据和备份目录
mkdir -p /yyc3-sd/{share/{public,private,backup},backup/{daily,weekly,monthly},media/{videos,photos,music},archive}

# 设置权限
chmod 755 /yyc3-hd
chmod 755 /yyc3-sd
chmod -R 755 /yyc3-hd/www
chmod -R 755 /yyc3-sd/share
```

### 第二阶段：FRP客户端部署

#### 1. 上传FRP客户端文件

```bash
# 在本地机器上执行
scp -P 57 /Users/yanyu/www/frpc/frpc root@192.168.3.45:/yyc3-hd/www/frpc/
scp -P 57 /Users/yanyu/www/frpc/frpc-nas.toml root@192.168.3.45:/yyc3-hd/www/frpc/frpc.toml
scp -P 57 /Users/yanyu/www/frpc/ca.pem root@192.168.3.45:/yyc3-hd/www/frpc/
```

#### 2. 安装systemd服务

```bash
# 在NAS上执行
cp /Users/yanyu/www/etc/systemd/system/frpc-nas.service /etc/systemd/system/frpc.service
systemctl daemon-reload
systemctl enable frpc
```

#### 3. 验证FRP配置

```bash
# 验证配置文件语法
/yyc3-hd/www/frpc/frpc -c /yyc3-hd/www/frpc/frpc.toml --check
```

#### 4. 启动FRP服务

```bash
systemctl start frpc
systemctl status frpc
```

### 第三阶段：Docker环境部署

#### 1. 检查Docker安装

```bash
docker --version
docker-compose --version
```

#### 2. 上传Docker配置

```bash
# 在本地机器上执行
scp -P 57 /Users/yanyu/www/docker/nas-docker-compose.yml root@192.168.3.45:/yyc3-hd/docker/docker-compose.yml
```

#### 3. 创建Docker配置文件

```bash
# Redis配置
mkdir -p /yyc3-hd/docker/redis/conf
cat > /yyc3-hd/docker/redis/conf/redis.conf << EOF
bind 0.0.0.0
port 6379
requirepass redis123456
maxmemory 512mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
EOF

# MariaDB配置
mkdir -p /yyc3-hd/docker/mariadb/conf
cat > /yyc3-hd/docker/mariadb/conf/my.cnf << EOF
[mysqld]
bind-address = 0.0.0.0
port = 3306
max_connections = 200
innodb_buffer_pool_size = 2G
innodb_log_file_size = 256M
query_cache_type = 1
query_cache_size = 64M
slow_query_log = 1
long_query_time = 2
EOF

# Nginx配置
mkdir -p /yyc3-hd/docker/nginx/conf
# 上传nginx配置文件
scp -P 57 /Users/yanyu/www/configs/nginx/nas-web.conf root@192.168.3.45:/yyc3-hd/docker/nginx/conf/
```

#### 4. 启动Docker服务

```bash
cd /yyc3-hd/docker
docker-compose -f docker-compose.yml up -d
```

### 第四阶段：Web服务部署

#### 1. 创建基础Web页面

```bash
cat > /yyc3-hd/www/html/index.html << 'EOF'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>YanYuCloud NAS</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; text-align: center; }
        .status { background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .services { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .service { background: #f8f9fa; padding: 20px; border-radius: 5px; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏠 YanYuCloud NAS 系统</h1>
        <div class="status">
            <h3>🟢 系统运行正常</h3>
            <p>存储空间: 高性能SSD + 大容量HDD</p>
            <p>服务状态: 所有核心服务在线</p>
        </div>
        <div class="services">
            <div class="service">📁 文件共享</div>
            <div class="service">🗄️ 数据库服务</div>
            <div class="service">🚀 API接口</div>
            <div class="service">🤖 AI服务</div>
        </div>
    </div>
</body>
</html>
EOF
```

### 第五阶段：监控和备份

#### 1. 创建监控脚本

```bash
cat > /yyc3-hd/scripts/nas-monitor.sh << 'EOF'
#!/bin/bash

LOG_FILE="/yyc3-hd/logs/nas-monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$DATE] === NAS系统监控 ===" >> $LOG_FILE

# 系统负载
echo "系统负载:" >> $LOG_FILE
uptime >> $LOG_FILE

# 内存使用
echo -e "\n内存使用:" >> $LOG_FILE
free -h >> $LOG_FILE

# 磁盘使用
echo -e "\n磁盘使用:" >> $LOG_FILE
df -h >> $LOG_FILE

# 服务状态
echo -e "\nFRP服务状态:" >> $LOG_FILE
systemctl is-active frpc >> $LOG_FILE

echo -e "\nDocker服务状态:" >> $LOG_FILE
docker ps --format "table {{.Names}}\t{{.Status}}" >> $LOG_FILE 2>/dev/null || echo "Docker未运行" >> $LOG_FILE

echo -e "\n=== 监控完成 ===\n" >> $LOG_FILE

# 清理旧日志（保留30天）
find /yyc3-hd/logs -name "*.log" -mtime +30 -delete
EOF

chmod +x /yyc3-hd/scripts/nas-monitor.sh
```

#### 2. 设置定时监控

```bash
# 添加到crontab - 每5分钟执行一次监控
(crontab -l 2>/dev/null; echo "*/5 * * * * /yyc3-hd/scripts/nas-monitor.sh") | crontab -
```

#### 3. 配置自动备份

```bash
# 创建备份脚本
cat > /yyc3-hd/scripts/nas-backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/yyc3-sd/backup/daily"
DATE=$(date +%Y%m%d_%H%M%S)

# 备份应用数据
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /yyc3-hd/app/

# 备份配置文件
tar -czf $BACKUP_DIR/config_$DATE.tar.gz /yyc3-hd/docker/ /yyc3-hd/www/

# 删除7天前的备份
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "备份完成: $DATE"
EOF

chmod +x /yyc3-hd/scripts/nas-backup.sh

# 添加到crontab - 每天凌晨2点执行备份
(crontab -l 2>/dev/null; echo "0 2 * * * /yyc3-hd/scripts/nas-backup.sh") | crontab -
```

## 🔧 服务管理

### FRP客户端管理

```bash
# 启动服务
systemctl start frpc

# 停止服务
systemctl stop frpc

# 重启服务
systemctl restart frpc

# 查看状态
systemctl status frpc

# 查看日志
journalctl -u frpc -f
```

### Docker服务管理

```bash
# 查看运行中的容器
docker ps

# 查看所有容器
docker ps -a

# 启动所有服务
cd /yyc3-hd/docker
docker-compose up -d

# 停止所有服务
docker-compose down

# 查看日志
docker-compose logs -f
```

### 系统监控

```bash
# 查看系统资源
htop
iotop
nethogs

# 查看磁盘使用
df -h
du -sh /yyc3-hd/*

# 查看网络连接
ss -tlnp
```

## 🌐 外网访问配置

### 通过FRP内网穿透访问

| 服务 | 外网地址 | 内网地址 | 说明 |
|------|---------|----------|------|
| SSH | 8.130.127.121:9557 | 192.168.3.45:57 | 远程管理 |
| NAS管理 | nas.0379.email | 192.168.3.45:80 | Web管理界面 |
| 文件共享 | files.0379.email | 192.168.3.45:8081 | 文件下载 |
| API服务 | api.0379.email | 192.168.3.45:3000 | API接口 |
| 管理面板 | admin.0379.email | 192.168.3.45:3001 | 管理后台 |
| AI服务 | llm.0379.email | 192.168.3.45:3002 | AI模型服务 |
| 邮件服务 | mail.0379.email | 192.168.3.45:3003 | 邮件服务 |
| 数据库 | 8.130.127.121:3307 | 127.0.0.1:3306 | 数据库连接 |
| 缓存 | 8.130.127.121:6378 | 127.0.0.1:6379 | Redis缓存 |

### 域名解析配置

确保以下域名解析到FRP服务端 (8.130.127.121):

- nas.0379.email
- api.0379.email
- admin.0379.email
- llm.0379.email
- mail.0379.email
- files.0379.email

## 🔒 安全配置

### SSH安全

```bash
# SSH配置文件位置
/etc/ssh/sshd_config

# 建议配置
Port 57                    # 非默认端口
PermitRootLogin yes       # NAS已配置root访问
PasswordAuthentication yes  # 已启用密码认证
MaxAuthTries 3
ClientAliveInterval 300
```

### 防火墙配置

```bash
# 如果使用iptables
iptables -A INPUT -p tcp --dport 57 -j ACCEPT
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# 如果使用ufw
ufw allow 57/tcp
ufw allow 80/tcp
ufw allow 443/tcp
```

### 数据库安全

```bash
# MySQL/MariaDB安全设置
mysql_secure_installation

# 创建用户和权限
CREATE USER 'nas_user'@'%' IDENTIFIED BY 'nas_pass123456';
GRANT ALL PRIVILEGES ON production_db.* TO 'nas_user'@'%';
FLUSH PRIVILEGES;
```

## 📊 性能优化

### 系统级优化

```bash
# 修改文件描述符限制
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf

# 优化网络参数
echo "net.core.rmem_max = 16777216" >> /etc/sysctl.conf
echo "net.core.wmem_max = 16777216" >> /etc/sysctl.conf
sysctl -p
```

### MySQL优化

```bash
# 在my.cnf中添加性能优化配置
[mysqld]
innodb_buffer_pool_size = 2G      # 设置为物理内存的60-70%
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT
query_cache_type = 1
query_cache_size = 64M
```

### Redis优化

```bash
# 在redis.conf中配置
maxmemory 512mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

## 🚨 故障排除

### 常见问题

#### 1. FRP连接失败

```bash
# 检查FRP服务状态
systemctl status frpc

# 检查网络连接
ping 8.130.127.121

# 检查配置文件
/yyc3-hd/www/frpc/frpc -c /yyc3-hd/www/frpc/frpc.toml --check

# 查看详细日志
journalctl -u frpc -f
```

#### 2. Docker容器启动失败

```bash
# 查看容器状态
docker ps -a

# 查看容器日志
docker logs <container_name>

# 重新构建容器
docker-compose down
docker-compose up -d --force-recreate
```

#### 3. 数据库连接问题

```bash
# 检查数据库服务
systemctl status mariadb

# 测试数据库连接
mysql -h 127.0.0.1 -u nas_user -p

# 检查端口监听
ss -tlnp | grep 3306
```

#### 4. 磁盘空间不足

```bash
# 检查磁盘使用
df -h

# 清理日志文件
find /yyc3-hd/logs -name "*.log" -mtime +7 -delete

# 清理Docker
docker system prune -a
```

### 性能监控

```bash
# 安装监控工具
apt-get install htop iotop nethogs

# 实时监控
htop          # CPU和内存
iotop         # 磁盘I/O
nethogs       # 网络使用
```

## 📋 维护清单

### 日常维护

- [ ] 检查服务运行状态
- [ ] 查看系统日志
- [ ] 监控磁盘空间使用
- [ ] 检查备份执行情况

### 周期性维护

- [ ] 更新系统补丁（每周）
- [ ] 清理旧日志文件（每周）
- [ ] 检查容器镜像更新（每周）
- [ ] 备份重要配置（每月）

### 应急响应

- [ ] 准备恢复方案
- [ ] 定期测试备份恢复
- [ ] 建立应急联系机制
- [ ] 准备备用访问方式

## 📞 技术支持

如有问题，请联系：

- **系统管理员**: <admin@0379.email>
- **技术支持**: 0379.email
- **文档维护**: 定期更新此部署指南

---

**文档版本**: v1.0
**最后更新**: 2025-11-10
**维护人员**: 系统管理员
