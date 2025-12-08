/**
 * @file UI一致性监控脚本
 * @description 用于监控和检测项目中UI一致性问题的自动化工具
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import chalk from 'chalk';
import { parse } from 'node-html-parser';

// 获取当前文件路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

/**
 * UI一致性监控器类
 */
class UIConsistencyMonitor {
  /**
   * 构造函数
   * @param {Object} options 配置选项
   */
  constructor(options = {}) {
    this.reportOutput = options.reportOutput || path.join(projectRoot, 'reports/ui-consistency');
    this.includeDirs = options.includeDirs || ['components', 'app', 'pages'];
    this.excludePatterns = options.excludePatterns || [/node_modules/, /dist/, /build/, /\.next/];
    this.cssVariablesPath = options.cssVariablesPath || path.join(projectRoot, 'lib/theme/css-variables.css');
    this.cssVariables = this.extractCSSVariables();
    
    // 创建报告目录
    if (!fs.existsSync(this.reportOutput)) {
      fs.mkdirSync(this.reportOutput, { recursive: true });
    }
  }

  /**
   * 从CSS变量文件中提取变量
   * @returns {Object} CSS变量映射
   */
  extractCSSVariables() {
    try {
      const cssContent = fs.readFileSync(this.cssVariablesPath, 'utf8');
      const variables = {};
      
      // 匹配:root中的CSS变量
      const rootMatch = cssContent.match(/:root\s*\{([\s\S]*?)\}/);
      if (rootMatch && rootMatch[1]) {
        const varDeclarations = rootMatch[1].match(/--([\w-]+):\s*([^;]+);/g);
        if (varDeclarations) {
          varDeclarations.forEach(declaration => {
            const parts = declaration.trim().split(':');
            const varName = parts[0].trim();
            const varValue = parts[1].replace(';', '').trim();
            variables[varName] = varValue;
          });
        }
      }
      
      return variables;
    } catch (error) {
      console.error(chalk.red(`❌ 无法读取CSS变量文件: ${error.message}`));
      return {};
    }
  }

  /**
   * 检查是否应该排除文件
   * @param {string} filePath 文件路径
   * @returns {boolean} 是否排除
   */
  shouldExcludeFile(filePath) {
    return this.excludePatterns.some(pattern => pattern.test(filePath));
  }

  /**
   * 查找所有需要检查的文件
   * @returns {string[]} 文件路径列表
   */
  findFilesToCheck() {
    const files = [];
    
    this.includeDirs.forEach(dir => {
      const dirPath = path.join(projectRoot, dir);
      if (fs.existsSync(dirPath)) {
        const findFilesRecursively = (currentPath) => {
          const entries = fs.readdirSync(currentPath);
          
          entries.forEach(entry => {
            const fullPath = path.join(currentPath, entry);
            
            if (this.shouldExcludeFile(fullPath)) {
              return;
            }
            
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
              findFilesRecursively(fullPath);
            } else if (/\.(jsx|tsx|js|ts|css)$/.test(entry)) {
              files.push(fullPath);
            }
          });
        };
        
        findFilesRecursively(dirPath);
      }
    });
    
