/**
 * =============================================================================
 * 邮件通知服务 — 新留言通知发送到管理员 QQ 邮箱
 * =============================================================================
 */

const nodemailer = require('nodemailer');
const config = require('../config');
const { appLogger } = require('../utils/logger');

let transporter = null;

/** 初始化邮件传输器 */
function getTransporter() {
  if (transporter) return transporter;

  if (!config.email.host) {
    appLogger.warn('[Email] 邮件服务未配置，跳过邮件通知');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
  });

  return transporter;
}

/**
 * 发送新留言通知邮件
 *
 * @param {Object} inquiry — 留言详情
 * @param {string} inquiry.name
 * @param {string} inquiry.phone
 * @param {string|null} inquiry.company
 * @param {string} inquiry.materialType
 * @param {string} inquiry.capacity
 * @param {string} inquiry.message
 */
async function sendNewInquiryNotification(inquiry) {
  const t = getTransporter();
  if (!t) return;

  const subject = `【JIN MACHINE】新客户询盘 — ${inquiry.name} (${inquiry.materialType})`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'Microsoft YaHei',sans-serif;padding:20px;background:#f5f5f5;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">

    <!-- 头部 -->
    <div style="background:linear-gradient(135deg,#042F2E,#0D9488);padding:28px 32px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;">🆕 新客户询盘</h1>
      <p style="color:rgba(255,255,255,.75);margin:8px 0 0;font-size:14px;">JIN MACHINE — 双桶分子筛除湿干燥机</p>
    </div>

    <!-- 内容 -->
    <div style="padding:28px 32px;">

      <!-- 客户信息 -->
      <h2 style="font-size:16px;color:#042F2E;border-bottom:2px solid #0D9488;padding-bottom:8px;margin:0 0 16px;">👤 客户信息</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <tr><td style="padding:8px 12px;color:#666;width:80px;">姓名</td><td style="padding:8px 12px;color:#333;font-weight:600;">${inquiry.name}</td></tr>
        <tr style="background:#f9fafb;"><td style="padding:8px 12px;color:#666;">电话</td><td style="padding:8px 12px;color:#333;font-weight:600;">${inquiry.phone}</td></tr>
        <tr><td style="padding:8px 12px;color:#666;">公司</td><td style="padding:8px 12px;color:#333;">${inquiry.company || '未填写'}</td></tr>
        <tr style="background:#f9fafb;"><td style="padding:8px 12px;color:#666;">邮箱</td><td style="padding:8px 12px;color:#333;">${inquiry.email || '未填写'}</td></tr>
      </table>

      <!-- 需求信息 -->
      <h2 style="font-size:16px;color:#042F2E;border-bottom:2px solid #0D9488;padding-bottom:8px;margin:0 0 16px;">📋 需求详情</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <tr><td style="padding:8px 12px;color:#666;width:80px;">物料类型</td><td style="padding:8px 12px;color:#333;font-weight:600;">${inquiry.materialType}</td></tr>
        <tr style="background:#f9fafb;"><td style="padding:8px 12px;color:#666;">产能需求</td><td style="padding:8px 12px;color:#333;">${inquiry.capacity}</td></tr>
        <tr><td style="padding:8px 12px;color:#666;">提交时间</td><td style="padding:8px 12px;color:#333;">${inquiry.createdAt || new Date().toLocaleString('zh-CN')}</td></tr>
      </table>

      <!-- 需求描述 -->
      <h2 style="font-size:16px;color:#042F2E;border-bottom:2px solid #0D9488;padding-bottom:8px;margin:0 0 16px;">💬 客户留言</h2>
      <div style="background:#f0faf9;padding:16px;border-radius:8px;color:#333;line-height:1.8;white-space:pre-wrap;">${inquiry.message || '（无额外描述）'}</div>

    </div>

    <!-- 底部 -->
    <div style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #eee;">
      <p style="color:#999;font-size:12px;margin:0;">
        此邮件由 JIN MACHINE 官网自动发送<br>
        登录管理后台查看详情: <a href="https://hou-the-visionary.gitee.io/jinmachine/" style="color:#0D9488;">JIN MACHINE 官网</a>
      </p>
    </div>

  </div>
</body>
</html>`;

  try {
    await t.sendMail({
      from: `"JIN MACHINE 官网" <${config.email.user}>`,
      to: config.email.to,
      subject,
      html,
    });
    appLogger.info(`[Email] 新询盘通知已发送: ${subject}`);
  } catch (err) {
    appLogger.error(`[Email] 发送失败: ${err.message}`);
  }
}

module.exports = { sendNewInquiryNotification };
