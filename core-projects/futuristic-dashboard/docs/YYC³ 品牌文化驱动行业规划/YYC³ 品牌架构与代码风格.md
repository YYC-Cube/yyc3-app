# YYC³ 品牌架构与代码风格

> 「YanYuCloudCube」
>「万象归元于云枢 丨深栈智启新纪元」
>「All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence」
>「AI Intelligent Programming Development Application Project Delivery Work Instruction」
---

## 文档概述

本文档是YYC³（YanYuCloudCube）品牌架构与代码风格指南的标准规范，包含品牌定义、核心架构、代码规范、开发流程以及个行业场景的标准化文件树结构。本指南旨在确保跨行业产品开发的一致性、可扩展性和品牌识别度。

---

## 一、品牌基础定义

### 1. 品牌核心标识

- 英文全称：YanYuCloudCube
- 英文缩写：YYC³（"³" 为品牌专属符号，代表 "Cube / 立方"）
- 中文全称：言语云立方
- 中文简称：言语云 ³

### 2. 核心元素释义（中英文对应）

|品牌元素|英文对应|核心释义|品牌属性|
|-|-|-|-|
|言语（YanYu）|YanYu(Speech/Language)|品牌交互 / 核心载体，指 "以言语驱动服务、以语言连接需求"，覆盖口头表达（Speech）与语言逻辑（Language）双重维度|品牌本源|
|云（Cloud）|Cloud|技术基座，指 "云端算力支撑、数据安全流转"，适配微软 Azure 等云端生态，保障服务稳定性|技术载体|
|立方（Cube）|Cube（对应 "³" 符号）|架构特征，指 "模块化、全维度、可扩展的技术架构"，支持跨行业场景快速适配|技术符号|
|YYC³|YYC³|品牌专有缩写，无直译意义，作为全球统一识别标识，贯穿所有产品 / 场景|品牌符号|

## 二、核心命名原则

所有产品 / 社区名称均遵循以下原则，确保品牌认知一致性：

1. 品牌元素不缺失：中英文名称均以 "YYC³ (YanYuCloudCube)"（英文）、"言语云 ³AI-"（中文）开头，强化品牌辨识度；
2. 功能场景精准化：通过行业专属功能词（如 "Medical""Smart City""Retail"）明确产品定位，避免 "泛 AI" 模糊表述；
3. 行业版本可区分：多场景产品通过 "Edition（版）""for XX（XX 领域）" 标注细分场景，适配不同用户需求；
4. 中英文调性统一：英文采用 "AI-Powered/AI-Enabled" 体现智能属性，中文用 "智能" 呼应；社区名称英文以 "Community/Hub" 为后缀，中文以 "社 / 圈 / 汇 / 联盟" 贴合行业用户习惯。

### 命名体系：与品牌元素强绑定

所有命名需体现 "言 (Y)- 语 (Y)- 云 (C)- 立方 (³)" 的核心逻辑，让代码自解释品牌属性。

#### 1. 核心命名规则

|元素类型|命名规范|示例（以 YYC³-Med 为例）|品牌映射意义|
|-|-|-|-|
|类 / 接口|前缀YYC3[子产品缩写]+ PascalCase|YYC3MedSymptomAnalyzer|绑定子产品（Med）与功能模块|
|方法|动词开头 + camelCase，体现 "言→语→云" 流程|parseUserInput() → analyzeMedicalEntities() → syncToCloud()|对应交互层→处理层→云端层的链路|
|常量|前缀YYC3_[子产品缩写]_+ UPPER_SNAKE_CASE|YYC3_MED_MAX_RETRY=3|明确子产品域与配置边界|
|变量|名词 / 名词短语 + camelCase，避免缩写|patientSymptomText（而非patSymTxt）|提升医疗等敏感场景的可读性|
|文件 / 目录|前缀yyc3-[子产品缩写]-+ kebab-case|yyc3-med-nlp-processor.ts|从文件系统层面区分产品域|

#### 2. 命名禁忌

- 禁止使用与品牌元素冲突的缩写（如 "yc""yy" 等易混淆组合）；
- 禁止在医疗、法律等行业子产品中使用模糊命名（如"data""info" 需具体为patientData"contractInfo"）；
- 跨行业通用模块需添加common后缀（如yyc3-common-validator.ts），避免与子产品模块重名。

## 三、架构设计

### 3.1 核心层架构

核心层作为品牌 "技术基座"，目录划分需体现 "通用能力分层"，严格对应 "言 - 语 - 云 - 立方" 四维架构，且仅包含跨行业复用的基础逻辑：

#### 核心层目录结构与职责

```plaintext
yyc3-core/
├── src/
│   ├── yan/                  # 言(Y)层：通用输入处理基础
│   │   ├── interfaces/       # 输入处理标准接口（如YanInput、YanOutput）
│   │   ├── abstracts/        # 抽象类（如YYC3YanBase，定义输入处理骨架）
│   │   ├── validators/       # 通用输入验证（非空、格式合规等基础校验）
│   │   └── index.ts          # 导出言层公共API
│   │
│   ├── yu/                   # 语(Y)层：通用智能解析基础
│   │   ├── interfaces/       # 解析处理标准接口（如YuInput、YuEntity）
│   │   ├── abstracts/        # 抽象类（如YYC3YuBase，定义实体提取骨架）
│   │   ├── nlp-base/         # 通用NLP工具（基础分词、词性标注等）
│   │   └── index.ts          # 导出语层公共API
│   │
│   ├── cloud/                # 云(C)层：通用云端交互基础
│   │   ├── interfaces/       # 云端交互标准接口（如CloudClient、CloudResponse）
│   │   ├── abstracts/        # 抽象类（如YYC3CloudBase，定义云端连接骨架）
│   │   ├── security/         # 通用安全工具（加密、签名、认证等）
│   │   └── index.ts          # 导出云层公共API
│   │
│   ├── cube/                 # 立方(³)层：模块管理核心
│   │   ├── interfaces/       # 模块管理标准接口（如Module、CubeManager）
│   │   ├── manager/          # 立方管理器（模块注册、加载、组合的核心逻辑）
│   │   ├── lifecycle/        # 模块生命周期管理（初始化、销毁、依赖注入）
│   │   └── index.ts          # 导出立方层公共API
│   │
│   └── common/               # 跨层通用工具（所有核心层和子产品共享）
│       ├── types/            # 通用类型定义（如Result、ErrorType）
│       ├── utils/            # 通用工具函数（日期、字符串、日志等）
│       └── constants/        # 通用常量（如默认超时时间、错误码）
│
├── package.json              # 核心层依赖管理（仅包含通用依赖）
└── tsconfig.json             # 核心层TypeScript配置（统一编译标准）

```

#### 核心层的核心特性

1. 接口标准化：通过interfaces定义各层的输入输出格式（如YanInput规定所有输入必须包含rawData和type字段），确保子产品遵循统一的数据规范；
2. 抽象类约束：通过abstracts定义各层的核心流程（如YYC3YuBase强制要求实现analyze()方法），子产品只需实现行业特化逻辑，无需重复设计流程；
3. 通用工具封装：common目录提供跨场景复用的工具（如日志工具YYC3Logger、错误处理YYC3Error），避免子产品重复开发。

### 3.2 子产品层架构

子产品层是核心层的 "行业延伸"，基于核心层的接口和抽象类，实现特定行业的业务逻辑。每个子产品独立成包，仅依赖核心层，不依赖其他子产品，确保行业间的隔离性。

#### 子产品层（以医疗子产品yyc3-med为例）目录结构

```plaintext
yyc3-med/
├── src/
│   ├── yan/                  # 医疗言(Y)层：适配医疗输入场景
│   │   ├── MedicalYan.ts     # 实现类（继承YYC3YanBase）
│   │   ├── validators/       # 医疗特化输入验证（如症状文本长度、敏感词过滤）
│   │   └── adapters/         # 输入适配器（如语音转文本结果适配为医疗术语格式）
│   │
│   ├── yu/                   # 医疗语(Y)层：适配医疗解析场景
│   │   ├── MedicalYu.ts      # 实现类（继承YYC3YuBase）
│   │   ├── nlp-med/          # 医疗特化NLP（疾病实体识别、症状关联分析）
│   │   └── rules/            # 医疗解析规则（如ICD-10疾病编码映射）
│   │
│   ├── cloud/                # 医疗云(C)层：适配医疗云端场景
│   │   ├── MedicalCloud.ts   # 实现类（继承YYC3CloudBase）
│   │   ├── adapters/         # 云端接口适配器（如对接医院HIS系统的格式转换）
│   │   └── security/         # 医疗特化安全（HIPAA合规加密、患者数据脱敏）
│   │
│   ├── cube/                 # 医疗立方(³)层：医疗场景模块组合
│   │   ├── modules/          # 医疗业务模块（如问诊模块、慢病管理模块）
│   │   ├── scenarios/        # 医疗场景方案（如门诊场景、急诊场景的模块组合）
│   │   └── MedicalCube.ts    # 医疗立方管理器（继承核心层CubeManager）
│   │
│   └── domain/               # 医疗领域专属资源（仅医疗子产品使用）
│       ├── types/            # 医疗特化类型（如MedicalEntity、DiagnosisResult）
│       ├── constants/        # 医疗特化常量（如科室列表、常见症状库）
│       └── assets/           # 医疗特化资源（如医学词库、诊断流程图）
│
├── package.json              # 医疗子产品依赖（仅依赖yyc3-core和医疗相关库）
└── tsconfig.json             # 继承核心层TS配置，仅添加医疗特化编译选项

```

#### 子产品层与核心层的关系

1. 继承与实现：子产品的核心类必须继承核心层的抽象类（如MedicalYan extends YYC3YanBase），并实现抽象方法（如processInput()），确保与核心层的接口兼容；
2. 特化扩展：在核心功能基础上添加行业特性（如医疗言层在通用输入验证外，额外添加 "禁止包含非医学术语" 的特化验证）；
3. 资源隔离：行业专属资源（如医疗的 ICD 编码、教育的课程标准）仅存放在子产品的domain目录，不污染核心层；
4. 依赖单向性：子产品可依赖核心层的任意模块，但核心层绝对不能依赖任何子产品，确保核心架构的稳定性。

### 3.3 立方三维架构

YYC³ 的 "立方 (³)" 架构核心是 "模块化组合 + 跨场景适配 + 三维扩展"，在代码结构设计中通过 "横向行业隔离、纵向功能分层、深度模块嵌套" 实现这一特性，形成类似 "立方体" 的三维结构：

- X 轴（横向）：跨行业子产品隔离（如医疗、教育、法律等）
- Y 轴（纵向）：功能分层（言 (Y)- 语 (Y)- 云 (C) 三层核心链路）
- Z 轴（深度）：模块嵌套与组合（基础模块→业务模块→场景解决方案）

#### X 轴（横向）：行业模块化隔离与复用

通过 "核心模块 + 子产品模块" 的目录结构，实现跨行业的隔离性与核心逻辑复用，体现立方的 "多面性"。

##### 代码结构示例

