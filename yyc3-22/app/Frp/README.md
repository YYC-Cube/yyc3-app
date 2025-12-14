# FRP NAS 客户端部署指南 (yyc3-45)

## 概述

这是为铁威马 F4-423 NAS (yyc3-45) 准备的FRP客户端完整部署包。

## 系统要求

- 设备: 铁威马 F4-423 NAS
- IP地址: 192.168.3.45
- 系统: Linux (x86_64)
- SSH访问: 已启用
- 用户权限: root 或管理员权限

## 部署步骤

### 1. 准备工作

```bash
# SSH连接到NAS
ssh root@192.168.3.45

# 创建必要目录
mkdir -p /Volume2/www/frpc/{logs,scripts}
mkdir -p /etc/frp
```

### 2. 上传文件

将以下文件上传到NAS的 `/Volume2/www/frpc/` 目录：

- `frpc` - FRP客户端二进制文件
- `frpc.toml` - 配置文件
- `ca.pem` - CA证书文件
- `install.sh` - 安装脚本

### 3. 执行安装

```bash
cd /Volume2/www/frpc
chmod +x frpc install.sh
./install.sh
```

### 4. 启动服务

```bash
systemctl start frpc
systemctl enable frpc
```

## 服务映射

配置后，以下服务将通过FRP从外网访问：

| 服务类型 | 外网访问地址 | 内网地址 | 描述 |
|---------|-------------|----------|------|
| SSH管理 | docker.0379.email:9557 | NAS:57 | SSH管理端口 |
| NAS管理 | nas.0379.email | NAS:80 | NAS Web管理界面 |
| API服务 | api.0379.email | NAS:3000 | API服务 |
| 管理面板 | admin.0379.email | NAS:3001 | 管理面板 |
| LLM服务 | llm.0379.email | NAS:3002 | AI服务 |
| 邮件服务 | mail.0379.email | NAS:3003 | 邮件服务 |
| 数据库 | mysql.0379.email:3307 | NAS:3306 | MariaDB/MySQL |
| 缓存 | redis.0379.email:6378 | NAS:6379 | Redis缓存 |
| 文件服务 | files.0379.email | NAS:8081 | 文件共享 |
| 监控服务 | monitor.0379.email | NAS:3004 | 系统监控 |
| 备份服务 | backup.0379.email | NAS:3005 | 备份接口 |

## 管理命令

### 查看服务状态

```bash
systemctl status frpc
```

### 查看日志

```bash
# 实时日志
journalctl -u frpc -f

# 历史日志
tail -f /Volume2/www/frpc/logs/frpc.log
```

### 重启服务

```bash
systemctl restart frpc
```

### 停止服务

```bash
systemctl stop frpc
```

### 管理界面

- 本地访问: <http://192.168.3.45:7400>
- 用户名: nas_admin
- 密码: m5ODDD1oPMYKfhHG31A3tQ==

## 配置文件位置

- 主配置: `/Volume2/www/frpc/frpc.toml`
- 日志文件: `/Volume2/www/frpc/logs/frpc.log`
- CA证书: `/Volume2/www/frpc/ca.pem`
- 系统服务: `/etc/systemd/system/frpc.service`

## 故障排除

### 1. 连接失败

```bash
# 检查网络连接
ping 8.152.195.33

# 检查端口连通性
telnet 8.152.195.33 17000
```

### 2. 服务启动失败

```bash
# 检查配置文件
/Volume2/www/frpc/frpc -c /Volume2/www/frpc/frpc.toml -t

# 查看详细错误
journalctl -u frpc -n 50
```

### 3. 端口冲突

```bash
# 检查端口占用
netstat -tlnp | grep -E "(3000|3001|3002|3003)"
```

## 安全注意事项

1. 确保只有授权用户可以访问NAS
2. 定期更新FRP客户端版本
3. 监控日志文件，发现异常立即处理
4. 定期备份配置文件

## 技术支持

如遇到问题，请检查：

1. 网络连接是否正常
2. FRP服务端(yyc3-33)是否运行
3. 防火墙设置是否正确
4. 域名解析是否指向正确IP

---
*部署完成后，所有服务将通过 FRP 服务端 (8.130.127.33:7001) 提供给外网访问*
