# YYC3 未来仪表盘组件库使用指南

## 概述

本文档提供了YYC3未来仪表盘项目中组件库的完整使用指南。通过遵循本指南，开发团队可以确保一致、高效地使用UI组件，维护统一的视觉体验，并减少重复代码。

## 组件库架构

组件库采用原子设计方法论，按照以下层次结构组织：

1. **基础原子组件**: 最小的UI构建块（按钮、输入框、标签等）
2. **分子组件**: 由多个原子组件组合而成的简单功能单元
3. **组织组件**: 更复杂的UI单元，通常包含多个分子组件
4. **模板**: 页面布局和结构模式
5. **页面**: 完整的页面实现

## 安装与配置

### 项目依赖

组件库依赖以下核心技术：

- React 18+
- Next.js 14+
- TypeScript 5+
- Tailwind CSS 3.3+
- Framer Motion 10+（用于动画效果）

### 导入组件

所有组件都使用统一的导入路径：

```typescript
// 导入原子组件
import { Button, Input, Card } from '@/components/ui';

// 导入特定功能组件
import { DataTable } from '@/components/data-table';

// 导入钩子和工具
import { cn } from '@/lib/utils';
```

## 组件使用规范

### 命名约定

- **组件名称**: 使用PascalCase（如`AnimatedCard`）
- **Props接口**: 使用组件名称+Props（如`AnimatedCardProps`）
- **自定义Hook**: 使用`use`前缀（如`useTheme`）

### 样式应用

所有组件都应使用`cn`工具函数组合类名，确保Tailwind类名正确合并：

```typescript
import { cn } from '@/lib/utils';

const MyComponent = ({ className }: { className?: string }) => (
  <div className={cn(
    'bg-card rounded-md p-4 border border-border', // 基础样式
    className // 允许用户覆盖或添加样式
  )}>
    组件内容
  </div>
);
```

### 主题适配

组件必须支持深色/浅色主题切换，使用CSS变量而非硬编码样式：

```typescript
// 正确做法 - 使用语义化CSS变量
<div className="bg-card text-foreground border border-border">
  自适应主题的内容
</div>

// 错误做法 - 硬编码颜色
<div className="bg-gray-800 text-white border border-gray-700">
  只适用于深色模式的内容
</div>
```

### 可访问性

所有组件都必须满足WCAG 2.1 AA级别的可访问性标准：

1. **语义化HTML**: 使用正确的HTML元素（如`<button>`而非`<div>`）
2. **ARIA属性**: 为复杂交互提供适当的ARIA标签
3. **键盘导航**: 确保所有交互元素可通过键盘访问
4. **颜色对比度**: 文本与背景的对比度至少为4.5:1

## 核心组件使用指南

### Button组件

用于用户交互的按钮元素，支持多种变体和尺寸。

**基本用法**:

```tsx
import { Button } from '@/components/ui';

// 基础按钮
<Button>点击我</Button>

// 主要按钮（默认）
<Button variant="primary">主要操作</Button>

// 次要按钮
<Button variant="secondary">次要操作</Button>

// 警告/危险按钮
<Button variant="destructive">删除</Button>

// 禁用状态
<Button disabled>已禁用</Button>

// 自定义大小
<Button size="sm">小按钮</Button>
<Button size="lg">大按钮</Button>
```

### Card组件

容器组件，用于包裹相关内容，提供视觉分组。

**基本用法**:

```tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui';

<Card>
  <CardHeader>
    <CardTitle>卡片标题</CardTitle>
    <CardDescription>卡片描述文本</CardDescription>
  </CardHeader>
  <CardContent>
    <p>卡片内容区域</p>
  </CardContent>
</Card>
```

### Input组件

表单输入组件，支持各种输入类型和状态。

**基本用法**:

```tsx
import { Input } from '@/components/ui';

// 基础输入框
<Input placeholder="请输入..." />

// 带标签的输入框
<div>
  <label htmlFor="username">用户名</label>
  <Input id="username" placeholder="请输入用户名" />
</div>

// 错误状态
<Input placeholder="请输入..." className="border-destructive" />
```

### DataTable组件

用于显示表格数据的组件，支持排序、过滤和分页。

**基本用法**:

