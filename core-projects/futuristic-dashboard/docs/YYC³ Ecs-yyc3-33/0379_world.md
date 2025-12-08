# YanYu Cloud Cube 智能行业平台部署说明（阿里云服务器 + Nginx 代理 + Vercel 项目集成）

> 「YanYuCloudCube」
>「万象归元于云枢 丨深栈智启新纪元」
>「All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence」
>「AI Intelligent Programming Development Application Project Delivery Work Instruction」‌
---

## ✅ 一、域名一致性核对与补充

### 已在 JSON 中定义的行业 ID（24 项）：
- yyc3-agr
- yyc3-fb
- yyc3-fn
- yyc3-gov
- yyc3-hr
- yyc3-med
- yyc3-media
- yyc3-manu
- yyc3-core
- yyc3-cultural
- yyc3-edu
- yyc3-energy
- yyc3-env
- yyc3-law
- yyc3-log
- yyc3-ent
- yyc3-real
- yyc3-retail
- yyc3-traffic
- yyc3-tourism
- yyc3-elder
- yyc3-api
- yyc3-dc
- yyc3-finance

### 在文件列表中新增但未在 JSON 中定义的：

- ✅ yyc3-cdc → 建议添加为“疾控中心”或“公共卫生数据”
- ✅ yyc3-edc → 建议添加为“教育数据中心”
- ✅ yyc3-Edge → 建议添加为“边缘计算平台”
- ✅ yyc3-edu-basic → 建议作为“基础教育”
- ✅ yyc3-edu-higher → 建议作为“高等教育”
- ✅ yyc3-fin → 与 yyc3-finance 重复，建议合并或区分为“传统金融”与“金融科技”

> ✅ 我建议将这些新增项补充进 JSON 配置，并在 README 中统一说明。

---

## 📘 二、完整版配置 README.md（适用于阿里云服务器部署）

```md
/**
 * @file README.md
 * @description YYC³ 智能行业平台部署说明（阿里云服务器 + Nginx 代理 + Vercel 项目集成）
 * @author YYC³
 * @version 1.0.0
 * @created 2025-10-15
 */

# YYC³ 智能行业平台部署说明

## 📍 服务器信息
- 云服务商：阿里云
- 公网 IP：`8.152.195.33`
- 操作系统：Alibaba Cloud Linux / Ubuntu
- Web 服务：Nginx + Docker（可选）

## 🌐 主域名与子域名解析

### 主域名
- `0379.world` → 解析至 `8.152.195.33`
- 用于部署仪表盘项目（Next.js）

### 子域名（行业项目代理）
所有子域名均解析至同一 IP，并由 Nginx 代理至 Vercel 项目或自定义域：

| 子域名             | 对应项目地址（Vercel 或自定义）         |
|--------------------|------------------------------------------|
| yyc3-agr.0379.world | https://yyc3-agr.vercel.app              |
| yyc3-fb.0379.world  | https://yyc3-fb.vercel.app               |
| yyc3-fn.0379.world  | https://yyc3-fn.vercel.app               |
| yyc3-gov.0379.world | https://yyc3-gov.vercel.app              |
| yyc3-hr.0379.world  | https://yyc3-hr.vercel.app               |
| yyc3-med.0379.world | https://yyc3-med.vercel.app              |
| yyc3-media.0379.world | https://yyc3-media.vercel.app          |
| yyc3-manu.0379.world | https://yyc3-manu.vercel.app            |
| yyc3-core.0379.world | https://yyc3-core.vercel.app            |
| yyc3-cultural.0379.world | https://yyc3-cultural.vercel.app     |
| yyc3-edu.0379.world | https://yyc3-edu.vercel.app              |
| yyc3-energy.0379.world | https://yyc3-energy.vercel.app         |
| yyc3-env.0379.world | https://yyc3-env.vercel.app              |
| yyc3-law.0379.world | https://yyc3-law.vercel.app              |
| yyc3-log.0379.world | https://yyc3-log.vercel.app              |
| yyc3-ent.0379.world | https://yyc3-ent.vercel.app              |
| yyc3-real.0379.world | https://yyc3-real.vercel.app            |
| yyc3-retail.0379.world | https://yyc3-retail.vercel.app         |
| yyc3-traffic.0379.world | https://yyc3-traffic.vercel.app       |
| yyc3-tourism.0379.world | https://yyc3-tourism.vercel.app       |
| yyc3-elder.0379.world | https://yyc3-elder.vercel.app          |
| yyc3-api.0379.world | https://yyc3-api.vercel.app              |
| yyc3-dc.0379.world  | https://yyc3-dc.vercel.app               |
| yyc3-finance.0379.world | https://yyc3-finance.vercel.app       |
| yyc3-cdc.0379.world | https://yyc3-cdc.vercel.app              |
| yyc3-edc.0379.world | https://yyc3-edc.vercel.app              |
| yyc3-Edge.0379.world | https://yyc3-edge.vercel.app            |
| yyc3-edu-basic.0379.world | https://yyc3-edu-basic.vercel.app   |
| yyc3-edu-higher.0379.world | https://yyc3-edu-higher.vercel.app |

> 所有子域名需在阿里云 DNS 控制台中添加 A 记录，指向 `8.152.195.33`

---

## 🧱 Nginx 配置建议

每个子域名配置一个 `server` 块，代理至对应 Vercel 项目：

```nginx
server {
    listen 80;
    server_name yyc3-agr.0379.world;
    location / {
        proxy_pass https://yyc3-agr.vercel.app;
    }
}
```

主域名仪表盘项目：

```nginx
server {
    listen 80;
    server_name 0379.world;
    location / {
        proxy_pass http://127.0.0.1:3000; # Next.js 仪表盘项目
    }
}
```

---

## 📦 仪表盘项目部署

- 项目框架：Next.js + Tailwind + TypeScript
- 启动方式：Docker 或 Node.js
- 端口：默认 3000
- 功能：展示所有行业入口、状态、评分、AI模型等

---
