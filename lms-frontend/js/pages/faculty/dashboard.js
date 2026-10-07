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
            '<h1 style="font-size:24px;font-weight:700;letter-spacing:-0.02em;color:var(--color-text-primary);margin-bottom:6px;">' + g + ', ' + F.esc((user && user.name ? user.name.replace(/^(Dr\.|Prof\.)\s*/i, '').split(' ')[0] : 'there')) + '</h1>' +
            '<p style="color:var(--color-text-tertiary);font-size:14px;">Here&rsquo;s what needs your attention across your courses today.</p>' +
          '</div>' +
          '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
            '<a class="btn btn-primary" href="submissions.html">' + I.icon('upload', 16) + ' Grade submissions</a>' +
            '<a class="btn btn-secondary" href="course-editor.html">' + I.icon('plus', 16) + ' New course</a>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  async function ownedCourses() {
    var user = LH.shell.getUser();
    var id = user ? user.id : 101;
    var list = await LH.api.faculty.courses().catch(function () { return []; });
    if (!list || !list.length) {
      list = await LH.api.courses.byInstructorId(id).catch(function () { return []; });
    }
    return list || [];
  }

  async function ownedCourseIds() {
    return (await ownedCourses()).map(function (c) { return c.id; });
  }

  async function ownedAssignments() {
    var ids = await ownedCourseIds();
    var lists = await Promise.all(ids.map(function (cid) {
      return LH.api.assignments.forCourse(cid).catch(function () { return []; });
    }));
    return lists.reduce(function (acc, l) { return acc.concat(l); }, []);
  }

  async function renderStats() {
    var el = $('#stat-grid');
    if (!el) return;
    var courses = await ownedCourses();
    var ids = courses.map(function (c) { return c.id; });
    var students = courses.reduce(function (s, c) { return s + (c.students || 0); }, 0);
    var pending = 0;
    var upcoming = 0;
    var pend = await LH.api.faculty.pendingSubmissions().catch(function () { return []; });
    pend.forEach(function (s) {
      if (ids.indexOf(s.courseId) !== -1) pending++;
    });
    var asgs = await Promise.all(ids.map(function (cid) {
      return LH.api.assignments.forCourse(cid).catch(function () { return []; });
    }));
    asgs.forEach(function (list) {
      list.forEach(function (a) {
        if (!a.graded && !D.isOverdue(a.due)) upcoming++;
      });
    });
    var quizzes = await LH.api.quizzes.list().catch(function () { return []; });
    quizzes.forEach(function (q) {
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

  async function renderCourses() {
    var el = $('#course-grid');
    if (!el) return;
    var list = await ownedCourses();
    if (!list.length) {
      el.innerHTML = UI.emptyState('courses', 'No courses yet', 'Create your first course to begin adding materials and assignments.');
      return;
    }
    var counts = await Promise.all(list.map(function (c) {
      return LH.api.lessons.countForCourse(c.id).catch(function () { return 0; });
    }));
    el.innerHTML = list.map(function (c, i) {
      var copy = Object.assign({}, c);
      copy.modules = counts[i] || 0;
      return UI.courseCard(copy, 'faculty');
    }).join('');
  }

  async function renderPending() {
    var el = $('#pending-list');
    if (!el) return;

    var ids = await ownedCourseIds();
    var pend = await LH.api.faculty.pendingSubmissions().catch(function () { return []; });
    var pending = pend.filter(function (s) { return ids.indexOf(s.courseId) !== -1; }).slice(0, 6);

    if (!pending.length) {
      el.innerHTML = UI.emptyState('check', 'Nothing to grade', 'No pending submissions right now.');
      return;
    }

    el.innerHTML = (await Promise.all(pending.map(function (s) {
      return LH.api.assignments.get(s.assignmentId).then(function (a) {
        return { s: s, a: a };
      });
    }))).map(function (row) {
      var s = row.s, a = row.a;
      var name = s.studentName || s.student || 'Student';
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

  async function renderUpcoming() {
    var el = $('#upcoming-list');
    if (!el) return;

    var ids = await ownedCourseIds();
    var items = [];
    (await ownedAssignments()).forEach(function (a) {
      if (!a.graded && !D.isOverdue(a.due)) items.push({ kind: 'assignment', course: a.course, title: 'Assignment: ' + a.title, due: a.due });
    });
    (await LH.api.quizzes.list().catch(function () { return []; })).forEach(function (q) {
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

  async function init() {
    renderWelcome();
    await renderStats();
    await renderCourses();
    await renderPending();
    await renderUpcoming();
  }

  LH.app.register('faculty-dashboard', init);
  LH.app.init('faculty-dashboard');
})(window.LH);