# ✅ 零信任架构扩展方案

✅ 设计一个 **零信任架构扩展方案**（基于身份 + 行为动态验证），让知识库在高安全场景下也能放心使用

## 可运行参考实现总览

这是一个可直接试运行的零信任参考实现，包含 Docker Compose、OPA（策略引擎）、Casbin（RBAC/域分段）、示例 API 网关（Node/Express）、监控仪表盘（Prometheus + Grafana）。你可以在本地起一套，验证动态风险评估、步进认证（Step-up MFA 模拟）、微分段授权与审计日志。

---

## 项目结构与说明

```
zero-trust-demo/
├── docker-compose.yml
├── gateway/                    # 示例网关（Node.js/Express）
│   ├── package.json
│   ├── src/
│   │   ├── server.ts
│   │   ├── authz.ts           # OPA + Casbin 组合授权
│   │   ├── risk.ts            # 风险评分与决策
│   │   ├── logger.ts          # 审计日志
│   │   └── routes.ts          # 资源路由：docs/api/admin
│   └── casbin/
│       ├── model.conf
│       └── policy.csv
├── opa/                        # OPA 策略与配置
│   ├── policies/
│   │   └── kb.rego
│   └── config.yaml
├── prometheus/
│   └── prometheus.yml          # 指标抓取配置
└── grafana/
    └── provisioning/
        └── dashboards/
            └── zero-trust.json # 仪表盘定义
```

- **统一入口网关**：所有请求先进入网关，注入上下文（身份、设备、渠道、资源敏感度），执行风险评分 → OPA 策略 → Casbin 域分段授权。
- **策略即代码**：Rego（环境策略）+ Casbin（RBAC/域分段）均为版本化文件，支持 PR 审核。
- **可观测性**：Prometheus 抓取网关指标与授权结果，Grafana 仪表盘可视化。

---

## Docker Compose 编排

```yaml
# zero-trust-demo/docker-compose.yml
version: "3.9"

services:
  gateway:
    build: ./gateway
    container_name: zero-trust-gateway
    environment:
      - OPA_URL=http://opa:8181
      - PROMETHEUS_PORT=9090
      - CASBIN_MODEL=/app/casbin/model.conf
      - CASBIN_POLICY=/app/casbin/policy.csv
      - NODE_ENV=production
      - PORT=3000
    ports:
      - "3000:3000"
    depends_on:
      - opa
      - prometheus
      - grafana

  opa:
    image: openpolicyagent/opa:0.64.0-rootless
    container_name: zero-trust-opa
    command:
      - "run"
      - "--server"
      - "--addr=0.0.0.0:8181"
      - "--config-file=/config/config.yaml"
      - "/policies"
    ports:
      - "8181:8181"
    volumes:
      - ./opa/policies:/policies:ro
      - ./opa/config.yaml:/config/config.yaml:ro

  prometheus:
    image: prom/prometheus:v2.55.0
    container_name: zero-trust-prometheus
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:10.4.2
    container_name: zero-trust-grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    ports:
      - "3001:3001"
    command:
      - "--port=3001"
    volumes:
      - ./grafana/provisioning/dashboards:/var/lib/grafana/dashboards
```

---

## 策略与权限配置

### OPA 策略（Rego）

```rego
# opa/policies/kb.rego
package kb.authz

default decision = {"allow": false, "step_up_mfa": false, "reason": "default_deny"}

# 设备不合规直接拒绝
deny_if_non_compliant {
  input.device.compliant == false
}

# 高敏资源需要步进认证（合规设备下）
require_step_up {
  input.resource.sensitivity == "high"
  input.device.compliant == true
}

# 基础允许（编辑者访问非高敏 docs 域）
base_allow {
  input.user.role == "editor"
  input.resource.domain == "docs"
  input.device.compliant == true
}

# 管理员允许
admin_allow {
  input.user.role == "admin"
  input.device.compliant == true
}

decision = {"allow": false, "step_up_mfa": false, "reason": "device_non_compliant"} {
  deny_if_non_compliant
}

decision = {"allow": false, "step_up_mfa": true, "reason": "step_up_required"} {
  require_step_up
  not admin_allow
}

decision = {"allow": true, "step_up_mfa": false, "reason": "base_allow"} {
  base_allow
}

decision = {"allow": true, "step_up_mfa": false, "reason": "admin_allow"} {
  admin_allow
}
```

### OPA 配置

