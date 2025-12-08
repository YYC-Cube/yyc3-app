"use client";

import { useState } from "react";
import { ChatInterface } from "./chat-interface";
import { VoiceSettings } from "./voice-settings";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { MessageCircle, Settings, Phone, History, User } from "lucide-react";

export function DashboardClient() {
  const [activeTab, setActiveTab] = useState<"chat" | "settings" | "history">("chat");

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Phone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">YYC3 AI通话</h1>
              <p className="text-sm text-gray-500">智能对话系统</p>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              variant={activeTab === "chat" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("chat")}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              AI对话
            </Button>

            <Button
              variant={activeTab === "history" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("history")}
            >
              <History className="w-4 h-4 mr-2" />
              历史记录
            </Button>

            <Button
              variant={activeTab === "settings" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("settings")}
            >
              <Settings className="w-4 h-4 mr-2" />
              语音设置
            </Button>
          </div>
        </div>

        <div className="absolute bottom-0 w-64 p-6 border-t">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">演示用户</p>
              <p className="text-xs text-gray-500">demo@yyc3.ai</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {activeTab === "chat" && "AI对话助手"}
              {activeTab === "history" && "对话历史"}
              {activeTab === "settings" && "语音设置"}
            </h2>
            <div className="text-sm text-gray-500">
              🟢 开发模式 - 无需登录
            </div>
          </div>
        </header>

        <div className="flex-1 p-6">
          {activeTab === "chat" && <ChatInterface />}
          {activeTab === "history" && (
            <Card>
              <CardHeader>
                <CardTitle>对话历史</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">历史记录功能开发中...</p>
                <div className="mt-4 space-y-2">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium">示例对话 1</p>
                    <p className="text-sm text-gray-600">关于AI技术的讨论</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium">示例对话 2</p>
                    <p className="text-sm text-gray-600">产品咨询对话</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {activeTab === "settings" && <VoiceSettings />}
        </div>
      </div>
    </div>
  );
}