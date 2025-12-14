#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
@file 更新文档头脚本
@description 为所有Markdown文档添加标准的YYC³文档头
@author YYC³
@version 1.0.0
@created 2024-12-08
"""

import os
import re
from datetime import datetime

# 标准文档头模板
DOC_HEADER_TEMPLATE = '''# {title}

> **YYC³ 项目文档**
> 
> @project YYC³ Email Platform
> @type {doc_type}
> @version 1.0.0
> @created {created_date}
> @updated {updated_date}
> @author YYC³ <admin@0379.email>
> @url https://github.com/YY-Nexus/0379-email-platform

'''

# 获取文档类型
def get_doc_type(file_path):
    file_name = os.path.basename(file_path)
    if "技术架构" in file_name or "architecture" in file_name.lower():
        return "技术架构"
    elif "开发规范" in file_name or "coding" in file_name.lower() or "standard" in file_name.lower():
        return "开发规范"
    elif "测试" in file_name or "test" in file_name.lower():
        return "测试文档"
    elif "API" in file_name or "api" in file_name.lower():
        return "API文档"
    elif "部署" in file_name or "deploy" in file_name.lower():
        return "部署文档"
    elif "用户指南" in file_name or "user" in file_name.lower() or "guide" in file_name.lower():
        return "用户指南"
    elif "迭代" in file_name or "sprint" in file_name.lower() or "iteration" in file_name.lower():
        return "迭代文档"
    elif "风险" in file_name or "risk" in file_name.lower():
        return "风险管理"
    elif "性能" in file_name or "performance" in file_name.lower():
        return "性能文档"
    elif "README" in file_name or "readme" in file_name.lower():
        return "项目说明"
    else:
        return "技术文档"

# 更新单个文档的文档头
def update_doc_header(file_path):
    # 读取文件内容
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 提取标题
    title_match = re.match(r'^#\s+(.*)', content)
    if title_match:
        title = title_match.group(1)
    else:
        title = os.path.basename(file_path).replace('.md', '').replace('.markdown', '')
    
    # 检查是否已有YYC³文档头
    if '@project YYC³' in content:
        print(f"跳过已处理的文档: {file_path}")
        return
    
    # 移除旧的标题行
    content = re.sub(r'^#\s+.*\n', '', content, count=1)
    
    # 获取文档类型
    doc_type = get_doc_type(file_path)
    
    # 生成文档头
    now = datetime.now().strftime("%Y-%m-%d")
    doc_header = DOC_HEADER_TEMPLATE.format(
        title=title,
        doc_type=doc_type,
        created_date=now,
        updated_date=now
    )
    
    # 更新文档内容
    new_content = doc_header + content
    
    # 更新文档中的项目名称
    new_content = new_content.replace('0379邮件平台', 'YYC³邮件平台')
    
    # 写入新内容
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"已更新文档头: {file_path}")

# 主函数
def main():
    print("开始更新文档头...")
    
    # 查找所有Markdown文档
    doc_files = []
    for root, dirs, files in os.walk('.'):
        # 排除node_modules目录
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        # 排除.git目录
        if '.git' in dirs:
            dirs.remove('.git')
        # 排除dist、build、.next等目录
        excluded_dirs = ['dist', 'build', '.next', 'output']
        dirs[:] = [d for d in dirs if d not in excluded_dirs]
        
        for file in files:
            if file.endswith('.md') or file.endswith('.markdown'):
                doc_files.append(os.path.join(root, file))
    
    print(f"找到 {len(doc_files)} 个文档文件需要更新")
    
    # 遍历并更新每个文档
    for file_path in doc_files:
        update_doc_header(file_path)
    
    print("文档头更新完成！")

if __name__ == "__main__":
    main()