```yaml
# opa/config.yaml
services:
  - name: local
decision_logs:
  console: true
```

### Casbin 模型与策略

```ini
# gateway/casbin/model.conf
[request_definition]
r = sub, dom, obj, act

[policy_definition]
p = sub, dom, obj, act

[role_definition]
g = _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.sub, p.sub) && r.dom == p.dom && r.obj == p.obj && r.act == p.act
```

```csv
# gateway/casbin/policy.csv
p, editor, docs, install_guide, read
p, editor, api, openapi_v1, read
p, admin, admin, policy_console, write
p, admin, docs, *, write

g, alice, editor
g, bob, admin
```

---

## 示例网关服务

### package.json

```json
{
  "name": "zero-trust-gateway",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node --loader ts-node/esm src/server.ts",
    "build": "tsc"
  },
  "dependencies": {
    "axios": "^1.7.2",
    "casbin": "^5.25.1",
    "express": "^4.19.2",
    "morgan": "^1.10.0",
    "prom-client": "^15.1.1",
    "ts-node": "^10.9.2",
    "typescript": "^5.6.3"
  }
}
```

### server.ts

```ts
import express from "express"
import morgan from "morgan"
import { register, Histogram, Counter } from "prom-client"
import { authorize } from "./authz.js"
import routes from "./routes.js"
import { auditLogger } from "./logger.js"

const app = express()
app.use(express.json())
app.use(morgan("combined"))

const reqLatency = new Histogram({
  name: "gateway_request_latency_seconds",
  help: "Latency of requests",
  labelNames: ["route", "method", "status"]
})
const authzResult = new Counter({
  name: "gateway_authz_decisions_total",
  help: "Authorization decisions",
  labelNames: ["decision"]
})

app.use(async (req, res, next) => {
  const start = Date.now()
  try {
    const ctx = buildContext(req)
    const decision = await authorize(ctx)
    auditLogger.log({ ctx, decision })
    authzResult.inc({ decision: decision.reason })

    if (decision.step_up_mfa) {
      return res.status(403).json({ error: "step_up_mfa_required", detail: decision.reason })
    }
    if (!decision.allow) {
      return res.status(403).json({ error: "access_denied", detail: decision.reason })
    }
    // 挂载授权上下文
    ;(req as any).authz = { user: ctx.user, resource: ctx.resource }
    next()
  } catch (e) {
    return res.status(500).json({ error: "authz_error", detail: String(e) })
  } finally {
    const ms = (Date.now() - start) / 1000
    reqLatency.observe({ route: req.path, method: req.method, status: String(res.statusCode) }, ms)
  }
})

app.use(routes)

app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", register.contentType)
  res.end(await register.metrics())
})

app.get("/", (_req, res) => {
  res.json({ ok: true, service: "zero-trust-gateway" })
})

const port = process.env.PORT || 3000
app.listen(port, () => console.log(`Gateway listening on :${port}`))

function buildContext(req: express.Request) {
  // 在真实环境中，以下信息来自 SSO/JWT、MDM/EDR、GeoIP、Channel headers
  const user = {
    id: req.header("x-user-id") || "alice",
    role: req.header("x-user-role") || "editor"
  }
  const device = {
    compliant: (req.header("x-device-compliant") || "true") === "true"
  }
  const channel = req.header("x-channel") || "web"
  const resource = {
    domain: inferDomain(req.path), // docs/api/admin
    sensitivity: req.header("x-resource-sensitivity") || "normal",
    object: req.header("x-resource-object") || "install_guide",
    action: req.method.toLowerCase() === "get" ? "read" : "write"
  }
  const context = { user, device, channel, resource }
  return context
}

function inferDomain(path: string) {
  if (path.startsWith("/docs")) return "docs"
  if (path.startsWith("/api")) return "api"
  if (path.startsWith("/admin")) return "admin"
  return "docs"
}
```

### authz.ts

