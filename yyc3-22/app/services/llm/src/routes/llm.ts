import express from 'express';
import { ZodError, z } from 'zod';
import { env } from '../config/env';
import { logDebug, logError, logInfo } from '../utils/logger';
import { getCache, setCache } from '../config/redis';

const router = express.Router();

// 请求验证模式
const chatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string().min(1),
  })),
  model: z.string().default(env.OPENAI_MODEL),
  temperature: z.number().min(0).max(1).default(env.OPENAI_TEMPERATURE),
  max_tokens: z.number().min(1).max(4096).default(env.OPENAI_MAX_TOKENS),
});

const completionRequestSchema = z.object({
  prompt: z.string().min(1),
  model: z.string().default(env.OPENAI_MODEL),
  temperature: z.number().min(0).max(1).default(env.OPENAI_TEMPERATURE),
  max_tokens: z.number().min(1).max(4096).default(env.OPENAI_MAX_TOKENS),
});

/**
 * 聊天接口
 */
router.post('/chat', async (req, res) => {
  try {
    // 验证请求
    const validatedData = chatRequestSchema.parse(req.body);
    logDebug('聊天请求验证通过', { messages: validatedData.messages.length, model: validatedData.model });

    // 生成缓存键
    const cacheKey = `chat:${JSON.stringify(validatedData)}`;

    // 检查缓存
    if (env.CACHE_ENABLED) {
      const cachedResponse = await getCache(cacheKey);
      if (cachedResponse) {
        logInfo('返回缓存的聊天响应');
        return res.json(cachedResponse);
      }
    }

    // 模拟生成响应（实际项目中这里会调用OpenAI API）
    const response = await generateMockChatResponse(validatedData);

    // 缓存响应
    if (env.CACHE_ENABLED) {
      await setCache(cacheKey, response);
    }

    logInfo('聊天响应生成成功');
    res.json(response);
  } catch (error) {
    if (error instanceof ZodError) {
      logError('聊天请求验证失败', { errors: error.errors });
      return res.status(400).json({ error: 'Invalid request', details: error.errors });
    }
    logError('聊天响应生成失败', { error });
    res.status(500).json({ error: 'Failed to generate chat response' });
  }
});

/**
 * 文本补全接口
 */
router.post('/completion', async (req, res) => {
  try {
    // 验证请求
    const validatedData = completionRequestSchema.parse(req.body);
    logDebug('补全请求验证通过', { promptLength: validatedData.prompt.length, model: validatedData.model });

    // 生成缓存键
    const cacheKey = `completion:${JSON.stringify(validatedData)}`;

    // 检查缓存
    if (env.CACHE_ENABLED) {
      const cachedResponse = await getCache(cacheKey);
      if (cachedResponse) {
        logInfo('返回缓存的补全响应');
        return res.json(cachedResponse);
      }
    }

    // 模拟生成响应（实际项目中这里会调用OpenAI API）
    const response = await generateMockCompletionResponse(validatedData);

    // 缓存响应
    if (env.CACHE_ENABLED) {
      await setCache(cacheKey, response);
    }

    logInfo('补全响应生成成功');
    res.json(response);
  } catch (error) {
    if (error instanceof ZodError) {
      logError('补全请求验证失败', { errors: error.errors });
      return res.status(400).json({ error: 'Invalid request', details: error.errors });
    }
    logError('补全响应生成失败', { error });
    res.status(500).json({ error: 'Failed to generate completion response' });
  }
});

/**
 * 模拟聊天响应生成
 */
async function generateMockChatResponse(request: any): Promise<any> {
  // 模拟延迟
  await new Promise(resolve => setTimeout(resolve, 500));

  // 生成模拟响应
  const lastMessage = request.messages[request.messages.length - 1].content;
  let responseContent = '';

  if (lastMessage.toLowerCase().includes('hello') || lastMessage.toLowerCase().includes('hi')) {
    responseContent = '你好！我是一个基于AI的聊天助手。有什么我可以帮助你的吗？';
  } else if (lastMessage.toLowerCase().includes('how are you')) {
    responseContent = '我很好，谢谢！我正在为用户提供帮助。';
  } else if (lastMessage.toLowerCase().includes('help')) {
    responseContent = '当然可以！我可以帮助你回答问题、提供信息、生成文本等。请告诉我你需要什么帮助。';
  } else {
    responseContent = `这是一个模拟的AI响应。你说："${lastMessage}"`;
  }

  return {
    id: `chatcmpl-${Date.now()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: request.model,
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: responseContent,
        },
        finish_reason: 'stop',
      },
    ],
    usage: {
      prompt_tokens: request.messages.reduce((acc: number, msg: any) => acc + msg.content.length, 0),
      completion_tokens: responseContent.length,
      total_tokens: request.messages.reduce((acc: number, msg: any) => acc + msg.content.length, 0) + responseContent.length,
    },
  };
}

/**
 * 模拟补全响应生成
 */
async function generateMockCompletionResponse(request: any): Promise<any> {
  // 模拟延迟
  await new Promise(resolve => setTimeout(resolve, 300));

  // 生成模拟响应
  const responseContent = `这是对提示 "${request.prompt}" 的补全内容。这是一个模拟的AI响应，展示了文本补全的功能。`;

  return {
    id: `cmpl-${Date.now()}`,
    object: 'text_completion',
    created: Math.floor(Date.now() / 1000),
    model: request.model,
    choices: [
      {
        index: 0,
        text: responseContent,
        finish_reason: 'stop',
      },
    ],
    usage: {
      prompt_tokens: request.prompt.length,
      completion_tokens: responseContent.length,
      total_tokens: request.prompt.length + responseContent.length,
    },
  };
}

export { router as llmRoutes };