# 接入 Grok CLI

> 使用 Grok CLI 接入智谱 GLM 模型的快速指南

Grok CLI 是一个简洁的命令行 AI 助手，可以快速接入智谱 GLM 模型进行对话和代码生成。

## 一、安装 Grok CLI

使用 npm 全局安装 Grok CLI：

```bash  theme={null}
npm install -g @vibe-kit/grok-cli
```

## 二、环境配置

设置 API 基础 URL 和 API Key：

```bash  theme={null}
export GROK_BASE_URL="https://open.bigmodel.cn/api/coding/paas/v4"
export GROK_API_KEY="your_bigmodel_api_key"
```

## 三、启动使用

使用指定模型启动 Grok CLI：

```bash  theme={null}
grok --model glm-4.6
```

![Description](https://cdn.bigmodel.cn/markdown/1753631674840gemini–4.png?attname=gemini–4.png)

## 注意事项

> **重要提示**：目前 Grok CLI 对 thinking 模型的兼容性有限，thinking 内容会被完整显示。建议：
>
> * 等待 Grok CLI 完善对 thinking 模型的兼容
> * 或使用非 thinking 版本的模型
