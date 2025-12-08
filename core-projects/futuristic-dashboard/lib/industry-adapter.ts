/**
 * 多行业适配系统 - 基于"五高五标五化"架构
 * 支持24个行业的定制化配置和智能管理
 */

export type IndustryType =
  | "yyc3-agr" // 智慧农业
  | "yyc3-fb" // 餐饮服务
  | "yyc3-fn" // 股票金融
  | "yyc3-gov" // 智慧城市
  | "yyc3-hr" // 人力资源
  | "yyc3-med" // 医疗健康
  | "yyc3-media" // 媒体娱乐
  | "yyc3-manu" // 智慧制造
  | "yyc3-core" // 智能编程
  | "yyc3-cultural" // 智能文创
  | "yyc3-edu" // 智能教育
  | "yyc3-energy" // 能源管理
  | "yyc3-env" // 环境保护
  | "yyc3-law" // 法律服务
  | "yyc3-log" // 智慧物流
  | "yyc3-ent" // 实体经管
  | "yyc3-real" // 地产建筑
  | "yyc3-retail" // 智慧零售
  | "yyc3-traffic" // 智能交通
  | "yyc3-tourism" // 旅游酒店
  | "yyc3-elder" // 智慧养老
  | "yyc3-api" // 技术集成
  | "yyc3-dc" // 数据中心
  | "yyc3-finance" // 金融科技

export interface IndustryConfig {
  id: IndustryType
  code: string // 标准化行业代码
  name: string
  icon: string
  description: string
  primaryColor: string
  metrics: IndustryMetric[]
  dashboardLayout: DashboardLayout
  aiModels: AIModelConfig[]
  // 五高架构配置
  highPerformance: PerformanceConfig
  highAvailability: AvailabilityConfig
  highSecurity: SecurityConfig
  highIntelligence: IntelligenceConfig
  highEfficiency: EfficiencyConfig
  // 五标体系配置
  standards: StandardsConfig
}

export interface IndustryMetric {
  id: string
  name: string
  unit: string
  normalRange: [number, number]
  criticalThreshold: number
  icon: string
  category: "performance" | "security" | "business" | "operations"
}

export interface DashboardLayout {
  widgets: WidgetConfig[]
  refreshInterval: number
  alertPriority: string[]
}

export interface WidgetConfig {
  id: string
  type: "chart" | "metric" | "alert" | "ai-insight" | "map"
  position: { x: number; y: number; w: number; h: number }
  config: Record<string, any>
}

export interface AIModelConfig {
  id: string
  name: string
  type: "prediction" | "anomaly" | "optimization" | "classification"
  enabled: boolean
  parameters: Record<string, any>
}

export interface PerformanceConfig {
  maxThroughput: number // 最大吞吐量
  targetLatency: number // 目标延迟(ms)
  cacheStrategy: "aggressive" | "moderate" | "minimal"
}

export interface AvailabilityConfig {
  targetUptime: number // 目标可用性(%)
  failoverTime: number // 故障转移时间(s)
  backupStrategy: "realtime" | "hourly" | "daily"
}

export interface SecurityConfig {
  encryptionLevel: "basic" | "standard" | "advanced"
  authMethod: "basic" | "mfa" | "biometric"
  complianceStandards: string[]
}

export interface IntelligenceConfig {
  aiCapabilities: string[]
  predictionAccuracy: number
  autoDecisionLevel: "none" | "suggest" | "auto"
}

export interface EfficiencyConfig {
  automationLevel: number // 自动化程度(%)
  resourceOptimization: boolean
  costReductionTarget: number // 成本降低目标(%)
}

export interface StandardsConfig {
  apiVersion: string
  dataFormat: "json" | "xml" | "protobuf"
  monitoringProtocol: "prometheus" | "grafana" | "custom"
  serviceLevel: "bronze" | "silver" | "gold" | "platinum"
}

/**
 * 24个行业完整配置库
 */
