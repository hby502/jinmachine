/**
 * =============================================================================
 * 登录认证 — 三层校验器
 * =============================================================================
 */

const Joi = require('joi');
const { ParamError } = require('../utils/errors');
const { ERROR_CODES } = require('../constants/errorCodes');

const loginSchema = Joi.object({
  username: Joi.string().trim().min(2).max(50).required()
    .messages({
      'string.empty': '请输入用户名',
      'string.min': '用户名至少2个字符',
      'string.max': '用户名不能超过50个字符',
      'any.required': '请输入用户名',
    }),
  password: Joi.string().min(6).max(100).required()
    .messages({
      'string.empty': '请输入密码',
      'string.min': '密码至少6个字符',
      'any.required': '请输入密码',
    }),
});

/**
 * 登录请求 — 三层校验
 */
function validateLogin(rawBody) {
  // ① 基础校验
  const { error, value } = loginSchema.validate(rawBody, { abortEarly: false, stripUnknown: true, allowUnknown: false });
  if (error) {
    const details = error.details.map(d => d.message).join('; ');
    throw new ParamError('用户名或密码格式不正确', `基础校验失败: ${details}`, ERROR_CODES.PARAM_ERROR);
  }

  // ② 业务校验 — 登录暂无特殊业务校验（账号存在性/密码正确性在 service 层）

  // ③ 边界校验 — 非法字符
  // eslint-disable-next-line no-control-regex
  const ctrlRegex = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/;
  if (ctrlRegex.test(value.username)) {
    throw new ParamError('用户名包含非法字符', '', ERROR_CODES.PARAM_ILLEGAL_CHAR);
  }

  return value;
}

module.exports = { loginSchema, validateLogin };
