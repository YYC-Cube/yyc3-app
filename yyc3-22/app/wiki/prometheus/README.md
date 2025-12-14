/**

* @file README.md
* @description Prometheus监控配置说明 - 系统监控和告警配置指南
* @module monitoring
* @author YYC
* @version 1.0.0
* @created 2024-01-15
* @updated 2024-01-15
* @tags 监控,Prometheus,告警
* @keywords 监控配置,告警规则,系统健康
 */

# Prometheus 监控配置说明

## 概述

本目录包含邮件系统的Prometheus监控配置文件，用于系统健康监控、性能指标收集和异常告警。

## 目录内容

* `alerts.yml` - Prometheus告警规则配置
* 其他监控相关配置文件

## 告警规则说明

`alerts.yml`文件定义了系统的关键告警规则，包括：

### 服务健康告警

* 服务不可用告警
* 服务响应时间过长告警
* 服务错误率过高告警

### 资源使用告警

* CPU使用率过高告警
* 内存使用率过高告警
* 磁盘空间不足告警

### 数据库告警

* 数据库连接池耗尽告警
* 数据库查询性能下降告警

### 邮件处理告警

* 邮件队列积压告警
* 邮件发送失败率告警

## 配置方法

### 1. 安装Prometheus

请参考官方文档安装Prometheus：<https://prometheus.io/docs/introduction/installation/>

### 2. 配置告警规则

将本目录中的`alerts.yml`文件复制到Prometheus配置目录，并在`prometheus.yml`中添加以下配置：

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - 'alerts.yml'

scrape_configs:
  - job_name: 'email-system'
    static_configs:
      - targets: ['api-server:3000', 'admin-server:3001', 'mail-server:3003', 'llm-server:3002']
```

### 3. 配置告警管理器

安装Alertmanager并配置告警通知渠道（邮件、Slack等）：

```yaml
route:
  group_by: ['alertname']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: 'email-notifications'

receivers:
- name: 'email-notifications'
  email_configs:
  - to: 'alerts@example.com'
    send_resolved: true
```

## 告警级别

告警规则根据严重程度分为以下级别：

* **CRITICAL** - 需要立即处理的严重问题
* **WARNING** - 需要关注但不紧急的问题
* **INFO** - 提供信息性通知

## 最佳实践

1. 定期审查告警规则，确保其有效性
2. 根据系统规模调整告警阈值
3. 建立告警响应流程，明确处理责任人
4. 避免告警风暴，合理设置告警抑制规则

---

*最后更新时间：2024-01-15*