export const INDUSTRY_CONFIGS: Record<IndustryType, IndustryConfig> = {
  "yyc3-agr": {
    id: "yyc3-agr",
    code: "AGR",
    name: "智慧农业",
    icon: "Sprout",
    description: "农业生产智能化监控与管理",
    primaryColor: "green",
    metrics: [
      {
        id: "soil-moisture",
        name: "土壤湿度",
        unit: "%",
        normalRange: [40, 70],
        criticalThreshold: 30,
        icon: "Droplets",
        category: "operations",
      },
      {
        id: "crop-health",
        name: "作物健康指数",
        unit: "分",
        normalRange: [70, 100],
        criticalThreshold: 50,
        icon: "Leaf",
        category: "business",
      },
      {
        id: "irrigation-efficiency",
        name: "灌溉效率",
        unit: "%",
        normalRange: [75, 95],
        criticalThreshold: 60,
        icon: "Droplet",
        category: "performance",
      },
      {
        id: "yield-prediction",
        name: "产量预测",
        unit: "吨/亩",
        normalRange: [0.8, 1.5],
        criticalThreshold: 0.5,
        icon: "TrendingUp",
        category: "business",
      },
    ],
    dashboardLayout: {
      widgets: [],
      refreshInterval: 10000,
      alertPriority: ["business", "operations", "performance"],
    },
    aiModels: [
      {
        id: "crop-disease-detection",
        name: "作物病害检测",
        type: "classification",
        enabled: true,
        parameters: { accuracy: 0.92 },
      },
      {
        id: "yield-forecasting",
        name: "产量预测",
        type: "prediction",
        enabled: true,
        parameters: { horizon: 720, confidence: 0.85 },
      },
    ],
    highPerformance: {
      maxThroughput: 5000,
      targetLatency: 200,
      cacheStrategy: "moderate",
    },
    highAvailability: {
      targetUptime: 99.5,
      failoverTime: 60,
      backupStrategy: "hourly",
    },
    highSecurity: {
      encryptionLevel: "standard",
      authMethod: "basic",
      complianceStandards: ["ISO27001"],
    },
    highIntelligence: {
      aiCapabilities: ["病害识别", "产量预测", "智能灌溉"],
      predictionAccuracy: 0.85,
      autoDecisionLevel: "suggest",
    },
    highEfficiency: {
      automationLevel: 70,
      resourceOptimization: true,
      costReductionTarget: 25,
    },
    standards: {
      apiVersion: "v1.0",
      dataFormat: "json",
      monitoringProtocol: "prometheus",
      serviceLevel: "silver",
    },
  },

  "yyc3-fb": {
    id: "yyc3-fb",
    code: "FB",
    name: "餐饮服务",
    icon: "UtensilsCrossed",
    description: "餐饮运营与客户体验管理",
    primaryColor: "orange",
    metrics: [
      {
        id: "table-turnover",
        name: "翻台率",
        unit: "次/天",
        normalRange: [3, 6],
        criticalThreshold: 2,
        icon: "Users",
        category: "business",
      },
      {
        id: "customer-satisfaction",
        name: "客户满意度",
        unit: "%",
        normalRange: [85, 100],
        criticalThreshold: 70,
        icon: "Star",
        category: "business",
      },
      {
        id: "food-waste",
        name: "食材损耗率",
        unit: "%",
        normalRange: [2, 5],
        criticalThreshold: 10,
        icon: "Trash2",
        category: "operations",
      },
      {
        id: "order-accuracy",
        name: "订单准确率",
        unit: "%",
        normalRange: [95, 100],
        criticalThreshold: 90,
        icon: "CheckCircle",
        category: "performance",
      },
    ],
    dashboardLayout: {
      widgets: [],
      refreshInterval: 5000,
      alertPriority: ["business", "performance", "operations"],
    },
    aiModels: [
      {
        id: "demand-forecasting",
        name: "需求预测",
        type: "prediction",
        enabled: true,
        parameters: { horizon: 168, confidence: 0.88 },
      },
      {
        id: "menu-optimization",
        name: "菜单优化",
        type: "optimization",
        enabled: true,
        parameters: { strategy: "profit-margin" },
      },
    ],
    highPerformance: {
      maxThroughput: 10000,
      targetLatency: 100,
      cacheStrategy: "aggressive",
    },
    highAvailability: {
      targetUptime: 99.9,
      failoverTime: 30,
      backupStrategy: "realtime",
    },
    highSecurity: {
      encryptionLevel: "standard",
      authMethod: "mfa",
      complianceStandards: ["PCI-DSS", "GDPR"],
    },
    highIntelligence: {
      aiCapabilities: ["需求预测", "菜单优化", "客户画像"],
      predictionAccuracy: 0.88,
      autoDecisionLevel: "suggest",
    },
    highEfficiency: {
      automationLevel: 75,
      resourceOptimization: true,
      costReductionTarget: 20,
    },
    standards: {
      apiVersion: "v1.0",
      dataFormat: "json",
      monitoringProtocol: "grafana",
      serviceLevel: "gold",
    },
  },

  "yyc3-fn": {
    id: "yyc3-fn",
    code: "FN",
    name: "股票金融",
    icon: "TrendingUp",
    description: "股票交易与风险管理",
    primaryColor: "emerald",
    metrics: [
      {
        id: "trading-volume",
        name: "交易量",
        unit: "万手",
        normalRange: [100, 500],
        criticalThreshold: 50,
        icon: "BarChart3",
        category: "business",
      },
      {
        id: "market-volatility",
        name: "市场波动率",
        unit: "%",
        normalRange: [10, 30],
        criticalThreshold: 50,
        icon: "Activity",
        category: "business",
      },
      {
        id: "risk-score",
        name: "风险评分",
        unit: "分",
        normalRange: [0, 50],
        criticalThreshold: 80,
        icon: "AlertTriangle",
        category: "security",
      },
      {
        id: "execution-speed",
        name: "执行速度",
        unit: "ms",
        normalRange: [1, 10],
        criticalThreshold: 50,
        icon: "Zap",
        category: "performance",
      },
    ],
    dashboardLayout: {
      widgets: [],
      refreshInterval: 1000,
      alertPriority: ["security", "business", "performance"],
    },
    aiModels: [
      {
        id: "price-prediction",
        name: "价格预测",
        type: "prediction",
        enabled: true,
        parameters: { horizon: 24, confidence: 0.82 },
      },
      {
        id: "risk-assessment",
        name: "风险评估",
        type: "classification",
        enabled: true,
        parameters: { threshold: 0.9 },
      },
    ],
    highPerformance: {
      maxThroughput: 100000,
      targetLatency: 5,
      cacheStrategy: "aggressive",
    },
    highAvailability: {
      targetUptime: 99.99,
      failoverTime: 5,
      backupStrategy: "realtime",
    },
    highSecurity: {
      encryptionLevel: "advanced",
      authMethod: "biometric",
      complianceStandards: ["SOC2", "ISO27001", "PCI-DSS"],
    },
    highIntelligence: {
      aiCapabilities: ["价格预测", "风险评估", "算法交易"],
      predictionAccuracy: 0.82,
      autoDecisionLevel: "auto",
    },
    highEfficiency: {
      automationLevel: 95,
      resourceOptimization: true,
      costReductionTarget: 30,
    },
    standards: {
      apiVersion: "v2.0",
      dataFormat: "protobuf",
      monitoringProtocol: "prometheus",
      serviceLevel: "platinum",
    },
  },

  "yyc3-gov": {
    id: "yyc3-gov",
    code: "GOV",
    name: "智慧城市",
    icon: "Building2",
    description: "城市基础设施监控与管理",
    primaryColor: "cyan",
    metrics: [
      {
        id: "traffic-flow",
        name: "交通流量",
        unit: "车辆/小时",
        normalRange: [1000, 5000],
        criticalThreshold: 8000,
        icon: "Car",
        category: "operations",
      },
      {
        id: "air-quality",
        name: "空气质量指数",
        unit: "AQI",
        normalRange: [0, 100],
        criticalThreshold: 200,
        icon: "Wind",
        category: "operations",
      },
      {
        id: "energy-consumption",
        name: "能源消耗",
        unit: "MW",
        normalRange: [500, 2000],
        criticalThreshold: 3000,
        icon: "Zap",
        category: "operations",
      },
      {
        id: "public-safety",
        name: "公共安全指数",
        unit: "%",
        normalRange: [85, 100],
        criticalThreshold: 70,
        icon: "Shield",
        category: "security",
      },
    ],
    dashboardLayout: {
      widgets: [],
      refreshInterval: 5000,
      alertPriority: ["security", "operations", "performance"],
    },
    aiModels: [
      {
        id: "traffic-prediction",
        name: "交通流量预测",
        type: "prediction",
        enabled: true,
        parameters: { horizon: 60, confidence: 0.85 },
      },
      {
        id: "incident-detection",
        name: "事件异常检测",
        type: "anomaly",
        enabled: true,
        parameters: { sensitivity: 0.8 },
      },
    ],
    highPerformance: {
      maxThroughput: 50000,
      targetLatency: 50,
      cacheStrategy: "aggressive",
    },
    highAvailability: {
      targetUptime: 99.95,
      failoverTime: 10,
      backupStrategy: "realtime",
    },
    highSecurity: {
      encryptionLevel: "advanced",
      authMethod: "mfa",
      complianceStandards: ["ISO27001", "GDPR"],
    },
    highIntelligence: {
      aiCapabilities: ["交通预测", "事件检测", "资源调度"],
      predictionAccuracy: 0.85,
      autoDecisionLevel: "suggest",
    },
    highEfficiency: {
      automationLevel: 80,
      resourceOptimization: true,
      costReductionTarget: 35,
    },
    standards: {
      apiVersion: "v1.5",
      dataFormat: "json",
      monitoringProtocol: "prometheus",
      serviceLevel: "platinum",
    },
  },

  "yyc3-hr": {
    id: "yyc3-hr",
    code: "HR",
    name: "人力资源",
    icon: "Users",
    description: "人力资源管理与员工发展",
    primaryColor: "teal",
    metrics: [
      {
        id: "employee-turnover",
        name: "员工流失率",
        unit: "%",
        normalRange: [5, 10],
        criticalThreshold: 15,
        icon: "UserMinus",
        category: "business",
      },
      {
        id: "training-participation",
        name: "培训参与率",
        unit: "%",
        normalRange: [80, 100],
        criticalThreshold: 70,
        icon: "Book",
        category: "operations",
      },
      {
        id: "performance-review",
        name: "绩效评估周期",
        unit: "天",
        normalRange: [30, 60],
        criticalThreshold: 90,
        icon: "Clock",
        category: "performance",
      },
      {
        id: "security-awareness",
        name: "安全意识培训覆盖率",
        unit: "%",
        normalRange: [85, 100],
        criticalThreshold: 70,
        icon: "Shield",
        category: "security",
      },
    ],
    dashboardLayout: {
      widgets: [],
      refreshInterval: 5000,
      alertPriority: ["security", "operations", "performance"],
    },
    aiModels: [
      {
        id: "talent-acquisition",
        name: "人才获取预测",
        type: "prediction",
        enabled: true,
        parameters: { horizon: 12, confidence: 0.85 },
      },
      {
        id: "performance-analysis",
        name: "绩效分析",
        type: "anomaly",
        enabled: true,
        parameters: { sensitivity: 0.8 },
      },
    ],
    highPerformance: {
      maxThroughput: 10000,
      targetLatency: 100,
      cacheStrategy: "moderate",
    },
    highAvailability: {
      targetUptime: 99.9,
      failoverTime: 30,
      backupStrategy: "hourly",
    },
    highSecurity: {
      encryptionLevel: "standard",
      authMethod: "mfa",
      complianceStandards: ["ISO27001"],
    },
    highIntelligence: {
      aiCapabilities: ["人才预测", "绩效分析", "员工发展"],
      predictionAccuracy: 0.85,
      autoDecisionLevel: "suggest",
    },
    highEfficiency: {
      automationLevel: 75,
      resourceOptimization: true,
      costReductionTarget: 20,
    },
    standards: {
      apiVersion: "v1.0",
      dataFormat: "json",
      monitoringProtocol: "prometheus",
      serviceLevel: "silver",
    },
  },

  "yyc3-med": {
    id: "yyc3-med",
    code: "MED",
    name: "医疗健康",
    icon: "Heart",
    description: "医疗设备与患者监控",
    primaryColor: "red",
    metrics: [
      {
        id: "patient-monitoring",
        name: "患者监护数",
        unit: "人",
        normalRange: [50, 200],
        criticalThreshold: 300,
        icon: "Users",
        category: "operations",
      },
      {
        id: "equipment-status",
        name: "设备在线率",
        unit: "%",
        normalRange: [95, 100],
        criticalThreshold: 90,
        icon: "Activity",
        category: "performance",
      },
      {
        id: "emergency-response",
        name: "应急响应时间",
        unit: "分钟",
        normalRange: [1, 5],
        criticalThreshold: 10,
        icon: "AlertCircle",
        category: "operations",
      },
      {
        id: "data-security",
        name: "数据安全等级",
        unit: "%",
        normalRange: [95, 100],
        criticalThreshold: 85,
        icon: "Lock",
        category: "security",
      },
    ],
    dashboardLayout: {
      widgets: [],
      refreshInterval: 5000,
      alertPriority: ["operations", "security", "performance"],
    },
    aiModels: [
      {
        id: "patient-risk",
        name: "患者风险预测",
        type: "prediction",
        enabled: true,
        parameters: { horizon: 24, confidence: 0.9 },
      },
      {
        id: "resource-optimization",
        name: "资源优化",
        type: "optimization",
        enabled: true,
        parameters: { strategy: "dynamic" },
      },
    ],
    highPerformance: {
      maxThroughput: 10000,
      targetLatency: 100,
      cacheStrategy: "moderate",
    },
    highAvailability: {
      targetUptime: 99.9,
      failoverTime: 30,
      backupStrategy: "hourly",
    },
    highSecurity: {
      encryptionLevel: "standard",
      authMethod: "mfa",
      complianceStandards: ["ISO27001"],
    },
    highIntelligence: {
      aiCapabilities: ["风险预测", "资源优化", "智能监护"],
      predictionAccuracy: 0.85,
      autoDecisionLevel: "suggest",
    },
    highEfficiency: {
      automationLevel: 75,
      resourceOptimization: true,
      costReductionTarget: 20,
    },
    standards: {
      apiVersion: "v1.0",
      dataFormat: "json",
      monitoringProtocol: "prometheus",
      serviceLevel: "silver",
    },
  },

  "yyc3-media": {
    id: "yyc3-media",
    code: "MEDIA",
    name: "媒体娱乐",
    icon: "Film",
    description: "内容创作与用户互动管理",
    primaryColor: "pink",
    metrics: [
      {
        id: "content-creation-rate",
        name: "内容创作速率",
        unit: "篇/天",
        normalRange: [10, 30],
        criticalThreshold: 5,
        icon: "Type",
        category: "business",
      },
      {
        id: "user-engagement",
        name: "用户参与度",
        unit: "%",
        normalRange: [70, 90],
        criticalThreshold: 50,
        icon: "Users",
        category: "operations",
      },
      {
        id: "streaming-latency",
        name: "流媒体延迟",
        unit: "ms",
        normalRange: [10, 50],
        criticalThreshold: 200,
        icon: "Clock",
        category: "performance",
      },
      {
        id: "data-protection",
        name: "数据保护等级",
        unit: "%",
        normalRange: [95, 100],
        criticalThreshold: 85,
        icon: "Lock",
        category: "security",
      },
    ],
    dashboardLayout: {
      widgets: [],
      refreshInterval: 5000,
      alertPriority: ["security", "operations", "performance"],
    },
    aiModels: [
      {
        id: "content-recommendation",
        name: "内容推荐",
        type: "classification",
        enabled: true,
        parameters: { accuracy: 0.92 },
      },
      {
        id: "user-behavior-analysis",
        name: "用户行为分析",
        type: "anomaly",
        enabled: true,
        parameters: { sensitivity: 0.8 },
      },
    ],
    highPerformance: {
      maxThroughput: 50000,
      targetLatency: 50,
      cacheStrategy: "aggressive",
    },
    highAvailability: {
      targetUptime: 99.95,
      failoverTime: 10,
      backupStrategy: "realtime",
    },
    highSecurity: {
      encryptionLevel: "advanced",
      authMethod: "mfa",
      complianceStandards: ["ISO27001", "GDPR"],
    },
    highIntelligence: {
      aiCapabilities: ["内容推荐", "行为分析", "智能创作"],
      predictionAccuracy: 0.85,
      autoDecisionLevel: "suggest",
    },
    highEfficiency: {
      automationLevel: 80,
      resourceOptimization: true,
      costReductionTarget: 35,
    },
    standards: {
      apiVersion: "v1.5",
      dataFormat: "json",
      monitoringProtocol: "prometheus",
      serviceLevel: "platinum",
    },
  },

  "yyc3-manu": {
    id: "yyc3-manu",
    code: "MANU",
    name: "智能制造",
    icon: "Factory",
    description: "生产线监控与质量管理",
    primaryColor: "orange",
    metrics: [
      {
        id: "production-rate",
        name: "生产速率",
        unit: "件/小时",
        normalRange: [100, 500],
        criticalThreshold: 50,
        icon: "Package",
        category: "business",
      },
      {
        id: "quality-rate",
        name: "良品率",
        unit: "%",
        normalRange: [95, 100],
        criticalThreshold: 90,
        icon: "CheckCircle",
        category: "business",
      },
      {
        id: "equipment-efficiency",
        name: "设备综合效率",
        unit: "%",
        normalRange: [75, 95],
        criticalThreshold: 60,
        icon: "Gauge",
        category: "performance",
      },
      {
        id: "energy-per-unit",
        name: "单位能耗",
        unit: "kWh/件",
        normalRange: [0.5, 2.0],
        criticalThreshold: 3.0,
        icon: "Zap",
        category: "operations",
      },
    ],
    dashboardLayout: {
      widgets: [],
      refreshInterval: 2000,
      alertPriority: ["business", "performance", "operations"],
    },
    aiModels: [
      {
        id: "quality-prediction",
        name: "质量预测",
        type: "prediction",
        enabled: true,
        parameters: { horizon: 24, confidence: 0.88 },
      },
      {
        id: "maintenance-optimization",
        name: "维护优化",
        type: "optimization",
        enabled: true,
        parameters: { strategy: "predictive" },
      },
    ],
    highPerformance: {
      maxThroughput: 10000,
      targetLatency: 100,
      cacheStrategy: "moderate",
    },
    highAvailability: {
      targetUptime: 99.9,
      failoverTime: 30,
      backupStrategy: "hourly",
    },
    highSecurity: {
      encryptionLevel: "standard",
      authMethod: "mfa",
      complianceStandards: ["ISO27001"],
    },
    highIntelligence: {
      aiCapabilities: ["质量预测", "维护优化", "智能调度"],
      predictionAccuracy: 0.85,
      autoDecisionLevel: "suggest",
    },
    highEfficiency: {
      automationLevel: 75,
      resourceOptimization: true,
      costReductionTarget: 20,
    },
    standards: {
      apiVersion: "v1.0",
      dataFormat: "json",
      monitoringProtocol: "prometheus",
      serviceLevel: "silver",
    },
  },

  "yyc3-core": {
    id: "yyc3-core",
    code: "CORE",
    name: "智能编程",
    icon: "Code",
    description: "软件开发与代码质量管理",
    primaryColor: "violet",
    metrics: [
      {
        id: "code-quality",
        name: "代码质量评分",
        unit: "分",
        normalRange: [80, 100],
        criticalThreshold: 70,
        icon: "CheckCircle",
        category: "business",
      },
      {
        id: "bug-rate",
        name: "缺陷率",
        unit: "%",
        normalRange: [1, 5],
        criticalThreshold: 10,
        icon: "Bug",
        category: "performance",
      },
      {
        id: "deployment-frequency",
        name: "部署频率",
        unit: "次/天",
        normalRange: [2, 5],
        criticalThreshold: 10,
        icon: "Clock",
        category: "operations",
      },
      {
        id: "security-audits",
        name: "安全审计次数",
        unit: "次/月",
        normalRange: [10, 20],
        criticalThreshold: 5,
        icon: "Shield",
        category: "security",
      },
    ],
    dashboardLayout: {
      widgets: [],
      refreshInterval: 5000,
      alertPriority: ["security", "operations", "performance"],
    },
    aiModels: [
      {
        id: "bug-detection",
        name: "缺陷检测",
        type: "classification",
        enabled: true,
        parameters: { accuracy: 0.92 },
      },
      {
        id: "code-optimization",
        name: "代码优化",
        type: "optimization",
        enabled: true,
        parameters: { strategy: "dynamic" },
      },
    ],
    highPerformance: {
      maxThroughput: 50000,
      targetLatency: 50,
      cacheStrategy: "aggressive",
    },
    highAvailability: {
      targetUptime: 99.95,
      failoverTime: 10,
      backupStrategy: "realtime",
    },
    highSecurity: {
      encryptionLevel: "advanced",
      authMethod: "mfa",
      complianceStandards: ["ISO27001", "GDPR"],
    },
    highIntelligence: {
      aiCapabilities: ["缺陷检测", "代码优化", "智能开发"],
      predictionAccuracy: 0.85,
      autoDecisionLevel: "suggest",
    },
    highEfficiency: {
      automationLevel: 80,
      resourceOptimization: true,
      costReductionTarget: 35,
    },
    standards: {
      apiVersion: "v1.5",
      dataFormat: "json",
      monitoringProtocol: "prometheus",
      serviceLevel: "platinum",
    },
  },

  "yyc3-cultural": {
    id: "yyc3-cultural",
    code: "CULTURAL",
    name: "智能文创",
    icon: "Palette",
    description: "文化产品与内容创作管理",
    primaryColor: "brown",
    metrics: [
      {
        id: "content-creation-rate",
        name: "内容创作速率",
        unit: "篇/天",
        normalRange: [10, 30],
        criticalThreshold: 5,
        icon: "Type",
        category: "business",
      },
      {
        id: "user-engagement",
        name: "用户参与度",
        unit: "%",
        normalRange: [70, 90],
        criticalThreshold: 50,
        icon: "Users",
        category: "operations",
      },
      {
        id: "streaming-latency",
        name: "流媒体延迟",
        unit: "ms",
        normalRange: [10, 50],
        criticalThreshold: 200,
        icon: "Clock",
        category: "performance",
      },
      {
        id: "data-protection",
        name: "数据保护等级",
        unit: "%",
        normalRange: [95, 100],
        criticalThreshold: 85,
        icon: "Lock",
        category: "security",
      },
    ],
    dashboardLayout: {
      widgets: [],
      refreshInterval: 5000,
      alertPriority: ["security", "operations", "performance"],
    },
    aiModels: [
      {
        id: "content-recommendation",
        name: "内容推荐",
        type: "classification",
        enabled: true,
        parameters: { accuracy: 0.92 },
      },
      {
        id: "user-behavior-analysis",
        name: "用户行为分析",
        type: "anomaly",
        enabled: true,
        parameters: { sensitivity: 0.8 },
      },
    ],
    highPerformance: {
      maxThroughput: 50000,
      targetLatency: 50,
      cacheStrategy: "aggressive",
    },
    highAvailability: {
      targetUptime: 99.95,
      failoverTime: 10,
      backupStrategy: "realtime",
    },
    highSecurity: {
      encryptionLevel: "advanced",
      authMethod: "mfa",
      complianceStandards: ["ISO27001", "GDPR"],
    },
    highIntelligence: {
      aiCapabilities: ["内容推荐", "行为分析", "智能创作"],
      predictionAccuracy: 0.85,
      autoDecisionLevel: "suggest",
    },
    highEfficiency: {
      automationLevel: 80,
      resourceOptimization: true,
      costReductionTarget: 35,
    },
    standards: {
      apiVersion: "v1.5",
      dataFormat: "json",
      monitoringProtocol: "prometheus",
      serviceLevel: "platinum",
    },
  },

  "yyc3-edu": {
    id: "yyc3-edu",
    code: "EDU",
    name: "智能教育",
    icon: "School",
    description: "教育内容与学生管理",
    primaryColor: "blue",
    metrics: [
      {
        id: "student-enrollment",
        name: "学生入学率",
        unit: "%",
        normalRange: [80, 100],
        criticalThreshold: 70,
        icon: "Users",
        category: "business",
      },
      {
        id: "learning-outcomes",
        name: "学习成果率",
        unit: "%",
        normalRange: [70, 90],
        criticalThreshold: 50,
        icon: "CheckCircle",
        category: "performance",
      },
      {
        id: "resource-allocation",
        name: "资源分配效率",
        unit: "%",
        normalRange: [75, 95],
        criticalThreshold: 60,
        icon: "Gauge",
        category: "operations",
      },
      {
        id: "data-security",
        name: "数据安全等级",
        unit: "%",
        normalRange: [95, 100],
        criticalThreshold: 85,
        icon: "Lock",
        category: "security",
      },
    ],
    dashboardLayout: {
      widgets: [],
      refreshInterval: 5000,
      alertPriority: ["security", "operations", "performance"],
    },
    aiModels: [
      {
        id: "outcome-prediction",
        name: "学习成果预测",
        type: "prediction",
        enabled: true,
        parameters: { horizon: 12, confidence: 0.85 },
      },
      {
        id: "resource-optimization",
        name: "资源优化",
        type: "optimization",
        enabled: true,
        parameters: { strategy: "dynamic" },
      },
    ],
    highPerformance: {
      maxThroughput: 10000,
      targetLatency: 100,
      cacheStrategy: "moderate",
    },
    highAvailability: {
      targetUptime: 99.9,
      failoverTime: 30,
      backupStrategy: "hourly",
    },
    highSecurity: {
      encryptionLevel: "standard",
      authMethod: "mfa",
      complianceStandards: ["ISO27001"],
    },
    highIntelligence: {
      aiCapabilities: ["成果预测", "资源优化", "智能教学"],
      predictionAccuracy: 0.85,
      autoDecisionLevel: "suggest",
    },
    highEfficiency: {
      automationLevel: 75,
      resourceOptimization: true,
      costReductionTarget: 20,
    },
    standards: {
      apiVersion: "v1.0",
      dataFormat: "json",
      monitoringProtocol: "prometheus",
      serviceLevel: "silver",
    },
  },

  "yyc3-energy": {
    id: "yyc3-energy",
    code: "ENERGY",
    name: "能源管理",
    icon: "Zap",
    description: "电力系统与能源优化",
    primaryColor: "yellow",
    metrics: [
      {
        id: "power-generation",
        name: "发电量",
        unit: "MW",
        normalRange: [500, 2000],
        criticalThreshold: 3000,
        icon: "Zap",
        category: "business",
      },
      {
        id: "grid-stability",
        name: "电网稳定性",
        unit: "%",
        normalRange: [95, 100],
        criticalThreshold: 85,
        icon: "Activity",
        category: "performance",
      },
      {
        id: "renewable-ratio",
        name: "可再生能源占比",
        unit: "%",
        normalRange: [30, 70],
        criticalThreshold: 20,
        icon: "Leaf",
        category: "business",
      },
      {
        id: "transmission-loss",
        name: "传输损耗",
        unit: "%",
        normalRange: [2, 5],
        criticalThreshold: 10,
        icon: "TrendingDown",
        category: "operations",
      },
    ],
    dashboardLayout: {
      widgets: [],
      refreshInterval: 3000,
      alertPriority: ["performance", "business", "operations"],
    },
    aiModels: [
      {
        id: "demand-forecasting",
        name: "需求预测",
        type: "prediction",
        enabled: true,
        parameters: { horizon: 72, confidence: 0.87 },
      },
      {
        id: "load-balancing",
        name: "负载均衡优化",
        type: "optimization",
        enabled: true,
        parameters: { strategy: "realtime" },
      },
    ],
    highPerformance: {
      maxThroughput: 50000,
      targetLatency: 50,
      cacheStrategy: "aggressive",
    },
    highAvailability: {
      targetUptime: 99.95,
      failoverTime: 10,
      backupStrategy: "realtime",
    },
    highSecurity: {
      encryptionLevel: "advanced",
      authMethod: "mfa",
      complianceStandards: ["ISO27001", "GDPR"],
    },
    highIntelligence: {
      aiCapabilities: ["需求预测", "负载均衡", "智能调度"],
      predictionAccuracy: 0.85,
      autoDecisionLevel: "suggest",
    },
    highEfficiency: {
      automationLevel: 80,
      resourceOptimization: true,
      costReductionTarget: 35,
    },
    standards: {
      apiVersion: "v1.5",
      dataFormat: "json",
      monitoringProtocol: "prometheus",
      serviceLevel: "platinum",
    },
  },

  "yyc3-env": {
    id: "yyc3-env",
    code: "ENV",
    name: "环境保护",
    icon: "Leaf",
    description: "环境监测与可持续发展管理",
    primaryColor: "green",
    metrics: [
      {
        id: "pollution-level",
        name: "污染水平",
        unit: "ppm",
        normalRange: [0, 10],
        criticalThreshold: 20,
        icon: "Wind",
        category: "business",
      },
      {
        id: "energy-efficiency",
        name: "能源效率",
        unit: "%",
        normalRange: [70, 90],
        criticalThreshold: 50,
        icon: "Zap",
        category: "performance",
      },
      {
        id: "resource-reuse",
        name: "资源循环利用率",
        unit: "%",
        normalRange: [75, 95],
        criticalThreshold: 60,
        icon: "Recycle",
        category: "operations",
      },
      {
        id: "data-security",
        name: "数据安全等级",
        unit: "%",
        normalRange: [95, 100],
        criticalThreshold: 85,
        icon: "Lock",
        category: "security",
      },
    ],
    dashboardLayout: {
      widgets: [],
      refreshInterval: 5000,
      alertPriority: ["security", "operations", "performance"],
    },
    aiModels: [
      {
        id: "pollution-prediction",
        name: "污染水平预测",
        type: "prediction",
        enabled: true,
        parameters: { horizon: 24, confidence: 0.85 },
      },
      {
        id: "resource-management",
        name: "资源管理优化",
        type: "optimization",
        enabled: true,
        parameters: { strategy: "dynamic" },
      },
    ],
    highPerformance: {
      maxThroughput: 10000,
      targetLatency: 100,
      cacheStrategy: "moderate",
    },
    highAvailability: {
      targetUptime: 99.9,
      failoverTime: 30,
      backupStrategy: "hourly",
    },
    highSecurity: {
      encryptionLevel: "standard",
      authMethod: "mfa",
      complianceStandards: ["ISO27001"],
    },
    highIntelligence: {
      aiCapabilities: ["污染预测", "资源管理", "智能监测"],
      predictionAccuracy: 0.85,
      autoDecisionLevel: "suggest",
    },
    highEfficiency: {
      automationLevel: 75,
      resourceOptimization: true,
      costReductionTarget: 20,
    },
    standards: {
      apiVersion: "v1.0",
      dataFormat: "json",
      monitoringProtocol: "prometheus",
      serviceLevel: "silver",
    },
  },

  "yyc3-law": {
    id: "yyc3-law",
    code: "LAW",
    name: "法律服务",
    icon: "Briefcase",
    description: "法律事务与客户服务管理",
    primaryColor: "gray",
    metrics: [
      {
        id: "case-resolution-rate",
        name: "案件解决率",
        unit: "%",
        normalRange: [80, 100],
        criticalThreshold: 70,
        icon: "CheckCircle",
        category: "business",
      },
      {
        id: "service-response-time",
        name: "服务响应时间",
        unit: "分钟",
        normalRange: [1, 5],
        criticalThreshold: 10,
        icon: "Clock",
        category: "performance",
      },
      {
        id: "resource-allocation",
        name: "资源分配效率",
        unit: "%",
        normalRange: [75, 95],
        criticalThreshold: 60,
        icon: "Gauge",
        category: "operations",
      },
      {
        id: "data-security",
        name: "数据安全等级",
        unit: "%",
        normalRange: [95, 100],
        criticalThreshold: 85,
        icon: "Lock",
        category: "security",
      },
    ],
    dashboardLayout: {
      widgets: [],
      refreshInterval: 5000,
      alertPriority: ["security", "operations", "performance"],
    },
    aiModels: [
      {
        id: "case-prediction",
        name: "案件预测",
        type: "prediction",
        enabled: true,
        parameters: { horizon: 24, confidence: 0.85 },
      },
      {
        id: "resource-optimization",
        name: "资源优化",
        type: "optimization",
        enabled: true,
        parameters: { strategy: "dynamic" },
      },
    ],
    highPerformance: {
      maxThroughput: 10000,
      targetLatency: 100,
      cacheStrategy: "moderate",
    },
    highAvailability: {
      targetUptime: 99.9,
      failoverTime: 30,
      backupStrategy: "hourly",
    },
    highSecurity: {
      encryptionLevel: "standard",
      authMethod: "mfa",
      complianceStandards: ["ISO27001"],
    },
    highIntelligence: {
      aiCapabilities: ["案件预测", "资源优化", "智能客服"],
      predictionAccuracy: 0.85,
      autoDecisionLevel: "suggest",
    },
    highEfficiency: {
      automationLevel: 75,
      resourceOptimization: true,
      costReductionTarget: 20,
    },
    standards: {
      apiVersion: "v1.0",
      dataFormat: "json",
      monitoringProtocol: "prometheus",
      serviceLevel: "silver",
    },
  },

  "yyc3-log": {
    id: "yyc3-log",
    code: "LOG",
    name: "智慧物流",
    icon: "Truck",
    description: "物流运输与仓储管理",
    primaryColor: "indigo",
    metrics: [
      {
        id: "delivery-rate",
        name: "准时送达率",
        unit: "%",
        normalRange: [90, 100],
        criticalThreshold: 80,
        icon: "CheckCircle",
        category: "business",
      },
      {
        id: "vehicle-utilization",
        name: "车辆利用率",
        unit: "%",
        normalRange: [70, 90],
        criticalThreshold: 50,
        icon: "Truck",
        category: "operations",
      },
      {
        id: "warehouse-efficiency",
        name: "仓储效率",
        unit: "%",
        normalRange: [80, 95],
        criticalThreshold: 65,
        icon: "Warehouse",
        category: "performance",
      },
      {
        id: "cost-per-delivery",
        name: "单次配送成本",
        unit: "元",
        normalRange: [10, 30],
        criticalThreshold: 50,
        icon: "DollarSign",
        category: "business",
      },
    ],
    dashboardLayout: {
      widgets: [],
      refreshInterval: 5000,
      alertPriority: ["business", "operations", "performance"],
    },
    aiModels: [
      {
        id: "route-optimization",
        name: "路线优化",
        type: "optimization",
        enabled: true,
        parameters: { algorithm: "genetic", realtime: true },
      },
      {
        id: "demand-prediction",
        name: "需求预测",
        type: "prediction",
        enabled: true,
        parameters: { horizon: 72, confidence: 0.88 },
      },
    ],
    highPerformance: {
      maxThroughput: 50000,
      targetLatency: 50,
      cacheStrategy: "aggressive",
    },
    highAvailability: {
      targetUptime: 99.95,
      failoverTime: 10,
      backupStrategy: "realtime",
    },
    highSecurity: {
      encryptionLevel: "advanced",
      authMethod: "mfa",
      complianceStandards: ["ISO27001", "GDPR"],
    },
    highIntelligence: {
      aiCapabilities: ["路线优化", "需求预测", "智能调度"],
      predictionAccuracy: 0.85,
      autoDecisionLevel: "suggest",
    },
    highEfficiency: {
      automationLevel: 80,
      resourceOptimization: true,
      costReductionTarget: 35,
    },
    standards: {
      apiVersion: "v1.5",
      dataFormat: "json",
      monitoringProtocol: "prometheus",
      serviceLevel: "platinum",
    },
  },

  "yyc3-ent": {
    id: "yyc3-ent",
    code: "ENT",
    name: "实体经管",
    icon: "Building",
    description: "实体商业与运营管理",
    primaryColor: "brown",
    metrics: [
      {
        id: "store-sales",
        name: "销售额",
        unit: "万元",
        normalRange: [100, 500],
        criticalThreshold: 50,
        icon: "DollarSign",
        category: "business",
      },
      {
        id: "customer-retention",
        name: "客户保留率",
        unit: "%",
        normalRange: [80, 100],
        criticalThreshold: 70,
        icon: "Users",
        category: "operations",
      },
      {
        id: "inventory-turnover",
        name: "库存周转率",
        unit: "次/月",
        normalRange: [4, 12],
        criticalThreshold: 2,
        icon: "Package",
        category: "performance",
      },
      {
        id: "data-security",
        name: "数据安全等级",
        unit: "%",
        normalRange: [95, 100],
        criticalThreshold: 85,
        icon: "Lock",
        category: "security",
      },
    ],
    dashboardLayout: {
      widgets: [],
      refreshInterval: 5000,
      alertPriority: ["security", "operations", "performance"],
    },
    aiModels: [
      {
        id: "sales-prediction",
        name: "销售预测",
        type: "prediction",
        enabled: true,
        parameters: { horizon: 168, confidence: 0.85 },
      },
      {
        id: "customer-segmentation",
        name: "客户分群",
        type: "classification",
        enabled: true,
        parameters: { clusters: 5 },
      },
    ],
    highPerformance: {
      maxThroughput: 50000,
      targetLatency: 50,
      cacheStrategy: "aggressive",
    },
    highAvailability: {
      targetUptime: 99.95,
      failoverTime: 10,
      backupStrategy: "realtime",
    },
    highSecurity: {
      encryptionLevel: "advanced",
      authMethod: "mfa",
      complianceStandards: ["ISO27001", "GDPR"],
    },
    highIntelligence: {
      aiCapabilities: ["销售预测", "客户分群", "智能运营"],
      predictionAccuracy: 0.85,
      autoDecisionLevel: "suggest",
    },
    highEfficiency: {
      automationLevel: 80,
      resourceOptimization: true,
      costReductionTarget: 35,
    },
    standards: {
      apiVersion: "v1.5",
      dataFormat: "json",
      monitoringProtocol: "prometheus",
      serviceLevel: "platinum",
    },
  },

  "yyc3-real": {
    id: "yyc3-real",
    code: "REAL",
    name: "地产建筑",
    icon: "Building",
    description: "房地产与建筑项目管理",
    primaryColor: "cyan",
    metrics: [
      {
        id: "project-progress",
        name: "项目进度",
        unit: "%",
        normalRange: [70, 90],
        criticalThreshold: 50,
        icon: "Gauge",
        category: "business",
      },
      {
        id: "cost-efficiency",
        name: "成本效率",
        unit: "%",
        normalRange: [75, 95],
        criticalThreshold: 60,
        icon: "DollarSign",
        category: "performance",
      },
      {
        id: "resource-allocation",
        name: "资源分配效率",
        unit: "%",
        normalRange: [75, 95],
        criticalThreshold: 60,
        icon: "Gauge",
        category: "operations",
      },
      {
        id: "data-security",
        name: "数据安全等级",
        unit: "%",
        normalRange: [95, 100],
        criticalThreshold: 85,
        icon: "Lock",
        category: "security",
      },
    ],
    dashboardLayout: {
      widgets: [],
      refreshInterval: 5000,
      alertPriority: ["security", "operations", "performance"],
    },
    aiModels: [
      {
        id: "progress-prediction",
        name: "项目进度预测",
        type: "prediction",
        enabled: true,
        parameters: { horizon: 168, confidence: 0.85 },
      },
      {
        id: "resource-optimization",
        name: "资源优化",
        type: "optimization",
        enabled: true,
        parameters: { strategy: "dynamic" },
      },
    ],
    highPerformance: {
      maxThroughput: 50000,
      targetLatency: 50,
      cacheStrategy: "aggressive",
    },
    highAvailability: {
      targetUptime: 99.95,
      failoverTime: 10,
      backupStrategy: "realtime",
    },
    highSecurity: {
      encryptionLevel: "advanced",
      authMethod: "mfa",
      complianceStandards: ["ISO27001", "GDPR"],
    },
    highIntelligence: {
      aiCapabilities: ["进度预测", "资源优化", "智能管理"],
      predictionAccuracy: 0.85,
      autoDecisionLevel: "suggest",
    },
    highEfficiency: {
      automationLevel: 80,
      resourceOptimization: true,
      costReductionTarget: 35,
    },
    standards: {
      apiVersion: "v1.5",
      dataFormat: "json",
      monitoringProtocol: "prometheus",
      serviceLevel: "platinum",
    },
  },

  "yyc3-retail": {
    id: "yyc3-retail",
    code: "RETAIL",
    name: "智慧零售",
    icon: "ShoppingCart",
    description: "零售运营与客户分析",
    primaryColor: "purple",
    metrics: [
      {
        id: "customer-flow",
        name: "客流量",
        unit: "人/小时",
        normalRange: [100, 500],
        criticalThreshold: 1000,
        icon: "Users",
        category: "business",
      },
      {
        id: "conversion-rate",
        name: "转化率",
        unit: "%",
        normalRange: [15, 35],
        criticalThreshold: 10,
        icon: "TrendingUp",
        category: "business",
      },
      {
        id: "inventory-turnover",
        name: "库存周转率",
        unit: "次/月",
        normalRange: [4, 12],
        criticalThreshold: 2,
        icon: "Package",
        category: "operations",
      },
      {
        id: "customer-satisfaction",
        name: "客户满意度",
        unit: "%",
        normalRange: [85, 100],
        criticalThreshold: 70,
        icon: "Star",
        category: "business",
      },
    ],
    dashboardLayout: {
      widgets: [],
      refreshInterval: 10000,
      alertPriority: ["business", "operations", "performance"],
    },
    aiModels: [
      {
        id: "sales-prediction",
        name: "销售预测",
        type: "prediction",
        enabled: true,
        parameters: { horizon: 168, confidence: 0.85 },
      },
      {
        id: "customer-segmentation",
        name: "客户分群",
        type: "classification",
        enabled: true,
        parameters: { clusters: 5 },
      },
    ],
    highPerformance: {
      maxThroughput: 50000,
      targetLatency: 50,
      cacheStrategy: "aggressive",
    },
    highAvailability: {
      targetUptime: 99.95,
      failoverTime: 10,
      backupStrategy: "realtime",
    },
    highSecurity: {
      encryptionLevel: "advanced",
      authMethod: "mfa",
      complianceStandards: ["ISO27001", "GDPR"],
    },
    highIntelligence: {
      aiCapabilities: ["销售预测", "客户分群", "智能推荐"],
      predictionAccuracy: 0.85,
      autoDecisionLevel: "suggest",
    },
    highEfficiency: {
      automationLevel: 80,
      resourceOptimization: true,
      costReductionTarget: 35,
    },
    standards: {
      apiVersion: "v1.5",
      dataFormat: "json",
      monitoringProtocol: "prometheus",
      serviceLevel: "platinum",
    },
  },

  "yyc3-traffic": {
    id: "yyc3-traffic",
    code: "TRAFFIC",
    name: "智能交通",
    icon: "Car",
    description: "交通流量与管理优化",
    primaryColor: "orange",
    metrics: [
      {
        id: "traffic-flow",
        name: "交通流量",
        unit: "车辆/小时",
        normalRange: [1000, 5000],
        criticalThreshold: 8000,
        icon: "Car",
        category: "operations",
      },
      {
        id: "incident-rate",
        name: "事故率",
        unit: "次/小时",
        normalRange: [1, 5],
        criticalThreshold: 10,
        icon: "AlertTriangle",
        category: "performance",
      },
      {
        id: "resource-allocation",
        name: "资源分配效率",
        unit: "%",
        normalRange: [75, 95],
        criticalThreshold: 60,
        icon: "Gauge",
        category: "operations",
      },
      {
        id: "data-security",
        name: "数据安全等级",
        unit: "%",
        normalRange: [95, 100],
        criticalThreshold: 85,
        icon: "Lock",
        category: "security",
      },
    ],
    dashboardLayout: {
      widgets: [],
      refreshInterval: 5000,
      alertPriority: ["security", "operations", "performance"],
    },
    aiModels: [
      {
        id: "traffic-prediction",
        name: "交通流量预测",
        type: "prediction",
        enabled: true,
        parameters: { horizon: 60, confidence: 0.85 },
      },
      {
        id: "incident-detection",
        name: "事件异常检测",
        type: "anomaly",
        enabled: true,
        parameters: { sensitivity: 0.8 },
      },
    ],
    highPerformance: {
      maxThroughput: 50000,
      targetLatency: 50,
      cacheStrategy: "aggressive",
    },
    highAvailability: {
      targetUptime: 99.95,
      failoverTime: 10,
      backupStrategy: "realtime",
    },
    highSecurity: {
      encryptionLevel: "advanced",
      authMethod: "mfa",
      complianceStandards: ["ISO27001", "GDPR"],
    },
    highIntelligence: {
      aiCapabilities: ["交通预测", "事件检测", "资源调度"],
      predictionAccuracy: 0.85,
      autoDecisionLevel: "suggest",
    },
    highEfficiency: {
      automationLevel: 80,
      resourceOptimization: true,
      costReductionTarget: 35,
    },
    standards: {
      apiVersion: "v1.5",
      dataFormat: "json",
      monitoringProtocol: "prometheus",
      serviceLevel: "platinum",
    },
  },

  "yyc3-tourism": {
    id: "yyc3-tourism",
    code: "TOURISM",
    name: "旅游酒店",
    icon: "Bed",
    description: "旅游与酒店运营管理",
    primaryColor: "pink",
    metrics: [
      {
        id: "visitor-count",
        name: "访客数",
        unit: "人/天",
        normalRange: [100, 500],
        criticalThreshold: 1000,
        icon: "Users",
        category: "business",
      },
      {
        id: "booking-rate",
        name: "预订率",
        unit: "%",
        normalRange: [70, 90],
        criticalThreshold: 50,
        icon: "Calendar",
        category: "operations",
      },
      {
        id: "service-quality",
        name: "服务质量评分",
        unit: "%",
        normalRange: [85, 100],
        criticalThreshold: 70,
        icon: "Star",
        category: "performance",
      },
      {
        id: "data-security",
        name: "数据安全等级",
        unit: "%",
        normalRange: [95, 100],
        criticalThreshold: 85,
        icon: "Lock",
        category: "security",
      },
    ],
    dashboardLayout: {
      widgets: [],
      refreshInterval: 5000,
      alertPriority: ["security", "operations", "performance"],
    },
    aiModels: [
      {
        id: "demand-forecasting",
        name: "需求预测",
        type: "prediction",
        enabled: true,
        parameters: { horizon: 168, confidence: 0.85 },
      },
      {
        id: "resource-optimization",
        name: "资源优化",
        type: "optimization",
        enabled: true,
        parameters: { strategy: "dynamic" },
      },
    ],
    highPerformance: {
      maxThroughput: 50000,
      targetLatency: 50,
      cacheStrategy: "aggressive",
    },
    highAvailability: {
      targetUptime: 99.95,
      failoverTime: 10,
      backupStrategy: "realtime",
    },
    highSecurity: {
      encryptionLevel: "advanced",
      authMethod: "mfa",
      complianceStandards: ["ISO27001", "GDPR"],
    },
    highIntelligence: {
      aiCapabilities: ["需求预测", "资源优化", "智能推荐"],
      predictionAccuracy: 0.85,
      autoDecisionLevel: "suggest",
    },
    highEfficiency: {
      automationLevel: 80,
      resourceOptimization: true,
      costReductionTarget: 35,
    },
    standards: {
      apiVersion: "v1.5",
      dataFormat: "json",
      monitoringProtocol: "prometheus",
      serviceLevel: "platinum",
    },
  },

  "yyc3-elder": {
    id: "yyc3-elder",
    code: "ELDER",
    name: "智慧养老",
    icon: "User",
    description: "养老服务与健康管理",
    primaryColor: "red",
    metrics: [
      {
        id: "service-utilization",
        name: "服务利用率",
        unit: "%",
        normalRange: [70, 90],
        criticalThreshold: 50,
        icon: "Gauge",
        category: "business",
      },
      {
        id: "health-monitoring",
        name: "健康监测数",
        unit: "人",
        normalRange: [50, 200],
        criticalThreshold: 300,
        icon: "Users",
        category: "operations",
      },
      {
        id: "response-time",
        name: "响应时间",
        unit: "分钟",
        normalRange: [1, 5],
        criticalThreshold: 10,
        icon: "Clock",
        category: "performance",
      },
      {
        id: "data-security",
        name: "数据安全等级",
        unit: "%",
        normalRange: [95, 100],
        criticalThreshold: 85,
        icon: "Lock",
        category: "security",
      },
    ],
    dashboardLayout: {
      widgets: [],
      refreshInterval: 5000,
      alertPriority: ["security", "operations", "performance"],
    },
    aiModels: [
      {
        id: "health-risk-prediction",
        name: "健康风险预测",
        type: "prediction",
        enabled: true,
        parameters: { horizon: 24, confidence: 0.85 },
      },
      {
        id: "resource-management",
        name: "资源管理优化",
        type: "optimization",
        enabled: true,
        parameters: { strategy: "dynamic" },
      },
    ],
    highPerformance: {
      maxThroughput: 50000,
      targetLatency: 50,
      cacheStrategy: "aggressive",
    },
    highAvailability: {
      targetUptime: 99.95,
      failoverTime: 10,
      backupStrategy: "realtime",
    },
    highSecurity: {
      encryptionLevel: "advanced",
      authMethod: "mfa",
      complianceStandards: ["ISO27001", "GDPR"],
    },
    highIntelligence: {
      aiCapabilities: ["健康预测", "资源管理", "智能监控"],
      predictionAccuracy: 0.85,
      autoDecisionLevel: "suggest",
    },
    highEfficiency: {
      automationLevel: 80,
      resourceOptimization: true,
      costReductionTarget: 35,
    },
    standards: {
      apiVersion: "v1.5",
      dataFormat: "json",
      monitoringProtocol: "prometheus",
      serviceLevel: "platinum",
    },
  },

  "yyc3-api": {
    id: "yyc3-api",
    code: "API",
    name: "技术集成",
    icon: "Code",
    description: "API集成与服务管理",
    primaryColor: "violet",
    metrics: [
      {
        id: "api-response-time",
        name: "API响应时间",
        unit: "ms",
        normalRange: [10, 50],
        criticalThreshold: 200,
        icon: "Clock",
        category: "performance",
      },
      {
        id: "api-availability",
        name: "API可用性",
        unit: "%",
        normalRange: [95, 100],
        criticalThreshold: 90,
        icon: "Activity",
        category: "operations",
      },
      {
        id: "api-security",
        name: "API安全等级",
        unit: "%",
        normalRange: [95, 100],
        criticalThreshold: 85,
        icon: "Shield",
        category: "security",
      },
      {
        id: "api-throughput",
        name: "API吞吐量",
        unit: "请求/秒",
        normalRange: [100, 500],
        criticalThreshold: 1000,
        icon: "BarChart3",
        category: "business",
      },
    ],
    dashboardLayout: {
      widgets: [],
      refreshInterval: 5000,
      alertPriority: ["security", "operations", "performance"],
    },
    aiModels: [
      {
        id: "response-time-optimization",
        name: "响应时间优化",
        type: "optimization",
        enabled: true,
        parameters: { strategy: "realtime" },
      },
      {
        id: "security-assessment",
        name: "安全评估",
        type: "classification",
        enabled: true,
        parameters: { threshold: 0.85 },
      },
    ],
    highPerformance: {
      maxThroughput: 100000,
      targetLatency: 5,
      cacheStrategy: "aggressive",
    },
    highAvailability: {
      targetUptime: 99.99,
      failoverTime: 5,
      backupStrategy: "realtime",
    },
    highSecurity: {
      encryptionLevel: "advanced",
      authMethod: "biometric",
      complianceStandards: ["SOC2", "ISO27001", "PCI-DSS"],
    },
    highIntelligence: {
      aiCapabilities: ["响应优化", "安全评估", "智能集成"],
      predictionAccuracy: 0.87,
      autoDecisionLevel: "auto",
    },
    highEfficiency: {
      automationLevel: 95,
      resourceOptimization: true,
      costReductionTarget: 30,
    },
    standards: {
      apiVersion: "v2.0",
      dataFormat: "protobuf",
      monitoringProtocol: "prometheus",
      serviceLevel: "platinum",
    },
  },

  "yyc3-dc": {
    id: "yyc3-dc",
    code: "DC",
    name: "数据中心",
    icon: "Server",
    description: "服务器集群与云资源管理",
    primaryColor: "blue",
    metrics: [
      {
        id: "server-load",
        name: "服务器负载",
        unit: "%",
        normalRange: [20, 70],
        criticalThreshold: 90,
        icon: "Server",
        category: "performance",
      },
      {
        id: "network-throughput",
        name: "网络吞吐量",
        unit: "Gbps",
        normalRange: [10, 50],
        criticalThreshold: 80,
        icon: "Network",
        category: "performance",
      },
      {
        id: "storage-usage",
        name: "存储使用率",
        unit: "%",
        normalRange: [40, 80],
        criticalThreshold: 95,
        icon: "HardDrive",
        category: "operations",
      },
      {
        id: "cooling-efficiency",
        name: "制冷效率",
        unit: "PUE",
        normalRange: [1.2, 1.5],
        criticalThreshold: 2.0,
        icon: "Thermometer",
        category: "operations",
      },
    ],
    dashboardLayout: {
      widgets: [],
      refreshInterval: 3000,
      alertPriority: ["performance", "security", "operations"],
    },
    aiModels: [
      {
        id: "capacity-planning",
        name: "容量规划预测",
        type: "prediction",
        enabled: true,
        parameters: { horizon: 168, confidence: 0.9 },
      },
      {
        id: "failure-prediction",
        name: "故障预测",
        type: "anomaly",
        enabled: true,
        parameters: { sensitivity: 0.9 },
      },
    ],
    highPerformance: {
      maxThroughput: 100000,
      targetLatency: 10,
      cacheStrategy: "aggressive",
    },
    highAvailability: {
      targetUptime: 99.99,
      failoverTime: 5,
      backupStrategy: "realtime",
    },
    highSecurity: {
      encryptionLevel: "advanced",
      authMethod: "biometric",
      complianceStandards: ["ISO27001", "SOC2", "HIPAA"],
    },
    highIntelligence: {
      aiCapabilities: ["容量规划", "故障预测", "性能优化"],
      predictionAccuracy: 0.9,
      autoDecisionLevel: "auto",
    },
    highEfficiency: {
      automationLevel: 90,
      resourceOptimization: true,
      costReductionTarget: 40,
    },
    standards: {
      apiVersion: "v2.0",
      dataFormat: "protobuf",
      monitoringProtocol: "prometheus",
      serviceLevel: "platinum",
    },
  },

  "yyc3-finance": {
    id: "yyc3-finance",
    code: "FINANCE",
    name: "金融科技",
    icon: "DollarSign",
    description: "交易监控与风险管理",
    primaryColor: "green",
    metrics: [
      {
        id: "transaction-volume",
        name: "交易量",
        unit: "笔/秒",
        normalRange: [100, 1000],
        criticalThreshold: 2000,
        icon: "TrendingUp",
        category: "business",
      },
      {
        id: "fraud-score",
        name: "欺诈风险评分",
        unit: "分",
        normalRange: [0, 30],
        criticalThreshold: 70,
        icon: "AlertTriangle",
        category: "security",
      },
      {
        id: "system-latency",
        name: "系统延迟",
        unit: "ms",
        normalRange: [10, 50],
        criticalThreshold: 200,
        icon: "Clock",
        category: "performance",
      },
      {
        id: "compliance-score",
        name: "合规评分",
        unit: "%",
        normalRange: [95, 100],
        criticalThreshold: 85,
        icon: "Shield",
        category: "security",
      },
    ],
    dashboardLayout: {
      widgets: [],
      refreshInterval: 1000,
      alertPriority: ["security", "business", "performance"],
    },
    aiModels: [
      {
        id: "fraud-detection",
        name: "欺诈检测",
        type: "classification",
        enabled: true,
        parameters: { threshold: 0.85, realtime: true },
      },
      {
        id: "risk-assessment",
        name: "风险评估",
        type: "prediction",
        enabled: true,
        parameters: { horizon: 1, confidence: 0.92 },
      },
    ],
    highPerformance: {
      maxThroughput: 50000,
      targetLatency: 50,
      cacheStrategy: "aggressive",
    },
    highAvailability: {
      targetUptime: 99.95,
      failoverTime: 10,
      backupStrategy: "realtime",
    },
    highSecurity: {
      encryptionLevel: "advanced",
      authMethod: "biometric",
      complianceStandards: ["SOC2", "ISO27001", "PCI-DSS"],
    },
    highIntelligence: {
      aiCapabilities: ["欺诈检测", "风险评估", "智能交易"],
      predictionAccuracy: 0.87,
      autoDecisionLevel: "auto",
    },
    highEfficiency: {
      automationLevel: 95,
      resourceOptimization: true,
      costReductionTarget: 30,
    },
    standards: {
      apiVersion: "v2.0",
      dataFormat: "protobuf",
      monitoringProtocol: "prometheus",
      serviceLevel: "platinum",
    },
  },
}

