window.LH = window.LH || {};

(function (LH) {
  'use strict';

  var NS = LH.theme = {};
  var KEY = 'learnhub-theme';

  function getSystemTheme() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  NS.getStored = function () {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  };

  NS.setStored = function (theme) {
    try { localStorage.setItem(KEY, theme); } catch (e) { /* ignore */ }
  };

  NS.getCurrent = function () {
    return document.documentElement.getAttribute('data-theme') || getSystemTheme();
  };

  NS.apply = function (theme) {
    document.documentElement.setAttribute('data-theme', theme);
    NS.setStored(theme);
    var toggle = document.getElementById('theme-toggle-icon');
    if (toggle) {
      toggle.innerHTML = theme === 'dark'
        ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
        : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    }
  };

  NS.toggle = function () {
    var next = NS.getCurrent() === 'dark' ? 'light' : 'dark';
    NS.apply(next);
    return next;
  };

  NS.init = function () {
    var stored = NS.getStored();
    NS.apply(stored || getSystemTheme());
    if (stored) return;
    if (window.matchMedia) {
      try {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
          if (!NS.getStored()) NS.apply(e.matches ? 'dark' : 'light');
        });
      } catch (e) { /* ignore */ }
    }
  };

})(window.LH);