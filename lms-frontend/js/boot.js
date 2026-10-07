(function () {
  'use strict';
  if (window.LH && window.LH.BOOTED) return;
  window.LH = window.LH || {};

  var bootScript = document.currentScript;
  var src = bootScript ? bootScript.getAttribute('src') || '' : '';
  var pageBase = src.replace(/[^/]*$/, ''); /* e.g. ../../js/ */

  var files = [
    'config.js',
    'utils/dom.js',
    'utils/format.js',
    'utils/date.js',
    'utils/theme.js',
    'utils/toast.js',
    'utils/modal.js',
    'utils/validation.js',
    'utils/motion.js',
    'mock/data.js',
    'db.js',
    'api/index.js',
    'components/icons.js',
    'components/ui.js',
    'components/app-shell.js',
    'app.js'
  ];

  /* LearnHub favicon on every page (single injection point). */
  try {
    var fav = document.createElement('link');
    fav.rel = 'icon';
    fav.type = 'image/svg+xml';
    fav.href = pageBase + '../images/favicon.svg';
    document.head.appendChild(fav);
    var touch = document.createElement('link');
    touch.rel = 'apple-touch-icon';
    touch.href = pageBase + '../images/favicon.svg';
    document.head.appendChild(touch);
  } catch (e) { /* ignore */ }

  /* Bump on every frontend JS change so browsers never run stale code
     (stale api/index.js = wrong backend mode = phantom "not found"). */
  var CACHE_BUST = '20261007a';

  for (var i = 0; i < files.length; i++) {
    document.write('<script type="text/javascript" src="' + pageBase + files[i] + '?v=' + CACHE_BUST + '"><\/script>');
  }
  window.LH.BOOTED = true;
})();