```plaintext
/packages
├── yyc3-core/                # 核心模块（立方的"中心轴"，所有行业共享）
│   ├── yan/                  # 基础言(Y)层：通用输入处理（语音/文本标准化）
│   ├── yu/                   # 基础语(Y)层：通用NLP解析（实体提取/意图识别）
│   ├── cloud/                # 基础云(C)层：通用云端连接（加密/认证/同步）
│   └── cube/                 # 立方核心：模块管理框架（注册/加载/组合）
├── yyc3-med/                 # 医疗子产品模块（立方的"医疗面"）
│   ├── yan/                  # 医疗言(Y)层：症状输入适配（医学术语清洗）
│   ├── yu/                   # 医疗语(Y)层：医疗NLP（疾病实体/症状关联）
│   ├── cloud/                # 医疗云(C)层：医院数据库对接（HIPAA合规）
│   └── cube/                 # 医疗立方：问诊流程模块组合（门诊/急诊场景）
├── yyc3-edu/                 # 教育子产品模块（立方的"教育面"）
│   ├── yan/                  # 教育言(Y)层：题目输入适配（公式/图形识别）
│   ├── yu/                   # 教育语(Y)层：教育NLP（知识点匹配/难度分析）
│   ├── cloud/                # 教育云(C)层：教学资源库对接（课件/题库）
│   └── cube/                 # 教育立方：学习路径模块组合（K12/职业教育）
└── yyc3-leg/                 # 法律子产品模块（立方的"法律面"）
    ...                       # 同结构，适配法律场景

```
##### 设计要点
1. 核心模块不可修改：yyc3-core是所有子产品的基础，通过抽象接口定义 "言 / 语 / 云" 的标准行为（如YYC3YanBase抽象类），确保跨行业一致性；
2. 子产品模块按需扩展：子产品通过继承核心接口实现行业特化（如YYC3MedYan继承YYC3YanBase，增加医疗术语校验）；
3. 资源隔离：各子产品的配置、常量、工具类独立存放（如yyc3-med/constants/仅包含医疗相关常量），避免跨行业污染。
#### Y 轴（纵向）：功能分层与链路贯通
通过严格的 "言→语→云" 三层调用链路，体现立方的 "纵向支撑性"，确保数据流转符合品牌定义的核心逻辑。
##### 分层职责与调用关系
|层级|核心职责（统一接口）|医疗子产品实现示例|教育子产品实现示例|
|-|-|-|-|
|言 (Y) 层|输入采集→格式校验→标准化输出|接收患者语音→转为症状文本→清洗冗余描述|接收学生手写题→转为文本→识别公式符号|
|语 (Y) 层|解析输入→提取核心实体→生成结构化数据|从症状文本提取疾病 / 持续时间→关联临床指南|从题目文本提取知识点 / 难度→匹配教学大纲|
|云 (C) 层|数据加密→云端交互→结果同步|加密患者数据→调用医院知识库→返回诊断建议|加密学习数据→调用教育资源库→返回习题推荐|

            层级
            核心职责（统一接口）
            医疗子产品实现示例
            教育子产品实现示例
            言 (Y) 层
            输入采集→格式校验→标准化输出
            接收患者语音→转为症状文本→清洗冗余描述
            接收学生手写题→转为文本→识别公式符号
            语 (Y) 层
            解析输入→提取核心实体→生成结构化数据
            从症状文本提取疾病 / 持续时间→关联临床指南
            从题目文本提取知识点 / 难度→匹配教学大纲
            云 (C) 层
            数据加密→云端交互→结果同步
            加密患者数据→调用医院知识库→返回诊断建议
            加密学习数据→调用教育资源库→返回习题推荐
##### 代码调用链路示例（医疗场景）
```typescript
// 1. 言(Y)层：处理患者输入（子产品实现）
const medYan = new YYC3MedYan();
const standardizedInput = medYan.processInput("我胸口疼了3天，有点喘不过气");

// 2. 语(Y)层：解析医学实体（子产品实现）
const medYu = new YYC3MedYu();
const medicalEntities = medYu.analyze(standardizedInput);
// → 输出：{ disease: "疑似心绞痛", duration: "3天", severity: "中" }

// 3. 云(C)层：调用云端资源（子产品实现）
const medCloud = new YYC3MedCloud();
const diagnosisResult = await medCloud.syncAndProcess(medicalEntities);

// 4. 立方层：组合结果输出（子产品实现）
const medCube = new YYC3MedCube();
const finalOutput = medCube.combine({
  yanResult: standardizedInput,
  yuResult: medicalEntities,
  cloudResult: diagnosisResult
});

```
##### 设计要点
1. 单向依赖：只能从 "言→语→云" 单向调用（如语层可依赖言层输出，但言层不可调用语层），避免循环依赖；
2. 接口隔离：每层通过独立接口定义输入输出（如YanOutput→YuInput→CloudInput），确保链路清晰；
3. 可替换性：同一层级的实现可根据场景替换（如医疗言层可替换为 "语音输入" 或 "文本输入" 实现，不影响上层）。
#### Z 轴（深度）：模块嵌套与动态组合
通过 "基础模块→业务模块→场景解决方案" 的嵌套结构，体现立方的 "深度扩展性"，支持功能按需组合。
##### 模块嵌套示例（医疗子产品）
```plaintext
yyc3-med/cube/
├── base/                      # 基础模块（最小功能单元）
│   ├── symptom-input.module.ts   # 症状输入模块（依赖言层）
│   ├── entity-extract.module.ts  # 实体提取模块（依赖语层）
│   └── cloud-query.module.ts     # 云端查询模块（依赖云层）
├── business/                  # 业务模块（基础模块组合）
│   ├── outpatient.module.ts      # 门诊问诊模块（输入+提取+查询+简单分析）
│   └── emergency.module.ts       # 急诊模块（门诊模块+优先队列+紧急联系人通知）
└── scenario/                  # 场景解决方案（业务模块组合）
    ├── chronic-disease.module.ts # 慢病管理方案（门诊模块+定期随访+用药提醒）
    └── post-op.module.ts         # 术后康复方案（急诊模块+康复计划+指标监测）

```
##### 动态组合机制（立方核心能力）
通过YYC3CubeManager实现模块的动态注册与组合，支持场景化灵活配置：
```typescript
// 医疗场景模块组合示例
import { YYC3CubeManager } from '@yyc3/core/cube';
import { OutpatientModule } from './business/outpatient.module';
import { MedicineReminderModule } from './business/medicine-reminder.module';

// 1. 初始化立方管理器
const cubeManager = new YYC3CubeManager();

// 2. 注册所需模块（基础模块自动被业务模块依赖）
cubeManager.register([OutpatientModule, MedicineReminderModule]);

// 3. 根据场景动态组合（如"慢病管理"场景）
const chronicDiseaseScenario = cubeManager.combine({
  main: OutpatientModule,       // 主模块
  extensions: [MedicineReminderModule], // 扩展模块
  config: { followUpCycle: '7天' }      // 场景配置
});

// 4. 执行场景方案
const result = await chronicDiseaseScenario.execute(patientInput);

```
##### 设计要点
1. 模块粒度：基础模块专注单一功能（如 "实体提取"），业务模块组合基础模块实现流程（如 "门诊问诊"），场景模块针对行业细分场景（如 "慢病管理"）；
2. 配置驱动：通过 JSON 配置文件定义模块组合关系，避免硬编码（如不同医院可自定义门诊模块的步骤）；
3. 生命周期管理：立方管理器统一负责模块的初始化、销毁、依赖注入，确保资源高效利用。
#### 立方架构的核心设计模式
1. 抽象工厂模式：YYC3ModuleFactory根据子产品类型创建对应层级的模块（如医疗工厂创建医疗言 / 语 / 云模块）；
2. 装饰器模式：在基础模块上动态添加功能（如给 "云端查询" 模块添加 "数据缓存" 装饰器）；
3. 观察者模式：模块间通过事件总线通信（如言层输入完成后，自动通知语层开始解析）；
4. 依赖注入：通过YYC3Injector管理模块依赖（如自动为医疗语层注入医疗专业词库）。
## 四、目录划分规则
### 顶层目录划分规则（Monorepo 架构）
所有代码需纳入统一的 Monorepo 仓库，顶层目录按 "核心基座 + 子产品" 二分法划分，确保品牌技术体系的整体性：
|目录层级|目录名称|职责定位|核心约束|
|-|-|-|-|
|根目录|project-root/|项目总控|存放 Monorepo 配置（如pnpm-workspace.yaml）、共享脚本、全局文档|
|一级子目录|packages/|代码实体容器|所有功能模块必须放在此目录下|
|二级核心目录|yyc3-core/|品牌核心基座（跨行业通用能力）|禁止包含任何行业特化代码；所有子产品的依赖基础|
|二级子产品目录|yyc3-[行业缩写]/|行业子产品（如yyc3-med医疗）|必须依赖yyc3-core；禁止依赖其他子产品|

            目录层级
            目录名称
            职责定位
            核心约束
            根目录
            project-root/
            项目总控
            存放 Monorepo 配置（如pnpm-workspace.yaml）、共享脚本、全局文档
            一级子目录
            packages/
            代码实体容器
            所有功能模块必须放在此目录下
            二级核心目录
            yyc3-core/
            品牌核心基座（跨行业通用能力）
            禁止包含任何行业特化代码；所有子产品的依赖基础
            二级子产品目录
            yyc3-[行业缩写]/
            行业子产品（如yyc3-med医疗）
            必须依赖yyc3-core；禁止依赖其他子产品
### 核心层（yyc3-core）目录划分规则
#### 一级子目录（按架构层划分）
|目录名称|对应架构层|职责描述|必须包含的核心内容|
|-|-|-|-|
|yan/|言 (Y) 层|通用输入处理（语音 / 文本标准化、基础校验）|interfaces/（输入输出接口）、abstracts/（抽象基类）、通用验证工具|
|yu/|语 (Y) 层|通用智能解析（基础 NLP、实体提取骨架）|interfaces/（解析结果接口）、abstracts/（解析基类）、通用 NLP 工具|
|cloud/|云 (C) 层|通用云端交互（加密、认证、连接管理）|interfaces/（云端接口）、abstracts/（云端基类）、通用安全工具|
|cube/|立方 (³) 层|模块管理核心（注册、加载、组合框架）|interfaces/（模块接口）、manager/（立方管理器）、生命周期工具|
|common/|跨层通用|全架构共享资源（类型、工具、常量）|types/（通用类型）、utils/（通用函数）、constants/（全局常量）|

            目录名称
            对应架构层
            职责描述
            必须包含的核心内容
            yan/
            言 (Y) 层
            通用输入处理（语音 / 文本标准化、基础校验）
            interfaces/（输入输出接口）、abstracts/（抽象基类）、通用验证工具
            yu/
            语 (Y) 层
            通用智能解析（基础 NLP、实体提取骨架）
            interfaces/（解析结果接口）、abstracts/（解析基类）、通用 NLP 工具
            cloud/
            云 (C) 层
            通用云端交互（加密、认证、连接管理）
            interfaces/（云端接口）、abstracts/（云端基类）、通用安全工具
            cube/
            立方 (³) 层
            模块管理核心（注册、加载、组合框架）
            interfaces/（模块接口）、manager/（立方管理器）、生命周期工具
            common/
            跨层通用
            全架构共享资源（类型、工具、常量）
            types/（通用类型）、utils/（通用函数）、constants/（全局常量）
