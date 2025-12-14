# frpc 整体检查命令指导文档

> ***YanYuCloudCube***
> **标语**：言启象限 | 语枢未来
> ***Words Initiate Quadrants, Language Serves as Core for the Future***
> **标语**：万象归元于云枢 | 深栈智启新纪元
> ***All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence***

---

## 一、文档简介

本指导文档提供了 frpc（frp 客户端）的全面检查命令集，帮助您快速诊断和排查 frpc 服务的运行状态、连接问题和代理配置，确保 frpc 服务稳定运行。

## 二、整体检查流程

### 1. 基础状态检查

| 检查项 | 命令 | 说明 |
|-------|------|------|
| frpc 服务状态 | `systemctl status frpc.service` | 检查 frpc 服务是否正常运行 |
| frpc 进程状态 | `ps aux grep frpc` | 查看 frpc 进程是否存在及资源占用 |
| 端口监听 | `ss -tulpn grep frpc` | 检查 frpc 占用的端口 |
| 管理员端口 | `ss -tulpn grep 7400` | 验证管理界面端口是否监听 |

### 2. 配置文件检查

| 检查项 | 命令 | 说明 |
|-------|------|------|
| 配置文件语法 | `frpc validate -c /Volumes/www/frpc/frpc.toml` | 验证配置文件语法是否正确 |
| 配置文件内容 | `cat /Volumes/www/frpc/frpc.toml` | 查看完整配置 |
| 配置文件权限 | `ls -la /Volumes/www/frpc/frpc.toml` | 检查文件权限是否合理 |

### 3. 连接状态检查

| 检查项 | 命令 | 说明 |
|-------|------|------|
| 服务端连接测试 | `ping 8.152.195.33` | 检查网络连通性 |
| 服务端端口测试 | `telnet 8.152.195.33 7001` | 验证服务端 7001 端口是否可访问 |
| TLS 连接测试 | `openssl s_client -connect 8.152.195.33:7001 -tls1_2` | 测试 TLS 连接是否正常 |
| 管理 API 访问 | `curl -u yyc3:my151001 http://127.0.0.1:7400/api/status` | 验证管理 API 是否可访问 |

### 4. 代理状态检查

| 检查项 | 命令 | 说明 |
|-------|------|------|
| 所有代理状态 | `curl -u yyc3:my151001 http://127.0.0.1:7400/api/proxies` | 获取所有代理的详细状态 |
| 单个代理状态 | `curl -u yyc3:my151001 http://127.0.0.1:7400/api/proxies/api-0379` | 查看特定代理的状态 |
| 代理流量统计 | `curl -u yyc3:my151001 http://127.0.0.1:7400/api/proxies/traffic` | 查看代理流量统计 |

### 5. 日志检查

| 检查项 | 命令 | 说明 |
|-------|------|------|
| 实时日志 | `tail -f /Volume2/www/frpc/logs/frpc.log` | 查看实时日志 |
| 错误日志 | `grep -i error /Volume2/www/frpc/logs/frpc.log` | 筛选错误信息 |
| 警告日志 | `grep -i warning /Volume2/www/frpc/logs/frpc.log` | 筛选警告信息 |
| 最近日志 | `tail -n 100 /Volume2/www/frpc/logs/frpc.log` | 查看最近 100 条日志 |

### 6. 本地服务检查

| 检查项 | 命令 | 说明 |
|-------|------|------|
| API 服务 | `curl http://192.168.3.45:6600` | 检查本地 API 服务是否响应 |
| LLM 服务 | `curl http://192.168.3.45:6602` | 检查本地 LLM 服务是否响应 |
| 管理服务 | `curl http://192.168.3.45:6601` | 检查本地管理服务是否响应 |
| 邮件服务 | `curl http://192.168.3.45:6603` | 检查本地邮件服务是否响应 |
| NAS 服务 | `curl http://192.168.3.45:8181` | 检查本地 NAS 服务是否响应 |
| 监控服务 | `curl http://192.168.3.45:3002` | 检查本地监控服务是否响应 |

## 三、详细检查命令详解

### 1. 服务状态检查详解

## **检查 frpc 服务状态**

```bash
# 查看服务详细状态
systemctl status frpc.service

# 仅查看服务是否运行
systemctl is-active frpc.service
```

## **检查 frpc 进程**

```bash
# 查看 frpc 进程详细信息
ps aux grep frpc

# 查看 frpc 进程的 CPU 和内存占用
top -p $(pgrep frpc)
```

### 2. 配置文件深度检查

## **配置文件验证**

