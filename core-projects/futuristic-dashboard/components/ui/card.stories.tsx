/**
 * @file Card组件Storybook故事文件
 * @description 为Card组件创建可复用的故事，用于视觉回归测试
 * @author YYC
 * @created 2024-10-15
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';

// 定义组件元数据
const meta = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    // 视觉回归测试的重要参数
    chromatic: {
      // 捕获不同状态的快照
      diffThreshold: 0.2, // 可接受的像素差异阈值
    },
  },
  tags: ['autodocs'],
  // 定义argTypes用于交互控制
  argTypes: {
    className: {
      description: '自定义CSS类名',
      control: 'text',
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

// 基础故事 - 展示完整卡片结构
export const Basic: Story = {
  args: {},
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>卡片标题</CardTitle>
        <CardDescription>这是一个卡片描述</CardDescription>
      </CardHeader>
      <CardContent>
        <p>卡片内容区域，用于展示详细信息或交互元素。</p>
      </CardContent>
      <CardFooter>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md">
          主要操作
        </button>
        <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md ml-2">
          次要操作
        </button>
      </CardFooter>
    </Card>
  ),
};

// 仅含内容的卡片
export const ContentOnly: Story = {
  args: {},
  render: (args) => (
    <Card {...args}>
      <CardContent>
        <p>只有内容的卡片，适用于简单信息展示。</p>
        <ul className="mt-2 space-y-1">
          <li>• 列表项 1</li>
          <li>• 列表项 2</li>
          <li>• 列表项 3</li>
        </ul>
      </CardContent>
    </Card>
  ),
};

// 带标题的卡片
export const WithTitle: Story = {
  args: {},
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>重要通知</CardTitle>
        <CardDescription>请查看以下信息并采取相应措施</CardDescription>
      </CardHeader>
      <CardContent>
        <p>这里是通知的详细内容，可能包含重要的警告信息或操作提示。</p>
      </CardContent>
    </Card>
  ),
};

// 自定义样式卡片 - 测试不同主题下的视觉效果
export const CustomStyled: Story = {
  args: {
    className: 'border-primary/50 bg-accent/50 shadow-md',
  },
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>自定义样式卡片</CardTitle>
      </CardHeader>
      <CardContent>
        <p>这个卡片使用了自定义的样式类，展示了如何扩展默认样式。</p>
      </CardContent>
    </Card>
  ),
};

// 响应式卡片 - 测试不同屏幕尺寸下的表现
export const Responsive: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
      viewports: {
        mobile: { name: 'Mobile', styles: { width: '375px', height: '667px' } },
        tablet: { name: 'Tablet', styles: { width: '768px', height: '1024px' } },
        desktop: { name: 'Desktop', styles: { width: '1280px', height: '720px' } },
      },
    },
  },
  args: {},
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>响应式卡片</CardTitle>
      </CardHeader>
      <CardContent>
        <p>这个卡片在不同屏幕尺寸下应保持一致的视觉表现。</p>
      </CardContent>
    </Card>
  ),
};