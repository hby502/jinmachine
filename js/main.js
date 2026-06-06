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

  // ─── 联系表单 ───
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      // 如果表单有 formsubmit action，让它正常提交
      if (this.action && this.action.includes('formsubmit')) return;

      e.preventDefault();

      const btn = this.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      btn.textContent = '提交中...';
      btn.disabled = true;

      // 模拟提交
      setTimeout(() => {
        btn.textContent = '✓ 提交成功！我们将尽快联系您';
        btn.style.background = '#10B981';
        btn.style.color = '#fff';
        this.reset();

        setTimeout(() => {
          btn.textContent = originalText;
          btn.style.background = '';
          btn.style.color = '';
          btn.disabled = false;
        }, 3500);
      }, 1000);
    });
  }

  // ─── 提交成功提示（从 Gitee Pages 跳回来时） ───
  if (window.location.search.includes('sent=1')) {
    const form = document.getElementById('contactForm');
    if (form) {
      const btn = form.querySelector('button[type="submit"]');
      if (btn) {
        btn.textContent = '✓ 留言已发送！我们会尽快联系您';
        btn.style.background = '#10B981';
        btn.style.color = '#fff';
        btn.disabled = true;
      }
    }
    // 清理 URL 参数
    if (window.history.replaceState) {
      window.history.replaceState({}, '', window.location.pathname);
    }
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
