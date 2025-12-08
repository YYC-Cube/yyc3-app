# CI/CD 流程说明

## 触发条件
- 分支：`main`, `develop`
- 事件：push / pull_request

## 执行步骤
1. Checkout 代码
2. 安装 Node.js 18
3. 启用 corepack + 安装依赖（pnpm）
4. 执行 CI 脚本：`pnpm ci`
   - 包含 lint、typecheck、权限校验、构建

## 相关脚本
- `scripts/deploy-vercel.sh`
- `scripts/deploy-docker.sh`
- `scripts/validate-permissions.ts`

## 环境变量
- `PROJECT_ID`
- `DOMAIN`
- `API_BASE`
- `DEPLOY_ENV`
