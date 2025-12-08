/**
 * @file UI一致性监控配置
 * @description 配置UI一致性监控工具的规则、阈值和行为
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
 * UI一致性监控配置
 */
const config = {
  /**
   * 基本配置
   */
  base: {
    // 项目根目录
    projectRoot,
    // 报告输出目录
    reportOutput: path.join(projectRoot, 'reports/ui-consistency'),
    // 历史报告保留数量
    historyReportsToKeep: 10,
    // 是否在CI环境中运行
    ciMode: process.env.CI === 'true',
    // 是否生成详细报告
    generateDetailedReports: true,
  },

  /**
   * 文件监控配置
   */
  files: {
    // 需要包含的目录
    includeDirs: [
      'components',
      'app',
      'pages',
      'lib',
      'hooks',
      'utils'
    ],
    // 需要排除的目录/文件模式
    excludePatterns: [
      /node_modules/,
      /dist/,
      /build/,
      /\.next/,
      /\.git/,
      /coverage/,
      /reports/,
      /stories/,
      /\.stories\.(js|jsx|ts|tsx)$/,
      /\.test\.(js|jsx|ts|tsx)$/,
      /\.spec\.(js|jsx|ts|tsx)$/
    ],
    // 需要监控的文件扩展名
    fileExtensions: ['.js', '.jsx', '.ts', '.tsx', '.css', '.scss', '.less'],
  },

  /**
   * 规则配置
   */
  rules: {
    // 硬编码颜色检测
    hardcodedColors: {
      enabled: true,
      // 允许的例外颜色值
      allowedColors: [
        '#000000', // 纯黑
        '#ffffff', // 纯白
        'transparent' // 透明
      ],
      severity: 'medium',
      // 忽略特定模式
      ignorePatterns: [
        /\/\*\s*@ui-ignore-hardcoded-color\s*\*\//g
      ]
    },

    // 非标准间距检测
    nonStandardSpacing: {
      enabled: true,
      // 标准间距值
      standardSpacings: [2, 4, 8, 12, 16, 24, 32, 48, 64],
      severity: 'low',
      // 忽略特定模式
      ignorePatterns: [
        /\/\*\s*@ui-ignore-spacing\s*\*\//g
      ]
    },

    // 组件导入方式检测
    componentImportIssues: {
      enabled: true,
      severity: 'high',
      // 正确的导入路径模式
      correctImportPatterns: [
        /^@\/components\/ui\/[A-Z][\w]+$/ // 如 @/components/ui/Button
      ]
    },

    // 主题一致性检测
    themeConsistency: {
      enabled: true,
      severity: 'medium',
      // 需要深色模式适配的颜色类
      colorClassesToCheck: [
        'bg-white',
        'bg-gray-100',
        'text-black',
        'text-gray-900',
        'border-gray-200',
        'bg-surface-primary',
        'text-text-primary'
      ],
      // 忽略特定模式
      ignorePatterns: [
        /\/\*\s*@ui-ignore-theme\s*\*\//g
      ]
    },

    // 可访问性检测
    accessibility: {
      enabled: true,
      severity: 'high',
      // 检查的元素类型
      elementsToCheck: ['input', 'select', 'textarea', 'button', 'a'],
      // 必须的属性
      requiredAttributes: {
        'input': ['label', 'aria-label'],
        'select': ['label', 'aria-label'],
        'textarea': ['label', 'aria-label'],
        'button': ['aria-label'],
        'a': ['aria-label']
      }
    },

    // CSS变量使用检测
    cssVariablesUsage: {
      enabled: true,
      severity: 'medium',
      // CSS变量文件路径
      cssVariablesPath: path.join(projectRoot, 'lib/theme/css-variables.css'),
      // 允许的直接样式属性
      allowedDirectStyles: ['display', 'position', 'z-index', 'overflow']
    },

    // 组件变体使用检测
    componentVariantUsage: {
      enabled: true,
      severity: 'low',
      // 检查的组件及其有效变体
      components: {
        Button: {
          variants: ['primary', 'secondary', 'ghost', 'destructive'],
          sizes: ['sm', 'md', 'lg']
        },
        Card: {
          variants: ['default', 'elevated', 'outlined'],
          sizes: ['sm', 'md', 'lg']
        },
        Input: {
          variants: ['default', 'filled', 'outlined'],
          sizes: ['sm', 'md', 'lg']
        }
      }
    },

    // 字体一致性检测
    fontConsistency: {
      enabled: true,
      severity: 'low',
      // 允许的字体大小
      allowedFontSizes: ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl'],
      // 允许的字重
      allowedFontWeights: ['font-light', 'font-normal', 'font-medium', 'font-semibold', 'font-bold']
    }
  },

  /**
   * 阈值配置
   */
  thresholds: {
    // 高危问题阈值
    highSeverity: 0, // 不允许有高危问题
    // 中危问题阈值
    mediumSeverity: 10, // 最多允许10个中危问题
    // 低危问题阈值
    lowSeverity: 20, // 最多允许20个低危问题
    // 总体问题阈值
    totalIssues: 30 // 最多允许30个总体问题
  },

  /**
   * 报告配置
   */
  reports: {
    // 生成HTML报告
    html: true,
    // 生成JSON报告
    json: true,
    // 生成趋势报告
    trend: true,
    // 生成修复建议
    suggestions: true,
    // 报告详细程度 (basic, detailed, full)
    detailLevel: 'detailed',
    // 是否在控制台显示问题
    consoleOutput: true,
    // 是否发送报告邮件
    emailReport: false,
    // 邮件配置
    emailConfig: {
      recipients: [],
      subject: 'YYC3 仪表盘 UI一致性检查报告'
    }
  },

  /**
   * 监控集成配置
   */
  integration: {
    // Git集成
    git: {
      enabled: true,
      // 检查未提交的更改
      checkStagedFiles: true,
      // 检查特定分支
      targetBranches: ['main', 'develop'],
      // 与主分支比较
      compareWithBaseBranch: true
    },

    // GitHub/GitLab集成
    ci: {
      enabled: process.env.CI === 'true',
      // 创建评论
      createComment: true,
      // 更新状态
      updateStatus: true,
      // 失败时阻止合并
      blockMergeOnFailure: true,
      // 仅在UI相关文件变更时运行
      onlyRunOnUIChanges: true,
      // UI相关文件模式
      uiFilePatterns: [
        '**/*.{jsx,tsx,css,scss,less}',
        'components/**/*',
        'app/**/*',
        'pages/**/*'
      ]
    },

    // Slack集成
    slack: {
      enabled: false,
      webhookUrl: process.env.SLACK_WEBHOOK_URL,
      channel: '#ui-consistency',
      // 仅在发现问题时通知
      notifyOnlyOnIssues: true
    }
  },

  /**
   * 自动化修复配置
   */
  autoFix: {
    // 是否启用自动修复
    enabled: false,
    // 允许自动修复的规则
    allowedRules: [
      'nonStandardSpacing',
      'componentImportIssues'
    ],
    // 创建修复分支
    createFixBranch: false,
    // 提交消息模板
    commitMessage: 'chore(ui-consistency): 自动修复UI一致性问题'
  },

  /**
   * 忽略配置
   */
  ignore: {
    // 全局忽略文件路径
    files: [],
    // 按规则忽略文件
    byRule: {
      hardcodedColors: [],
      nonStandardSpacing: [],
      componentImportIssues: [],
      themeConsistency: [],
      accessibility: []
    }
  }
};

// 根据环境变量覆盖配置
if (process.env.UI_CONSISTENCY_CONFIG) {
  try {
    const envConfig = JSON.parse(process.env.UI_CONSISTENCY_CONFIG);
    Object.assign(config, envConfig);
  } catch (error) {
    console.error('警告: 无法解析UI_CONSISTENCY_CONFIG环境变量');
  }
}

export default config;