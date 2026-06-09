/**
 * =============================================================================
 * 客户留言/询盘模型
 * =============================================================================
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Inquiry = sequelize.define('Inquiry', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      allowNull: false,
    },
    name: { type: DataTypes.STRING(50), allowNull: false },
    phone: { type: DataTypes.STRING(20), allowNull: false },
    email: { type: DataTypes.STRING(100), allowNull: true },
    company: { type: DataTypes.STRING(100), allowNull: true },
    material_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['PET', 'R-PET', 'TPU', 'PE', 'PA', 'PLA', 'PBAT', 'PMMA', 'other']],
      },
    },
    capacity: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'unknown',
      validate: {
        isIn: [['100-300', '300-500', '500-800', '800+', 'unknown']],
      },
    },
    message: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'new',
      validate: {
        isIn: [['new', 'contacted', 'quoted', 'negotiating', 'won', 'lost', 'archived']],
      },
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
    idempotency_key: { type: DataTypes.CHAR(36), allowNull: true, unique: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  }, {
    tableName: 'inquiries',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['status'] },
      { fields: ['material_type'] },
      { fields: ['created_at'] },
      { fields: ['idempotency_key'], unique: true },
    ],
  });

  return Inquiry;
};
