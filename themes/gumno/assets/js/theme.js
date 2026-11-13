(function () {
  'use strict';

  function initNav() {
    var toggle = document.querySelector('[data-nav-toggle]');
    var nav = document.querySelector('[data-nav]');
    var scrim = document.querySelector('[data-nav-scrim]');
    if (!toggle || !nav) return;

    var lastFocus = null;
    var mobileQuery = window.matchMedia('(max-width: 1040px)');

    function getFocusable() {
      var nodes = [toggle].concat(
        Array.prototype.slice.call(
          nav.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])')
        )
      );
      return nodes.filter(function (el) {
        return el && !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true';
      });
    }

    function syncInert(isOpen) {
      if (!mobileQuery.matches) {
        nav.removeAttribute('inert');
        return;
      }
      if (isOpen) {
        nav.removeAttribute('inert');
      } else {
        nav.setAttribute('inert', '');
      }
    }

    function setOpen(isOpen) {
      nav.classList.toggle('is-open', isOpen);
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      document.body.classList.toggle('nav-open', isOpen);
      syncInert(isOpen);
      if (scrim) {
        scrim.classList.toggle('is-open', isOpen);
        scrim.hidden = !isOpen;
      }
    }

    function closeNav() {
      if (!nav.classList.contains('is-open')) return;
      setOpen(false);
      if (lastFocus && typeof lastFocus.focus === 'function') {
        lastFocus.focus();
      } else {
        toggle.focus();
      }
    }

    function openNav() {
      lastFocus = document.activeElement;
      setOpen(true);
      var firstLink = nav.querySelector('.site-nav__links a');
      if (firstLink) firstLink.focus();
    }

    syncInert(false);

    toggle.addEventListener('click', function () {
      if (nav.classList.contains('is-open')) {
        closeNav();
      } else {
        openNav();
      }
    });

    if (scrim) {
      scrim.addEventListener('click', closeNav);
    }

    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeNav);
    });

    mobileQuery.addEventListener('change', function () {
      if (!mobileQuery.matches) {
        setOpen(false);
      } else {
        syncInert(nav.classList.contains('is-open'));
      }
    });

    document.addEventListener('keydown', function (event) {
      if (!nav.classList.contains('is-open')) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        closeNav();
        return;
      }

      if (event.key !== 'Tab') return;

      var focusable = getFocusable();
      if (!focusable.length) return;

      var first = focusable[0];
      var last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', initNav);
})();
