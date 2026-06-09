/**
 * =============================================================================
 * 测试环境配置 (Jest setupFiles — 无 Jest globals)
 * =============================================================================
 */

process.env.NODE_ENV = 'test';
process.env.PORT = '0';
process.env.DB_NAME = process.env.DB_NAME || 'jinmachine_test';
process.env.JWT_SECRET = 'test-secret-for-jwt-signing-min-32-chars';
process.env.LOG_DIR = './logs/test';
process.env.DB_LOGGING = 'false';
