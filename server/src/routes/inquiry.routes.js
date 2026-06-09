/**
 * =============================================================================
 * 留言/询盘路由
 * =============================================================================
 */

const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4, validate: uuidValidate } = require('uuid');
const { authMiddleware, requirePermission } = require('../middleware/auth');
const { asyncWrapper } = require('../middleware/errorHandler');
const inquiryService = require('../services/inquiry.service');
const { validateCreateInquiry, validateUpdateStatus, validateListQuery } = require('../validators/inquiry.validator');
const { success, created, fail } = require('../utils/response');
const { ParamError } = require('../utils/errors');

const router = Router();

// 防刷限流: 访客留言每 IP 每分钟最多 5 次
const inquiryLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { code: 'BIZ_30004', message: '提交过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});

/** 获取请求信息上下文 */
function getReqInfo(req) {
  return {
    ip: req.ip || req.socket?.remoteAddress || 'unknown',
    method: req.method,
    path: req.originalUrl,
    params: req.body,
  };
}

// ===========================================================================
// 公开接口
// ===========================================================================

/**
 * POST /api/v1/inquiries — 访客提交留言 (无需认证)
 */
router.post('/', inquiryLimiter, asyncWrapper(async (req, res) => {
  // 三层校验
  const validated = validateCreateInquiry(req.body);

  // 幂等键: 从 Header 获取或自动生成
  let idempotencyKey = req.headers['x-idempotency-key'];
  if (idempotencyKey) {
    idempotencyKey = String(idempotencyKey).trim();
    if (!uuidValidate(idempotencyKey)) {
      throw new ParamError('幂等键格式错误', 'X-Idempotency-Key 必须为有效 UUID v4');
    }
  } else {
    idempotencyKey = uuidv4();
  }

  // 防重复提交
  // 简单实现：用幂等键的去重逻辑在 service.create 中处理

  const result = await inquiryService.create(validated, idempotencyKey, getReqInfo(req));
  return created(res, result, '留言已提交，我们将尽快联系您！');
}));

// ===========================================================================
// 管理端接口 — 需认证
// ===========================================================================

/**
 * GET /api/v1/inquiries — 查询留言列表 (需 inquiry:read)
 */
router.get('/', authMiddleware, requirePermission(['inquiry:read']), asyncWrapper(async (req, res) => {
  const query = validateListQuery(req.query);
  const result = await inquiryService.list(query);
  return success(res, result);
}));

/**
 * GET /api/v1/inquiries/:id — 查看留言详情 (需 inquiry:read)
 */
router.get('/:id', authMiddleware, requirePermission(['inquiry:read']), asyncWrapper(async (req, res) => {
  if (!uuidValidate(req.params.id)) {
    throw new ParamError('留言ID格式错误', 'id 必须为有效 UUID v4');
  }
  const result = await inquiryService.getById(req.params.id);
  return success(res, result);
}));

/**
 * PUT /api/v1/inquiries/:id/status — 更新留言状态 (需 inquiry:update)
 */
router.put('/:id/status', authMiddleware, requirePermission(['inquiry:update']), asyncWrapper(async (req, res) => {
  if (!uuidValidate(req.params.id)) {
    throw new ParamError('留言ID格式错误', 'id 必须为有效 UUID v4');
  }
  const validated = validateUpdateStatus(req.body);
  const result = await inquiryService.updateStatus(
    req.params.id,
    validated,
    req.user.id,
    getReqInfo(req),
  );
  return success(res, result, '状态更新成功');
}));

/**
 * DELETE /api/v1/inquiries/:id — 删除留言 (需 inquiry:delete, 仅 super_admin)
 */
router.delete('/:id', authMiddleware, requirePermission(['inquiry:delete']), asyncWrapper(async (req, res) => {
  if (!uuidValidate(req.params.id)) {
    throw new ParamError('留言ID格式错误', 'id 必须为有效 UUID v4');
  }
  await inquiryService.delete(req.params.id, req.user.id, getReqInfo(req));
  return success(res, null, '删除成功');
}));

module.exports = router;
