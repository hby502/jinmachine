/**
 * =============================================================================
 * 管理员用户模型
 * =============================================================================
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AdminUser = sequelize.define('AdminUser', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: { notEmpty: true },
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'admin',
      validate: {
        isIn: [['super_admin', 'admin']],
      },
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    last_login_at: { type: DataTypes.DATE, allowNull: true },
    last_login_ip: { type: DataTypes.STRING(45), allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  }, {
    tableName: 'admin_users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return AdminUser;
};
