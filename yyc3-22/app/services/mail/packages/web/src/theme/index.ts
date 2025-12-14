/**
 * @file 主题模块索引
 * @description 统一导出所有主题相关组件和配置
 * @module theme
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

// 主题配置
import defaultTheme from './defaultTheme';
export type { Theme } from './defaultTheme';
export { defaultTheme };

// 主题上下文
export { 
  ThemeProvider, 
  useTheme, 
  ThemeToggle 
} from './ThemeContext';

// 重新导出默认主题作为默认导出
export default defaultTheme;
