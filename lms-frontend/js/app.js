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

    /* Build the shell; returns false when redirected to login */
    if (!LH.shell.init()) return;

    var fn = renderers[document.body.getAttribute('data-page')];

    function run() {
      if (fn) {
        try {
          fn();
        } catch (e) {
          if (window.console) console.error('[LearnHub] Page render error:', e);
        }
      }
      document.body.classList.add('lh-ready');
    }

    if (LH.live && LH.live.enabled) {
      /* Live mode: pull from the backend and hydrate the in-memory cache before rendering. */
      LH.live.hydrate().then(function (ok) {
        if (ok) {
          LH.live.arm();
          if (LH.shell.refreshUnread) LH.shell.refreshUnread();
        }
        run();
      });
    } else {
      run();
    }
  };

  /* Shared markup helpers used across pages */

  app.bindGlobalCharts = function () {};

})(window.LH);