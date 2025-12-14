/**
 * @file 工具函数单元测试
 * @description 测试项目中通用工具函数的正确性
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

// 导入需要测试的工具函数（假设存在的示例）
// import { formatDate, validateEmail, calculateHash } from '@/utils';

// 模拟工具函数用于测试
const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const calculateHash = (str: string): string => {
  let hash = 0;
  if (str.length === 0) return hash.toString();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
};

describe('工具函数测试', () => {
  describe('formatDate 函数', () => {
    it('应该正确格式化日期对象', () => {
      const date = new Date('2024-10-15T10:30:00Z');
      const result = formatDate(date);
      expect(result).toBe('2024-10-15');
    });

    it('应该正确格式化日期字符串', () => {
      const dateStr = '2024-10-15T10:30:00Z';
      const result = formatDate(dateStr);
      expect(result).toBe('2024-10-15');
    });

    it('应该处理无效日期', () => {
      const invalidDate = new Date('invalid-date');
      const result = formatDate(invalidDate);
      expect(result).toBe('Invalid Date');
    });
  });

  describe('validateEmail 函数', () => {
    it('应该验证有效的电子邮件地址', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@domain.co.uk')).toBe(true);
    });

    it('应该拒绝无效的电子邮件地址', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });

    it('应该处理边界情况', () => {
      expect(validateEmail('a@b.c')).toBe(true);
      expect(validateEmail('a@b.co')).toBe(true);
    });
  });

  describe('calculateHash 函数', () => {
    it('应该为相同的输入生成相同的哈希值', () => {
      const input = 'test-string';
      const hash1 = calculateHash(input);
      const hash2 = calculateHash(input);
      expect(hash1).toBe(hash2);
    });

    it('应该为不同的输入生成不同的哈希值', () => {
      const hash1 = calculateHash('string1');
      const hash2 = calculateHash('string2');
      expect(hash1).not.toBe(hash2);
    });

    it('应该处理空字符串', () => {
      const hash = calculateHash('');
      expect(hash).toBe('0');
    });

    it('应该处理长字符串', () => {
      const longStr = 'a'.repeat(1000);
      const hash = calculateHash(longStr);
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });
  });
});
