# UI 一致性保障指南

## 概述

本文档旨在提供一套完整的UI一致性保障策略，帮助团队在开发过程中维护统一的视觉体验。通过结合自动化测试、组件库规范化和CI/CD集成，确保UI变更不会意外破坏现有的视觉效果。

## 测试策略

### 1. 组件快照测试

使用Jest和React Testing Library进行组件快照测试，捕获组件的DOM结构，确保UI在不同开发阶段保持一致。

#### 如何运行

```bash
# 运行所有测试
pnpm test

# 运行特定组件测试
pnpm test components/ui/card.test.tsx

# 更新快照
pnpm test -- -u
```

#### 最佳实践

- 为所有UI组件编写快照测试
- 保持测试简洁，专注于渲染输出
- 使用有意义的测试描述
- 避免在快照中包含不确定的动态内容

### 2. Storybook 视觉回归测试

使用Storybook和Chromatic进行视觉回归测试，捕获UI组件的视觉外观，自动检测像素级别的变化。

#### 如何运行

```bash
# 启动Storybook开发服务器
pnpm storybook

# 构建Storybook静态文件
pnpm build-storybook

# 运行Chromatic测试
pnpm chromatic
```

#### 组件故事编写指南

- 为每个组件创建多个故事，覆盖不同状态和变体
- 使用参数化故事展示不同的属性配置
- 添加详细的文档注释
- 考虑不同主题和响应式布局下的视觉表现

### 3. CSS 变量和主题系统

使用CSS变量和主题提供者确保设计系统的一致性。

#### CSS 变量使用规范

- 所有颜色、间距、字体大小等设计元素通过CSS变量定义
- 遵循项目的设计令牌系统
- 避免直接在组件中硬编码样式值

#### 主题切换测试

确保所有组件在深色/浅色主题下都能正确显示。使用Storybook的主题切换功能进行验证。

## 开发工作流程

### 1. 组件开发流程

1. 先编写组件的基本结构和功能
2. 添加Storybook故事展示不同状态
3. 编写快照测试验证渲染
4. 确保在不同主题下视觉表现一致
5. 提交代码并运行测试套件

### 2. 代码审查重点

- UI变更是否有相应的测试更新
- 是否遵循了设计系统的规范
- 组件是否在所有状态下都保持一致的视觉表现
- 是否影响了现有的视觉回归测试

## CI/CD 集成

将UI一致性检查集成到CI/CD流水线中，确保每次提交都经过严格的视觉验证。

### 1. GitHub Actions 配置示例

```yaml
name: UI Consistency Check

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run tests
        run: pnpm test
      
      - name: Build Storybook
        run: pnpm build-storybook
      
      - name: Publish to Chromatic
        uses: chromaui/action@v1
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          storybookBuildDir: .storybook-out
```

### 2. 质量门禁

- 所有快照测试必须通过
- 视觉回归测试的变化必须经过审查和接受
- 组件覆盖率目标：>90%

## 故障排除

### 常见问题

#### 快照测试失败

1. 检查是否是预期的UI变更
2. 如果是预期变更，运行 `pnpm test -- -u` 更新快照
3. 如果是意外变更，修复组件并重新运行测试

#### 视觉回归测试检测到变化

1. 在Chromatic平台上审查变化
2. 如果是预期变化，接受变更
3. 如果是意外变化，修复组件并重新提交

## 资源和工具

- [Jest 文档](https://jestjs.io/docs/getting-started)
- [React Testing Library 文档](https://testing-library.com/docs/react-testing-library/intro/)
- [Storybook 文档](https://storybook.js.org/docs/react/get-started/introduction)
- [Chromatic 文档](https://www.chromatic.com/docs/)

## 维护和更新

本指南应定期更新，以反映项目中UI一致性策略的变化和改进。团队成员可以提出建议，通过PR流程进行更新。

---

最后更新: 2024-10-15 👨‍💻