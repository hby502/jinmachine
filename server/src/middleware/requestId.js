const { v4: uuidv4 } = require('uuid');

/** 为每个请求生成唯一 ID，用于日志追踪 */
function requestIdMiddleware(req, res, next) {
  req.requestId = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-Id', req.requestId);
  next();
}

module.exports = { requestIdMiddleware };
