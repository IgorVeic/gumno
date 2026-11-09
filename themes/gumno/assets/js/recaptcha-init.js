/**
 * Magic Forms ships a jQuery-based reCAPTCHA loader.
 * October CMS 4 uses framework-bundle (no jQuery), so we render the widget in vanilla JS.
 */
(function () {
  'use strict';

  window.captchas = window.captchas || [];

  function paramsFrom(el) {
    return {
      sitekey: el.getAttribute('data-sitekey'),
      theme: el.getAttribute('data-theme') || 'light',
      type: el.getAttribute('data-type') || 'image',
      size: el.getAttribute('data-size') || 'normal'
    };
  }

  function renderAll() {
    if (typeof grecaptcha === 'undefined' || typeof grecaptcha.render !== 'function') {
      return false;
    }

    var nodes = document.querySelectorAll('.g-recaptcha');
    if (!nodes.length) {
      return false;
    }

    var rendered = 0;
    nodes.forEach(function (el) {
      if (el.querySelector('iframe') || el.getAttribute('data-widget-id') !== null) {
        rendered += 1;
        return;
      }
      try {
        var id = grecaptcha.render(el, paramsFrom(el));
        el.setAttribute('data-widget-id', String(id));
        window.captchas[el.id] = id;
        rendered += 1;
      } catch (err) {
        // Widget may already be mid-render; retry on next tick.
      }
    });

    return rendered === nodes.length;
  }

  window.onloadCallback = renderAll;

  window.resetReCaptcha = function (id) {
    if (typeof grecaptcha === 'undefined') {
      return;
    }
    var widget = window.captchas[id];
    if (typeof widget !== 'undefined') {
      grecaptcha.reset(widget);
    }
  };

  if (renderAll()) {
    return;
  }

  var tries = 0;
  var timer = setInterval(function () {
    tries += 1;
    if (renderAll() || tries > 50) {
      clearInterval(timer);
    }
  }, 100);
})();
