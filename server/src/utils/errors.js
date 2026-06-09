/**
 * =============================================================================
 * 自定义异常类 — 统一错误分级 (Rule 3)
 * =============================================================================
 * ParamError     — 参数错误 (400)
 * AuthError      — 认证错误 (401)
 * ForbiddenError — 权限错误 (403)
 * NotFoundError  — 资源不存在 (404)
 * BusinessError  — 业务错误 (422)
 * ConflictError  — 冲突错误 (409)
 * SystemError    — 系统错误 (500, detail不返回前端)
 * =============================================================================
 */

const { ERROR_CODES } = require('../constants/errorCodes');

class AppError extends Error {
  constructor(code, message, detail = '', httpStatus = 500, cause = null) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.message = message;
    this.detail = detail;
    this.httpStatus = httpStatus;
    this.cause = cause;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }

  toResponse() {
    return { code: this.code, message: this.message };
  }

  toDevResponse() {
    return { code: this.code, message: this.message, detail: this.detail || this.message };
  }
}

class ParamError extends AppError {
  constructor(message = '请求参数不合法', detail = '', code = ERROR_CODES.PARAM_MISSING) {
    super(code, message, detail, 400);
  }
}

class AuthError extends AppError {
  constructor(message = '请先登录', detail = '', code = ERROR_CODES.UNAUTHORIZED) {
    super(code, message, detail, 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message = '无权限执行此操作', detail = '', code = ERROR_CODES.FORBIDDEN) {
    super(code, message, detail, 403);
  }
}

class NotFoundError extends AppError {
  constructor(message = '数据不存在', detail = '', code = ERROR_CODES.DATA_NOT_FOUND) {
    super(code, message, detail, 404);
  }
}

class BusinessError extends AppError {
  constructor(message = '业务规则不满足', detail = '', code = ERROR_CODES.BUSINESS_ERROR) {
    super(code, message, detail, 422);
  }
}

class ConflictError extends AppError {
  constructor(message = '数据冲突', detail = '', code = ERROR_CODES.DATA_CONFLICT) {
    super(code, message, detail, 409);
  }
}

class SystemError extends AppError {
  constructor(message = '服务器内部错误，请稍后重试', detail = '', cause = null) {
    super(ERROR_CODES.SYSTEM_ERROR, message, detail, 500, cause);
  }
}

module.exports = {
  AppError, ParamError, AuthError, ForbiddenError,
  NotFoundError, BusinessError, ConflictError, SystemError,
};
