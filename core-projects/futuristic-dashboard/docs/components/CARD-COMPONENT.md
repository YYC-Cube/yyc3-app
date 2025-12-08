# Card 组件使用指南

## 概述

Card 组件是一个灵活的容器组件，用于组织和展示相关内容。它提供了一致的视觉风格和结构，帮助创建清晰的内容层次结构。

## 组件 API

### Card 主组件

**Props:**

| 属性名 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| `children` | `React.ReactNode` | 必填 | 卡片内容 |
| `className` | `string` | `undefined` | 自定义类名，会与默认类名合并 |
| `variant` | `'default' \| 'outline' \| 'elevated'` | `'default'` | 卡片变体样式 |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 卡片尺寸 |
| `as` | `React.ElementType` | `'div'` | 渲染的HTML标签或组件 |

### CardHeader 组件

**Props:**

| 属性名 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| `children` | `React.ReactNode` | 必填 | 头部内容 |
| `className` | `string` | `undefined` | 自定义类名 |
| `as` | `React.ElementType` | `'div'` | 渲染的HTML标签或组件 |

### CardTitle 组件

**Props:**

| 属性名 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| `children` | `React.ReactNode` | 必填 | 标题内容 |
| `className` | `string` | `undefined` | 自定义类名 |
| `as` | `React.ElementType` | `'h3'` | 渲染的HTML标签或组件 |
| `level` | `'h1' \| 'h2' \| 'h3' \| 'h4' \| 'h5' \| 'h6'` | `'h3'` | 标题级别，影响语义化标签 |

### CardDescription 组件

**Props:**

| 属性名 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| `children` | `React.ReactNode` | 必填 | 描述内容 |
| `className` | `string` | `undefined` | 自定义类名 |
| `as` | `React.ElementType` | `'p'` | 渲染的HTML标签或组件 |

### CardContent 组件

**Props:**

| 属性名 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| `children` | `React.ReactNode` | 必填 | 内容区域 |
| `className` | `string` | `undefined` | 自定义类名 |
| `as` | `React.ElementType` | `'div'` | 渲染的HTML标签或组件 |

### CardFooter 组件

**Props:**

| 属性名 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| `children` | `React.ReactNode` | 必填 | 页脚内容，通常是操作按钮 |
| `className` | `string` | `undefined` | 自定义类名 |
| `as` | `React.ElementType` | `'div'` | 渲染的HTML标签或组件 |
| `justify` | `'start' \| 'center' \| 'end' \| 'between'` | `'end'` | 内容对齐方式 |

## 基本用法

### 简单卡片

最基本的卡片结构，包含标题、描述和内容。

```tsx
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui';
import { Button } from '@/components/ui/button';

<Card>
  <CardHeader>
    <CardTitle>卡片标题</CardTitle>
    <CardDescription>卡片简短描述信息</CardDescription>
  </CardHeader>
  <CardContent>
    <p>这是卡片的主要内容区域。这里可以放置各种元素，如文本、表单、图表等。</p>
  </CardContent>
  <CardFooter>
    <Button>主要操作</Button>
    <Button variant="secondary">次要操作</Button>
  </CardFooter>
</Card>
```

### 仅内容卡片

只有内容区域的简化卡片。

```tsx
import { Card, CardContent } from '@/components/ui';

<Card>
  <CardContent>
    <p>这是一个只有内容区域的卡片，适用于简单的信息展示。</p>
  </CardContent>
</Card>
```

## 变体和样式

### 卡片变体

Card 组件提供多种视觉变体：

```tsx
import { Card, CardContent, CardTitle, CardHeader } from '@/components/ui';

// 默认变体
<Card>
  <CardHeader>
    <CardTitle>默认卡片</CardTitle>
  </CardHeader>
  <CardContent>
    <p>具有背景色和轻微阴影的标准卡片。</p>
  </CardContent>
</Card>

// 轮廓变体
<Card variant="outline">
  <CardHeader>
    <CardTitle>轮廓卡片</CardTitle>
  </CardHeader>
  <CardContent>
    <p>带有边框但没有明显背景色的卡片。</p>
  </CardContent>
</Card>

// 提升变体
<Card variant="elevated">
  <CardHeader>
    <CardTitle>提升卡片</CardTitle>
  </CardHeader>
  <CardContent>
    <p>带有更强阴影效果，视觉上更加突出的卡片。</p>
  </CardContent>
</Card>
```

### 卡片尺寸

控制卡片的内边距和尺寸：

