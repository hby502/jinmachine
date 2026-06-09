/**
 * =============================================================================
 * 留言/询盘 — 三层校验器 (Rule 2: 数据校验强制要求)
 * =============================================================================
 * ① 基础校验: 非空、类型、长度、格式、枚举
 * ② 业务校验: 手机号中国格式、公司名中文校验、message 防 XSS
 * ③ 边界校验: 特殊值、非法字符、控制字符、最大/最小值
 * =============================================================================
 */

const Joi = require('joi');
const { ParamError } = require('../utils/errors');
const { ERROR_CODES } = require('../constants/errorCodes');
const { MATERIAL_TYPES, CAPACITY_OPTIONS, INQUIRY_STATUS_VALUES } = require('../constants/enums');

// ── 正则常量 ──────────────────────────────────────────────────────────────────

/** 中国手机号: 1[3-9] + 9位数字 */
const CN_MOBILE_REGEX = /^1[3-9]\d{9}$/;

/** 中国固话: 0xx-xxxxxxxx 或 0xxx-xxxxxxxx，横线可选 */
const CN_LANDLINE_REGEX = /^0\d{2,3}-?\d{7,8}$/;

/** 公司名称: 只允许中文 + 中文标点 + 空格 */
const CN_COMPANY_REGEX = /^[一-龥　、。（）《》·\s]+$/;

/** 姓名: 中文 + 英文字母 + 间隔号· */
const CN_NAME_REGEX = /^[一-龥a-zA-Z·\s]+$/;

/** HTML 标签（用于 strip） */
const HTML_TAG_REGEX = /<[^>]*>/g;

/** 控制字符 */
// eslint-disable-next-line no-control-regex
const CTRL_CHAR_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/;

// ── Joi Schema ──────────────────────────────────────────────────────────────

const createInquirySchema = Joi.object({
  name: Joi.string().trim().min(1).max(50)
    .pattern(CN_NAME_REGEX)
    .required()
    .messages({
      'string.empty': '请填写您的姓名',
      'string.max': '姓名不能超过50个字符',
      'string.pattern.base': '姓名只能包含中文、英文字母和间隔号',
      'any.required': '请填写您的姓名',
    }),

  phone: Joi.string().trim().min(7).max(20).required()
    .messages({
      'string.empty': '请填写手机号码',
      'string.min': '手机号码至少7位数字',
      'string.max': '手机号码格式不正确',
      'any.required': '请填写手机号码',
    }),

  email: Joi.string().email().max(100).allow(null, '').optional().default(null)
    .messages({
      'string.email': '请填写正确的邮箱地址',
      'string.max': '邮箱地址不能超过100个字符',
    }),

  company: Joi.string().trim().max(100).allow(null, '').optional().default(null)
    .messages({ 'string.max': '公司名称不能超过100个字符' }),

  materialType: Joi.string().valid(...MATERIAL_TYPES).required()
    .messages({
      'any.only': `物料类型必须是: ${MATERIAL_TYPES.join(', ')}`,
      'any.required': '请选择物料类型',
    }),

  capacity: Joi.string().valid(...CAPACITY_OPTIONS).optional().default('unknown')
    .messages({ 'any.only': `产能需求必须是: ${CAPACITY_OPTIONS.join(', ')}` }),

  message: Joi.string().max(2000).allow(null, '').optional().default('')
    .messages({ 'string.max': '需求描述不能超过2000个字符' }),
});

// ── 更新状态 Schema ─────────────────────────────────────────────────────────

const updateStatusSchema = Joi.object({
  status: Joi.string().valid(...INQUIRY_STATUS_VALUES.filter(s => s !== 'new')).required()
    .messages({
      'any.only': `状态必须是: ${INQUIRY_STATUS_VALUES.filter(s => s !== 'new').join(', ')}`,
      'any.required': '请指定目标状态',
    }),
  notes: Joi.string().trim().max(1000).allow(null, '').optional().default('')
    .messages({ 'string.max': '备注不能超过1000个字符' }),
});

// ── 查询列表 Schema ─────────────────────────────────────────────────────────

const listInquirySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  pageSize: Joi.number().integer().min(1).max(100).optional().default(20),
  status: Joi.string().valid(...INQUIRY_STATUS_VALUES).optional(),
  materialType: Joi.string().valid(...MATERIAL_TYPES).optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  keyword: Joi.string().trim().max(100).optional(),
  sortBy: Joi.string().valid('created_at', 'name', 'status').optional().default('created_at'),
  sortOrder: Joi.string().valid('ASC', 'DESC').optional().default('DESC'),
});

// ── 三层校验执行器 ──────────────────────────────────────────────────────────

/**
 * 创建留言 — 完整三层校验
 *
 * @param {Object} rawBody — 原始请求体
 * @returns {Object} 清洗后的安全数据
 * @throws {ParamError} 校验失败
 */
