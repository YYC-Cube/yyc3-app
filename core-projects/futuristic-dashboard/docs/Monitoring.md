# Prometheus / Grafana 配置说明

## Prometheus
- 采集路径：`/metrics`
- 来源：ECS 网关服务
- 关键指标：
  - `gateway_request_latency_seconds`
  - `gateway_authz_decisions_total`
  - `mfa_verifications_total`

## Grafana
- 仪表盘分区：
  - 请求性能（延迟、吞吐量）
  - 授权结果（allow/deny/MFA）
  - 安全行为（异常访问、失败登录）

## 告警规则
- 延迟 > 2s
- 拒绝率 > 30%
- MFA失败率 > 20%
- 高敏资源访问 > 50 次/5分钟

## SOAR联动
- 告警触发 → 冻结账户 → 调整策略 → 通知团队
