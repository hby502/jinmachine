/**
 * =============================================================================
 * 应用配置 — 本地 SQLite / 生产 PostgreSQL (DATABASE_URL)
 * =============================================================================
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',
  isProd: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  apiPrefix: process.env.API_PREFIX || '/api/v1',

  // 数据库 — 生产环境用 DATABASE_URL (Render PostgreSQL)，本地用 SQLite
  db: {
    // Render 提供的 PostgreSQL 连接串优先
    databaseUrl: process.env.DATABASE_URL || '',
    // 本地 SQLite
    dialect: process.env.DB_DIALECT || 'sqlite',
    storage: process.env.DB_STORAGE || './data/database.sqlite',
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    database: process.env.DB_NAME || 'jinmachine',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    pool: {
      max: parseInt(process.env.DB_POOL_MAX, 10) || 20,
      min: parseInt(process.env.DB_POOL_MIN, 10) || 5,
      acquire: 30000,
      idle: 10000,
    },
    logging: (process.env.NODE_ENV || 'development') === 'development'
      ? (msg) => console.log(`[DB] ${msg}`)
      : false,
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'jinmachine-dev-secret-do-not-use-in-prod',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: process.env.JWT_ISSUER || 'jinmachine-api',
  },

  log: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || './logs',
  },

  security: {
    idempotencyTTL: parseInt(process.env.IDEMPOTENCY_TTL, 10) || 86400,
    maxBodySize: process.env.MAX_BODY_SIZE || '100kb',
    maxBatchSize: parseInt(process.env.MAX_BATCH_SIZE, 10) || 100,
  },

  email: {
    host: process.env.EMAIL_HOST || '',
    port: parseInt(process.env.EMAIL_PORT, 10) || 465,
    secure: process.env.EMAIL_SECURE !== 'false',
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    to: process.env.EMAIL_TO || '',
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
  },
};

module.exports = config;
