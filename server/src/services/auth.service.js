/**
 * =============================================================================
 * 认证服务 — 登录/令牌刷新/用户信息
 * =============================================================================
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const adminUserRepo = require('../repositories/adminUser.repository');
const { AuthError, ForbiddenError } = require('../utils/errors');
const { ERROR_CODES } = require('../constants/errorCodes');
const { logOperation } = require('../utils/logger');

const PERMISSION_MAP = {
  super_admin: ['inquiry:read', 'inquiry:update', 'inquiry:delete', 'admin:create', 'admin:update', 'admin:delete'],
  admin: ['inquiry:read', 'inquiry:update'],
};

const authService = {
  /**
   * 管理员登录
   */
  async login({ username, password }, ip) {
    // 查询用户
    const user = await adminUserRepo.findByUsername(username);
    if (!user) {
      throw new AuthError('用户名或密码错误', `用户 ${username} 不存在`, ERROR_CODES.UNAUTHORIZED);
    }

    // 检查账号状态
    if (!user.is_active) {
      throw new ForbiddenError('账号已被禁用，请联系管理员', `用户 ${username} 已禁用`, ERROR_CODES.ACCOUNT_DISABLED);
    }

    // 验证密码
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      // 记录失败尝试（安全审计）
      logOperation({
        userId: user.id,
        action: 'login_failed',
        resource: 'admin_user',
        resourceId: user.id,
        requestInfo: { ip, method: 'POST', path: '/api/v1/auth/login' },
        success: false,
      });
      throw new AuthError('用户名或密码错误', `用户 ${username} 密码验证失败`, ERROR_CODES.UNAUTHORIZED);
    }

    // 生成权限列表
    const permissions = PERMISSION_MAP[user.role] || [];

    // 生成 Access Token
    const accessToken = jwt.sign(
      {
        sub: user.id,
        username: user.username,
        role: user.role,
        permissions,
        type: 'access',
        jti: uuidv4(),
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn, issuer: config.jwt.issuer },
    );

    // 生成 Refresh Token
    const refreshToken = jwt.sign(
      { sub: user.id, type: 'refresh', jti: uuidv4() },
      config.jwt.secret,
      { expiresIn: config.jwt.refreshExpiresIn, issuer: config.jwt.issuer },
    );

    // 更新最后登录信息
    await adminUserRepo.updateLastLogin(user.id, ip);

    // 操作日志 (Rule 6)
    logOperation({
      userId: user.id,
      action: 'login',
      resource: 'admin_user',
      resourceId: user.id,
      requestInfo: { ip, method: 'POST', path: '/api/v1/auth/login' },
      success: true,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: typeof config.jwt.expiresIn === 'string'
        ? parseDuration(config.jwt.expiresIn)
        : config.jwt.expiresIn,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        permissions,
      },
    };
  },

  /**
   * 获取当前用户信息
   */
  async getMe(userId) {
    const user = await adminUserRepo.findById(userId);
    if (!user) {
      throw new AuthError('用户不存在', `id=${userId}`, ERROR_CODES.UNAUTHORIZED);
    }
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      isActive: user.is_active,
      lastLoginAt: user.last_login_at,
      createdAt: user.created_at,
    };
  },

  /**
   * 刷新 Access Token
   */
  async refresh(refreshTokenStr) {
    try {
      const decoded = jwt.verify(refreshTokenStr, config.jwt.secret, { issuer: config.jwt.issuer });
      if (decoded.type !== 'refresh') {
        throw new AuthError('令牌类型错误', '期望 refresh token', ERROR_CODES.TOKEN_INVALID);
      }

      const user = await adminUserRepo.findById(decoded.sub);
      if (!user || !user.is_active) {
        throw new AuthError('用户不存在或已禁用', '', ERROR_CODES.UNAUTHORIZED);
      }

      const permissions = PERMISSION_MAP[user.role] || [];

      const accessToken = jwt.sign(
        { sub: user.id, username: user.username, role: user.role, permissions, type: 'access', jti: uuidv4() },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn, issuer: config.jwt.issuer },
      );

      return {
        accessToken,
        expiresIn: typeof config.jwt.expiresIn === 'string'
          ? parseDuration(config.jwt.expiresIn)
          : config.jwt.expiresIn,
      };
    } catch (err) {
      if (err instanceof AuthError) throw err;
      if (err.name === 'TokenExpiredError') {
        throw new AuthError('登录已过期，请重新登录', 'refresh token 过期', ERROR_CODES.TOKEN_EXPIRED);
      }
      throw new AuthError('令牌无效', err.message, ERROR_CODES.TOKEN_INVALID);
    }
  },
};

/** "24h" → 86400 */
function parseDuration(str) {
  const match = str.match(/^(\d+)([smhd])$/);
  if (!match) return 86400;
  const num = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
  return num * (multipliers[unit] || 3600);
}

module.exports = authService;
