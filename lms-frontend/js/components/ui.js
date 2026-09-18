window.LH = window.LH || {};

(function (LH) {
  'use strict';

  var F = LH.format;
  var UI = LH.ui = {};

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  UI.esc = esc;

  /* ------------------------------ Badges ------------------------------ */

  var badgeMap = {
    'primary': 'badge-primary', 'success': 'badge-success', 'warning': 'badge-warning',
    'danger': 'badge-danger', 'info': 'badge-info', 'neutral': 'badge-neutral'
  };

  UI.badge = function (label, tone) {
    return '<span class="badge ' + (badgeMap[tone] || 'badge-neutral') + '">' + esc(label) + '</span>';
  };

  UI.statusBadge = function (status) {
    var map = {
      'not-started': ['Not Started', 'neutral'],
      'in-progress': ['In Progress', 'info'],
      'submitted': ['Submitted', 'warning'],
      'reviewing': ['Reviewing', 'warning'],
      'pending': ['Pending', 'warning'],
      'graded': ['Graded', 'success'],
      'overdue': ['Overdue', 'danger'],
      'available': ['Available', 'success'],
      'completed': ['Completed', 'success'],
      'active': ['Active', 'success'],
      'warning': ['Attention', 'warning'],
      'suspended': ['Suspended', 'danger'],
      'on-leave': ['On leave', 'warning'],
      true: ['Yes', 'success'],
      false: ['No', 'neutral']
    };
    var entry = map[status] || [String(status).replace(/-/g, ' '), 'neutral'];
    return UI.badge(entry[0], entry[1]);
  };

  /* ------------------------------ Progress ------------------------------ */

  UI.progress = function (percent, tone) {
    var clamped = Math.max(0, Math.min(100, percent));
    var auto = clamped >= 80 ? 'success' : clamped >= 40 ? (clamped >= 60 ? 'success' : 'warning') : 'danger';
    tone = tone || auto;
    return '<div class="progress-bar" role="progressbar" aria-valuenow="' + clamped + '" aria-valuemin="0" aria-valuemax="100">' +
      '<div class="progress-bar-fill ' + tone + '" style="width:' + clamped + '%"></div></div>';
  };

  /* ------------------------------ Avatar ------------------------------ */

  UI.avatar = function (name, size) {
    var cls = size === 'sm' ? 'avatar avatar-sm' : size === 'lg' ? 'avatar avatar-lg' : 'avatar';
    return '<span class="' + cls + '" aria-hidden="true">' + esc(F.initials(name)) + '</span>';
  };

  /* ------------------------------ Stat card ------------------------------ */

  UI.statCard = function (opts) {
    opts = opts || {};
    var trend = opts.trend != null;
    var trendClass = opts.trend > 0 ? 'positive' : opts.trend < 0 ? 'negative' : '';
    var trendArrow = opts.trend > 0 ? '▲' : opts.trend < 0 ? '▼' : '●';
    return '<div class="stat-card">' +
      '<div class="stat-card-header"><div class="stat-card-icon ' + (opts.tone || 'primary') + '">' +
        LH.icons.icon(opts.icon || 'box') + '</div>' + (opts.badge ? UI.badge(opts.badge, opts.badgeTone || 'success') : '') + '</div>' +
      '<div class="stat-card-value">' + esc(opts.value) + '</div>' +
      '<div class="stat-card-label">' + esc(opts.label) + '</div>' +
      (trend ? '<div class="stat-card-trend ' + trendClass + '"><span>' + trendArrow + '</span><span>' + esc(opts.trendLabel || Math.abs(opts.trend) + '%') + '</span></div>' : '') +
    '</div>';
  };

  /* ------------------------------ Course card ------------------------------ */

  var accents = {
    blue: 'rgba(37, 99, 235, 0.12)',
    green: 'rgba(5, 150, 105, 0.12)',
    purple: 'rgba(124, 58, 237, 0.12)',
    orange: 'rgba(217, 119, 6, 0.12)',
    teal: 'rgba(13, 148, 136, 0.12)',
    red: 'rgba(220, 38, 38, 0.12)'
  };

  UI.courseCard = function (course, context) {
    context = context || 'student';
    var pct = course.progress != null ? course.progress : 0;
    var accent = accents[course.accent] || accents.blue;

    var footer;
    if (context === 'faculty') {
      footer =
        '<div class="course-card-footer"><div class="course-card-meta">' +
          '<span class="course-card-meta-item">' + LH.icons.icon('users', 14) + '<span>' + course.students + ' students</span></span>' +
          '<span class="course-card-meta-item">' + LH.icons.icon('box', 14) + '<span>' + course.modules + ' modules</span></span>' +
        '</div><a class="btn btn-sm btn-ghost" href="course-details.html?id=' + course.id + '">Manage</a></div>';
    } else {
      footer =
        '<div class="course-card-footer"><div class="course-card-meta">' +
          '<span class="course-card-meta-item">' + LH.icons.icon('box', 14) + '<span>' + course.modulesDone + '/' + course.modulesTotal + ' modules</span></span>' +
          '<span class="course-card-meta-item">' + LH.icons.icon('clock', 14) + '<span>Updated ' + esc(course.updated) + '</span></span>' +
        '</div><a class="btn btn-sm btn-ghost" href="course-details.html?id=' + course.id + '">Continue</a></div>';
    }

    return '<article class="course-card">' +
      '<div class="course-card-image" style="background:' + accent + ';display:flex;align-items:center;justify-content:center;position:relative;">' +
        '<span style="font-size:13px;font-weight:700;color:var(--color-text-secondary);letter-spacing:.06em;">' + esc(course.code) + '</span>' +
        '<span class="course-card-code" style="position:absolute;top:12px;right:12px;">' + esc(course.semester || '') + '</span>' +
      '</div>' +
      '<div class="course-card-content">' +
        '<div class="course-card-header"><h3 class="course-card-title">' + esc(course.name) + '</h3>' +
        (course.gradePct != null ? UI.badge(esc(course.gradePct), F.gradeColor(course.gradePct)) : '') + '</div>' +
        '<div class="course-card-instructor">' + UI.avatar(course.instructor, 'sm') + '<span>' + esc(course.instructor) + '</span></div>' +
        '<div class="course-card-progress">' +
          '<div class="course-card-progress-header"><span class="course-card-progress-label">Course progress</span><span class="course-card-progress-value">' + pct + '%</span></div>' +
          UI.progress(pct) +
        '</div>' +
        footer +
      '</div>' +
    '</article>';
  };

  /* ------------------------------ Empty state ------------------------------ */

  UI.emptyState = function (icon, title, message) {
    return '<div class="empty-state"><div class="empty-state-icon">' + LH.icons.icon(icon || 'box', 48) + '</div>' +
      '<h3 class="empty-state-title">' + esc(title) + '</h3>' +
      '<p class="empty-state-message">' + esc(message || '') + '</p></div>';
  };

  /* ------------------------------ Page header ------------------------------ */

  UI.pageHeader = function (opts) {
    var actions = Array.isArray(opts.actions)
      ? '<div class="page-actions">' + opts.actions.join('') + '</div>'
      : (opts.actions || '');
    return '<div class="page-header"><div class="page-title-section"><h1>' + esc(opts.title) + '</h1>' +
      (opts.subtitle ? '<p>' + esc(opts.subtitle) + '</p>' : '') + '</div>' + actions + '</div>';
  };

  UI.sectionHeader = function (title, subtitle, action) {
    return '<div class="flex items-center justify-between mb-4" style="flex-wrap:wrap;gap:12px;">' +
      '<div><h2 style="font-size:16px;font-weight:600;color:var(--color-text-primary);">' + esc(title) + '</h2>' +
      (subtitle ? '<p style="font-size:13px;color:var(--color-text-tertiary);margin-top:2px;">' + esc(subtitle) + '</p>' : '') + '</div>' +
      (action ? action : '') + '</div>';
  };

  /* ------------------------------ Table helpers ------------------------------ */

  UI.materialIcon = function (type) {
    return '<div class="material-icon ' + type + '">' + LH.icons.fileIcon(type) + '</div>';
  };

})(window.LH);