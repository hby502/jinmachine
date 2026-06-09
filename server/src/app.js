/**
 * =============================================================================
 * Express 应用配置
 * =============================================================================
 * 统一注册中间件、路由、错误处理
 * =============================================================================
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const config = require('./config');
const { requestIdMiddleware } = require('./middleware/requestId');
const { notFoundHandler, globalErrorHandler } = require('./middleware/errorHandler');
const { appLogger } = require('./utils/logger');

// 路由
const authRoutes = require('./routes/auth.routes');
const inquiryRoutes = require('./routes/inquiry.routes');

const app = express();

// ─── 安全头 ───
app.use(helmet());

// ─── CORS — 允许本地开发 (file:// / localhost / 127.0.0.1) 和 Gitee Pages ───
app.use(cors({
  origin: function (origin, callback) {
    // 允许无 origin 的请求（file://、同域、curl、Postman）
    if (!origin) return callback(null, true);
    // 允许的域名列表
    const allowed = [
      'http://localhost:3000',
      'http://localhost:8080',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:8080',
      'https://hou-the-visionary.gitee.io',
    ];
    if (allowed.includes(origin)) {
      return callback(null, true);
    }
    // 开发环境宽松处理（允许所有 localhost 变体 + file:// null origin）
    if (config.isDev) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Idempotency-Key', 'X-Request-Id'],
}));

// ─── 请求体解析 ───
app.use(express.json({ limit: config.security.maxBodySize }));
app.use(express.urlencoded({ extended: false }));

// ─── 请求ID ───
app.use(requestIdMiddleware);

// ─── 请求日志 ───
app.use((req, _res, next) => {
  appLogger.info(`${req.method} ${req.originalUrl}`, {
    requestId: req.requestId,
    ip: req.ip,
    userAgent: req.get('user-agent')?.slice(0, 200),
  });
  next();
});

// ─── 路由注册 ───
const prefix = config.apiPrefix;

app.use(`${prefix}/auth`, authRoutes);
app.use(`${prefix}/inquiries`, inquiryRoutes);

// ─── 健康检查 ───
app.get(`${prefix}/health`, (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// ─── 404 + 全局错误 ───
app.use(notFoundHandler);
app.use(globalErrorHandler);

module.exports = app;