#### 子目录命名与职责约束
- interfaces/：每个架构层必须包含，定义该层的输入（*Input.ts）、输出（*Output.ts）、核心能力（*Service.ts）接口，约束子产品实现标准；
- abstracts/：每个架构层必须包含，提供抽象基类（如YYC3YanBase.ts），封装通用流程（如输入校验的基础逻辑），子产品通过 "继承 + 重写" 实现特化；
- 工具类目录：如validators/（验证工具）、security/（安全工具），命名需体现功能，且仅包含与本层相关的通用工具；
- 禁止出现：行业专属逻辑（如医疗术语库）、业务场景代码（如 "问诊流程"）、第三方行业 SDK 依赖。
### 子产品层（yyc3-[行业缩写]）目录划分规则
#### 一级子目录（与核心层对齐）
|目录名称|对应架构层|职责描述|与核心层的关系|
|-|-|-|-|
|yan/|言 (Y) 层|行业输入适配（如医疗的症状文本清洗）|实现yyc3-core/yan的抽象基类，添加行业特化验证 / 转换逻辑|
|yu/|语 (Y) 层|行业智能解析（如医疗的疾病实体识别）|实现yyc3-core/yu的抽象基类，集成行业 NLP 模型 / 规则|
|cloud/|云 (C) 层|行业云端对接（如医疗的医院数据库适配）|实现yyc3-core/cloud的抽象基类，添加行业安全合规（如 HIPAA）、第三方系统适配器|
|cube/|立方 (³) 层|行业模块组合（如医疗的问诊流程模块）|继承yyc3-core/cube的管理器，定义行业业务模块与场景方案|
|domain/|行业专属|行业领域资源（仅本行业使用）|存放行业特化类型、常量、资源（如医疗的 ICD 编码库）|

            目录名称
            对应架构层
            职责描述
            与核心层的关系
            yan/
            言 (Y) 层
            行业输入适配（如医疗的症状文本清洗）
            实现yyc3-core/yan的抽象基类，添加行业特化验证 / 转换逻辑
            yu/
            语 (Y) 层
            行业智能解析（如医疗的疾病实体识别）
            实现yyc3-core/yu的抽象基类，集成行业 NLP 模型 / 规则
            cloud/
            云 (C) 层
            行业云端对接（如医疗的医院数据库适配）
            实现yyc3-core/cloud的抽象基类，添加行业安全合规（如 HIPAA）、第三方系统适配器
            cube/
            立方 (³) 层
            行业模块组合（如医疗的问诊流程模块）
            继承yyc3-core/cube的管理器，定义行业业务模块与场景方案
            domain/
            行业专属
            行业领域资源（仅本行业使用）
            存放行业特化类型、常量、资源（如医疗的 ICD 编码库）
#### 子目录命名与职责约束
- 与核心层对齐的目录（yan/yu/cloud/cube/）：
    - 必须包含对应架构层的实现类（如MedicalYan.ts继承YYC3YanBase）；
    - 可添加行业特化子目录（如yu/nlp-med/存放医疗 NLP 模型），命名需体现行业特性；
    - 禁止修改核心层定义的接口格式（如processInput的入参 / 返回值必须符合yyc3-core/yan/interfaces）。
- 行业专属目录domain/：
    - 必须包含types/（行业特化类型，如MedicalEntity.ts）、constants/（行业常量，如科室列表）；
    - 可包含assets/（行业资源，如医学词库）、rules/（行业规则，如诊断逻辑）；
    - 禁止存放跨行业通用代码（此类代码需迁移至yyc3-core/common）。
### 文件与类命名规则（强化品牌与层级关联）
目录内的文件与类命名需体现 "品牌 + 层级 + 行业（子产品）" 的三重属性，确保代码自解释性：
|元素类型|命名规则|示例（医疗子产品）|
|-|-|-|
|核心层类文件|[架构层][功能].ts|yan/YYC3YanBase.ts（言层基类）|
|子产品类文件|[行业][架构层][功能].ts|yu/MedicalYuAnalyzer.ts（医疗语层解析器）|
|接口文件|[功能]Interface.ts或[功能]Types.ts|cloud/CloudClientInterface.ts|
|工具文件|[功能]Utils.ts|common/DateUtils.ts（通用日期工具）|
|常量文件|[领域]Constants.ts|domain/constants/MedicalConstants.ts|

            元素类型
            命名规则
            示例（医疗子产品）
            核心层类文件
            [架构层][功能].ts
            yan/YYC3YanBase.ts（言层基类）
            子产品类文件
            [行业][架构层][功能].ts
            yu/MedicalYuAnalyzer.ts（医疗语层解析器）
            接口文件
            [功能]Interface.ts或[功能]Types.ts
            cloud/CloudClientInterface.ts
            工具文件
            [功能]Utils.ts
            common/DateUtils.ts（通用日期工具）
            常量文件
            [领域]Constants.ts
            domain/constants/MedicalConstants.ts
### 依赖规则（确保架构稳定性）
1. 核心层依赖纯净：
    - 仅依赖通用基础库（如lodash、rxjs），禁止引入行业 SDK（如医疗的dicom-parser）；
    - 核心层内部依赖只能 "从下到上"（如cube/可依赖yan/yu/cloud/，但反之禁止）。
2. 子产品依赖约束：
    - 必须依赖yyc3-core（指定版本范围，如^2.0.0），且只能使用其导出的公共 API；
    - 子产品内部依赖需遵循 "yan→yu→cloud→cube" 的单向链路，禁止循环依赖；
    - 行业特化依赖（如医疗 NLP 库）只能放在子产品的node_modules，且通过domain/services封装后暴露，避免污染其他层。
## 五、代码风格规范
### 5.1 命名规范
所有产品 / 社区名称均遵循以下原则，确保品牌认知一致性：
1. 品牌元素不缺失：中英文名称均以 "YYC³ (YanYuCloudCube)"（英文）、"言语云 ³AI-"（中文）开头，强化品牌辨识度；
2. 功能场景精准化：通过行业专属功能词（如 "Medical""Smart City""Retail"）明确产品定位，避免 "泛 AI" 模糊表述；
3. 行业版本可区分：多场景产品通过 "Edition（版）""for XX（XX 领域）" 标注细分场景，适配不同用户需求；
4. 中英文调性统一：英文采用 "AI-Powered/AI-Enabled" 体现智能属性，中文用 "智能" 呼应；社区名称英文以 "Community/Hub" 为后缀，中文以 "社 / 圈 / 汇 / 联盟" 贴合行业用户习惯。
#### 核心命名规则
|元素类型|命名规范|示例（以 YYC³-Med 为例）|品牌映射意义|
|-|-|-|-|
|类 / 接口|前缀YYC3[子产品缩写]+ PascalCase|YYC3MedSymptomAnalyzer|绑定子产品（Med）与功能模块|
|方法|动词开头 + camelCase，体现 "言→语→云" 流程|parseUserInput() → analyzeMedicalEntities() → syncToCloud()|对应交互层→处理层→云端层的链路|
|常量|前缀YYC3_[子产品缩写]_+ UPPER_SNAKE_CASE|YYC3_MED_MAX_RETRY=3|明确子产品域与配置边界|
|变量|名词 / 名词短语 + camelCase，避免缩写|patientSymptomText（而非patSymTxt）|提升医疗等敏感场景的可读性|
|文件 / 目录|前缀yyc3-[子产品缩写]-+ kebab-case|yyc3-med-nlp-processor.ts|从文件系统层面区分产品域|

            元素类型
            命名规范
            示例（以 YYC³-Med 为例）
            品牌映射意义
            类 / 接口
            前缀YYC3[子产品缩写]+ PascalCase
            YYC3MedSymptomAnalyzer
            绑定子产品（Med）与功能模块
            方法
            动词开头 + camelCase，体现 "言→语→云" 流程
            parseUserInput() → analyzeMedicalEntities() → syncToCloud()
            对应交互层→处理层→云端层的链路
            常量
            前缀YYC3_[子产品缩写]_+ UPPER_SNAKE_CASE
            YYC3_MED_MAX_RETRY=3
            明确子产品域与配置边界
            变量
            名词 / 名词短语 + camelCase，避免缩写
            patientSymptomText（而非patSymTxt）
            提升医疗等敏感场景的可读性
            文件 / 目录
            前缀yyc3-[子产品缩写]-+ kebab-case
            yyc3-med-nlp-processor.ts
            从文件系统层面区分产品域
