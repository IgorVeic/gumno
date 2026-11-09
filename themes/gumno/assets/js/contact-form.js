/**
 * Contact form: Cyrillic field errors + keep success/error flash in view.
 */
(function () {
  'use strict';

  var REQUIRED_MSG = 'Ова поле е задолжително.';
  var EMAIL_MSG = 'Внесете валидна е-маил адреса.';
  var FIELDS = ['name', 'email', 'subject', 'message'];

  function errorEl(form, name) {
    return form.querySelector('[data-validate-for="' + name + '"]');
  }

  function clearError(el) {
    if (!el) return;
    el.textContent = '';
    el.classList.remove('jax-visible', 'is-visible');
  }

  function showError(el, message) {
    if (!el) return;
    el.textContent = message;
    el.classList.add('jax-visible', 'is-visible');
  }

  function clearFormErrors(form) {
    form.querySelectorAll('[data-validate-for]').forEach(clearError);
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function validate(form) {
    clearFormErrors(form);
    var ok = true;
    var firstInvalid = null;

    FIELDS.forEach(function (name) {
      var input = form.querySelector('[name="' + name + '"]');
      if (!input) return;

      var value = String(input.value || '').trim();
      var slot = errorEl(form, name);

      if (!value) {
        showError(slot, REQUIRED_MSG);
        ok = false;
        if (!firstInvalid) firstInvalid = input;
        return;
      }

      if (name === 'email' && !isValidEmail(value)) {
        showError(slot, EMAIL_MSG);
        ok = false;
        if (!firstInvalid) firstInvalid = input;
      }
    });

    if (firstInvalid && typeof firstInvalid.focus === 'function') {
      firstInvalid.focus();
    }

    return ok;
  }

  function findContactForm(target) {
    if (!target || target === window || target === document) {
      return document.querySelector('form.contact-form');
    }
    if (target.matches && target.matches('form.contact-form')) return target;
    if (target.closest) {
      var closest = target.closest('form.contact-form');
      if (closest) return closest;
    }
    return document.querySelector('form.contact-form');
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function isInViewport(el) {
    var rect = el.getBoundingClientRect();
    var header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 74;
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var topLimit = header + 8;
    var bottomLimit = vh - 8;

    return rect.top >= topLimit && rect.bottom <= bottomLimit && rect.height > 0;
  }

  function scrollToMessage(flash) {
    flash = flash ||
      document.getElementById('contact-form-flash') ||
      document.querySelector('form.contact-form .form-flash');
    if (!flash) return;

    if (typeof flash.focus === 'function') {
      if (!flash.hasAttribute('tabindex')) {
        flash.setAttribute('tabindex', '-1');
      }
      try {
        flash.focus({ preventScroll: true });
      } catch (e) {
        flash.focus();
      }
    }

    if (isInViewport(flash)) return;

    var header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 74;
    var top = flash.getBoundingClientRect().top + window.pageYOffset - header - 20;

    window.scrollTo({
      top: Math.max(0, top),
      behavior: prefersReducedMotion() ? 'auto' : 'smooth'
    });
  }

  window.gumnoScrollFormFlash = scrollToMessage;

  function scheduleScrollToMessage() {
    window.requestAnimationFrame(function () {
      scrollToMessage();
    });
  }

  document.addEventListener('ajax:setup', function (event) {
    var form = findContactForm(event.target);
    if (!form || !event.detail || !event.detail.context) return;

    var options = event.detail.context.options;
    var previous = options.beforeSendFunc;

    options.beforeSendFunc = function () {
      if (!validate(form)) {
        return false;
      }
      if (typeof previous === 'function') {
        return previous.apply(this, arguments);
      }
    };
  });

  // ajax:done targets the form element
  document.addEventListener('ajax:done', function (event) {
    if (!findContactForm(event.target)) return;
    scheduleScrollToMessage();
  });

  // ajax:update-complete targets window
  window.addEventListener('ajax:update-complete', function () {
    if (!document.querySelector('form.contact-form .form-flash, #contact-form-flash')) return;
    scheduleScrollToMessage();
  });

  document.addEventListener('input', function (event) {
    var form = findContactForm(event.target);
    if (!form || !event.target.closest || !event.target.closest('form.contact-form')) return;
    var name = event.target.getAttribute('name');
    if (!name) return;
    clearError(errorEl(form, name));
  });
})();
