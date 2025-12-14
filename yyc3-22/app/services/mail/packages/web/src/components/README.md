# 邮件平台 UI 组件库

> **YYC³ 项目文档**
> 
> @project YYC³ Email Platform
> @type 项目说明
> @version 1.0.0
> @created 2025-12-08
> @updated 2025-12-08
> @author YYC³ <admin@0379.email>
> @url https://github.com/YY-Nexus/0379-email-platform


## 介绍

这是一个专为邮件平台设计的UI组件库，提供了完整的基础UI组件和业务组件，支持主题切换和响应式设计。

## 组件分类

### 1. 基础UI组件 (`/components/common/`)

基础UI组件是构建应用的基础，这些组件不依赖于特定业务逻辑，可以在多个场景中复用。

#### 可用组件：

- **Button**: 按钮组件，支持多种变体和尺寸
- **Input**: 输入框组件，支持标签、错误信息等
- **Card**: 卡片组件，用于内容展示
- **Checkbox**: 复选框组件
- **IconButton**: 图标按钮组件

### 2. 业务组件 (`/components/mail/`)

业务组件是基于基础组件构建的，包含特定业务逻辑的组件，专为邮件平台定制。

#### 可用组件：

- **EmailListItem**: 邮件列表项组件
- **EmailList**: 邮件列表组件
- **EmailDetail**: 邮件详情组件
- **EmailComposer**: 邮件撰写组件

## 主题系统

组件库集成了完整的主题系统，支持亮色和暗色两种模式：

- **亮色主题**: 默认主题，适合明亮环境
- **暗色主题**: 降低眼睛疲劳，适合低光环境

主题切换通过 `ThemeProvider` 上下文实现，可以通过 `ThemeToggle` 组件或 `useTheme` hook 控制。

## 使用指南

### 基础UI组件使用

```tsx
import { Button, Input, Card } from '@/components/common';

// 使用按钮
<Button variant="primary" size="medium">点击我</Button>

// 使用输入框
<Input label="用户名" placeholder="请输入用户名" />

// 使用卡片
<Card title="卡片标题" description="卡片描述">
  <p>卡片内容</p>
</Card>
```

### 业务组件使用

```tsx
import { EmailList, EmailDetail, EmailComposer } from '@/components/mail';

// 使用邮件列表
<EmailList 
  emails={emailList} 
  onSelectEmail={handleSelectEmail} 
  onBatchDelete={handleBatchDelete} 
/>

// 使用邮件详情
<EmailDetail email={selectedEmail} />

// 使用邮件撰写
<EmailComposer 
  mode="new" 
  onSend={handleSendEmail} 
/>
```

### 主题使用

```tsx
import { ThemeProvider, ThemeToggle, useTheme } from '@/theme';

// 在应用根组件包裹 ThemeProvider
function App() {
  return (
    <ThemeProvider>
      <Layout>
        {/* 应用内容 */}
        <ThemeToggle />
      </Layout>
    </ThemeProvider>
  );
}

// 在组件中使用主题
function ThemedComponent() {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  
  return (
    <div style={{ color: theme.colors.text.primary }}>
      当前模式: {isDarkMode ? '暗色' : '亮色'}
      <button onClick={toggleTheme}>切换主题</button>
    </div>
  );
}
```

## 最佳实践

1. **组件化开发**: 将UI拆分为可复用的组件，避免重复代码
2. **主题一致性**: 使用主题系统的颜色和样式，保持UI一致性
3. **响应式设计**: 组件已内置响应式样式，在不同屏幕尺寸下都能良好显示
4. **性能优化**: 避免不必要的重渲染，合理使用React的memo等优化手段

## 维护和贡献

- 组件开发需遵循TypeScript规范和组件设计模式
- 新增组件需提供完整的类型定义和使用示例
- 组件样式应使用Tailwind CSS，并遵循统一的设计规范
- 组件应支持主题切换和响应式设计

## 版本信息

当前版本: 1.0.0

---

© 2024 邮件平台UI组件库 - 所有组件均支持主题切换和响应式设计 🌹