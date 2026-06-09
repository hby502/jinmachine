/**
 * =============================================================================
 * 统一响应格式 (Rule 4: 禁止自定义格式)
 * =============================================================================
 * 成功: { code: 'SUCCESS', message: '...', data: {...} }
 * 失败: { code: 'ERROR_CODE', message: '...', detail: '...' }
 * =============================================================================
 */

const { ERROR_CODES } = require('../constants/errorCodes');
const config = require('../config');

/** 成功响应 */
function success(res, data = null, message = '操作成功', httpStatus = 200) {
  return res.status(httpStatus).json({ code: ERROR_CODES.SUCCESS, message, data });
}

/** 201 Created */
function created(res, data, message = '创建成功') {
  return success(res, data, message, 201);
}

/** 失败响应 */
function fail(res, error) {
  const status = error.httpStatus || 500;
  const body = config.isProd ? error.toResponse() : error.toDevResponse();
  if (status >= 500) body.requestId = res.req?.requestId;
  return res.status(status).json(body);
}

module.exports = { success, created, fail };
