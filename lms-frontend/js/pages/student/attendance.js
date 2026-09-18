(function (LH) {
  'use strict';

  var $ = LH.dom.$, F = LH.format, D = LH.date, UI = LH.ui, I = LH.icons;
  var M = LH.mock;

  function renderSummary() {
    var el = $('#attendance-summary');
    var overall = LH.api.attendance.overall();
    var worst = null, best = null;
    M.attendance.forEach(function (a) {
      var p = a.present / a.total * 100;
      if (!worst || p < worst.pct) worst = { course: a.course, pct: p };
      if (!best || p > best.pct) best = { course: a.course, pct: p };
    });

    var stats = [
      { icon: 'attendance', tone: 'success', value: overall.percent + '%', label: 'Overall attendance', sub: overall.present + ' of ' + overall.total + ' classes' },
      { icon: 'check', tone: 'primary', value: overall.present, label: 'Classes attended', sub: 'Across ' + overall.courses + ' courses' },
      { icon: 'alert', tone: 'danger', value: Math.round(best.pct) + '%', label: 'Best attendance', sub: best.course }
    ];

    el.innerHTML = stats.map(function (s) { return UI.statCard(s); }).join('');
  }

  function renderCourses() {
    var el = $('#attendance-courses');
    if (!el) return;

    var minRequired = 75;

    el.innerHTML = '<div class="table-wrapper" style="border:none;border-radius:0;">' +
      '<table class="table"><thead><tr><th>Course</th><th>Present</th><th>Total</th><th>Percentage</th><th>Status</th></tr></thead><tbody>' +
      M.attendance.map(function (a) {
        var p = Math.round(a.present / a.total * 100);
        var ok = p >= minRequired;
        return '<tr>' +
          '<td><div class="avatar-cell">' + UI.avatar(F.initials(a.course).slice(0, 2) || 'CS', 'sm') + '<span style="font-weight:500;">' + F.esc(a.course.split(' ')[0] + ' ' + a.course.split(' ')[1]) + '</span></div></td>' +
          '<td style="font-weight:600;">' + a.present + '</td>' +
          '<td class="text-tertiary">' + a.total + '</td>' +
          '<td><div style="display:flex;align-items:center;gap:10px;min-width:150px;">' + UI.progress(p, ok ? 'success' : 'danger') + '<span style="font-size:12px;font-weight:600;white-space:nowrap;">' + p + '%</span></div></td>' +
          '<td>' + UI.badge(ok ? 'Above threshold' : 'Below threshold', ok ? 'success' : 'danger') + '</td>' +
        '</tr>';
      }).join('') +
      '</tbody></table></div>' +
      '<p style="font-size:12px;color:var(--color-text-muted);margin-top:12px;">Minimum required attendance: ' + minRequired + '%</p>';
  }

  function renderHistory() {
    var el = $('#attendance-history');
    var rows = M.attendanceHistory.slice().sort(function (a, b) { return new Date(b.date) - new Date(a.date); }).slice(0, 8);

    el.innerHTML = rows.map(function (r) {
      var present = r.status === 'present';
      return '<div class="activity-item">' +
        '<div class="activity-icon ' + (present ? 'success' : 'danger') + '">' + I.icon(present ? 'check' : 'x') + '</div>' +
        '<div class="activity-content"><div class="activity-title" style="font-size:13px;">' + F.esc(r.course) + ' &middot; ' + r.week + '</div>' +
        '<div class="activity-meta">' + D.format(r.date) + '</div></div>' +
        UI.badge(present ? 'Present' : 'Absent', present ? 'success' : 'danger') +
      '</div>';
    }).join('');
  }

  function init() {
    renderSummary();
    renderCourses();
    renderHistory();
  }

  LH.app.register('student-attendance', init);
  LH.app.init('student-attendance');
})(window.LH);