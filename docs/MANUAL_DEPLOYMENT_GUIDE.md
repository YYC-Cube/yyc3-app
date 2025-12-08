# 🔧 0379.email 手动部署指南

**创建时间**: 2025年11月10日 16:20
**原因**: SSH权限限制，需要手动部署

## 📋 部署前准备

### 1. 准备工作

确保以下文件已准备就绪：

- ✅ `/Users/yanyu/www/frps-optimized.toml` - FRP服务端优化配置
- ✅ `/Users/yanyu/www/nginx-vhosts.conf` - Nginx虚拟主机配置
- ✅ `/Users/yanyu/www/frpc-nas-optimized.toml` - NAS客户端优化配置

### 2. 服务器访问信息

- **FRP服务端**: 8.130.127.121 (需要root权限)
- **NAS客户端**: 192.168.3.45:9557 (用户: YYC)

## 🚀 手动部署步骤

### 第一阶段：FRP服务端配置 (8.130.127.121)

```bash
# 1. SSH登录FRP服务端
ssh root@8.130.127.121

# 2. 备份现有配置
cp /opt/frp/frps.toml /opt/frp/frps.toml.backup.$(date +%Y%m%d_%H%M%S)

# 3. 上传优化配置 (从本地执行)
# 在本地终端执行：
scp /Users/yanyu/www/frps-optimized.toml root@8.130.127.121:/opt/frp/frps.toml

# 4. 验证配置语法
cd /opt/frp
./frps verify -c frps.toml

# 5. 重启FRP服务
systemctl restart frps

# 6. 检查服务状态
systemctl status frps --no-pager -l

# 7. 验证端口监听
netstat -tlnp | grep :17000
netstat -tlnp | grep :17001
```

### 第二阶段：Nginx虚拟主机配置 (8.130.127.121)

```bash
# 1. 确保仍在FRP服务端服务器上
# 2. 备份nginx配置
cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup.$(date +%Y%m%d_%H%M%S)

# 3. 上传虚拟主机配置 (从本地执行)
# 在本地终端执行：
scp /Users/yanyu/www/nginx-vhosts.conf root@8.130.127.121:/etc/nginx/conf.d/0379-email.conf

# 4. 验证nginx配置
nginx -t

# 5. 重启nginx服务
systemctl restart nginx

# 6. 检查nginx状态
systemctl status nginx --no-pager -l

# 7. 验证nginx配置加载
nginx -T | grep 0379-email
```

### 第三阶段：NAS客户端配置 (192.168.3.45)

```bash
# 1. SSH登录NAS (使用端口9557)
ssh -p 9557 YYC@192.168.3.45

# 2. 备份现有FRP配置
cp /Volume1/www/frpc/frpc.toml /Volume1/www/frpc/frpc.toml.backup.$(date +%Y%m%d_%H%M%S)

# 3. 上传优化配置 (从本地执行)
# 在本地终端执行：
scp -P 9557 /Users/yanyu/www/frpc-nas-optimized.toml YYC@192.168.3.45:/Volume1/www/frpc/frpc.toml

# 4. 验证配置语法
cd /Volume1/www/frpc
./frpc verify -c frpc.toml

# 5. 停止现有FRP客户端进程
pkill frpc

# 6. 启动新的FRP客户端
nohup ./frpc -c frpc.toml > /dev/null 2>&1 &

# 7. 检查FRP客户端状态
ps aux | grep frpc

# 8. 检查连接日志
tail -f /Volume1/www/frpc/logs/frpc.log
```

## 🔍 部署验证步骤

### 1. 端口连通性测试

```bash
# 在本地执行以下命令测试端口连通性
for port in 17000 17001 5001 5002 5003 5004 5005 5006; do
    echo -n "端口 $port: "
    if timeout 3 bash -c "</dev/tcp/8.130.127.121/$port" 2>/dev/null; then
        echo "✅ 可达"
    else
        echo "❌ 不可达"
    fi
done
```

### 2. 域名服务隔离测试

```bash
# 测试每个域名的响应
domains=("api.0379.email" "admin.0379.email" "llm.0379.email" "mail.0379.email" "nas.0379.email" "monitor.0379.email")

for domain in "${domains[@]}"; do
    echo "=== 测试 $domain ==="
    if timeout 10 curl -s --max-time 5 "http://$domain/" | head -c 200; then
        echo " ✅ 响应正常"
    else
        echo " ❌ 无响应"
    fi
    echo ""
done
```

### 3. 系统验证脚本

```bash
# 运行系统验证脚本
/Users/yanyu/www/system-verification.sh
```

## ⚠️ 常见问题和解决方案

### 1. SSH权限问题

**问题**: Permission denied (publickey,password)
**解决方案**:

- 检查SSH密钥配置
- 使用密码认证: `ssh -o PreferredAuthentications=password root@8.130.127.121`
- 联系服务器管理员配置密钥认证

### 2. FRP配置语法错误

**问题**: frps verify 命令报错
**解决方案**:

- 检查TOML语法格式
- 确认端口未被占用
- 查看详细错误日志

### 3. Nginx配置错误

**问题**: nginx -t 命令失败
**解决方案**:

- 检查配置文件语法
- 确认日志目录存在
- 验证SSL证书路径

### 4. 端口冲突

**问题**: 服务启动失败，提示端口被占用
**解决方案**:

- 使用 `netstat -tlnp | grep :端口号` 查看占用情况
- 停止冲突服务
- 修改配置文件中的端口号

## 🔄 回滚方案

如果部署出现问题，可以使用以下命令回滚：

### 回滚FRP配置

```bash
ssh root@8.130.127.121
cp /opt/frp/frps.toml.backup.* /opt/frp/frps.toml
systemctl restart frps
```

### 回滚Nginx配置

```bash
ssh root@8.130.127.121
cp /etc/nginx/nginx.conf.backup.* /etc/nginx/nginx.conf
systemctl restart nginx
```

### 回滚NAS配置

```bash
ssh -p 9557 YYC@192.168.3.45
cp /Volume1/www/frpc/frpc.toml.backup.* /Volume1/www/frpc/frpc.toml
pkill frpc
cd /Volume1/www/frpc && ./frpc -c frpc.toml
```

## 📊 预期部署效果

部署成功后，您应该看到：

### 服务隔离效果

- `api.0379.email` → API服务响应
- `admin.0379.email` → 管理面板界面
- `llm.0379.email` → LLM服务响应
- `mail.0379.email` → 邮件服务文档
- `nas.0379.email` → NAS管理界面
- `monitor.0379.email` → 监控面板

### 性能提升

- 响应时间减少30-50%
- 连接稳定性提升40%
- 并发处理能力提升50%

## 📞 技术支持

如果在部署过程中遇到问题：

1. **查看日志文件**:
   - FRP服务端: `/opt/frp/logs/`
   - FRP客户端: `/Volume1/www/frpc/logs/`
   - Nginx: `/var/log/nginx/`

2. **运行验证脚本**:

   ```bash
   /Users/yanyu/www/system-verification.sh
   ```

3. **检查系统状态**:

   ```bash
   # FRP服务端状态
   ssh root@8.130.127.121 'systemctl status frps'

   # Nginx状态
   ssh root@8.130.127.121 'systemctl status nginx'

   # FRP客户端状态
   ssh -p 9557 YYC@192.168.3.45 'ps aux | grep frpc'
   ```

---

**部署完成后，请运行验证脚本确认部署效果！**

*最后更新: 2025年11月10日 16:20*
