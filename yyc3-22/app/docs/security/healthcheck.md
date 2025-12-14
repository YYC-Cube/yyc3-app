# 健康检查与监控

## 探针接口

所有服务均提供标准的 `/api/healthcheck` 接口，用于健康状态检测。

### 接口实现

健康检查接口通过共享模块 `shared/status.js` 实现，所有服务（api、admin、llm、mail）均采用统一标准。

### 接口响应示例

```json
{
  "healthy": true,
  "service": "api",
  "timestamp": 1698825600000,
  "hostname": "server-01"
}
```

## 共享模块实现

### 核心模块路径

- **状态接口模块**：`/Users/yanyu/0379.email/shared/status.js`
- **文档模块**：`/Users/yanyu/0379.email/shared/docs.js`

### 共享模块功能

- 统一的健康检查接口
- 标准化的状态、版本和指标接口
- 便于维护和更新

## 服务集成方式

每个服务通过引入共享模块实现健康检查功能：

```javascript
// 示例：admin/server.js 中的集成方式
const statusRoutes = require('../shared/status');
app.use('/api', statusRoutes);
```

## 健康检查脚本

### 脚本路径

- **探针脚本**：`/Users/yanyu/0379.email/healthcheck/ping.sh`

### 脚本内容

```bash
#!/bin/bash
# === 健康探针脚本 ===
# 用法：ping.sh <service_name> <port>
# 示例：ping.sh api 3000

set -euo pipefail
trap 'echo "[ERROR] 健康探针执行失败" >&2' ERR

SERVICE_NAME="${1:-}"
PORT="${2:-}"

if [[ -z "${SERVICE_NAME}" || -z "${PORT}" ]]; then
  echo "用法：$0 <service_name> <port>" >&2
  exit 1
fi

LOG_DIR="/Users/yanyu/0379.email/var/log"
LOG_FILE="${LOG_DIR}/${SERVICE_NAME}-health.log"
mkdir -p "${LOG_DIR}"

TIMESTAMP="$(date +'%Y-%m-%d %H:%M:%S')"
URL="http://127.0.0.1:${PORT}/api/healthcheck"

STATUS_CODE=$(curl -s -o /tmp/health-${SERVICE_NAME}.out -w '%{http_code}' "${URL}" || true)
RESPONSE=$(cat /tmp/health-${SERVICE_NAME}.out || echo "")

if [[ "${STATUS_CODE}" == "200" ]]; then
  echo "${TIMESTAMP} ${SERVICE_NAME} OK ${STATUS_CODE} ${URL} ${RESPONSE}" >> "${LOG_FILE}"
else
  echo "${TIMESTAMP} ${SERVICE_NAME} FAIL ${STATUS_CODE} ${URL} ${RESPONSE}" >> "${LOG_FILE}"
fi
```

## Systemd 定时任务配置

### 服务配置文件

创建 systemd 服务文件 `/etc/systemd/system/api-healthcheck.service`：

```ini
[Unit]
Description=API Service Health Check
After=network.target

[Service]
Type=oneshot
ExecStart=/Users/yanyu/0379.email/healthcheck/ping.sh api 3000
User=root
Group=root
```

### 定时器配置

创建定时器文件 `/etc/systemd/system/api-healthcheck.timer`：

```ini
[Unit]
Description=API Service Health Check Timer

[Timer]
OnCalendar=*:0/5:00  # 每5分钟执行一次
Persistent=true

[Install]
WantedBy=timers.target
```

### 启用定时器

```bash
# 启用并启动定时器
sudo systemctl enable api-healthcheck.timer
sudo systemctl start api-healthcheck.timer

# 其他服务类似配置
sudo systemctl enable admin-healthcheck.timer
sudo systemctl enable llm-healthcheck.timer
sudo systemctl enable mail-healthcheck.timer
```

## 服务配置汇总

| 服务  | 端口 | 健康检查URL                             | 日志路径                                         |
| ----- | ---- | --------------------------------------- | ------------------------------------------------ |
| api   | 3000 | <http://127.0.0.1:3000/api/healthcheck> | /Users/yanyu/0379.email/var/log/api-health.log   |
| admin | 3001 | <http://127.0.0.1:3001/api/healthcheck> | /Users/yanyu/0379.email/var/log/admin-health.log |
| llm   | 3002 | <http://127.0.0.1:3002/api/healthcheck> | /Users/yanyu/0379.email/var/log/llm-health.log   |
| mail  | 3003 | <http://127.0.0.1:3003/api/healthcheck> | /Users/yanyu/0379.email/var/log/mail-health.log  |

## 监控集成

### 日志监控

健康检查日志位置：

- `/Users/yanyu/0379.email/var/log/api-health.log`
- `/Users/yanyu/0379.email/var/log/admin-health.log`
- `/Users/yanyu/0379.email/var/log/llm-health.log`
- `/Users/yanyu/0379.email/var/log/mail-health.log`

可以集成 ELK Stack、Graylog 或 Prometheus + Grafana 等监控工具。

### 告警配置

可以基于健康检查日志配置告警规则，例如：

- 连续3次健康检查失败触发告警
- 服务恢复正常时发送通知
- 定期发送健康状态汇总报告

## 最佳实践

1. **定期检查**：建议每5-15分钟执行一次健康检查
2. **日志轮转**：配置日志轮转避免磁盘空间占用过多
3. **权限控制**：确保健康检查脚本有适当的执行权限
4. **故障恢复**：考虑在健康检查失败时自动重启服务的机制
5. **监控大盘**：建立集中式监控大盘展示所有服务健康状态
6. **共享模块更新**：更新共享模块时需注意所有依赖服务的兼容性

## 常见问题排查

### 服务无法连接

- 检查服务是否正常运行
- 验证端口配置是否正确
- 确认防火墙规则允许访问

### 健康检查返回不健康

- 查看服务日志获取详细错误信息
- 检查服务依赖是否正常
- 验证环境变量配置是否正确
