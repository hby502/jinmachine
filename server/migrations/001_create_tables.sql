-- =============================================================================
-- 锦越机械 JIN MACHINE — 数据库初始化迁移
-- MySQL 8.0+
-- =============================================================================

CREATE DATABASE IF NOT EXISTS jinmachine
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE jinmachine;

-- =============================================================================
-- 管理员用户表
-- =============================================================================
CREATE TABLE IF NOT EXISTS admin_users (
  id            CHAR(36)     NOT NULL PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('super_admin', 'admin') NOT NULL DEFAULT 'admin',
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  last_login_at DATETIME     NULL,
  last_login_ip VARCHAR(45)  NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 客户留言/询盘表
-- =============================================================================
CREATE TABLE IF NOT EXISTS inquiries (
  id              CHAR(36)    NOT NULL PRIMARY KEY,
  name            VARCHAR(50) NOT NULL,
  phone           VARCHAR(20) NOT NULL,
  company         VARCHAR(100) NULL,
  material_type   ENUM('PET','R-PET','TPU','PE','PA','PLA','PBAT','PMMA','other') NOT NULL,
  capacity        ENUM('100-300','300-500','500-800','800+','unknown') NOT NULL DEFAULT 'unknown',
  message         TEXT        NULL,
  status          ENUM('new','contacted','quoted','negotiating','won','lost','archived') NOT NULL DEFAULT 'new',
  notes           TEXT        NULL,
  idempotency_key CHAR(36)    NULL,
  created_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE INDEX idx_idempotency_key (idempotency_key),
  INDEX idx_status (status),
  INDEX idx_material_type (material_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
