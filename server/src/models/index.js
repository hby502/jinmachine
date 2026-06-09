/**
 * =============================================================================
 * Sequelize ORM — SQLite(本地) / PostgreSQL(生产 DATABASE_URL)
 * =============================================================================
 */

const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');
const config = require('../config');

let sequelize;

if (config.db.databaseUrl) {
  // ── 生产环境: 使用 Render 提供的 DATABASE_URL (PostgreSQL) ──
  sequelize = new Sequelize(config.db.databaseUrl, {
    dialect: 'postgres',
    logging: config.db.logging,
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false },
    },
    define: {
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    timezone: '+08:00',
  });
} else {
  // ── 本地开发: SQLite 文件数据库 ──
  const storagePath = path.resolve(config.db.storage);
  const dir = path.dirname(storagePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: storagePath,
    logging: config.db.logging,
    define: {
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      paranoid: false,
    },
  });
}

const AdminUser = require('./adminUser.model')(sequelize);
const Inquiry = require('./inquiry.model')(sequelize);

const db = { sequelize, Sequelize, AdminUser, Inquiry };

module.exports = db;
