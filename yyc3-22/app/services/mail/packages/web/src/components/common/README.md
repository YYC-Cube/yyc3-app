# 基础 UI 组件库

> **YYC³ 项目文档**
> 
> @project YYC³ Email Platform
> @type 项目说明
> @version 1.0.0
> @created 2025-12-08
> @updated 2025-12-08
> @author YYC³ <admin@0379.email>
> @url https://github.com/YY-Nexus/0379-email-platform


本文档详细介绍基础UI组件库的使用方法和示例。

## 1. Button 按钮组件

### 组件说明
按钮组件是交互的基础元素，支持多种变体和尺寸。

### Props

| 属性名 | 类型 | 默认值 | 说明 |
|-------|------|-------|------|
| variant | `'primary' \| 'secondary' \| 'outline' \| 'text'` | `'primary'` | 按钮变体样式 |
| size | `'small' \| 'medium' \| 'large'` | `'medium'` | 按钮尺寸 |
| disabled | `boolean` | `false` | 是否禁用 |
| loading | `boolean` | `false` | 是否显示加载状态 |
| fullWidth | `boolean` | `false` | 是否占满父容器宽度 |
| icon | `React.ReactNode` | `undefined` | 左侧图标 |
| iconRight | `React.ReactNode` | `undefined` | 右侧图标 |
| onClick | `(e: React.MouseEvent<HTMLButtonElement>) => void` | `undefined` | 点击事件处理函数 |
| className | `string` | `''` | 自定义样式类名 |

### 使用示例

```tsx
import { Button } from '@/components/common';

// 基础按钮
<Button>主要按钮</Button>

// 次要按钮
<Button variant="secondary">次要按钮</Button>

// 轮廓按钮
<Button variant="outline">轮廓按钮</Button>

// 文本按钮
<Button variant="text">文本按钮</Button>

// 不同尺寸
<Button size="small">小按钮</Button>
<Button size="medium">中等按钮</Button>
<Button size="large">大按钮</Button>

// 带图标的按钮
<Button icon={<SearchIcon />}>搜索</Button>
<Button iconRight={<ArrowRightIcon />}>下一步</Button>

// 禁用状态
<Button disabled>禁用按钮</Button>

// 加载状态
<Button loading>加载中</Button>

// 占满宽度
<Button fullWidth>全宽按钮</Button>
```

## 2. Input 输入框组件

### 组件说明
输入框组件用于文本输入，支持标签、错误信息、图标等。

### Props

| 属性名 | 类型 | 默认值 | 说明 |
|-------|------|-------|------|
| id | `string` | `undefined` | 输入框ID |
| type | `string` | `'text'` | 输入框类型 |
| value | `string` | `''` | 输入框值 |
| onChange | `(e: React.ChangeEvent<HTMLInputElement>) => void` | `undefined` | 值改变事件处理函数 |
| placeholder | `string` | `''` | 占位文本 |
| label | `string` | `undefined` | 标签文本 |
| error | `string` | `undefined` | 错误信息 |
| disabled | `boolean` | `false` | 是否禁用 |
| required | `boolean` | `false` | 是否必填 |
| iconLeft | `React.ReactNode` | `undefined` | 左侧图标 |
| iconRight | `React.ReactNode` | `undefined` | 右侧图标 |
| className | `string` | `''` | 自定义样式类名 |

### 使用示例

```tsx
import { Input } from '@/components/common';

// 基础输入框
<Input placeholder="请输入内容" />

// 带标签的输入框
<Input label="用户名" placeholder="请输入用户名" />

// 带图标的输入框
<Input 
  placeholder="搜索" 
  iconLeft={<SearchIcon />} 
/>

// 带错误信息的输入框
<Input 
  placeholder="请输入内容" 
  error="输入内容不能为空" 
/>

// 禁用状态
<Input 
  placeholder="请输入内容" 
  disabled 
/>

// 必填输入框
<Input 
  label="邮箱" 
  placeholder="请输入邮箱" 
  required 
/>

// 受控组件
<Input 
  value={inputValue} 
  onChange={(e) => setInputValue(e.target.value)} 
  placeholder="受控输入框" 
/>
```

## 3. Card 卡片组件

### 组件说明
卡片组件用于内容展示，包含标题、描述和底部等区域。

### Props

| 属性名 | 类型 | 默认值 | 说明 |
|-------|------|-------|------|
| title | `string` | `undefined` | 卡片标题 |
| description | `string` | `undefined` | 卡片描述 |
| children | `React.ReactNode` | `undefined` | 卡片内容 |
| footer | `React.ReactNode` | `undefined` | 卡片底部内容 |
| className | `string` | `''` | 自定义样式类名 |
| elevation | `'none' \| 'sm' \| 'md' \| 'lg'` | `'sm'` | 阴影级别 |
| bordered | `boolean` | `false` | 是否显示边框 |

