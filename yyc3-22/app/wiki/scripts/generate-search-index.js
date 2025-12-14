#!/usr/bin/env node

/**
 * @file generate-search-index.js
 * @description 文档搜索索引生成工具
 * @module wiki-scripts
 * @author YYC
 * @version 1.0.0
 * @created 2024-01-01
 * @updated 2024-01-01
 */

const fs = require('fs');
const path = require('path');

// 设置日志级别
const LOG_LEVEL = {
  ERROR: 0,
  WARNING: 1,
  INFO: 2,
  DEBUG: 3
};

let currentLogLevel = LOG_LEVEL.INFO;

// 日志函数
function log(level, message) {
  if (level <= currentLogLevel) {
    const timestamp = new Date().toISOString().replace('T', ' ').substr(0, 19);
    console.log(`[${timestamp}] [${Object.keys(LOG_LEVEL).find(k => LOG_LEVEL[k] === level)}] ${message}`);
  }
}

// 错误处理函数
function handleError(error, context) {
  log(LOG_LEVEL.ERROR, `${context}: ${error.message}`);
  if (currentLogLevel >= LOG_LEVEL.DEBUG) {
    console.error(error.stack);
  }
  process.exit(1);
}

// 解析命令行参数
function parseArguments() {
  const args = process.argv.slice(2);
  const options = {
    wikiDir: '.',
    outputFile: null,
    updateSearchHtml: true,
    searchHtmlPath: null
  };
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--wiki-dir':
        options.wikiDir = args[++i];
        break;
      case '--output':
      case '-o':
        options.outputFile = args[++i];
        break;
      case '--no-update-html':
        options.updateSearchHtml = false;
        break;
      case '--search-html':
        options.searchHtmlPath = args[++i];
        break;
      case '--debug':
        currentLogLevel = LOG_LEVEL.DEBUG;
        break;
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
      default:
        log(LOG_LEVEL.ERROR, `未知选项: ${args[i]}`);
        showHelp();
        process.exit(1);
    }
  }
  
  return options;
}

// 显示帮助信息
function showHelp() {
  console.log(`文档搜索索引生成工具

用法:
  ${path.basename(process.argv[1])} [选项]

选项:
  --wiki-dir <目录路径>    指定wiki文档根目录 (默认: 当前目录)
  --output, -o <文件路径>  指定索引输出文件路径
  --no-update-html         不更新search.html文件中的索引
  --search-html <文件路径> 指定search.html文件路径
  --debug                  启用调试日志
  --help, -h               显示此帮助信息

示例:
  # 使用默认设置生成索引
  ${path.basename(process.argv[1])}

  # 指定wiki目录
  ${path.basename(process.argv[1])} --wiki-dir ../

  # 仅输出索引文件，不更新HTML
  ${path.basename(process.argv[1])} --output index.json --no-update-html
`);
}

// 从Markdown文件提取信息
function extractDocInfo(filePath, wikiRoot) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relPath = path.relative(wikiRoot, filePath).replace(/\\/g, '/');
    const fileName = path.basename(filePath);
    
    // 从文件头注释提取信息
    let title = fileName;
    let description = '';
    let tags = [];
    let keywords = '';
    
    // 查找JSDoc风格的头部注释
    const headerMatch = content.match(/\/\*\*[\s\S]*?\*\//);
    if (headerMatch) {
      const header = headerMatch[0];
      
      // 提取标题
      const titleMatch = header.match(/@file\s+([^\n]+)/);
      if (titleMatch) {
        title = titleMatch[1].trim();
      }
      
      // 提取描述
      const descMatch = header.match(/@description\s+([^\n]+)/);
      if (descMatch) {
        description = descMatch[1].trim();
      }
      
      // 提取模块作为标签
      const moduleMatch = header.match(/@module\s+([^\n]+)/);
      if (moduleMatch) {
        tags.push(moduleMatch[1].trim());
      }
    }
    
    // 如果没有从头部注释获取到标题，尝试从文件内容中获取
    if (!description) {
      // 尝试从H1标题获取标题
      const h1Match = content.match(/^#\s+([^\n]+)/m);
      if (h1Match) {
        title = h1Match[1].trim();
        if (!description) {
          // 如果没有描述，从标题生成一个
          description = `${title} 详细说明`;
        }
      }
    }
    
    // 根据路径添加默认标签
    if (relPath.startsWith('Services/')) {
      tags.push('服务文档', 'API');
    } else if (relPath.startsWith('Deployment/')) {
      tags.push('部署', '配置');
    } else if (relPath.startsWith('Security/')) {
      tags.push('安全', '最佳实践');
    } else if (relPath.startsWith('FAQ/')) {
      tags.push('FAQ', '问题解答');
    }
    
    // 如果是根目录下的文件
    if (path.dirname(relPath) === '.') {
      if (fileName === 'Home.md') {
        tags.push('概览', '架构');
      } else if (fileName === 'README.md') {
        tags.push('导航', '指南');
      }
    }
    
    // 生成关键词
    keywords = `${title},${description},${tags.join(',')}`;
    
    return {
      title: title,
      path: relPath,
      description: description || '文档详细说明',
      tags: [...new Set(tags)], // 去重
      keywords: keywords
    };
  } catch (error) {
    log(LOG_LEVEL.ERROR, `解析文件失败: ${filePath} - ${error.message}`);
    return null;
  }
}

