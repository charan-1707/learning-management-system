window.LH = window.LH || {};

/* App bootstrap: runs after all libs are loaded by js/boot.js */
(function (LH) {
  'use strict';

  var app = LH.app = {};
  var renderers = {};

  app.register = function (pageId, fn) {
    renderers[pageId] = fn;
  };

  app.param = function (name) {
    var q = window.location.search.substring(1);
    if (!q) return '';
    var pairs = q.split('&');
    for (var i = 0; i < pairs.length; i++) {
      var kv = pairs[i].split('=');
      if (decodeURIComponent(kv[0]) === name) {
        return kv.length > 1 ? decodeURIComponent(kv[1].replace(/\+/g, ' ')) : '';
      }
    }
    return '';
  };

  app.init = function (pageId) {
    if (pageId) document.body.setAttribute('data-page', pageId);

    /* Build the shell; returns false when redirected to login.
       Both shell.init and page renderers may be sync or async (live mode). */
    function run() {
      var fn = renderers[document.body.getAttribute('data-page')];
      if (fn) {
        try {
          var r = fn();
          if (r && typeof r.then === 'function') {
            return r.then(function () {
              document.body.classList.add('lh-ready');
            }, function (e) {
              if (window.console) console.error('[LearnHub] Page render error:', e);
              document.body.classList.add('lh-ready');
            });
          }
        } catch (e) {
          if (window.console) console.error('[LearnHub] Page render error:', e);
        }
      }
      document.body.classList.add('lh-ready');
    }

    try {
      var booted = LH.shell.init();
      if (booted && typeof booted.then === 'function') {
        return booted.then(function (ok) {
          if (ok === false) return;
          return run();
        }, function (e) {
          if (window.console) console.error('[LearnHub] Shell init error:', e);
        });
      }
      if (booted === false) return;
      return run();
    } catch (e) {
      if (window.console) console.error('[LearnHub] Shell init error:', e);
    }
  };

  /* Global safety net: silent failures are the worst kind. Surface them. */
  if (typeof window.addEventListener === 'function') {
    window.addEventListener('unhandledrejection', function (e) {
      try {
        var reason = e.reason || {};
        var msg = reason.error || reason.message || 'Something went wrong. Please try again.';
        if (window.console) console.warn('[LearnHub] Unhandled rejection:', reason);
        if (LH.toast) LH.toast.error('Something went wrong', msg);
      } catch (err) { /* never break on the safety net itself */ }
    });
  }

  /* Shared markup helpers used across pages */

  app.bindGlobalCharts = function () {};

})(window.LH);