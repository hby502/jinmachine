/**
 * =============================================================================
 * 留言/询盘服务 — 业务逻辑层
 * =============================================================================
 */

const db = require('../models');
const inquiryRepo = require('../repositories/inquiry.repository');
const { toCreateEntity, toPublicDto, toAdminDto, toListItemDto } = require('../dto/inquiry.dto');
const { NotFoundError, ConflictError, BusinessError } = require('../utils/errors');
const { ERROR_CODES } = require('../constants/errorCodes');
const { logOperation } = require('../utils/logger');
const { sendNewInquiryNotification } = require('./email.service');

const inquiryService = {
  /**
   * 访客提交留言（公开接口 — 无需认证）
   */
  async create(validatedBody, idempotencyKey, reqInfo) {
    // 幂等检查：相同 key 是否已有成功记录
    if (idempotencyKey) {
      const existing = await inquiryRepo.findByIdempotencyKey(idempotencyKey);
      if (existing) {
        // 幂等重放 — 返回已有记录
        return toPublicDto(existing);
      }
    }

    // 生成实体
    const entity = toCreateEntity(validatedBody, idempotencyKey);

    // 入库（单条 INSERT，事务保护）
    const transaction = await db.sequelize.transaction();
    try {
      const created = await inquiryRepo.create(entity, transaction);
      await transaction.commit();

      // 操作日志 (Rule 6)
      logOperation({
        userId: 'guest',
        action: 'create',
        resource: 'inquiry',
        resourceId: created.id,
        after: entity,
        requestInfo: reqInfo,
        success: true,
        idempotencyKey,
      });

      // 邮件通知 — 异步发送，不阻塞响应
      const dto = toAdminDto(created);
      sendNewInquiryNotification(dto).catch(err =>
        require('../utils/logger').appLogger.error(`[Email] 异步发送失败: ${err.message}`)
      );

      return toPublicDto(created);
    } catch (err) {
      await transaction.rollback();

      // 幂等键唯一冲突 = 并发创建，重试查询
      if (err.name === 'SequelizeUniqueConstraintError' && idempotencyKey) {
        const existing = await inquiryRepo.findByIdempotencyKey(idempotencyKey);
        if (existing) return toPublicDto(existing);
      }

      throw err;
    }
  },

  /**
   * 管理员查询留言列表（需认证 + inquiry:read 权限）
   */
  async list(query) {
    const result = await inquiryRepo.findAndCountAll(query);
    return {
      list: result.list.map(toListItemDto),
      pagination: result.pagination,
    };
  },

  /**
   * 管理员查看留言详情（需认证 + inquiry:read 权限）
   */
  async getById(id) {
    const inquiry = await inquiryRepo.findById(id);
    if (!inquiry) {
      throw new NotFoundError('留言不存在', `id=${id}`, ERROR_CODES.DATA_NOT_FOUND);
    }
    return toAdminDto(inquiry);
  },

  /**
   * 管理员更新留言状态（需认证 + inquiry:update 权限）
   */
  async updateStatus(id, { status, notes }, userId, reqInfo) {
    const inquiry = await inquiryRepo.findById(id);
    if (!inquiry) {
      throw new NotFoundError('留言不存在', `id=${id}`, ERROR_CODES.DATA_NOT_FOUND);
    }

    // 业务规则: 不能从 won/lost 回退到 contacted
    const terminalStatuses = ['won', 'lost'];
    if (terminalStatuses.includes(inquiry.status) && status === 'contacted') {
      throw new BusinessError(
        '已成交/已流失的留言不能回退为已联系状态',
        `当前状态 ${inquiry.status}，不允许回退到 ${status}`,
      );
    }

    const before = { status: inquiry.status, notes: inquiry.notes };

    const transaction = await db.sequelize.transaction();
    try {
      await inquiryRepo.updateStatus(id, { status, notes }, transaction);
      await transaction.commit();

      // 操作日志 (Rule 6)
      logOperation({
        userId,
        action: 'update_status',
        resource: 'inquiry',
        resourceId: id,
        before,
        after: { status, notes },
        requestInfo: reqInfo,
        success: true,
      });

      return { id, status, notes: notes || null };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  /**
   * 删除留言（仅 super_admin，需 inquiry:delete 权限）
   */
  async delete(id, userId, reqInfo) {
    const inquiry = await inquiryRepo.findById(id);
    if (!inquiry) {
      throw new NotFoundError('留言不存在', `id=${id}`, ERROR_CODES.DATA_NOT_FOUND);
    }

    const before = toAdminDto(inquiry);

    const transaction = await db.sequelize.transaction();
    try {
      await inquiryRepo.delete(id, transaction);
      await transaction.commit();

      // 操作日志 (Rule 6)
      logOperation({
        userId,
        action: 'delete',
        resource: 'inquiry',
        resourceId: id,
        before,
        after: null,
        requestInfo: reqInfo,
        success: true,
      });

      return true;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};

module.exports = inquiryService;