// 扫描目录中的Markdown文件
function scanMarkdownFiles(wikiDir) {
  const wikiRoot = path.resolve(wikiDir);
  const docIndex = [];
  
  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      // 跳过隐藏目录和文件
      if (entry.name.startsWith('.')) continue;
      
      if (entry.isDirectory()) {
        // 跳过模板目录和脚本目录，除非明确要求包含
        if (entry.name === '.templates' || entry.name === 'scripts') continue;
        scanDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        const docInfo = extractDocInfo(fullPath, wikiRoot);
        if (docInfo) {
          docIndex.push(docInfo);
        }
      }
    }
  }
  
  scanDir(wikiRoot);
  return docIndex;
}

// 生成索引JSON
function generateIndexJson(docIndex) {
  // 为每个文档添加ID
  const indexedDocs = docIndex.map((doc, index) => ({
    id: index + 1,
    ...doc
  }));
  
  return JSON.stringify(indexedDocs, null, 2);
}

// 更新search.html文件中的索引
function updateSearchHtml(searchHtmlPath, docIndex) {
  try {
    log(LOG_LEVEL.INFO, `更新搜索页面: ${searchHtmlPath}`);
    
    const htmlContent = fs.readFileSync(searchHtmlPath, 'utf8');
    const indexedDocs = docIndex.map((doc, index) => ({
      id: index + 1,
      ...doc
    }));
    
    // 创建索引数据的JS字符串，确保正确格式化和转义
    const indexJson = JSON.stringify(indexedDocs, null, 4);
    const indexJsCode = `// 文档索引数据
const docIndex = ${indexJson};`;
    
    // 替换search.html中的索引数据
    const updatedHtml = htmlContent.replace(
      /\/\/ 文档索引数据\s*const docIndex = \[.+?\];/s,
      indexJsCode
    );
    
    fs.writeFileSync(searchHtmlPath, updatedHtml, 'utf8');
    log(LOG_LEVEL.INFO, `搜索页面更新成功: ${searchHtmlPath}`);
    
  } catch (error) {
    handleError(error, `更新搜索页面失败`);
  }
}

// 主函数
function main() {
  try {
    log(LOG_LEVEL.INFO, '文档搜索索引生成工具启动');
    
    // 解析命令行参数
    const options = parseArguments();
    
    // 确定wiki根目录
    const wikiDir = path.resolve(options.wikiDir);
    log(LOG_LEVEL.INFO, `扫描wiki目录: ${wikiDir}`);
    
    // 扫描Markdown文件并提取信息
    const docIndex = scanMarkdownFiles(wikiDir);
    log(LOG_LEVEL.INFO, `找到 ${docIndex.length} 个Markdown文档`);
    
    // 生成索引JSON
    const indexJson = generateIndexJson(docIndex);
    
    // 如果指定了输出文件，写入文件
    if (options.outputFile) {
      const outputPath = path.resolve(options.outputFile);
      fs.writeFileSync(outputPath, indexJson, 'utf8');
      log(LOG_LEVEL.INFO, `索引已写入: ${outputPath}`);
    }
    
    // 如果需要更新search.html
    if (options.updateSearchHtml) {
      const searchHtmlPath = options.searchHtmlPath 
        ? path.resolve(options.searchHtmlPath)
        : path.join(wikiDir, 'search.html');
      
      if (fs.existsSync(searchHtmlPath)) {
        updateSearchHtml(searchHtmlPath, docIndex);
      } else {
        log(LOG_LEVEL.WARNING, `未找到搜索页面: ${searchHtmlPath}，跳过更新`);
      }
    }
    
    log(LOG_LEVEL.INFO, '文档搜索索引生成完成');
    process.exit(0);
    
  } catch (error) {
    handleError(error, '程序执行失败');
  }
}

// 执行主函数
main();
