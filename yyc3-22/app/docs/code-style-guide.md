# 🔖 代码风格与最佳实践指南

> ***YanYuCloudCube***
> **标语**：言启象限 | 语枢未来
> ***Words Initiate Quadrants, Language Serves as Core for the Future***
> **标语**：万象归元于云枢 | 深栈智启新纪元
> ***All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence***

---

## 1. 代码风格标准

### JavaScript/TypeScript 风格规则

项目使用 ESLint 和 Prettier 进行代码风格管理，主要规则包括：

- **缩进**：使用 2 个空格
- **行尾**：Unix 风格 (LF)
- **引号**：单引号 `'string'`
- **分号**：必须使用分号 `;`
- **最大行长度**：100 个字符
- **大括号间距**：必须有空格 `{ object }`
- **数组括号间距**：必须有空格 `[ 1, 2, 3 ]`
- **箭头函数参数括号**：始终使用括号 `(arg) => {}`
- **尾随逗号**：仅在 ES5 支持的地方使用

### 文件命名规范

- **JavaScript/TypeScript 文件**：小驼峰命名法，例如 `userService.js`
- **配置文件**：使用 `.` 前缀，例如 `.eslintrc.json`
- **脚本文件**：使用 `-` 分隔，例如 `deploy-to-aliyun.sh`

## 2. 最佳实践

### 2.1 代码组织

- **模块导出**：优先使用命名导出，避免默认导出的滥用

  ```javascript
  // 推荐
  export const calculateTotal = () => {};
  export const formatDate = () => {};
  
  // 不推荐
  export default {
    calculateTotal,
    formatDate
  };
  ```

- **目录结构**：按功能模块组织代码

  ```
  api/
    controllers/
    models/
    routes/
  ```

### 2.2 函数与变量命名

- **函数名**：小驼峰，动词开头

  ```javascript
  function getUserData() {}
  ```

- **变量名**：小驼峰，名词或形容词+名词

  ```javascript
  const userData = {};
  const isValid = true;
  ```

- **常量**：大写下划线分隔

  ```javascript
  const MAX_RETRY_COUNT = 3;
  ```

### 2.3 错误处理

- **使用 try/catch** 处理异步操作

  ```javascript
  async function fetchData() {
    try {
      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      console.error('获取数据失败:', error);
      throw new Error(`数据获取失败: ${error.message}`);
    }
  }
  ```

- **避免使用未捕获的 Promise**

  ```javascript
  // 推荐
  fetchData().catch(error => console.error(error));
  
  // 不推荐
  fetchData(); // 未处理可能的拒绝
  ```

### 2.4 性能优化

- **避免在循环中创建函数**
- **使用适当的数据结构**
- **实现懒加载和代码分割**

### 2.5 注释规范

- **文件头部注释**：包含文件描述、作者、版本等信息

  ```javascript
  /**
   * @file 用户服务模块
   * @description 处理用户相关的业务逻辑
   * @module services/userService
   * @author YYC
   * @version 1.0.0
   */
  ```

- **函数注释**：使用 JSDoc 规范

  ```javascript
  /**
   * 获取用户信息
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} 用户信息对象
   */
  async function getUserInfo(userId) {}
  ```

## 3. 代码审查标准

### 3.1 必须检查项

- 代码风格符合 ESLint 和 Prettier 规则
- 没有未使用的导入和变量
- 函数有适当的注释
- 错误处理完善
- 安全性考虑（如输入验证）

### 3.2 加分项

- 性能优化措施
- 测试覆盖率
- 文档完善
- 代码复用性

## 4. Git 提交规范

### 4.1 提交信息格式

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### 4.2 类型说明

- **feat**: 新功能
- **fix**: 修复bug
- **docs**: 文档更新
- **style**: 代码风格调整（不影响功能）
- **refactor**: 代码重构
- **perf**: 性能优化
- **test**: 测试相关
- **build**: 构建配置更新
- **ci**: CI配置更新
- **chore**: 其他更改

### 4.3 示例

```
feat(api): 添加用户认证接口

实现了JWT认证机制，支持用户登录和权限验证

BREAKING CHANGE: 需要更新客户端的认证逻辑
```

## 5. 开发工具推荐

- **编辑器**: VS Code
- **扩展**: ESLint, Prettier, GitLens
- **调试工具**: Chrome DevTools, Node Inspector

## 6. 实施建议

1. **使用编辑器集成**：确保所有开发者在编辑器中配置了 ESLint 和 Prettier
2. **预提交钩子**：配置 husky 和 lint-staged 在提交前自动格式化代码
3. **CI/CD 集成**：在 CI 流程中添加代码风格检查
4. **定期代码审查**：确保团队成员遵循这些规范

---

通过遵循这些规范，我们可以提高代码质量，减少错误，并使团队协作更加高效。

---

## 📄 文档标尾 (Footer)

---

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for the Future***」
> 「***All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence***」
