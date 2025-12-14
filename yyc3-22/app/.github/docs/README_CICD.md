# 0379.email CI/CD 工作流程文档

## 概述

本文档详细描述了 0379.email 项目的持续集成/持续部署 (CI/CD) 工作流程，包括自动化测试、代码质量检查、构建和部署流程。

## CI/CD 架构

### 持续集成 (CI)

CI 流程在以下情况下自动触发：

- 向非主分支推送代码
- 创建或更新 Pull Request
- 手动触发

CI 工作流包含以下主要步骤：

1. **代码质量检查**：运行 ESLint 和 Prettier 检查代码规范
2. **构建测试**：执行 TypeScript 编译检查
3. **单元测试**：运行 Jest 测试并生成覆盖率报告
4. **依赖安全检查**：检查依赖包的安全漏洞
5. **代码标准化检查**：验证项目结构、命名规范和代码格式

### 持续部署 (CD)

CD 流程在以下情况下自动触发：

- 向主分支 (`main`) 推送代码
- 向开发分支 (`develop`) 推送代码
- 手动触发

CD 工作流支持以下环境的部署：

1. **测试环境 (Staging)**：用于功能验证和集成测试
2. **生产环境 (Production)**：用于最终用户访问

## 配置文件

### 主要配置文件

- **`.github/workflows/ci.yml`**：定义持续集成工作流
- **`.github/workflows/cd.yml`**：定义持续部署工作流
- **`.github/workflows/standardization.yml`**：定义代码标准化检查工作流
- **`.github/config/cicd-config.json`**：集中管理 CI/CD 配置参数

### 环境配置

环境配置通过 `.github/scripts/setup-environment.sh` 脚本管理，支持以下环境：

- `development`：开发环境
- `staging`：测试环境
- `production`：生产环境

## 部署流程

### 部署策略

项目使用蓝绿部署策略，确保平滑过渡和快速回滚能力。

### 部署命令

```bash
# 部署到测试环境
npm run deploy:staging

# 部署到生产环境
npm run deploy:production

# 回滚部署
npm run deploy:rollback
```

### 部署脚本

部署脚本 `scripts/deploy.sh` 提供以下功能：

- 环境准备和验证
- 依赖安装和构建
- 服务部署和启动
- 健康检查和验证
- 部署记录和回滚支持

## 健康检查

### 健康检查脚本

健康检查脚本 `.github/scripts/health-check.sh` 执行以下检查：

- 系统资源使用情况（内存、CPU、磁盘）
- 进程状态检查
- 端口监听检查
- 依赖服务可用性
- 应用健康端点检查
- 日志文件分析

### 运行健康检查

```bash
# 运行健康检查
npm run health:check
```

## 代码标准化

### 标准化检查脚本

标准化检查脚本 `.github/scripts/standardization-check.sh` 执行以下检查：

- 文件结构验证
- 命名规范检查
- 代码格式化检查
- 代码质量检查
- 文件大小限制检查

### 运行标准化检查

```bash
# 运行标准化检查
npm run standardize

# 自动修复标准化问题
npm run standardization:fix
```

## 常见问题排查

### CI 构建失败

1. **代码质量问题**：修复 ESLint 或 Prettier 报告的问题
2. **编译错误**：修复 TypeScript 编译错误
3. **测试失败**：修复单元测试失败的问题
4. **依赖安全问题**：更新有安全漏洞的依赖包

### 部署失败

1. **环境配置问题**：检查环境变量和配置文件
2. **服务启动失败**：查看服务日志了解具体错误
3. **健康检查失败**：检查服务是否正常运行和响应

## 手动触发工作流

所有工作流都支持手动触发，可通过 GitHub Actions 界面执行。

## 联系与支持

如有 CI/CD 相关问题，请联系项目维护团队。

---

更新时间：2024-10-15
作者：YYC