/**
 * 获取行业配置
 */
export function getIndustryConfig(industry: IndustryType): IndustryConfig {
  const config = INDUSTRY_CONFIGS[industry]

  // 如果找不到配置，返回数据中心作为默认配置
  if (!config) {
    console.warn(`Industry config not found for: ${industry}, using default (yyc3-dc)`)
    return INDUSTRY_CONFIGS["yyc3-dc"]
  }

  return config
}

/**
 * 获取所有行业列表
 */
export function getAllIndustries(): IndustryConfig[] {
  return Object.values(INDUSTRY_CONFIGS)
}

/**
 * 根据行业生成定制化指标
 */
export function generateIndustryMetrics(industry: IndustryType): Record<string, number> {
  const config = getIndustryConfig(industry)
  const metrics: Record<string, number> = {}

  config.metrics.forEach((metric) => {
    const [min, max] = metric.normalRange
    const value = Math.floor(Math.random() * (max - min) + min)
    metrics[metric.id] = value
  })

  return metrics
}

/**
 * 获取行业的五高评分
 */
export function getIndustryHighScores(industry: IndustryType): {
  performance: number
  availability: number
  security: number
  intelligence: number
  efficiency: number
} {
  const config = getIndustryConfig(industry)

  return {
    performance: Math.round((config.highPerformance.maxThroughput / 100000) * 100),
    availability: config.highAvailability.targetUptime,
    security:
      config.highSecurity.encryptionLevel === "advanced"
        ? 95
        : config.highSecurity.encryptionLevel === "standard"
          ? 80
          : 65,
    intelligence: Math.round(config.highIntelligence.predictionAccuracy * 100),
    efficiency: config.highEfficiency.automationLevel,
  }
}

/**
 * 获取行业标准化配置
 */
export function getIndustryStandards(industry: IndustryType): StandardsConfig {
  const config = getIndustryConfig(industry)
  return config.standards
}
