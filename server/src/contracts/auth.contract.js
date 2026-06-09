/**
 * =============================================================================
 * 接口合同: 登录认证
 * =============================================================================
 */

const authContract = {
  // POST /api/v1/auth/login — 管理员登录
  login: {
    method: 'POST',
    path: '/api/v1/auth/login',
    auth: false, // 公开接口
    idempotent: true,
    description: '管理员登录，返回 JWT access_token + refresh_token',

    body: {
      username: { type: 'string', required: true, minLength: 2, maxLength: 50, source: 'body' },
      password: { type: 'string', required: true, minLength: 6, maxLength: 100, source: 'body' },
    },

    success: {
      httpStatus: 200,
      example: {
        code: 'SUCCESS',
        message: '登录成功',
        data: {
          accessToken: 'eyJ...',
          refreshToken: 'eyJ...',
          expiresIn: 86400,
          user: { id: 'uuid', username: 'admin', role: 'admin' },
        },
      },
    },

    errors: {
      PARAM_ERROR: { httpStatus: 400, code: 'PARAM_10001', message: '用户名和密码为必填项' },
      UNAUTHORIZED: { httpStatus: 401, code: 'AUTH_20001', message: '用户名或密码错误' },
      ACCOUNT_DISABLED: { httpStatus: 403, code: 'AUTH_20005', message: '账号已被禁用' },
    },
  },

  // GET /api/v1/auth/me — 获取当前用户
  me: {
    method: 'GET',
    path: '/api/v1/auth/me',
    auth: true,
    description: '获取当前登录用户信息',

    success: {
      httpStatus: 200,
      example: {
        code: 'SUCCESS',
        message: '操作成功',
        data: { id: 'uuid', username: 'admin', role: 'admin', createdAt: 'ISO8601' },
      },
    },
  },

  // POST /api/v1/auth/refresh — 刷新令牌
  refresh: {
    method: 'POST',
    path: '/api/v1/auth/refresh',
    auth: false,
    description: '使用 refresh_token 获取新的 access_token',

    body: {
      refreshToken: { type: 'string', required: true, source: 'body' },
    },

    success: {
      httpStatus: 200,
      example: {
        code: 'SUCCESS',
        message: '令牌刷新成功',
        data: { accessToken: 'eyJ...', expiresIn: 86400 },
      },
    },
  },
};

module.exports = authContract;
