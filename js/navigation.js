/* ============================================
   Navigation & Cookie Consent
   ============================================ */

(function() {
  'use strict';

  // --- Mobile Navigation Toggle ---
  const toggle = document.querySelector('.nav__toggle');
  const menu = document.querySelector('.nav__menu');

  if (toggle && menu) {
    toggle.addEventListener('click', function() {
      const isOpen = menu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    menu.querySelectorAll('a').forEach(function(link) {
      link.addEventListener('click', function() {
        menu.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  // --- Active Nav Link ---
  var currentPath = window.location.pathname;
  document.querySelectorAll('.nav__menu a').forEach(function(link) {
    var href = link.getAttribute('href');
    if (href === currentPath || (href !== '/' && currentPath.indexOf(href) === 0)) {
      link.classList.add('active');
    }
    if (href === '/' && (currentPath === '/' || currentPath === '/index.html')) {
      link.classList.add('active');
    }
  });

  // --- FAQ Accordion ---
  document.querySelectorAll('.faq-item__question').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var item = btn.closest('.faq-item');
      var isOpen = item.classList.contains('is-open');
      // Close all
      document.querySelectorAll('.faq-item').forEach(function(i) {
        i.classList.remove('is-open');
      });
      // Toggle clicked
      if (!isOpen) {
        item.classList.add('is-open');
      }
    });
  });

  // --- Cookie Consent Banner ---
  var banner = document.querySelector('.cookie-banner');
  if (banner && !localStorage.getItem('brainforge_cookies_accepted')) {
    banner.classList.add('is-visible');
  }

  var acceptBtn = document.querySelector('.cookie-accept');
  if (acceptBtn) {
    acceptBtn.addEventListener('click', function() {
      localStorage.setItem('brainforge_cookies_accepted', 'true');
      banner.classList.remove('is-visible');
    });
  }

  var declineBtn = document.querySelector('.cookie-decline');
  if (declineBtn) {
    declineBtn.addEventListener('click', function() {
      localStorage.setItem('brainforge_cookies_accepted', 'false');
      banner.classList.remove('is-visible');
    });
  }

  // --- Toast Notification Helper ---
  window.BrainForge = window.BrainForge || {};
  window.BrainForge.showToast = function(message, type) {
    type = type || 'info';
    var existing = document.querySelector('.toast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.className = 'toast toast--' + type;
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(function() {
      toast.classList.add('is-visible');
    });

    setTimeout(function() {
      toast.classList.remove('is-visible');
      setTimeout(function() { toast.remove(); }, 300);
    }, 2000);
  };
})();
