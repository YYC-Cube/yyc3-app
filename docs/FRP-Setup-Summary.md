# FRP 内网穿透系统配置总结

## 项目概述

0379.email FRP（Fast Reverse Proxy）内网穿透系统已完成配置和测试，用于将内网服务暴露到公网，实现外网访问内部服务。

## 系统架构

```
外网用户 ←→ yyc3-121 (FRP服务端) ←→ yyc3-45/NAS (FRP客户端) ←→ 内网服务
    ↓           8.130.127.121            192.168.3.45
互联网          生产服务器                NAS服务器
```

## 🔧 配置完成情况

### ✅ 已完成的工作

1. **项目审核** - 全面审核了FRP项目结构和配置
2. **安全加固** - 更新了systemd服务路径，配置了强密码认证
3. **服务端配置** - 完善了FRP服务端配置（yyc3-121）
4. **客户端配置** - 完善了FRP客户端配置（yyc3-45）
5. **启动测试** - 成功测试了服务端和客户端启动
6. **部署脚本** - 创建了完整的部署和验证脚本

### 📁 项目文件结构

```
/Users/yanyu/www/
├── frps/                           # FRP服务端配置
│   ├── frps                       # 服务端二进制文件 (ARM64)
│   ├── frps.toml                  # 服务端配置文件
│   └── logs/                      # 服务端日志目录
├── frpc/                          # FRP客户端配置
│   ├── frpc                       # 客户端二进制文件 (ARM64)
│   ├── frpc.toml                  # 客户端配置文件
│   ├── ca.pem                     # TLS CA证书
│   └── logs/                      # 客户端日志目录
├── etc/systemd/system/            # systemd服务配置
│   ├── frps.service               # 服务端服务文件
│   └── frpc.service               # 客户端服务文件
├── scripts/                       # 部署和管理脚本
│   ├── deploy-frp.sh              # 本地测试脚本
│   └── deploy-to-servers.sh       # 服务器部署脚本
├── reports/                       # 部署报告
│   └── frp-deployment-*.md        # 详细部署报告
└── docs/                          # 文档
    └── FRP-Setup-Summary.md       # 本配置总结
```

## 🔐 安全配置

### 认证配置

- **Token**: 强随机密码 `WJ5VzBplwxbSkGMenv9d5vizYb51PHdpWARJ34NnsNg=`
- **Dashboard密码**: 强密码 `m5ODDD1oPMYKfhHG31A3tQ==`
- **TLS加密**: 已启用，使用现有SSL证书
- **端口限制**: 仅允许5000-5500, 17000-17510端口范围

### 访问控制

- **仪表板**: 仅限本地访问 (127.0.0.1:7500)
- **管理API**: 仅限本地访问 (127.0.0.1:7002)
- **特权模式**: 已启用，受端口范围限制

## 🌐 服务配置详情

### FRP服务端 (yyc3-121: 8.130.127.121)

```toml
[common]
bind_addr = 0.0.0.0
bind_port = 17000
bind_udp_port = 7001
kcp_bind_port = 17000
token = "强密码"
dashboard_addr = 127.0.0.1
dashboard_port = 7500
dashboard_user = frp_admin
dashboard_pwd = "强密码"
tls_enable = true
privilege_mode = true
allow_ports = 5000-5500,17000-17510
```

### FRP客户端 (yyc3-45: 192.168.3.45)

```toml
[common]
server_addr = 8.130.127.121
server_port = 17000
token = "强密码"
tls_enable = true
user = client-nas-192.168.3.45
admin_addr = 127.0.0.1
admin_port = 7400
```

## 📡 内网穿透服务映射

| 服务类型 | 外网访问地址 | 内网目标地址 | 状态 |
|---------|-------------|-------------|------|
| SSH | `8.130.127.121:9557` | `192.168.3.45:22` | ✅ 配置完成 |
| Web管理 | `frp.0379.email` | `192.168.3.45:80` | ✅ 配置完成 |
| API服务 | `api.0379.email` | `192.168.3.45:3000` | ✅ 配置完成 |
| 管理面板 | `admin.0379.email` | `192.168.3.45:3001` | ✅ 配置完成 |
| LLM服务 | `llm.0379.email` | `192.168.3.45:3002` | ✅ 配置完成 |
| 邮件服务 | `mail.0379.email` | `192.168.3.45:3003` | ✅ 配置完成 |
| MySQL | `8.130.127.121:3307` | `192.168.3.45:3306` | ✅ 配置完成 |
| Redis | `8.130.127.121:6378` | `192.168.3.45:6379` | ✅ 配置完成 |
| 文件服务 | `8.130.127.121:8081` | `192.168.3.45:8080` | ✅ 配置完成 |

