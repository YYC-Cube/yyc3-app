#!/usr/bin/env python3
"""
@file 文档头规范化脚本
@description 批量更新项目中文档的文档头格式，确保统一规范
@module docs-header-updater
@author YYC
@version 1.0.0
@created 2025-12-08
@updated 2025-12-08
"""

import os
import re
from datetime import datetime

# 配置
PROJECT_NAME = "YYC³ Email Platform"
PROJECT_URL = "https://github.com/YY-Nexus/0379-email-platform"
AUTHOR = "YYC³ <admin@0379.email>"
DOCS_DIR = "./docs"

# 支持的文档类型
SUPPORTED_EXTENSIONS = [".md"]

# 文档头模板
DOCS_HEADER_TEMPLATE = """# 🚀 {title}

> **YYC³ 项目文档**
> 
> @project {project_name}
> @type {doc_type}
> @version {version}
> @created {created_date}
> @updated {updated_date}
> @author {author}
> @url {project_url}

"""

# 解析现有文档头
HEADER_PATTERN = re.compile(
    r'^#.*?@url.*?\n\n',
    re.DOTALL | re.MULTILINE
)

# 获取文档类型
DOC_TYPE_MAPPING = {
    "getting-started": "快速开始",
    "architecture": "技术架构",
    "development": "开发文档",
    "api-reference": "API文档",
    "deployment": "部署文档",
    "testing": "测试文档"
}

def get_doc_type(file_path):
    """根据文件路径获取文档类型"""
    for doc_type, folder_name in DOC_TYPE_MAPPING.items():
        if folder_name in file_path:
            return doc_type
    return "技术文档"

def update_doc_header(file_path):
    """更新单个文档的文档头"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 提取标题
        title_match = re.match(r'^#\s*(.*?)$', content, re.MULTILINE)
        title = title_match.group(1) if title_match else "未命名文档"
        
        # 提取现有版本信息
        version_match = re.search(r'@version\s*(.*?)$', content, re.MULTILINE)
        version = version_match.group(1) if version_match else "1.0.0"
        
        # 提取创建日期
        created_match = re.search(r'@created\s*(.*?)$', content, re.MULTILINE)
        created_date = created_match.group(1) if created_match else datetime.now().strftime("%Y-%m-%d")
        
        # 更新日期
        updated_date = datetime.now().strftime("%Y-%m-%d")
        
        # 获取文档类型
        doc_type = get_doc_type(file_path)
        
        # 生成新的文档头
        new_header = DOCS_HEADER_TEMPLATE.format(
            title=title,
            project_name=PROJECT_NAME,
            doc_type=doc_type,
            version=version,
            created_date=created_date,
            updated_date=updated_date,
            author=AUTHOR,
            project_url=PROJECT_URL
        )
        
        # 替换或添加文档头
        if HEADER_PATTERN.match(content):
            new_content = HEADER_PATTERN.sub(new_header, content, count=1)
        else:
            # 没有文档头，添加到开头
            new_content = new_header + content
        
        # 保存更新后的内容
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print(f"✅ 更新成功: {file_path}")
        return True
        
    except Exception as e:
        print(f"❌ 更新失败: {file_path} - {str(e)}")
        return False

def main():
    """主函数"""
    print("🚀 开始更新文档头...")
    
    success_count = 0
    fail_count = 0
    
    # 遍历文档目录
    for root, dirs, files in os.walk(DOCS_DIR):
        for file in files:
            if any(file.endswith(ext) for ext in SUPPORTED_EXTENSIONS):
                file_path = os.path.join(root, file)
                if update_doc_header(file_path):
                    success_count += 1
                else:
                    fail_count += 1
    
    print(f"\n📊 更新完成!")
    print(f"✅ 成功: {success_count} 个文档")
    print(f"❌ 失败: {fail_count} 个文档")

if __name__ == "__main__":
    main()