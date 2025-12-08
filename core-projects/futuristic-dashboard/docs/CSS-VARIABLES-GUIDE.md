# CSS 变量系统使用指南

## 概述

本文档详细介绍了项目中的CSS变量系统，旨在确保所有UI组件在不同主题和状态下保持一致的视觉表现。遵循本指南可以帮助团队成员更有效地使用和维护CSS变量。

## 为什么使用CSS变量

1. **集中管理**: 所有设计决策集中在一处，便于维护和更新
2. **主题切换**: 轻松支持深色/浅色主题
3. **一致性**: 确保整个应用的视觉元素保持一致
4. **可维护性**: 更改设计令牌只需更新一个位置
5. **TypeScript支持**: 提供完整的类型定义，减少错误

## CSS变量结构

CSS变量分为以下几个主要类别：

### 1. 颜色系统

颜色变量定义了应用中使用的所有颜色值，包括：

- **主色调**: `--primary`, `--primary-foreground`
- **辅助色**: `--secondary`, `--secondary-foreground`
- **强调色**: `--accent`, `--accent-foreground`
- **破坏性/警告色**: `--destructive`, `--warning`, 及其文本颜色
- **中性色**: `--background`, `--foreground`, `--card`, `--border`等
- **状态色**: `--success`, `--error`, `--info`, 及其文本颜色

### 2. 字体系统

- **字体族**: `--font-sans`, `--font-mono`
- **字体大小**: `--text-xs` 到 `--text-7xl`
- **字重**: `--font-light`, `--font-normal`, `--font-medium`等
- **行高**: `--leading-none` 到 `--leading-loose`

### 3. 间距系统

基于4px网格系统的间距变量：

- `--spacing-0` (0px) 到 `--spacing-32` (128px)
- 常用内边距简写: `--padding-card`, `--padding-input`, `--padding-button`

### 4. 圆角系统

- `--radius-sm` 到 `--radius-3xl`
- `--radius-full` 用于完全圆形的元素

### 5. 阴影系统

- `--shadow-sm` 到 `--shadow-2xl`
- `--shadow-inner` 用于内阴影效果

### 6. 过渡系统

- **持续时间**: `--transition-duration-fast`/`normal`/`slow`
- **缓动函数**: `--transition-timing-ease-in-out` 等
- **预设过渡**: `--transition-all`, `--transition-colors` 等

### 7. 布局系统

- **容器宽度**: `--max-w-xs` 到 `--max-w-7xl`
- **断点**: `--breakpoint-sm` 到 `--breakpoint-2xl`

## 使用规范

### 基本用法

在CSS或Tailwind配置中使用CSS变量：

```css
/* CSS中使用 */
.button {
  background-color: var(--primary);
  color: var(--primary-foreground);
  padding: var(--padding-button);
  border-radius: var(--radius);
  font-size: var(--text-base);
  transition: var(--transition-all);
}

/* 在Tailwind配置中映射 */
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary)',
        'primary-foreground': 'var(--primary-foreground)',
      },
      spacing: {
        1: 'var(--spacing-1)',
        2: 'var(--spacing-2)',
        // 更多间距值...
      },
    },
  },
}
```

### 组件开发最佳实践

1. **总是使用变量**: 避免在组件中硬编码颜色、间距等值

   ✅ 推荐:
   ```tsx
   <div className="bg-card rounded-lg p-4 text-foreground">
     {/* 内容 */}
   </div>
   ```

   ❌ 避免:
   ```tsx
   <div className="bg-gray-800 rounded-lg p-4 text-white">
     {/* 内容 */}
   </div>
   ```

2. **主题适配**: 确保组件在深色和浅色主题下都能正常显示

   ```tsx
   // 组件会自动适配主题，无需额外逻辑
   const MyComponent = () => (
     <div className="bg-card text-foreground border border-border">
       {/* 内容 */}
     </div>
   );
   ```

3. **响应式设计**: 使用断点变量构建响应式布局

   ```tsx
   <div className="flex flex-col md:flex-row gap-4">
     {/* 移动设备垂直堆叠，中等屏幕及以上水平排列 */}
   </div>
   ```

4. **状态管理**: 使用语义化状态颜色

   ```tsx
   const StatusBadge = ({ status }: { status: 'success' | 'error' | 'warning' | 'info' }) => {
     const statusClasses = {
       success: 'bg-success text-success-foreground',
       error: 'bg-destructive text-destructive-foreground',
       warning: 'bg-warning text-warning-foreground',
       info: 'bg-info text-info-foreground',
     };
     
     return <span className={`px-2 py-1 rounded-full text-sm ${statusClasses[status]}`}>
       {status === 'success' && '成功'}
       {status === 'error' && '错误'}
       {status === 'warning' && '警告'}
       {status === 'info' && '信息'}
     </span>;
   };
   ```

### 主题切换注意事项

1. **避免硬编码背景色**: 总是使用`--background`或`--card`
2. **文本颜色**: 对应使用`--foreground`或`--card-foreground`
3. **过渡动画**: 使用`--transition-colors`确保颜色切换平滑

## Tailwind CSS 配置集成

在项目的`tailwind.config.ts`中集成CSS变量：

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary)',
        'primary-foreground': 'var(--primary-foreground)',
        secondary: 'var(--secondary)',
        'secondary-foreground': 'var(--secondary-foreground)',
        // 更多颜色...
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      // 映射其他CSS变量...
    },
  },
  plugins: [],
};

export default config;
```

## 扩展CSS变量系统

如需添加新的CSS变量，请遵循以下流程：

1. 在`lib/theme/css-variables.css`中添加新变量
2. 在`types/theme.ts`中添加相应的类型定义
3. 更新Tailwind配置以映射新变量（如果需要）
4. 更新本指南文档

## 调试技巧

1. **检查当前主题**: 使用浏览器开发者工具检查根元素的类名
2. **查看变量值**: 在开发者工具的Computed面板中查看CSS变量的实际值
3. **主题切换问题**: 确保没有内联样式覆盖CSS变量

## 常见问题

### 为什么我的组件在主题切换时没有正确更新？

- 检查是否使用了硬编码颜色值
- 确保组件在ThemeProvider内部渲染
- 验证CSS变量名称是否正确

### 如何在TypeScript中获取类型支持？

导入`types/theme.ts`中定义的类型：

```typescript
import { ThemeColors, ThemeMode } from '@/types/theme';

const myFunction = (mode: ThemeMode) => {
  // 使用类型定义
};
```

## 示例组件

以下是一个正确使用CSS变量的组件示例：

```tsx
import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export const Button = ({
  variant = 'primary',
  className,
  ...props
}: ButtonProps) => {
  // 使用CSS变量定义的样式映射
  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
};
```

---

通过严格遵循本指南，可以确保UI组件在整个应用中保持视觉一致性，并使主题切换和设计更新更加简单和安全。 🌹