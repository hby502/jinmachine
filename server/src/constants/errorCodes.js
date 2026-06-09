/**
 * =============================================================================
 * 统一错误码规范 (Rule 3: 统一错误码)
 * =============================================================================
 * PARAM  — 1xxxx: 参数错误
 * AUTH   — 2xxxx: 认证/权限
 * BIZ    — 3xxxx: 业务错误
 * SYSTEM — 5xxxx: 系统错误
 * =============================================================================
 */

const ERROR_CODES = {
  SUCCESS: 'SUCCESS',

  // 参数错误 (1xxxx)
  PARAM_MISSING: 'PARAM_10001',
  PARAM_TYPE_ERROR: 'PARAM_10002',
  PARAM_FORMAT_ERROR: 'PARAM_10003',
  PARAM_LENGTH_ERROR: 'PARAM_10004',
  PARAM_ENUM_ERROR: 'PARAM_10005',
  PARAM_RANGE_ERROR: 'PARAM_10006',
  PARAM_ILLEGAL_CHAR: 'PARAM_10007',

  // 认证/权限 (2xxxx)
  UNAUTHORIZED: 'AUTH_20001',
  TOKEN_EXPIRED: 'AUTH_20002',
  TOKEN_INVALID: 'AUTH_20003',
  FORBIDDEN: 'AUTH_20004',
  ACCOUNT_DISABLED: 'AUTH_20005',

  // 业务错误 (3xxxx)
  BUSINESS_ERROR: 'BIZ_30001',
  DATA_NOT_FOUND: 'BIZ_30002',
  DATA_CONFLICT: 'BIZ_30003',
  IDEMPOTENCY_CONFLICT: 'BIZ_30004',

  // 系统错误 (5xxxx)
  SYSTEM_ERROR: 'SYSTEM_50001',
  DB_ERROR: 'SYSTEM_50002',
};

const HTTP_STATUS = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_ERROR: 500,
};

module.exports = { ERROR_CODES, HTTP_STATUS };
