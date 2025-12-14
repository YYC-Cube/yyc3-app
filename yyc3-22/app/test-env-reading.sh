#!/bin/bash

# 测试脚本：验证所有脚本是否能正确读取.env.local配置

set -euo pipefail

# 确保.env.local存在
if [ ! -f services/.env.local ]; then
    echo "❌ services/.env.local 文件不存在"
    exit 1
fi

echo "✅ services/.env.local 文件存在"

echo -e "\n=== 测试脚本的.env.local读取逻辑 ==="

# 测试每个脚本的读取逻辑
scripts_to_test=("init.sh" "ecs-init.sh" "sync-to-nas.sh" "start-services.sh" "deploy-to-aliyun.sh")

for script in "${scripts_to_test[@]}"; do
    script_path="scripts/$script"
    if [ ! -f "$script_path" ]; then
        echo "⏭️  $script 不存在，跳过测试"
        continue
    fi
    
    echo -e "\n🔍 测试 $script:"
    
    # 提取脚本中的ENV_FILE定义和读取逻辑
    grep -A 10 -B 2 "ENV_FILE" "$script_path" || echo "   ❌ 未找到ENV_FILE定义"
    
    # 测试脚本是否能正确解析.env.local（不执行脚本，只检查语法）
    bash -n "$script_path" && echo "   ✅ 语法检查通过" || echo "   ❌ 语法检查失败"
done

echo -e "\n=== 测试直接读取.env.local ==="

# 直接测试我们的读取方法
if [ -f services/.env.local ]; then
    echo "🔧 测试source+进程替换方法："
    # 导出一个测试环境变量
    export TEST_VAR="original_value"
    
    # 使用我们的方法读取.env.local
    source <(grep -v '^#' services/.env.local | sed 's/\r$//' | awk 'BEGIN {FS="="} {print "export \"" $1 "=\"" $2 "\""}')
    
    echo "   ✅ 成功读取.env.local文件"
    echo "   ℹ️  示例环境变量："
    grep -E "^(PORT|HOST|API_KEY)" services/.env.local | head -5 | sed 's/=.*/=/g' | xargs echo "      "
fi

echo -e "\n🎉 环境变量读取测试完成！"