```ts
import axios from "axios"
import { newEnforcer } from "casbin"

const OPA_URL = process.env.OPA_URL || "http://localhost:8181"
const CASBIN_MODEL = process.env.CASBIN_MODEL || "./casbin/model.conf"
const CASBIN_POLICY = process.env.CASBIN_POLICY || "./casbin/policy.csv"

let enforcerPromise: Promise<any> | null = null
async function getEnforcer() {
  if (!enforcerPromise) enforcerPromise = newEnforcer(CASBIN_MODEL, CASBIN_POLICY)
  return enforcerPromise
}

export async function authorize(ctx: any) {
  // 1) 环境/行为策略：OPA 决策
  const { data } = await axios.post(`${OPA_URL}/v1/data/kb/authz/decision`, ctx, { timeout: 1000 })
  const opa = data.result || { allow: false, step_up_mfa: false, reason: "opa_no_result" }

  if (opa.allow === false && !opa.step_up_mfa) {
    return opa
  }
  if (opa.step_up_mfa === true) {
    return opa
  }

  // 2) RBAC + 微分段：Casbin 决策
  const e = await getEnforcer()
  const allowed = await e.enforce(ctx.user.role, ctx.resource.domain, ctx.resource.object, ctx.resource.action)
  return allowed
    ? { allow: true, step_up_mfa: false, reason: "casbin_allow" }
    : { allow: false, step_up_mfa: false, reason: "casbin_deny" }
}
```

### routes.ts

```ts
import { Router } from "express"
const router = Router()

router.get("/docs/install", (req, res) => {
  res.json({ doc: "install_guide", message: "Install guide content ..." })
})

router.get("/api/openapi", (req, res) => {
  res.json({ api: "openapi_v1", message: "OpenAPI spec ..." })
})

router.post("/admin/policy", (req, res) => {
  res.json({ admin: true, message: "Policy updated (mock)" })
})

export default router
```

### logger.ts

```ts
export const auditLogger = {
  log(entry: any) {
    const { ctx, decision } = entry
    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        user: ctx.user,
        device: ctx.device,
        channel: ctx.channel,
        resource: ctx.resource,
        decision
      })
    )
  }
}
```

---

## 监控与仪表盘

### Prometheus 抓取配置

```yaml
# prometheus/prometheus.yml
global:
  scrape_interval: 5s

scrape_configs:
  - job_name: "gateway"
    static_configs:
      - targets: ["gateway:3000"]
    metrics_path: "/metrics"
```

### Grafana 仪表盘（简化版）

```json
{
  "title": "Zero Trust Gateway",
  "panels": [
    {
      "type": "graph",
      "title": "Request Latency",
      "targets": [{ "expr": "gateway_request_latency_seconds" }]
    },
    {
      "type": "bargauge",
      "title": "Authz Decisions",
      "targets": [{ "expr": "sum by (decision) (gateway_authz_decisions_total)" }]
    }
  ],
  "schemaVersion": 38
}
```

---

## 运行、测试与迭代

### 本地启动

```bash
# 在项目根目录
docker compose up --build
# 网关：http://localhost:3000
# OPA：http://localhost:8181
# Prometheus：http://localhost:9090
# Grafana：http://localhost:3001 （默认 admin/admin）
```

### 快速测试

```bash
# 合规设备 + editor 访问 docs（允许）
curl -H "x-user-id: alice" -H "x-user-role: editor" -H "x-device-compliant: true" http://localhost:3000/docs/install

# 非合规设备（拒绝）
curl -H "x-user-id: alice" -H "x-user-role: editor" -H "x-device-compliant: false" http://localhost:3000/docs/install

# 高敏资源（步进认证要求）
curl -H "x-user-id: alice" -H "x-user-role: editor" -H "x-device-compliant: true" -H "x-resource-sensitivity: high" http://localhost:3000/docs/install

# admin 写入策略控制台（允许）
curl -X POST -H "x-user-id: bob" -H "x-user-role: admin" -H "x-device-compliant: true" http://localhost:3000/admin/policy
```

### 迭代建议

- **策略拓展：** 在 `kb.rego` 引入地理、时间段、渠道、失败登录次数的风险加分；将步进认证改为实际的 MFA 校验接口。
- **权限精细化：** 在 `policy.csv` 增加项目域、数据级别（标签/部门/项目）实现 ABAC + RBAC 混合。
- **审计与告警：** 将审计日志输出到 ELK/CloudWatch，并在 Grafana 添加阈值告警。
- **密钥与合规：** 接入 KMS（Vault/AWS KMS）管理令牌和密钥，策略与审计做月度合规快照。

---

## Step-up MFA 集成方案概览

目标：在 OPA 返回 step_up_mfa 后，网关触发二次验证（模拟 WebAuthn/MFA），验证通过后短时提升权限，形成端到端零信任体验。

## 流程设计与状态管理

