# FRP 自启动配置指南

## 📖 概述

本指南详细说明如何为FRP（Fast Reverse Proxy）服务端和客户端配置自启动服务，确保系统重启后FRP服务能够自动恢复运行。

## 🎯 配置目标

- **服务端自启动**: yyc3-121 服务器上的FRP服务自动启动
- **客户端自启动**: NAS服务器上的FRP客户端自动启动
- **监控和告警**: 自动监控服务状态和异常告警
- **日志管理**: 自动日志轮转和清理
- **健康检查**: 定期健康检查和自动恢复

## 🏗️ 架构设计

### 服务端架构 (yyc3-121)
```
yyc3-121 服务器
├── FRP服务端 (frps)
│   ├── 端口: 17000 (主服务)
│   ├── 管理面板: 7500
│   ├── SSH端口: 9557
│   └── 监控: 每5分钟检查
├── SystemD服务
│   ├── 服务名: frps 或 frp-server
│   ├── 自动启动: enabled
│   └── 自动重启: on-failure
└── 日志管理
    ├── 日志路径: /opt/frp/logs/
    ├── 轮转策略: 每日轮转，保留7天
    └── 压缩: 启用gzip压缩
```

### 客户端架构 (NAS)
```
NAS 服务器
├── FRP客户端 (frpc)
│   ├── 连接服务器: 8.130.127.121:17000
│   ├── 管理面板: 7400
│   └── 代理服务: 6个服务映射
├── SystemD服务
│   ├── 服务名: frpc 或 frp-client
│   ├── 自动启动: enabled
│   └── 自动重启: on-failure
├── 监控脚本
│   ├── 健康检查: /opt/frpc/scripts/health_check.sh
│   ├── 状态监控: /opt/frpc/scripts/monitor.sh
│   └── 自动监控: 每5分钟执行
└── 代理服务
    ├── API服务: api.0379.email:5001
    ├── 管理后台: admin.0379.email:5003
    ├── AI服务: llm.0379.email:5002
    ├── 邮件服务: mail.0379.email:5004
    ├── NAS管理: nas.0379.email:5005
    └── 监控面板: monitor.0379.email:5006
```

## 🚀 快速部署

### 1. 服务端部署 (yyc3-121)

```bash
# 上传部署脚本到服务器
scp /Users/yanyu/www/scripts/frp-server-setup.sh root@8.130.127.121:/tmp/

# 登录服务器
ssh root@8.130.127.121

# 执行部署脚本
chmod +x /tmp/frp-server-setup.sh
/tmp/frp-server-setup.sh

# 验证部署结果
systemctl status frps
```

### 2. 客户端部署 (NAS)

```bash
# 上传部署脚本到NAS
scp /Users/yanyu/www/scripts/frp-client-setup.sh root@192.168.3.45:/tmp/

# 登录NAS
ssh root@192.168.3.45

# 执行部署脚本
chmod +x /tmp/frp-client-setup.sh
/tmp/frp-client-setup.sh

# 验证部署结果
systemctl status frpc
```

## 📋 配置文件详解

### 服务端配置 (frps.toml)

```toml
[common]
# 服务器绑定配置
bind_addr = 0.0.0.0
bind_port = 17000
kcp_bind_port = 17000

# 认证配置
token = "WJ5VzBplwxbSkGMenv9d5vizYb51PHdpWARJ34NnsNg="
authentication_method = token
authenticate_heartbeats = true
authenticate_new_work_conns = true

# 仪表板配置
dashboard_addr = 127.0.0.1
dashboard_port = 7500
dashboard_user = "frp_admin"
dashboard_pwd = "m5ODDD1oPMYKfhHG31A3tQ=="

# 日志配置
log_file = /opt/frp/logs/frps.log
log_level = info
log_max_days = 7

# 连接配置
max_pool_count = 50
tcp_mux = true
heartbeat_timeout = 60

# 安全配置
allow_ports = 5000-5500,17000-17510
max_ports_per_client = 10

# SSH端口映射
[ssh]
listen_port = 9557
```

### 客户端配置 (frpc.toml)

