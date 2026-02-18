/**
 * ClearSkin AI — Website Scripts
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initScrollAnimations();
  initParallax();
  initSmoothScroll();
  initFormHandling();
});

/* ================================================
   Navigation — sticky + mobile drawer
   ================================================ */
function initNavigation() {
  const navbar = document.getElementById('navbar');
  const toggle = document.getElementById('navToggle');
  const menu   = document.getElementById('navMenu');

  /* Scroll → add .scrolled */
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
        ticking = false;
      });
      ticking = true;
    }
  });

  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    toggle.classList.toggle('active');
    menu.classList.toggle('active');
    document.body.style.overflow = menu.classList.contains('active') ? 'hidden' : '';
  });

  menu.querySelectorAll('.nav-link').forEach(link =>
    link.addEventListener('click', () => closeMenu(toggle, menu))
  );

  document.addEventListener('click', (e) => {
    if (!toggle.contains(e.target) && !menu.contains(e.target)) closeMenu(toggle, menu);
  });
}

function closeMenu(toggle, menu) {
  toggle.classList.remove('active');
  menu.classList.remove('active');
  document.body.style.overflow = '';
}

/* ================================================
   Scroll Animations — fade-in via IntersectionObserver
   IMPORTANT: .legal-section is deliberately excluded
   so that legal pages are never invisible.
   ================================================ */
function initScrollAnimations() {
  /* Auto-tag elements that should animate (excludes .legal-section) */
  const selectors = [
    '.feature-card',
    '.step-card',
    '.stat-card',
    '.faq-item',
    '.tech-item',
    '.contact-info-card'
  ];

  document.querySelectorAll(selectors.join(',')).forEach(el => {
    if (!el.classList.contains('fade-in')) el.classList.add('fade-in');
  });

  /* Observe */
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '0px 0px -40px 0px', threshold: 0.05 }
  );

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

/* ================================================
   Parallax — floating orbs shift on scroll
   ================================================ */
function initParallax() {
  const orbs = document.querySelectorAll('.floating-orb');
  if (!orbs.length) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const y = window.scrollY;
        orbs.forEach((orb, i) => {
          orb.style.transform = `translateY(${y * (0.08 + i * 0.04)}px)`;
        });
        ticking = false;
      });
      ticking = true;
    }
  });
}

/* ================================================
   Smooth Scroll — anchor links
   ================================================ */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const id = this.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const offset = document.getElementById('navbar').offsetHeight;
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - offset,
        behavior: 'smooth'
      });
    });
  });
}

/* ================================================
   Form Handling — contact form
   ================================================ */
function initFormHandling() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', handleSubmit);

  form.querySelectorAll('input, textarea, select').forEach(f => {
    f.addEventListener('blur', () => validateField(f));
    f.addEventListener('input', () => clearError(f));
  });
}

async function handleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const btn  = form.querySelector('button[type="submit"]');
  const orig = btn.innerHTML;

  let valid = true;
  form.querySelectorAll('input, textarea, select').forEach(f => {
    if (!validateField(f)) valid = false;
  });
  if (!valid) return;

  btn.innerHTML = 'Sending\u2026';
  btn.disabled = true;

  try {
    await new Promise(r => setTimeout(r, 1500)); // placeholder for real API
    notify('Message sent! We\'ll get back to you soon.', 'success');
    form.reset();
  } catch {
    notify('Something went wrong. Please try again.', 'error');
  } finally {
    btn.innerHTML = orig;
    btn.disabled = false;
  }
}

function validateField(f) {
  const v = f.value.trim();
  if (f.required && !v)            return showError(f, 'This field is required'), false;
  if (f.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
                                   return showError(f, 'Enter a valid email'), false;
  clearError(f);
  return true;
}

function showError(f, msg) {
  clearError(f);
  f.style.borderColor = 'var(--danger)';
  const span = document.createElement('span');
  span.className = 'field-error';
  span.style.cssText = 'color:var(--danger);font-size:.82rem;display:block;margin-top:.25rem';
  span.textContent = msg;
  f.parentElement.appendChild(span);
}

function clearError(f) {
  f.style.borderColor = '';
  const err = f.parentElement.querySelector('.field-error');
  if (err) err.remove();
}

/* Notification toast */
function notify(message, type) {
  const prev = document.querySelector('.cs-toast');
  if (prev) prev.remove();

  const el = document.createElement('div');
  el.className = 'cs-toast';
  el.style.cssText = `
    position:fixed;top:90px;right:20px;z-index:10000;
    padding:.85rem 1.4rem;border-radius:.75rem;
    font-weight:600;font-size:.9rem;max-width:380px;
    box-shadow:0 10px 30px rgba(0,0,0,.35);
    animation:slideIn .3s var(--ease, ease);
    background:${type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--danger)' : 'var(--primary)'};
    color:#fff;
  `;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 300); }, 4500);
}

/* inject toast keyframe */
const _s = document.createElement('style');
_s.textContent = '@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}';
document.head.appendChild(_s);
