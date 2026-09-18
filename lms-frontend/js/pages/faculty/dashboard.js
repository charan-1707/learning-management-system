(function (LH) {
  'use strict';

  var $ = LH.dom.$, F = LH.format, D = LH.date, UI = LH.ui, I = LH.icons;
  var M = LH.mock;

  function renderWelcome() {
    var el = $('#welcome-banner');
    if (!el) return;
    var user = LH.shell.getUser();
    var h = new Date().getHours();
    var g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';

    el.innerHTML =
      '<div class="card" style="margin-bottom:var(--spacing-6);">' +
        '<div class="card-body" style="display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;">' +
          '<div>' +
            '<h1 style="font-size:24px;font-weight:700;letter-spacing:-0.02em;color:var(--color-text-primary);margin-bottom:6px;">' + g + ', ' + F.esc(user.name.replace('Dr. ', '').split(' ')[0]) + '</h1>' +
            '<p style="color:var(--color-text-tertiary);font-size:14px;">Here&rsquo;s what needs your attention across your courses today.</p>' +
          '</div>' +
          '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
            '<a class="btn btn-primary" href="submissions.html">' + I.icon('upload', 16) + ' Grade submissions</a>' +
            '<a class="btn btn-secondary" href="course-editor.html">' + I.icon('plus', 16) + ' New course</a>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function ownedCourses() {
    var user = LH.shell.getUser();
    var id = user ? user.id : 101;
    var list = LH.api.courses.byInstructorId(id);
    if (!list || !list.length) list = LH.api.courses.byInstructor('Dr. Priya Sharma');
    return list;
  }

  function renderStats() {
    var el = $('#stat-grid');
    if (!el) return;
    var courses = ownedCourses();
    var ids = courses.map(function (c) { return c.id; });
    var students = courses.reduce(function (s, c) { return s + (c.students || 0); }, 0);
    var pending = 0;
    var upcoming = 0;
    M.submissions.forEach(function (s) {
      if (ids.indexOf(s.courseId) !== -1 && (!s.gradedAt || s.status !== 'graded')) pending++;
    });
    M.assignments.forEach(function (a) {
      if (ids.indexOf(a.courseId) !== -1 && !a.graded && !D.isOverdue(a.due)) upcoming++;
    });
    M.quizzes.forEach(function (q) {
      if (ids.indexOf(q.courseId) !== -1 && !q.taken && !D.isOverdue(q.due)) upcoming++;
    });

    var stats = [
      { icon: 'courses', tone: 'primary', value: courses.length, label: 'Courses taught', sub: 'This semester' },
      { icon: 'users', tone: 'info', value: students, label: 'Total students', sub: 'Across your courses' },
      { icon: 'upload', tone: 'warning', value: pending, label: 'Pending submissions', sub: 'Awaiting grading' },
      { icon: 'calendar', tone: 'success', value: upcoming, label: 'Upcoming assessments', sub: 'Assignments & quizzes' }
    ];

    el.innerHTML = stats.map(function (s) { return UI.statCard(s); }).join('');
  }

  function renderCourses() {
    var el = $('#course-grid');
    if (!el) return;
    var list = ownedCourses().map(function (c) {
      var total = LH.api.lessons.countForCourse(c.id);
      var copy = Object.assign({}, c);
      copy.modules = total || (M.facultyCourses.filter(function (fc) { return fc.id === c.id; })[0] || { modules: 0 }).modules || 0;
      return copy;
    });
    el.innerHTML = list.map(function (c) { return UI.courseCard(c, 'faculty'); }).join('');
  }

  function renderPending() {
    var el = $('#pending-list');
    if (!el) return;

    var ids = ownedCourses().map(function (c) { return c.id; });
    var pending = M.submissions.filter(function (s) {
      return ids.indexOf(s.courseId) !== -1 && (!s.gradedAt || s.status !== 'graded');
    }).slice(0, 6);

    if (!pending.length) {
      el.innerHTML = UI.emptyState('check', 'Nothing to grade', 'No pending submissions right now.');
      return;
    }

    el.innerHTML = pending.map(function (s) {
      var a = LH.api.assignments.get(s.assignmentId);
      var st = M.users.filter(function (u) { return u.id === s.studentId; })[0];
      var name = (s.student || (st && st.name) || 'Student');
      var course = (a && a.course) || 'Course';
      var title = (a && a.title) || 'Assignment';
      return '<div class="activity-item" style="align-items:center;">' +
        UI.avatar(name) +
        '<div class="activity-content"><div class="activity-title" style="font-size:13px;">' + F.esc(name) + '</div>' +
        '<div class="activity-meta">' + F.esc(title) + ' &middot; ' + F.esc(course) + '</div></div>' +
        '<div style="text-align:right;">' +
          '<div style="font-size:12px;color:var(--color-text-muted);">' + D.relative(s.submittedAt) + '</div>' +
          '<a class="btn btn-sm btn-primary" href="submissions.html" style="margin-top:4px;">Grade</a>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function renderUpcoming() {
    var el = $('#upcoming-list');
    if (!el) return;

    var ids = ownedCourses().map(function (c) { return c.id; });
    var items = [];
    M.assignments.forEach(function (a) {
      if (ids.indexOf(a.courseId) !== -1 && !a.graded && !D.isOverdue(a.due)) items.push({ kind: 'assignment', course: a.course, title: 'Assignment: ' + a.title, due: a.due });
    });
    M.quizzes.forEach(function (q) {
      if (ids.indexOf(q.courseId) !== -1 && !q.taken && !D.isOverdue(q.due)) items.push({ kind: 'quiz', course: q.course, title: 'Quiz: ' + q.title, due: q.due });
    });
    items.sort(function (a, b) { return new Date(a.due) - new Date(b.due); });

    if (!items.length) {
      el.innerHTML = UI.emptyState('check', 'Nothing scheduled', 'No upcoming assessments in the next few weeks.');
      return;
    }

    el.innerHTML = items.slice(0, 6).map(function (it) {
      return '<div class="activity-item">' +
        '<div class="activity-icon ' + (it.kind === 'quiz' ? 'warning' : 'primary') + '">' + I.icon(it.kind === 'quiz' ? 'quizzes' : 'assignments') + '</div>' +
        '<div class="activity-content"><div class="activity-title" style="font-size:13px;">' + F.esc(it.title) + '</div>' +
        '<div class="activity-meta">' + F.esc(it.course) + ' &middot; due ' + D.format(it.due) + '</div></div>' +
        '<span class="text-sm text-tertiary" style="white-space:nowrap;">' + D.dueLabel(it.due) + '</span>' +
      '</div>';
    }).join('');
  }

  function renderActivity() {
    var el = $('#activity-list');
    if (!el) return;

    var icons = { submission: 'upload', quiz: 'quizzes', material: 'courses', grade: 'grades', student: 'users' };
    var tones = { submission: 'warning', quiz: 'warning', material: 'info', grade: 'success', student: 'primary' };

    el.innerHTML = M.facultyActivity.map(function (a) {
      return '<div class="activity-item">' +
        '<div class="activity-icon ' + (tones[a.icon] || 'neutral') + '">' + I.icon(icons[a.icon] || 'box') + '</div>' +
        '<div class="activity-content"><div class="activity-title" style="font-size:13px;">' + F.esc(a.text) + '</div>' +
        '<div class="activity-meta">' + F.esc(a.course) + ' &middot; ' + D.relative(a.time) + '</div></div>' +
      '</div>';
    }).join('');
  }

  function init() {
    renderWelcome();
    renderStats();
    renderCourses();
    renderPending();
    renderUpcoming();
    renderActivity();
  }

  LH.app.register('faculty-dashboard', init);
  LH.app.init('faculty-dashboard');
})(window.LH);