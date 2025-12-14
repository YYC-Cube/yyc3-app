'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { EmailComposer } from '@/components/mail';
import { IconButton } from '@/components/common';
import { useTheme } from '@/theme';

/**
 * @file 邮件撰写页面
 * @description 提供邮件编辑、收件人添加和发送功能
 * @author YYC
 * @version 1.0.0
 */
export default function ComposeEmail() {
  const router = useRouter();
  const { theme } = useTheme();

  const handleBackClick = () => {
    router.back();
  };

  const handleSendEmail = (emailData: {
    to: { name?: string; email: string }[];
    cc: { name?: string; email: string }[];
    bcc: { name?: string; email: string }[];
    subject: string;
    body: string;
    attachments: { id: string; name: string; size: number; type: string; previewUrl?: string }[];
  }) => {
    console.log('发送邮件:', emailData);
    // 模拟发送成功后返回收件箱
    router.push('/');
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <div className="flex flex-col h-full">
      {/* 页面头部 */}
      <div className="sticky top-0 z-10 bg-white border-b p-4 flex items-center">
        <IconButton
          icon={<ArrowLeft size={20} />}
          onClick={handleBackClick}
          aria-label="返回"
          size="small"
          className="mr-3"
        />
        <h1 className="text-lg font-medium">写邮件</h1>
      </div>
      
      {/* 邮件撰写组件 */}
      <div className="flex-1 overflow-auto">
        <EmailComposer onSend={handleSendEmail} onClose={handleClose} />
      </div>
    </div>
  );
}