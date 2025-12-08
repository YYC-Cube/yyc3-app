/**
 * @file UI问题跟踪配置
 * @description 配置UI一致性问题的自动跟踪、分类和报告机制
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

/**
 * UI问题跟踪配置
 */
const config = {
  /**
   * 基础配置
   */
  base: {
    // 问题跟踪器类型 (github, gitlab, jira, custom)
    trackerType: 'github',
    // 是否自动创建问题
    autoCreateIssues: true,
    // 是否自动更新现有问题
    autoUpdateIssues: true,
    // 是否在发现问题时通知
    notifyOnIssues: true,
    // 问题跟踪历史存储路径
    historyPath: path.join(projectRoot, '.ui-tracker-history'),
    // 最大问题数量限制
    maxIssuesLimit: 50,
    // 是否按照严重性分组问题
    groupBySeverity: true,
  },

  /**
   * GitHub 配置
   */
  github: {
    // GitHub 仓库所有者
    owner: process.env.GITHUB_OWNER || process.env.GITHUB_REPOSITORY?.split('/')[0] || 'yanyu',
    // GitHub 仓库名称
    repo: process.env.GITHUB_REPO || process.env.GITHUB_REPOSITORY?.split('/')[1] || 'yyc3-futuristic-dashboard',
    // GitHub Token
    token: process.env.GITHUB_TOKEN,
    // 默认标签
    defaultLabels: ['ui-consistency', 'automated-issue', 'needs-review'],
    // 按规则分配标签
    ruleLabels: {
      hardcodedColors: ['color-system', 'design-tokens'],
      nonStandardSpacing: ['spacing', 'design-tokens'],
      componentImportIssues: ['component-library', 'import-pattern'],
      themeConsistency: ['theme', 'dark-mode'],
      accessibility: ['accessibility', 'a11y'],
      cssVariablesUsage: ['css-variables', 'design-tokens'],
      componentVariantUsage: ['component-library', 'variants'],
      fontConsistency: ['typography', 'design-tokens']
    },
    // 按严重性分配标签
    severityLabels: {
      high: ['high-priority'],
      medium: ['medium-priority'],
      low: ['low-priority']
    },
    // 问题标题模板
    titleTemplate: '[UI一致性] {{ruleName}}: {{summary}}',
    // 问题模板目录
    templatesDir: path.join(projectRoot, '.github/ISSUE_TEMPLATE'),
    // 是否使用问题模板
    useIssueTemplate: true,
    // 问题模板文件
    issueTemplateFile: 'ui-consistency.md',
  },

  /**
   * 问题分类配置
   */
  categorization: {
    // 按组件分类
    byComponent: true,
    // 组件检测模式
    componentPatterns: [
      /\/components\/(\w+)\//,
      /import.*from.*'@\/components\/(\w+)/
    ],
    // 按模块分类
    byModule: true,
    // 模块检测模式
    modulePatterns: [
      /\/app\/(\w+)\//,
      /\/pages\/(\w+)\//,
      /\/features\/(\w+)\//
    ],
    // 按类型分类
    byType: true,
    // 类型分类映射
    typeMapping: {
      hardcodedColors: '设计令牌',
      nonStandardSpacing: '间距规范',
      componentImportIssues: '组件使用',
      themeConsistency: '主题适配',
      accessibility: '可访问性',
      cssVariablesUsage: 'CSS变量',
      componentVariantUsage: '组件变体',
      fontConsistency: '字体规范'
    }
  },

  /**
   * 问题合并配置
   */
  merging: {
    // 是否合并相似问题
    enabled: true,
    // 相似度阈值 (0-1)
    similarityThreshold: 0.8,
    // 合并超时 (小时)
    mergeTimeoutHours: 24,
    // 仅合并相同规则的问题
    sameRuleOnly: true,
    // 仅合并相同严重性的问题
    sameSeverityOnly: false,
    // 合并策略 (append, replace, update)
    mergeStrategy: 'append'
  },

  /**
   * 问题生命周期配置
   */
  lifecycle: {
    // 问题关闭策略 (manual, automatic)
    closeStrategy: 'manual',
    // 自动关闭间隔 (天)
    autoCloseDays: 30,
    // 提醒间隔 (天)
    reminderDays: 7,
    // 问题解决检查
    resolutionCheck: {
      enabled: true,
      // 检查间隔 (小时)
      checkIntervalHours: 12,
      // 检查方法 (ci, scheduled, on-demand)
      checkMethod: 'ci',
      // 标记为已修复的置信度阈值
      confidenceThreshold: 0.9
    },
    // 问题优先级调整
    priorityAdjustment: {
      enabled: true,
      // 提高优先级的天数
      raisePriorityDays: 14,
      // 降低优先级的天数
      lowerPriorityDays: 30
    }
  },

  /**
   * 报告配置
   */
  reporting: {
    // 生成摘要报告
    generateSummary: true,
    // 摘要报告路径
    summaryPath: path.join(projectRoot, 'reports/ui-consistency/summary.md'),
    // 生成趋势报告
    generateTrend: true,
    // 趋势报告路径
    trendPath: path.join(projectRoot, 'reports/ui-consistency/trend.json'),
    // 趋势数据保留天数
    trendRetentionDays: 90,
    // 生成详细报告
    generateDetailedReport: true,
    // 详细报告路径
    detailedReportPath: path.join(projectRoot, 'reports/ui-consistency/detailed.md'),
    // 报告格式 (markdown, html, json)
    reportFormats: ['markdown', 'json'],
    // 报告频率 (daily, weekly, monthly)
    reportFrequency: 'weekly',
    // 报告日期 (周一=1, 周二=2, ..., 周日=0)
    reportDay: 1,
    // 报告时间 (24小时制)
    reportTime: '09:00'
  },

  /**
   * 通知配置
   */
  notifications: {
    // 邮件通知
    email: {
      enabled: false,
      recipients: [],
      subjectTemplate: 'UI一致性问题报告: {{count}}个新问题',
      smtp: {
        host: process.env.EMAIL_SMTP_HOST,
        port: process.env.EMAIL_SMTP_PORT || 587,
        secure: process.env.EMAIL_SMTP_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_SMTP_USER,
          pass: process.env.EMAIL_SMTP_PASS
        }
      }
    },
    // Slack通知
    slack: {
      enabled: false,
      webhookUrl: process.env.SLACK_WEBHOOK_URL,
      channel: '#ui-consistency',
      messageTemplate: '发现{{count}}个UI一致性问题，详情请查看问题跟踪器',
      // 仅报告高危问题
      onlyHighPriority: false
    },
    // Teams通知
    teams: {
      enabled: false,
      webhookUrl: process.env.TEAMS_WEBHOOK_URL,
      messageTemplate: '发现{{count}}个UI一致性问题，详情请查看问题跟踪器'
    }
  },

  /**
   * 问题解决配置
   */
  resolution: {
    // 建议的解决方案
    generateSuggestions: true,
    // 解决方案模板
    suggestionTemplates: {
      hardcodedColors: '请使用CSS变量替代硬编码颜色。例如：将`background-color: #1a237e;`替换为`background-color: var(--color-primary);`',
      nonStandardSpacing: '请使用标准间距值。标准间距值：{{standardSpacings}}px',
      componentImportIssues: '请使用正确的组件导入路径：`import Component from "@/components/ui/Component";`',
      themeConsistency: '请确保为深色模式提供适当的样式。例如：使用`dark:bg-gray-900`等类名',
      accessibility: '请添加必要的可访问性属性。例如：为输入框添加`aria-label`或关联的`label`元素',
      cssVariablesUsage: '请使用CSS变量替代直接的样式值。参考`lib/theme/css-variables.css`中的可用变量',
      componentVariantUsage: '请使用组件的有效变体。有效变体：{{validVariants}}',
      fontConsistency: '请使用标准字体大小和字重类。参考设计系统文档'
    },
    // 自动修复配置
    autoFix: {
      enabled: false,
      // 允许自动修复的规则
      allowedRules: [
        'nonStandardSpacing',
        'componentImportIssues'
      ],
      // 创建修复PR
      createFixPR: false,
      // PR模板
      prTemplate: {
        title: 'chore(ui-consistency): 自动修复UI一致性问题',
        body: '此PR由UI一致性监控工具自动创建，修复了检测到的以下问题：\n\n{{issuesList}}'
      }
    }
  },

  /**
   * 统计和分析配置
   */
  analytics: {
    // 启用趋势分析
    enabled: true,
    // 跟踪指标
    metrics: [
      'totalIssues',
      'issuesBySeverity',
      'issuesByRule',
      'resolutionTime',
      'componentsWithMostIssues'
    ],
    // 数据存储位置
    dataPath: path.join(projectRoot, 'reports/ui-consistency/analytics'),
    // 分析周期 (day, week, month, quarter)
    period: 'week',
    // 生成图表
    generateCharts: true,
    // 图表格式 (svg, png, json)
    chartFormats: ['svg', 'json']
  }
};

// 根据环境变量覆盖配置
if (process.env.UI_ISSUE_TRACKER_CONFIG) {
  try {
    const envConfig = JSON.parse(process.env.UI_ISSUE_TRACKER_CONFIG);
    Object.assign(config, envConfig);
  } catch (error) {
    console.error('警告: 无法解析UI_ISSUE_TRACKER_CONFIG环境变量');
  }
}

export default config;