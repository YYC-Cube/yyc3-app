# 贡献指南

感谢您对 0379.email 项目的关注！我们欢迎所有形式的贡献。

## 🤝 贡献方式

### 报告问题

- 使用 [GitHub Issues](https://github.com/your-org/0379.email/issues) 报告 bug
- 提供详细的问题描述和复现步骤
- 包含系统环境信息和错误日志

### 提交代码

1. Fork 项目仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 改进文档

- 修正文档中的错误
- 添加使用示例
- 翻译文档内容

## 📝 开发规范

### 代码风格

- 使用 ESLint 和 Prettier 进行代码格式化
- 遵循项目编码规范
- 编写清晰的注释

### 提交信息规范

```
type(scope): description

[optional body]

[optional footer]
```

类型：

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

### 测试要求

- 为新功能编写单元测试
- 确保测试覆盖率不低于 80%
- 运行完整测试套件：`make test`

## 🔍 代码审查

所有 Pull Request 都需要通过代码审查：

1. **自动检查**：CI/CD 流水线会自动运行测试和代码检查
2. **人工审查**：至少需要一位维护者的批准
3. **安全审查**：涉及安全更改的 PR 需要安全团队审查

## 🚀 开发环境设置

### 前置要求

- Node.js 18+
- Docker 24+
- Docker Compose 2.0+

### 设置步骤

```bash
# 克隆仓库
git clone https://github.com/your-org/0379.email.git
cd 0379.email

# 安装依赖
make install

# 启动开发环境
make dev

# 运行测试
make test
```

## 📚 文档贡献

### 文档类型

- API 文档
- 用户指南
- 开发文档
- 部署指南

### 文档规范

- 使用 Markdown 格式
- 包含清晰的目录结构
- 提供代码示例
- 保持内容的时效性

## 🏷️ 发布流程

### 版本号规范

遵循 [语义化版本](https://semver.org/lang/zh-CN/) 规范。

### 发布步骤

1. 更新版本号
2. 更新 CHANGELOG.md
3. 创建 Git 标签
4. 自动构建和发布

## 💬 社区

### 沟通渠道

- GitHub Issues：问题报告和功能请求
- GitHub Discussions：社区讨论
- 邮件列表：<dev@0379.email>

### 行为准则

请阅读并遵守我们的 [行为准则](CODE_OF_CONDUCT.md)。

## 🙏 致谢

感谢所有为项目做出贡献的开发者！您的贡献让这个项目变得更好。

---

如有任何问题，请随时通过 GitHub Issues 或邮件联系我们。
