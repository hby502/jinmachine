/**
 * =============================================================================
 * 全局统一异常拦截器 (Rule 3: 错误处理强制要求)
 * =============================================================================
 */

const config = require('../config');
const { AppError, SystemError } = require('../utils/errors');
const { ERROR_CODES } = require('../constants/errorCodes');
const { logError } = require('../utils/logger');

/** 404 — 未匹配路由 */
function notFoundHandler(req, _res, next) {
  next(new AppError(ERROR_CODES.DATA_NOT_FOUND, `接口不存在: ${req.method} ${req.originalUrl}`, '', 404));
}

/** 全局错误处理（4参数签名 = Express 错误中间件） */
function globalErrorHandler(err, req, res, _next) {
  // 统一化为 AppError
  let appError;
  if (err instanceof AppError) {
    appError = err;
  } else if (err.type === 'entity.parse.failed') {
    appError = new AppError(ERROR_CODES.PARAM_FORMAT_ERROR, '请求体 JSON 格式错误', err.message, 400);
  } else if (err.name === 'SequelizeValidationError') {
    appError = new AppError(ERROR_CODES.PARAM_ERROR, '数据校验失败', err.errors?.map(e => e.message).join('; '), 400);
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    appError = new AppError(ERROR_CODES.DATA_CONFLICT, '数据已存在', err.errors?.map(e => e.message).join('; '), 409);
  } else {
    appError = new SystemError('服务器内部错误，请稍后重试', `${err.name}: ${err.message}`, err);
  }

  // 记录完整错误日志
  logError({
    errorCode: appError.code,
    errorMessage: appError.detail || appError.message,
    stack: err.stack || '',
    userId: req.user?.id || 'anonymous',
    requestId: req.requestId || 'unknown',
    requestInfo: {
      ip: req.ip || req.socket?.remoteAddress || 'unknown',
      method: req.method,
      path: req.originalUrl,
      params: sanitizeForLog(req.body),
    },
  });

  // 返回统一格式
  const status = appError.httpStatus || 500;
  const body = config.isProd ? appError.toResponse() : appError.toDevResponse();
  if (status >= 500) body.requestId = req.requestId;

  res.status(status).json(body);
}

/** 脱敏敏感字段 */
function sanitizeForLog(params) {
  if (!params || typeof params !== 'object') return params;
  const SENSITIVE = ['password', 'passwd', 'secret', 'token', 'refreshToken'];
  const out = Array.isArray(params) ? [...params] : { ...params };
  for (const k of Object.keys(out)) {
    if (SENSITIVE.some(s => k.toLowerCase().includes(s.toLowerCase()))) out[k] = '***';
    else if (typeof out[k] === 'object' && out[k] !== null) out[k] = sanitizeForLog(out[k]);
  }
  return out;
}

/** 异步错误包装器 — 将 async handler 的异常传入 next() */
function asyncWrapper(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { notFoundHandler, globalErrorHandler, asyncWrapper };
