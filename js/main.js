/* ============================================================
   JIN MACHINE — 全局交互脚本
   功能：导航 | Tab 切换 | FAQ 折叠 | 表单 | 滚动动画
   ============================================================ */

(function () {
  'use strict';

  // ─── 移动端导航 ───
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => navLinks.classList.remove('open'));
    });

    document.addEventListener('click', (e) => {
      if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('open');
      }
    });
  }

  // ─── 平滑滚动 ───
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const navHeight = document.querySelector('.navbar')?.offsetHeight || 72;
        const top = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // ─── Tab 切换 ───
  document.querySelectorAll('.tabs').forEach(tabGroup => {
    const buttons = tabGroup.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.tab-panel');

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.tab;

        // 更新按钮状态
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // 更新面板
        panels.forEach(panel => {
          panel.classList.toggle('active', panel.id === targetId || panel.dataset.tab === targetId);
        });
      });
    });
  });

  // ─── FAQ 折叠 ───
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const wasOpen = item.classList.contains('open');

      // 关闭所有
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));

      // 切换当前
      if (!wasOpen) item.classList.add('open');
    });
  });

  // ─── 联系表单 — AJAX 提交到后端 API ───
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    // API 地址 — 自动检测：
    //   本地开发（localhost / 127.0.0.1 / file://）→ http://localhost:3000/api/v1
    //   生产环境（Gitee Pages）                     → https://jinmachine-api.onrender.com/api/v1
    const isLocal = ['localhost', '127.0.0.1', '[::1]', ''].includes(window.location.hostname)
                 || window.location.protocol === 'file:';
    const API_BASE = isLocal
      ? 'http://localhost:3000/api/v1'
      : 'https://jinmachine-api.onrender.com/api/v1';

    contactForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const btn = document.getElementById('submitBtn');
      const errDiv = document.getElementById('formError');
      const originalText = btn.textContent;
      const originalBg = btn.style.background;
      const originalColor = btn.style.color;

      // 清除上一次的错误标记
      clearFieldErrors();

      // 收集表单数据
      const data = {
        name: document.getElementById('inqName')?.value?.trim() || '',
        phone: document.getElementById('inqPhone')?.value?.trim() || '',
        email: document.getElementById('inqEmail')?.value?.trim() || null,
        company: document.getElementById('inqCompany')?.value?.trim() || null,
        materialType: document.getElementById('inqMaterial')?.value || '',
        capacity: document.getElementById('inqCapacity')?.value || 'unknown',
        message: document.getElementById('inqMessage')?.value?.trim() || '',
      };

      // ── 前端基础校验 ──
      if (!data.name || data.name.trim().length === 0) {
        showFieldError('inqName', '请填写您的姓名'); return;
      }
      if (!data.phone || data.phone.trim().length < 7) {
        showFieldError('inqPhone', '请填写正确的手机号码（至少7位）'); return;
      }
      if (!/^[\d\s\-]+$/.test(data.phone.trim())) {
        showFieldError('inqPhone', '手机号只能包含数字、空格和横线'); return;
      }
      if (!data.materialType) {
        showFieldError('inqMaterial', '请选择物料类型'); return;
      }
      if (data.company && data.company.trim().length > 0) {
        if (!/^[一-龥　、。（）《》·\s]+$/.test(data.company.trim())) {
          showFieldError('inqCompany', '公司名称只能包含中文'); return;
        }
      }
      if (data.email && data.email.trim().length > 0) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
          showFieldError('inqEmail', '邮箱格式不正确'); return;
        }
      }

      // ── 发送请求 ──
      btn.textContent = '提交中...';
      btn.disabled = true;
      errDiv.style.display = 'none';
      clearFieldErrors();

      try {
        const res = await fetch(`${API_BASE}/inquiries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        // 尝试解析 JSON（服务器一定返回 JSON）
        let result;
        try {
          result = await res.json();
        } catch (parseErr) {
          showError('服务器返回异常，请稍后重试（响应格式错误）');
          resetBtn();
          return;
        }

        if (res.ok) {
          // ── 成功 ──
          btn.textContent = '✓ 提交成功！我们将尽快联系您';
          btn.style.background = '#10B981';
          btn.style.color = '#fff';
          contactForm.reset();
          setTimeout(resetBtn, 3500);
        } else {
          // ── 服务器返回了校验错误 → 显示具体原因 ──
          const serverMsg = result.message || '提交失败';
          // 尝试匹配字段名，给对应输入框标红
          const matchedField = matchFieldFromError(serverMsg);
          if (matchedField) {
            showFieldError(matchedField, serverMsg);
          } else {
            showError('❌ ' + serverMsg);
          }
          resetBtn();
        }
      } catch (err) {
        // ── 真正的网络异常（服务器没启动 / 断网 / CORS）──
        showError('⚠️ 无法连接到服务器，请确认后端已启动（http://localhost:3000）');
        resetBtn();
      }
    });

    function resetBtn() {
      const btn = document.getElementById('submitBtn');
      btn.textContent = '提交需求 →';
      btn.style.background = '';
      btn.style.color = '';
      btn.disabled = false;
    }

    // 根据服务器错误消息匹配对应的表单字段
    function matchFieldFromError(msg) {
      if (!msg) return null;
      const m = msg.toLowerCase();
      if (m.includes('姓名') || m.includes('name')) return 'inqName';
      if (m.includes('手机') || m.includes('电话') || m.includes('phone')) return 'inqPhone';
      if (m.includes('邮箱') || m.includes('email')) return 'inqEmail';
      if (m.includes('公司') || m.includes('company')) return 'inqCompany';
      if (m.includes('物料') || m.includes('material')) return 'inqMaterial';
      if (m.includes('描述') || m.includes('message')) return 'inqMessage';
      return null;
    }

    function showFieldError(fieldId, msg) {
      showError('❌ ' + msg);
      const field = document.getElementById(fieldId);
      if (field) {
        field.style.borderColor = '#EF4444';
        field.style.boxShadow = '0 0 0 3px rgba(239,68,68,.15)';
        field.addEventListener('input', function clear() {
          field.style.borderColor = '';
          field.style.boxShadow = '';
          field.removeEventListener('input', clear);
        }, { once: true });
      }
    }

    function clearFieldErrors() {
      ['inqName','inqPhone','inqEmail','inqCompany','inqMaterial','inqMessage'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.style.borderColor = ''; el.style.boxShadow = ''; }
      });
    }

    function showError(msg) {
      const errDiv = document.getElementById('formError');
      errDiv.textContent = msg;
      errDiv.style.display = 'block';
    }
  }

  // ─── 联系方式 — 点击复制 ───
  document.querySelectorAll('.contact-item[data-copy]').forEach(item => {
    item.addEventListener('click', () => {
      const text = item.dataset.copy;
      const label = item.dataset.label || '内容';
      copyToClipboard(text, label);
    });
  });

  function copyToClipboard(text, label) {
    // 优先用 Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(`✓ ${label}已复制: ${text}`);
      }).catch(() => {
        fallbackCopy(text, label);
      });
    } else {
      fallbackCopy(text, label);
    }
  }

  function fallbackCopy(text, label) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand('copy');
      showToast(`✓ ${label}已复制: ${text}`);
    } catch (e) {
      showToast(`📋 ${label}: ${text}`);
    }
    document.body.removeChild(textarea);
  }

  function showToast(msg) {
    // 移除已有 toast
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    document.body.appendChild(toast);

    // 2秒后自动消失
    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 2000);
  }

  // ─── 导航滚动阴影 ───
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.style.boxShadow = window.scrollY > 10 ? '0 1px 8px rgba(0,0,0,.08)' : '';
    });
  }

  // ─── AOS 滚动渐入动画 ───
  const aosElements = document.querySelectorAll('[data-aos]');
  if (aosElements.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('aos-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

    aosElements.forEach(el => observer.observe(el));

    // 页面加载时检查已在视野中的元素
    window.addEventListener('load', () => {
      aosElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight) el.classList.add('aos-visible');
      });
    });
  }

  console.log('JIN MACHINE — 双桶分子筛除湿干燥机');
  console.log('露点-80℃ | 远程控制 | 能耗监测');

})();
