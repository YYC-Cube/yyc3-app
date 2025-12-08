# NAS 客户端手动部署指南

## 自动化执行命令

### 方法1: 直接SSH部署

```bash
# 如果SSH可用，执行以下命令：
scp -r /Users/yanyu/www/nas-frp-deployment/* root@192.168.3.45:/Volume1/www/frpc/
ssh root@192.168.3.45 "cd /Volume1/www/frpc && ./install.sh"
```

### 方法2: 使用SCP传输后手动安装

```bash
# 1. 传输部署包
scp /Users/yanyu/www/nas-frp-deployment.tar.gz root@192.168.3.45:/tmp/

# 2. SSH登录NAS
ssh root@192.168.3.45

# 3. 在NAS上执行以下命令：
cd /tmp
tar -xzf nas-frp-deployment.tar.gz
cd nas-frp-deployment
./install.sh
```

### 方法3: U盘部署

```bash
# 1. 将部署包复制到U盘
cp -r /Users/yanyu/www/nas-frp-deployment /Volumes/USB_DRIVE/

# 2. 将U盘插入NAS，通过SSH或终端执行：
cd /Volume1/USB_DRIVE/nas-frp-deployment
cp -r * /Volume1/www/frpc/
cd /Volume1/www/frpc
./install.sh
```

## NAS端手动操作步骤

如果无法SSH连接，请在NAS上手动执行以下操作：

### 1. 创建目录

```bash
mkdir -p /Volume1/www/frpc/{logs,scripts}
mkdir -p /etc/frp
```

### 2. 下载并传输文件

将以下文件传输到 `/Volume1/www/frpc/` 目录：

- frpc (二进制文件)
- frpc.toml (配置文件)
- ca.pem (证书文件)
- install.sh (安装脚本)

### 3. 设置权限

```bash
cd /Volume1/www/frpc
chmod +x frpc install.sh
chmod 644 frpc.toml ca.pem
```

### 4. 执行安装

```bash
./install.sh
```

## 验证部署

部署完成后，在NAS上执行以下验证命令：

```bash
# 检查服务状态
systemctl status frpc

# 查看实时日志
journalctl -u frpc -f

# 检查进程
ps aux | grep frpc

# 检查端口监听
netstat -tlnp | grep :7400

# 检查到服务器的连接
netstat -an | grep 8.130.127.121
```

## 服务地址

部署成功后，以下服务将可通过外网访问：

- SSH管理: docker.0379.email:9557
- NAS管理: nas.0379.email
- API服务: api.0379.email
- 管理面板: admin.0379.email
- LLM服务: llm.0379.email
- 邮件服务: mail.0379.email
- 数据库: mysql.0379.email:3307
- 缓存: redis.0379.email:6378
- 文件服务: files.0379.email

## 故障排除

### SSH连接问题

1. 确认NAS网络连接正常
2. 检查SSH服务是否启用
3. 尝试不同端口: 22, 57, 2222
4. 检查防火墙设置

### 服务启动失败

1. 检查配置文件语法: `./frpc -c frpc.toml -t`
2. 查看详细日志: `journalctl -u frpc -n 50`
3. 检查网络连接到服务器: `telnet 8.130.127.121 17000`

### 端口冲突

1. 检查端口占用: `netstat -tlnp | grep -E "(3000|3001|3002|3003)"`
2. 修改配置文件中的端口映射
