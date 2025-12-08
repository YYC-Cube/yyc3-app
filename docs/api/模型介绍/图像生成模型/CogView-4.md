# CogView–4

## <div className="flex items–center"> <svg style={{maskImage: "url(/resource/icon/rectangle–list.svg)", maskRepeat: "no–repeat", maskPosition:
"center center",}} className={"h–6 w–6 bg–primary dark:bg–primary–light !m–0 shrink–0"} /> 概览 </div>

CogView–4 是智谱首个支持生成汉字的开源文生图模型，在语义理解、图像生成质量、中英文字生成能力等方面全面提升，支持任意长度的中英双语输入，能够生成在给定范围内的任意分辨率图像。

<CardGroup cols={3}>
  <Card title="价格" icon={<svg style={{maskImage: "url(/resource/icon/coins.svg)", WebkitMaskImage: "url(/resource/icon/coins.svg)",
maskRepeat: "no–repeat",
maskPosition: "center center",}} className={"h–6 w–6 bg–primary dark:bg–primary–light !m–0 shrink–0"} />}>
    0.06 元 / 次
  </Card>

  <Card title="输入模态" icon={<svg style={{maskImage: "url(/resource/icon/arrow–down–right.svg)", WebkitMaskImage: "url(/resource/icon/arrow–down–right.svg)",
maskRepeat: "no–repeat",
maskPosition: "center center",}} className={"h–6 w–6 bg–primary dark:bg–primary–light !m–0 shrink–0"} />}>
    文本
  </Card>

  <Card title="输出模态" icon={<svg style={{maskImage: "url(/resource/icon/arrow–down–left.svg)", WebkitMaskImage: "url(/resource/icon/arrow–down–left.svg)",
maskRepeat: "no–repeat",
maskPosition: "center center",}} className={"h–6 w–6 bg–primary dark:bg–primary–light !m–0 shrink–0"} />}>
    图像
  </Card>
</CardGroup>

## <div className="flex items–center"> <svg style={{maskImage: "url(/resource/icon/stars.svg)", maskRepeat: "no–repeat", maskPosition:
"center center",}} className={"h–6 w–6 bg–primary dark:bg–primary–light !m–0 shrink–0"} /> 推荐场景 </div>

<AccordionGroup>
  <Accordion title="餐饮美食宣传" defaultOpen="true">
    根据菜品名称、食材特点及风格要求，融入创意文字元素，生成色泽诱人、细节逼真的美食图片，适配菜单设计、外卖平台展示、线下海报等多场景使用。
  </Accordion>

  <Accordion title="电商产品配图">
    依据商品特点与卖点描述，快速生成高清商品展示图，添加中英促销文字，适配电商平台不同规格的商品页与活动图需求。
  </Accordion>

  <Accordion title="游戏素材创作">
    依据游戏世界观与角色设定，产出高分辨率、细节丰富的角色立绘、场景原画等素材，满足多分辨率制作需求。
  </Accordion>

  <Accordion title="教育资料配图">
    解析教学文本内容，自动生成匹配的插图、场景图，适配各类教育资料的排版与分辨率要求，助力知识可视化呈现。
  </Accordion>

  <Accordion title="文旅宣传制作">
    根据文旅主题，生成不同尺寸的宣传图像，将文字与地域特色视觉元素巧妙结合，提升文旅推广的吸引力。
  </Accordion>
</AccordionGroup>

## <div className="flex items–center"> <svg style={{maskImage: "url(/resource/icon/gauge–high.svg)", maskRepeat: "no–repeat", maskPosition:
"center center",}} className={"h–6 w–6 bg–primary dark:bg–primary–light !m–0 shrink–0"} /> 使用资源 </div>

