(function (LH) {
  'use strict';

  var $ = LH.dom.$, F = LH.format, UI = LH.ui;
  var API = LH.api;

  function pctCell(pct) {
    if (pct == null) return '<span class="text-tertiary">—</span>';
    var p = Math.round(pct);
    var tone = p >= 85 ? 'var(--color-success)' : p >= 75 ? 'var(--color-warning)' : 'var(--color-danger)';
    return '<div style="display:flex;align-items:center;gap:10px;max-width:160px;">' + UI.progress(p) +
      '<span style="font-size:12px;font-weight:600;color:' + tone + ';white-space:nowrap;">' + p + '%</span></div>';
  }

  async function init() {
    var id = LH.app.param('id');
    var titleEl = $('#roster-title');
    var subEl = $('#roster-subtitle');
    var bodyEl = $('#roster-body');

    var course = id ? await LH.api.courses.get(id).catch(function () { return null; }) : null;
    if (!course) {
      if (titleEl) titleEl.textContent = 'Course not found';
      if (bodyEl) bodyEl.innerHTML = '<div style="padding:24px;">' +
        UI.emptyState('courses', 'Course not found', 'This course does not exist.') + '</div>';
      return;
    }

    if (titleEl) titleEl.textContent = course.name;
    var rows = (await LH.api.courses.roster(course.id).catch(function () { return []; }))
      .slice().sort(function (a, b) {
        return String(a.name || '').localeCompare(String(b.name || ''));
      });
    if (subEl) subEl.textContent = rows.length + ' enrolled student' + (rows.length === 1 ? '' : 's') +
      ' · ' + F.esc(course.code || '');

    if (!bodyEl) return;
    if (!rows.length) {
      bodyEl.innerHTML = '<div style="padding:24px;">' +
        UI.emptyState('users', 'No enrollments', 'No students are enrolled in this course yet.') + '</div>';
      return;
    }

    bodyEl.innerHTML = '<div class="table-wrapper" style="border:none;border-radius:0;">' +
      '<table class="table"><thead><tr><th>Student</th><th>Email</th><th>Progress</th><th>Attendance</th><th>Status</th></tr></thead><tbody>' +
      rows.map(function (r) {
        var status = r.status || 'active';
        return '<tr>' +
          '<td><div class="avatar-cell">' + UI.avatar(r.name, 'sm') +
            '<span style="font-weight:500;">' + F.esc(r.name || 'Student') + '</span></div></td>' +
          '<td class="text-tertiary">' + F.esc(r.email || '—') + '</td>' +
          '<td>' + pctCell(r.progressPercent) + '</td>' +
          '<td>' + pctCell(r.attendancePct) + '</td>' +
          '<td>' + UI.statusBadge(status) + '</td>' +
        '</tr>';
      }).join('') + '</tbody></table></div>';
  }

  LH.app.register('admin-roster', init);
  LH.app.init('admin-roster');
})(window.LH);
