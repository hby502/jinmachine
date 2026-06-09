/**
 * =============================================================================
 * 管理员用户数据访问层
 * =============================================================================
 */

const db = require('../models');

const adminUserRepo = {
  /**
   * 按用户名查询
   */
  async findByUsername(username) {
    return db.AdminUser.findOne({
      where: { username },
      attributes: ['id', 'username', 'password_hash', 'role', 'is_active', 'last_login_at', 'last_login_ip', 'created_at'],
    });
  },

  /**
   * 按 ID 查询
   */
  async findById(id) {
    return db.AdminUser.findByPk(id, {
      attributes: ['id', 'username', 'role', 'is_active', 'last_login_at', 'created_at'],
    });
  },

  /**
   * 更新最后登录信息
   */
  async updateLastLogin(id, ip) {
    return db.AdminUser.update(
      { last_login_at: new Date(), last_login_ip: ip },
      { where: { id } },
    );
  },

  /**
   * 创建管理员（仅 super_admin 可用）
   */
  async create(entity, transaction) {
    return db.AdminUser.create(entity, { transaction });
  },

  /**
   * 查询管理员列表
   */
  async findAll() {
    return db.AdminUser.findAll({
      attributes: ['id', 'username', 'role', 'is_active', 'last_login_at', 'created_at'],
      order: [['created_at', 'ASC']],
    });
  },

  /**
   * 更新管理员
   */
  async update(id, fields, transaction) {
    const [count] = await db.AdminUser.update(
      { ...fields, updated_at: new Date() },
      { where: { id }, transaction },
    );
    return count > 0;
  },

  /**
   * 删除管理员
   */
  async delete(id, transaction) {
    const count = await db.AdminUser.destroy({ where: { id }, transaction });
    return count > 0;
  },
};

module.exports = adminUserRepo;
