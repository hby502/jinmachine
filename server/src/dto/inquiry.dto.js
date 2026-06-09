/**
 * =============================================================================
 * 留言 DTO — 数据转换 (Rule 2: 禁止直接使用原始请求参数操作数据库)
 * =============================================================================
 */

const { v4: uuidv4 } = require('uuid');

/** 校验后请求 -> 数据库实体 */
function toCreateEntity(validatedBody, idempotencyKey) {
  return {
    id: uuidv4(),
    name: validatedBody.name.trim(),
    phone: validatedBody.phone.trim(),
    email: validatedBody.email?.trim() || null,
    company: validatedBody.company?.trim() || null,
    material_type: validatedBody.materialType,
    capacity: validatedBody.capacity || 'unknown',
    message: validatedBody.message?.trim() || '',
    status: 'new',
    notes: null,
    idempotency_key: idempotencyKey,
    created_at: new Date(),
    updated_at: new Date(),
  };
}

/** 数据库行 -> API 响应 (公共: 电话脱敏) */
function toPublicDto(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    phone: maskPhone(row.phone),
    email: row.email,
    company: row.company,
    materialType: row.material_type,
    capacity: row.capacity,
    message: row.message,
    status: row.status,
    createdAt: toISO(row.created_at),
  };
}

/** 数据库行 -> API 响应 (管理端: 完整信息) */
function toAdminDto(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    company: row.company,
    materialType: row.material_type,
    capacity: row.capacity,
    message: row.message,
    status: row.status,
    notes: row.notes,
    createdAt: toISO(row.created_at),
    updatedAt: toISO(row.updated_at),
  };
}

/** 数据库行 -> 列表项 */
function toListItemDto(row) {
  return {
    id: row.id,
    name: row.name,
    phone: maskPhone(row.phone),
    company: row.company,
    materialType: row.material_type,
    capacity: row.capacity,
    status: row.status,
    createdAt: toISO(row.created_at),
  };
}

/** 电话脱敏: 138****8000 */
function maskPhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length <= 4) return phone;
  return digits.slice(0, 3) + '****' + digits.slice(-4);
}

function toISO(d) {
  return d ? new Date(d).toISOString() : null;
}

module.exports = { toCreateEntity, toPublicDto, toAdminDto, toListItemDto };
