/**
 * =============================================================================
 * 留言数据访问层 (Rule 5: 禁止 SELECT *, 禁止拼接 SQL, 使用参数化查询)
 * =============================================================================
 */

const db = require('../models');

const ALLOWED_SORT_FIELDS = ['created_at', 'name', 'status'];

const inquiryRepo = {
  /**
   * 创建留言
   * @param {Object} entity — DTO 转换后的实体
   * @param {import('sequelize').Transaction} [transaction]
   */
  async create(entity, transaction) {
    return db.Inquiry.create(entity, { transaction });
  },

  /**
   * 按幂等键查找（幂等性检查）
   */
  async findByIdempotencyKey(key) {
    return db.Inquiry.findOne({
      where: { idempotency_key: key },
      attributes: ['id', 'name', 'phone', 'company', 'material_type', 'capacity', 'message', 'status', 'created_at'],
    });
  },

  /**
   * 分页查询留言列表
   */
  async findAndCountAll({ page = 1, pageSize = 20, status, materialType, startDate, endDate, keyword, sortBy = 'created_at', sortOrder = 'DESC' }) {
    const where = {};
    if (status) where.status = status;
    if (materialType) where.material_type = materialType;
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at[db.Sequelize.Op.gte] = new Date(startDate);
      if (endDate) where.created_at[db.Sequelize.Op.lte] = new Date(endDate + 'T23:59:59.999Z');
    }
    if (keyword) {
      where[db.Sequelize.Op.or] = [
        { name: { [db.Sequelize.Op.like]: `%${keyword}%` } },
        { company: { [db.Sequelize.Op.like]: `%${keyword}%` } },
        { phone: { [db.Sequelize.Op.like]: `%${keyword}%` } },
      ];
    }

    const orderField = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : 'created_at';
    const orderDir = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const offset = (page - 1) * pageSize;

    const { count, rows } = await db.Inquiry.findAndCountAll({
      where,
      attributes: ['id', 'name', 'phone', 'company', 'material_type', 'capacity', 'status', 'created_at'],
      order: [[orderField, orderDir]],
      limit: pageSize,
      offset,
    });

    return {
      list: rows,
      pagination: {
        page,
        pageSize,
        total: count,
        totalPages: Math.ceil(count / pageSize),
      },
    };
  },

  /**
   * 按 ID 查询留言详情
   */
  async findById(id) {
    return db.Inquiry.findByPk(id);
  },

  /**
   * 更新留言状态
   */
  async updateStatus(id, { status, notes }, transaction) {
    const [affectedCount] = await db.Inquiry.update(
      { status, notes: notes || null, updated_at: new Date() },
      { where: { id }, transaction },
    );
    return affectedCount > 0;
  },

  /**
   * 删除留言
   */
  async delete(id, transaction) {
    const count = await db.Inquiry.destroy({ where: { id }, transaction });
    return count > 0;
  },

  /**
   * 统计数据
   */
  async statsByStatus() {
    return db.Inquiry.findAll({
      attributes: ['status', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']],
      group: ['status'],
    });
  },
};

module.exports = inquiryRepo;
