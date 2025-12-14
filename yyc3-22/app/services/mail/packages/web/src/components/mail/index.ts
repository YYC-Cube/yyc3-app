/**
 * @file 邮件业务组件库索引
 * @description 统一导出邮件相关业务组件
 * @module components/mail
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

// 导入所有组件
import { EmailListItem } from './EmailListItem';
import { EmailList } from './EmailList';
import { EmailDetail } from './EmailDetail';
import { EmailComposer } from './EmailComposer';

// 命名导出
export { EmailListItem, EmailList, EmailDetail, EmailComposer };

// 类型导出
export type { EmailItemProps } from './EmailListItem';
export type { EmailListProps } from './EmailList';
export type { EmailDetailProps } from './EmailDetail';
export type { EmailComposerProps, Recipient, Attachment } from './EmailComposer';

// 默认导出所有组件
export default {
  EmailListItem,
  EmailList,
  EmailDetail,
  EmailComposer,
};