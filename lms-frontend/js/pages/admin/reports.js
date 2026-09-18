(function (LH) {
  'use strict';

  var $ = LH.dom.$, F = LH.format, UI = LH.ui;
  var M = LH.mock;

  function horizonBar(label, value, max, color) {
    var pct = Math.max(2, Math.round(value / max * 100));
    return '<div style="margin-bottom:12px;">' +
      '<div class="flex items-center justify-between" style="margin-bottom:5px;gap:12px;">' +
        '<span style="font-size:13px;font-weight:500;color:var(--color-text-primary);flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + F.esc(label) + '</span>' +
        '<span style="font-size:13px;font-weight:600;color:var(--color-text-secondary);">' + F.n(value) + '</span>' +
      '</div>' +
      '<div style="background:var(--color-bg-tertiary);border-radius:6px;height:8px;overflow:hidden;">' +
        '<div style="height:100%;width:' + pct + '%;border-radius:6px;background:' + color + ';"></div>' +
      '</div>' +
    '</div>';
  }

  function render() {
    var el = $('#report-cards');
    if (!el) return;

    var r = M.adminReports;
    var maxEnroll = Math.max.apply(null, r.enrollmentByCourse.map(function (c) { return c.students; }));
    var maxActive = Math.max.apply(null, r.monthlyActive.map(function (d) { return d.active; }));
    var totalProg = r.distributionByProgram.reduce(function (s, p) { return s + p.students; }, 0);

    var passTotal = r.passRate.passed + r.passRate.failed;

    el.innerHTML =
      '<section class="card">' +
        '<div class="card-header"><h2 class="card-title">Enrollment by course</h2><p class="card-subtitle">Registered students per course (6 max shown)</p></div>' +
        '<div class="card-body" style="padding-top:var(--spacing-4);">' +
          r.enrollmentByCourse.map(function (c) { return horizonBar(c.code + ' — ' + c.course, c.students, maxEnroll, 'var(--color-primary)'); }).join('') +
        '</div>' +
      '</section>' +

      '<section class="card">' +
        '<div class="card-header"><h2 class="card-title">Active users</h2><p class="card-subtitle">Monthly active accounts</p></div>' +
        '<div class="card-body" style="padding-top:var(--spacing-4);">' +
          r.monthlyActive.map(function (m) { return horizonBar(m.month, m.active, maxActive, 'var(--color-info)'); }).join('') +
        '</div>' +
      '</section>' +

      '<section class="card">' +
        '<div class="card-header"><h2 class="card-title">Students by program</h2><p class="card-subtitle">Current distribution</p></div>' +
        '<div class="card-body" style="padding-top:var(--spacing-4);">' +
          r.distributionByProgram.map(function (p) {
            var pct = Math.round(p.students / totalProg * 100);
            return '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">' +
              '<span style="width:110px;font-size:13px;color:var(--color-text-primary);font-weight:500;">' + F.esc(p.program) + '</span>' +
              '<div style="flex:1;"><div style="background:var(--color-bg-tertiary);border-radius:6px;height:8px;overflow:hidden;">' +
                '<div style="height:100%;width:' + pct + '%;border-radius:6px;background:var(--color-warning);"></div></div></div>' +
              '<span style="width:64px;text-align:right;font-size:12px;color:var(--color-text-tertiary);">' + pct + '%</span>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</section>' +

      '<section class="card">' +
        '<div class="card-header"><h2 class="card-title">Assessment pass rate</h2><p class="card-subtitle">Across all recorded assessments</p></div>' +
        '<div class="card-body" style="padding-top:var(--spacing-4);">' +
          UI.progress(88, 'success') +
          '<div style="display:flex;justify-content:space-between;margin-top:10px;font-size:13px;">' +
            '<span class="text-tertiary">' + F.n(r.passRate.passed) + ' passed</span>' +
            '<span style="color:var(--color-text-primary);font-weight:700;">' + F.esc(r.passRate.average) + '</span>' +
            '<span class="text-tertiary">' + F.n(r.passRate.failed) + ' failed</span>' +
          '</div>' +
          '<div style="margin-top:16px;border-top:1px solid var(--color-border-light);padding-top:14px;">' +
            '<div style="font-size:13px;color:var(--color-text-tertiary);margin-bottom:4px;">Total assessments</div>' +
            '<div style="font-size:18px;font-weight:700;color:var(--color-text-primary);">' + F.n(passTotal) + '</div>' +
          '</div>' +
        '</div>' +
      '</section>';
  }

  function init() {
    render();
  }

  LH.app.register('admin-reports', init);
  LH.app.init('admin-reports');
})(window.LH);