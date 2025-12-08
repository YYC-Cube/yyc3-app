"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";

export function VoiceSettings() {
  const [voiceSettings, setVoiceSettings] = useState({
    voice: "zh-CN-XiaoxiaoNeural",
    speed: 1,
    pitch: 1,
    volume: 1,
  });

  const voices = [
    { id: "zh-CN-XiaoxiaoNeural", name: "晓晓（女声）" },
    { id: "zh-CN-YunxiNeural", name: "云希（男声）" },
    { id: "zh-CN-XiaoyiNeural", name: "晓伊（女声）" },
    { id: "zh-CN-YunjianNeural", name: "云健（男声）" },
    { id: "zh-CN-XiaochenNeural", name: "晓辰（女声）" },
  ];

  const handleSave = async () => {
    // 这里将保存设置到数据库
    console.log("保存语音设置:", voiceSettings);
    // 实际应用中会调用API保存到数据库
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>语音设置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Voice Selection */}
          <div className="space-y-2">
            <Label htmlFor="voice">语音选择</Label>
            <select
              id="voice"
              value={voiceSettings.voice}
              onChange={(e) =>
                setVoiceSettings({ ...voiceSettings, voice: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {voices.map((voice) => (
                <option key={voice.id} value={voice.id}>
                  {voice.name}
                </option>
              ))}
            </select>
          </div>

          {/* Speed Control */}
          <div className="space-y-2">
            <Label htmlFor="speed">语速: {voiceSettings.speed}x</Label>
            <input
              id="speed"
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={voiceSettings.speed}
              onChange={(e) =>
                setVoiceSettings({
                  ...voiceSettings,
                  speed: parseFloat(e.target.value),
                })
              }
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0.5x</span>
              <span>1.0x</span>
              <span>2.0x</span>
            </div>
          </div>

          {/* Pitch Control */}
          <div className="space-y-2">
            <Label htmlFor="pitch">音调: {voiceSettings.pitch}</Label>
            <input
              id="pitch"
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={voiceSettings.pitch}
              onChange={(e) =>
                setVoiceSettings({
                  ...voiceSettings,
                  pitch: parseFloat(e.target.value),
                })
              }
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>低</span>
              <span>正常</span>
              <span>高</span>
            </div>
          </div>

          {/* Volume Control */}
          <div className="space-y-2">
            <Label htmlFor="volume">音量: {Math.round(voiceSettings.volume * 100)}%</Label>
            <input
              id="volume"
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={voiceSettings.volume}
              onChange={(e) =>
                setVoiceSettings({
                  ...voiceSettings,
                  volume: parseFloat(e.target.value),
                })
              }
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Test Voice Button */}
          <div className="pt-4">
            <Button variant="outline" className="w-full mb-2">
              测试语音
            </Button>
            <p className="text-sm text-gray-500 text-center">
              点击按钮测试当前语音设置效果
            </p>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t">
            <Button onClick={handleSave} className="w-full">
              保存设置
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}