```tsx
import { DataTable, DataTableColumn, DataTableHeader, DataTableRow } from '@/components/ui';

const data = [
  { id: 1, name: '张三', email: 'zhangsan@example.com' },
  { id: 2, name: '李四', email: 'lisi@example.com' },
];

<DataTable>
  <DataTableHeader>
    <DataTableColumn>ID</DataTableColumn>
    <DataTableColumn>姓名</DataTableColumn>
    <DataTableColumn>邮箱</DataTableColumn>
  </DataTableHeader>
  <tbody>
    {data.map((item) => (
      <DataTableRow key={item.id}>
        <td>{item.id}</td>
        <td>{item.name}</td>
        <td>{item.email}</td>
      </DataTableRow>
    ))}
  </tbody>
</DataTable>
```

## 动画与交互组件

### AnimatedCard组件

具有动画效果的卡片组件，在进入视口时显示动画。

**基本用法**:

```tsx
import { AnimatedCard } from '@/components/ui/animated-card';

<AnimatedCard>
  <p>带有动画效果的卡片内容</p>
</AnimatedCard>

// 自定义动画变体
<AnimatedCard variant="scaleIn">
  <p>使用缩放动画的卡片</p>
</AnimatedCard>

// 自定义延迟
<AnimatedCard delay={0.2}>
  <p>延迟0.2秒的卡片</p>
</AnimatedCard>
```

## 工具函数

### cn函数

用于合并Tailwind类名的工具函数，避免类名冲突。

**用法**:

```typescript
import { cn } from '@/lib/utils';

const classes = cn(
  'bg-card text-foreground',
  isActive && 'ring-2 ring-primary',
  className // 外部传入的类名
);
```

### 动画工具

组件库提供了多种预设动画效果，可在`@/lib/animations.ts`中找到：

```typescript
import { fadeInUp, scaleIn, pulseAnimation } from '@/lib/animations';

// 在组件中使用
const MyAnimatedComponent = () => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={fadeInUp}
  >
    动画内容
  </motion.div>
);
```

## 组件开发工作流程

### 创建新组件

1. 在`components/ui/`目录下创建新的组件文件
2. 定义组件Props接口（使用TypeScript）
3. 实现组件逻辑和UI
4. 添加适当的类型注释和文档注释
5. 编写组件测试（在`*.test.tsx`文件中）
6. 创建Storybook故事（在`*.stories.tsx`文件中）

### 组件测试

所有组件都必须编写测试，确保功能正常和视觉一致性：

```typescript
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('应该正确渲染文本内容', () => {
    render(<Button>测试按钮</Button>);
    expect(screen.getByText('测试按钮')).toBeInTheDocument();
  });
  
  it('应该应用正确的变体类名', () => {
    const { container } = render(<Button variant="secondary" />);
    const button = container.querySelector('button');
    expect(button).toHaveClass('bg-secondary');
  });
});
```

## 组件文档规范

所有组件都必须有完整的文档，包括：

1. **组件用途**: 简要描述组件的功能和使用场景
2. **Props说明**: 列出所有Props及其类型、默认值和用途
3. **示例代码**: 提供常见用法的代码示例
4. **可访问性说明**: 提供组件的可访问性特性
5. **主题支持**: 说明组件如何响应主题变化

## 最佳实践

1. **优先使用现有组件**: 避免重复开发已有功能的组件
2. **保持组件单一职责**: 每个组件只负责一个明确的功能
3. **遵循设计系统**: 严格使用CSS变量和设计令牌
4. **注重性能**: 避免不必要的渲染和复杂计算
5. **全面测试**: 确保组件在各种状态和环境下都能正常工作

## 故障排除

### 组件不响应主题变化

- 检查是否在ThemeProvider内渲染组件
- 确认使用了正确的CSS变量名称
- 检查是否有内联样式覆盖了CSS变量

### 动画效果不工作

- 确保导入了正确的动画变体
- 检查Framer Motion配置是否正确
- 验证组件的初始和动画状态设置

### 组件测试失败

- 检查组件Props是否正确传递
- 确认测试环境配置正确
- 验证模拟的依赖项是否正确

## 贡献指南

1. **组件设计**: 遵循原子设计原则和设计系统规范
2. **代码规范**: 遵循项目的TypeScript和ESLint规则
3. **文档更新**: 添加组件时同步更新文档
4. **测试覆盖**: 提供全面的测试用例

---

通过严格遵循本指南，我们可以共同维护一个高质量、一致且易于使用的组件库，为YYC3未来仪表盘项目提供强大的UI支持。 🌹