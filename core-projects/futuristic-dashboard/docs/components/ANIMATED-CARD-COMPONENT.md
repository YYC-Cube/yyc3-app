# AnimatedCard 组件使用指南

## 概述

AnimatedCard 组件是对基础 Card 组件的扩展，添加了入场动画和交互式效果，用于提升用户体验和吸引注意力。它利用 Framer Motion 实现流畅的动画效果，适用于各种需要动态展示的场景。

## 组件 API

### AnimatedCard 组件

**Props:**

| 属性名 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| `children` | `React.ReactNode` | 必填 | 卡片内容 |
| `className` | `string` | `undefined` | 自定义类名，会与默认类名合并 |
| `variant` | `'fadeInUp' \| 'scaleIn' \| 'slideInLeft' \| 'slideInRight' \| 'custom'` | `'fadeInUp'` | 入场动画变体 |
| `delay` | `number` | `0` | 动画延迟时间（秒） |
| `duration` | `number` | `0.5` | 动画持续时间（秒） |
| `hoverLift` | `boolean` | `true` | 是否启用悬停提升效果 |
| `clickScale` | `boolean` | `true` | 是否启用点击缩放效果 |
| `initialOpacity` | `number` | `0` | 初始透明度 |
| `initialY` | `number` | `20` | 初始Y轴偏移（仅用于fadeInUp和slide变体） |
| `initialScale` | `number` | `0.95` | 初始缩放比例（仅用于scaleIn变体） |
| `customVariants` | `any` | `undefined` | 自定义Framer Motion变体 |
| `as` | `React.ElementType` | `Card` | 基础卡片组件 |

### 继承的 Card Props

AnimatedCard 继承了基础 Card 组件的所有 props：

| 属性名 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 卡片尺寸 |
| `cardVariant` | `'default' \| 'outline' \| 'elevated'` | `'default'` | 卡片样式变体（注意：使用cardVariant区分动画variant） |

## 基本用法

### 基础动画卡片

最简单的使用方式，使用默认的淡入上升动画效果。

```tsx
import { AnimatedCard } from '@/components/ui/animated-card';
import { CardContent } from '@/components/ui';

<AnimatedCard>
  <CardContent>
    <h3>动画卡片标题</h3>
    <p>这是一张带有入场动画的卡片。当卡片进入视口时，会自动播放动画。</p>
  </CardContent>
</AnimatedCard>
```

### 完整结构的动画卡片

结合所有卡片子组件，创建完整的卡片结构。

```tsx
import { AnimatedCard } from '@/components/ui/animated-card';
import { CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui';
import { Button } from '@/components/ui/button';

<AnimatedCard>
  <CardHeader>
    <CardTitle>完整动画卡片</CardTitle>
  </CardHeader>
  <CardContent>
    <p>带有完整结构的动画卡片，包含标题、内容和操作按钮。</p>
  </CardContent>
  <CardFooter>
    <Button>操作按钮</Button>
  </CardFooter>
</AnimatedCard>
```

## 动画变体

AnimatedCard 提供多种预设动画效果，可以通过 `variant` prop 进行选择。

### 淡入上升（默认）

```tsx
<AnimatedCard variant="fadeInUp">
  <CardContent>
    <p>淡入并向上移动的动画效果。</p>
  </CardContent>
</AnimatedCard>
```

### 缩放入场

```tsx
<AnimatedCard variant="scaleIn">
  <CardContent>
    <p>从小放大的入场动画效果。</p>
  </CardContent>
</AnimatedCard>
```

### 从左侧滑入

```tsx
<AnimatedCard variant="slideInLeft">
  <CardContent>
    <p>从左侧滑入的动画效果。</p>
  </CardContent>
</AnimatedCard>
```

### 从右侧滑入

```tsx
<AnimatedCard variant="slideInRight">
  <CardContent>
    <p>从右侧滑入的动画效果。</p>
  </CardContent>
</AnimatedCard>
```

### 自定义动画

通过 `customVariants` prop 提供自定义的 Framer Motion 变体。

