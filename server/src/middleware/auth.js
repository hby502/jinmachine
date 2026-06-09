/**
 * =============================================================================
 * JWT 认证 + 权限中间件 (Rule 1: 权限系统强制要求)
 * =============================================================================
 * - authMiddleware: 解析 Bearer Token，注入 req.user
 * - requirePermission: 声明式权限校验，禁止硬编码
 * =============================================================================
 */

const jwt = require('jsonwebtoken');
const config = require('../config');
const { AuthError, ForbiddenError } = require('../utils/errors');
const { ERROR_CODES } = require('../constants/errorCodes');

/**
 * JWT 认证中间件 — 必须前置在所有需要认证的路由
 */
function authMiddleware(req, _res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(new AuthError('请先登录', '缺少 Authorization 头', ERROR_CODES.UNAUTHORIZED));
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return next(new AuthError('认证格式错误', 'Authorization 头格式应为 Bearer <token>', ERROR_CODES.TOKEN_INVALID));
  }

  const token = parts[1];
  if (!token || token === 'null' || token === 'undefined') {
    return next(new AuthError('请先登录', '令牌为空', ERROR_CODES.UNAUTHORIZED));
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret, { issuer: config.jwt.issuer });
    req.user = {
      id: decoded.sub,
      username: decoded.username,
      role: decoded.role,
      permissions: decoded.permissions || [],
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AuthError('登录已过期，请重新登录', `Token 过期: ${err.expiredAt}`, ERROR_CODES.TOKEN_EXPIRED));
    }
    return next(new AuthError('认证令牌无效', `JWT 验证失败: ${err.message}`, ERROR_CODES.TOKEN_INVALID));
  }
}

/**
 * 权限校验中间件工厂 (Rule 1: 禁止硬编码权限判断)
 *
 * @param {string[]} requiredPermissions — 所需权限点
 * @returns {Function} Express middleware
 *
 * @example
 * router.get('/inquiries', authMiddleware, requirePermission(['inquiry:read']), listInquiries);
 */
function requirePermission(requiredPermissions) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AuthError('请先登录', 'requirePermission 必须在 authMiddleware 之后'));
    }

    // super_admin 拥有所有权限
    if (req.user.role === 'super_admin') return next();

    const userPerms = req.user.permissions || [];
    const missing = requiredPermissions.filter(p => !userPerms.includes(p));

    if (missing.length > 0) {
      return next(new ForbiddenError(
        '无权限执行此操作',
        `缺少权限: ${missing.join(', ')}。当前权限: ${userPerms.join(', ') || '无'}`,
        ERROR_CODES.FORBIDDEN,
      ));
    }

    next();
  };
}

module.exports = { authMiddleware, requirePermission };
