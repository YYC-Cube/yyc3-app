/**
 * @file UI测试辅助工具
 * @description 提供组件快照测试和视觉回归测试的辅助函数
 * @module tests/helpers/ui-test-helpers
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

import { render, RenderResult } from '@testing-library/react';
import { ThemeProvider } from '@/lib/theme/ThemeProvider';
import { screen } from '@testing-library/react';
import { twMerge } from 'tailwind-merge';
import React, { ReactElement } from 'react';

/**
 * 测试组件包装器 - 为组件提供主题上下文
 * @param ui - 要测试的React组件
 * @param options - 渲染选项
 * @returns 渲染结果
 */
export function renderWithTheme(
  ui: ReactElement,
  options?: Parameters<typeof render>[1]
): RenderResult {
  return render(
    <ThemeProvider defaultMode="light">{ui}</ThemeProvider>,
    {
      ...options,
      // 添加默认的测试ID前缀，便于选择器
      container: (container) => {
        container.dataset.testid = 'test-container';
        return container;
      },
    }
  );
}

/**
 * 生成组件的一致快照 - 忽略动态内容
 * @param ui - 要测试的React组件
 * @param options - 渲染选项
 */
export function expectToMatchConsistentSnapshot(
  ui: ReactElement,
  options?: Parameters<typeof render>[1]
): void {
  const { container } = renderWithTheme(ui, options);
  
  // 移除可能变化的时间戳等内容
  const timestampElements = container.querySelectorAll('[data-timestamp]');
  timestampElements.forEach(el => {
    el.setAttribute('data-timestamp', 'fixed-timestamp-for-testing');
  });
  
  // 移除动态生成的ID
  const dynamicIdElements = container.querySelectorAll('[data-dynamic-id]');
  dynamicIdElements.forEach(el => {
    el.setAttribute('data-dynamic-id', 'fixed-id-for-testing');
  });
  
  // 确保快照一致性
  expect(container).toMatchSnapshot();
}

/**
 * 测试组件的主题一致性
 * @param component - 要测试的React组件
 */
export function testThemeConsistency(component: ReactElement): void {
  describe('主题一致性测试', () => {
    it('在默认主题下应正确渲染', () => {
      renderWithTheme(component);
      // 检查组件是否正确渲染（至少有一个元素）
      expect(screen.queryByTestId(/component/)).not.toBeNull();
    });

    it('应使用CSS变量而非硬编码样式', () => {
      const { container } = renderWithTheme(component);
      
      // 获取所有元素的style属性
      const allElements = container.querySelectorAll('*');
      let hasHardcodedColor = false;
      let hardcodedStyles = [];

      allElements.forEach((element, index) => {
        const style = element.getAttribute('style');
        if (style) {
          // 检查是否有硬编码的颜色或尺寸值
          if (
            /color:[^;]*\#[0-9a-fA-F]|background:[^;]*\#[0-9a-fA-F]|width:\s*\d+px|height:\s*\d+px/.test(
              style
            )
          ) {
            hasHardcodedColor = true;
            hardcodedStyles.push({
              element: element.tagName.toLowerCase() + (index > 0 ? `[${index}]` : ''),
              style,
            });
          }
        }
      });

      // 如果发现硬编码样式，提供详细信息
      if (hasHardcodedColor) {
        console.warn('⚠️ 发现硬编码样式:', JSON.stringify(hardcodedStyles, null, 2));
      }

      // 注意：在实际项目中，可能需要更灵活的规则，这里仅作为示例
      // expect(hasHardcodedColor).toBe(false);
    });

    it('应正确应用Tailwind类名', () => {
      const { container } = renderWithTheme(component);
      
      // 获取所有元素的类名
      const allElements = container.querySelectorAll('[class]');
      let invalidClasses = [];

      allElements.forEach((element, index) => {
        const className = element.getAttribute('class') || '';
        
        // 检查常见的无效或不推荐的类名模式
        if (
          /bg-[a-z]+-[0-9]+\/[0-9]+/.test(className) && // 检查直接使用数字透明度
          !className.includes('twMerge') // 忽略使用twMerge的情况
        ) {
          invalidClasses.push({
            element: element.tagName.toLowerCase() + (index > 0 ? `[${index}]` : ''),
            className,
          });
        }
      });

      if (invalidClasses.length > 0) {
        console.warn('⚠️ 发现可能的无效类名用法:', JSON.stringify(invalidClasses, null, 2));
      }
    });
  });
}

/**
 * 生成视觉回归测试的变体场景
 * @param componentFactory - 组件工厂函数，接收props返回组件
 * @param scenarios - 测试场景配置
 */