```tsx
import { Card, CardContent, CardTitle, CardHeader } from '@/components/ui';

// 小尺寸
<Card size="sm">
  <CardHeader>
    <CardTitle>小卡片</CardTitle>
  </CardHeader>
  <CardContent>
    <p>内边距较小的卡片，适合空间有限的场景。</p>
  </CardContent>
</Card>

// 中等尺寸（默认）
<Card size="md">
  <CardHeader>
    <CardTitle>中等卡片</CardTitle>
  </CardHeader>
  <CardContent>
    <p>标准内边距的卡片。</p>
  </CardContent>
</Card>

// 大尺寸
<Card size="lg">
  <CardHeader>
    <CardTitle>大卡片</CardTitle>
  </CardHeader>
  <CardContent>
    <p>内边距较大的卡片，适合包含复杂内容。</p>
  </CardContent>
</Card>
```

### 自定义样式

通过 className 属性自定义卡片样式：

```tsx
import { Card, CardContent, CardTitle, CardHeader } from '@/components/ui';

<Card className="overflow-hidden rounded-xl">
  <div className="h-24 bg-gradient-to-r from-primary to-secondary" />
  <CardHeader>
    <CardTitle>自定义卡片</CardTitle>
  </CardHeader>
  <CardContent>
    <p>这个卡片有自定义的圆角和顶部渐变区域。</p>
  </CardContent>
</Card>
```

## 组合用法

### 卡片网格布局

创建响应式卡片网格：

```tsx
import { Card, CardContent, CardTitle, CardHeader } from '@/components/ui';

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card>
    <CardHeader>
      <CardTitle>卡片 1</CardTitle>
    </CardHeader>
    <CardContent>
      <p>这是网格中的第一个卡片。</p>
    </CardContent>
  </Card>
  
  <Card>
    <CardHeader>
      <CardTitle>卡片 2</CardTitle>
    </CardHeader>
    <CardContent>
      <p>这是网格中的第二个卡片。</p>
    </CardContent>
  </Card>
  
  <Card>
    <CardHeader>
      <CardTitle>卡片 3</CardTitle>
    </CardHeader>
    <CardContent>
      <p>这是网格中的第三个卡片。</p>
    </CardContent>
  </Card>
</div>
```

### 交互式卡片

添加悬停和点击效果：

```tsx
import { Card, CardContent, CardTitle, CardHeader } from '@/components/ui';

export const InteractiveCard = () => {
  return (
    <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer">
      <CardHeader>
        <CardTitle>交互式卡片</CardTitle>
      </CardHeader>
      <CardContent>
        <p>鼠标悬停时会有提升效果和阴影变化。</p>
      </CardContent>
    </Card>
  );
};
```

## 与 AnimatedCard 组件的关系

Card 组件是基础容器组件，而 AnimatedCard 组件是对 Card 的扩展，添加了进入动画和交互式效果。

### 何时使用哪种卡片

- **Card**: 当你需要一个简单的容器，不需要动画效果时
- **AnimatedCard**: 当你需要添加入场动画和交互式效果，以增强用户体验时

```tsx
// 简单卡片 - 使用 Card
<Card>
  <CardContent>
    <p>基础卡片内容</p>
  </CardContent>
</Card>

// 带动画的卡片 - 使用 AnimatedCard
import { AnimatedCard } from '@/components/ui/animated-card';

<AnimatedCard>
  <CardContent>
    <p>进入视口时会显示动画效果的卡片</p>
  </CardContent>
</AnimatedCard>
```

## 可访问性最佳实践

1. **语义化结构**: 使用正确的HTML结构，如使用`<h3>`作为卡片标题
2. **焦点状态**: 当卡片可点击时，确保有明显的焦点状态
3. **ARIA属性**: 对于复杂的卡片内容，可以添加适当的ARIA标签

```tsx
<Card 
  className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
  role="group"
  aria-label="产品信息卡片"
>
  {/* 卡片内容 */}
</Card>
```

## 主题适配

Card 组件完全支持深色/浅色主题切换，通过CSS变量自动适应：

- `--card` 控制背景色
- `--card-foreground` 控制文本颜色
- `--border` 控制边框颜色
- `--shadow` 控制阴影效果

## 常见问题

### 如何让卡片高度一致？

使用Tailwind的高度或最小高度类：

```tsx
<Card className="h-full">
  {/* 卡片内容 */}
</Card>
```

### 如何在卡片中添加图片？

```tsx
import { Card, CardContent, CardTitle, CardHeader } from '@/components/ui';
import Image from 'next/image';

<Card>
  <div className="relative h-48 overflow-hidden">
    <Image 
      src="/path/to/image.jpg" 
      alt="描述" 
      fill 
      className="object-cover" 
    />
  </div>
  <CardHeader>
    <CardTitle>带图片的卡片</CardTitle>
  </CardHeader>
  <CardContent>
    <p>卡片内容</p>
  </CardContent>
</Card>
```

---

通过灵活使用 Card 组件及其子组件，你可以创建各种信息展示卡片，保持UI的一致性和专业外观。 🌹