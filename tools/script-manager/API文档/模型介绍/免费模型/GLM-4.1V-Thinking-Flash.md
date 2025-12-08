# GLM–4.1V–Thinking–Flash

## <div className="flex items–center"> <svg style={{maskImage: "url(/resource/icon/rectangle–list.svg)", maskRepeat: "no–repeat", maskPosition:
"center center",}} className={"h–6 w–6 bg–primary dark:bg–primary–light !m–0 shrink–0"} /> 概览 </div>

GLM–4.1V–Thinking–Flash 是智谱推出的免费视觉推理模型。它在图表/视频理解、前端 Coding、GUI 任务等场景表现出色，核心能力达到全面新 SOTA。模型引入思维链推理机制，显著提升了复杂场景中的回答精准度与可解释性。

## <div className="flex items–center"> <svg style={{maskImage: "url(/resource/icon/bolt.svg)", maskRepeat: "no–repeat", maskPosition:
"center center",}} className={"h–6 w–6 bg–primary dark:bg–primary–light !m–0 shrink–0"} /> 能力支持 </div>

<CardGroup cols={3}>
  <Card title="内置深度思考" icon={<svg style={{maskImage: "url(/resource/icon/brain.svg)", WebkitMaskImage: "url(/resource/icon/brain.svg)",
maskRepeat: "no–repeat",
maskPosition: "center center",}} className={"h–6 w–6 bg–primary dark:bg–primary–light !m–0 shrink–0"} />} iconType="solid">
    默认内置深度思考，提供更深层次的推理分析
  </Card>

  <Card title="视觉理解" icon={<svg style={{maskImage: "url(/resource/icon/eye.svg)", WebkitMaskImage: "url(/resource/icon/eye.svg)",
maskRepeat: "no–repeat",
maskPosition: "center center",}} className={"h–6 w–6 bg–primary dark:bg–primary–light !m–0 shrink–0"} />} iconType="regular">
    强大的视觉理解能力，支持图片，视频，文件
  </Card>

<Card title="流式输出" href="/cn/guide/capabilities/streaming" icon={<svg style={{maskImage: "url(/resource/icon/maximize.svg)", WebkitMaskImage: "url(/resource/icon/maximize.svg)", maskRepeat: "no–repeat",
maskPosition: "center center",}} className={"h–6 w–6 bg–primary dark:bg–primary–light !m–0 shrink–0"} />} iconType="regular">
    支持实时流式响应，提升用户交互体验
  </Card>
</CardGroup>

## <div className="flex items–center"> <svg style={{maskImage: "url(/resource/icon/stars.svg)", maskRepeat: "no–repeat", maskPosition:
"center center",}} className={"h–6 w–6 bg–primary dark:bg–primary–light !m–0 shrink–0"} /> 功能特色 </div>

<AccordionGroup>
  <Accordion title="图文理解" defaultOpen="true">
    精准识别并综合分析图像与文本信息。
  </Accordion>

  <Accordion title="数学与科学推理">
    支持持复杂题解、多步演绎与公式理解。
  </Accordion>

  <Accordion title="视频理解">
    具备时序分析与事件逻辑建模能力。
  </Accordion>

  <Accordion title="GUI 与网页智能体任务">
    理解界面结构，辅助自动化操作。
  </Accordion>

  <Accordion title="视觉锚定与实体定位">
    语言与图像区域精准对齐，提升人机交互可控性。
  </Accordion>
</AccordionGroup>

## <div className="flex items–center"> <svg style={{maskImage: "url(/resource/icon/link.svg)", maskRepeat: "no–repeat", maskPosition:
"center center",}} className={"h–6 w–6 bg–primary dark:bg–primary–light !m–0 shrink–0"} /> 快捷入口 </div>

* 接口调用查看 [接口文档](/api–reference/%E6%A8%A1%E5%9E%8B–api/%E5%AF%B9%E8%AF%9D%E8%A1%A5%E5%85%A8)
* 在 [体验中心](https://www.bigmodel.cn/trialcenter/modeltrial/multimodal?modelCode=glm–4.1v–thinking–flash) 体验模型能力
* 模型[速率限制](https://www.bigmodel.cn/usercenter/proj–mgmt/rate–limits)

## <div className="flex items–center"> <svg style={{maskImage: "url(/resource/icon/cubes.svg)", maskRepeat: "no–repeat", maskPosition:
"center center",}} className={"h–6 w–6 bg–primary dark:bg–primary–light !m–0 shrink–0"} /> 场景应用 </div>