```tsx
import { AnimatedCard } from '@/components/ui/animated-card';
import { CardContent } from '@/components/ui';

const customAnimation = {
  hidden: { opacity: 0, rotate: -5 },
  visible: { 
    opacity: 1, 
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 100
    }
  }
};

<AnimatedCard variant="custom" customVariants={customAnimation}>
  <CardContent>
    <p>自定义旋转入场动画效果。</p>
  </CardContent>
</AnimatedCard>
```

## 动画控制

### 延迟动画

通过 `delay` prop 设置动画开始的延迟时间。

```tsx
// 延迟0.3秒执行动画
<AnimatedCard delay={0.3}>
  <CardContent>
    <p>延迟0.3秒后才开始动画。</p>
  </CardContent>
</AnimatedCard>
```

### 动画持续时间

通过 `duration` prop 控制动画的持续时间。

```tsx
// 动画持续1秒
<AnimatedCard duration={1}>
  <CardContent>
    <p>这个动画会持续1秒钟。</p>
  </CardContent>
</AnimatedCard>
```

### 交互式效果

AnimatedCard 默认包含两种交互效果：悬停提升和点击缩放。

```tsx
// 启用悬停提升效果（默认开启）
<AnimatedCard hoverLift={true}>
  <CardContent>
    <p>鼠标悬停时会有轻微的上升效果。</p>
  </CardContent>
</AnimatedCard>

// 禁用点击缩放效果
<AnimatedCard clickScale={false}>
  <CardContent>
    <p>点击时不会有缩放效果。</p>
  </CardContent>
</AnimatedCard>
```

## 高级用法

### 卡片列表的错开动画

为多个卡片设置不同的延迟，创建错开的入场效果。

```tsx
import { AnimatedCard } from '@/components/ui/animated-card';
import { CardContent, CardTitle } from '@/components/ui';

const cardData = [
  { id: 1, title: '卡片 1', content: '这是第一个卡片的内容' },
  { id: 2, title: '卡片 2', content: '这是第二个卡片的内容' },
  { id: 3, title: '卡片 3', content: '这是第三个卡片的内容' },
];

<div className="space-y-4">
  {cardData.map((card, index) => (
    <AnimatedCard 
      key={card.id} 
      delay={index * 0.1} // 每个卡片延迟0.1秒
      className="w-full"
    >
      <CardContent className="pt-6">
        <CardTitle>{card.title}</CardTitle>
        <p>{card.content}</p>
      </CardContent>
    </AnimatedCard>
  ))}
</div>
```

### 卡片网格的动画布局

在网格布局中使用动画卡片，创建动态的内容展示。

```tsx
import { AnimatedCard } from '@/components/ui/animated-card';
import { CardContent, CardTitle } from '@/components/ui';

const items = Array.from({ length: 6 }, (_, i) => ({ 
  id: i + 1, 
  title: `项目 ${i + 1}` 
}));

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map((item, index) => (
    <AnimatedCard 
      key={item.id} 
      // 计算网格位置的延迟，创建瀑布流动画效果
      delay={(Math.floor(index / 3) * 0.1) + ((index % 3) * 0.05)}
      variant="scaleIn"
    >
      <CardContent className="pt-6 text-center">
        <CardTitle>{item.title}</CardTitle>
      </CardContent>
    </AnimatedCard>
  ))}
</div>
```

### 自定义卡片样式

结合 Tailwind CSS 和自定义类名，创建具有特殊样式的动画卡片。

```tsx
import { AnimatedCard } from '@/components/ui/animated-card';
import { CardContent, CardTitle } from '@/components/ui';

<AnimatedCard 
  className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border-none shadow-xl"
  variant="fadeInUp"
  duration={0.6}
>
  <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-2xl" />
  <CardContent className="relative z-10 pt-6 text-center text-white">
    <CardTitle className="text-white">特色卡片</CardTitle>
    <p className="text-slate-300">带渐变背景和装饰效果的动画卡片</p>
  </CardContent>
</AnimatedCard>
```

