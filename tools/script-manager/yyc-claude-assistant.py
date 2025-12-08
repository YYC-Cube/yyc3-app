#!/usr/bin/env python3
# =============================================================================
# YY-Cube AI运维助手 - 与Claude集成
# =============================================================================

import requests
import json
import os
from datetime import datetime

class YYCubeClaudeAssistant:
    def __init__(self):
        self.claude_api_key = os.getenv('CLAUDE_API_KEY')
        self.project_path = "/Users/yanyu/www"

    def ask_claude(self, prompt, context=""):
        """向Claude询问项目相关问题"""
        headers = {
            "Authorization": f"Bearer {self.claude_api_key}",
            "Content-Type": "application/json"
        }

        system_prompt = f"""
        你是YY-Cube平台的AI运维助手，专门负责0379.email多项目协同智能化平台。

        项目路径: {self.project_path}
        当前时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

        项目包含:
        - FRP内网穿透服务
        - 微服务架构 (API, Admin, LLM, Mail, NAS等)
        - Docker容器化部署
        - 监控和日志系统

        请提供实用、可执行的建议。
        """

        data = {
            "model": "claude-3-5-sonnet-20241022",
            "max_tokens": 2000,
            "system": system_prompt,
            "messages": [
                {"role": "user", "content": f"{context}\n\n用户问题: {prompt}"}
            ]
        }

        try:
            response = requests.post(
                "https://api.anthropic.com/v1/messages",
                headers=headers,
                json=data
            )
            return response.json()['content'][0]['text']
        except Exception as e:
            return f"抱歉，连接Claude时出错: {str(e)}"

    def analyze_project_status(self):
        """分析项目状态"""
        status_info = {
            "running_containers": self.get_docker_status(),
            "frp_services": self.check_frp_status(),
            "system_resources": self.get_system_info()
        }

        prompt = "请分析当前0379.email平台的运行状态，识别潜在问题并提供优化建议。"
        return self.ask_claude(prompt, json.dumps(status_info, indent=2))

    def get_docker_status(self):
        """获取Docker容器状态"""
        import subprocess
        try:
            result = subprocess.run(['docker', 'ps', '--format', 'json'],
                                  capture_output=True, text=True)
            return result.stdout
        except:
            return "无法获取Docker状态"

    def check_frp_status(self):
        """检查FRP服务状态"""
        import subprocess
        try:
            result = subprocess.run(['pgrep', '-f', 'frp'],
                                  capture_output=True, text=True)
            return "FRP服务运行中" if result.returncode == 0 else "FRP服务未运行"
        except:
            return "无法检查FRP状态"

    def get_system_info(self):
        """获取系统信息"""
        import psutil
        return {
            "cpu_percent": psutil.cpu_percent(),
            "memory_percent": psutil.virtual_memory().percent,
            "disk_usage": psutil.disk_usage('/').percent
        }

# 使用示例
if __name__ == "__main__":
    assistant = YYCubeClaudeAssistant()

    # 交互式问答
    while True:
        question = input("\n请问有什么可以帮助您的？(输入 'quit' 退出): ")
        if question.lower() == 'quit':
            break

        if question == 'status':
            response = assistant.analyze_project_status()
        else:
            response = assistant.ask_claude(question)

        print(f"\n🤖 Claude助手: {response}")