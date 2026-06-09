/**
 * =============================================================================
 * 认证路由
 * =============================================================================
 */

const { Router } = require('express');
const { authMiddleware, requirePermission } = require('../middleware/auth');
const { asyncWrapper } = require('../middleware/errorHandler');
const authService = require('../services/auth.service');
const { validateLogin } = require('../validators/auth.validator');
const { success, created, fail } = require('../utils/response');

const router = Router();

/**
 * POST /api/v1/auth/login — 管理员登录
 * (公开接口)
 */
router.post('/login', asyncWrapper(async (req, res) => {
  const validated = validateLogin(req.body);
  const ip = req.ip || req.socket.remoteAddress;
  const result = await authService.login(validated, ip);
  return success(res, result, '登录成功');
}));

/**
 * GET /api/v1/auth/me — 获取当前用户信息
 * (需认证)
 */
router.get('/me', authMiddleware, asyncWrapper(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  return success(res, user);
}));

/**
 * POST /api/v1/auth/refresh — 刷新令牌
 * (公开接口)
 */
router.post('/refresh', asyncWrapper(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return fail(res, new (require('../utils/errors').ParamError)('请提供 refreshToken'));
  }
  const result = await authService.refresh(refreshToken);
  return success(res, result, '令牌刷新成功');
}));

module.exports = router;