function validateCreateInquiry(rawBody) {
  // =========================================================================
  // ① 基础校验: 非空、类型、长度、格式、枚举
  // =========================================================================
  const { error, value } = createInquirySchema.validate(rawBody, {
    abortEarly: false,
    stripUnknown: true,
    allowUnknown: false,
  });

  if (error) {
    const details = error.details.map(d => d.message).join('; ');
    throw new ParamError('请填写完整的联系信息', `基础校验失败: ${details}`, ERROR_CODES.PARAM_ERROR);
  }

  // =========================================================================
  // ② 业务校验: 手机号格式、公司名中文、message 防 XSS
  // =========================================================================

  // ── 手机号: strip 空格后校验中国手机号/固话 ──
  const rawPhone = value.phone.trim();
  const phoneNoSpaces = rawPhone.replace(/\s/g, '');       // 容许用户输入空格
  const digitsOnly = phoneNoSpaces.replace(/\D/g, '');
  const isMobile = CN_MOBILE_REGEX.test(phoneNoSpaces);
  const isLandline = CN_LANDLINE_REGEX.test(phoneNoSpaces);

  if (!isMobile && !isLandline) {
    if (/^\d+$/.test(phoneNoSpaces)) {
      if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
        throw new ParamError('请填写正确的手机号码',
          `手机号 ${phoneNoSpaces} 第二位必须是3-9`);
      }
      if (digitsOnly.length < 7) {
        throw new ParamError('请填写正确的手机号码',
          `手机号只有${digitsOnly.length}位数字，最少需要7位`);
      }
      throw new ParamError('请填写正确的手机号码',
        `应为11位手机号（1开头）或带区号的固话（如021-12345678），当前是${digitsOnly.length}位数字`);
    }
    throw new ParamError('请填写正确的手机号码',
      '手机号只能包含数字、空格和横线（-），格式如 13800138000 或 021-12345678',
      ERROR_CODES.PARAM_FORMAT_ERROR);
  }

  // ── 公司名称: 填了就必须是中文（不允许英文/数字/符号）──
  if (value.company && value.company.trim().length > 0) {
    const companyClean = value.company.replace(/\s/g, '');
    if (companyClean.length === 0) {
      value.company = null;
    } else if (!CN_COMPANY_REGEX.test(companyClean)) {
      const illegal = [...new Set(
        companyClean.split('').filter(c => !CN_COMPANY_REGEX.test(c))
      )].join('');
      throw new ParamError(
        `公司名称只能包含中文${illegal ? `，请删除: ${illegal}` : ''}`,
        `公司名称 "${value.company}" 包含非法字符: ${illegal}`,
        ERROR_CODES.PARAM_ILLEGAL_CHAR,
      );
    }
  }

  // ── 需求描述: strip HTML 标签（防 XSS）──
  if (value.message && value.message.length > 0) {
    value.message = value.message.replace(HTML_TAG_REGEX, '').trim();
  }

  // =========================================================================
  // ③ 边界校验: 控制字符、特殊空白、极端值
  // =========================================================================

  // 控制字符扫描
  for (const field of ['name', 'company', 'message']) {
    if (value[field] && CTRL_CHAR_REGEX.test(value[field])) {
      const label = { name: '姓名', company: '公司名称', message: '需求描述' }[field];
      throw new ParamError(`${label}包含非法字符`, '', ERROR_CODES.PARAM_ILLEGAL_CHAR);
    }
  }

  // name 不能是纯空白（trim 后为空）
  if (value.name.trim().length === 0) {
    throw new ParamError('请填写您的姓名', '姓名为空白', ERROR_CODES.PARAM_ILLEGAL_CHAR);
  }

  // company 空字符串/纯空白 → null
  if (value.company !== null && value.company !== undefined) {
    const trimmed = value.company.trim();
    if (trimmed.length === 0) value.company = null;
    else value.company = trimmed;
  }

  // message 空字符串/纯空白 → ''
  if (value.message !== null && value.message !== undefined) {
    const trimmed = value.message.trim();
    value.message = trimmed.length === 0 ? '' : trimmed;
  }

  return value;
}

/**
 * 校验更新状态请求
 */
function validateUpdateStatus(rawBody) {
  const { error, value } = updateStatusSchema.validate(rawBody, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    const details = error.details.map(d => d.message).join('; ');
    throw new ParamError('请求参数不合法', `状态校验失败: ${details}`, ERROR_CODES.PARAM_ERROR);
  }
  return value;
}

/**
 * 校验列表查询参数
 */
function validateListQuery(rawQuery) {
  const { error, value } = listInquirySchema.validate(rawQuery, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    const details = error.details.map(d => d.message).join('; ');
    throw new ParamError('查询参数不合法', `参数校验失败: ${details}`, ERROR_CODES.PARAM_ERROR);
  }
  return value;
}

module.exports = {
  createInquirySchema,
  validateCreateInquiry,
  validateUpdateStatus,
  validateListQuery,
};
