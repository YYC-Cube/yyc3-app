# SSH密钥生成说明文档

## 🔐 需要生成的密钥列表

根据项目配置要求，您需要在 `yyc3-121` 云服务器上生成以下SSH密钥：

| 密钥文件名 | 用途 | 对应的SSH配置 |
|---------|------|-------------|
| `id_rsa_local` | 本地设备连接 | 用于连接本地开发机和NAS设备 |
| `id_rsa_aliyun` | 阿里云服务器连接 | 用于阿里云ECS服务器间通信 |
| `id_rsa_github_cube` | GitHub主账号 | 用于访问YYC-Cube账户的代码仓库 |
| `id_rsa_github_neuxs` | GitHub副账号 | 用于访问YY-Neuxs账户的代码仓库 |
| `id_rsa_docker` | Docker远程访问 | 用于远程管理Docker容器 |

## 🚀 快速生成方法

在 `yyc3-121` 服务器上执行以下命令来生成所有必要的密钥：

```bash
# 切换到脚本目录
cd /Users/yanyu/ww/app/scripts

# 运行Linux密钥生成脚本
./generate-keys-linux.sh
```

## 📋 密钥使用说明

1. **公钥部署**：
   - 本地连接密钥：将 `id_rsa_local.pub` 内容添加到需要连接的设备的 `~/.ssh/authorized_keys`
   - GitHub密钥：将对应公钥添加到GitHub账户的SSH设置中
   - Docker密钥：用于远程Docker API访问认证

2. **密钥权限**：
   - 私钥文件权限应为 `600`
   - 公钥文件权限应为 `644`
   - `.ssh` 目录权限应为 `700`

3. **NAS服务器**：
   - 用户名：`YYC`
   - 端口：`57`

## 🔧 验证密钥

生成密钥后，可以通过以下命令验证：

```bash
# 列出所有生成的密钥
ls -la ~/.ssh/id_rsa_*

# 检查ssh-agent中的密钥
ssh-add -l

# 测试SSH连接
ssh -i ~/.ssh/id_rsa_local -p 57 YYC@yyc3-45
```

## ⚠️ 安全注意事项

- 请勿分享私钥文件
- 定期更新密钥（建议3-6个月）
- 确保密钥文件权限设置正确
- 所有密钥名称必须与ssh_config_example保持一致

---

所有密钥配置均与项目中的 `ssh_config_example` 文件完全对应，请确保正确使用。 🌹
