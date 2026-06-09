/**
 * =============================================================================
 * 统一日志 — 操作日志 + 错误日志 (Rule 3 + Rule 6)
 * =============================================================================
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');
const config = require('../config');

const logDir = config.log.dir;
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

const fileOpts = (name) => ({
  filename: path.join(logDir, `${name}-%DATE%.log`),
  datePattern: 'YYYY-MM-DD',
  maxFiles: '180d',
  maxsize: '50m',
});

// 操作日志 (Rule 6: 所有写操作必须记录)
const auditLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { type: 'audit' },
  transports: [
    new winston.transports.File(fileOpts('audit')),
    ...(config.isDev ? [new winston.transports.Console()] : []),
  ],
});

// 错误日志 (Rule 3: 所有错误完整记录)
const errorLogger = winston.createLogger({
  level: 'error',
  format: logFormat,
  defaultMeta: { type: 'error' },
  transports: [
    new winston.transports.File(fileOpts('error')),
    ...(config.isDev ? [new winston.transports.Console()] : []),
  ],
});

// 应用日志
const appLogger = winston.createLogger({
  level: config.log.level,
  format: logFormat,
  defaultMeta: { type: 'app' },
  transports: [
    new winston.transports.File(fileOpts('app')),
    ...(config.isDev ? [new winston.transports.Console()] : []),
  ],
});

/**
 * 记录操作日志 (Rule 6)
 */
function logOperation({ userId, action, resource, resourceId, before = null, after = null, requestInfo = {}, success = true, idempotencyKey = null }) {
  auditLogger.info('操作日志', {
    userId, action, resource, resourceId,
    before: before ? JSON.stringify(before) : null,
    after: after ? JSON.stringify(after) : null,
    requestInfo: { ip: requestInfo.ip || 'unknown', method: requestInfo.method || 'unknown', path: requestInfo.path || 'unknown' },
    success, idempotencyKey, timestamp: new Date().toISOString(),
  });
}

/**
 * 记录错误日志 (Rule 3)
 */
function logError({ errorCode, errorMessage, stack = '', userId = 'anonymous', requestId = 'unknown', requestInfo = {} }) {
  errorLogger.error('异常日志', {
    errorCode, errorMessage, stack, userId, requestId,
    requestInfo: { ip: requestInfo.ip || 'unknown', method: requestInfo.method || 'unknown', path: requestInfo.path || 'unknown' },
    timestamp: new Date().toISOString(),
  });
}

module.exports = { appLogger, auditLogger, errorLogger, logOperation, logError };
