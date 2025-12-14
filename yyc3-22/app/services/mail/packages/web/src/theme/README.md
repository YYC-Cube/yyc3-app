# 主题系统文档

> **YYC³ 项目文档**
> 
> @project YYC³ Email Platform
> @type 项目说明
> @version 1.0.0
> @created 2025-12-08
> @updated 2025-12-08
> @author YYC³ <admin@0379.email>
> @url https://github.com/YY-Nexus/0379-email-platform


本文档详细介绍邮件平台的主题系统，包括主题配置、切换和使用方法。

## 主题系统概述

邮件平台采用了灵活的主题系统，支持亮色和暗色两种主题模式，提供统一的设计语言和样式规范。主题系统基于React Context实现，确保全局样式的一致性和可维护性。

## 主题组成

主题系统由以下部分组成：

1. **默认主题** (`defaultTheme.ts`) - 亮色主题配置
2. **暗黑主题** (`darkTheme.ts`) - 暗色主题配置
3. **主题上下文** (`ThemeContext.tsx`) - 提供主题管理和切换功能

## 主题配置详解

### 1. 主题结构

每个主题包含以下核心配置：

```typescript
interface Theme {
  name: string;
  mode: 'light' | 'dark';
  colors: {
    // 颜色配置
  };
  typography: {
    // 字体配置
  };
  spacing: {
    // 间距配置
  };
  borderRadius: {
    // 圆角配置
  };
  shadows: {
    // 阴影配置
  };
  transitions: {
    // 过渡动画配置
  };
  zIndex: {
    // 层级配置
  };
  breakpoints: {
    // 响应式断点配置
  };
  components: {
    // 组件特定配置
  };
}
```

### 2. 颜色系统

主题颜色系统包含以下几类颜色：

- **primary**: 主色调，用于主要操作和高亮显示
- **secondary**: 辅助色，用于次要操作和强调
- **success**: 成功状态颜色
- **warning**: 警告状态颜色
- **error**: 错误状态颜色
- **neutral**: 中性色，用于文本、背景等
- **background**: 背景色
- **surface**: 表面颜色，用于卡片、弹窗等
- **text**: 文本颜色
- **border**: 边框颜色

每种颜色都提供了从50到950的11个色调，用于构建层次分明的UI。

### 3. 排版系统

排版系统定义了字体、字号、行高和字重等配置，确保文本的一致性和可读性。

### 4. 间距系统

间距系统提供了统一的间距单位，用于组件内外边距、布局间距等，确保界面的呼吸感和视觉平衡。

## 主题使用方法

### 1. 在应用中集成主题

首先，在应用的根组件中包裹`ThemeProvider`：

```tsx
import { ThemeProvider } from '@/theme';
import AppContent from './AppContent';

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
```

### 2. 在组件中使用主题

使用`useTheme` hook获取当前主题：

```tsx
import { useTheme } from '@/theme';

function ThemedComponent() {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  
  return (
    <div style={{ color: theme.colors.text.primary, backgroundColor: theme.colors.background.DEFAULT }}>
      <p>当前主题模式: {isDarkMode ? '暗色' : '亮色'}</p>
      <button 
        onClick={toggleTheme}
        style={{
          backgroundColor: theme.colors.primary.DEFAULT,
          color: theme.colors.text.inverse,
          padding: theme.spacing.md,
          borderRadius: theme.borderRadius.md
        }}
      >
        切换主题
      </button>
    </div>
  );
}
```

### 3. 使用主题切换组件

`ThemeToggle`组件提供了一个简单的UI控件，用于切换主题：

```tsx
import { ThemeToggle } from '@/theme';

function Header() {
  return (
    <header className="flex justify-between items-center p-4">
      <h1>邮件平台</h1>
      <ThemeToggle />
    </header>
  );
}
```

### 4. 直接使用主题配置

你也可以直接导入主题配置对象，用于自定义组件或样式：

```tsx
import { defaultTheme, darkTheme } from '@/theme';

// 使用主题颜色
const primaryColor = defaultTheme.colors.primary.DEFAULT;
const darkPrimaryColor = darkTheme.colors.primary.DEFAULT;

// 使用主题间距
const spacingUnit = defaultTheme.spacing.md;
```

## 主题持久化

主题系统会自动将用户的主题偏好保存到浏览器的localStorage中，确保在页面刷新或重新访问时保持用户的主题选择。

```typescript
// 主题选择会自动保存到localStorage
localStorage.getItem('theme'); // 返回 'light' 或 'dark'
```

## 系统主题同步

主题系统默认会监听系统主题的变化，并在用户没有明确设置主题偏好时，自动同步系统主题：

```typescript
// 当系统主题变化时，若无保存的偏好，会自动更新应用主题
window.matchMedia('(prefers-color-scheme: dark)').matches;
```

## CSS类名支持

当主题切换时，会自动为HTML根元素添加或移除`dark`类，方便在CSS中使用：

```css
/* 亮色模式样式 */
.my-component {
  background-color: white;
  color: #111827;
}

/* 暗色模式样式 */
.dark .my-component {
  background-color: #111827;
  color: white;
}
```

## 自定义主题

如果你需要创建自定义主题，可以扩展现有主题或创建全新主题：

```typescript
// 创建自定义主题
import { defaultTheme } from '@/theme';

const customTheme = {
  ...defaultTheme,
  name: 'custom',
  colors: {
    ...defaultTheme.colors,
    primary: {
      ...defaultTheme.colors.primary,
      DEFAULT: '#06b6d4', // 自定义青色作为主色
    },
  },
};
```

## 最佳实践

1. **优先使用Context**: 尽可能通过`useTheme` hook获取主题，而不是硬编码颜色值
2. **保持一致性**: 所有组件都应遵循主题系统定义的颜色、间距和样式规范
3. **考虑可访问性**: 在设计主题时，确保文本和背景之间有足够的对比度
4. **渐进增强**: 确保在不同主题模式下，UI元素的可用性和可读性都能得到保证
5. **性能优化**: 避免频繁获取主题对象，可以在组件顶层使用`useTheme`并将需要的值缓存

## 响应式设计

主题系统包含响应式断点配置，可以用于构建适应不同屏幕尺寸的界面：

```typescript
import { useTheme } from '@/theme';

function ResponsiveComponent() {
  const { theme } = useTheme();
  
  // 使用主题断点配置
  const breakpoints = theme.breakpoints;
  
  return (
    <div className={`
      p-4
      md:p-6
      lg:p-8
    `}>
      响应式内容
    </div>
  );
}
```

---

© 2024 邮件平台主题系统 - 灵活、统一、可扩展的设计系统 🌹