/**
 * =============================================================================
 * 数据库初始化脚本 — 创建默认超级管理员
 * =============================================================================
 * 用法: node src/seed.js
 * 创建默认账号: admin / admin123456
 * =============================================================================
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const db = require('./models');
const { appLogger } = require('./utils/logger');

async function seed() {
  try {
    await db.sequelize.authenticate();
    appLogger.info('✓ 数据库连接成功');

    // 同步表结构
    await db.sequelize.sync({ alter: false });

    // 检查是否已有管理员
    const existing = await db.AdminUser.findOne({ where: { username: 'admin' } });
    if (existing) {
      appLogger.info('默认管理员已存在，跳过创建');
      console.log('  用户名: admin');
      console.log('  角色: super_admin');
      return;
    }

    // 创建默认超级管理员
    const passwordHash = await bcrypt.hash('admin123456', 12);

    await db.AdminUser.create({
      id: uuidv4(),
      username: 'admin',
      password_hash: passwordHash,
      role: 'super_admin',
      is_active: true,
    });

    appLogger.info('✓ 默认管理员已创建');
    console.log('========================================');
    console.log('  默认管理员账号');
    console.log('  用户名: admin');
    console.log('  密码:   admin123456');
    console.log('  角色:   super_admin');
    console.log('========================================');
    console.log('⚠  请登录后立即修改密码！');

  } catch (err) {
    appLogger.error(`初始化失败: ${err.message}`);
    console.error(err);
  } finally {
    await db.sequelize.close();
  }
}

seed();
