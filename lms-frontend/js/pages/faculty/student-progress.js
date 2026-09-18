(function (LH) {
  'use strict';

  var $ = LH.dom.$, F = LH.format, UI = LH.ui, I = LH.icons;
  var M = LH.mock;

  var students = [
    { name: 'Meera Patel', score: 92, time: 11 },
    { name: 'Sneha Reddy', score: 88, time: 13 },
    { name: 'Alex Johnson', score: 84, time: 9 },
    { name: 'Tanvi Desai', score: 81, time: 15 },
    { name: 'Aditya Kumar', score: 76, time: 12 },
    { name: 'Rohan Gupta', score: 68, time: 14 },
    { name: 'Karan Singh', score: 57, time: 16 }
  ];

  function render() {
    var el = $('#perf-list');
    if (!el) return;

    el.innerHTML = students.map(function (s) {
      var pct = s.score;
      var color = pct >= 80 ? 'var(--color-success)' : pct >= 65 ? 'var(--color-primary)' : 'var(--color-danger)';
      var risk = pct < 60 ? UI.badge('Needs attention', 'danger') : pct < 75 ? UI.badge('On track', 'info') : UI.badge('Excellent', 'success');

      return '<div style="margin-bottom:16px;">' +
        '<div style="display:flex;align-items:center;gap:12px;margin-bottom:6px;flex-wrap:wrap;">' +
          UI.avatar(s.name, 'sm') +
          '<div style="flex:1;min-width:140px;"><span style="font-size:13px;font-weight:600;color:var(--color-text-primary);">' + F.esc(s.name) + '</span>' +
            '<span style="font-size:12px;color:var(--color-text-muted);margin-left:10px;">Avg study ' + s.time + 'h/wk</span></div>' +
          '<span style="font-size:13px;font-weight:700;color:' + color + ';">' + pct + '%</span>' +
          risk +
        '</div>' +
        UI.progress(pct) +
      '</div>';
    }).join('');
  }

  function init() {
    render();
  }

  LH.app.register('faculty-progress', init);
  LH.app.init('faculty-progress');
})(window.LH);