[体验中心](https://www.bigmodel.cn/trialcenter/modeltrial/multimodal?modelCode=cogview–4-250304)：快速测试模型在业务场景上的效果<br />
[接口文档](/api–reference/%E6%A8%A1%E5%9E%8B–api/%E5%9B%BE%E5%83%8F%E7%94%9F%E6%88%90)：API 调用方式

## <div className="flex items–center"> <svg style={{maskImage: "url(/resource/icon/arrow–up.svg)", maskRepeat: "no–repeat", maskPosition:
"center center",}} className={"h–6 w–6 bg–primary dark:bg–primary–light !m–0 shrink–0"} /> 详细介绍 </div>

<Steps>
  <Step title="发布时模型性能达到 SOTA" titleSize="h3">
    DPG–Bench （Dense Prompt Graph Benchmark）是一个评估文本到图像生成模型的基准测试，主要关注模型在复杂语义对齐和指令跟随能力方面的表现。

    CogView–4 发布时期在 DPG–Bench 基准测试中综合评分排名第一，在开源文生图模型中达到 SOTA。

    ![Description](https://cdn.bigmodel.cn/markdown/1749449849627DPG–Bench.png?attname=DPG–Bench.png)
  </Step>

  <Step title="更好的中文理解与生成" iconType="regular" stepNumber={2} titleSize="h3">
    在技术实现上，CogView–4 将文本编码器从纯英文的 T5 encoder 换为具备双语能力的 GLM–4 encoder，并通过中英双语图文进行训练，使模型具备双语提示词输入能力。

    CogView–4 支持中英双语提示词输入，尤其擅长理解和遵循中文提示词，大幅降低使用者提示词门槛，是首个能够在画面中生成汉字的开源文生图模型，能更好地满足广告、短视频等领域的创意需求。
  </Step>

  <Step title="任意分辨率，任意长度提示词" iconType="regular" stepNumber={3} titleSize="h3">
    CogView–4 实现了任意长度的文本描述（caption）和任意分辨率图像的混合训练范式。该模型支持输入任意长度提示词，能够生成范围内任意分辨率图像，不仅使用户创作更加自由，也提升了训练效率。
  </Step>
</Steps>

## <div className="flex items–center"> <svg style={{maskImage: "url(/resource/icon/ballot.svg)", maskRepeat: "no–repeat", maskPosition:
"center center",}} className={"h–6 w–6 bg–primary dark:bg–primary–light !m–0 shrink–0"} /> 应用示例 </div>