```toml
[common]
# 服务器连接
server_addr = 8.130.127.121
server_port = 17000
token = "WJ5VzBplwxbSkGMenv9d5vizYb51PHdpWARJ34NnsNg="

# 客户端管理
admin_addr = 127.0.0.1
admin_port = 7400
admin_user = "frp_admin"
admin_pwd = "m5ODDD1oPMYKfhHG31A3tQ=="

# 日志配置
log_file = /opt/frpc/logs/frpc.log
log_level = info
log_max_days = 7

# API服务代理
[api-0379]
type = tcp
local_ip = 192.168.3.45
local_port = 3000
remote_port = 5001
custom_domains = api.0379.email
use_encryption = true
use_compression = true

# 管理后台代理
[admin-0379]
type = tcp
local_ip = 192.168.3.45
local_port = 3001
remote_port = 5003
custom_domains = admin.0379.email

# AI服务代理
[llm-0379]
type = tcp
local_ip = 192.168.3.45
local_port = 8000
remote_port = 5002
custom_domains = llm.0379.email

# 邮件服务代理
[mail-0379]
type = tcp
local_ip = 192.168.3.45
local_port = 3003
remote_port = 5004
custom_domains = mail.0379.email

# NAS管理代理
[nas-0379]
type = tcp
local_ip = 192.168.3.45
local_port = 80
remote_port = 5005
custom_domains = nas.0379.email

# 监控面板代理
[monitor-0379]
type = tcp
local_ip = 192.168.3.45
local_port = 3000
remote_port = 5006
custom_domains = monitor.0379.email
```

## 🛠️ SystemD服务配置

### 服务端服务文件 (/etc/systemd/system/frps.service)

```ini
[Unit]
Description=Frp Server Service
After=network.target

[Service]
Type=simple
User=frp
Group=frp
Restart=on-failure
RestartSec=5s
ExecStart=/opt/frp/bin/frps -c /opt/frp/conf/frps.toml
ExecReload=/bin/kill -s HUP $MAINPID
KillMode=mixed
StandardOutput=journal
StandardError=journal
SyslogIdentifier=frps
CapabilityBoundingSet=CAP_NET_BIND_SERVICE
AmbientCapabilities=CAP_NET_BIND_SERVICE
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
```

### 客户端服务文件 (/etc/systemd/system/frpc.service)

```ini
[Unit]
Description=Frp Client Service
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=frp
Group=frp
Restart=on-failure
RestartSec=10s
ExecStart=/opt/frpc/bin/frpc -c /opt/frpc/conf/frpc.toml
ExecReload=/bin/kill -s HUP $MAINPID
KillMode=mixed
StandardOutput=journal
StandardError=journal
SyslogIdentifier=frpc
TimeoutStartSec=30
TimeoutStopSec=30

[Install]
WantedBy=multi-user.target
```

## 📊 监控和维护

### 1. 服务状态监控

```bash
# 查看服务状态
systemctl status frps    # 服务端
systemctl status frpc    # 客户端

# 查看实时日志
journalctl -u frps -f   # 服务端
journalctl -u frpc -f   # 客户端

# 查看进程状态
ps aux | grep frp
```

### 2. 自动监控脚本

服务端监控脚本位于 `/opt/frp/scripts/monitor.sh`，每5分钟自动执行：
- 检查服务运行状态
- 检查端口监听情况
- 监控连接数统计
- 记录系统资源使用情况

客户端监控脚本位于 `/opt/frpc/scripts/monitor.sh`，每5分钟自动执行：
- 检查服务运行状态
- 检查服务器连接状态
- 检查代理服务可达性
- 监控系统资源使用情况

### 3. 健康检查

```bash
# 运行客户端健康检查
/opt/frpc/scripts/health_check.sh

# 检查所有FRP服务状态
/Users/yanyu/www/scripts/frp-monitor-dashboard.sh full
```

### 4. 日志管理

```bash
# 查看日志轮转配置
cat /etc/logrotate.d/frps
cat /etc/logrotate.d/frpc

# 手动执行日志轮转
logrotate -f /etc/logrotate.d/frps
logrotate -f /etc/logrotate.d/frpc

# 清理过期日志
find /opt/frp/logs/ -name "*.log.*" -mtime +7 -delete
find /opt/frpc/logs/ -name "*.log.*" -mtime +7 -delete
```

## 🔧 故障排查

### 1. 服务无法启动

```bash
# 检查服务状态
systemctl status frps
systemctl status frpc

# 查看详细日志
journalctl -u frps --no-pager -n 50
journalctl -u frpc --no-pager -n 50

# 检查配置文件
/opt/frp/bin/frps -t /opt/frp/conf/frps.toml
/opt/frpc/bin/frpc -t /opt/frpc/conf/frpc.toml

# 手动启动测试
systemctl stop frps
/opt/frp/bin/frps -c /opt/frp/conf/frps.toml
```

