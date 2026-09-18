(function (LH) {
  'use strict';

  var $ = LH.dom.$, F = LH.format, D = LH.date, UI = LH.ui, I = LH.icons;
  var API = LH.api;

  function renderWelcome() {
    var el = $('#admin-welcome');
    if (!el) return;
    var user = LH.shell.getUser();
    var h = new Date().getHours();
    var g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';

    el.innerHTML =
      '<div class="card" style="margin-bottom:var(--spacing-6);">' +
        '<div class="card-body" style="display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;">' +
          '<div>' +
            '<h1 style="font-size:24px;font-weight:700;letter-spacing:-0.02em;color:var(--color-text-primary);margin-bottom:6px;">' + g + ', ' + F.esc(user.name.split(' ')[0]) + '</h1>' +
            '<p style="color:var(--color-text-tertiary);font-size:14px;">Here&rsquo;s the platform status overview.</p>' +
          '</div>' +
          '<button class="btn btn-primary" id="quick-export">' + I.icon('download', 16) + ' Export report</button>' +
        '</div>' +
      '</div>';
  }

  function iconForType(t) {
    return { student: 'users', faculty: 'courses', assignment: 'assignments', grade: 'grades', system: 'info' }[t] || 'box';
  }

  function toneForType(t) {
    return { student: 'primary', faculty: 'info', assignment: 'warning', grade: 'success', system: 'neutral' }[t] || 'neutral';
  }

  function renderStats() {
    var el = $('#admin-stats');
    if (!el) return;
    var s = API.admin.statistics();
    var stats = [
      { icon: 'users', tone: 'primary', value: F.n(s.totalStudents), label: 'Total students', sub: '' },
      { icon: 'courses', tone: 'info', value: F.n(s.totalFaculty), label: 'Faculty', sub: '' },
      { icon: 'box', tone: 'success', value: F.n(s.totalCourses), label: 'Total courses', sub: s.publishedCourses + ' published' },
      { icon: 'attendance', tone: 'warning', value: F.n(s.enrollments), label: 'Enrollments', sub: s.submissions + ' submissions' }
    ];
    el.innerHTML = stats.map(function (st) { return UI.statCard(st); }).join('');
  }

  function renderActivity() {
    var el = $('#system-activity');
    if (!el) return;
    var activities = API.admin.systemActivity();
    if (!activities || !activities.length) {
      el.innerHTML = UI.emptyState('info', 'No recent activity', 'System events will appear here.');
      return;
    }
    el.innerHTML = activities.map(function (a) {
      return '<div class="activity-item">' +
        '<div class="activity-icon ' + toneForType(a.type) + '">' + I.icon(iconForType(a.icon || a.type)) + '</div>' +
        '<div class="activity-content"><div class="activity-title" style="font-size:13px;">' + F.esc(a.text) + '</div>' +
        '<div class="activity-meta">' + F.esc(a.detail || '') + (a.time ? ' &middot; ' + D.relative(a.time) : '') + '</div></div>' +
      '</div>';
    }).join('');
  }

  function renderChart() {
    var el = $('#active-chart');
    if (!el) return;
    var reports = API.admin.reports();
    var data = reports && reports.monthlyActive ? reports.monthlyActive : [];
    if (!data.length) {
      el.innerHTML = UI.emptyState('chart', 'No data', 'Monthly active user data will appear here.');
      return;
    }
    var max = Math.max.apply(null, data.map(function (d) { return d.active; }));

    el.innerHTML =
      '<div style="display:flex;align-items:flex-end;justify-content:space-between;gap:12px;height:150px;">' +
      data.map(function (d) {
        var h = Math.round(d.active / max * 100);
        var last = data[data.length - 1] === d;
        return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:8px;">' +
          '<div style="font-size:11px;color:var(--color-text-tertiary);">' + F.n(d.active) + '</div>' +
          '<div style="width:100%;height:' + h + '%;min-height:8px;border-radius:6px 6px 2px 2px;background:' + (last ? 'var(--color-primary)' : 'var(--color-bg-tertiary)') + ';border:1px solid ' + (last ? 'var(--color-primary)' : 'var(--color-border-light)') + ';"></div>' +
          '<div style="font-size:11px;color:' + (last ? 'var(--color-primary)' : 'var(--color-text-muted)') + ';font-weight:' + (last ? '600' : '400') + ';">' + d.month + '</div>' +
        '</div>';
      }).join('') +
      '</div>';
  }

  function renderUsers() {
    var el = $('#user-table-body');
    if (!el) return;

    var list = API.admin.users({});
    var rows = list.slice(0, 6);
    if (!rows.length) {
      el.innerHTML = '<tr><td colspan="4">' + UI.emptyState('users', 'No users', 'No user accounts found.') + '</td></tr>';
      return;
    }

    el.innerHTML = rows.map(function (u) {
      var roleColor = u.role === 'admin' ? 'warning' : u.role === 'faculty' ? 'info' : 'primary';
      return '<tr>' +
        '<td><div class="avatar-cell">' + UI.avatar(u.name, 'sm') + '<div><div style="font-weight:600;color:var(--color-text-primary);font-size:13.5px;">' + F.esc(u.name) + '</div>' +
          '<div style="font-size:12px;color:var(--color-text-muted);">' + F.esc(u.email) + '</div></div></div></td>' +
        '<td>' + UI.badge(u.role, roleColor) + '</td>' +
        '<td>' + UI.statusBadge(u.status) + '</td>' +
        '<td><span class="text-sm">' + D.relative(u.lastActive) + '</span></td>' +
      '</tr>';
    }).join('');
  }

  function init() {
    renderWelcome();
    renderStats();
    renderActivity();
    renderChart();
    renderUsers();

    var exportBtn = $('#quick-export');
    if (exportBtn) exportBtn.addEventListener('click', function () {
      LH.toast.success('Report ready', 'The CSV export has been generated to your downloads.');
    });
  }

  LH.app.register('admin-dashboard', init);
  LH.app.init('admin-dashboard');
})(window.LH);
