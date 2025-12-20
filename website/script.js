/**
 * ClearSkin AI - Interactive Website Scripts
 * Modern, smooth animations and interactions
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize all modules
  initNavigation();
  initScrollAnimations();
  initParallaxEffects();
  initSmoothScroll();
  initCounterAnimations();
  initFormHandling();
});

/**
 * Navigation Module
 * Handles sticky navbar and mobile menu
 */
function initNavigation() {
  const navbar = document.getElementById('navbar');
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  
  // Scroll handler for navbar
  let lastScroll = 0;
  let ticking = false;
  
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        handleNavbarScroll(navbar, lastScroll);
        lastScroll = window.scrollY;
        ticking = false;
      });
      ticking = true;
    }
  });
  
  // Mobile menu toggle
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('active');
      navMenu.classList.toggle('active');
      document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    });
    
    // Close menu when clicking a link
    navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navMenu.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
    
    // Close menu on outside click
    document.addEventListener('click', (e) => {
      if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
        navToggle.classList.remove('active');
        navMenu.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }
}

function handleNavbarScroll(navbar, lastScroll) {
  const currentScroll = window.scrollY;
  
  if (currentScroll > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
}

/**
 * Scroll Animations Module
 * Fade-in animations using Intersection Observer
 */
function initScrollAnimations() {
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -50px 0px',
    threshold: 0.1
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        
        // Trigger counter animation if applicable
        if (entry.target.querySelector('.stat-card-value')) {
          animateCounter(entry.target.querySelector('.stat-card-value'));
        }
        
        // Optional: Unobserve after animation
        // observer.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  // Observe all fade-in elements
  document.querySelectorAll('.fade-in').forEach(el => {
    observer.observe(el);
  });
  
  // Add fade-in class to elements that should animate
  addAnimationClasses();
}

function addAnimationClasses() {
  // Add fade-in to elements that should animate on scroll
  const animateElements = document.querySelectorAll(
    '.feature-card, .step-card, .stat-card, .testimonial-card, ' +
    '.about-feature-item, .value-card, .faq-item, .contact-method'
  );
  
  animateElements.forEach(el => {
    if (!el.classList.contains('fade-in')) {
      el.classList.add('fade-in');
    }
  });
}

/**
 * Counter Animation Module
 * Animates numbers counting up
 */
function initCounterAnimations() {
  // Counters are triggered by scroll animations
}

function animateCounter(element) {
  if (element.dataset.animated) return;
  element.dataset.animated = 'true';
  
  const text = element.textContent;
  const hasPlus = text.includes('+');
  const hasPercent = text.includes('%');
  const hasM = text.includes('M');
  const hasK = text.includes('K');
  
  let number = parseFloat(text.replace(/[^0-9.]/g, ''));
  let suffix = '';
  
  if (hasPlus) suffix = '+';
  if (hasPercent) suffix = '%';
  if (hasM) suffix = 'M+';
  if (hasK) suffix = 'K+';
  
  // Special case for app store rating
  if (number < 10 && number > 1) {
    animateDecimal(element, number);
    return;
  }
  
  const duration = 2000;
  const startTime = performance.now();
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Easing function
    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
    
    const current = Math.floor(number * easeOutQuart);
    element.textContent = current.toLocaleString() + suffix;
    
    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = text;
    }
  }
  
  requestAnimationFrame(update);
}

function animateDecimal(element, target) {
  const duration = 2000;
  const startTime = performance.now();
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
    
    const current = (target * easeOutQuart).toFixed(1);
    element.textContent = current;
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  
  requestAnimationFrame(update);
}

/**
 * Parallax Effects Module
 * Subtle parallax scrolling effects
 */
function initParallaxEffects() {
  const orbs = document.querySelectorAll('.floating-orb');
  const floatingCards = document.querySelectorAll('.floating-card');
  
  let ticking = false;
  
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        
        orbs.forEach((orb, index) => {
          const speed = 0.1 + (index * 0.05);
          orb.style.transform = `translateY(${scrollY * speed}px)`;
        });
        
        floatingCards.forEach((card, index) => {
          const speed = 0.05 + (index * 0.02);
          const baseY = index === 0 ? 0 : index === 1 ? 0 : 0;
          card.style.transform = `translateY(${baseY + scrollY * speed}px)`;
        });
        
        ticking = false;
      });
      ticking = true;
    }
  });
}

/**
 * Smooth Scroll Module
 * Smooth scrolling for anchor links
 */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        
        const navbarHeight = document.getElementById('navbar').offsetHeight;
        const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - navbarHeight;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

/**
 * Form Handling Module
 * Contact form validation and submission
 */
function initFormHandling() {
  const contactForm = document.getElementById('contactForm');
  
  if (contactForm) {
    contactForm.addEventListener('submit', handleFormSubmit);
    
    // Real-time validation
    contactForm.querySelectorAll('input, textarea, select').forEach(field => {
      field.addEventListener('blur', () => validateField(field));
      field.addEventListener('input', () => clearFieldError(field));
    });
  }
}