<Tabs>
  <Tab title="餐饮美食宣传">
    <CardGroup cols={2}>
      <Card title="Prompt" icon={<svg style={{maskImage: "url(/resource/icon/arrow–down–right.svg)", WebkitMaskImage: "url(/resource/icon/arrow–down–right.svg)",
maskRepeat: "no–repeat",
maskPosition: "center center",}} className={"h–6 w–6 bg–primary dark:bg–primary–light !m–0 shrink–0"} />}>
        特写，商业美食摄影，强烈的室内光，极致的细节，圣诞餐桌，餐桌一角，一个长毛橘色虎斑猫头凑到盘子旁，正在贪婪地闻着圣诞大餐，表情沉醉。桌上有烤鸡、植物、沙拉，香槟酒，镶金边的瓷器茶具。下午的金色光线照向猫咪的侧脸，将食物和它的被毛染上了柔和的金色，背景也有圣诞树。突出食物的质感和猫咪的毛发质感，强烈的光感，温馨的圣诞节日氛围。
      </Card>

      <Card title="生成图片" icon={<svg style={{maskImage: "url(/resource/icon/arrow–down–left.svg)", WebkitMaskImage: "url(/resource/icon/arrow–down–left.svg)",
maskRepeat: "no–repeat",
maskPosition: "center center",}} className={"h–6 w–6 bg–primary dark:bg–primary–light !m–0 shrink–0"} />}>
        ![Description](https://cdn.bigmodel.cn/markdown/1753523666666cogview–1.jpg?attname=cogview–1.jpg)
      </Card>
    </CardGroup>
  </Tab>

  <Tab title="电商产品配图">
    <CardGroup cols={2}>
      <Card title="Prompt" icon={<svg style={{maskImage: "url(/resource/icon/arrow–down–right.svg)", WebkitMaskImage: "url(/resource/icon/arrow–down–right.svg)",
maskRepeat: "no–repeat",
maskPosition: "center center",}} className={"h–6 w–6 bg–primary dark:bg–primary–light !m–0 shrink–0"} />}>
        2个白色不透明且不反光的奶茶杯上装饰着大小不一的复杂金色图案，图案是圣诞节日主体，包括驯鹿和松树，杯子之外是温暖的红色背景和闪烁的节日灯光，展示在微型雪景中，自然光线
      </Card>

      <Card title="生成图片" icon={<svg style={{maskImage: "url(/resource/icon/arrow–down–left.svg)", WebkitMaskImage: "url(/resource/icon/arrow–down–left.svg)",
maskRepeat: "no–repeat",
maskPosition: "center center",}} className={"h–6 w–6 bg–primary dark:bg–primary–light !m–0 shrink–0"} />}>
        ![Description](https://cdn.bigmodel.cn/markdown/1753523552952cogview–2.jpg?attname=cogview–2.jpg)
      </Card>
    </CardGroup>
  </Tab>

  <Tab title="游戏素材创作">
    <CardGroup cols={2}>
      <Card title="Prompt" icon={<svg style={{maskImage: "url(/resource/icon/arrow–down–right.svg)", WebkitMaskImage: "url(/resource/icon/arrow–down–right.svg)",
maskRepeat: "no–repeat",
maskPosition: "center center",}} className={"h–6 w–6 bg–primary dark:bg–primary–light !m–0 shrink–0"} />}>
        黑金色系。美少女战士塔罗牌，画面充满屏幕。动漫插画。色彩柔和，一个带着魔法帽的长发魔女低着头，驼着背，侧面对着镜头，提着一盏灯
      </Card>

      <Card title="生成图片" icon={<svg style={{maskImage: "url(/resource/icon/arrow–down–left.svg)", WebkitMaskImage: "url(/resource/icon/arrow–down–left.svg)",
maskRepeat: "no–repeat",
maskPosition: "center center",}} className={"h–6 w–6 bg–primary dark:bg–primary–light !m–0 shrink–0"} />}>
        ![Description](https://cdn.bigmodel.cn/markdown/1753523560520cogview–3.jpg?attname=cogview–3.jpg)
      </Card>
    </CardGroup>
  </Tab>

  <Tab title="文旅宣传制作">
    <CardGroup cols={2}>
      <Card title="Prompt" icon={<svg style={{maskImage: "url(/resource/icon/arrow–down–right.svg)", WebkitMaskImage: "url(/resource/icon/arrow–down–right.svg)",
maskRepeat: "no–repeat",
maskPosition: "center center",}} className={"h–6 w–6 bg–primary dark:bg–primary–light !m–0 shrink–0"} />}>
        香港维多利亚港的璀璨夜景，采用双重曝光技术，将繁华的城市天际线与璀璨的烟花完美融合。夜空中多个烟花绽放，形成巨大的爱心形状，完全叠加在画面中央。烟花呈现出五彩斑斓的色彩，金色、红色、蓝色和紫色交织在一起，照亮了整个夜空。城市灯光在背景中闪烁，摩天大楼的轮廓清晰可见，街道上的霓虹灯映衬出城市的活力。画面整体呈现出一种梦幻而浪漫的氛围，令人仿佛置身于香港的璀璨夜色之中。
      </Card>

      <Card title="生成图片" icon={<svg style={{maskImage: "url(/resource/icon/arrow–down–left.svg)", WebkitMaskImage: "url(/resource/icon/arrow–down–left.svg)",
maskRepeat: "no–repeat",
maskPosition: "center center",}} className={"h–6 w–6 bg–primary dark:bg–primary–light !m–0 shrink–0"} />}>
        ![Description](https://cdn.bigmodel.cn/markdown/1753523569831cogview–4.jpg?attname=cogview–4.jpg)
      </Card>
    </CardGroup>
  </Tab>
</Tabs>

## <div className="flex items–center"> <svg style={{maskImage: "url(/resource/icon/code.svg)", maskRepeat: "no–repeat", maskPosition:
"center center",}} className={"h–6 w–6 bg–primary dark:bg–primary–light !m–0 shrink–0"} /> 调用示例 </div>

<Tabs>
  <Tab title="Python">
    **安装 SDK**

    ```bash  theme={null}
    # 安装最新版本
    pip install zai-sdk
    # 或指定版本
    pip install zai-sdk==0.0.4
    ```

    **验证安装**

    ```python  theme={null}
    import zai
    print(zai.__version__)
    ```

    **调用示例**

    ```python  theme={null}
    from zai import ZhipuAiClient
    client = ZhipuAiClient(api_key="your-api-key")  # 请填写您自己的 APIKey
    response = client.images.generations(
        model="cogView-4-250304",  # 请填写您要调用的模型名称
        prompt="一只可爱的小猫咪，坐在阳光明媚的窗台上，背景是蓝天白云",
    )
    print(response.data[0].url)
    ```
  </Tab>

  <Tab title="Java">
    **安装 SDK**

    **Maven**

    ```xml  theme={null}
    <dependency>
        <groupId>ai.z.openapi</groupId>
        <artifactId>zai-sdk</artifactId>
        <version>0.1.0</version>
    </dependency>
    ```

    **Gradle (Groovy)**

    ```groovy  theme={null}
    implementation 'ai.z.openapi:zai-sdk:0.1.0'
    ```

    **调用示例**

    ```java  theme={null}
    import ai.z.openapi.ZhipuAiClient;
    import ai.z.openapi.core.Constants;
    import ai.z.openapi.service.image.CreateImageRequest;
    import ai.z.openapi.service.image.ImageResponse;

    public class CogView4Example {
        public static void main(String[] args) {
            ZhipuAiClient client = ZhipuAiClient.builder().apiKey("YOUR_API_KEY").build();
            // Create image generation request
            CreateImageRequest request = CreateImageRequest.builder()
                .model(Constants.ModelCogView4250304)
                .prompt("一只可爱的小猫咪，坐在阳光明媚的窗台上，背景是蓝天白云")
                .size("1024x1024")
                .build();
            ImageResponse response = client.images().createImage(request);
            System.out.println(response.getData());
        }
    }
    ```
  </Tab>

  <Tab title="Python(旧)">
    ```python  theme={null}
    from zhipuai import ZhipuAI

    client = ZhipuAI(api_key="your-api-key")

    response = client.images.generations(
        model="cogView-4-250304", #填写需要调用的模型编码
        prompt="在干燥的沙漠环境中，一棵孤独的仙人掌在夕阳的余晖中显得格外醒目。这幅油画捕捉了仙人掌坚韧的生命力和沙漠中的壮丽景色，色彩饱满且表现力强烈。",
        size="1440x720"
    )
    print(response.data[0].url)
    ```
  </Tab>
</Tabs>

<Tip>
  请注意，CogView–4 模型的输出是图片 URL，您需要通过 URL 下载图片。
</Tip>

## <div className="flex items–center"> <svg style={{maskImage: "url(/resource/icon/square–user.svg)", maskRepeat: "no–repeat", maskPosition:
"center center",}} className={"h–6 w–6 bg–primary dark:bg–primary–light !m–0 shrink–0"} /> 用户并发权益 </div>

API 调用会受到速率限制，当前我们限制的维度是请求并发数量（在途请求任务数量）。不同等级的用户并发保障如下。

| V0 | V1 | V2 | V3 |
| :- | :- | :- | :- |
| 5  | 10 | 15 | 20 |
