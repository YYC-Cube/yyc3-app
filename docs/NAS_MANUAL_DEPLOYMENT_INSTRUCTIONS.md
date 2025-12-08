# NAS 手动部署指令 (紧急方案)

## 当前状态

- NAS IP: 192.168.3.45 ✅ 网络可达
- FRP服务端: 8.130.127.121:17000 ✅ 运行中
- 部署包: /Users/yanyu/www/nas-frp-deployment ✅ 就绪
- 域名解析: ✅ 已完成

## 立即执行步骤

### 方法1: 通过NAS管理界面启用SSH

1. 打开浏览器访问 NAS 管理界面
2. 登录NAS管理系统
3. 找到"服务"或"网络"设置
4. 启用SSH服务 (端口22或57)
5. 保存设置并重启SSH服务
6. 重新运行自动化部署脚本

### 方法2: 直接在NAS终端执行

如果可以物理访问NAS或已有终端访问：

```bash
# 1. 创建目录
mkdir -p /Volume1/www/frpc/{logs,scripts}
mkdir -p /etc/frp

# 2. 下载或传输部署包文件到 /Volume1/www/frpc/
# 需要的文件：
# - frpc (二进制文件)
# - frpc.toml (配置文件)
# - ca.pem (证书文件)
# - install.sh (安装脚本)

# 3. 设置权限
cd /Volume1/www/frpc
chmod +x frpc install.sh
chmod 644 frpc.toml ca.pem

# 4. 执行安装
./install.sh

# 5. 验证部署
systemctl status frpc
journalctl -u frpc -f
```

### 方法3: U盘部署

1. 将部署包复制到U盘
2. 将U盘插入NAS
3. 通过NAS终端访问U盘
4. 执行上述方法2的步骤

## 验证部署成功

部署完成后，应该看到：

- FRP客户端进程运行
- 端口7400监听 (管理界面)
- 连接到 8.130.127.121:17000
- 日志显示连接成功

## 测试外网访问

部署成功后测试：

- api.0379.email/health
- admin.0379.email
- llm.0379.email/health

## 紧急联系

如果遇到问题，可以：

1. 检查网络连接
2. 验证FRP服务端状态
3. 查看部署日志
4. 重新运行安装脚本

---
**生成时间**: Mon Nov 10 05:32:37 CST 2025
**目标NAS**: 192.168.3.45
**FRP服务端**: 8.130.127.121:17000