### 使用示例

```tsx
import { Card } from '@/components/common';

// 基础卡片
<Card>
  <p>卡片内容</p>
</Card>

// 带标题和描述的卡片
<Card 
  title="卡片标题" 
  description="这是一个卡片描述" 
>
  <p>卡片内容</p>
</Card>

// 带底部的卡片
<Card 
  title="卡片标题" 
  footer={<Button>操作按钮</Button>} 
>
  <p>卡片内容</p>
</Card>

// 不同阴影级别的卡片
<Card elevation="none">无阴影</Card>
<Card elevation="sm">小阴影</Card>
<Card elevation="md">中阴影</Card>
<Card elevation="lg">大阴影</Card>

// 带边框的卡片
<Card bordered>
  <p>带边框的卡片</p>
</Card>
```

## 4. Checkbox 复选框组件

### 组件说明
复选框组件用于选择操作，支持选中、未选中和半选中状态。

### Props

| 属性名 | 类型 | 默认值 | 说明 |
|-------|------|-------|------|
| id | `string` | `undefined` | 复选框ID |
| checked | `boolean \| 'indeterminate'` | `false` | 选中状态 |
| onChange | `(checked: boolean) => void` | `undefined` | 状态改变事件处理函数 |
| label | `string` | `undefined` | 标签文本 |
| disabled | `boolean` | `false` | 是否禁用 |
| className | `string` | `''` | 自定义样式类名 |

### 使用示例

```tsx
import { Checkbox } from '@/components/common';

// 基础复选框
<Checkbox label="选项1" />

// 选中状态
<Checkbox checked label="已选中" />

// 半选中状态
<Checkbox checked="indeterminate" label="半选中" />

// 禁用状态
<Checkbox disabled label="禁用选项" />

// 受控组件
<Checkbox 
  checked={isChecked} 
  onChange={(checked) => setIsChecked(checked)} 
  label="受控复选框" 
/>

// 无标签
<Checkbox onChange={(checked) => console.log(checked)} />
```

## 5. IconButton 图标按钮组件

### 组件说明
图标按钮组件用于图标操作，支持多种变体和尺寸。

### Props

| 属性名 | 类型 | 默认值 | 说明 |
|-------|------|-------|------|
| icon | `React.ReactNode` | 必填 | 图标元素 |
| variant | `'default' \| 'secondary' \| 'outline' \| 'ghost'` | `'default'` | 按钮变体样式 |
| size | `'small' \| 'medium' \| 'large'` | `'medium'` | 按钮尺寸 |
| disabled | `boolean` | `false` | 是否禁用 |
| loading | `boolean` | `false` | 是否显示加载状态 |
| onClick | `(e: React.MouseEvent<HTMLButtonElement>) => void` | `undefined` | 点击事件处理函数 |
| className | `string` | `''` | 自定义样式类名 |
| ariaLabel | `string` | `undefined` | 无障碍标签 |

### 使用示例

```tsx
import { IconButton } from '@/components/common';
import { SearchIcon, EditIcon, DeleteIcon } from '@/icons';

// 基础图标按钮
<IconButton 
  icon={<SearchIcon />} 
  ariaLabel="搜索" 
/>

// 不同变体
<IconButton 
  icon={<EditIcon />} 
  variant="secondary" 
  ariaLabel="编辑" 
/>
<IconButton 
  icon={<EditIcon />} 
  variant="outline" 
  ariaLabel="编辑" 
/>
<IconButton 
  icon={<EditIcon />} 
  variant="ghost" 
  ariaLabel="编辑" 
/>

// 不同尺寸
<IconButton 
  icon={<SearchIcon />} 
  size="small" 
  ariaLabel="搜索" 
/>
<IconButton 
  icon={<SearchIcon />} 
  size="medium" 
  ariaLabel="搜索" 
/>
<IconButton 
  icon={<SearchIcon />} 
  size="large" 
  ariaLabel="搜索" 
/>

// 禁用状态
<IconButton 
  icon={<DeleteIcon />} 
  disabled 
  ariaLabel="删除" 
/>

// 加载状态
<IconButton 
  icon={<SearchIcon />} 
  loading 
  ariaLabel="搜索" 
/>
```

## 主题支持

所有基础UI组件都支持主题切换，会根据当前主题自动调整颜色和样式。组件样式使用Tailwind CSS类名构建，确保与主题系统的无缝集成。

## 响应式设计

组件内置了响应式样式，在不同屏幕尺寸下都能良好显示，无需额外配置。

---

© 2024 基础UI组件库 - 所有组件均支持主题切换和响应式设计 🌹