/**
 * @file 行业图标系统测试
 * @description 测试行业图标映射系统的功能和组件
 * @author YYC
 * @created 2024-10-15
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { IndustryIcon, getIndustryIcon } from './industry-icons';
import { IndustryType } from '@/types/industry';

describe('行业图标系统测试', () => {
  test('getIndustryIcon函数应返回对应行业的图标组件', () => {
    // 测试每个行业类型都有对应的图标
    Object.values(IndustryType).forEach(type => {
      const IconComponent = getIndustryIcon(type);
      expect(IconComponent).toBeDefined();
      expect(typeof IconComponent).toBe('function');
    });
  });

  test('IndustryIcon组件应正确渲染图标', () => {
    // 测试渲染不同行业的图标
    const { rerender } = render(
      <IndustryIcon type={IndustryType.TECHNOLOGY} className="test-icon" />
    );
    
    // 验证图标是否渲染（通过类名或其他属性）
    const iconElement = screen.getByTestId('industry-icon') || screen.getByRole('img');
    expect(iconElement).toBeInTheDocument();
    
    // 测试切换行业类型
    rerender(<IndustryIcon type={IndustryType.FINANCE} className="test-icon" />);
    
    // 验证图标是否更新
    const updatedIconElement = screen.getByTestId('industry-icon') || screen.getByRole('img');
    expect(updatedIconElement).toBeInTheDocument();
  });

  test('IndustryIcon组件应传递所有props给底层图标组件', () => {
    const testProps = {
      className: 'test-custom-class',
      size: 24,
      color: '#ff0000'
    };
    
    render(<IndustryIcon type={IndustryType.HEALTHCARE} {...testProps} />);
    
    const iconElement = screen.getByTestId('industry-icon') || screen.getByRole('img');
    expect(iconElement).toHaveClass('test-custom-class');
  });

  test('getIndustryIcon应返回默认图标当行业类型不存在映射时', () => {
    // 使用一个不存在的行业类型
    const unknownType = 'UNKNOWN_INDUSTRY' as any;
    const IconComponent = getIndustryIcon(unknownType);
    
    expect(IconComponent).toBeDefined();
    expect(typeof IconComponent).toBe('function');
  });

  test('行业图标映射应覆盖所有24个行业分类', () => {
    // 验证行业类型数量是否为24个
    const industryTypeCount = Object.values(IndustryType).filter(
      value => typeof value === 'string'
    ).length;
    
    expect(industryTypeCount).toBe(24);
    
    // 验证每个行业类型都有对应的图标
    Object.values(IndustryType).forEach(type => {
      if (typeof type === 'string') {
        const IconComponent = getIndustryIcon(type as IndustryType);
        expect(IconComponent).toBeDefined();
      }
    });
  });
});
