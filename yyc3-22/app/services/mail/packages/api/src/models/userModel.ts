/**
 * @file 用户模型实现
 * @description 用户数据访问层和业务逻辑
 * @module models/userModel
 * @author YYC
 * @version 1.0.0
 * @created 2024-01-15
 */

import { PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { query, transaction } from '../config/database';
import { User, CreateUser, UpdateUser, UserRole, UserStatus } from './index';
import { logInfo, logError, logDebug } from '../utils/logger';

// =======================================
// 用户数据访问函数
// =======================================

/**
 * 创建新用户
 * @param userData 用户创建数据
 * @param client 事务客户端（可选）
 * @returns 创建的用户对象
 */
export const createUser = async (userData: CreateUser, client?: PoolClient): Promise<User> => {
  const user: CreateUser = {
    ...userData,
    role: userData.role || 'user',
    status: userData.status || 'active'
  };

  const queryText = `
    INSERT INTO users (
      email, password_hash, first_name, last_name, role, status
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;

  const values = [
    user.email,
    user.password_hash,
    user.first_name || null,
    user.last_name || null,
    user.role,
    user.status
  ];

  try {
    const result = await query<User>(queryText, values, { 
      name: 'create_user',
      client 
    });
    
    if (result.rows.length === 0) {
      throw new Error('创建用户失败：未返回用户数据');
    }
    
    logInfo(`成功创建用户: ${user.email}`, { userId: result.rows[0].id });
    return result.rows[0];
  } catch (error) {
    if ((error as any).constraint === 'users_email_key') {
      throw new Error('邮箱已被注册');
    }
    logError('创建用户失败', error as Error, { email: user.email });
    throw error;
  }
};

/**
 * 通过ID获取用户
 * @param id 用户ID
 * @param includeDeleted 是否包含已删除用户
 * @returns 用户对象或null
 */
export const getUserById = async (id: string, includeDeleted = false): Promise<User | null> => {
  const queryText = `
    SELECT * FROM users 
    WHERE id = $1 
    ${includeDeleted ? '' : 'AND deleted_at IS NULL'}
  `;

  try {
    const result = await query<User>(queryText, [id], { name: 'get_user_by_id' });
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    logError('通过ID获取用户失败', error as Error, { userId: id });
    throw error;
  }
};

/**
 * 通过邮箱获取用户
 * @param email 用户邮箱
 * @param includeDeleted 是否包含已删除用户
 * @returns 用户对象或null
 */
export const getUserByEmail = async (email: string, includeDeleted = false): Promise<User | null> => {
  const queryText = `
    SELECT * FROM users 
    WHERE email = $1 
    ${includeDeleted ? '' : 'AND deleted_at IS NULL'}
  `;

  try {
    const result = await query<User>(queryText, [email], { name: 'get_user_by_email' });
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    logError('通过邮箱获取用户失败', error as Error, { email });
    throw error;
  }
};

/**
 * 更新用户信息
 * @param id 用户ID
 * @param updateData 更新数据
 * @param client 事务客户端（可选）
 * @returns 更新后的用户对象
 */
export const updateUser = async (
  id: string, 
  updateData: UpdateUser, 
  client?: PoolClient
): Promise<User | null> => {
  // 构建动态更新语句
  const fields: string[] = [];
  const values: any[] = [];
  let valueIndex = 1;

  Object.entries(updateData).forEach(([key, value]) => {
    if (value !== undefined) {
      fields.push(`${key} = $${valueIndex++}`);
      values.push(value);
    }
  });

  // 添加updated_at字段
  fields.push(`updated_at = NOW()`);

  // 添加用户ID到参数
  values.push(id);

  const queryText = `
    UPDATE users 
    SET ${fields.join(', ')}
    WHERE id = $${valueIndex}
    AND deleted_at IS NULL
    RETURNING *
  `;

  try {
    const result = await query<User>(queryText, values, { 
      name: 'update_user',
      client 
    });
    
    if (result.rows.length === 0) {
      logDebug('更新用户失败：用户不存在或已删除', { userId: id });
      return null;
    }
    
    logInfo(`成功更新用户: ${id}`, { updatedFields: Object.keys(updateData) });
    return result.rows[0];
  } catch (error) {
    logError('更新用户失败', error as Error, { userId: id, updateData });
    throw error;
  }
};

/**
 * 删除用户（软删除）
 * @param id 用户ID
 * @param client 事务客户端（可选）
 * @returns 是否删除成功
 */
export const deleteUser = async (id: string, client?: PoolClient): Promise<boolean> => {
  const queryText = `
    UPDATE users 
    SET deleted_at = NOW(), updated_at = NOW()
    WHERE id = $1
    AND deleted_at IS NULL
    RETURNING id
  `;

  try {
    const result = await query(queryText, [id], { 
      name: 'delete_user',
      client 
    });
    
    const success = result.rows.length > 0;
    if (success) {
      logInfo(`成功软删除用户: ${id}`);
    } else {
      logDebug('删除用户失败：用户不存在或已删除', { userId: id });
    }
    
    return success;
  } catch (error) {
    logError('删除用户失败', error as Error, { userId: id });
    throw error;
  }
};

/**
 * 永久删除用户
 * @param id 用户ID
 * @param client 事务客户端（可选）
 * @returns 是否删除成功
 */
export const permanentlyDeleteUser = async (id: string, client?: PoolClient): Promise<boolean> => {
  const queryText = `
    DELETE FROM users 
    WHERE id = $1
    RETURNING id
  `;

  try {
    const result = await query(queryText, [id], { 
      name: 'permanently_delete_user',
      client 
    });
    
    const success = result.rows.length > 0;
    if (success) {
      logInfo(`成功永久删除用户: ${id}`);
    } else {
      logDebug('永久删除用户失败：用户不存在', { userId: id });
    }
    
    return success;
  } catch (error) {
    logError('永久删除用户失败', error as Error, { userId: id });
    throw error;
  }
};

/**
 * 恢复已删除用户
 * @param id 用户ID
 * @param client 事务客户端（可选）
 * @returns 恢复后的用户对象
 */
export const restoreUser = async (id: string, client?: PoolClient): Promise<User | null> => {
  const queryText = `
    UPDATE users 
    SET deleted_at = NULL, updated_at = NOW()
    WHERE id = $1
    AND deleted_at IS NOT NULL
    RETURNING *
  `;

  try {
    const result = await query<User>(queryText, [id], { 
      name: 'restore_user',
      client 
    });
    
    if (result.rows.length === 0) {
      logDebug('恢复用户失败：用户不存在或未被删除', { userId: id });
      return null;
    }
    
    logInfo(`成功恢复用户: ${id}`);
    return result.rows[0];
  } catch (error) {
    logError('恢复用户失败', error as Error, { userId: id });
    throw error;
  }
};

/**
 * 更新用户邮箱验证状态
 * @param id 用户ID
 * @param isVerified 是否验证
 * @param verificationToken 验证令牌（可选）
 * @param client 事务客户端（可选）
 * @returns 更新后的用户对象
 */
export const updateEmailVerification = async (
  id: string,
  isVerified: boolean,
  verificationToken?: string | null,
  client?: PoolClient
): Promise<User | null> => {
  const queryText = `
    UPDATE users 
    SET is_verified = $1, 
        email_verification_token = $2,
        updated_at = NOW()
    WHERE id = $3
    AND deleted_at IS NULL
    RETURNING *
  `;

  try {
    const result = await query<User>(queryText, [
      isVerified,
      verificationToken !== undefined ? verificationToken : null,
      id
    ], { name: 'update_email_verification', client });
    
    if (result.rows.length === 0) {
      return null;
    }
    
    logInfo(`成功更新用户邮箱验证状态: ${id}, verified: ${isVerified}`);
    return result.rows[0];
  } catch (error) {
    logError('更新用户邮箱验证状态失败', error as Error, { userId: id });
    throw error;
  }
};

/**
 * 更新用户刷新令牌
 * @param id 用户ID
 * @param refreshToken 刷新令牌
 * @param client 事务客户端（可选）
 * @returns 是否更新成功
 */
export const updateRefreshToken = async (
  id: string,
  refreshToken: string | null,
  client?: PoolClient
): Promise<boolean> => {
  const queryText = `
    UPDATE users 
    SET refresh_token = $1, 
        updated_at = NOW()
    WHERE id = $2
    AND deleted_at IS NULL
    RETURNING id
  `;

  try {
    const result = await query(queryText, [refreshToken, id], { 
      name: 'update_refresh_token',
      client 
    });
    
    const success = result.rows.length > 0;
    if (success) {
      logInfo(`成功更新用户刷新令牌: ${id}`);
    }
    
    return success;
  } catch (error) {
    logError('更新用户刷新令牌失败', error as Error, { userId: id });
    throw error;
  }
};

/**
 * 更新用户最后登录时间
 * @param id 用户ID
 * @param client 事务客户端（可选）
 * @returns 是否更新成功
 */
export const updateLastLogin = async (id: string, client?: PoolClient): Promise<boolean> => {
  const queryText = `
    UPDATE users 
    SET last_login_at = NOW(), 
        updated_at = NOW()
    WHERE id = $1
    AND deleted_at IS NULL
    RETURNING id
  `;

  try {
    const result = await query(queryText, [id], { 
      name: 'update_last_login',
      client 
    });
    
    return result.rows.length > 0;
  } catch (error) {
    logError('更新用户最后登录时间失败', error as Error, { userId: id });
    throw error;
  }
};

/**
 * 列出用户
 * @param options 查询选项
 * @returns 用户列表和分页信息
 */
export const listUsers = async (options: {
  limit?: number;
  offset?: number;
  role?: UserRole;
  status?: UserStatus;
  isVerified?: boolean;
  search?: string;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
} = {}): Promise<{ users: User[]; total: number; limit: number; offset: number }> => {
  const {
    limit = 10,
    offset = 0,
    role,
    status,
    isVerified,
    search,
    orderBy = 'created_at',
    orderDirection = 'desc'
  } = options;

  // 构建查询条件
  const conditions: string[] = ['deleted_at IS NULL'];
  const values: any[] = [];
  let valueIndex = 1;

  if (role) {
    conditions.push(`role = $${valueIndex++}`);
    values.push(role);
  }

  if (status) {
    conditions.push(`status = $${valueIndex++}`);
    values.push(status);
  }

  if (isVerified !== undefined) {
    conditions.push(`is_verified = $${valueIndex++}`);
    values.push(isVerified);
  }

  if (search) {
    conditions.push(`(email ILIKE $${valueIndex} OR 
                     first_name ILIKE $${valueIndex} OR 
                     last_name ILIKE $${valueIndex})`);
    values.push(`%${search}%`);
    valueIndex++;
  }

  // 验证排序字段
  const validOrderFields = ['created_at', 'updated_at', 'email', 'first_name', 'last_name', 'role', 'status'];
  const safeOrderBy = validOrderFields.includes(orderBy) ? orderBy : 'created_at';
  const safeOrderDirection = ['asc', 'desc'].includes(orderDirection) ? orderDirection : 'desc';

  // 查询用户列表
  const queryText = `
    SELECT * FROM users 
    WHERE ${conditions.join(' AND ')}
    ORDER BY ${safeOrderBy} ${safeOrderDirection}
    LIMIT $${valueIndex} OFFSET $${valueIndex + 1}
  `;

  // 查询总数
  const countQueryText = `
    SELECT COUNT(*) FROM users 
    WHERE ${conditions.join(' AND ')}
  `;

  values.push(limit, offset);

  try {
    const [usersResult, countResult] = await Promise.all([
      query<User>(queryText, values, { name: 'list_users' }),
      query(countQueryText, values.slice(0, -2), { name: 'count_users' })
    ]);

    return {
      users: usersResult.rows,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset
    };
  } catch (error) {
    logError('列出用户失败', error as Error, { options });
    throw error;
  }
};

/**
 * 检查用户是否存在
 * @param email 用户邮箱
 * @returns 是否存在
 */
export const userExists = async (email: string): Promise<boolean> => {
  const queryText = `
    SELECT EXISTS (
      SELECT 1 FROM users 
      WHERE email = $1 
      AND deleted_at IS NULL
    )
  `;

  try {
    const result = await query(queryText, [email], { name: 'user_exists' });
    return result.rows[0].exists;
  } catch (error) {
    logError('检查用户是否存在失败', error as Error, { email });
    throw error;
  }
};

/**
 * 通过验证令牌获取用户
 * @param token 验证令牌
 * @returns 用户对象或null
 */
export const getUserByVerificationToken = async (token: string): Promise<User | null> => {
  const queryText = `
    SELECT * FROM users 
    WHERE email_verification_token = $1 
    AND deleted_at IS NULL
  `;

  try {
    const result = await query<User>(queryText, [token], { name: 'get_user_by_verification_token' });
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    logError('通过验证令牌获取用户失败', error as Error);
    throw error;
  }
};

/**
 * 通过刷新令牌获取用户
 * @param refreshToken 刷新令牌
 * @returns 用户对象或null
 */
export const getUserByRefreshToken = async (refreshToken: string): Promise<User | null> => {
  const queryText = `
    SELECT * FROM users 
    WHERE refresh_token = $1 
    AND deleted_at IS NULL
  `;

  try {
    const result = await query<User>(queryText, [refreshToken], { name: 'get_user_by_refresh_token' });
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    logError('通过刷新令牌获取用户失败', error as Error);
    throw error;
  }
};

/**
 * 批量获取用户
 * @param ids 用户ID数组
 * @returns 用户对象数组
 */
export const getUsersByIds = async (ids: string[]): Promise<User[]> => {
  if (ids.length === 0) return [];

  const queryText = `
    SELECT * FROM users 
    WHERE id = ANY($1)
    AND deleted_at IS NULL
  `;

  try {
    const result = await query<User>(queryText, [ids], { name: 'get_users_by_ids' });
    return result.rows;
  } catch (error) {
    logError('批量获取用户失败', error as Error, { ids });
    throw error;
  }
};

/**
 * 重置用户密码
 * @param id 用户ID
 * @param newPasswordHash 新密码哈希
 * @param client 事务客户端（可选）
 * @returns 是否重置成功
 */
export const resetPassword = async (
  id: string,
  newPasswordHash: string,
  client?: PoolClient
): Promise<boolean> => {
  const queryText = `
    UPDATE users 
    SET password_hash = $1, 
        updated_at = NOW()
    WHERE id = $2
    AND deleted_at IS NULL
    RETURNING id
  `;

  try {
    const result = await query(queryText, [newPasswordHash, id], { 
      name: 'reset_password',
      client 
    });
    
    const success = result.rows.length > 0;
    if (success) {
      logInfo(`成功重置用户密码: ${id}`);
    }
    
    return success;
  } catch (error) {
    logError('重置用户密码失败', error as Error, { userId: id });
    throw error;
  }
};

/**
 * 批量禁用用户
 * @param ids 用户ID数组
 * @returns 禁用的用户数量
 */
export const batchDisableUsers = async (ids: string[]): Promise<number> => {
  if (ids.length === 0) return 0;

  const queryText = `
    UPDATE users 
    SET status = 'inactive', 
        updated_at = NOW()
    WHERE id = ANY($1)
    AND deleted_at IS NULL
    RETURNING id
  `;

  try {
    const result = await query(queryText, [ids], { name: 'batch_disable_users' });
    logInfo(`成功禁用 ${result.rows.length} 个用户`);
    return result.rows.length;
  } catch (error) {
    logError('批量禁用用户失败', error as Error, { ids });
    throw error;
  }
};

/**
 * 获取用户统计信息
 * @returns 用户统计信息
 */
export const getUserStatistics = async (): Promise<{
  totalUsers: number;
  activeUsers: number;
  verifiedUsers: number;
  pendingUsers: number;
  adminCount: number;
}> => {
  const queryText = `
    SELECT 
      COUNT(*) AS total_users,
      COUNT(*) FILTER (WHERE status = 'active') AS active_users,
      COUNT(*) FILTER (WHERE is_verified = true) AS verified_users,
      COUNT(*) FILTER (WHERE status = 'pending') AS pending_users,
      COUNT(*) FILTER (WHERE role = 'admin' OR role = 'superadmin') AS admin_count
    FROM users 
    WHERE deleted_at IS NULL
  `;

  try {
    const result = await query(queryText, [], { name: 'get_user_statistics' });
    const stats = result.rows[0];
    
    return {
      totalUsers: parseInt(stats.total_users),
      activeUsers: parseInt(stats.active_users),
      verifiedUsers: parseInt(stats.verified_users),
      pendingUsers: parseInt(stats.pending_users),
      adminCount: parseInt(stats.admin_count)
    };
  } catch (error) {
    logError('获取用户统计信息失败', error as Error);
    throw error;
  }
};
