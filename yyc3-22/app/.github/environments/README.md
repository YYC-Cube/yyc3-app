# 🌐 环境配置管理

本目录包含项目不同环境的配置信息，用于GitHub Actions部署流程中的环境管理。

## 📁 目录结构

```
environments/
├── staging/       # Staging环境配置
├── production/    # Production环境配置
└── README.md      # 配置说明文档
```

## 🚀 环境变量管理

在GitHub仓库中设置环境变量的步骤：

1. 进入GitHub仓库 → Settings → Environments
2. 选择对应环境（staging/production）
3. 设置以下环境变量：

### 🔧 通用环境变量

| 变量名         | 说明     | 示例值                   | 安全级别 |
| -------------- | -------- | ------------------------ | -------- |
| `NODE_ENV`     | 运行环境 | `production`             | 低       |
| `API_ENDPOINT` | API端点  | `https://0379.email/api` | 低       |
| `DEBUG`        | 调试模式 | `false`                  | 低       |

### 🔒 敏感环境变量（需设置为Secret）

| 变量名               | 说明             | 安全级别 |
| -------------------- | ---------------- | -------- |
| `DEPLOY_KEY`         | 部署密钥         | 高       |
| `HELM_REPO_PASSWORD` | Helm仓库密码     | 高       |
| `DATABASE_URL`       | 数据库连接字符串 | 高       |

## 🛡️ 环境保护规则

为保证部署安全，请为生产环境设置以下保护规则：

1. **Required reviewers** - 设置至少1名审核人员
2. **Deployment branches** - 限制只能从main分支部署
3. **Required status checks** - 要求CI检查通过
4. **Wait timer** - 可选：设置部署等待时间

## 🔄 环境切换流程

```bash
# 切换到Staging环境
bash .github/scripts/setup-environment.sh setup staging

# 切换到Production环境
bash .github/scripts/setup-environment.sh setup production
```

## 📊 环境健康检查

每个环境部署后会自动执行以下健康检查：

- API响应检查：`/api/status`
- 性能监控：响应时间、内存使用
- 功能验证：核心功能测试

## 🚨 故障回滚

如需回滚，请使用以下命令：

```bash
# 回滚到上一个稳定版本
bash rollback.sh production
```

保持代码健康，稳步前行！ 🌹
