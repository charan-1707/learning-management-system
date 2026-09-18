(function () {
  'use strict';
  if (window.LH && window.LH.BOOTED) return;
  window.LH = window.LH || {};

  var bootScript = document.currentScript;
  var src = bootScript ? bootScript.getAttribute('src') || '' : '';
  var pageBase = src.replace(/[^/]*$/, ''); /* e.g. ../../js/ */

  var files = [
    'utils/dom.js',
    'utils/format.js',
    'utils/date.js',
    'utils/theme.js',
    'utils/toast.js',
    'utils/modal.js',
    'utils/validation.js',
    'mock/data.js',
    'db.js',
    'api/backend.js',
    'api/index.js',
    'components/icons.js',
    'components/ui.js',
    'components/app-shell.js',
    'app.js'
  ];

  for (var i = 0; i < files.length; i++) {
    document.write('<script type="text/javascript" src="' + pageBase + files[i] + '"><\/script>');
  }
  window.LH.BOOTED = true;
})();