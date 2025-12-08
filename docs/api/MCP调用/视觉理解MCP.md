# 视觉理解 MCP

<Info>
  视觉理解 MCP Server 是一个基于模型上下文协议 (Model Context Protocol) 的 Z.AI GLM–4.5V 能力实现，为 Claude Code, Cline 等兼容 MCP 的客户端提供智谱的强大能力，包括图像分析、视频理解等功能。
</Info>

**NPM 包地址**: [@z\_ai/mcp–server](https://www.npmjs.com/package/@z_ai/mcp–server) \
**前提条件**: [Node.js >= v18.0.0](https://nodejs.org/en/download/)

## 产品简介

<Tip>
  此拥有视觉能力的 Local MCP Server 是智谱为 **GLM Coding Plan PRO 及以上等级用户开发的专属 Server**, 让您的 Code Agent 拥有眼睛，视觉理解。
</Tip>

<Note>
  除了 Claude Code 之外，直接在客户端粘贴图片无法调用此 MCP Server，客户端默认会将图片转码后直接调用模型接口。\
  最佳实践是将图片放到本地目录，通过对话的方式指定图片名称或路径来调用 Mcp Server。\
  例如: `What does demo.png describe?`
</Note>

## 功能特性

<CardGroup cols={3}>
  <Card title="图像分析" icon={<svg style={{maskImage: "url(/resource/icon/image.svg)",
maskRepeat: "no–repeat",
maskPosition: "center center",}} className={"h–6 w–6 bg–primary dark:bg–primary–light !m–0 shrink–0"}/>}>
    支持多种图像格式的智能分析和内容理解，让您的 AI Agent 拥有视觉
  </Card>

  <Card title="视频理解" icon={<svg style={{maskImage: "url(/resource/icon/video.svg)",
maskRepeat: "no–repeat",
maskPosition: "center center",}} className={"h–6 w–6 bg–primary dark:bg–primary–light !m–0 shrink–0"}/>}>
    支持本地视频与远端视频的视觉理解
  </Card>

  <Card title="简单集成" icon={<svg style={{maskImage: "url(/resource/icon/plug.svg)",
maskRepeat: "no–repeat",
maskPosition: "center center",}} className={"h–6 w–6 bg–primary dark:bg–primary–light !m–0 shrink–0"}/>}>
    一键安装，快速集成到 Claude Code 等 MCP 兼容客户端
  </Card>
</CardGroup>

## 支持的工具

该服务器实现了模型上下文协议，可与任何兼容 MCP 的客户端一起使用。目前提供以下工具：

* **`image_analysis`** - 分析图像并提供详细描述，支持多种图像格式
* **`video_analysis`** - 分析视频并提供详细描述，支持多种视频格式

## 环境变量配置

### 详细配置说明

| 环境变量           | 说明         | 默认值     | 可选值             |
| :------------- | :--------- | :------ | :-------------- |
| `Z_AI_API_KEY` | 智谱 API KEY | 必需配置    | 您的API密钥         |
| `Z_AI_MODE`    | 服务平台选择     | `ZHIPU` | `ZHIPU` 或 `ZAI` |

### 平台配置

<Tabs>
  <Tab title="智谱开放平台 (Bigmodel)">
    获取 API Key： [智谱开放平台](https://open.bigmodel.cn/usercenter/apikeys)

    ```bash  theme={null}
    Z_AI_MODE=ZHIPU
    Z_AI_API_KEY=your_zhipu_api_key
    ```
  </Tab>
</Tabs>

## 安装与使用

### 快速开始

<Steps>
  <Step title="获取 API Key">
    前往 [智谱开放平台](https://open.bigmodel.cn/usercenter/apikeys) 获取您的 API Key
  </Step>

  <Step title="安装 MCP 服务器">
    前提条件：您需要安装 [Node.js 18 或更新版本](https://nodejs.org/en/download/) \
    根据您使用的客户端选择相应的安装方式
  </Step>

  <Step title="配置环境变量">
    设置必要的环境变量，包括 API Key 和平台选择
  </Step>
</Steps>

### 支持的客户端

<Tabs>
  <Tab title="Claude Code">
    **方式一：一键安装命令**

    注意替换里面的 `your_api_key` 为您上一步获取到的 API Key

    ```bash  theme={null}
    claude mcp add -s user zai-mcp-server --env Z_AI_API_KEY=your_api_key -- npx -y "@z_ai/mcp-server"
    ```

    若您忘记替换 API Key，重新执行安装命令前需要先卸载旧的此 MCP Server：

    ```bash  theme={null}
    claude mcp list
    claude mcp remove zai-mcp-server
    ```

    **方式二：手动配置**

    编辑 Claude Code 的配置文件, 位于用户目录下 `.claude.json` 的 MCP 部分：\
    注意替换里面的 `your_api_key` 为您上一步获取到的 API Key

    ```json  theme={null}
    {
      "mcpServers": {
        "zai-mcp-server": {
          "type": "stdio",
          "command": "npx",
          "args": [
            "-y",
            "@z_ai/mcp-server"
          ],
          "env": {
            "Z_AI_API_KEY": "your_api_key",
            "Z_AI_MODE": "ZHIPU"
          }
        }
      }
    }
    ```
  </Tab>

  <Tab title="Cline (VS Code)">
    在 Cline 扩展设置中添加 MCP 服务器配置：

    注意替换里面的 `your_api_key` 为您上一步获取到的 API Key

    ```json  theme={null}
    {
      "mcpServers": {
        "zai-mcp-server": {
          "type": "stdio",
          "command": "npx",
          "args": [
            "-y",
            "@z_ai/mcp-server"
          ],
          "env": {
            "Z_AI_API_KEY": "your_api_key",
            "Z_AI_MODE": "ZHIPU"
          }
        }
      }
    }
    ```
  </Tab>

  <Tab title="OpenCode">
    在 OpenCode 设置中添加 MCP 服务器配置：

    参考 [OpenCode MCP 文档](https://opencode.ai/docs/mcp–servers)

    注意替换里面的 `your_api_key` 为您上一步获取到的 API Key

    ```json  theme={null}
    {
        "$schema": "https://opencode.ai/config.json",
        "mcp": {
            "zai-mcp-server": {
                "type": "local",
                "command": ["npx","-y","@z_ai/mcp-server"],
                "environment": {
                    "Z_AI_API_KEY": "your_api_key",
                    "Z_AI_MODE": "ZHIPU"
                }
            }
        }
    }
    ```
  </Tab>

  <Tab title="Crush">
    在 Crush 设置中添加 MCP 服务器配置：

    注意替换里面的 `your_api_key` 为您上一步获取到的 API Key

    ```json  theme={null}
    {
        "$schema": "https://charm.land/crush.json",
        "mcp": {
            "zai-mcp-server": {
                "type": "stdio",
                "command": "npx",
                "args": [
                    "-y",
                    "@z_ai/mcp-server"
                ],
                "env": {
                    "Z_AI_API_KEY": "your_api_key",
                    "Z_AI_MODE": "ZHIPU"
                }
            }
        }
    }
    ```
  </Tab>

  <Tab title="Roo Code, Kilo Code 等其它">
    对于 Roo Code, Kilo Code 等其它支持 MCP 协议的客户端，参考以下通用配置：

    注意替换里面的 `your_api_key` 为您上一步获取到的 API Key

    ```json  theme={null}
    {
      "mcpServers": {
        "zai-mcp-server": {
          "type": "stdio",
          "command": "npx",
          "args": [
            "-y",
            "@z_ai/mcp-server"
          ],
          "env": {
            "Z_AI_API_KEY": "your_api_key",
            "Z_AI_MODE": "ZHIPU"
          }
        }
      }
    }
    ```
  </Tab>
</Tabs>

## 使用示例

<Note>
  除了 Claude Code 之外，直接在客户端粘贴图片无法调用此 MCP Server，客户端默认会将图片转码后直接调用模型接口。\
  最佳实践是将图片放到本地目录，通过对话的方式指定图片名称或路径来调用 Mcp Server。\
  例如: `What does demo.png describe?`
</Note>

通过上一步将视觉MCP服务器安装到客户端后，您就可以在自己的Coding客户端通过对话的方式直接使用MCP了。\
比如下面在 Claude Code 中，对话输入 `hi describe this xx.png`，MCP Server 会处理图片并返回描述结果。(前置条件是您的当前目录下有该图片)

![Description](https://cdn.bigmodel.cn/markdown/1760501186683image.png?attname=image.png)
![code](https://cdn.bigmodel.cn/markdown/1757345118471code.jpg?attname=code.jpg)

## 故障排除

在本地命令行直接执行下面的命令，验证其是否能安装到本地，用于排查是否是环境，权限等问题：

<CodeGroup>
  ```bash Linux/macOS theme={null}
  Z_AI_API_KEY=your_api_key npx -y @z_ai/mcp-server
  ```

  ```cmd Windows Cmd theme={null}
  set Z_AI_API_KEY=your_api_key && npx -y @z_ai/mcp-server
  ```

  ```powershell Windows PowerShell theme={null}
  $env:Z_AI_API_KEY="your_api_key"; npx -y @z_ai/mcp-server
  ```
</CodeGroup>

* 若安装成功，则表示环境正确，问题可能在客户端配置上，请检查客户端的 MCP 配置。
* 若安装失败，请根据错误信息进行排查，建议将错误信息粘贴给大模型进行分析解决。

其它常见问题：

<AccordionGroup>
  <Accordion title="连接失败">
    **问题：** MCP 服务器连接失败

    **解决方案：**

    1. 检查本地是否存在 Node.js 18 或更新版本
    2. `node -v` 和 `npx -v` 查看是否拥有执行环境
    3. 确认环境变量 `Z_AI_API_KEY` 是否正确配置
  </Accordion>

  <Accordion title="API Key 无效">
    **问题：** 收到 API Key 无效的错误

    **解决方案：**

    1. 确认 API Key 是否正确复制
    2. 检查 API Key 是否已激活
    3. 确认选择的平台 (`Z_AI_MODE`) 与 API Key 匹配
    4. 检查 API Key 是否有足够的余额
  </Accordion>

  <Accordion title="连接超时">
    **问题：** MCP 服务器连接超时

    **解决方案：**

    1. 检查网络连接
    2. 确认防火墙设置
    3. 尝试切换到不同的平台 (`ZHIPU` 或 `ZAI`)
    4. 增加超时时间设置
  </Accordion>
</AccordionGroup>

## 相关资源

* [模型上下文协议 (MCP) 官方文档](https://modelcontextprotocol.io/)
* [Claude Code MCP 配置指南](https://docs.anthropic.com/en/docs/claude–code/mcp)
* [智谱 API 文档](/cn/api/introduction)
* [视觉模型介绍](/cn/guide/models/vlm/glm–4.5v)
