/**
 * @file useEmailActions.ts
 * @description 单个邮件操作Hook
 * @module hooks
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

import { useCallback } from 'react';
import { useEmailContext } from '../context/EmailContext';
import { NewEmail, Attachment } from '../types';

/**
 * 单个邮件操作Hook
 * 提供单个邮件相关的操作功能
 */
export const useEmailActions = () => {
  const {
    currentEmail,
    getEmailById,
    sendEmail,
    toggleStar,
    markAsRead,
  } = useEmailContext();

  // 打开邮件详情
  const openEmail = useCallback((id: string) => {
    return getEmailById(id);
  }, [getEmailById]);

  // 切换邮件星标状态
  const toggleEmailStar = useCallback((id: string) => {
    return toggleStar(id);
  }, [toggleStar]);

  // 标记单个邮件为已读/未读
  const toggleReadStatus = useCallback((id: string, read?: boolean) => {
    // 如果没有指定read参数，则根据当前状态切换
    const targetStatus = read !== undefined ? read : 
      currentEmail?.id === id ? !currentEmail.isRead : !read;
    
    return markAsRead([id], targetStatus);
  }, [currentEmail, markAsRead]);

  // 准备回复邮件的数据
  const prepareReply = useCallback((email: { id: string; from: string; subject: string }) => {
    return {
      to: [email.from],
      subject: email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`,
      content: `\n\n--- Original Message ---\nFrom: ${email.from}\nSubject: ${email.subject}\nDate: ${new Date().toLocaleString()}\n`,
      replyToId: email.id,
    };
  }, []);

  // 准备转发邮件的数据
  const prepareForward = useCallback((email: { subject: string; content: string; attachments?: Attachment[] }) => {
    return {
      to: [],
      subject: email.subject.startsWith('Fw:') ? email.subject : `Fw: ${email.subject}`,
      content: `\n\n--- Forwarded Message ---\nSubject: ${email.subject}\nDate: ${new Date().toLocaleString()}\n\n${email.content}`,
      attachments: email.attachments,
    };
  }, []);

  // 发送回复邮件
  const replyToEmail = useCallback(async (emailId: string, replyContent: Partial<NewEmail>) => {
    await getEmailById(emailId);
    if (!currentEmail) {
      throw new Error('原始邮件未找到');
    }
    
    const replyData = prepareReply(currentEmail);
    const finalReply = {
      ...replyData,
      ...replyContent,
    };
    
    return sendEmail(finalReply);
  }, [getEmailById, currentEmail, prepareReply, sendEmail]);

  // 发送转发邮件
  const forwardEmail = useCallback(async (emailId: string, forwardContent: Partial<NewEmail>) => {
    await getEmailById(emailId);
    if (!currentEmail) {
      throw new Error('原始邮件未找到');
    }
    
    const forwardData = prepareForward(currentEmail);
    const finalForward = {
      ...forwardData,
      ...forwardContent,
    };
    
    return sendEmail(finalForward);
  }, [getEmailById, currentEmail, prepareForward, sendEmail]);

  // 创建新邮件
  const createNewEmail = useCallback(() => {
    return {
      to: [],
      cc: [],
      bcc: [],
      subject: '',
      content: '',
      attachments: [],
    };
  }, []);

  // 下载邮件附件
  const downloadAttachment = useCallback((attachmentId: string, fileName: string) => {
    // 这里应该调用API服务来下载附件
    // 由于API服务尚未完全实现，这里提供一个基本的实现框架
    // 在实际项目中，应该使用emailService.downloadAttachment方法
    console.log(`下载附件: ${fileName} (${attachmentId})`);
    
    // 返回一个Promise以保持接口一致性
    return Promise.resolve();
  }, []);

  return {
    // 当前邮件
    currentEmail,
    
    // 邮件操作
    openEmail,
    toggleEmailStar,
    toggleReadStatus,
    replyToEmail,
    forwardEmail,
    createNewEmail,
    downloadAttachment,
    
    // 辅助函数
    prepareReply,
    prepareForward,
  };
};
