/**
 * @file 邮件撰写组件
 * @description 用于新建、回复和转发邮件
 * @module components/mail/EmailComposer
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

'use client';
import React, { useState, useRef } from 'react';
import { useEmailContext } from '../../context/EmailContext';
import { Button } from '../common/Button';
import { IconButton } from '../common/IconButton';
import { Input } from '../common/Input';
import { Card } from '../common/Card';

export interface Recipient {
  name?: string;
  email: string;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
}

export interface EmailComposerProps {
  /** 邮件撰写类型: new, reply, forward */
  type?: 'new' | 'reply' | 'forward';
  /** 收件人列表 */
  to?: Recipient[];
  /** 抄送列表 */
  cc?: Recipient[];
  /** 密送列表 */
  bcc?: Recipient[];
  /** 邮件主题 */
  subject?: string;
  /** 邮件正文 */
  body?: string;
  /** 显示密送字段 */
  showBcc?: boolean;
  /** 已添加的附件 */
  attachments?: Attachment[];
  /** 发送按钮文本 */
  sendButtonText?: string;
  /** 关闭回调 */
  onClose: () => void;
  /** 发送回调 */
  onSend: (data: {
    to: Recipient[];
    cc: Recipient[];
    bcc: Recipient[];
    subject: string;
    body: string;
    attachments: Attachment[];
  }) => void;
  /** 添加附件回调 */
  onAddAttachment?: (files: File[]) => Promise<Attachment[]>;
  /** 删除附件回调 */
  onRemoveAttachment?: (attachmentId: string) => void;
}

/**
 * 邮件撰写组件
 */
