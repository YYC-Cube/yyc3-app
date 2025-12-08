# 🎨 UI一致性速查手册

## 📋 快速参考指南

本速查手册提供YYC3未来感仪表盘UI一致性的核心规则和最佳实践，帮助开发者快速参考和遵循。

## 🔹 颜色使用规范

### ✅ 推荐做法

```tsx
// 使用主题颜色系统类
<div className="bg-primary-500 text-text-primary">主要内容</div>

// 状态颜色
<div className="bg-success-500">成功状态</div>
<div className="bg-error-500">错误状态</div>
<div className="bg-warning-500">警告状态</div>

// 透明度使用
<div className="bg-primary-500/80">80%透明度</div>
```

### ❌ 避免做法

```tsx
// 错误：硬编码颜色值
<div className="bg-[#4f46e5]">错误示例</div>

// 错误：不一致的颜色使用
<div className="bg-blue-500">不一致的蓝色</div>
```

## 🔹 间距规范

### ✅ 推荐做法

```tsx
// 使用一致的间距单位
<div className="p-4 m-2">内边距和外边距</div>

// 使用间距工具类
<div className="space-y-4">
  <div>元素1</div>
  <div>元素2</div>
</div>

<div className="flex gap-4">
  <div>子元素1</div>
  <div>子元素2</div>
</div>
```

### ❌ 避免做法

```tsx
// 错误：混合使用不同的间距单位
<div className="p-4 m-[10px]">混合间距</div>

// 错误：非标准间距值
<div className="p-[18px]">非标准间距</div>
```

## 🔹 字体规范

### ✅ 推荐做法

```tsx
// 标题样式
<h1 className="text-2xl font-bold">大标题</h1>
<h2 className="text-xl font-semibold">中标题</h2>

// 正文样式
<p className="text-base font-normal">正常正文</p>
<p className="text-sm text-text-secondary">次要文本</p>
```

### ❌ 避免做法

```tsx
// 错误：不一致的字重
<p className="font-medium">不一致的字重</p>

// 错误：自定义字号
<p className="text-[19px]">非标准字号</p>
```

## 🔹 组件使用规范

### ✅ 推荐做法

```tsx
// 正确导入组件
import { Button } from '@/components/ui/Button';

// 使用预定义变体
<Button variant="primary" size="lg">主要按钮</Button>

// 组合使用子组件
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

<Card>
  <CardHeader>
    <h3>卡片标题</h3>
  </CardHeader>
  <CardContent>
    <p>卡片内容</p>
  </CardContent>
</Card>
```

### ❌ 避免做法

```tsx
// 错误：直接使用内部组件
import Button from '@/components/ui/Button/Button';

// 错误：直接修改组件样式
<Button className="rounded-full">修改样式</Button>
```

## 🔹 类名合并最佳实践

```tsx
// 正确使用twMerge
import { twMerge } from 'tailwind-merge';

function CustomComponent({ className }) {
  return (
    <div className={twMerge('flex items-center', className)}>
      内容
    </div>
  );
}

// 结合cn函数使用
import { cn } from '@/lib/utils';

function AnotherComponent({ className }) {
  return (
    <div className={cn(
      'bg-surface-primary',
      'text-text-primary',
      className
    )}>
      内容
    </div>
  );
}
```

## 🔹 主题适配规范

```tsx
// 使用主题感知类
<div className="bg-surface-primary text-text-primary dark:bg-dark-surface-primary dark:text-dark-text-primary">
  自动适应主题
</div>

// 在CSS中使用变量
const styles = {
  backgroundColor: 'var(--surface-primary)',
  color: 'var(--text-primary)',
};
```

## 🔹 可访问性快速检查

### ✅ 推荐做法

```tsx
// 语义化HTML
<header>页头</header>
<main>主要内容</main>
<footer>页脚</footer>

// 表单标签关联
<div>
  <label htmlFor="username">用户名</label>
  <input id="username" type="text" />
</div>

// 焦点状态
<button className="focus:outline-none focus:ring-2 focus:ring-primary-500">
  可聚焦按钮
</button>
```

## 🔹 开发流程检查清单

- [ ] 使用了设计系统中的颜色变量
- [ ] 遵循了间距规范
- [ ] 使用了预定义的组件变体
- [ ] 正确使用了twMerge或cn进行类名合并
- [ ] 组件支持深色/浅色主题
- [ ] 编写了单元测试
- [ ] 创建了Storybook示例
- [ ] 文档已更新

## 🔹 常见问题修复

### 问题：组件在深色模式下不可见

```tsx
// 错误
<div className="bg-white text-black">
  只在浅色模式可见
</div>

// 修复
<div className="bg-surface-primary text-text-primary">
  自动适应深色模式
</div>
```

### 问题：间距不一致

```tsx
// 错误
<div>
  <div className="m-3">不一致</div>
  <div className="m-4">不一致</div>
</div>

// 修复
<div className="space-y-4">
  <div>一致间距</div>
  <div>一致间距</div>
</div>
```

## 🔹 工具函数参考

### 类名合并

```tsx
// 导入
import { twMerge } from 'tailwind-merge';
import { cn } from '@/lib/utils';

// 使用
const className = twMerge('base-class', conditionalClass);
const className = cn('base-class', 'another-class', conditionalClass);
```

### 测试辅助

```tsx
// 导入
import { renderWithTheme, expectToMatchConsistentSnapshot } from '@/tests/helpers/ui-test-helpers';

// 使用
const { container } = renderWithTheme(<MyComponent />);
expectToMatchConsistentSnapshot(<MyComponent />);
```

## 🔹 相关文档链接

- [CSS变量指南](/docs/CSS-VARIABLES-GUIDE.md)
- [组件库指南](/docs/COMPONENT-LIBRARY-GUIDE.md)
- [开发培训指南](/docs/DEVELOPER-TRAINING-GUIDE.md)
- [Card组件文档](/docs/components/CARD-COMPONENT.md)
- [AnimatedCard组件文档](/docs/components/ANIMATED-CARD-COMPONENT.md)

---

保持代码健康，稳步前行！ 🌹