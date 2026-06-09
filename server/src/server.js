/**
 * =============================================================================
 * 锦越机械 JIN MACHINE — API 服务入口
 * =============================================================================
 */

const config = require('./config');
const app = require('./app');
const db = require('./models');
const { appLogger } = require('./utils/logger');

async function start() {
  // 测试数据库连接
  try {
    await db.sequelize.authenticate();
    appLogger.info('✓ 数据库连接成功');
  } catch (err) {
    appLogger.error(`✗ 数据库连接失败: ${err.message}`);
    if (!config.isTest) process.exit(1);
  }

  // 同步模型（开发环境自动建表，生产环境使用 migration）
  if (config.isDev && !config.isTest) {
    await db.sequelize.sync({ alter: false });
    appLogger.info('✓ 模型同步完成');
  }

  const server = app.listen(config.port, () => {
    appLogger.info(`✓ JIN MACHINE API 已启动: http://localhost:${config.port}${config.apiPrefix}`);
    appLogger.info(`  环境: ${config.nodeEnv}`);
    appLogger.info(`  健康检查: http://localhost:${config.port}${config.apiPrefix}/health`);
  });

  // 优雅关闭
  const shutdown = async (signal) => {
    appLogger.info(`收到 ${signal}，正在关闭服务...`);
    server.close(() => {
      db.sequelize.close().then(() => {
        appLogger.info('服务已关闭');
        process.exit(0);
      });
    });
    setTimeout(() => process.exit(1), 10000); // 10秒强制退出
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// 测试环境不自动启动（由 supertest 控制）
if (!config.isTest) {
  start();
}

module.exports = app;