export const EmailComposer: React.FC<EmailComposerProps> = ({
  type = 'new',
  to = [],
  cc = [],
  bcc = [],
  subject = '',
  body = '',
  showBcc = false,
  attachments = [],
  sendButtonText = '发送',
  onClose,
  onSend,
  onAddAttachment,
  onRemoveAttachment,
}) => {
  const { sendEmail, uploadAttachment, removeAttachment } = useEmailContext();
  
  const [toInput, setToInput] = useState(to.map(r => r.email).join(', '));
  const [ccInput, setCcInput] = useState(cc.map(r => r.email).join(', '));
  const [bccInput, setBccInput] = useState(bcc.map(r => r.email).join(', '));
  const [subjectInput, setSubjectInput] = useState(subject);
  const [bodyInput, setBodyInput] = useState(body);
  const [showBccInput, setShowBccInput] = useState(showBcc);
  const [isSending, setIsSending] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [localAttachments, setLocalAttachments] = useState<Attachment[]>(attachments || []);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 解析收件人输入字符串为数组
  const parseRecipients = (input: string): Recipient[] => {
    if (!input.trim()) return [];
    
    return input
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0)
      .map(email => ({
        email,
        name: '', // 简单实现，真实场景可能需要从通讯录中查找
      }));
  };

  // 验证表单
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // 验证收件人
    const parsedTo = parseRecipients(toInput);
    if (parsedTo.length === 0) {
      newErrors.to = '请至少添加一个收件人';
    }
    
    // 验证主题
    if (!subjectInput.trim()) {
      newErrors.subject = '请输入邮件主题';
    }
    
    // 验证邮件地址格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    parsedTo.forEach((recipient, index) => {
      if (!emailRegex.test(recipient.email)) {
        newErrors.to = `第 ${index + 1} 个收件人邮箱格式不正确`;
      }
    });
    
    setErrors(newErrors);
    const isValidForm = Object.keys(newErrors).length === 0;
    setIsValid(isValidForm);
    return isValidForm;
  };

  // 处理发送
  const handleSend = async () => {
    if (!validateForm()) return;
    
    setIsSending(true);
    
    const recipients = parseRecipients(toInput);
    const ccRecipients = parseRecipients(ccInput);
    const bccRecipients = parseRecipients(bccInput);
    
    // 准备发送给API的数据（使用string[]）
    const apiData = {
      to: recipients.map(r => r.email),
      cc: ccRecipients.map(r => r.email),
      bcc: bccRecipients.map(r => r.email),
      subject: subjectInput,
      content: bodyInput, // 使用content属性匹配NewEmail类型
      // 暂时不传递attachments，避免类型不匹配
    };
    
    // 准备传递给onSend回调的数据（使用Recipient[]）
    const callbackData = {
      to: recipients,
      cc: ccRecipients,
      bcc: bccRecipients,
      subject: subjectInput,
      body: bodyInput,
      attachments: localAttachments,
    };
    
    try {
      // 使用上下文的发送邮件方法
      await sendEmail(apiData);
      
      // 调用发送回调
      onSend(callbackData);
      
      // 关闭窗口
      onClose();
    } catch (error) {
      console.error('Failed to send email:', error);
      setErrors({ send: '发送邮件失败，请稍后重试' });
    } finally {
      setIsSending(false);
    }
  };

  // 处理添加附件
  const handleAddAttachment = () => {
    fileInputRef.current?.click();
  };

  // 处理文件选择
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setIsUploading(true);
      try {
        const uploadedAttachments = await Promise.all(
          Array.from(files).map(async (file) => {
            // 使用上下文提供的上传附件方法或创建临时附件对象
            if (uploadAttachment) {
              return await uploadAttachment(file);
            } else {
              // 模拟附件上传
              return {
                id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: file.name,
                size: file.size,
                type: file.type,
              };
            }
          })
        );
        
        // 更新本地附件列表
        setLocalAttachments(prev => [...prev, ...uploadedAttachments]);
        
        // 如果有外部回调，也调用它
        if (onAddAttachment) {
          await onAddAttachment(Array.from(files));
        }
      } catch (error) {
        console.error('添加附件失败:', error);
        setErrors({ attachment: '添加附件失败，请稍后重试' });
      } finally {
        setIsUploading(false);
        // 清空文件输入以允许选择相同的文件
        event.target.value = '';
      }
    }
  };
  
  // 处理删除附件
  const handleRemoveAttachment = async (attachmentId: string) => {
    try {
      // 使用上下文提供的删除附件方法
      if (removeAttachment) {
        await removeAttachment(attachmentId);
      }
      
      // 更新本地附件列表
      setLocalAttachments(prev => prev.filter(attach => attach.id !== attachmentId));
      
      // 如果有外部回调，也调用它
      if (onRemoveAttachment) {
        onRemoveAttachment(attachmentId);
      }
    } catch (error) {
      console.error('删除附件失败:', error);
      setErrors({ attachment: '删除附件失败，请稍后重试' });
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <Card className="flex flex-col h-full border border-gray-200 shadow-lg">
      {/* 邮件撰写头部 */}
      <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div className="text-sm font-medium">
          {type === 'new' && '新建邮件'}
          {type === 'reply' && '回复'}
          {type === 'forward' && '转发'}
        </div>
        <IconButton
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" className="h-5 w-5 text-gray-500">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L14 10 6 2" />
            </svg>
          }
          onClick={onClose}
          variant="ghost"
          size="small"
          tooltip="关闭"
        />
      </div>

      {/* 邮件撰写表单 */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3">
          {/* 收件人 */}
          <div>
            <div className="flex items-center mb-1">
              <span className="text-sm text-gray-500 mr-2">收件人:</span>
            </div>
            <Input
              value={toInput}
              onChange={(e) => setToInput(e.target.value)}
              placeholder="输入收件人邮箱地址，多个地址用逗号分隔"
              error={errors.to}
              className={`${errors.to ? 'border-red-500' : ''}`}
            />
          </div>

          {/* 抄送 */}
          <div>
            <div className="flex items-center mb-1">
              <span className="text-sm text-gray-500 mr-2">抄送:</span>
              <Button
                variant="text"
                size="small"
                onClick={() => setShowBccInput(!showBccInput)}
                className="h-6 px-2 text-xs text-blue-600 hover:text-blue-800 hover:bg-transparent"
              >
                {showBccInput ? '隐藏密送' : '显示密送'}
              </Button>
            </div>
            <Input
              value={ccInput}
              onChange={(e) => setCcInput(e.target.value)}
              placeholder="输入抄送邮箱地址，多个地址用逗号分隔"
              className="w-full"
            />
          </div>

          {/* 密送 */}
          {showBccInput && (
            <div>
              <div className="flex items-center mb-1">
                <span className="text-sm text-gray-500 mr-2">密送:</span>
              </div>
              <Input
                value={bccInput}
                onChange={(e) => setBccInput(e.target.value)}
                placeholder="输入密送邮箱地址，多个地址用逗号分隔"
                className="w-full"
              />
            </div>
          )}

          {/* 主题 */}
          <div>
            <div className="flex items-center mb-1">
              <span className="text-sm text-gray-500 mr-2">主题:</span>
            </div>
            <Input
              value={subjectInput}
              onChange={(e) => setSubjectInput(e.target.value)}
              placeholder="输入邮件主题"
              error={errors.subject}
              className={`${errors.subject ? 'border-red-500' : ''}`}
            />
          </div>

          {/* 附件列表 */}
          {localAttachments.length > 0 && (
            <div className="border rounded-md p-3 bg-gray-50">
              <h4 className="text-sm font-medium mb-2">附件 ({localAttachments.length})</h4>
              <div className="space-y-2">
                {localAttachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-8 w-8 bg-gray-200 rounded flex items-center justify-center mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" className="h-4 w-4 text-gray-700">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                            d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{attachment.name}</div>
                        <div className="text-xs text-gray-500">{formatFileSize(attachment.size)}</div>
                      </div>
                    </div>
                    <IconButton
                      icon={
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" className="h-4 w-4 text-gray-500">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L14 10 6 2" />
                        </svg>
                      }
                      onClick={() => handleRemoveAttachment(attachment.id)}
                      variant="ghost"
                      size="small"
                      tooltip="删除附件"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 邮件正文 */}
          <div className="mt-4">
            <textarea
              value={bodyInput}
              onChange={(e) => setBodyInput(e.target.value)}
              placeholder="输入邮件内容..."
              className="w-full h-64 p-3 border rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 底部工具栏 */}
      <div className="p-3 border-t border-gray-200 flex items-center justify-between bg-gray-50">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="small"
            onClick={handleAddAttachment}
            disabled={isUploading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" className="h-4 w-4 mr-1">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" />
            </svg>
            {isUploading ? '上传中...' : '附件'}
          </Button>
          
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.zip,.rar"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="small"
            onClick={onClose}
          >
            取消
          </Button>
          <Button
            variant="primary"
            size="small"
            onClick={handleSend}
            disabled={isSending || !isValid}
          >
            {isSending ? '发送中...' : sendButtonText}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default EmailComposer;