```bash
# 语法验证
frpc validate -c /Volumes/www/frpc/frpc.toml

# 检查配置文件的关键参数
grep -E "server_addr|server_port|token|user" /Volumes/www/frpc/frpc.toml

# 检查代理配置
grep -A5 "\[.*\]" /Volumes/www/frpc/frpc.toml
```

### 3. 网络连接深度检查

## **网络连通性测试**

```bash
# 测试到服务端的网络延迟
ping -c 5 8.152.195.33

# 测试 TCP 连接
telnet 8.152.195.33 7001

# 测试 UDP 连接
nc -u -z -v 8.152.195.33 7001

# 测试路由
traceroute 8.152.195.33
```

## **防火墙检查**

```bash
# 查看防火墙规则
iptables -L -n

# 检查本地端口是否被防火墙阻止
iptables -L -n grep 6600
```

### 4. 代理状态深度检查

## **使用管理 API 检查**

```bash
# 导出管理员认证信息
export FRP_USER=yyc3
export FRP_PASS=my151001

# 获取所有代理状态
curl -u $FRP_USER:$FRP_PASS http://127.0.0.1:7400/api/proxies | jq

# 获取特定代理的详细信息
curl -u $FRP_USER:$FRP_PASS http://127.0.0.1:7400/api/proxies/api-0379 | jq

# 检查代理是否在线
curl -u $FRP_USER:$FRP_PASS http://127.0.0.1:7400/api/proxies | jq '.proxies[] | {name: .name, status: .status}'
```

### 5. 日志深度分析

## **日志分析**

```bash
# 查看最近 24 小时的日志
grep "$(date -d yesterday '+%Y-%m-%d')" /Volume2/www/frpc/logs/frpc.log

# 查看特定时间段的日志
grep "2025-12-13 14:" /Volume2/www/frpc/logs/frpc.log

# 统计错误数量
grep -c "ERROR" /Volume2/www/frpc/logs/frpc.log

# 查看连接失败的日志
grep "connect failed" /Volume2/www/frpc/logs/frpc.log
```

## 四、故障排查指南

### 1. 常见故障及排查步骤

| 故障现象 | 可能原因 | 排查命令 | 解决方法 |
|---------|---------|---------|--------|
| frpc 服务未运行 | 服务未启动、进程崩溃 | `systemctl status frpc.service` | `systemctl start frpc.service` |
| 连接到服务端失败 | 网络问题、服务端未启动 | `ping 8.152.195.33`、`telnet 8.152.195.33 7001` | 检查网络连接、确认服务端运行 |
| token 验证失败 | token 不匹配 | `grep token /Volumes/www/frpc/frpc.toml` | 确认客户端与服务端 token 一致 |
| TLS 连接失败 | TLS 配置不一致 | `grep tls_enable /Volumes/www/frpc/frpc.toml` | 确认客户端与服务端 TLS 配置一致 |
| 代理无法访问 | 本地服务未运行 | `curl http://192.168.3.45:6600` | 启动本地服务 |
| 日志报错 "local port unavailable" | 本地端口被占用 | `ss -tulpn grep 6600` | 释放端口或修改配置 |

### 2. 高级故障排查

## **查看系统资源**

```bash
# 查看内存使用情况
free -h

# 查看磁盘空间
df -h

# 查看系统负载
uptime
```

## **检查系统日志**

```bash
# 查看系统日志
tail -n 100 /var/log/syslog

# 查看 systemd 日志
journalctl -u frpc.service
```

## **测试网络带宽**

```bash
# 测试网络带宽
speedtest-cli
```

## 五、自动化检查脚本

### 1. 一键检查脚本

