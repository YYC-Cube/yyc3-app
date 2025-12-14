# 邮件业务组件库

> **YYC³ 项目文档**
> 
> @project YYC³ Email Platform
> @type 项目说明
> @version 1.0.0
> @created 2025-12-08
> @updated 2025-12-08
> @author YYC³ <admin@0379.email>
> @url https://github.com/YY-Nexus/0379-email-platform


本文档详细介绍邮件业务组件库的使用方法和示例。

## 1. EmailListItem 邮件列表项组件

### 组件说明
邮件列表项组件用于显示单个邮件的摘要信息，包含发件人、主题、预览和各种标记。

### Props

| 属性名 | 类型 | 默认值 | 说明 |
|-------|------|-------|------|
| email | `EmailItem` | 必填 | 邮件数据对象 |
| isSelected | `boolean` | `false` | 是否选中 |
| onSelect | `(emailId: string) => void` | `undefined` | 选中事件处理函数 |
| onToggleCheckbox | `(emailId: string, checked: boolean) => void` | `undefined` | 复选框切换事件处理函数 |
| onToggleStar | `(emailId: string) => void` | `undefined` | 星标切换事件处理函数 |
| onToggleImportant | `(emailId: string) => void` | `undefined` | 重要标记切换事件处理函数 |
| onToggleRead | `(emailId: string) => void` | `undefined` | 已读状态切换事件处理函数 |
| className | `string` | `''` | 自定义样式类名 |

### EmailItem 类型定义

```typescript
interface EmailItem {
  id: string;
  sender: {
    name: string;
    email: string;
  };
  recipients: Array<{ name: string; email: string }>;
  subject: string;
  body: string;
  isRead: boolean;
  isStarred: boolean;
  isImportant: boolean;
  attachments?: Array<{
    id: string;
    name: string;
    size: number;
    type: string;
  }>;
  createdAt: string;
  folder: string;
}
```

### 使用示例

```tsx
import { EmailListItem } from '@/components/mail';

// 基础用法
<EmailListItem 
  email={emailItem} 
  onSelect={(id) => console.log('选中邮件:', id)} 
/>

// 显示复选框
<EmailListItem 
  email={emailItem} 
  isSelected={selectedEmailId === emailItem.id}
  onToggleCheckbox={(id, checked) => handleToggleCheckbox(id, checked)} 
  onSelect={(id) => setSelectedEmailId(id)} 
/>

// 自定义操作
<EmailListItem 
  email={emailItem} 
  onToggleStar={(id) => toggleStar(id)} 
  onToggleImportant={(id) => toggleImportant(id)} 
  onToggleRead={(id) => toggleRead(id)} 
/>
```

## 2. EmailList 邮件列表组件

### 组件说明
邮件列表组件用于显示邮件列表，支持全选、排序、批量操作等功能。

### Props

| 属性名 | 类型 | 默认值 | 说明 |
|-------|------|-------|------|
| emails | `EmailItem[]` | `[]` | 邮件列表数据 |
| selectedIds | `string[]` | `[]` | 已选中的邮件ID列表 |
| onSelectEmail | `(emailId: string) => void` | 必填 | 选中邮件事件处理函数 |
| onBatchDelete | `(ids: string[]) => void` | `undefined` | 批量删除事件处理函数 |
| onBatchMarkRead | `(ids: string[]) => void` | `undefined` | 批量标记已读事件处理函数 |
| onBatchMarkUnread | `(ids: string[]) => void` | `undefined` | 批量标记未读事件处理函数 |
| onBatchToggleStar | `(ids: string[]) => void` | `undefined` | 批量星标切换事件处理函数 |
| sortBy | `'date' \| 'subject' \| 'sender'` | `'date'` | 排序字段 |
| sortOrder | `'asc' \| 'desc'` | `'desc'` | 排序顺序 |
| onSortChange | `(field: string, order: string) => void` | `undefined` | 排序变化事件处理函数 |
| loading | `boolean` | `false` | 是否显示加载状态 |
| className | `string` | `''` | 自定义样式类名 |

### 使用示例

```tsx
import { EmailList } from '@/components/mail';

// 基础用法
<EmailList 
  emails={emailList} 
  onSelectEmail={(id) => setSelectedEmailId(id)} 
/>

// 带批量操作
<EmailList 
  emails={emailList} 
  selectedIds={selectedIds}
  onSelectEmail={(id) => setSelectedEmailId(id)} 
  onBatchDelete={(ids) => handleBatchDelete(ids)} 
  onBatchMarkRead={(ids) => handleBatchMarkRead(ids)} 
  onBatchMarkUnread={(ids) => handleBatchMarkUnread(ids)} 
  onBatchToggleStar={(ids) => handleBatchToggleStar(ids)} 
/>

// 自定义排序
<EmailList 
  emails={emailList} 
  sortBy="subject"
  sortOrder="asc"
  onSortChange={(field, order) => setSortOptions({ field, order })} 
  onSelectEmail={(id) => setSelectedEmailId(id)} 
/>

// 加载状态
<EmailList 
  emails={emailList} 
  loading 
  onSelectEmail={(id) => setSelectedEmailId(id)} 
/>
```

