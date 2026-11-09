(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initNav() {
    var toggle = document.querySelector('[data-nav-toggle]');
    var nav = document.querySelector('[data-nav]');
    if (!toggle || !nav) return;

    var lastFocus = null;

    function getFocusable() {
      return nav.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])');
    }

    function closeNav() {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      if (lastFocus && typeof lastFocus.focus === 'function') {
        lastFocus.focus();
      }
    }

    function openNav() {
      lastFocus = document.activeElement;
      nav.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      var focusable = getFocusable();
      if (focusable.length) focusable[0].focus();
    }

    toggle.addEventListener('click', function () {
      if (nav.classList.contains('is-open')) {
        closeNav();
      } else {
        openNav();
      }
    });

    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeNav);
    });

    document.addEventListener('keydown', function (event) {
      if (!nav.classList.contains('is-open')) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        closeNav();
        return;
      }

      if (event.key !== 'Tab') return;

      var focusable = Array.prototype.slice.call(getFocusable());
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

  function revealImmediate() {
    document.querySelectorAll('[data-animate]').forEach(function (el) {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
  }

  function initPortalMotion() {
    if (typeof gsap === 'undefined' || reduceMotion) {
      revealImmediate();
      return;
    }

    var brand = document.querySelector('[data-animate="portal-brand"]');
    var cards = gsap.utils.toArray('[data-animate="portal-card"]');
    var links = document.querySelector('[data-animate="portal-links"]');
    var orbs = document.querySelectorAll('.portal__orb');
    if (!brand) return;

    gsap.set([brand].concat(cards).concat(links ? [links] : []), {
      transition: 'none'
    });

    if (orbs.length) {
      gsap.fromTo(
        orbs,
        { scale: 0.88, opacity: 0.4 },
        { scale: 1, opacity: 1, duration: 1.35, stagger: 0.1, ease: 'power2.out' }
      );
    }

    var tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      onComplete: function () {
        gsap.set([brand].concat(cards).concat(links ? [links] : []), {
          clearProps: 'transform,opacity,transition'
        });
      }
    });

    tl.fromTo(brand, { y: 24, opacity: 0.55 }, { y: 0, opacity: 1, duration: 0.75 })
      .fromTo(
        cards,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.65, stagger: 0.1 },
        '-=0.35'
      );

    if (links) {
      tl.fromTo(links, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45 }, '-=0.25');
    }
  }

  function initPageMotion() {
    if (typeof gsap === 'undefined' || reduceMotion) {
      revealImmediate();
      return;
    }

    var items = gsap.utils.toArray('[data-animate="fade-up"]');
    if (!items.length) return;

    if (typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
      items.forEach(function (item) {
        gsap.fromTo(
          item,
          { y: 28, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.65,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: item,
              start: 'top 88%',
              once: true
            }
          }
        );
      });
    } else {
      gsap.fromTo(
        items,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55, stagger: 0.06, ease: 'power3.out' }
      );
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    initNav();
    if (document.body.classList.contains('page-home')) {
      initPortalMotion();
    } else if (!document.body.classList.contains('page-404')) {
      initPageMotion();
    } else {
      revealImmediate();
    }
  });
})();