## 性能优化

### 视口检测

AnimatedCard 使用 Framer Motion 的视口检测功能，只有当卡片进入可视区域时才会触发动画，避免不必要的渲染。

### 减少动画复杂度

对于大量卡片列表，建议：
1. 使用较简单的动画变体（如 `fadeInUp` 而非复杂的自定义动画）
2. 适当增加延迟间隔，避免所有动画同时执行
3. 对于非关键卡片，可以考虑禁用某些交互效果

```tsx
// 大量卡片列表的优化方案
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
  {largeDataSet.map((item, index) => (
    <AnimatedCard 
      key={item.id} 
      delay={index * 0.02} // 较小的延迟间隔
      variant="fadeInUp" // 简单的动画变体
      hoverLift={false} // 禁用悬停效果以提高性能
      size="sm"
    >
      <CardContent className="pt-4">
        <p>{item.name}</p>
      </CardContent>
    </AnimatedCard>
  ))}
</div>
```

## 可访问性

### 键盘导航

当动画卡片包含可交互元素时，请确保：
1. 交互元素可以通过键盘访问
2. 焦点状态有明显的视觉指示
3. 动画效果不会干扰键盘用户的体验

```tsx
import { AnimatedCard } from '@/components/ui/animated-card';
import { CardContent } from '@/components/ui';
import { Button } from '@/components/ui/button';

<AnimatedCard>
  <CardContent>
    <p>带可访问按钮的卡片</p>
    <Button className="mt-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
      可访问的按钮
    </Button>
  </CardContent>
</AnimatedCard>
```

### 减少动画

为了支持 prefers-reduced-motion 设置，可以添加自定义逻辑：

```tsx
import { useEffect, useState } from 'react';
import { AnimatedCard } from '@/components/ui/animated-card';

const AccessibleAnimatedCard = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <AnimatedCard 
      // 如果用户偏好减少动画，则设置为最小动画
      duration={prefersReducedMotion ? 0.01 : 0.5}
      initialOpacity={prefersReducedMotion ? 1 : 0}
      initialY={prefersReducedMotion ? 0 : 20}
    >
      <CardContent>
        <p>响应减少动画偏好设置的卡片</p>
      </CardContent>
    </AnimatedCard>
  );
};
```

## 常见问题

### 动画没有触发怎么办？

1. 检查组件是否正确导入
2. 确保组件在视口范围内（可以通过滚动页面来触发）
3. 验证是否有其他CSS属性覆盖了动画效果

### 如何让卡片在页面加载时就立即动画，而不是等滚动到视图？

可以修改组件或创建一个变体来实现这一效果：

```tsx
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui';

const ImmediateAnimatedCard = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    }}
    className={className}
  >
    <Card>
      <CardContent>{children}</CardContent>
    </Card>
  </motion.div>
);
```

### 如何在卡片点击时触发自定义动画？

```tsx
import { useState } from 'react';
import { AnimatedCard } from '@/components/ui/animated-card';
import { CardContent } from '@/components/ui';
import { motion } from 'framer-motion';

const ClickableAnimatedCard = () => {
  const [clicked, setClicked] = useState(false);

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={() => setClicked(!clicked)}
    >
      <AnimatedCard clickScale={false}> {/* 禁用默认点击效果 */}
        <CardContent>
          <motion.div
            animate={{ 
              backgroundColor: clicked ? 'var(--primary/10)' : 'transparent',
              padding: clicked ? '8px' : '0'
            }}
            transition={{ duration: 0.3 }}
          >
            <p>点击触发自定义动画效果</p>
          </motion.div>
        </CardContent>
      </AnimatedCard>
    </motion.div>
  );
};
```

---

AnimatedCard 组件为您的界面增添了生动的交互体验，通过精心设计的动画效果，可以有效引导用户注意力并增强内容的视觉层次感。合理使用动画可以提升整体用户体验，但请注意不要过度使用，以免分散用户对核心内容的注意力。 🌹