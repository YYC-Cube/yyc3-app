# YYC3 未来仪表盘 - 资产库

## 概述

本文档提供YYC3未来仪表盘项目中使用的所有资产资源的管理规范，包括图标、图片、字体和其他UI资源。遵循本指南可确保项目资源的一致性、可维护性和性能优化。

## 资产目录结构

所有项目资产按照以下目录结构组织：

```
public/
├── icons/          # SVG和其他格式图标
├── images/         # 图片资源
│   ├── avatars/    # 用户头像
│   ├── logos/      # 品牌Logo
│   └── backgrounds/# 背景图片
├── fonts/          # 自定义字体文件
└── assets/         # 其他资源
```

## 图标规范

### 图标类型

项目使用以下类型的图标：

1. **线性图标** - 主要用于界面导航和功能标识
2. **填充图标** - 用于强调状态和重要操作
3. **实心图标** - 用于按钮和工具栏

### 图标使用

所有图标都应该通过组件库提供的Icon组件使用：

```tsx
import { Icon } from '@/components/ui/icon';

// 基本用法
<Icon name="bell" size="20" />

// 带变体的图标
<Icon name="settings" size="24" variant="filled" />

// 自定义颜色
<Icon name="alert-circle" size="24" className="text-destructive" />
```

### 图标命名规范

图标文件名采用kebab-case格式，例如：

- `user-profile.svg`
- `notification-bell.svg`
- `settings-cog.svg`

## 图片规范

### 图片格式

- **PNG**: 用于需要透明背景的图片
- **JPG**: 用于照片和复杂图像
- **WebP**: 用于优化加载性能
- **SVG**: 用于可缩放的矢量图形

### 图片优化

1. **压缩**: 所有图片必须经过优化，减少文件大小
2. **响应式**: 提供不同尺寸的图片，适应不同设备
3. **懒加载**: 使用Next.js的Image组件实现图片懒加载

### 图片使用

使用Next.js的Image组件加载图片：

```tsx
import Image from 'next/image';

<Image
  src="/images/logos/yyc3-logo.svg"
  alt="YYC3 Logo"
  width={120}
  height={40}
  priority
/>
```

## 字体规范

### 字体家族

项目使用以下字体家族：

- **Inter**: 主要字体，用于界面文本和内容
- **Monaco/Fira Code**: 等宽字体，用于代码和技术文本

### 字体加载

字体通过CSS变量和`@font-face`规则加载：

```css
/* 在globals.css中 */
:root {
  --font-sans: Inter, system-ui, sans-serif;
  --font-mono: Monaco, 'Fira Code', monospace;
}
```

## 资源管理最佳实践

1. **版本控制**: 大型媒体资源不应直接提交到Git仓库，应使用CDN或其他存储解决方案
2. **命名一致性**: 使用清晰、一致的命名约定
3. **尺寸规范**: 为不同场景提供标准尺寸的资源
4. **文档化**: 记录新添加的重要资源

## 资源更新流程

1. **审核**: 新资源必须经过设计团队审核
2. **优化**: 资源必须经过适当的优化处理
3. **部署**: 更新到相应目录并提交代码
4. **通知**: 通知团队资源已更新

## 常见问题

### 如何添加新图标？

1. 将SVG文件添加到`public/icons/`目录
2. 更新图标组件映射
3. 更新文档

### 如何优化大型图片？

使用ImageOptim、TinyPNG等工具进行优化，然后转换为WebP格式。

---

遵循本指南，确保项目资产的一致性和性能。 🌹