<Tabs>
  <Tab title="图片问答">
    <CardGroup cols={2}>
      <Card title="prompt" icon={<svg style={{maskImage: "url(/resource/icon/arrow–down–right.svg)", WebkitMaskImage: "url(/resource/icon/arrow–down–right.svg)",
maskRepeat: "no–repeat",
maskPosition: "center center",}} className={"h–6 w–6 bg–primary dark:bg–primary–light !m–0 shrink–0"} />}>
        ![Description](https://cdn.bigmodel.cn/markdown/1751371892938image.png?attname=image.png)<br />请找出这张图中年度利润最高的公司，以及该公司的最大部门？
      </Card>

      <Card title="生成结果" icon={<svg style={{maskImage: "url(/resource/icon/arrow–down–left.svg)", WebkitMaskImage: "url(/resource/icon/arrow–down–left.svg)",
maskRepeat: "no–repeat",
maskPosition: "center center",}} className={"h–6 w–6 bg–primary dark:bg–primary–light !m–0 shrink–0"} />}>
Sony has the highest annual profit at \$6.3B. For Sony, the note states, “Media is
Sony’s second - largest segment after game consoles.” Thus, the largest segment is game consoles.
      </Card>
    </CardGroup>
  </Tab>

  <Tab title="学科解题">
    <CardGroup cols={2}>
      <Card title="prompt" icon={<svg style={{maskImage: "url(/resource/icon/arrow–down–right.svg)", WebkitMaskImage: "url(/resource/icon/arrow–down–right.svg)",
maskRepeat: "no–repeat",
maskPosition: "center center",}} className={"h–6 w–6 bg–primary dark:bg–primary–light !m–0 shrink–0"} />}>
        ![Description](https://cdn.bigmodel.cn/markdown/1751371905445image.png?attname=image.png)<br />请帮我解决这个题目，给出详细过程和答案.
      </Card>

      <Card title="生成结果" icon={<svg style={{maskImage: "url(/resource/icon/arrow–down–left.svg)", WebkitMaskImage: "url(/resource/icon/arrow–down–left.svg)",
maskRepeat: "no–repeat",
maskPosition: "center center",}} className={"h–6 w–6 bg–primary dark:bg–primary–light !m–0 shrink–0"} />}>
        思考过程略.<br />已知 PA ⊥ 平面 ABCD ，故 PA ⊥ AD 且 PA ⊥ AB。又 AB ⊥ AD ，AB ⊥ AD ，且 PA 与 AB 的公共点为 A ，因此 AD ⊥平面 PAB。由于 AD ⊂ 平面 PAD，故平面 PAB **⊥** 平面 PAD。
      </Card>
    </CardGroup>
  </Tab>

  <Tab title="GUI Agent">
    <CardGroup cols={2}>
      <Card title="prompt" icon={<svg style={{maskImage: "url(/resource/icon/arrow–down–right.svg)", WebkitMaskImage: "url(/resource/icon/arrow–down–right.svg)",
maskRepeat: "no–repeat",
maskPosition: "center center",}} className={"h–6 w–6 bg–primary dark:bg–primary–light !m–0 shrink–0"} />}>
        ![Description](https://cdn.bigmodel.cn/markdown/1751371916542image.png?attname=image.png)<br />在 APP 中，帮我创建一个两周后 3 点与史密斯博士的会议
      </Card>

      <Card title="生成结果" icon={<svg style={{maskImage: "url(/resource/icon/arrow–down–left.svg)", WebkitMaskImage: "url(/resource/icon/arrow–down–left.svg)",
maskRepeat: "no–repeat",
maskPosition: "center center",}} className={"h–6 w–6 bg–primary dark:bg–primary–light !m–0 shrink–0"} />}>
        ![Description](https://cdn.bigmodel.cn/markdown/175282595604320250718–160538.jpeg?attname=20250718–160538.jpeg)
      </Card>
    </CardGroup>
  </Tab>

  <Tab title="前端网页 Coding">
    <CardGroup cols={2}>
      <Card title="prompt" icon={<svg style={{maskImage: "url(/resource/icon/arrow–down–right.svg)", WebkitMaskImage: "url(/resource/icon/arrow–down–right.svg)",
maskRepeat: "no–repeat",
maskPosition: "center center",}} className={"h–6 w–6 bg–primary dark:bg–primary–light !m–0 shrink–0"} />}>
        ![Description](https://cdn.bigmodel.cn/markdown/1751371942040image.png?attname=image.png)<br />请构建一个与输入图片相似的网页并将其转换为 React 代码。
      </Card>

      <Card title="生成结果" icon={<svg style={{maskImage: "url(/resource/icon/arrow–down–left.svg)", WebkitMaskImage: "url(/resource/icon/arrow–down–left.svg)",
maskRepeat: "no–repeat",
maskPosition: "center center",}} className={"h–6 w–6 bg–primary dark:bg–primary–light !m–0 shrink–0"} />}>
        生成的 React 代码后渲染的网页界面截图：<br />![Description](https://cdn.bigmodel.cn/markdown/1751381809888image.png?attname=image.png)
      </Card>
    </CardGroup>
  </Tab>
</Tabs>
