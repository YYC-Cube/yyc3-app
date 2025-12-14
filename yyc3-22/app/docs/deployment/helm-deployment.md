# Helm Chart 部署方式

## 配置文件路径

- **Chart 路径**：/Users/yanyu/www/yyc3-22/app/helm/
- **主要文件**：
  - Chart.yaml
  - values.yaml
  - templates/deployment.yaml
  - templates/service.yaml
  - templates/ingress.yaml

## Chart.yaml 示例

```yaml
apiVersion: v2
name: yyc3-services
description: A Helm chart for 0379.email multi-service platform
version: 1.0.1
appVersion: '1.0.0'
```

## values.yaml 示例

```yaml
# 全局配置
global:
  domain: 0379.email
  tlsSecret: yyc3-tls-secret

# 通用配置
image:
  repository: ghcr.io/yyc3/yyc3-services
  tag: latest
  pullPolicy: Always

# 服务配置
services:
  api:
    enabled: true
    port: 3000
    replicas: 1
  admin:
    enabled: true
    port: 3001
    replicas: 1
  llm:
    enabled: true
    port: 3002
    replicas: 1
  mail:
    enabled: true
    port: 3003
    replicas: 1

# 资源限制
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 512Mi

# Ingress 配置
ingress:
  enabled: true
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/ssl-redirect: 'true'
```

## 部署命令

### 安装 Chart

```bash
helm install yyc3 ./helm --namespace yyc3 --create-namespace
```

### 升级 Chart

```bash
helm upgrade yyc3 ./helm --namespace yyc3
```

### 查看部署状态

```bash
helm status yyc3 --namespace yyc3
```

### 列出所有发布

```bash
helm list --namespace yyc3
```

### 卸载 Chart

```bash
helm uninstall yyc3 --namespace yyc3
```

### 查看发布历史

```bash
helm history yyc3 --namespace yyc3
```

### 回滚到特定版本

```bash
helm rollback yyc3 1 --namespace yyc3
```

## TLS Secret 配置

在部署前，需要创建 TLS Secret：

```bash
kubectl create secret tls yyc3-tls-secret \
  --cert=/etc/letsencrypt/live/0379.email/fullchain.pem \
  --key=/etc/letsencrypt/live/0379.email/privkey.pem \
  --namespace yyc3
```

## Helm 脚本

项目提供了以下 Helm 相关脚本：

### 卸载脚本 (uninstall.sh)

```bash
helm uninstall yyc3 --namespace yyc3
kubectl delete namespace yyc3
```

### 回滚脚本 (rollback.sh)

```bash
helm rollback yyc3 1 --namespace yyc3
```

### 推送脚本 (push-helm.sh)

```bash
helm package ./helm
helm push yyc3-services-1.0.1.tgz oci://ghcr.io/yyc3
```