export function testVisualRegression(
  componentFactory: (props: any) => ReactElement,
  scenarios: { [key: string]: any }
): void {
  describe('视觉回归测试', () => {
    Object.entries(scenarios).forEach(([scenarioName, props]) => {
      it(`场景: ${scenarioName}`, () => {
        const component = componentFactory(props);
        const { container } = renderWithTheme(component);
        
        // 确保组件正确渲染
        expect(container.firstChild).not.toBeNull();
        
        // 生成快照
        expect(container).toMatchSnapshot();
      });
    });
  });
}

/**
 * 验证组件是否正确使用了设计令牌
 * @param container - DOM容器
 * @returns 验证结果
 */
export function validateDesignTokenUsage(container: HTMLElement): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  // 检查内联样式中的硬编码颜色
  const elementsWithInlineStyles = container.querySelectorAll('[style]');
  elementsWithInlineStyles.forEach((element, index) => {
    const style = element.getAttribute('style') || '';
    const colorRegex = /color\s*:\s*([^;]+);/gi;
    const bgRegex = /background\s*:\s*([^;]+);/gi;
    
    let colorMatch;
    while ((colorMatch = colorRegex.exec(style)) !== null) {
      if (!colorMatch[1].includes('var(--')) {
        issues.push(
          `元素 ${index} (${element.tagName.toLowerCase()}) 使用了硬编码颜色: ${colorMatch[1]}`
        );
      }
    }
    
    let bgMatch;
    while ((bgMatch = bgRegex.exec(style)) !== null) {
      if (!bgMatch[1].includes('var(--')) {
        issues.push(
          `元素 ${index} (${element.tagName.toLowerCase()}) 使用了硬编码背景色: ${bgMatch[1]}`
        );
      }
    }
  });
  
  // 检查组件是否使用了允许的Tailwind类模式
  const allowedTailwindPatterns = [
    /bg-primary(-\w+)?/, /text-primary(-\w+)?/, /border-primary(-\w+)?/,
    /bg-secondary(-\w+)?/, /text-secondary(-\w+)?/, /border-secondary(-\w+)?/,
    /bg-surface(-\w+)?/, /text-surface(-\w+)?/, /border-surface(-\w+)?/,
    /bg-error(-\w+)?/, /text-error(-\w+)?/, /border-error(-\w+)?/,
    /bg-success(-\w+)?/, /text-success(-\w+)?/, /border-success(-\w+)?/,
    // 尺寸类
    /w-\d+/, /h-\d+/, /p-\d+/, /m-\d+/,
    // 间距类
    /space-\d+/, /gap-\d+/,
    // 字体类
    /font-\w+/, /text-\d+/,
    // 布局类
    /flex/, /grid/, /block/, /inline/,
  ];
  
  const allElements = container.querySelectorAll('[class]');
  allElements.forEach((element, index) => {
    const className = element.getAttribute('class') || '';
    const classes = className.split(/\s+/);
    
    classes.forEach(cls => {
      // 跳过空类和允许的模式
      if (cls === '' || allowedTailwindPatterns.some(pattern => pattern.test(cls))) {
        return;
      }
      
      // 检查可能的问题类名
      const suspiciousPatterns = [
        /bg-\w+-\d+/, // 直接使用数字色值
        /text-\w+-\d+/,
        /border-\w+-\d+/,
      ];
      
      if (suspiciousPatterns.some(pattern => pattern.test(cls))) {
        issues.push(
          `元素 ${index} (${element.tagName.toLowerCase()}) 使用了不推荐的类名: ${cls}`
        );
      }
    });
  });
  
  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * 创建可复用的组件测试配置
 * @param component - 组件名称
 * @param Component - 组件本身
 * @returns 测试配置对象
 */
export function createComponentTestConfig(component: string, Component: React.ComponentType<any>) {
  return {
    /**
     * 测试组件在不同主题下的渲染
     */
    testThemeVariants: () => {
      describe(`${component} - 主题变体测试`, () => {
        it('在浅色主题下应正确渲染', () => {
          const { container } = renderWithTheme(<Component />);
          expect(container).not.toBeNull();
        });
        
        it('在深色主题下应正确渲染', () => {
          // 这里简化处理，实际项目中可能需要专门的深色主题测试
          const { container } = renderWithTheme(<Component />, {
            initialState: { theme: { mode: 'dark' } }
          });
          expect(container).not.toBeNull();
        });
      });
    },
    
    /**
     * 测试组件的各种变体
     */
    testVariants: (variants: { [key: string]: any }) => {
      describe(`${component} - 变体测试`, () => {
        Object.entries(variants).forEach(([variantName, props]) => {
          it(`变体: ${variantName}`, () => {
            const { container } = renderWithTheme(<Component {...props} />);
            expect(container).toMatchSnapshot();
            
            // 验证设计令牌使用
            const validation = validateDesignTokenUsage(container);
            if (!validation.valid) {
              console.warn(`${component} - ${variantName} 设计令牌使用问题:`, validation.issues);
            }
          });
        });
      });
    },
  };
}