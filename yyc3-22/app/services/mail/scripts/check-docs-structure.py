#!/usr/bin/env python3
"""
@file 文档结构检查脚本
@description 检查项目文档结构是否符合标准化要求
@module docs-structure-checker
@author YYC
@version 1.0.0
@created 2025-12-08
@updated 2025-12-08
"""

import os
import sys

# 标准化文档目录结构
STANDARD_DOCS_STRUCTURE = {
    "docs": [
        "getting-started",
        "architecture",
        "development",
        "api-reference",
        "deployment",
        "testing"
    ]
}

# 必要的文档文件
REQUIRED_DOCS = {
    "getting-started": ["README.md", "project-summary-report.md"],
    "architecture": ["技术架构文档.md", "技术选型与依赖管理.md"],
    "development": ["前端界面设计规范.md", "开发规范与最佳实践.md"],
    "api-reference": ["API架构设计文档.md"],
    "deployment": ["运维部署与监控文档.md"],
    "testing": ["testing-strategy.md"]
}

def check_directory_structure(base_path):
    """检查目录结构是否符合标准"""
    print("🔍 检查文档目录结构...")
    
    issues = []
    
    # 检查主文档目录
    for root_dir, expected_subdirs in STANDARD_DOCS_STRUCTURE.items():
        root_path = os.path.join(base_path, root_dir)
        if not os.path.exists(root_path):
            issues.append(f"❌ 缺少主文档目录: {root_path}")
            continue
        
        # 检查子目录
        for subdir in expected_subdirs:
            subdir_path = os.path.join(root_path, subdir)
            if not os.path.exists(subdir_path):
                issues.append(f"❌ 缺少子目录: {subdir_path}")
    
    return issues

def check_required_docs(base_path):
    """检查必要的文档文件是否存在"""
    print("📄 检查必要文档文件...")
    
    issues = []
    
    for subdir, required_files in REQUIRED_DOCS.items():
        subdir_path = os.path.join(base_path, "docs", subdir)
        if not os.path.exists(subdir_path):
            continue
        
        for doc_file in required_files:
            doc_path = os.path.join(subdir_path, doc_file)
            if not os.path.exists(doc_path):
                issues.append(f"⚠️  缺少必要文档: {doc_path}")
    
    return issues

def check_document_headers(base_path):
    """检查文档头是否规范"""
    print("📋 检查文档头规范...")
    
    issues = []
    
    # 遍历所有markdown文件
    for root, dirs, files in os.walk(os.path.join(base_path, "docs")):
        for file in files:
            if file.endswith(".md"):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # 检查是否包含必要的文档头字段
                    required_fields = ["@project", "@type", "@version", "@created", "@updated", "@author", "@url"]
                    for field in required_fields:
                        if field not in content:
                            issues.append(f"⚠️  文档头缺少字段 {field}: {file_path}")
                            break
                except Exception as e:
                    issues.append(f"❌ 无法读取文档: {file_path} - {str(e)}")
    
    return issues

def main():
    """主函数"""
    base_path = os.getcwd()
    
    print("🚀 开始文档结构检查...")
    print(f"📁 检查路径: {base_path}")
    print("=" * 50)
    
    all_issues = []
    
    # 执行各项检查
    all_issues.extend(check_directory_structure(base_path))
    all_issues.extend(check_required_docs(base_path))
    all_issues.extend(check_document_headers(base_path))
    
    print("=" * 50)
    
    # 输出结果
    if all_issues:
        print(f"❌ 发现 {len(all_issues)} 个问题:")
        for issue in all_issues:
            print(f"   {issue}")
        sys.exit(1)
    else:
        print("✅ 文档结构检查通过！所有文档符合标准化要求。")
        sys.exit(0)

if __name__ == "__main__":
    main()