### 2. 连接失败

```bash
# 检查网络连通性
telnet 8.130.127.121 17000
nc -zv 8.130.127.121 17000

# 检查防火墙
ufw status
firewall-cmd --list-all

# 检查端口占用
netstat -tuln | grep 17000
lsof -i :17000
```

### 3. 代理服务不可达

```bash
# 检查本地服务状态
curl http://192.168.3.45:3000/health
curl http://192.168.3.45:3001/health
curl http://192.168.3.45:8000/health
curl http://192.168.3.45:3003/health

# 检查外网访问
curl http://api.0379.email:5001/health
curl http://admin.0379.email:5003/health
```

## 🔒 安全配置

### 1. 防火墙规则

```bash
# Ubuntu/Debian UFW
ufw allow 17000/tcp comment "FRP Server"
ufw allow 7500/tcp comment "FRP Dashboard"
ufw allow 9557/tcp comment "FRP SSH"

# CentOS/RHEL Firewalld
firewall-cmd --permanent --add-port=17000/tcp --add-port=7500/tcp --add-port=9557/tcp
firewall-cmd --reload
```

### 2. 权限配置

```bash
# 检查文件权限
ls -la /opt/frp/
ls -la /opt/frpc/

# 修复权限
chown -R frp:frp /opt/frp/
chown -R frp:frp /opt/frpc/
chmod 755 /opt/frp/bin/frps
chmod 755 /opt/frpc/bin/frpc
chmod 644 /opt/frp/conf/frps.toml
chmod 644 /opt/frpc/conf/frpc.toml
```

## 📋 维护清单

### 日常维护 (每日)
- [ ] 检查服务运行状态
- [ ] 查看系统资源使用情况
- [ ] 检查连接数统计
- [ ] 查看错误日志

### 周期维护 (每周)
- [ ] 检查日志文件大小
- [ ] 执行日志轮转
- [ ] 更新系统补丁
- [ ] 备份配置文件

### 月度维护 (每月)
- [ ] 更新FRP版本
- [ ] 审查安全配置
- [ ] 优化性能参数
- [ ] 清理过期文件

## 🚀 升级和迁移

### 1. FRP版本升级

```bash
# 备份当前配置
cp /opt/frp/conf/frps.toml /opt/frp/conf/frps.toml.backup
cp /opt/frpc/conf/frpc.toml /opt/frpc/conf/frpc.toml.backup

# 停止服务
systemctl stop frps frpc

# 下载新版本
cd /tmp
wget https://github.com/fatedier/frp/releases/download/v0.61.1/frp_0.61.1_linux_amd64.tar.gz
tar -xzf frp_0.61.1_linux_amd64.tar.gz

# 替换二进制文件
cp frp_0.61.1_linux_amd64/frps /opt/frp/bin/frps
cp frp_0.61.1_linux_amd64/frpc /opt/frpc/bin/frpc
chmod +x /opt/frp/bin/frps
chmod +x /opt/frpc/bin/frpc

# 重启服务
systemctl start frps frpc
```

### 2. 配置迁移

```bash
# 导出当前配置
systemctl stop frps frpc

# 迁移配置文件
cp /opt/frp/conf/* /backup/frp/
cp /opt/frpc/conf/* /backup/frpc/

# 恢复服务
systemctl start frps frpc
```

## 📞 技术支持

### 联系信息
- **项目维护**: YanYu Cloud Team
- **文档更新**: 2025年11月10日
- **版本信息**: FRP v0.61.1

### 常用命令速查

```bash
# 服务管理
systemctl start|stop|restart frps|frpc
systemctl enable|disable frps|frpc

# 日志查看
journalctl -u frps|frpc -f
tail -f /opt/frp/logs/frps.log
tail -f /opt/frpc/logs/frpc.log

# 配置验证
/opt/frp/bin/frps -t /opt/frp/conf/frps.toml
/opt/frpc/bin/frpc -t /opt/frpc/conf/frpc.toml

# 监控检查
/opt/frp/scripts/monitor.sh
/opt/frpc/scripts/health_check.sh
```

---

**指南版本**: v1.0
**更新时间**: 2025年11月10日
**配置状态**: 🎉 生产就绪