## 3. EmailDetail 邮件详情组件

### 组件说明
邮件详情组件用于显示邮件的完整内容，包含发件人、收件人、主题、正文和附件等。

### Props

| 属性名 | 类型 | 默认值 | 说明 |
|-------|------|-------|------|
| email | `EmailItem` | 必填 | 邮件数据对象 |
| onBack | `() => void` | `undefined` | 返回事件处理函数 |
| onReply | `() => void` | `undefined` | 回复事件处理函数 |
| onReplyAll | `() => void` | `undefined` | 回复全部事件处理函数 |
| onForward | `() => void` | `undefined` | 转发事件处理函数 |
| onDelete | `() => void` | `undefined` | 删除事件处理函数 |
| onToggleStar | `() => void` | `undefined` | 星标切换事件处理函数 |
| onToggleImportant | `() => void` | `undefined` | 重要标记切换事件处理函数 |
| onToggleRead | `() => void` | `undefined` | 已读状态切换事件处理函数 |
| onDownloadAttachment | `(attachmentId: string) => void` | `undefined` | 下载附件事件处理函数 |
| className | `string` | `''` | 自定义样式类名 |

### 使用示例

```tsx
import { EmailDetail } from '@/components/mail';

// 基础用法
<EmailDetail 
  email={selectedEmail} 
  onBack={() => setSelectedEmail(null)} 
/>

// 带完整操作功能
<EmailDetail 
  email={selectedEmail} 
  onBack={() => setSelectedEmail(null)} 
  onReply={() => handleReply(selectedEmail)} 
  onReplyAll={() => handleReplyAll(selectedEmail)} 
  onForward={() => handleForward(selectedEmail)} 
  onDelete={() => handleDelete(selectedEmail.id)} 
  onToggleStar={() => handleToggleStar(selectedEmail.id)} 
  onToggleImportant={() => handleToggleImportant(selectedEmail.id)} 
  onToggleRead={() => handleToggleRead(selectedEmail.id)} 
  onDownloadAttachment={(attachmentId) => handleDownloadAttachment(attachmentId)} 
/>
```

## 4. EmailComposer 邮件撰写组件

### 组件说明
邮件撰写组件用于新建、回复和转发邮件，包含收件人、抄送、主题、正文和附件等功能。

### Props

| 属性名 | 类型 | 默认值 | 说明 |
|-------|------|-------|------|
| mode | `'new' \| 'reply' \| 'forward'` | `'new'` | 撰写模式 |
| originalEmail | `EmailItem` | `undefined` | 原始邮件（用于回复或转发） |
| onSend | `(email: Partial<EmailItem>) => void` | 必填 | 发送邮件事件处理函数 |
| onCancel | `() => void` | `undefined` | 取消事件处理函数 |
| className | `string` | `''` | 自定义样式类名 |

### 使用示例

```tsx
import { EmailComposer } from '@/components/mail';

// 新建邮件
<EmailComposer 
  mode="new" 
  onSend={(email) => handleSendEmail(email)} 
  onCancel={() => setShowComposer(false)} 
/>

// 回复邮件
<EmailComposer 
  mode="reply" 
  originalEmail={selectedEmail} 
  onSend={(email) => handleSendEmail(email)} 
  onCancel={() => setShowComposer(false)} 
/>

// 转发邮件
<EmailComposer 
  mode="forward" 
  originalEmail={selectedEmail} 
  onSend={(email) => handleSendEmail(email)} 
  onCancel={() => setShowComposer(false)} 
/>
```

## 主题支持

所有业务组件都支持主题切换，会根据当前主题自动调整颜色和样式，确保与整体应用风格一致。

## 响应式设计

组件内置了响应式样式，在桌面、平板和移动设备上都能提供良好的用户体验。

## 性能优化

组件实现了以下性能优化措施：

1. 使用React.memo减少不必要的重渲染
2. 列表项虚拟化（当邮件数量较多时）
3. 懒加载邮件内容和附件
4. 事件处理器缓存

## 无障碍支持

组件符合WCAG 2.1 AA级标准，支持键盘导航和屏幕阅读器。

---

© 2024 邮件业务组件库 - 所有组件均支持主题切换和响应式设计 🌹