# Claude API 兼容

智谱提供与 Claude API 兼容的接口，这意味着您可以使用现有的 Anthropic SDK 代码，只需要简单修改 API 密钥和基础 URL，就能无缝切换到智谱的模型服务。

<Tip>
  [GLM Coding Plan](https://bigmodel.cn/claude–code?utm_source=branding\&utm_medium=wechat\&utm_term=claude%20api%20replace\&utm_campaign=Platform_Ops&_channel_track_key=KJtDB2CE) 编码套餐上线，支持含 Claude Code、Cline 等近10种全球主流编码工具，搭配智谱新旗舰 GLM–4.5，20元起包月畅享！
</Tip>

### 核心优势

<CardGroup cols={2}>
  <Card title="零学习成本" icon={<svg style={{maskImage: "url(/resource/icon/rocket.svg)",
maskRepeat: "no–repeat",
maskPosition: "center center",}} className={"h–6 w–6 bg–primary dark:bg–primary–light !m–0 shrink–0"}/>}>
    如果您已经熟悉 Anthropic SDK，可以立即上手使用
  </Card>

  <Card title="快速迁移" icon={<svg style={{maskImage: "url(/resource/icon/arrows–rotate.svg)",
maskRepeat: "no–repeat",
maskPosition: "center center",}} className={"h–6 w–6 bg–primary dark:bg–primary–light !m–0 shrink–0"}/>}>
    现有 Claude 应用如 Claude Code 等可以快速迁移到智谱平台
  </Card>

  <Card title="极速访问" icon={<svg style={{maskImage: "url(/resource/icon/puzzle–piece.svg)",
maskRepeat: "no–repeat",
maskPosition: "center center",}} className={"h–6 w–6 bg–primary dark:bg–primary–light !m–0 shrink–0"}/>}>
    无障碍极速访问智谱模型的强大能力
  </Card>

  <Card title="持续更新" icon={<svg style={{maskImage: "url(/resource/icon/arrow–up.svg)",
maskRepeat: "no–repeat",
maskPosition: "center center",}} className={"h–6 w–6 bg–primary dark:bg–primary–light !m–0 shrink–0"}/>}>
    跟随 Anthropic SDK 更新，保持最新功能支持
  </Card>
</CardGroup>

<Warning>
  某些场景下智谱与 Claude 接口仍存在差异，但不影响整体兼容性。
</Warning>

## 从 Claude 迁移至智谱

如果您已经在使用 Claude API，迁移到智谱非常简单。

* 替换您访问的 `base_url` 为 `https://open.bigmodel.cn/api/anthropic`
* 在 [智谱开放平台](https://bigmodel.cn/usercenter/proj–mgmt/apikeys) 申请您的 `api_key`
* 调用时使用智谱模型编码即可

```python  theme={null}
# 原来的 Claude 代码
import anthropic

client = anthropic.Anthropic(
    base_url="your-base-url",
    api_key="your-api-key",
)

# 迁移到智谱，只需要修改三个地方
client = anthropic.Anthropic(
    api_key="your-zhipuai-api-key",  # 替换为智谱 API Key
    base_url="https://open.bigmodel.cn/api/anthropic"  # 配置智谱 base_url
)

# 模型编码使用 智谱模型，其他代码保持不变
message = client.messages.create(
    model="glm-4.6",  # 使用智谱模型
    max_tokens=1024,
    messages=[{"role": "user", "content": "Hello!"}]
)
```

**推荐模型**

| 模型编码                                                 | 定位    | 特点                                    | 上下文  | 最大输出 |
| :--------------------------------------------------- | :---- | :------------------------------------ | :--- | :--- |
| [glm–4.6](/cn/guide/models/text/glm–4.6)             | 高智能旗舰 | - 旗舰性能 <br />- 强大的推理能力、代码生成能力以及工具调用能力 | 200K | 96K  |
| [glm–4.5–air](/cn/guide/models/text/glm–4.5)         | 高性价比  | - 在推理、编码和智能体任务上表现强劲                   | 128K | 96K  |
| [glm–4.5–flash](/cn/guide/models/free/glm–4.5–flash) | 免费模型  | - 基座模型的普惠版本                           | 128K | 96K  |

## 详细步骤

### 获取 API Key

1. 访问 [智谱开放平台](https://bigmodel.cn)
2. 注册并登录您的账户
3. 在 [API Keys](https://bigmodel.cn/usercenter/proj–mgmt/apikeys) 管理页面创建 API Key
4. 复制您的 API Key 以供使用

<Tip>
  建议将 API Key 设置为环境变量：`export ANTHROPIC_API_KEY=your–api–key` 替代硬编码到代码中，以提高安全性。
</Tip>

### 代码示例

<Tabs>
  <Tab title="cURL">
    ```bash  theme={null}
    curl https://open.bigmodel.cn/api/anthropic/v1/messages \
         --header "x-api-key: your-zhipuai-api-key" \
         --header "content-type: application/json" \
         --data \
    '{
        "model": "glm-4.6",
        "max_tokens": 1024,
        "stream": true,
        "messages": [
            {"role": "user", "content": "Hello, ZHIPU"}
        ]
    }'
    ```
  </Tab>

  <Tab title="Python">
    **安装 SDK**

    ```bash  theme={null}
    pip install anthropic
    ```

    详细安装可参考 [Anthropic SDK 官方文档](https://docs.anthropic.com/en/api/client–sdks)

    **调用示例**

    ```python  theme={null}
    import anthropic

    client = anthropic.Anthropic(
        api_key="your-zhipuai-api-key",
        base_url="https://open.bigmodel.cn/api/anthropic"
    )

    message = client.messages.create(
        model="glm-4.6",
        max_tokens=1024,
        messages=[
            {"role": "user", "content": "Hello, ZHIPU"}
        ]
    )
    print(message.content)
    ```
  </Tab>

  <Tab title="TypeScript">
    **安装 SDK**

    ```bash  theme={null}
    npm install @anthropic-ai/sdk
    ```

    详细安装可参考 [Anthropic SDK 官方文档](https://docs.anthropic.com/en/api/client–sdks)

    **调用示例**

    ```typescript  theme={null}
    import Anthropic from '@anthropic-ai/sdk';

    const anthropic = new Anthropic({
      apiKey: 'your-zhipuai-api-key',
      baseURL: 'https://open.bigmodel.cn/api/anthropic',
    });

    const msg = await anthropic.messages.create({
      model: 'glm-4.6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: 'Hello, ZHIPU' }],
    });
    console.log(msg);
    ```
  </Tab>

  <Tab title="Java">
    **安装 SDK**

    Maven:

    ```xml  theme={null}
    <dependency>
        <groupId>com.anthropic</groupId>
        <artifactId>anthropic-java</artifactId>
        <version>2.6.0</version>
    </dependency>
    ```

    Gradle:

    ```gradle  theme={null}
    implementation 'com.anthropic:anthropic-java:2.6.0'
    ```

    详细安装可参考 [Anthropic SDK 官方文档](https://docs.anthropic.com/en/api/client–sdks)

    **调用示例**

    ```java  theme={null}
      import com.anthropic.client.*;
      import com.anthropic.models.*;

      public class Chat {
          public static void main(String[] args) {
              AnthropicClient client = AnthropicOkHttpClient.builder()
                  .apiKey("your_zhipuai_api_key")
                  .baseUrl("https://open.bigmodel.cn/api/anthropic")
                  .build();
              MessageCreateParams params = MessageCreateParams.builder()
                  .model("glm-4.6")
                  .maxTokens(1024)
                  .addUserMessage("Hello, ZHIPU")
                  .build();
              Message message = client.messages().create(params);
              System.out.println(message);
          }
      }
    ```
  </Tab>
</Tabs>

## 更多资源

<CardGroup cols={2}>
  <Card title="畅玩 Claude Code" icon={<svg style={{maskImage: "url(/resource/icon/box.svg)",
maskRepeat: "no–repeat",
maskPosition: "center center",}} className={"h–6 w–6 bg–primary dark:bg–primary–light !m–0 shrink–0"}/>} href="/cn/guide/develop/claude">
    Claude Code 接入智谱随心畅玩
  </Card>

  <Card title="智谱 API 文档" icon={<svg style={{maskImage: "url(/resource/icon/book.svg)",
maskRepeat: "no–repeat",
maskPosition: "center center",}} className={"h–6 w–6 bg–primary dark:bg–primary–light !m–0 shrink–0"}/>} href="/cn/api/introduction">
    查看智谱完整的 API 文档
  </Card>

  <Card title="Claude 官方文档" icon={<svg style={{maskImage: "url(/resource/icon/link.svg)",
maskRepeat: "no–repeat",
maskPosition: "center center",}} className={"h–6 w–6 bg–primary dark:bg–primary–light !m–0 shrink–0"}/>} href="https://docs.anthropic.com/en/api/messages">
    参考 Claude 官方文档了解更多
  </Card>
</CardGroup>

<Note>
  智谱致力于保持与 Claude API 的兼容性，如果您在迁移过程中遇到任何问题，请联系我们的[技术支持团队](https://bigmodel.cn/online–book/customerService)。
</Note>