async function handleFormSubmit(e) {
  e.preventDefault();
  
  const form = e.target;
  const submitButton = form.querySelector('button[type="submit"]');
  const originalText = submitButton.innerHTML;
  
  // Validate all fields
  const fields = form.querySelectorAll('input, textarea, select');
  let isValid = true;
  
  fields.forEach(field => {
    if (!validateField(field)) {
      isValid = false;
    }
  });
  
  if (!isValid) return;
  
  // Show loading state
  submitButton.innerHTML = '<span class="btn-icon">⏳</span> Sending...';
  submitButton.disabled = true;
  
  try {
    // Collect form data
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Simulate API call (replace with actual API endpoint)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Show success message
    showNotification('Message sent successfully! We\'ll get back to you soon.', 'success');
    form.reset();
    
  } catch (error) {
    showNotification('Something went wrong. Please try again later.', 'error');
  } finally {
    submitButton.innerHTML = originalText;
    submitButton.disabled = false;
  }
}

function validateField(field) {
  const value = field.value.trim();
  const fieldName = field.name || field.id;
  let errorMessage = '';
  
  // Required check
  if (field.hasAttribute('required') && !value) {
    errorMessage = 'This field is required';
  }
  
  // Email validation
  else if (field.type === 'email' && value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      errorMessage = 'Please enter a valid email address';
    }
  }
  
  // Minimum length
  else if (field.minLength > 0 && value.length < field.minLength) {
    errorMessage = `Minimum ${field.minLength} characters required`;
  }
  
  if (errorMessage) {
    showFieldError(field, errorMessage);
    return false;
  }
  
  clearFieldError(field);
  return true;
}

function showFieldError(field, message) {
  clearFieldError(field);
  
  field.style.borderColor = 'var(--danger)';
  
  const errorElement = document.createElement('span');
  errorElement.className = 'field-error';
  errorElement.style.cssText = 'color: var(--danger); font-size: 0.875rem; margin-top: 0.25rem; display: block;';
  errorElement.textContent = message;
  
  field.parentElement.appendChild(errorElement);
}

function clearFieldError(field) {
  field.style.borderColor = '';
  const existingError = field.parentElement.querySelector('.field-error');
  if (existingError) {
    existingError.remove();
  }
}

function showNotification(message, type = 'info') {
  // Remove existing notifications
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    padding: 1rem 1.5rem;
    border-radius: 0.75rem;
    font-weight: 500;
    z-index: 10000;
    animation: slideInRight 0.3s ease-out;
    max-width: 400px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    ${type === 'success' 
      ? 'background: var(--success); color: white;' 
      : type === 'error' 
        ? 'background: var(--danger); color: white;'
        : 'background: var(--primary); color: white;'
    }
  `;
  
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 0.75rem;">
      <span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
      <span>${message}</span>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease-out forwards';
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

// Add animation keyframes dynamically
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

/**
 * Utility Functions
 */

// Debounce function for performance
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function for performance
function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Check if element is in viewport
function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// Add loading indicator
function showLoading() {
  const loader = document.createElement('div');
  loader.id = 'page-loader';
  loader.style.cssText = `
    position: fixed;
    inset: 0;
    background: var(--dark);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99999;
  `;
  loader.innerHTML = `
    <div style="
      width: 50px;
      height: 50px;
      border: 3px solid var(--gray-700);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    "></div>
  `;
  document.body.appendChild(loader);
}

function hideLoading() {
  const loader = document.getElementById('page-loader');
  if (loader) {
    loader.style.opacity = '0';
    loader.style.transition = 'opacity 0.3s ease-out';
    setTimeout(() => loader.remove(), 300);
  }
}

// Add spin keyframe
const spinStyle = document.createElement('style');
spinStyle.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(spinStyle);

// Initialize cursor effects (optional)
function initCursorEffects() {
  const cursor = document.createElement('div');
  cursor.className = 'custom-cursor';
  cursor.style.cssText = `
    position: fixed;
    width: 20px;
    height: 20px;
    border: 2px solid var(--primary);
    border-radius: 50%;
    pointer-events: none;
    z-index: 99999;
    transition: transform 0.1s ease-out, opacity 0.3s;
    transform: translate(-50%, -50%);
  `;
  
  // Only add on non-touch devices
  if (window.matchMedia('(hover: hover)').matches) {
    document.body.appendChild(cursor);
    
    document.addEventListener('mousemove', (e) => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
    });
    
    document.querySelectorAll('a, button, .feature-card').forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursor.style.transform = 'translate(-50%, -50%) scale(1.5)';
        cursor.style.borderColor = 'var(--secondary)';
      });
      el.addEventListener('mouseleave', () => {
        cursor.style.transform = 'translate(-50%, -50%) scale(1)';
        cursor.style.borderColor = 'var(--primary)';
      });
    });
  }
}

// Uncomment to enable custom cursor
// initCursorEffects();

console.log('🔬 ClearSkin AI Website Loaded');
