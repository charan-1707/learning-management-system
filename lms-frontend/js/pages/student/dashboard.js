(function (LH) {
  'use strict';

  var $ = LH.dom.$, F = LH.format, D = LH.date, UI = LH.ui, I = LH.icons, DB = LH.db;
  var M = LH.mock, API = LH.api;

  function uid() {
    var u = LH.shell.getUser();
    return u ? u.id : 201;
  }

  function greeting() {
    var h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  function renderWelcome() {
    var user = LH.shell.getUser();
    var el = $('#welcome-banner');
    if (!el) return;
    var name = user ? user.name.split(' ')[0] : 'there';

    el.innerHTML =
      '<div class="card" style="background:var(--color-bg-secondary);border:1px solid var(--color-border-light);margin-bottom:var(--spacing-6);">' +
        '<div class="card-body" style="display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;">' +
          '<div>' +
            '<h1 style="font-size:24px;font-weight:700;letter-spacing:-0.02em;color:var(--color-text-primary);margin-bottom:6px;">' + greeting() + ', ' + F.esc(name) + '</h1>' +
            '<p style="color:var(--color-text-tertiary);font-size:14px;">Here&rsquo;s what&rsquo;s happening with your learning today.</p>' +
          '</div>' +
          '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
            '<a class="btn btn-primary" href="courses.html">' + I.icon('courses', 16) + ' Browse courses</a>' +
            '<a class="btn btn-secondary" href="assignments.html">' + I.icon('assignments', 16) + ' View assignments</a>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function myEnrollments() {
    return DB.enrollments.forStudent(uid()).filter(function (r) { return r.course && r.enrollment.status !== 'dropped'; });
  }

  function livePercent(row) {
    return DB.progressFor(uid(), row.course.id).percent;
  }

  function renderStats() {
    var el = $('#stat-grid');
    if (!el) return;

    var rows = myEnrollments();
    var liveProgs = rows.map(livePercent);
    var completed = liveProgs.filter(function (p) { return p >= 100; }).length;
    var avg = liveProgs.length ? Math.round(liveProgs.reduce(function (s, p) { return s + p; }, 0) / liveProgs.length) : 0;

    var attendance = API.attendance ? API.attendance.overall() : { percent: 0 };
    var stats = [
      { icon: 'courses', tone: 'primary', value: rows.length, label: 'Enrolled courses', sub: 'This semester' },
      { icon: 'award', tone: 'success', value: completed, label: 'Courses completed', sub: 'Overall', trend: 2, trendLabel: 'last semester' },
      { icon: 'target', tone: 'info', value: avg + '%', label: 'Overall progress', sub: 'Across all courses' },
      { icon: 'attendance', tone: 'warning', value: attendance.percent + '%', label: 'Attendance', sub: 'Average this term', trend: 3, trendLabel: 'vs last month' }
    ];

    el.innerHTML = stats.map(function (s) {
      return UI.statCard({ icon: s.icon, tone: s.tone, value: s.value, label: s.label, sub: s.sub });
    }).join('');
    el.querySelectorAll('.stat-card-label').forEach(function (l, i) {
      l.textContent = stats[i].label;
    });
  }

  function renderContinue() {
    var el = $('#continue-grid');
    if (!el) return;

    var inProgress = myEnrollments()
      .map(function (row) {
        var live = DB.progressFor(uid(), row.course.id);
        return Object.assign({}, row.course, {
          progress: live.percent,
          modulesDone: live.completed,
          modulesTotal: live.total,
          updated: D.relative(row.course.updated || row.course.createdAt || new Date())
        });
      })
      .filter(function (c) { return c.progress < 100; })
      .sort(function (a, b) { return b.progress - a.progress; })
      .slice(0, 3);

    el.innerHTML = inProgress.map(function (c) { return UI.courseCard(c, 'student'); }).join('');
  }

  function renderUpcoming() {
    var el = $('#upcoming-list');
    if (!el) return;

    var courseIds = {};
    myEnrollments().forEach(function (r) { courseIds[r.course.id] = true; });

    var items = [];

    DB.list('assignments').forEach(function (a) {
      if (!courseIds[a.courseId]) return;
      if (DB.submissions.forStudent(uid(), a.id).length) return;
      if (D.isOverdue(a.due)) return;
      items.push({
        kind: 'assignment', course: a.course, title: a.title, href: 'assignment-detail.html?id=' + a.id,
        due: a.due, status: D.dueLabel(a.due)
      });
    });
    DB.list('quizzes').forEach(function (q) {
      if (!q.courseId || !courseIds[q.courseId]) return;
      if (q.taken) return;
      if (q.due < new Date()) return;
      items.push({ kind: 'quiz', course: q.course, title: q.title, href: 'quiz-attempt.html?id=' + q.id, due: q.due, status: D.dueLabel(q.due) });
    });

    items.sort(function (a, b) { return new Date(a.due) - new Date(b.due); });
    items = items.slice(0, 5);

    if (!items.length) {
      el.innerHTML = UI.emptyState('check', 'All caught up', 'No deadlines due in the coming days.');
      return;
    }

    el.innerHTML = items.map(function (it) {
      var icon = it.kind === 'quiz' ? 'quizzes' : 'assignments';
      var tone = it.kind === 'quiz' ? 'warning' : 'primary';
      return '<a class="activity-item" href="' + it.href + '" style="text-decoration:none;color:inherit;">' +
        '<div class="activity-icon ' + tone + '">' + I.icon(icon) + '</div>' +
        '<div class="activity-content">' +
          '<div class="activity-title" style="font-size:13px;">' + F.esc(it.title) + '</div>' +
          '<div class="activity-meta">' + F.esc(it.course) + ' &middot; <span class="text-warning">' + F.esc(it.status) + '</span></div>' +
        '</div>' +
        '<span style="font-size:12px;color:var(--color-text-muted);white-space:nowrap;">' + D.format(it.due) + '</span>' +
      '</a>';
    }).join('');
  }

  function renderRecentGrades() {
    var el = $('#recent-grades');
    if (!el) return;

    var rows = DB.list('submissions').filter(function (s) {
      return s.studentId === uid() && (s.gradedAt || s.status === 'graded');
    }).map(function (s) {
      var a = DB.get('assignments', s.assignmentId);
      return {
        assessment: a ? a.title : 'Assignment',
        course: a ? (a.course || '') : '',
        score: s.score, max: s.maxMarks, date: s.gradedAt
      };
    }).sort(function (x, y) { return new Date(y.date) - new Date(x.date); });

    if (!rows.length) {
      var summary = API.grades.summary();
      rows = summary.recent.slice(0, 4);
    }

    rows = rows.slice(0, 4);
    if (!rows.length) {
      el.innerHTML = UI.emptyState('grades', 'No grades yet', 'Grades will appear after your first assessment.');
      return;
    }

    el.innerHTML = rows.map(function (g) {
      var pct = Math.round(g.score / g.max * 100);
      return '<div class="activity-item">' +
        '<div class="activity-icon ' + F.gradeColor(pct) + '">' + I.icon('grades') + '</div>' +
        '<div class="activity-content"><div class="activity-title" style="font-size:13px;">' + F.esc(g.assessment) + '</div>' +
          '<div class="activity-meta">' + F.esc(g.course) + ' &middot; ' + D.format(g.date) + '</div></div>' +
        '<div style="text-align:right;"><div style="font-weight:600;font-size:13px;color:var(--color-text-primary);">' + g.score + '/' + g.max + '</div>' +
        '<div class="activity-meta">' + UI.badge(F.gradeLetter(pct), F.gradeColor(pct)) + '</div></div>' +
      '</div>';
    }).join('');
  }

  function renderActivity() {
    var el = $('#activity-list');
    if (!el) return;

    var activity = [
      { icon: 'assignments', tone: 'primary', text: 'You started \u201C' + UI.esc(M.assignments[0].title) + '\u201D in ' + M.assignments[0].course + '.', meta: M.assignments[0].course, time: D.relativeDays(-0.3) },
      { icon: 'quizzes', tone: 'warning', text: 'Attempted a quiz in ' + (M.quizzes[0] ? M.quizzes[0].course : 'your course') + '.', meta: M.quizzes[0] ? M.quizzes[0].course : '', time: D.relativeDays(-0.6) },
      { icon: 'grades', tone: 'success', text: 'Received a grade for \u201C' + (M.grades[2] ? M.grades[2].assessment : 'an assessment') + '\u201D.', meta: M.grades[2] ? M.grades[2].course : '', time: D.relativeDays(-2) },
      { icon: 'courses', tone: 'info', text: 'You continued learning in one of your courses.', meta: 'LearnHub', time: D.relativeDays(-3) },
      { icon: 'profile', tone: 'neutral', text: 'Your learning streak is growing. Keep it up!', meta: 'LearnHub', time: D.relativeDays(-5) }
    ];

    el.innerHTML = activity.map(function (a) {
      return '<div class="activity-item">' +
        '<div class="activity-icon ' + a.tone + '">' + I.icon(a.icon) + '</div>' +
        '<div class="activity-content"><div class="activity-title">' + a.text + '</div>' +
        '<div class="activity-meta">' + F.esc(a.meta) + ' &middot; ' + D.relative(a.time) + '</div></div>' +
      '</div>';
    }).join('');
  }

  function renderMiniNotifications() {
    var el = $('#mini-notifications');
    if (!el) return;
    var list = M.notifications.filter(function (n) { return !n.read; }).sort(function (a, b) { return new Date(b.time) - new Date(a.time); }).slice(0, 4);
    if (!list.length) {
      el.innerHTML = UI.emptyState('bell', 'You\u2019re all caught up', 'No unread notifications right now.');
      return;
    }
    el.innerHTML = list.map(function (n) {
      return '<div class="notification-item" style="margin-bottom:10px;">' +
        '<div class="notification-icon ' + n.type + '">' + I.icon(n.type === 'grade' ? 'grades' : n.type === 'course' ? 'courses' : n.type === 'system' ? 'info' : n.type === 'quiz' ? 'quizzes' : 'assignments') + '</div>' +
        '<div class="notification-content"><div class="notification-header"><span class="notification-title" style="font-size:13px;">' + F.esc(n.title) + '</span><span class="notification-time">' + D.relative(n.time) + '</span></div>' +
        '<div class="notification-message" style="font-size:12px;">' + F.esc(n.message) + '</div></div>' +
      '</div>';
    }).join('');
  }

  function renderAttendanceMini() {
    var el = $('#attendance-mini');
    if (!el) return;
    var list = API.attendance ? API.attendance.list() : [];
    if (!list.length) {
      el.innerHTML = UI.emptyState('attendance', 'No attendance yet', 'Attendance will appear once classes begin.');
      return;
    }
    el.innerHTML = list.map(function (a) {
      var pct = Math.round(a.present / a.total * 100);
      return '<div style="margin-bottom:16px;">' +
        '<div class="flex items-center justify-between" style="margin-bottom:6px;">' +
          '<span style="font-size:13px;font-weight:500;color:var(--color-text-primary);">' + F.esc(a.course) + '</span>' +
          '<span style="font-size:12px;font-weight:600;color:' + (pct >= 85 ? 'var(--color-success)' : pct >= 75 ? 'var(--color-warning)' : 'var(--color-danger)') + ';">' + pct + '%</span>' +
        '</div>' + UI.progress(pct) +
      '</div>';
    }).join('');
  }

  function init() {
    renderWelcome();
    renderStats();
    renderContinue();
    renderUpcoming();
    renderRecentGrades();
    renderActivity();
    renderMiniNotifications();
    renderAttendanceMini();
  }

  LH.app.register('student-dashboard', init);
  LH.app.init('student-dashboard');
})(window.LH);