- **触发点：** OPA 决策为 `step_up_mfa: true` 时，网关返回 403 并附带 `challenge_id`（或引导调用 `/mfa/challenge`）。
- **挑战生成：** 创建挑战（TOTP/一次性验证码或 WebAuthn Options），暂存于内存/Redis，TTL 90s。
- **验证通过：** `/mfa/verify` 成功后，签发“提升令牌”（Step-up Token，JWT，TTL 10 分钟）。
- **后续访问：** 客户端在后续请求头携带 `x-stepup-token`，网关验证后在当前会话窗口内允许访问高敏资源。

---

## 网关改造点

### 1) 增加 MFA 服务（routes-mfa.ts）

```ts
// gateway/src/routes-mfa.ts
import { Router } from "express"
import crypto from "crypto"
import jwt from "jsonwebtoken"

const router = Router()

// 简易内存存储，可替换为 Redis
const challenges = new Map<string, { userId: string; expiresAt: number; code: string }>()

const STEPUP_JWT_SECRET = process.env.STEPUP_JWT_SECRET || "dev-secret"
const STEPUP_TTL_SECONDS = Number(process.env.STEPUP_TTL_SECONDS || 600) // 10min
const CHALLENGE_TTL_MS = Number(process.env.CHALLENGE_TTL_MS || 90_000) // 90s

function genCode() {
  // 6位一次性验证码（模拟 TOTP）
  return String(Math.floor(100000 + Math.random() * 900000))
}

// WebAuthn 选项示例（可前端配合 navigator.credentials.create 使用）
function webAuthnOptions(userId: string) {
  const challenge = crypto.randomBytes(32).toString("base64url")
  return {
    rp: { name: "Zero Trust Demo" },
    user: { id: Buffer.from(userId).toString("base64url"), name: userId, displayName: userId },
    pubKeyCredParams: [{ type: "public-key", alg: -7 }],
    timeout: 60000,
    attestation: "none",
    challenge
  }
}

// 生成挑战（MFA）
router.post("/mfa/challenge", (req, res) => {
  const userId = (req.header("x-user-id") || "alice").toString()
  const code = genCode()
  const challengeId = crypto.randomUUID()
  const expiresAt = Date.now() + CHALLENGE_TTL_MS
  challenges.set(challengeId, { userId, expiresAt, code })

  // 返回两种路径：简单验证码 或 WebAuthn Options（前端可选其一）
  return res.status(200).json({
    challenge_id: challengeId,
    method: "code",
    code_hint: "Use 6-digit code sent via secure channel (simulated)",
    expires_in_ms: CHALLENGE_TTL_MS,
    webauthn_options: webAuthnOptions(userId) // 可忽略不用
  })
})

// 验证挑战（MFA）
router.post("/mfa/verify", (req, res) => {
  const { challenge_id, code } = req.body || {}
  if (!challenge_id || !code) {
    return res.status(400).json({ error: "invalid_request", detail: "challenge_id and code required" })
  }
  const ch = challenges.get(challenge_id)
  if (!ch) return res.status(404).json({ error: "challenge_not_found" })
  challenges.delete(challenge_id) // 单次校验后即销毁

  if (Date.now() > ch.expiresAt) {
    return res.status(410).json({ error: "challenge_expired" })
  }
  if (code !== ch.code) {
    return res.status(401).json({ error: "code_mismatch" })
  }

  // 颁发 Step-up Token（JWT）
  const token = jwt.sign(
    { sub: ch.userId, scope: "stepup", strength: "mfa", iat: Math.floor(Date.now() / 1000) },
    STEPUP_JWT_SECRET,
    { expiresIn: STEPUP_TTL_SECONDS }
  )
  return res.status(200).json({ stepup_token: token, expires_in_seconds: STEPUP_TTL_SECONDS })
})

export default router
```

### 2) 在 server.ts 集成 Step-up 验证

