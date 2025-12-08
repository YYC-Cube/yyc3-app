# 🚀 NAS快速部署指令

**更新时间**: 2025-11-10 05:58:00
**用户信息**: YYC (不是root), 端口: 9557或57

## 📋 当前状态

- ✅ SSH端口已确认开放: 9557 和 57 都在监听
- ✅ 部署包已准备: `/Users/yanyu/www/nas-final-deployment.tar.gz`
- ✅ DNS解析正确: 所有域名指向 8.130.127.121
- 🔄 需要密码认证进行SSH连接

## 🎯 立即执行步骤

### 方法1: 手动SCP传输和SSH部署 (推荐)

#### 步骤1: 传输部署包

```bash
# 使用端口9557传输
scp -P 9557 /Users/yanyu/www/nas-final-deployment.tar.gz YYC@192.168.3.45:/tmp/

# 如果9557失败，尝试端口57
scp -P 57 /Users/yanyu/www/nas-final-deployment.tar.gz YYC@192.168.3.45:/tmp/
```

#### 步骤2: SSH登录NAS

```bash
# 使用端口9557登录
ssh -p 9557 YYC@192.168.3.45

# 如果9557失败，尝试端口57
ssh -p 57 YYC@192.168.3.45
```

#### 步骤3: 在NAS上执行部署

```bash
# SSH登录后执行以下命令：
cd /tmp
tar -xzf nas-final-deployment.tar.gz
cd nas-final-deployment-package

# 检查文件
ls -la

# 执行部署脚本
./deploy.sh
```

### 方法2: 使用交互式部署脚本

```bash
# 运行交互式脚本 (需要密码认证)
/Users/yanyu/www/deploy-to-nas-interactive.sh
```

## 🔍 部署验证

### 在NAS上验证

```bash
# 检查服务状态
systemctl status frpc

# 查看日志
journalctl -u frpc -f

# 测试管理界面
curl http://127.0.0.1:7400

# 检查进程
ps aux | grep frpc

# 检查网络连接
netstat -an | grep 8.130.127.121
```

### 在本地验证

```bash
# 测试外网访问
curl http://api.0379.email/health
curl http://llm.0379.email/health
curl http://admin.0379.email
curl http://mail.0379.email
curl http://nas.0379.email
```

## 📦 部署包内容

部署包包含以下文件：

- `frpc` - FRP客户端二进制文件
- `frpc-corrected.toml` - 配置文件
- `ca.pem` - TLS证书
- `deploy.sh` - 自动部署脚本
- `install.sh` - 安装脚本
- `README.md` - 说明文档

## ⚠️ 注意事项

1. **用户名**: 使用 `YYC`，不是 `root`
2. **端口**: 优先尝试 `9557`，失败则尝试 `57`
3. **权限**: 部署脚本会自动处理权限设置
4. **目录**: 部署到 `/Volume1/www/frpc/`

## 🎉 预期结果

部署成功后，以下服务将可外网访问：

- **API服务**: <http://api.0379.email>
- **管理面板**: <http://admin.0379.email>
- **AI服务**: <http://llm.0379.email>
- **邮件服务**: <http://mail.0379.email>
- **NAS管理**: <http://nas.0379.email>

## 🆘 故障排除

### SSH连接问题

- 确认用户名是 `YYC`
- 尝试不同端口 (9557, 57)
- 检查密码是否正确
- 确认SSH服务已启用

### 部署问题

- 检查部署包是否完整传输
- 确认脚本有执行权限
- 查看详细错误日志
- 重新运行部署脚本

---

**🚀 按照上述步骤执行，即可完成NAS FRP客户端部署！**
