# YYC3 项目文件架构规范

## 1. 架构概述

采用模块化微服务架构，将不同功能的服务分离到独立目录，保持结构一致性和可维护性。

## 2. 根目录结构

```
app/
├── .github/            # GitHub CI/CD 配置
├── .trae/              # Trae AI 配置
├── services/           # 所有服务模块
├── shared/             # 共享代码和资源
├── config/             # 全局配置文件
├── docs/               # 项目文档
├── scripts/            # 全局脚本
├── tests/              # 测试代码
├── public/             # 静态资源
├── docker-compose.yml  # 主 Docker Compose 配置
├── Dockerfile          # 通用 Dockerfile
├── package.json        # 项目依赖
├── .gitignore          # Git 忽略文件
├── .eslintrc.json      # ESLint 配置
├── .prettierrc.json    # Prettier 配置
└── README.md           # 项目说明
```

## 3. 服务模块结构

所有服务模块应遵循统一的结构规范，位于 `services/` 目录下：

```
services/{{service-name}}/
├── src/                # 源代码
│   ├── config/         # 服务配置
│   ├── controllers/    # 控制器
│   ├── models/         # 数据模型
│   ├── routes/         # 路由
│   ├── services/       # 业务逻辑
│   ├── middleware/     # 中间件
│   ├── utils/          # 工具函数
│   ├── validators/     # 数据验证
│   └── index.ts        # 入口文件
├── docs/               # 服务文档
├── tests/              # 服务测试
├── Dockerfile          # 服务 Dockerfile
├── package.json        # 服务依赖
└── README.md           # 服务说明
```

## 4. 配置文件规范

- 全局配置：`config/` 目录
- 服务配置：`services/{{service-name}}/src/config/` 目录
- 环境变量：统一使用 `.env` 文件，按环境区分 `.env.development`、`.env.production`

## 5. 文档规范

- 项目文档：`docs/` 目录
- 服务文档：`services/{{service-name}}/docs/` 目录
- 统一文档格式：采用 Markdown，遵循项目文档模板

## 6. 脚本规范

- 全局脚本：`scripts/` 目录
- 服务脚本：`services/{{service-name}}/scripts/` 目录
- 脚本命名：采用小写字母和连字符，如 `start-server.sh`

## 7. 共享资源规范

- 共享代码：`shared/` 目录
- 共享配置：`shared/config/` 目录
- 共享工具：`shared/utils/` 目录

## 8. 实施步骤

1. 创建新的目录结构
2. 迁移现有代码到新结构
3. 更新配置文件路径
4. 更新文档
5. 验证所有服务正常运行

## 9. 维护规范

- 保持目录结构一致性
- 定期清理不再使用的文件和目录
- 文档与代码同步更新
- 遵循命名规范

通过遵循此规范，可以使项目结构更加清晰合理，提高可维护性和可扩展性。