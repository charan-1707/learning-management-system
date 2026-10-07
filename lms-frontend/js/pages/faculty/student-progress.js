(function (LH) {
  'use strict';

  var $ = LH.dom.$, F = LH.format, UI = LH.ui;

  var courses = [];
  var rows = [];
  var sortKey = 'progressPct';
  var sortDir = -1;

  function uid() {
    var u = LH.shell.getUser();
    return u ? u.id : 101;
  }

  function num(v) {
    return v == null ? null : Number(v);
  }

  function sortRows() {
    var key = sortKey, dir = sortDir;
    rows.sort(function (a, b) {
      var x = a[key], y = b[key];
      if (key === 'name') {
        x = (x || '').toLowerCase();
        y = (y || '').toLowerCase();
        return x < y ? -dir : x > y ? dir : 0;
      }
      x = num(x);
      y = num(y);
      if (x == null && y == null) return 0;
      if (x == null) return 1;
      if (y == null) return -1;
      return (x - y) * dir;
    });
  }

  function riskOf(r) {
    if (r.atRisk) return UI.badge('Needs attention', 'danger');
    var p = num(r.progressPct) || 0;
    return p < 75 ? UI.badge('On track', 'info') : UI.badge('Excellent', 'success');
  }

  function pctCell(v) {
    if (v == null) return '<span class="text-tertiary">—</span>';
    var color = v >= 80 ? 'var(--color-success)' : v >= 60 ? 'var(--color-primary)' : 'var(--color-danger)';
    return '<span style="font-weight:600;color:' + color + ';">' + Math.round(v) + '%</span>';
  }

  function renderSummary() {
    var el = $('#sp-summary');
    if (!el) return;
    if (!rows.length) { el.innerHTML = ''; return; }
    function avg(f) {
      var vs = rows.map(f).filter(function (v) { return v != null; });
      return vs.length ? vs.reduce(function (s, v) { return s + v; }, 0) / vs.length : null;
    }
    var p = avg(function (r) { return num(r.progressPct); });
    var s = avg(function (r) { return num(r.avgScore); });
    var a = avg(function (r) { return num(r.attendancePct); });
    var risk = rows.filter(function (r) { return r.atRisk; }).length;
    function stat(value, label) {
      return '<div><div style="font-size:20px;font-weight:700;color:var(--color-text-primary);">' + value + '</div>' +
        '<div class="text-xs text-tertiary">' + label + '</div></div>';
    }
    el.innerHTML =
      stat(rows.length, 'Students') +
      stat(p == null ? '—' : Math.round(p) + '%', 'Avg progress') +
      stat(s == null ? '—' : Math.round(s) + '%', 'Avg score') +
      stat(a == null ? '—' : Math.round(a) + '%', 'Avg attendance') +
      stat(risk ? '<span style="color:var(--color-danger);">' + risk + '</span>' : '0', 'At risk');
  }

  function render() {
    var el = $('#perf-list');
    if (!el) return;
    if (!rows.length) {
      el.innerHTML = UI.emptyState('users', 'No students yet', 'Students will appear here once they enroll.');
      return;
    }
    sortRows();
    function th(label, key) {
      var arrow = sortKey === key ? (sortDir === 1 ? ' ▲' : ' ▼') : '';
      return '<th><button class="btn btn-sm btn-ghost" data-sort="' + key + '" style="font-weight:600;">' + label + arrow + '</button></th>';
    }
    el.innerHTML =
      '<div class="table-wrapper" style="border:none;border-radius:0;"><table class="table">' +
      '<thead><tr>' + th('Student', 'name') + th('Progress', 'progressPct') + th('Avg score', 'avgScore') +
        th('Attendance', 'attendancePct') + th('Status', 'atRisk') + '</tr></thead><tbody>' +
      rows.map(function (r) {
        var p = num(r.progressPct) || 0;
        return '<tr>' +
          '<td><div class="avatar-cell">' + UI.avatar(r.name, 'sm') + F.esc(r.name) + '</div></td>' +
          '<td><div style="display:flex;align-items:center;gap:10px;min-width:150px;">' + UI.progress(p) +
            '<span style="font-size:12px;font-weight:600;white-space:nowrap;">' + Math.round(p) + '%</span></div></td>' +
          '<td>' + pctCell(num(r.avgScore)) + '</td>' +
          '<td>' + pctCell(num(r.attendancePct)) + '</td>' +
          '<td>' + riskOf(r) + '</td>' +
        '</tr>';
      }).join('') + '</tbody></table></div>';

    el.querySelectorAll('[data-sort]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-sort');
        if (sortKey === key) sortDir = -sortDir;
        else { sortKey = key; sortDir = (key === 'name' ? 1 : -1); }
        render();
      });
    });
  }

  async function load(courseId) {
    rows = await LH.api.courses.studentProgress(courseId).catch(function () { return []; });
    renderSummary();
    render();
  }

  async function init() {
    var list = await LH.api.courses.byInstructorId(uid()).catch(function () { return []; });
    if (!list.length) list = await LH.api.courses.byInstructor('Dr. Priya Sharma').catch(function () { return []; });
    courses = list;
    var sel = $('#sp-course');
    sel.innerHTML = courses
      .map(function (c) { return '<option value="' + c.id + '">' + F.esc(c.code + ' — ' + (c.short || c.name)) + '</option>'; }).join('');
    if (!courses.length) {
      $('#perf-list').innerHTML = UI.emptyState('courses', 'No courses yet', 'Create a course to track student progress.');
      return;
    }
    var initial = LH.app.param('id');
    if (initial && courses.some(function (c) { return c.id === initial; })) sel.value = initial;
    sel.addEventListener('change', function () { load(sel.value); });
    await load(sel.value);
  }

  LH.app.register('faculty-progress', init);
  LH.app.init('faculty-progress');
})(window.LH);
