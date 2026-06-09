/**
 * =============================================================================
 * 业务枚举常量
 * =============================================================================
 */

/** 用户角色 */
const ROLE = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
};

const ROLE_VALUES = Object.values(ROLE);

/** 询盘状态 */
const INQUIRY_STATUS = {
  NEW: 'new',               // 新留言
  CONTACTED: 'contacted',   // 已联系
  QUOTED: 'quoted',         // 已报价
  NEGOTIATING: 'negotiating', // 洽谈中
  WON: 'won',               // 成交
  LOST: 'lost',             // 流失
  ARCHIVED: 'archived',     // 归档
};

const INQUIRY_STATUS_VALUES = Object.values(INQUIRY_STATUS);

/** 物料类型 */
const MATERIAL_TYPES = [
  'PET', 'R-PET', 'TPU', 'PE', 'PA', 'PLA', 'PBAT', 'PMMA', 'other',
];

/** 产能需求 */
const CAPACITY_OPTIONS = [
  '100-300', '300-500', '500-800', '800+', 'unknown',
];

module.exports = {
  ROLE,
  ROLE_VALUES,
  INQUIRY_STATUS,
  INQUIRY_STATUS_VALUES,
  MATERIAL_TYPES,
  CAPACITY_OPTIONS,
};
