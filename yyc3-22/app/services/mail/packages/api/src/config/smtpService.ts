/**
 * @file SMTP服务
 * @description 提供邮件发送功能
 * @module config/smtpService
 * @author YYC
 * @version 1.0.0
 * @created 2024-01-15
 */

import nodemailer from 'nodemailer';
import { logInfo, logError } from '../utils/logger';
import { ApiError } from '../middlewares/errorHandler';

/**
 * SMTP配置接口
 */
interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

/**
 * 邮件附件接口
 */
interface EmailAttachment {
  filename: string;
  path: string;
  contentType?: string;
}

/**
 * 邮件选项接口
 */
interface EmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
}

/**
 * SMTP服务类
 */
export class SmtpService {
  private transporter: nodemailer.Transporter;
  private config: SmtpConfig;

  /**
   * 构造函数
   */
  constructor() {
    // 从环境变量获取SMTP配置
    this.config = {
      host: process.env.SMTP_HOST || 'smtp.example.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || 'your-email@example.com',
        pass: process.env.SMTP_PASSWORD || 'your-password'
      },
      from: process.env.SMTP_FROM || 'your-email@example.com'
    };

    // 创建SMTP传输器
    this.transporter = nodemailer.createTransport(this.config);
  }

  /**
   * 验证SMTP连接
   * @returns Promise<boolean> 连接是否成功
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logInfo('SMTP连接验证成功', {
        host: this.config.host,
        port: this.config.port
      });
      return true;
    } catch (error) {
      logError('SMTP连接验证失败', error as Error, {
        host: this.config.host,
        port: this.config.port
      });
      return false;
    }
  }

  /**
   * 发送邮件
   * @param options 邮件选项
   * @returns Promise<string> 邮件ID
   * @throws ApiError 发送失败时抛出错误
   */
  async sendEmail(options: EmailOptions): Promise<string> {
    try {
      logInfo('准备发送邮件', {
        to: options.to,
        subject: options.subject
      });

      // 发送邮件
      const result = await this.transporter.sendMail({
        from: this.config.from,
        to: options.to,
        cc: options.cc,
        bcc: options.bcc,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments
      });

      logInfo('邮件发送成功', {
        messageId: result.messageId,
        to: options.to,
        subject: options.subject
      });

      return result.messageId || '';
    } catch (error) {
      logError('邮件发送失败', error as Error, {
        to: options.to,
        subject: options.subject
      });
      throw new ApiError(500, '邮件发送失败，请稍后重试');
    }
  }

  /**
   * 批量发送邮件
   * @param emails 邮件列表
   * @returns Promise<{success: number, failed: number}> 发送结果统计
   */
  async sendBulkEmails(emails: EmailOptions[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const email of emails) {
      try {
        await this.sendEmail(email);
        success++;
      } catch (error) {
        failed++;
      }
    }

    logInfo('批量邮件发送完成', {
      total: emails.length,
      success,
      failed
    });

    return { success, failed };
  }

  /**
   * 获取SMTP配置信息
   * @returns SmtpConfig 配置信息
   */
  getConfig(): SmtpConfig {
    return {
      ...this.config,
      auth: {
        user: this.config.auth.user,
        pass: '********' // 隐藏密码
      }
    };
  }
}

// 导出单例实例
export const smtpService = new SmtpService();