```bash
#!/bin/bash
# === frpc 自动化检查脚本 ===
set -euo pipefail

# 脚本配置
FRPC_CONFIG="/Volumes/www/frpc/frpc.toml"
FRPC_LOG="/Volume2/www/frpc/logs/frpc.log"
FRP_USER="yyc3"
FRP_PASS="my151001"
SERVER_ADDR="8.152.195.33"
SERVER_PORT="7001"

# 颜色定义
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

echo -e "${BLUE}===================================="${NC}
echo -e "${BLUE}      frpc 整体检查脚本      "${NC}
echo -e "${BLUE}===================================="${NC}
echo

# 1. 基础状态检查
echo -e "${YELLOW}1. 基础状态检查${NC}"
if systemctl is-active frpc.service > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓ frpc 服务运行正常${NC}"
else
    echo -e "  ${RED}✗ frpc 服务未运行${NC}"
    systemctl status frpc.service
fi

echo -e "  ${BLUE}→ frpc 进程状态:${NC}"
ps aux grep frpc | grep -v grep || echo -e "  ${RED}✗ 未找到 frpc 进程${NC}"
echo

# 2. 配置文件检查
echo -e "${YELLOW}2. 配置文件检查${NC}"
if [ -f "$FRPC_CONFIG" ]; then
    echo -e "  ${GREEN}✓ 配置文件存在${NC}"
    frpc validate -c "$FRPC_CONFIG" > /dev/null 2>&1 && echo -e "  ${GREEN}✓ 配置文件语法正确${NC}" || echo -e "  ${RED}✗ 配置文件语法错误${NC}"
else
    echo -e "  ${RED}✗ 配置文件不存在${NC}"
fi
echo

# 3. 连接状态检查
echo -e "${YELLOW}3. 连接状态检查${NC}"
echo -e "  ${BLUE}→ 测试到服务端的网络连接:${NC}"
if ping -c 2 "$SERVER_ADDR" > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓ 网络连接正常${NC}"
else
    echo -e "  ${RED}✗ 网络连接失败${NC}"
fi

echo -e "  ${BLUE}→ 测试服务端端口:${NC}"
if nc -z "$SERVER_ADDR" "$SERVER_PORT" > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓ 服务端端口可访问${NC}"
else
    echo -e "  ${RED}✗ 服务端端口不可访问${NC}"
fi
echo

# 4. 代理状态检查
echo -e "${YELLOW}4. 代理状态检查${NC}"
echo -e "  ${BLUE}→ 测试管理 API:${NC}"
if curl -s -u "$FRP_USER:$FRP_PASS" http://127.0.0.1:7400/api/status > /dev/null; then
    echo -e "  ${GREEN}✓ 管理 API 可访问${NC}"
    echo -e "  ${BLUE}→ 代理状态:${NC}"
    curl -s -u "$FRP_USER:$FRP_PASS" http://127.0.0.1:7400/api/proxies | jq '.proxies[] | {name: .name, status: .status}' || echo -e "  ${RED}✗ 获取代理状态失败${NC}"
else
    echo -e "  ${RED}✗ 管理 API 不可访问${NC}"
fi
echo

# 5. 日志检查
echo -e "${YELLOW}5. 日志检查${NC}"
if [ -f "$FRPC_LOG" ]; then
    echo -e "  ${GREEN}✓ 日志文件存在${NC}"
    ERROR_COUNT=$(grep -c "ERROR" "$FRPC_LOG")
    WARNING_COUNT=$(grep -c "WARNING" "$FRPC_LOG")
    echo -e "  ${BLUE}→ 错误数量: $ERROR_COUNT, 警告数量: $WARNING_COUNT${NC}"
    if [ $ERROR_COUNT -gt 0 ]; then
        echo -e "  ${BLUE}→ 最近的错误日志:${NC}"
        grep "ERROR" "$FRPC_LOG" | tail -n 5
    fi
else
    echo -e "  ${RED}✗ 日志文件不存在${NC}"
fi
echo

# 6. 本地服务检查
echo -e "${YELLOW}6. 本地服务检查${NC}"
local_ports=(6600 6601 6602 6603 8181 3002)
for port in "${local_ports[@]}"; do
    if nc -z 192.168.3.45 "$port" > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓ 本地端口 $port 可访问${NC}"
    else
        echo -e "  ${RED}✗ 本地端口 $port 不可访问${NC}"
    fi
done
echo

echo -e "${BLUE}===================================="${NC}
echo -e "${BLUE}      检查完成      "${NC}
echo -e "${BLUE}===================================="${NC}
```

### 2. 脚本使用方法

```bash
# 保存脚本为 frpc_check.sh
# 添加执行权限
chmod +x frpc_check.sh

# 执行脚本
./frpc_check.sh
```

## 六、定期维护建议

1. **每天检查**：运行自动化检查脚本，查看基本状态
2. **每周检查**：检查日志文件，清理过期日志
3. **每月检查**：验证配置文件，更新 frpc 到最新版本
4. **配置备份**：定期备份配置文件 `/Volumes/www/frpc/frpc.toml`

## 七、注意事项

1. 确保在执行命令时具有足够的权限
2. 敏感信息（如密码、token）请妥善保管
3. 在修改配置文件后，务必重启 frpc 服务使配置生效
4. 定期更新 frpc 版本以获取最新功能和安全修复

保持代码健康，稳步前行！ 🌹

---

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for the Future***」
> 「***All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence***」
