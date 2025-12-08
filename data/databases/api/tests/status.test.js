/**
 * @file API状态端点测试
 * @description 测试/status路由的功能和响应
 * @author YYC
 */

// 先模拟redis模块
jest.mock('redis', () => {
  const mockClient = {
    connect: jest.fn().mockResolvedValue(),
    ping: jest.fn().mockResolvedValue('PONG'),
    on: jest.fn(),
    isOpen: false
  };
  return {
    createClient: jest.fn().mockReturnValue(mockClient)
  };
});

const request = require('supertest');
const redisService = require('../services/redis');

// 模拟redis服务的方法
jest.spyOn(redisService, 'init').mockResolvedValue();
jest.spyOn(redisService, 'ping').mockResolvedValue('PONG');

// 延迟导入app，确保所有模拟都已设置
const app = require('../index');

describe('API状态端点测试', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      // 重置ping的模拟行为
      jest.spyOn(redisService, 'ping').mockResolvedValue('PONG');
    });
    
    test('应该返回200 OK和Redis连接正常', async () => {
      const response = await request(app).get('/status');
      
      expect(response.status).toBe(200);
      expect(response.body.code).toBe(0);
      expect(response.body.message).toBe('success');
      expect(response.body.data.status).toBe('operational');
      expect(response.body.data.redis).toBe('ok');
      expect(response.body.data.timestamp).toBeDefined();
      expect(redisService.ping).toHaveBeenCalledTimes(1);
    });
    
    test('应该返回200当Redis连接失败但API本身可用', async () => {
      // 设置模拟行为：ping失败
      jest.spyOn(redisService, 'ping').mockRejectedValue(new Error('Not connected'));
      
      const response = await request(app).get('/status');
      
      expect(response.status).toBe(200); // API 本身应该保持可用
      expect(response.body.data.status).toBeDefined();
    });
    
    test('应该返回正确格式的时间戳', async () => {
      const response = await request(app).get('/status');
      
      // 验证时间戳是有效的ISO字符串
      const timestamp = new Date(response.body.data.timestamp);
      expect(isNaN(timestamp.getTime())).toBe(false);
    });
    
    test('应该返回有效的JSON响应', async () => {
      const response = await request(app).get('/status');
      
      expect(response.type).toBe('application/json');
      expect(response.body).toHaveProperty('code');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('redis');
      expect(response.body.data).toHaveProperty('timestamp');
    });
  });