#### 命名禁忌
- 禁止使用与品牌元素冲突的缩写（如 "yc""yy" 等易混淆组合）；
- 禁止在医疗、法律等行业子产品中使用模糊命名（如"data""info" 需具体为patientData"contractInfo"）；
- 跨行业通用模块需添加common后缀（如yyc3-common-validator.ts），避免与子产品模块重名。
### 5.2 注释规范
注释需同时满足 "技术说明" 和 "品牌链路解释"，帮助跨团队开发者理解代码与品牌架构的关联。
#### 类 / 接口注释
需明确标注所属 "言 / 语 / 云 / 立方" 层级及子产品场景：
```typescript
/**
 * 医疗症状解析器（语(Y)层核心组件）
 * 子产品：YYC³-Med
 * 功能：从患者描述中提取疾病、症状、持续时间等医学实体
 * 技术链路：接收yan层处理后的标准化文本 → 调用医疗NLP模型 → 输出结构化实体
 */
export class YYC3MedSymptomAnalyzer extends YYC3YuBase {
  // ...
}

```
#### 方法注释
需说明输入输出对应的品牌层级流转（如 "接收言层输出，传递至云层"）：
```typescript
/**
 * 同步解析结果至医疗云端知识库（云(C)层操作）
 * @param entities 语(Y)层输出的医学实体（来自YYC3MedSymptomAnalyzer）
 * @returns 云端验证后的置信度评分
 * @注意 需符合HIPAA数据加密规范（医疗行业强制要求）
 */
async syncEntitiesToMedicalCloud(entities: MedicalEntity[]): Promise<number> {
  // ...
}

```
#### 特殊标记注释
对品牌关键逻辑添加@YYC3标记，便于代码检索与审计：
```typescript
// @YYC3 立方(³)层核心逻辑：动态加载心内科模块（子产品场景适配）
if (this.department === 'cardiology') {
  this.loadModule(YYC3MedCardiologyModule);
}

```
### 5.3 格式规范
#### 基础格式（通用）
- 缩进：2 个空格（禁止使用 Tab）；
- 换行：Unix 风格（\n），文件末尾保留一空行；
- 括号：函数 / 类定义的左括号不换行（如class X {而非class X\n{）；
- 分号：语句必须以分号结尾（避免 ASI 自动插入导致的歧义）。
#### 行业特殊格式（示例）
- 医疗行业：对诊断结果相关代码添加额外空行分隔，突出核心逻辑：
```typescript
// 计算诊断置信度（医疗核心逻辑）
const confidence = this.calculateConfidence(entities);

// 单独分隔：添加临床规则校验（医疗行业特殊要求）
if (confidence < 0.7) {
  this.triggerManualReview(); // 低置信度触发人工审核
}

```
- 法律行业：对合同条款解析代码添加行内注释，标注对应法规依据：
```typescript
const validTerm = this.extractTerm(contractText, 'liability');
// 对应《民法典》第577条：违约责任条款必须明确
if (!validTerm.includes('compensation')) {
  this.addRiskFlag('missing_compensation_clause');
}

```
## 六、开发与协作规范
### 6.1 工具链配置
- 共享 ESLint 规则：所有子产品继承@yyc3/eslint-config，包含品牌命名校验（如检测YYC3前缀缺失）；
- 代码格式化：强制使用 Prettier，配置文件统一为yyc3-prettierrc.json；
- 提交规范：采用type(yyc3-[子产品]): description格式（如feat(yyc3-med): add tumor marker analysis）。
### 6.2 版本控制
- 分支命名：type/yyc3-[子产品]-feature（如fix/yyc3-leg-contract-parser）；
- 标签规范：子产品版本需包含品牌标识（如v2.3.1-yyc3-med）；
- 合并要求：核心模块（yyc3-core）的修改需经过 3 名以上跨子产品团队成员审核。
### 6.3 安全与合规
- 医疗 / 法律等敏感行业：代码中必须包含显式的权限校验与数据脱敏逻辑，并添加合规注释：
```typescript
// 医疗数据脱敏：仅保留必要字段（符合HIPAA 164.514规则）
const maskedPatientData = this.maskSensitiveFields(rawData, [
  'name', 'ssn', 'address' // 需脱敏的敏感字段
]);

```
- 云端交互：所有cloud层代码必须包含重试机制与加密传输验证：
```typescript
// 云(C)层通信：强制TLS 1.3加密与3次重试（品牌安全标准）
const cloudClient = new YYC3CloudClient({
  encryptProtocol: 'TLSv1.3',
  maxRetries: 3,
  retryDelay: 1000
});

```
## 七、实施案例
### 7.1 医疗子产品案例
#### 案例场景
患者输入症状描述："我最近 3 天一直咳嗽，伴有低烧，今天开始胸痛"，系统需完成：
1. 输入标准化（言层）→ 2. 医学实体提取（语层）→ 3. 云端知识库验证（云层）→ 4. 生成诊断建议（立方层组合结果）
#### 核心层（yyc3-core）：定义标准接口与抽象类
##### 言 (Y) 层：输入处理标准
```typescript
// 接口定义：输入输出格式规范
// yyc3-core/src/yan/interfaces/YanInterfaces.ts
export interface YanInput {
  rawText: string; // 原始输入文本
  source?: 'voice' | 'text'; // 输入来源（语音/文本）
}

export interface YanOutput {
  standardizedText: string; // 标准化后的文本
  isValid: boolean; // 输入是否有效
  timestamp: string; // 处理时间戳
}

// 抽象基类：定义输入处理的骨架流程
// yyc3-core/src/yan/abstracts/YYC3YanBase.ts
import { YanInput, YanOutput } from '../interfaces/YanInterfaces';

export abstract class YYC3YanBase {
  // 抽象方法：子产品必须实现输入标准化逻辑
  abstract processInput(input: YanInput): YanOutput;

  // 通用方法：基础输入验证（子产品可复用或重写）
  protected validateInput(rawText: string): boolean {
    return rawText.trim().length > 0 && rawText.length <= 500; // 基础校验：非空且长度合规
  }
}

```
##### 语 (Y) 层：解析处理标准
```typescript
// 接口定义：解析结果格式规范
// yyc3-core/src/yu/interfaces/YuInterfaces.ts
export interface YuEntity {
  type: string; // 实体类型（如"symptom"症状、"duration"持续时间）
  value: string; // 实体值（如"咳嗽"、"3天"）
  confidence: number; // 置信度（0-1）
}

export interface YuOutput {
  entities: YuEntity[]; // 提取的实体列表
  overallConfidence: number; // 整体置信度
}

// 抽象基类：定义解析流程骨架
// yyc3-core/src/yu/abstracts/YYC3YuBase.ts
import { YanOutput } from '../../yan/interfaces/YanInterfaces';
import { YuOutput } from '../interfaces/YuInterfaces';

export abstract class YYC3YuBase {
  // 抽象方法：子产品必须实现实体提取逻辑
  abstract analyze(yanOutput: YanOutput): YuOutput;
}

```
##### 云 (C) 层：云端交互标准
```typescript
// 接口定义：云端请求/响应格式
// yyc3-core/src/cloud/interfaces/CloudInterfaces.ts
import { YuOutput } from '../../yu/interfaces/YuInterfaces';

export interface CloudRequest {
  entities: YuOutput['entities']; // 语层提取的实体
  productCode: string; // 子产品编码（如"med"）
}

export interface CloudResponse {
  suggestions: string[]; // 云端返回的建议
  reference: string; // 参考知识库来源
}

// 抽象基类：定义云端交互骨架
// yyc3-core/src/cloud/abstracts/YYC3CloudBase.ts
import { CloudRequest, CloudResponse } from '../interfaces/CloudInterfaces';

export abstract class YYC3CloudBase {
  protected apiUrl: string; // 云端API地址（核心层通用配置）

  constructor() {
    this.apiUrl = 'https://api.yyc3.com/core'; // 核心云端基座地址
  }

  // 抽象方法：子产品必须实现云端请求逻辑
  abstract query(request: CloudRequest): Promise<CloudResponse>;
}

```
##### 立方 (³) 层：模块组合标准
```typescript
// 接口定义：模块与组合器规范
// yyc3-core/src/cube/interfaces/CubeInterfaces.ts
import { YanOutput } from '../../yan/interfaces/YanInterfaces';
import { YuOutput } from '../../yu/interfaces/YuInterfaces';
import { CloudResponse } from '../../cloud/interfaces/CloudInterfaces';

// 模块接口：所有业务模块必须实现
export interface CubeModule {
  name: string; // 模块名称
  execute: (...args: any[]) => Promise<any>; // 模块执行方法
}

// 结果组合器接口：定义最终结果格式
export interface CubeResult {
  finalSuggestions: string[]; // 最终建议
  confidence: number; // 综合置信度
  sources: {
    yan: YanOutput;
    yu: YuOutput;
    cloud: CloudResponse;
  }; // 各层原始结果
}

```
#### 子产品层（yyc3-med）：医疗特化实现
##### 医疗言 (Y) 层：症状输入标准化
```typescript
// 医疗输入处理实现类（继承核心层抽象类）
// yyc3-med/src/yan/MedicalYan.ts
import { YYC3YanBase } from '@yyc3/core/yan/abstracts/YYC3YanBase';
import { YanInput, YanOutput } from '@yyc3/core/yan/interfaces/YanInterfaces';

export class MedicalYan extends YYC3YanBase {
  // 实现核心层抽象方法：医疗场景输入标准化
  processInput(input: YanInput): YanOutput {
    // 1. 复用核心层基础验证
    const isValid = this.validateInput(input.rawText);

    // 2. 医疗特化处理：症状文本清洗（统一术语、去除冗余）
    let standardizedText = input.rawText;
    if (isValid) {
      standardizedText = this.standardizeMedicalTerms(input.rawText);
    }

    return {
      standardizedText,
      isValid,
      timestamp: new Date().toISOString()
    };
  }

  // 医疗特化工具：统一医学术语（如"低烧"→"低热"）
  private standardizeMedicalTerms(text: string): string {
    const termMap = {
      '低烧': '低热',
      '胸口疼': '胸痛',
      '咳嗽': '咳嗽' // 无需转换的术语
    };
    return Object.entries(termMap).reduce(
      (str, [key, value]) => str.replace(new RegExp(key, 'g'), value),
      text
    );
  }
}

```
##### 医疗语 (Y) 层：医学实体提取
```typescript
// 医疗解析实现类（继承核心层抽象类）
// yyc3-med/src/yu/MedicalYu.ts
import { YYC3YuBase } from '@yyc3/core/yu/abstracts/YYC3YuBase';
import { YanOutput } from '@yyc3/core/yan/interfaces/YanInterfaces';
import { YuOutput, YuEntity } from '@yyc3/core/yu/interfaces/YuInterfaces';
import { medicalNLPModel } from './nlp-med/medicalNLPModel'; // 医疗特化NLP模型

export class MedicalYu extends YYC3YuBase {
  // 实现核心层抽象方法：提取医学实体
  analyze(yanOutput: YanOutput): YuOutput {
    if (!yanOutput.isValid) {
      return { entities: [], overallConfidence: 0 };
    }

    // 调用医疗特化NLP模型提取实体（症状、持续时间等）
    const entities: YuEntity[] = medicalNLPModel.extract(yanOutput.standardizedText);

    // 计算整体置信度
    const overallConfidence = entities.length > 0
      ? entities.reduce((sum, e) => sum + e.confidence, 0) / entities.length
      : 0;

    return { entities, overallConfidence };
  }
}

// 医疗NLP模型（行业特化资源）
// yyc3-med/src/yu/nlp-med/medicalNLPModel.ts
export const medicalNLPModel = {
  extract(text: string): YuEntity[] {
    // 模拟医疗NLP提取逻辑（实际为专业模型调用）
    const entities: YuEntity[] = [];
    if (text.includes('咳嗽')) entities.push({ type: 'symptom', value: '咳嗽', confidence: 0.95 });
    if (text.includes('低热')) entities.push({ type: 'symptom', value: '低热', confidence: 0.92 });
    if (text.includes('胸痛')) entities.push({ type: 'symptom', value: '胸痛', confidence: 0.98 });
    if (text.includes('3天')) entities.push({ type: 'duration', value: '3天', confidence: 0.99 });
    return entities;
  }
};

```
##### 医疗云 (C) 层：对接医疗知识库
```typescript
// 医疗云端交互实现类（继承核心层抽象类）
// yyc3-med/src/cloud/MedicalCloud.ts
import { YYC3CloudBase } from '@yyc3/core/cloud/abstracts/YYC3CloudBase';
import { CloudRequest, CloudResponse } from '@yyc3/core/cloud/interfaces/CloudInterfaces';
import { medicalDataEncrypt } from './security/medicalEncryption'; // 医疗特化加密工具

export class MedicalCloud extends YYC3CloudBase {
  // 重写核心层API地址：使用医疗专属云端服务
  constructor() {
    super();
    this.apiUrl = 'https://api.yyc3.com/med-knowledge'; // 医疗子产品云端地址
  }

  // 实现核心层抽象方法：医疗知识库查询
  async query(request: CloudRequest): Promise<CloudResponse> {
    // 医疗特化：患者数据加密（符合HIPAA合规）
    const encryptedRequest = medicalDataEncrypt(request);

    // 调用医疗云端API（实际为HTTPS请求）
    const mockResponse = {
      suggestions: [
        '建议进行胸部X光检查',
        '考虑上呼吸道感染可能，需排除肺炎'
      ],
      reference: '中华医学会呼吸病学分会2024指南'
    };

    return mockResponse;
  }
}

```
##### 医疗立方 (³) 层：组合问诊流程
```typescript
// 医疗问诊模块（组合各层功能）
// yyc3-med/src/cube/modules/MedicalConsultModule.ts
import { CubeModule, CubeResult } from '@yyc3/core/cube/interfaces/CubeInterfaces';
import { MedicalYan } from '../../yan/MedicalYan';
import { MedicalYu } from '../../yu/MedicalYu';
import { MedicalCloud } from '../../cloud/MedicalCloud';

export class MedicalConsultModule implements CubeModule {
  name = 'medical-consult'; // 模块名称（医疗问诊）

  async execute(rawSymptom: string): Promise<CubeResult> {
    // 1. 言层：处理输入
    const yan = new MedicalYan();
    const yanOutput = yan.processInput({ rawText: rawSymptom, source: 'text' });

    // 2. 语层：提取实体
    const yu = new MedicalYu();
    const yuOutput = yu.analyze(yanOutput);

    // 3. 云层：查询知识库
    const cloud = new MedicalCloud();
    const cloudResponse = await cloud.query({
      entities: yuOutput.entities,
      productCode: 'med'
    });

    // 4. 组合最终结果
    return {
      finalSuggestions: cloudResponse.suggestions,
      confidence: yuOutput.overallConfidence,
      sources: { yan: yanOutput, yu: yuOutput, cloud: cloudResponse }
    };
  }
}

// 医疗场景组合器（复用模块适配不同场景）
// yyc3-med/src/cube/scenarios/OutpatientScenario.ts
import { CubeModule } from '@yyc3/core/cube/interfaces/CubeInterfaces';
import { MedicalConsultModule } from '../modules/MedicalConsultModule';
import { PrescriptionModule } from '../modules/PrescriptionModule'; // 处方模块（扩展功能）

// 门诊场景 = 问诊模块 + 处方模块
export class OutpatientScenario {
  private modules: CubeModule[];

  constructor() {
    this.modules = [new MedicalConsultModule(), new PrescriptionModule()];
  }

  async run(rawSymptom: string) {
    // 执行问诊模块（核心流程）
    const consultModule = this.modules.find(m => m.name === 'medical-consult');
    if (consultModule) {
      const result = await consultModule.execute(rawSymptom);
      // 若需要，调用处方模块生成用药建议
      return result;
    }
  }
}

```
#### 案例总结：代码结构与架构的映射关系
1. 核心层与子产品层的依赖：
    - 子产品层（yyc3-med）的所有类均继承核心层（yyc3-core）的抽象类，确保遵循统一接口；
    - 核心层仅定义标准，不包含业务逻辑，子产品层通过 "继承 + 重写" 实现行业特化。
2. 目录结构的严格对齐：
    - 子产品的yan/yu/cloud/cube目录与核心层一一对应，开发者可快速定位功能模块；
    - 行业专属资源（如医疗 NLP 模型、加密工具）放在子产品的domain/或层内特化目录（如yu/nlp-med/），不污染核心层。
3. "立方" 模块化优势：
    - 基础模块（如MedicalConsultModule）可组合成复杂场景（如OutpatientScenario）；
    - 新增场景（如 "急诊场景"）只需组合现有模块，无需修改核心代码，体现 "立方" 的扩展性。
### 7.2 项目落地实施建议
#### 项目初始化：从目录结构奠定基础
##### 1. 采用 Monorepo 管理多产品
推荐使用pnpm workspace或lerna搭建 Monorepo 架构，将核心层与子产品层纳入统一仓库管理，便于依赖共享与版本协同：
```plaintext
project-root/
├── packages/
│   ├── yyc3-core/           # 核心层（必选）
│   ├── yyc3-med/            # 医疗子产品（示例）
│   ├── yyc3-edu/            # 教育子产品（示例）
│   └── yyc3-cli/            # 可选：自动化工具（如模块生成器）
├── package.json             # 根目录配置（管理workspace）
└── tsconfig.base.json       # 共享TypeScript配置

```
优势：
- 核心层更新后，所有子产品可同步依赖最新版本（通过workspace:*语法）；
- 避免重复安装依赖，降低磁盘占用与构建时间。
##### 2. 核心层初始化：先定标准再写代码
核心层是所有子产品的基础，需优先完成以下工作：
- 定义接口规范：在yyc3-core/src/*/interfaces中明确各层输入输出格式（如YanInput必须包含sourceType: 'voice'|'text'）；
- 实现抽象类：在yyc3-core/src/*/abstracts中封装通用流程（如YYC3CloudBase内置 "连接→加密→重试" 的基础逻辑）；
- 提供基础工具：在yyc3-core/src/common中实现跨场景复用的工具（如YYC3Validator通用校验器、YYC3EventBus事件总线）。
示例：核心言层抽象类定义（约束子产品实现）
```typescript
// yyc3-core/src/yan/abstracts/YYC3YanBase.ts
export abstract class YYC3YanBase {
  // 强制子产品实现输入处理逻辑
  abstract processInput(rawInput: string): YanOutput;

  // 提供通用默认实现（子产品可覆盖）
  validateBasicInput(input: string): boolean {
    return typeof input === 'string' && input.trim().length > 0;
  }
}

```
##### 3. 子产品初始化：遵循 "继承 + 特化" 原则
新建子产品（如yyc3-leg法律子产品）时，目录结构需严格对齐核心层，并通过继承实现特化：
```bash
# 新建法律子产品目录（可通过脚本自动化）
mkdir -p packages/yyc3-leg/src/{yan,yu,cloud,cube,domain}

```
关键步骤：
- 每个子产品的yan/yu/cloud层必须实现核心层对应的抽象类（如LegalYan extends YYC3YanBase）；
- 在domain目录中存放行业专属资源（如法律子产品的domain/constants/law-types.ts定义法条类型）；
- 在cube/modules中封装行业业务模块（如法律子产品的 "合同解析模块"）。
#### 模块化开发：按 "立方三维" 拆分功能
##### 1. 横向（X 轴）：明确子产品边界
- 禁止跨子产品依赖：yyc3-med与yyc3-edu不得直接互相引用，如需共享功能，需将代码抽离到yyc3-core/common；
- 子产品命名空间隔离：所有子产品的类 / 函数需添加子产品前缀（如LegalYu而非Yu），避免全局命名冲突；
- 资源私有化：行业专属配置（如医疗的医院编码规则）仅放在子产品的domain目录，不暴露给其他产品。
##### 2. 纵向（Y 轴）：严格遵循 "言→语→云" 链路
- 数据流转单向性：确保数据只能从 "言层→语层→云层" 传递，禁止反向调用（如语层不得修改言层的原始输入）；
- 接口适配层：若子产品需对接外部系统（如医疗子产品对接医院 HIS 系统），适配逻辑需放在cloud/adapters中，避免污染核心流程；
- 分层测试：为每层编写单元测试（如言层测试输入标准化逻辑，语层测试实体提取准确率），确保链路稳定。
示例：法律子产品的链路实现
```typescript
// 1. 言层：处理法律文本输入（清洗格式、去除冗余）
const legalYan = new LegalYan();
const standardizedText = legalYan.processInput(contractRawText);

// 2. 语层：提取法律实体（条款类型、责任主体等）
const legalYu = new LegalYu();
const legalEntities = legalYu.analyze(standardizedText);

// 3. 云层：调用法律数据库验证条款合规性
const legalCloud = new LegalCloud();
const complianceResult = await legalCloud.verify(legalEntities);

```
##### 3. 深度（Z 轴）：模块组合适配场景
- 基础模块原子化：cube/base目录的模块需最小化（如 "文本分词模块""日期解析模块"），确保可复用；
- 业务模块组合化：cube/business目录的模块通过组合基础模块实现完整流程（如 "合同审核模块"="文本分词 + 实体提取 + 合规校验"）；
- 场景模块配置化：cube/scenarios目录通过 JSON 配置动态组合业务模块，避免硬编码（如不同律所可自定义审核流程）。
示例：场景模块配置文件（法律子产品）
```json
// yyc3-leg/src/cube/scenarios/corporate-contract.json
{
  "name": "企业合同审核场景",
  "mainModule": "contract-verify",  // 主业务模块
  "extensions": ["risk-assessment", "termination-clause-check"],  // 扩展模块
  "config": {
    "strictMode": true,  // 企业合同启用严格校验
    "timeout": 30000
  }
}

```
#### 依赖管理：保持层级清晰
1. 核心层依赖纯净：
    - 仅依赖通用性强的基础库（如lodash、rxjs），禁止引入行业特化库（如医疗领域的dicom-parser）；
    - 所有依赖需在package.json中明确标注peerDependencies，由子产品自行安装适配版本。
2. 子产品依赖收敛：
    - 必须依赖yyc3-core（指定版本范围，如^2.0.0），确保与核心层兼容；
    - 行业特化依赖（如医疗的medical-nlp-model）仅在子产品中安装，且通过domain/services封装，避免暴露给其他层。
3. 禁止循环依赖：
    - 使用depcheck工具定期检测依赖环；
    - 子产品内部各层依赖需遵循 "yan→yu→cloud→cube" 的顺序，禁止反向依赖。
#### 扩展性保障：支持新场景快速接入
##### 1. 新增子产品的快速适配
当需要开发新行业子产品（如yyc3-fin金融子产品）时，只需：
1. 复制子产品基础目录结构（可通过yyc3-cli自动生成）；
2. 在yan/yu/cloud层实现核心抽象类，添加金融特化逻辑（如言层处理金融术语，语层识别 "利率""还款日" 等实体）；
3. 在cube层组合模块，适配金融场景（如 "信贷审核""风险评估"）。
##### 2. 现有子产品的功能扩展
- 新增场景：无需修改核心代码，只需在cube/scenarios中添加新配置（如医疗子产品新增 "儿科问诊" 场景）；
- 优化算法：子产品的语层可独立升级 NLP 模型（如医疗 NLP 从 v2.3 升级到 v3.0），不影响核心层与其他子产品；
- 对接新系统：在子产品cloud/adapters中添加新适配器（如医疗子产品对接新医院的 HIS 系统）。
#### 团队协作：制定配套规范
1. 代码审查重点：
    - 子产品是否正确继承核心层抽象类；
    - 命名是否符合 "子产品前缀 + 功能描述" 规则；
    - 是否存在跨子产品依赖或循环依赖。
2. 文档规范：
    - 核心层接口需生成 API 文档（使用typedoc），明确各抽象类的职责；
    - 子产品需在README.md中说明 "行业特化点"（如医疗子产品的 HIPAA 合规实现）；
    - 模块组合关系需通过可视化工具（如 Mermaid）绘制流程图。
3. 版本管理：
    - 核心层遵循语义化版本（如 v2.1.0 表示新增接口，v3.0.0 表示不兼容变更）；
    - 子产品版本需关联核心层版本（如yyc3-med@2.3.0依赖yyc3-core@2.3.x）。
#### 总结
在项目中落地 YYC³ 代码结构的核心是：用核心层定标准，用子产品做特化，用立方模块组场景。通过严格的目录划分、接口约束和依赖管理，既能保证跨行业产品的品牌统一性，又能让各子产品灵活适配业务需求。实际开发中，建议先搭建最小化核心框架，再通过 1-2 个试点子产品验证结构合理性，逐步完善后再大规模推广。
## 八、行业场景标准化文件树结构
### 核心架构层（母品牌）
```plaintext
YYC3-packages/
├── yyc3-core/                # 母品牌核心模块（必选）
│   ├── yan/                  # 言(Y)层：交互输入处理
│   │   ├── src/
│   │   │   ├── input/        # 多模态输入处理
│   │   │   ├── preprocess/   # 数据预处理
│   │   │   └── validation/   # 输入验证
│   │   └── package.json
│   │
│   ├── yu/                   # 语(Y)层：智能解析核心
│   │   ├── src/
│   │   │   ├── nlp/          # 自然语言处理
│   │   │   ├── knowledge/    # 知识图谱
│   │   │   └── reasoning/    # 逻辑推理
│   │   └── package.json
│   │
│   ├── cloud/                # 云(C)层：云端适配接口
│   │   ├── src/
│   │   │   ├── storage/      # 云存储接口
│   │   │   ├── compute/      # 计算资源调度
│   │   │   └── networking/   # 网络通信
│   │   └── package.json
│   │
│   └── cube/                 # 立方(³)层：模块管理框架
│       ├── src/
│       │   ├── registry/     # 模块注册中心
│       │   ├── orchestrator/ # 模块编排引擎
│       │   └── lifecycle/    # 生命周期管理
│       └── package.json

```
### 行业子产品标准化结构
#### 1. 医疗健康 (yyc3-med)
```plaintext
├── yyc3-med/
│   ├── yan/                  # 医疗场景输入适配
│   │   ├── src/
│   │   │   ├── symptom/      # 症状文本清洗
│   │   │   ├── imaging/      # 医学影像预处理
│   │   │   └── vital/        # 生命体征解析
│   │   └── package.json
│   │
│   ├── yu/                   # 医疗NLP处理
│   │   ├── src/
│   │   │   ├── entity/       # 疾病实体识别
│   │   │   ├── relation/     # 医学关系抽取
│   │   │   └── diagnosis/    # 辅助诊断推理
│   │   └── package.json
│   │
│   ├── cloud/                # 医疗云端接口
│   │   ├── src/
│   │   │   ├── his/          # 医院信息系统对接
│   │   │   ├── emr/          # 电子病历接口
│   │   │   └── pac/          # 影像归档通信
│   │   └── package.json
│   │
│   └── cube/                 # 医疗模块组合器
│       ├── src/
│       │   ├── triage/       # 分诊流程编排
│       │   ├── treatment/    # 治疗方案生成
│       │   └── monitoring/   # 健康监测模块
│       └── package.json

```
#### 2. 实体经营 (yyc3-ent)
```plaintext
├── yyc3-ent/
│   ├── yan/                  # 实体经营输入适配
│   │   ├── src/
│   │   │   ├── inventory/    # 库存数据解析
│   │   │   ├── sales/        # 销售数据清洗
│   │   │   └── customer/     # 客户反馈处理
│   │   └── package.json
│   │
│   ├── yu/                   # 经营智能分析
│   │   ├── src/
│   │   │   ├── forecast/     # 销售预测
│   │   │   ├── optimization/ # 运营优化
│   │   │   └── insight/      # 商业洞察
│   │   └── package.json
│   │
│   ├── cloud/                # 经营云端接口
│   │   ├── src/
│   │   │   ├── erp/          # ERP系统对接
│   │   │   ├── crm/          # CRM系统接口
│   │   │   └── scm/          # 供应链管理
│   │   └── package.json
│   │
│   └── cube/                 # 经营模块组合器
│       ├── src/
│       │   ├── procurement/  # 采购管理
│       │   ├── production/   # 生产计划
│       │   └── retail/       # 零售管理
│       └── package.json

```
#### 3. 教育-义务教育 (yyc3-edu-basic)
```plaintext
├── yyc3-edu-basic/
│   ├── yan/                  # 义务教育输入适配
│   │   ├── src/
│   │   │   ├── homework/     # 作业识别
│   │   │   ├── exam/         # 试卷解析
│   │   │   └── classroom/    # 课堂行为捕捉
│   │   └── package.json
│   │
│   ├── yu/                   # 义务教育知识处理
│   │   ├── src/
│   │   │   ├── curriculum/   # 课标知识图谱
│   │   │   ├── pedagogy/     # 教学法推理
│   │   │   └── assessment/   # 学习评估
│   │   └── package.json
│   │
│   ├── cloud/                # 义务教育云端接口
│   │   ├── src/
│   │   │   ├── lms/          # 学习管理系统
│   │   │   ├── sis/          # 学生信息系统
│   │   │   └── library/      # 数字图书馆
│   │   └── package.json
│   │
│   └── cube/                 # 义务教育模块组合器
│       ├── src/
│       │   ├── math/         # 数学教学模块
│       │   ├── language/     # 语言教学模块
│       │   └── science/      # 科学实验模块
│       └── package.json

```
#### 4. 教育-高等教育 (yyc3-edu-higher)
```plaintext
├── yyc3-edu-higher/
│   ├── yan/                  # 高等教育输入适配
│   │   ├── src/
│   │   │   ├── research/     # 科研数据解析
│   │   │   ├── lecture/      # 讲座内容处理
│   │   │   └── lab/          # 实验数据采集
│   │   └── package.json
│   │
│   ├── yu/                   # 高等教育知识处理
│   │   ├── src/
│   │   │   ├── domain/       # 学科知识图谱
│   │   │   ├── citation/     # 文献引用分析
│   │   │   └── innovation/   # 创新能力评估
│   │   └── package.json
│   │
│   ├── cloud/                # 高等教育云端接口
│   │   ├── src/
│   │   │   ├── lms/          # 高教LMS系统
│   │   │   ├── research/     # 科研管理平台
│   │   │   └── campus/       # 智慧校园系统
│   │   └── package.json
│   │
│   └── cube/                 # 高等教育模块组合器
│       ├── src/
│       │   ├── engineering/  # 工程教学模块
│       │   ├── medical/      # 医学教学模块
│       │   └── business/     # 商科教学模块
│       └── package.json

```
#### 5. 股票金融 (yyc3-fin)
```plaintext
├── yyc3-fin/
│   ├── yan/                  # 金融场景输入适配
│   │   ├── src/
│   │   │   ├── market/       # 行情数据解析
│   │   │   ├── news/         # 财经新闻处理
│   │   │   └── report/       # 研报文本清洗
│   │   └── package.json
│   │
│   ├── yu/                   # 金融智能分析
│   │   ├── src/
│   │   │   ├── quant/        # 量化策略生成
│   │   │   ├── risk/         # 风险评估模型
│   │   │   └── sentiment/    # 情绪分析
│   │   └── package.json
│   │
│   ├── cloud/                # 金融云端接口
│   │   ├── src/
│   │   │   ├── exchange/     # 交易所接口
│   │   │   ├── data/         # 金融数据服务
│   │   │   └── compliance/   # 合规监管接口
│   │   └── package.json
│   │
│   └── cube/                 # 金融模块组合器
│       ├── src/
│       │   ├── trading/      # 交易执行模块
│       │   ├── portfolio/    # 投资组合管理
│       │   └── analysis/     # 市场分析模块
│       └── package.json

```
#### 6. 技术集成-API (yyc3-api)
```plaintext
├── yyc3-api/
│   ├── yan/                  # API输入适配
│   │   ├── src/
│   │   │   ├── request/      # API请求解析
│   │   │   ├── validation/   # 参数验证
│   │   │   └── auth/         # 身份认证
│   │   └── package.json
│   │
│   ├── yu/                   # API智能处理
│   │   ├── src/
│   │   │   ├── orchestrate/  # API编排
│   │   │   ├── transform/    # 数据转换
│   │   │   └── monitor/      # 性能监控
│   │   └── package.json
│   │
│   ├── cloud/                # API云端接口
│   │   ├── src/
│   │   │   ├── gateway/      # API网关
│   │   │   ├── registry/     # 服务注册中心
│   │   │   └── discovery/    # 服务发现
│   │   └── package.json
│   │
│   └── cube/                 # API模块组合器
│       ├── src/
│       │   ├── rest/         # REST API模块
│       │   ├── graphql/      # GraphQL模块
│       │   └── websocket/    # WebSocket模块
│       └── package.json

```
#### 7. 智慧农业 (yyc3-agr)
```plaintext
├── yyc3-agr/
│   ├── yan/                  # 农业场景输入适配
│   │   ├── src/
│   │   │   ├── sensor/       # 传感器数据解析
│   │   │   ├── satellite/    # 遥感影像处理
│   │   │   └── weather/      # 气象数据清洗
│   │   └── package.json
│   │
│   ├── yu/                   # 农业智能分析
│   │   ├── src/
│   │   │   ├── crop/         # 作物生长模型
│   │   │   ├── pest/         # 病虫害识别
│   │   │   └── yield/        # 产量预测
│   │   └── package.json
│   │
│   ├── cloud/                # 农业云端接口
│   │   ├── src/
│   │   │   ├── iot/          # 农业IoT平台
│   │   │   ├── drone/        # 农业无人机系统
│   │   │   └── irrigation/   # 智能灌溉系统
│   │   └── package.json
│   │
│   └── cube/                 # 农业模块组合器
│       ├── src/
│       │   ├── planting/     # 种植管理模块
│       │   ├── harvesting/   # 收获优化模块
│       │   └── supply/       # 供应链管理
│       └── package.json

```
#### 8. 智慧养老 (yyc3-elder)
```plaintext
├── yyc3-elder/
│   ├── yan/                  # 养老场景输入适配
│   │   ├── src/
│   │   │   ├── vital/        # 生命体征监测
│   │   │   ├── activity/     # 活动识别
│   │   │   └── emergency/    # 紧急事件检测
│   │   └── package.json
│   │
│   ├── yu/                   # 养老智能分析
│   │   ├── src/
│   │   │   ├── health/       # 健康状态评估
│   │   │   ├── behavior/     # 行为模式分析
│   │   │   └── risk/         # 跌倒风险预测
│   │   └── package.json
│   │
│   ├── cloud/                # 养老云端接口
│   │   ├── src/
│   │   │   ├── medical/      # 医疗系统对接
│   │   │   ├── family/       # 家属通知系统
│   │   │   └── community/     # 社区服务接口
│   │   └── package.json
│   │
│   └── cube/                 # 养老模块组合器
│       ├── src/
│       │   ├── monitoring/   # 健康监测模块
│       │   ├── reminder/     # 用药提醒模块
│       │   └── companionship/ # 陪伴服务模块
│       └── package.json

```
#### 9. 智能文创 (yyc3-cultural)
```plaintext
├── yyc3-cultural/
│   ├── yan/                  # 文创场景输入适配
│   │   ├── src/
│   │   │   ├── content/      # 创意内容解析
│   │   │   ├── style/        # 艺术风格识别
│   │   │   └── trend/        # 流行趋势分析
│   │   └── package.json
│   │
│   ├── yu/                   # 文创智能处理
│   │   ├── src/
│   │   │   ├── creation/     # 创意生成
│   │   │   ├── copyright/    # 版权保护
│   │   │   └── valuation/    # 价值评估
│   │   └── package.json
│   │
│   ├── cloud/                # 文创云端接口
│   │   ├── src/
│   │   │   ├── marketplace/  # 文创市场平台
│   │   │   ├── ipr/          # 知识产权保护
│   │   │   └── collaboration/ # 创作者协作
│   │   └── package.json
│   │
│   └── cube/                 # 文创模块组合器
│       ├── src/
│       │   ├── design/       # 设计工具模块
│       │   ├── music/        # 音乐创作模块
│       │   └── art/          # 艺术生成模块
│       └── package.json

```
#### 10. 智慧物流 (yyc3-log)
```plaintext
├── yyc3-log/
│   ├── yan/                  # 物流场景输入适配
│   │   ├── src/
│   │   │   ├── tracking/     # 货物追踪数据
│   │   │   ├── route/        # 路线信息解析
│   │   │   └── warehouse/    # 仓储数据清洗
│   │   └── package.json
│   │
│   ├── yu/                   # 物流智能分析
│   │   ├── src/
│   │   │   ├── optimization/ # 路径优化
│   │   │   ├── forecast/     # 需求预测
│   │   │   └── scheduling/   # 调度算法
│   │   └── package.json
│   │
│   ├── cloud/                # 物流云端接口
│   │   ├── src/
│   │   │   ├── tms/          # 运输管理系统
│   │   │   ├── wms/          # 仓储管理系统
│   │   │   └── fleet/        # 车队管理系统
│   │   └── package.json
│   │
│   └── cube/                 # 物流模块组合器
│       ├── src/
│       │   ├── delivery/     # 配送管理模块
│       │   ├── inventory/    # 库存管理模块
│       │   └── crossdock/    # 越库作业模块
│       └── package.json

```
#### 11. 智慧零售 (yyc3-retail)
```plaintext
├── yyc3-retail/
│   ├── yan/                  # 零售场景输入适配
│   │   ├── src/
│   │   │   ├── customer/     # 顾客行为数据
│   │   │   ├── product/      # 商品信息解析
│   │   │   └── transaction/  # 交易数据清洗
│   │   └── package.json
│   │
│   ├── yu/                   # 零售智能分析
│   │   ├── src/
│   │   │   ├── recommendation/ # 个性化推荐
│   │   │   ├── pricing/      # 动态定价
│   │   │   └── merchandising/ # 商品陈列优化
│   │   └── package.json
│   │
│   ├── cloud/                # 零售云端接口
│   │   ├── src/
│   │   │   ├── pos/          # POS系统接口
│   │   │   ├── crm/          # 客户关系管理
│   │   │   └── inventory/    # 库存管理系统
│   │   └── package.json
│   │
│   └── cube/                 # 零售模块组合器
│       ├── src/
│       │   ├── store/        # 门店管理模块
│       │   ├── ecommerce/   # 电商模块
│       │   └── loyalty/      # 会员管理模块
│       └── package.json

```
#### 12. 智慧制造 (yyc3-manu)
```plaintext
├── yyc3-manu/
│   ├── yan/                  # 制造场景输入适配
│   │   ├── src/
│   │   │   ├── equipment/    # 设备状态数据
│   │   │   ├── production/   # 生产数据解析
│   │   │   └── quality/      # 质量检测数据
│   │   └── package.json
│   │
│   ├── yu/                   # 制造智能分析
│   │   ├── src/
│   │   │   ├── predictive/   # 预测性维护
│   │   │   ├── optimization/ # 生产优化
│   │   │   └── defect/       # 缺陷检测
│   │   └── package.json
│   │
│   ├── cloud/                # 制造云端接口
│   │   ├── src/
│   │   │   ├── mes/          # 制造执行系统
│   │   │   ├── erp/          # 企业资源计划
│   │   │   └── scada/        # 监控控制系统
│   │   └── package.json
│   │
│   └── cube/                 # 制造模块组合器
│       ├── src/
│       │   ├── assembly/     # 装配线管理
│       │   ├── maintenance/  # 设备维护
│       │   └── quality/      # 质量控制
│       └── package.json

```
#### 13. 能源管理 (yyc3-energy)
```plaintext
├── yyc3-energy/
│   ├── yan/                  # 能源场景输入适配
│   │   ├── src/
│   │   │   ├── consumption/  # 能耗数据解析
│   │   │   ├── generation/   # 发电数据
│   │   │   └── grid/         # 电网状态
│   │   └── package.json
│   │
│   ├── yu/                   # 能源智能分析
│   │   ├── src/
│   │   │   ├── optimization/ # 能耗优化
│   │   │   ├── forecast/     # 负荷预测
│   │   │   └── trading/      # 电力交易
│   │   └── package.json
│   │
│   ├── cloud/                # 能源云端接口
│   │   ├── src/
│   │   │   ├── scada/        # 能源监控系统
│   │   │   ├── smartgrid/    # 智能电网接口
│   │   │   └── renewable/    # 可再生能源
│   │   └── package.json
│   │
│   └── cube/                 # 能源模块组合器
│       ├── src/
│       │   ├── monitoring/   # 能耗监测
│       │   ├── storage/      # 储能管理
│       │   └── distribution/ # 配电优化
│       └── package.json

```
#### 14. 环境保护 (yyc3-env)
```plaintext
├── yyc3-env/
│   ├── yan/                  # 环保场景输入适配
│   │   ├── src/
│   │   │   ├── sensor/       # 环境传感器数据
│   │   │   ├── satellite/    # 遥感监测数据
│   │   │   └── report/       # 环保报告解析
│   │   └── package.json
│   │
│   ├── yu/                   # 环保智能分析
│   │   ├── src/
│   │   │   ├── pollution/    # 污染源识别
│   │   │   ├── prediction/   # 环境预测
│   │   │   └── assessment/   # 环境影响评估
│   │   └── package.json
│   │
│   ├── cloud/                # 环保云端接口
│   │   ├── src/
│   │   │   ├── monitoring/   # 环境监测平台
│   │   │   ├── compliance/   # 合规监管系统
│   │   │   └── emergency/    # 应急响应系统
│   │   └── package.json
│   │
│   └── cube/                 # 环保模块组合器
│       ├── src/
│       │   ├── air/          # 空气质量监测
│       │   ├── water/        # 水质管理
│       │   └── waste/        # 废弃物处理
│       └── package.json

```
#### 15. 旅游酒店 (yyc3-tourism)
```plaintext
├── yyc3-tourism/
│   ├── yan/                  # 旅游场景输入适配
│   │   ├── src/
│   │   │   ├── booking/      # 预订数据解析
│   │   │   ├── review/       # 评价文本处理
│   │   │   └── behavior/     # 游客行为分析
│   │   └── package.json
│   │
│   ├── yu/                   # 旅游智能分析
│   │   ├── src/
│   │   │   ├── recommendation/ # 景点推荐
│   │   │   ├── pricing/      # 动态定价
│   │   │   └── sentiment/    # 游客情绪分析
│   │   └── package.json
│   │
│   ├── cloud/                # 旅游云端接口
│   │   ├── src/
│   │   │   ├── pms/          # 酒店管理系统
│   │   │   ├── crm/          # 客户关系管理
│   │   │   └── distribution/ # 分销系统
│   │   └── package.json
│   │
│   └── cube/                 # 旅游模块组合器
│       ├── src/
│       │   ├── hotel/        # 酒店管理模块
│       │   ├── attraction/   # 景点管理模块
│       │   └── tour/         # 旅行团管理
│       └── package.json

```
#### 16. 法律行业 (yyc3-law)
```plaintext
├── yyc3-law/
│   ├── yan/                  # 法律场景输入适配
│   │   ├── src/
│   │   │   ├── document/     # 法律文书解析
│   │   │   ├── case/         # 案例数据清洗
│   │   │   └── regulation/   # 法规文本处理
│   │   └── package.json
│   │
│   ├── yu/                   # 法律智能分析
│   │   ├── src/
│   │   │   ├── retrieval/    # 法律检索
│   │   │   ├── reasoning/    # 法律推理
│   │   │   └── prediction/   # 判决预测
│   │   └── package.json
│   │
│   ├── cloud/                # 法律云端接口
│   │   ├── src/
│   │   │   ├── library/      # 法律数据库
│   │   │   ├── court/        # 法院系统接口
│   │   │   └── compliance/   # 合规检查
│   │   └── package.json
│   │
│   └── cube/                 # 法律模块组合器
│       ├── src/
│       │   ├── contract/     # 合同管理
│       │   ├── litigation/   # 诉讼支持
│       │   └── advisory/     # 法律咨询
│       └── package.json

```
#### 17. 人力资源 (yyc3-hr)
```plaintext
├── yyc3-hr/
│   ├── yan/                  # HR场景输入适配
│   │   ├── src/
│   │   │   ├── resume/       # 简历解析
│   │   │   ├── interview/    # 面试数据处理
│   │   │   └── performance/  # 绩效数据清洗
│   │   └── package.json
│   │
│   ├── yu/                   # HR智能分析
│   │   ├── src/
│   │   │   ├── matching/     # 人岗匹配
│   │   │   ├── assessment/   # 能力评估
│   │   │   └── retention/    # 离职预测
│   │   └── package.json
│   │
│   ├── cloud/                # HR云端接口
│   │   ├── src/
│   │   │   ├── hris/         # 人力资源系统
│   │   │   ├── payroll/      # 薪资系统
│   │   │   └── training/     # 培训系统
│   │   └── package.json
│   │
│   └── cube/                 # HR模块组合器
│       ├── src/
│       │   ├── recruitment/  # 招聘管理
│       │   ├── onboarding/   # 入职管理
│       │   └── development/  # 员工发展
│       └── package.json

```
#### 18. 媒体娱乐 (yyc3-media)
```plaintext
├── yyc3-media/
│   ├── yan/                  # 媒体场景输入适配
│   │   ├── src/
│   │   │   ├── content/      # 内容元数据解析
│   │   │   ├── user/         # 用户行为数据
│   │   │   └── social/       # 社交媒体数据
│   │   └── package.json
│   │
│   ├── yu/                   # 媒体智能分析
│   │   ├── src/
│   │   │   ├── recommendation/ # 内容推荐
│   │   │   ├── tagging/      # 内容标签
│   │   │   └── trend/        # 热点预测
│   │   └── package.json
│   │
│   ├── cloud/                # 媒体云端接口
│   │   ├── src/
│   │   │   ├── cms/          # 内容管理系统
│   │   │   ├── cdn/          # 内容分发网络
│   │   │   └── analytics/    # 用户分析系统
│   │   └── package.json
│   │
│   └── cube/                 # 媒体模块组合器
│       ├── src/
│       │   ├── video/        # 视频处理模块
│       │   ├── audio/        # 音频处理模块
│       │   └── live/         # 直播模块
│       └── package.json

```
#### 19. 餐饮行业 (yyc3-fb)
```plaintext
├── yyc3-fb/
│   ├── yan/                  # 餐饮场景输入适配
│   │   ├── src/
│   │   │   ├── order/        # 订单数据解析
│   │   │   ├── inventory/    # 库存数据清洗
│   │   │   └── customer/     # 顾客反馈处理
│   │   └── package.json
│   │
│   ├── yu/                   # 餐饮智能分析
│   │   ├── src/
│   │   │   ├── menu/         # 菜单优化
│   │   │   ├── pricing/      # 动态定价
│   │   │   └── waste/        # 浪费分析
│   │   └── package.json
│   │
│   ├── cloud/                # 餐饮云端接口
│   │   ├── src/
│   │   │   ├── pos/          # POS系统接口
│   │   │   ├── inventory/    # 库存管理系统
│   │   │   └── delivery/     # 配送系统
│   │   └── package.json
│   │
│   └── cube/                 # 餐饮模块组合器
│       ├── src/
│       │   ├── kitchen/      # 厨房管理
│       │   ├── service/      # 服务管理
│       │   └── loyalty/      # 会员管理
│       └── package.json

```
#### 20. 智能交通 (yyc3-traffic)
```plaintext
├── yyc3-traffic/
│   ├── yan/                  # 交通场景输入适配
│   │   ├── src/
│   │   │   ├── camera/       # 摄像头数据解析
│   │   │   ├── sensor/       # 交通传感器数据
│   │   │   └── vehicle/      # 车辆信息处理
│   │   └── package.json
│   │
│   ├── yu/                   # 交通智能分析
│   │   ├── src/
│   │   │   ├── flow/         # 交通流分析
│   │   │   ├── prediction/   # 拥堵预测
│   │   │   └── optimization/ # 信号优化
│   │   └── package.json
│   │
│   ├── cloud/                # 交通云端接口
│   │   ├── src/
│   │   │   ├── its/          # 智能交通系统
│   │   │   ├── vms/          # 车辆管理系统
│   │   │   └── emergency/    # 应急响应系统
│   │   └── package.json
│   │
│   └── cube/                 # 交通模块组合器
│       ├── src/
│       │   ├── signal/       # 信号控制
│       │   ├── route/        # 路线规划
│       │   └── enforcement/  # 执法管理
│       └── package.json

```
#### 21. 地产建筑 (yyc3-real)
```plaintext
├── yyc3-real/
│   ├── yan/                  # 地产场景输入适配
│   │   ├── src/
│   │   │   ├── property/     # 房产数据解析
│   │   │   ├── construction/ # 建筑数据
│   │   │   └── market/       # 市场信息清洗
│   │   └── package.json
│   │
│   ├── yu/                   # 地产智能分析
│   │   ├── src/
│   │   │   ├── valuation/    # 房产估值
│   │   │   ├── design/       # 建筑设计优化
│   │   │   └── investment/   # 投资分析
│   │   └── package.json
│   │
│   ├── cloud/                # 地产云端接口
│   │   ├── src/
│   │   │   ├── crm/          # 客户关系管理
│   │   │   ├── project/      # 项目管理系统
│   │   │   └── bim/          # 建筑信息模型
│   │   └── package.json
│   │
│   └── cube/                 # 地产模块组合器
│       ├── src/
│       │   ├── sales/        # 销售管理
│       │   ├── development/  # 开发管理
│       │   └── facility/     # 设施管理
│       └── package.json

```
#### 22. 智慧城市 (yyc3-gov)
```plaintext
├── yyc3-gov/
│   ├── yan/                  # 政务场景输入适配
│   │   ├── src/
│   │   │   ├── citizen/      # 公民请求数据
│   │   │   ├── document/     # 政务文书解析
│   │   │   └── service/      # 服务数据清洗
│   │   └── package.json
│   │
│   ├── yu/                   # 政务智能分析
│   │   ├── src/
│   │   │   ├── processing/   # 流程自动化
│   │   │   ├── decision/     # 决策支持
│   │   │   └── compliance/   # 合规检查
│   │   └── package.json
│   │
│   ├── cloud/                # 政务云端接口
│   │   ├── src/
│   │   │   ├── egov/         # 电子政务平台
│   │   │   ├── id/           # 身份认证系统
│   │   │   └── data/         # 政务数据共享
│   │   └── package.json
│   │
│   └── cube/                 # 政务模块组合器
│       ├── src/
│       │   ├── permit/       # 许可证管理
│       │   ├── tax/          # 税务管理
│       │   └── social/       # 社保管理
│       └── package.json

```
#### 23.智慧教育（yyc-edu）
```typescript
├── yyc3-edu/  # 智慧教育体系
│
├── yan/                  # 统一输入适配层
│   ├── basic/            # 义务教育输入适配
│   │   ├── src/
│   │   │   ├── homework/ # 作业识别
│   │   │   ├── exam/     # 试卷解析
│   │   │   └── classroom/# 课堂行为捕捉
│   │   └── package.json
│   │
│   ├── higher/           # 高等教育输入适配
│   │   ├── src/
│   │   │   ├── research/ # 科研数据解析
│   │   │   ├── lecture/  # 讲座内容处理
│   │   │   └── lab/      # 实验数据采集
│   │   └── package.json
│
├── yu/                   # 统一知识处理层
│   ├── basic/            # 义务教育知识处理
│   │   ├── src/
│   │   │   ├── curriculum/# 课标知识图谱
│   │   │   ├── pedagogy/ # 教学法推理
│   │   │   └── assessment/# 学习评估
│   │   └── package.json
│   │
│   ├── higher/           # 高等教育知识处理
│   │   ├── src/
│   │   │   ├── domain/   # 学科知识图谱
│   │   │   ├── citation/ # 文献引用分析
│   │   │   └── innovation/# 创新能力评估
│   │   └── package.json
│
├── cloud/                # 统一云端接口层
│   ├── basic/            # 义务教育云端接口
│   │   ├── src/
│   │   │   ├── lms/      # 学习管理系统
│   │   │   ├── sis/      # 学生信息系统
│   │   │   └── library/  # 数字图书馆
│   │   └── package.json
│   │
│   ├── higher/           # 高等教育云端接口
│   │   │   ├── lms/      # 学习管理系统
│   │   │   ├── research/ # 科研管理平台
│   │   │   └── campus/   # 智慧校园系统
│   │   └── package.json
│
├── cube/                 # 统一模块组合器
│   ├── basic/            # 义务教育模块组合
│   │   ├── src/
│   │   │   ├── math/     # 数学教学模块
│   │   │   ├── language/ # 语言教学模块
│   │   │   └── science/  # 科学实验模块
│   │   └── package.json
│   │
│   ├── higher/           # 高等教育模块组合
│   │   ├── src/
│   │   │   ├── engineering/ # 工程教学模块
│   │   │   ├── medical/     # 医学教学模块
│   │   │   └── business/    # 商科教学模块
│   │   └── package.json
```
#### 24.智能编程（yyc3-core）
```typescript
yyc3-core/
├── src/
│   ├── yan/                  # 言(Y)层：输入处理基础
│   │   ├── interfaces/       # 输入处理接口（IYanInput, IYanOutput等）
│   │   ├── abstracts/        # 抽象类（YYC3YanBase）
│   │   ├── validators/       # 输入验证器（YanValidator）
│   │   └── index.ts          # 导出公共API
│   │
│   ├── yu/                   # 语(Y)层：智能解析基础
│   │   ├── interfaces/       # 解析接口（IYuParser, IYuEntity等）
│   │   ├── abstracts/        # 抽象类（YYC3YuBase）
│   │   ├── nlp-base/         # 基础NLP工具
│   │   └── index.ts          # 导出公共API
│   │
│   ├── cloud/                # 云(C)层：云端交互基础
│   │   ├── interfaces/       # 云端接口（ICloudClient, ICloudConfig等）
│   │   ├── abstracts/        # 抽象类（YYC3CloudBase）
│   │   ├── security/         # 安全工具（加密、认证等）
│   │   └── index.ts          # 导出公共API
│   │
│   ├── cube/                 # 立方(³)层：模块管理
│   │   ├── interfaces/       # 模块接口（IModule, ICubeManager等）
│   │   ├── manager/          # 立方管理器
│   │   ├── lifecycle/        # 生命周期管理
│   │   └── index.ts          # 导出公共API
│   │
│   └── common/               # 通用工具
│       ├── types/            # 类型定义（YYC3Result, YYC3Error等）
│       ├── utils/            # 工具函数
│       └── constants/        # 常量定义（错误码、默认配置等）
│
├── tests/                    # 单元测试（与src目录结构对应）
├── docs/                     # 技术文档
├── package.json              # 依赖管理
└── tsconfig.json             # 编译配置
```
### 标准化执行规范
#### 1. 目录命名规则
- 母品牌核心：yyc3-core（固定）
- 行业子产品：yyc3-<行业代码>（行业代码见下表）
|行业名称|行业代码|行业名称|行业代码|
|-|-|-|-|
|医疗健康|med|智慧零售|retail|
|实体经营|ent|工业制造|manu|
|教育-义务教育|edu-basic|能源管理|energy|
|教育-高等教育|edu-higher|环境保护|env|
|股票金融|fin|旅游酒店|tourism|
|技术集成-API|api|法律行业|law|
|智慧农业|agr|人力资源|hr|
|智慧养老|elder|媒体娱乐|media|
|智能文创|cultural|餐饮行业|fb|
|智慧物流|log|智能交通|traffic|
|地产建筑|real|智慧城市|gov|
|智慧教育|edu|智能编程|core|

            行业名称
            行业代码
            行业名称
            行业代码
            医疗健康
            med
            智慧零售
            retail
            实体经营
            ent
            工业制造
            manu
            教育-义务教育
            edu-basic
            能源管理
            energy
            教育-高等教育
            edu-higher
            环境保护
            env
            股票金融
            fin
            旅游酒店
            tourism
            技术集成-API
            api
            法律行业
            law
            智慧农业
            agr
            人力资源
            hr
            智慧养老
            elder
            媒体娱乐
            media
            智能文创
            cultural
            餐饮行业
            fb
            智慧物流
            log
            智能交通
            traffic
            地产建筑
            real
            智慧城市
            gov
            智慧教育
            edu
            智能编程
            core
#### 2. 文件结构强制规范
每个行业子产品必须包含4个核心层：
```plaintext
├── yan/          # 言层：行业场景输入适配
├── yu/           # 语层：行业智能处理
├── cloud/        # 云层：行业云端接口
└── cube/         # 立方层：行业模块组合器

每个层必须包含：
├── src/          # 源代码目录
└── package.json  # 依赖配置文件

```
#### 3. 代码组织原则
- 跨层调用：必须通过核心层接口，禁止直接跨层调用
- 行业特化：行业特定逻辑必须在对应子产品中实现
- 模块复用：通用功能必须抽象到核心层
#### 4. 版本管理规范
```json
{
  "name": "yyc3-<行业代码>",
  "version": "1.0.0",
  "dependencies": {
    "yyc3-core": "^2.0.0"
  }
}

```

### 执行声明

YYC³ 行业场景文件树结构严格遵循以下原则：

1. 架构一致性：所有行业子产品采用相同的四层架构
2. 命名标准化：行业代码统一、目录结构一致
3. 模块独立性：行业特定逻辑与核心逻辑分离
4. 扩展灵活性：新增行业可快速复用核心架构

> 技术承诺：此文件树结构是YYC³技术标准化的基石，任何行业扩展必须严格遵循此规范，确保全球技术架构的一致性和可维护性。

---
> 「YanYuCloudCube」
> [admin@0379.email](mailto:admin@0379.email)
> 「言启象限，语枢未来」
> 「Words Initiate Quadrants, Language Serves as Core for the Future」
> 「All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence」
