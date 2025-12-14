/**

* @file README.md
* @description Wiki脚本工具说明 - 文档相关脚本工具指南
* @module tools
* @author YYC
* @version 1.0.0
* @created 2024-01-15
* @updated 2024-01-15
* @tags 脚本工具,文档维护,自动化
* @keywords 文档脚本,健康检查,自动化工具
 */

# Wiki 脚本工具说明

## 概述

本目录包含用于文档维护、健康监控和自动化的脚本工具，旨在提高文档管理效率和确保文档质量。

## 目录内容

* `health-monitor.sh` - 文档健康监控脚本

## 脚本说明

### health-monitor.sh

**功能说明**：监控wiki文档的健康状态，检查文档格式规范、链接有效性等。

**使用方法**：

```bash
# 基本使用
./health-monitor.sh

# 指定检查范围
./health-monitor.sh --path ../Services

# 生成详细报告
./health-monitor.sh --report detailed

# 修复自动检测到的问题
./health-monitor.sh --fix
```

**检查项**：

* 文档头部规范检查
* 内部链接有效性检查
* Markdown格式检查
* 文件命名规范检查
* 更新时间一致性检查

## 脚本开发指南

### 编写新脚本

1. 遵循标准shell脚本规范：
   * 使用`#!/bin/bash`作为shebang
   * 添加标准JSDoc风格头部注释
   * 实现严格的错误处理
   * 添加详细的使用说明和参数解析

2. 脚本命名规范：
   * 使用连字符(-)分隔单词
   * 明确表达脚本功能
   * 示例：`doc-validator.sh`, `link-checker.sh`

3. 文档更新要求：
   * 新脚本添加后，同时更新本README.md文件
   * 确保每个脚本都有完整的使用文档

## 最佳实践

1. 定期运行文档健康检查，确保文档质量
2. 将脚本执行集成到CI/CD流程中
3. 为脚本设置适当的执行权限
4. 定期备份脚本文件

## 贡献指南

如果您希望添加新的文档脚本工具，请遵循以下流程：

1. 确保新脚本符合上述规范
2. 更新本README.md文件
3. 提交代码审查
4. 合并到主分支

---

*最后更新时间：2024-01-15*
