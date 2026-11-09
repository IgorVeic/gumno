(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
