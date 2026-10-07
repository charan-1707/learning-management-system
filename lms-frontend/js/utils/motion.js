window.LH = window.LH || {};

/* Antigravity motion layer: scroll-reveal + page transition + restrained
   parallax. Vanilla JS, IntersectionObserver only (no libraries), animates
   transform/opacity exclusively. Respects prefers-reduced-motion. Idempotent:
   safe to run once per page boot and re-run after dynamic renders. */
(function (LH) {
  'use strict';

  var NS = LH.motion = {};
  var observed = new WeakSet();
  var reduceMotion = false;

  try {
    reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) { reduceMotion = false; }

  NS.prefersReducedMotion = function () { return reduceMotion; };

  var REVEAL_SELECTOR = '.card, .stat-card, .course-card, .notification-item, ' +
    '.activity-item, .table-wrapper, .module-item, .page-header, ' +
    '#welcome-banner, #admin-welcome, .auth-card';

  var STAGGER_PARENTS = '#stat-grid, #admin-stats, #continue-grid, #course-grid, ' +
    '.grid, .dash-col, .stack, .quiz-options';

  var observer = null;

  function getObserver() {
    if (observer || !('IntersectionObserver' in window)) return observer;
    observer = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        if (entry.isIntersecting) {
          entry.target.classList.add('ag-in');
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    return observer;
  }

  /* Tag reveal candidates inside root (default: document). Above-the-fold
     items intersect immediately and animate in with stagger on load. */
  function tagReveals(root) {
    root = root || document;
    var els;
    try {
      els = root.querySelectorAll(REVEAL_SELECTOR);
    } catch (e) { return; }
    var io = getObserver();
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (observed.has(el) || el.classList.contains('ag-reveal')) continue;
      /* Skip skeletons and anything inside a modal/dropdown/toast. */
      if (el.closest && (el.closest('.modal') || el.closest('.dropdown-menu') ||
          el.closest('.user-menu-dropdown') || el.closest('.toast-container') ||
          el.classList.contains('skel') || el.closest('.skel-wrap'))) continue;
      el.classList.add('ag-reveal');
      observed.add(el);
      if (io && !reduceMotion) io.observe(el);
      else el.classList.add('ag-in');
    }
    /* Mark stagger parents so children cascade via CSS delays. */
    var parents;
    try {
      parents = root.querySelectorAll(STAGGER_PARENTS);
    } catch (e) { parents = []; }
    for (var j = 0; j < parents.length; j++) {
      if (!observed.has(parents[j])) {
        parents[j].classList.add('ag-stagger');
        observed.add(parents[j]);
      }
    }
  }

  /* Global page transition: fade + rise the main canvas on each load. */
  function pageTransition() {
    if (reduceMotion) return;
    var main = document.getElementById('main') || document.querySelector('.auth-card');
    if (!main || observed.has(main)) return;
    observed.add(main);
    main.classList.add('lh-page-enter');
    setTimeout(function () { main.classList.remove('lh-page-enter'); }, 700);
  }

  /* Minimal parallax: auth backdrop drifts slower than foreground content.
     Single rAF-throttled scroll listener, auth pages only. */
  function parallax() {
    if (reduceMotion) return;
    var aside = document.querySelector('.auth-aside');
    if (!aside || !('requestAnimationFrame' in window)) return;
    aside.classList.add('ag-parallax');
    var ticking = false;
    function update() {
      ticking = false;
      var y = window.scrollY || window.pageYOffset || 0;
      aside.style.setProperty('--px', Math.round(y * -0.06) + 'px');
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
  }

  /* Animated stat counters: 0 -> value on first reveal (transform-free,
     text-only; skipped under reduced motion). Non-numeric values untouched. */
  function counters() {
    if (reduceMotion) return;
    var vals;
    try {
      vals = document.querySelectorAll('.stat-card-value');
    } catch (e) { return; }
    for (var i = 0; i < vals.length; i++) {
      (function (el) {
        if (observed.has(el)) return;
        observed.add(el);
        var raw = (el.textContent || '').trim();
        var m = raw.match(/^(-?\d+(?:\.\d+)?)(.*)$/);
        if (!m) return;
        var target = parseFloat(m[1]);
        var suffix = m[2] || '';
        if (!isFinite(target) || Math.abs(target) > 1000000) return;
        var decimals = (m[1].indexOf('.') >= 0) ? (m[1].split('.')[1] || '').length : 0;
        var dur = 600, t0 = null;
        function frame(t) {
          if (t0 == null) t0 = t;
          var p = Math.min(1, (t - t0) / dur);
          var eased = 1 - Math.pow(1 - p, 3);
          var cur = target * eased;
          el.textContent = (decimals ? cur.toFixed(decimals) : Math.round(cur)) + suffix;
          if (p < 1) window.requestAnimationFrame(frame);
          else el.textContent = raw; /* snap to exact rendered value */
        }
        var io = getObserver();
        if (io && 'IntersectionObserver' in window) {
          var once = new IntersectionObserver(function (entries) {
            if (entries[0] && entries[0].isIntersecting) {
              once.disconnect();
              window.requestAnimationFrame(frame);
            }
          }, { threshold: 0.4 });
          once.observe(el);
        } else {
          window.requestAnimationFrame(frame);
        }
      })(vals[i]);
    }
  }

  /* Public init: run once at boot; re-call observe() after async renders
     (dashboards inject cards after fetch — observe picks up new nodes). */
  NS.observe = function (root) {
    if (reduceMotion) {
      /* Ensure content is visible even if classes were pre-applied. */
      var pre = (root || document).querySelectorAll
        ? (root || document).querySelectorAll('.ag-reveal') : [];
      for (var i = 0; i < pre.length; i++) pre[i].classList.add('ag-in');
      return;
    }
    tagReveals(root);
  };

  NS.init = function () {
    pageTransition();
    tagReveals(document);
    counters();
    parallax();
    /* Pick up cards injected by async page renderers (one lightweight
       MutationObserver, debounced — no per-scroll work). */
    try {
      if (reduceMotion || !('MutationObserver' in window)) return;
      var pending = false;
      var mo = new MutationObserver(function () {
        if (pending) return;
        pending = true;
        setTimeout(function () {
          pending = false;
          tagReveals(document);
        }, 120);
      });
      mo.observe(document.body, { childList: true, subtree: true });
    } catch (e) { /* motion must never break boot */ }
  };

  /* Auto-boot: runs after shell + page renderer (script order in boot.js:
     motion loads before app.js, so DOMContentLoaded fires after renderers
     registered; a second pass catches async-injected cards). */
  function autoBoot() {
    try { NS.init(); } catch (e) { /* ignore */ }
    setTimeout(function () {
      try { NS.observe(document); counters(); } catch (e) { /* ignore */ }
    }, 1500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoBoot);
  } else {
    autoBoot();
  }

})(window.LH);
