# 邮件平台前端

> **YYC³ 项目文档**
> 
> @project YYC³ Email Platform
> @type 项目说明
> @version 1.0.0
> @created 2025-12-08
> @updated 2025-12-08
> @author YYC³ <admin@0379.email>
> @url https://github.com/YY-Nexus/0379-email-platform


一个现代化的邮件平台前端实现，基于 Next.js 14+ 和 TypeScript 构建，提供高效的邮件管理体验。

## 🔍 项目概述

本项目是一个功能完善的邮件平台前端，支持邮件的撰写、接收、阅读、搜索和管理功能。采用现代前端技术栈，确保良好的用户体验和开发效率。

## 🚀 技术栈

- **框架**: Next.js 14+ (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **状态管理**: React Hooks + React Query
- **HTTP客户端**: Axios
- **表单处理**: Formik
- **验证**: Zod
- **UI组件**: Lucide Icons + 自定义组件

## 📁 项目结构

```
web/
├── public/            # 静态资源
├── src/
│   ├── app/           # Next.js App Router 路由
│   │   ├── page.tsx   # 主页面（收件箱）
│   │   └── compose/   # 邮件撰写页面
│   ├── components/    # React 组件
│   │   ├── common/    # 通用组件
│   │   ├── layout/    # 布局组件
│   │   └── mail/      # 邮件相关组件
│   ├── services/      # API 服务
│   ├── types/         # TypeScript 类型定义
│   ├── hooks/         # 自定义 React Hooks
│   └── utils/         # 工具函数
├── next.config.js     # Next.js 配置
├── tailwind.config.js # Tailwind CSS 配置
└── package.json       # 项目依赖和脚本
```

## 🛠️ 快速开始

### 前置要求

- Node.js 18 或更高版本
- npm 或 yarn 包管理器

### 安装步骤

1. 克隆项目并进入 web 目录

```bash
cd /Users/yanyu/0379-email-platform/web
```

2. 安装依赖

```bash
npm install
# 或
yarn install
```

3. 启动开发服务器

```bash
npm run dev
# 或
yarn dev
```

4. 打开浏览器访问

```
http://localhost:3000
```

## 📋 可用脚本

在项目目录下，可以运行以下脚本：

### `npm run dev`
启动开发服务器，可在本地开发和测试功能。

### `npm run build`
构建生产环境版本的应用。

### `npm run start`
启动生产环境服务器，用于部署后运行。

### `npm run lint`
运行 ESLint 检查代码质量和风格。

## 🌐 主要功能

- **邮件收件箱**: 显示所有接收到的邮件，支持邮件筛选和搜索
- **邮件撰写**: 支持撰写新邮件，添加收件人、抄送、密送和附件
- **邮件阅读**: 查看邮件详细内容和附件
- **邮件管理**: 支持标记星标、删除、移动到文件夹等操作
- **分类管理**: 自定义邮件分类和标签
- **数据分析**: 提供邮件发送和接收的数据分析

## 🎨 UI/UX 设计

项目采用现代化的 UI 设计，具有以下特点：

- 清晰的导航结构，易于使用
- 响应式设计，支持桌面和移动设备
- 直观的邮件列表和详情页
- 简洁美观的邮件编辑器
- 流畅的动画和过渡效果

## 🔒 安全措施

- 使用 JWT 进行身份验证
- 实现请求拦截器处理令牌刷新
- 输入验证和数据清理
- 安全的 HTTP 请求配置

## 📈 性能优化

- 使用 React Query 实现数据缓存和请求优化
- 组件懒加载和代码分割
- 优化图像和静态资源
- 减少不必要的重新渲染

## 🔄 开发流程

1. 创建新的组件或功能时，请遵循项目的代码规范
2. 为新功能编写相应的测试
3. 确保所有代码通过 ESLint 检查
4. 在提交前运行构建命令验证项目可以正常构建

## 📄 许可

本项目仅供学习和开发使用。