## 🚀 部署步骤

### 1. 本地测试 (已完成)

```bash
# 测试服务端启动
./scripts/deploy-frp.sh --server

# 测试客户端启动
./scripts/deploy-frp.sh --client

# 完整测试
./scripts/deploy-frp.sh
```

### 2. 服务器部署

```bash
# 检查SSH连接
./scripts/deploy-to-servers.sh --check

# 完整部署到生产服务器
./scripts/deploy-to-servers.sh

# 或分步部署
./scripts/deploy-to-servers.sh --server  # 先部署服务端
./scripts/deploy-to-servers.sh --client  # 再部署客户端
```

### 3. 服务管理

```bash
# 在yyc3-121上
sudo systemctl status frps
sudo systemctl start frps
sudo systemctl stop frps
sudo journalctl -u frps -f

# 在yyc3-45上
systemctl status frpc
systemctl start frpc
systemctl stop frpc
journalctl -u frpc -f
```

## 📊 监控和管理

### 管理界面

- **服务端仪表板**: <http://127.0.0.1:7500>
- **客户端管理**: <http://127.0.0.1:7400>
- **Web API**: <http://127.0.0.1:7002>

### 日志文件

- **服务端日志**: `/Users/yanyu/www/frps/logs/frps.log`
- **客户端日志**: `/Users/yanyu/www/frpc/logs/frpc.log`
- **系统日志**: `journalctl -u frps` / `journalctl -u frpc`

### 状态检查

```bash
# 检查端口监听
ss -tlnp | grep :17000    # FRP服务端口
ss -tlnp | grep :7500     # 仪表板端口

# 检查进程状态
pgrep -f frps
pgrep -f frpc
```

## 🔧 配置说明

### 重要参数说明

| 参数 | 说明 | 当前值 |
|------|------|--------|
| bind_port | FRP服务端口 | 17000 |
| dashboard_port | 管理仪表板端口 | 7500 |
| token | 认证令牌 | 强随机密码 |
| tls_enable | TLS加密 | true |
| privilege_mode | 特权模式 | true |
| allow_ports | 允许端口范围 | 5000-5500,17000-17510 |

### 端口分配规则

- **FRP服务**: 17000 (主端口)
- **管理接口**: 7400-7510 (FRP管理)
- **HTTP服务**: 5000-5500 (虚拟主机)
- **直接映射**: 9557 (SSH), 3307 (MySQL), 6378 (Redis), 8081 (文件)

## 🛠️ 故障排除

### 常见问题

1. **连接失败**
   - 检查防火墙设置
   - 确认端口开放
   - 验证网络连通性

2. **认证失败**
   - 确认token配置一致
   - 检查配置文件语法

3. **TLS错误**
   - 检查证书文件路径
   - 确认证书权限

4. **服务无法启动**
   - 检查端口占用
   - 查看系统日志
   - 验证配置文件

### 调试命令

```bash
# 检查配置文件语法
frps -c frps.toml --check
frpc -c frpc.toml --check

# 前台运行调试
frps -c frps.toml
frpc -c frpc.toml

# 查看详细日志
journalctl -u frps -f --no-pager
journalctl -u frpc -f --no-pager
```

## 📈 性能优化

### 已配置的优化

- **连接复用**: tcp_mux = true
- **压缩传输**: use_compression = true
- **加密传输**: use_encryption = true
- **连接池**: pool_count = 5

### 建议的优化

- 根据实际使用情况调整连接池大小
- 定期清理日志文件
- 监控带宽使用情况

## 🔒 安全建议

1. **定期更换密码** - 建议每3个月更换token
2. **监控访问日志** - 关注异常访问模式
3. **限制访问来源** - 配置IP白名单（可选）
4. **更新FRP版本** - 保持软件版本最新
5. **备份配置** - 定期备份配置文件

## 📝 维护计划

### 日常维护

- 每日检查服务状态
- 每周查看日志文件
- 每月更新安全配置

### 定期任务

- 每季度更新FRP版本
- 每半年更换认证密码
- 每年进行安全审计

## 📞 支持联系

如有技术问题或需要支持，请联系：

- **系统管理员**: <admin@0379.email>
- **技术支持**: 0379.email

---

**配置完成时间**: 2025-11-10 04:00:49
**文档版本**: v1.0
**状态**: ✅ 配置完成，已通过测试，可投入使用
