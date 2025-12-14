# 邮件服务API概述

## 文档说明

本目录包含YYC3邮件服务的API文档，详细描述了邮件服务提供的所有API接口、参数说明和使用示例。

## API基本信息

### 服务地址

```
API地址：http://api.0379.email:4000/mail
管理地址：http://admin.0379.email:4001/mail
```

### API版本

- 当前版本：v1
- 版本管理：API路径中包含版本号（如/v1）

### 认证方式

邮件服务API使用JWT令牌进行认证，需要在请求头中添加`Authorization`字段：

```
Authorization: Bearer <JWT_TOKEN>
```

### 请求格式

- **Content-Type**：`application/json`
- 所有请求参数使用JSON格式

### 响应格式

所有API响应使用统一的JSON格式：

```json
{
  "code": 200,
  "message": "成功",
  "data": { /* 响应数据 */ }
}
```

### 错误码说明

| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |
| 502 | 网关错误 |
| 503 | 服务不可用 |

## API文档结构

```
api/
├── MAIL_API_OVERVIEW.md     # 邮件服务API概述
├── SEND_EMAIL_API.md        # 发送邮件API
├── EMAIL_TEMPLATE_API.md    # 邮件模板API
├── EMAIL_HISTORY_API.md     # 邮件历史API
├── EMAIL_STATISTICS_API.md  # 邮件统计API
└── MAIL_SETTINGS_API.md     # 邮件设置API
```

## API使用示例

### 发送邮件示例

```bash
curl -X POST "http://api.0379.email:4000/mail/v1/send" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "to": "user@example.com",
    "subject": "测试邮件",
    "content": "这是一封测试邮件",
    "templateId": "template_123"
  }'
```

### 获取邮件历史示例

```bash
curl -X GET "http://api.0379.email:4000/mail/v1/history?page=1&pageSize=10" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

## API版本管理

1. **API版本号**：在API路径中包含版本号，如`/mail/v1/send`
2. **版本兼容**：新的API版本应保持向后兼容
3. **版本弃用**：弃用的API版本会在文档中明确标记，并给出迁移建议
4. **版本发布**：新的API版本发布前需要经过充分的测试和审核

---

**[⬆️ 回到顶部](#邮件服务API概述)**

Made with ❤️ by YYC3 AI Family Team

**言启象限，语枢智能** 📧