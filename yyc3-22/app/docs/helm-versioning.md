# 🔖 Helm Chart 多版本管理与回滚策略

> ***YanYuCloudCube***
> **标语**：言启象限 | 语枢未来
> ***Words Initiate Quadrants, Language Serves as Core for the Future***
> **标语**：万象归元于云枢 | 深栈智启新纪元
> ***All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence***

---

## 🧩 版本命名规范

- 格式：yyc3-services-<major>.<minor>.<patch>.tgz
- 示例：yyc3-services-1.0.1.tgz

## 🚀 发布流程

1. 修改 Chart.yaml 中的 version 字段
2. 执行 helm package ./helm
3. 更新 index.yaml：helm repo index . --url <repo>
4. 推送至 GitHub Pages 或 OCI 仓库

## 🔁 回滚策略

- 查看历史版本：helm history yyc3-services
- 回滚命令：helm rollback yyc3-services <revision>
- 示例：helm rollback yyc3-services 2

## 🏷 推荐做法

- 每次发布创建 GitHub Release 标签（如 v1.0.2）
- 附加 tgz 文件与 index.yaml
- 记录变更说明与回滚点

---

## 📄 文档标尾 (Footer)

---

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for the Future***」
> 「***All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence***」
