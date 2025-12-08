# 贡献指南

感谢您对星云操作系统项目的关注。本文档将帮助您了解如何为项目做出贡献。

## 行为准则

参与本项目即表示您同意遵守我们的行为准则：

- 尊重所有贡献者
- 接受建设性批评
- 关注对社区最有利的事情
- 对其他社区成员表现出同理心

## 如何贡献

### 报告 Bug

如果您发现了 Bug，请创建一个 Issue 并包含以下信息：

- Bug 的清晰描述
- 重现步骤
- 预期行为
- 实际行为
- 截图（如适用）
- 环境信息（浏览器、操作系统等）

### 提出新功能

如果您有新功能的想法：

1. 先检查是否已有相关 Issue
2. 创建新 Issue 描述功能需求
3. 说明功能的用途和价值
4. 等待维护者反馈

### 提交代码

#### 1. Fork 项目

点击项目页面的 "Fork" 按钮。

#### 2. 克隆仓库

\`\`\`bash
git clone https://github.com/your-username/nebula-system.git
cd nebula-system
\`\`\`

#### 3. 创建分支

\`\`\`bash
git checkout -b feature/your-feature-name
# 或
git checkout -b fix/your-bug-fix
\`\`\`

分支命名规范：
- `feature/` - 新功能
- `fix/` - Bug 修复
- `docs/` - 文档更新
- `refactor/` - 代码重构
- `test/` - 测试相关
- `chore/` - 构建/工具相关

#### 4. 安装依赖

\`\`\`bash
npm install
\`\`\`

#### 5. 进行更改

遵循项目的代码规范和最佳实践。

#### 6. 测试更改

\`\`\`bash
npm run dev
# 在浏览器中测试您的更改
\`\`\`

#### 7. 提交更改

\`\`\`bash
git add .
git commit -m "feat: 添加新功能描述"
\`\`\`

提交信息规范（遵循 Conventional Commits）：

- `feat:` - 新功能
- `fix:` - Bug 修复
- `docs:` - 文档更新
- `style:` - 代码格式（不影响代码运行）
- `refactor:` - 重构
- `test:` - 测试相关
- `chore:` - 构建过程或辅助工具的变动

#### 8. 推送到 GitHub

\`\`\`bash
git push origin feature/your-feature-name
\`\`\`

#### 9. 创建 Pull Request

1. 访问您的 Fork 仓库
2. 点击 "New Pull Request"
3. 填写 PR 描述
4. 等待审核

## 代码规范

### TypeScript

- 使用 TypeScript 严格模式
- 为所有函数添加类型注解
- 避免使用 `any` 类型
- 使用接口定义对象结构

\`\`\`typescript
// 好的示例
interface User {
  id: string
  name: string
  email: string
}

function getUser(id: string): User {
  // ...
}

// 避免
function getUser(id: any): any {
  // ...
}
\`\`\`

### React 组件

- 使用函数组件和 Hooks
- 组件名使用 PascalCase
- Props 使用 TypeScript 接口定义
- 使用 `useCallback` 和 `useMemo` 优化性能

\`\`\`typescript
// 好的示例
interface ButtonProps {
  label: string
  onClick: () => void
  disabled?: boolean
}

export function Button({ label, onClick, disabled = false }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  )
}
\`\`\`

### 样式

- 使用 Tailwind CSS 类名
- 遵循移动优先原则
- 使用语义化的类名组合
- 避免内联样式

\`\`\`tsx
// 好的示例
<div className="flex items-center justify-between p-4 bg-slate-900 rounded-lg">
  {/* 内容 */}
</div>

// 避免
<div style={{ display: 'flex', padding: '16px' }}>
  {/* 内容 */}
</div>
\`\`\`

### 文件组织

\`\`\`
components/
  ├── feature-name/
  │   ├── component-name.tsx
  │   ├── component-name.test.tsx
  │   └── index.ts
  └── ui/
      └── button.tsx
\`\`\`

## 测试

### 单元测试

使用 Jest 和 React Testing Library：

\`\`\`typescript
import { render, screen } from '@testing-library/react'
import { Button } from './button'

describe('Button', () => {
  it('renders with label', () => {
    render(<Button label="Click me" onClick={() => {}} />)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
})
\`\`\`

### 运行测试

\`\`\`bash
npm run test
npm run test:watch
npm run test:coverage
\`\`\`

## 文档

### 代码注释

为复杂逻辑添加注释：

\`\`\`typescript
/**
 * 计算用户权限等级
 * @param user - 用户对象
 * @param resource - 资源标识
 * @returns 权限等级 (0-5)
 */
function calculatePermissionLevel(user: User, resource: string): number {
  // 实现逻辑...
}
\`\`\`

### 更新文档

如果您的更改影响了用户使用方式，请更新相关文档：

- README.md
- API.md
- ARCHITECTURE.md

## Pull Request 检查清单

提交 PR 前请确认：

- [ ] 代码遵循项目规范
- [ ] 添加了必要的测试
- [ ] 所有测试通过
- [ ] 更新了相关文档
- [ ] 提交信息清晰明确
- [ ] 没有合并冲突
- [ ] 代码已经过自我审查

## 审核流程

1. 维护者会审查您的 PR
2. 可能会要求修改
3. 修改后重新审查
4. 通过后合并到主分支

## 获取帮助

如有问题，可以通过以下方式获取帮助：

- 创建 Issue 提问
- 加入社区讨论
- 查看项目文档
- 联系维护者

## 许可证

提交代码即表示您同意将代码以项目的 MIT 许可证发布。

---

再次感谢您的贡献！
