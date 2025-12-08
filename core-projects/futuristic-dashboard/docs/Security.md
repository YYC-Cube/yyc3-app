# 安全策略说明（OPA + Casbin）

## Casbin
- 模型：RBAC + 多租户分段
- 策略文件：`policy.csv`
- 权限匹配：角色 → 行业域 → 资源 → 操作

## OPA
- 策略文件：`industry.authz.rego`
- 动态判断：
  - 设备合规性
  - 资源敏感度
  - MFA触发条件

## 权限校验脚本
- `scripts/validate-permissions.ts`
- 校验 `industry-subdomains.json` 与策略一致性

## 安全闭环
- 拒绝 → MFA → 冻结 → 审计 → 通知