    return files;
  }

  /**
   * 检测硬编码颜色值
   * @param {string} filePath 文件路径
   * @param {string} content 文件内容
   * @returns {Object[]} 问题列表
   */
  detectHardcodedColors(filePath, content) {
    const issues = [];
    // 匹配 #rgb, #rgba, #rrggbb, #rrggbbaa 格式的颜色值，但排除CSS变量定义
    const colorRegex = /(bg|text|border|fill|stroke)\-\[#([a-fA-F0-9]{3,4}|[a-fA-F0-9]{6}|[a-fA-F0-9]{8})\]/g;
    let match;
    
    while ((match = colorRegex.exec(content)) !== null) {
      issues.push({
        type: 'hardcoded-color',
        filePath,
        line: content.substring(0, match.index).split('\n').length,
        match: match[0],
        message: `发现硬编码颜色值: ${match[0]}，建议使用CSS变量或主题类`,
        severity: 'medium'
      });
    }
    
    return issues;
  }

  /**
   * 检测非标准间距值
   * @param {string} filePath 文件路径
   * @param {string} content 文件内容
   * @returns {Object[]} 问题列表
   */
  detectNonStandardSpacing(filePath, content) {
    const issues = [];
    // 匹配非标准间距值，如 p-[18px]
    const spacingRegex = /(p|m|mt|mb|ml|mr|pt|pb|pl|pr|gap|space\-[xy])\-\[(\d+(\.\d+)?)px\]/g;
    let match;
    
    while ((match = spacingRegex.exec(content)) !== null) {
      const value = parseFloat(match[2]);
      // 检查是否为标准间距值（假设标准值为2, 4, 8, 12, 16, 24, 32, 48, 64）
      const standardSpacings = [2, 4, 8, 12, 16, 24, 32, 48, 64];
      
      if (!standardSpacings.includes(value)) {
        issues.push({
          type: 'non-standard-spacing',
          filePath,
          line: content.substring(0, match.index).split('\n').length,
          match: match[0],
          message: `发现非标准间距值: ${match[0]}，建议使用标准间距值`,
          severity: 'low'
        });
      }
    }
    
    return issues;
  }

  /**
   * 检测组件导入方式问题
   * @param {string} filePath 文件路径
   * @param {string} content 文件内容
   * @returns {Object[]} 问题列表
   */
  detectComponentImportIssues(filePath, content) {
    const issues = [];
    // 匹配错误的组件导入方式
    const importRegex = /import\s+(\w+)\s+from\s+['"](@\/components\/ui\/\w+\/\w+)['"];/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      issues.push({
        type: 'component-import-issue',
        filePath,
        line: content.substring(0, match.index).split('\n').length,
        match: match[0],
        message: `错误的组件导入方式: ${match[0]}，应该从包根目录导入`,
        severity: 'high'
      });
    }
    
    return issues;
  }

  /**
   * 检测主题一致性问题
   * @param {string} filePath 文件路径
   * @param {string} content 文件内容
   * @returns {Object[]} 问题列表
   */
  detectThemeConsistencyIssues(filePath, content) {
    const issues = [];
    // 检测可能缺少深色模式适配的颜色类
    const lightColorClasses = [
      'bg-white', 'bg-gray-100', 'text-black', 'text-gray-900',
      'border-gray-200', 'bg-surface-primary(?!\s+dark:bg-dark-surface-primary)'
    ];
    
    lightColorClasses.forEach(className => {
      const regex = new RegExp(`\b${className}\b(?!\s*dark:)`, 'g');
      let match;
      
      while ((match = regex.exec(content)) !== null) {
        issues.push({
          type: 'theme-consistency-issue',
          filePath,
          line: content.substring(0, match.index).split('\n').length,
          match: match[0],
          message: `可能缺少深色模式适配: ${match[0]}，建议添加对应的dark:类`,
          severity: 'medium'
        });
      }
    });
    
    return issues;
  }

  /**
   * 检测可访问性问题
   * @param {string} filePath 文件路径
   * @param {string} content 文件内容
   * @returns {Object[]} 问题列表
   */
  detectAccessibilityIssues(filePath, content) {
    const issues = [];
    
    // 检查表单元素是否缺少label或aria-label
    if (/<input|<select|<textarea/.test(content)) {
      try {
        const root = parse(content);
        const formElements = root.querySelectorAll('input, select, textarea');
        
        formElements.forEach(element => {
          const hasId = element.hasAttribute('id');
          const hasAriaLabel = element.hasAttribute('aria-label');
          const hasLabel = hasId && root.querySelector(`label[for="${element.getAttribute('id')}"]`);
          
          if (!hasAriaLabel && !hasLabel && !element.hasAttribute('type', 'hidden')) {
            issues.push({
              type: 'accessibility-issue',
              filePath,
              line: 1, // 简化处理，实际应该计算行号
              match: element.toString(),
              message: '表单元素缺少label或aria-label属性',
              severity: 'high'
            });
          }
        });
      } catch (error) {
        // 解析失败时跳过，不影响其他检查
      }
    }
    
    return issues;
  }

  /**
   * 运行所有检查
   * @returns {Object} 检查结果
   */
  runChecks() {
    console.log(chalk.blue('🚀 开始UI一致性检查...'));
    
    const startTime = Date.now();
    const files = this.findFilesToCheck();
    let allIssues = [];
    
    console.log(chalk.green(`📄 找到 ${files.length} 个需要检查的文件`));
    
    files.forEach((filePath, index) => {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const relativePath = path.relative(projectRoot, filePath);
        
        console.log(`🔍 检查文件 ${index + 1}/${files.length}: ${relativePath}`);
        
        // 运行所有检测
        const issues = [
          ...this.detectHardcodedColors(filePath, content),
          ...this.detectNonStandardSpacing(filePath, content),
          ...this.detectComponentImportIssues(filePath, content),
          ...this.detectThemeConsistencyIssues(filePath, content),
          ...this.detectAccessibilityIssues(filePath, content)
        ];
        
        allIssues = [...allIssues, ...issues];
      } catch (error) {
        console.error(chalk.red(`❌ 检查文件 ${filePath} 时出错: ${error.message}`));
      }
    });
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log(chalk.blue(`✅ UI一致性检查完成，用时 ${duration.toFixed(2)} 秒`));
    
    return {
      issues: allIssues,
      summary: {
        totalFiles: files.length,
        totalIssues: allIssues.length,
        issuesBySeverity: {
          high: allIssues.filter(issue => issue.severity === 'high').length,
          medium: allIssues.filter(issue => issue.severity === 'medium').length,
          low: allIssues.filter(issue => issue.severity === 'low').length
        },
        issuesByType: this.countIssuesByType(allIssues),
        duration
      }
    };
  }

  /**
   * 统计问题类型分布
   * @param {Object[]} issues 问题列表
   * @returns {Object} 类型统计
   */
  countIssuesByType(issues) {
    const typeCount = {};
    
    issues.forEach(issue => {
      if (!typeCount[issue.type]) {
        typeCount[issue.type] = 0;
      }
      typeCount[issue.type]++;
    });
    
    return typeCount;
  }

  /**
   * 生成HTML报告
   * @param {Object} results 检查结果
   */
  generateHTMLReport(results) {
    const reportPath = path.join(this.reportOutput, 'report.html');
    const issues = results.issues;
    const summary = results.summary;
    
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>UI一致性检查报告</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        h1, h2 {
          color: #4f46e5;
        }
        .summary {
          background-color: #fff;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          margin-bottom: 20px;
        }
        .stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }
        .stat-card {
          background-color: #f9fafb;
          border-radius: 8px;
          padding: 16px;
          text-align: center;
        }
        .stat-card.high {
          background-color: #fee2e2;
          border: 1px solid #fecaca;
        }
        .stat-card.medium {
          background-color: #fef3c7;
          border: 1px solid #fde68a;
        }
        .stat-card.low {
          background-color: #dbeafe;
          border: 1px solid #bfdbfe;
        }
        .issues {
          background-color: #fff;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          overflow-x: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }
        th {
          background-color: #f9fafb;
          font-weight: 600;
        }
        .severity-high {
          color: #dc2626;
          font-weight: 600;
        }
        .severity-medium {
          color: #d97706;
          font-weight: 600;
        }
        .severity-low {
          color: #2563eb;
          font-weight: 600;
        }
        .no-issues {
          text-align: center;
          padding: 40px;
          color: #10b981;
          font-size: 18px;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #6b7280;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <h1>🔍 UI一致性检查报告</h1>
      
      <div class="summary">
        <h2>📊 摘要</h2>
        <div class="stats">
          <div class="stat-card">
            <h3>检查文件数</h3>
            <p style="font-size: 24px; font-weight: bold;">${summary.totalFiles}</p>
          </div>
          <div class="stat-card">
            <h3>发现问题数</h3>
            <p style="font-size: 24px; font-weight: bold; color: ${summary.totalIssues > 0 ? '#dc2626' : '#10b981'};">
              ${summary.totalIssues}
            </p>
          </div>
          <div class="stat-card high">
            <h3>高危问题</h3>
            <p style="font-size: 24px; font-weight: bold; color: #dc2626;">${summary.issuesBySeverity.high}</p>
          </div>
          <div class="stat-card medium">
            <h3>中危问题</h3>
            <p style="font-size: 24px; font-weight: bold; color: #d97706;">${summary.issuesBySeverity.medium}</p>
          </div>
          <div class="stat-card low">
            <h3>低危问题</h3>
            <p style="font-size: 24px; font-weight: bold; color: #2563eb;">${summary.issuesBySeverity.low}</p>
          </div>
        </div>
        <p style="margin-top: 20px;">检查用时: ${summary.duration.toFixed(2)} 秒</p>
      </div>
      
      <div class="issues">
        <h2>📋 问题详情</h2>
        ${issues.length > 0 ? `
          <table>
            <thead>
              <tr>
                <th>类型</th>
                <th>严重程度</th>
                <th>文件</th>
                <th>行号</th>
                <th>代码片段</th>
                <th>问题描述</th>
              </tr>
            </thead>
            <tbody>
              ${issues.map(issue => `
                <tr>
                  <td>${issue.type}</td>
                  <td class="severity-${issue.severity}">${issue.severity.toUpperCase()}</td>
                  <td>${path.relative(projectRoot, issue.filePath)}</td>
                  <td>${issue.line}</td>
                  <td style="font-family: monospace; font-size: 14px;">${issue.match}</td>
                  <td>${issue.message}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : `
          <div class="no-issues">🎉 太好了！没有发现UI一致性问题。</div>
        `}
      </div>
      
      <div class="footer">
        <p>报告生成时间: ${new Date().toLocaleString('zh-CN')}</p>
        <p>© 2024 YYC3 未来感仪表盘 - UI一致性监控工具</p>
      </div>
    </body>
    </html>
    `;
    
    fs.writeFileSync(reportPath, htmlContent, 'utf8');
    console.log(chalk.green(`📄 HTML报告已生成: ${reportPath}`));
    
    return reportPath;
  }

  /**
   * 生成JSON报告
   * @param {Object} results 检查结果
   */
  generateJSONReport(results) {
    const reportPath = path.join(this.reportOutput, 'report.json');
    
    const jsonResults = {
      timestamp: new Date().toISOString(),
      summary: results.summary,
      issues: results.issues.map(issue => ({
        ...issue,
        filePath: path.relative(projectRoot, issue.filePath)
      }))
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(jsonResults, null, 2), 'utf8');
    console.log(chalk.green(`📄 JSON报告已生成: ${reportPath}`));
    
    return reportPath;
  }

  /**
   * 分析UI一致性趋势
   * @param {string[]} previousReports 历史报告路径
   */
  analyzeTrend(previousReports = []) {
    console.log(chalk.blue('📊 分析UI一致性趋势...'));
    
    const trends = [];
    
    // 加载当前报告
    const currentReportPath = path.join(this.reportOutput, 'report.json');
    if (fs.existsSync(currentReportPath)) {
      const currentReport = JSON.parse(fs.readFileSync(currentReportPath, 'utf8'));
      trends.push({
        date: currentReport.timestamp,
        ...currentReport.summary
      });
    }
    
    // 加载历史报告
    previousReports.forEach(reportPath => {
      if (fs.existsSync(reportPath)) {
        try {
          const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
          trends.push({
            date: report.timestamp,
            ...report.summary
          });
        } catch (error) {
          console.error(chalk.red(`❌ 读取历史报告 ${reportPath} 时出错: ${error.message}`));
        }
      }
    });
    
    // 按时间排序
    trends.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // 生成趋势报告
    const trendReportPath = path.join(this.reportOutput, 'trend-analysis.json');
    fs.writeFileSync(trendReportPath, JSON.stringify(trends, null, 2), 'utf8');
    
    console.log(chalk.green(`📈 趋势分析报告已生成: ${trendReportPath}`));
    
    return trends;
  }

  /**
   * 生成修复建议
   * @param {Object[]} issues 问题列表
   */
  generateFixSuggestions(issues) {
    console.log(chalk.blue('💡 生成修复建议...'));
    
    const suggestions = {};
    
    // 按类型分组问题
    issues.forEach(issue => {
      if (!suggestions[issue.type]) {
        suggestions[issue.type] = {
          count: 0,
          examples: [],
          recommendation: ''
        };
      }
      
      suggestions[issue.type].count++;
      if (suggestions[issue.type].examples.length < 5) {
        suggestions[issue.type].examples.push(issue);
      }
    });
    
    // 添加修复建议
    suggestions['hardcoded-color'] = {
      ...suggestions['hardcoded-color'],
      recommendation: '将硬编码颜色值替换为CSS变量或主题类，如 bg-primary-500 或 bg-[var(--primary-500)]'
    };
    
    suggestions['non-standard-spacing'] = {
      ...suggestions['non-standard-spacing'],
      recommendation: '使用标准间距值: 2, 4, 8, 12, 16, 24, 32, 48, 64px'
    };
    
    suggestions['component-import-issue'] = {
      ...suggestions['component-import-issue'],
      recommendation: '从包根目录导入组件，如 import { Button } from @/components/ui/Button'
    };
    
    suggestions['theme-consistency-issue'] = {
      ...suggestions['theme-consistency-issue'],
      recommendation: '为所有颜色类添加对应的深色模式变体，如 dark:bg-dark-surface-primary'
    };
    
    suggestions['accessibility-issue'] = {
      ...suggestions['accessibility-issue'],
      recommendation: '为所有表单元素添加label或aria-label属性'
    };
    
    const suggestionsPath = path.join(this.reportOutput, 'fix-suggestions.json');
    fs.writeFileSync(suggestionsPath, JSON.stringify(suggestions, null, 2), 'utf8');
    
    console.log(chalk.green(`💡 修复建议已生成: ${suggestionsPath}`));
    
    return suggestions;
  }

  /**
   * 运行完整的监控流程
   * @param {Object} options 运行选项
   */
  async run(options = {}) {
    try {
      // 运行检查
      const results = this.runChecks();
      
      // 生成报告
      this.generateHTMLReport(results);
      this.generateJSONReport(results);
      
      // 生成修复建议
      if (results.issues.length > 0) {
        this.generateFixSuggestions(results.issues);
      }
      
      // 分析趋势
      if (options.analyzeTrend) {
        this.analyzeTrend(options.previousReports || []);
      }
      
      console.log(chalk.green('✅ UI一致性监控完成！'));
      console.log(chalk.blue(`📊 发现 ${results.issues.length} 个问题`));
      
      // 返回退出码
      return results.issues.filter(issue => issue.severity === 'high').length > 0 ? 1 : 0;
    } catch (error) {
      console.error(chalk.red(`❌ UI一致性监控失败: ${error.message}`));
      console.error(error.stack);
      return 1;
    }
  }
}

/**
 * 主函数
 */
async function main() {
  const monitor = new UIConsistencyMonitor();
  const exitCode = await monitor.run({
    analyzeTrend: true
  });
  
  process.exit(exitCode);
}

// 运行主函数
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

// 导出类供其他模块使用
export { UIConsistencyMonitor };