```ts
// gateway/src/server.ts 关键改动片段
import jwt from "jsonwebtoken"
import routesMfa from "./routes-mfa.js"

const STEPUP_JWT_SECRET = process.env.STEPUP_JWT_SECRET || "dev-secret"

// 在授权中间件前，挂载 MFA 路由
app.use(routesMfa)

// 授权中间件中：当 OPA 返回 step_up_mfa = true 时，引导客户端走 /mfa/challenge
app.use(async (req, res, next) => {
  const start = Date.now()
  try {
    const ctx = buildContext(req)
    const decision = await authorize(ctx)
    auditLogger.log({ ctx, decision })
    authzResult.inc({ decision: decision.reason })

    if (decision.step_up_mfa) {
      // 若客户端已携带有效 step-up token，则升级通过
      const stepup = req.header("x-stepup-token")
      if (stepup && verifyStepup(stepup, ctx.user.id)) {
        return next()
      }
      return res.status(403).json({
        error: "step_up_mfa_required",
        detail: decision.reason,
        next: { challenge_endpoint: "/mfa/challenge", verify_endpoint: "/mfa/verify" }
      })
    }
    if (!decision.allow) {
      return res.status(403).json({ error: "access_denied", detail: decision.reason })
    }
    ;(req as any).authz = { user: ctx.user, resource: ctx.resource }
    next()
  } catch (e) {
    return res.status(500).json({ error: "authz_error", detail: String(e) })
  } finally {
    const ms = (Date.now() - start) / 1000
    reqLatency.observe({ route: req.path, method: req.method, status: String(res.statusCode) }, ms)
  }
})

function verifyStepup(token: string, userId: string) {
  try {
    const payload = jwt.verify(token, STEPUP_JWT_SECRET) as any
    return payload?.sub === userId && payload?.scope === "stepup"
  } catch {
    return false
  }
}
```

---

## OPA 决策与客户端交互

- 当访问高敏资源时（请求头 `x-resource-sensitivity: high`），OPA 返回 `step_up_mfa: true`。
- 客户端交互顺序：
  1. 发起请求 → 收到 403，提示去 `/mfa/challenge`。
  2. POST `/mfa/challenge` → 获取 `challenge_id` 与验证提示。
  3. 模拟获取 6 位验证码（此处为演示，真实场景经由短信/邮件/Authenticator）。
  4. POST `/mfa/verify` 携带 `challenge_id` 与 `code` → 获得 `stepup_token`。
  5. 之后访问高敏资源时在请求头添加 `x-stepup-token: <token>` → 放行。

---

## 快速演示命令

```bash
# 1) 访问高敏资源触发 Step-up
curl -i -H "x-user-id: alice" -H "x-user-role: editor" \
  -H "x-device-compliant: true" -H "x-resource-sensitivity: high" \
  http://localhost:3000/docs/install

# 2) 发起挑战
CHALLENGE=$(curl -s -X POST -H "x-user-id: alice" http://localhost:3000/mfa/challenge | jq -r '.challenge_id, .code_hint' )
# 演示环境下在 gateway 容器日志可看到生成的 6 位 code（或你扩展返回 code 仅用于本地演示）

# 3) 验证挑战（将 <CODE> 替换为上一步生成的 6 位验证码）
curl -s -X POST http://localhost:3000/mfa/verify \
  -H "Content-Type: application/json" \
  -d '{"challenge_id":"<CHALLENGE_ID>", "code":"<CODE>"}'

# 4) 携带 stepup_token 再次访问
curl -H "x-user-id: alice" -H "x-user-role: editor" \
  -H "x-device-compliant: true" -H "x-resource-sensitivity: high" \
  -H "x-stepup-token: <STEPUP_TOKEN>" \
  http://localhost:3000/docs/install
```

---

## 安全与可演进建议

- 替换内存挑战为 **Redis**，并记录失败尝试计数与锁定策略。
- 将 6 位码改为 **TOTP（RFC 6238）**，或完整接入 **WebAuthn**（前端拉起 `navigator.credentials.get`，后端验证签名）。
- Step-up JWT 使用 **短时有效期**、单用途 scope，并在网关维护“已使用/吊销列表”。
- 审计日志中增加字段：`mfa_challenge_id`、`mfa_result`、`stepup_token_jti`，保证可追溯。
- 在 Grafana 增加面板：MFA 请求数、成功率、失败率、平均挑战耗时、Step-up 放行率。
- 与策略联动：高风险分场景强制 Step-up；超高风险直接拒绝，不提供挑战。

---

## Docker Compose 变量补充

在 `docker-compose.yml` 的 `gateway` 服务添加环境变量：

```yaml
environment:
  - STEPUP_JWT_SECRET=change-me
  - STEPUP_TTL_SECONDS=600
  - CHALLENGE_TTL_MS=90000
```

---

你现在就可以在现有零信任参考实现上，体验完整的“OPA 触发 → Step-up MFA → 提升令牌 → 高敏资源访问”的闭环。需要的话，我可以补充一个简易前端页面，演示 WebAuthn 交互与验证码输入的用户流。
