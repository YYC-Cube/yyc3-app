/**
 * @file Card组件测试文件
 * @description 测试Card组件的渲染、快照和交互行为
 * @author YYC
 * @created 2024-10-15
 */

import { render, screen } from '@testing-library/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';

describe('Card组件', () => {
  // 快照测试 - 确保UI结构不变
  it('should match snapshot with all components', () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Card Content</p>
        </CardContent>
        <CardFooter>
          <button>Action</button>
        </CardFooter>
      </Card>
    );
    expect(container).toMatchSnapshot();
  });

  // 渲染测试 - 确保正确渲染子组件
  it('should render all card sections correctly', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
          <CardDescription>Test Description</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Test Content</p>
        </CardContent>
        <CardFooter>
          <span>Test Footer</span>
        </CardFooter>
      </Card>
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
    expect(screen.getByText('Test Footer')).toBeInTheDocument();
  });

  // 类名传递测试 - 确保自定义类名被正确应用
  it('should apply custom className correctly', () => {
    const { container } = render(
      <Card className="custom-card-class">
        <CardContent className="custom-content-class">
          <p>Content</p>
        </CardContent>
      </Card>
    );

    const card = container.querySelector('.custom-card-class');
    const content = container.querySelector('.custom-content-class');

    expect(card).toBeInTheDocument();
    expect(content).toBeInTheDocument();
  });

  // 可访问性测试 - 确保组件符合基本的可访问性标准
  it('should have proper accessibility attributes', () => {
    const { container } = render(
      <Card aria-label="Test Card">
        <CardContent>
          <p>Accessible Content</p>
        </CardContent>
      </Card>
    );

    const card = container.querySelector('[aria-label="Test Card"]');
    expect(card).toBeInTheDocument();
  });

  // 空状态测试 - 确保组件在无内容时仍然渲染正确
  it('should render correctly when empty', () => {
    const { container } = render(<Card />);
    expect(container.firstChild).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('border');
  });
});