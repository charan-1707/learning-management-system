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

  async function myEnrollments() {
    var rows = await LH.api.enrollments.forStudent(uid());
    return rows.filter(function (r) { return r.course; });
  }

  async function livePercent(courseId) {
    try {
      return (await LH.api.enrollments.progress(uid(), courseId)).percent;
    } catch (e) { return 0; }
  }

  async function renderStats() {
    var el = $('#stat-grid');
    if (!el) return;

    var rows = await myEnrollments();
    var liveProgs = await Promise.all(rows.map(function (r) { return livePercent(r.course.id); }));
    var completed = liveProgs.filter(function (p) { return p >= 100; }).length;
    var avg = liveProgs.length ? Math.round(liveProgs.reduce(function (s, p) { return s + p; }, 0) / liveProgs.length) : 0;

    return (API.attendance ? API.attendance.overall() : Promise.resolve({ percent: 0 }))
      .then(function (attendance) {
        renderStatsCards(el, rows, completed, avg, attendance);
      });
  }

  function renderStatsCards(el, rows, completed, avg, attendance) {
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

  async function renderContinue() {
    var el = $('#continue-grid');
    if (!el) return;

    var rows = await myEnrollments();
    var inProgress = (await Promise.all(rows.map(function (row) {
      return LH.api.enrollments.progress(uid(), row.course.id).then(function (live) {
        return Object.assign({}, row.course, {
          progress: live.percent,
          modulesDone: live.completed,
          modulesTotal: live.total,
          updated: D.relative(row.course.updated || row.course.createdAt || new Date())
        });
      }).catch(function () { return null; });
    }))).filter(function (c) { return c && c.progress < 100; })
      .sort(function (a, b) { return b.progress - a.progress; })
      .slice(0, 3);

    el.innerHTML = inProgress.map(function (c) { return UI.courseCard(c, 'student'); }).join('');
  }

  async function renderUpcoming() {
    var el = $('#upcoming-list');
    if (!el) return;

    var rows = await myEnrollments();
    var courseIds = {};
    rows.forEach(function (r) { courseIds[r.course.id] = true; });

    var items = [];

    var mine = await LH.api.assignments.list().catch(function () { return []; });
    var submitted = {};
    try {
      (await LH.api.submissions.forStudent(uid())).forEach(function (s) { submitted[s.assignmentId] = true; });
    } catch (e) { /* ignore */ }
    mine.forEach(function (a) {
      if (submitted[a.id]) return;
      if (D.isOverdue(a.due)) return;
      items.push({
        kind: 'assignment', course: a.course, title: a.title, href: 'assignment-detail.html?id=' + a.id,
        due: a.due, status: D.dueLabel(a.due)
      });
    });
    var quizzes = await LH.api.quizzes.list().catch(function () { return []; });
    quizzes.forEach(function (q) {
      if (!q.courseId || !courseIds[q.courseId]) return;
      if (q.taken) return;
      if (new Date(q.due) < new Date()) return;
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

  async function renderRecentGrades() {
    var el = $('#recent-grades');
    if (!el) return;

    var subs = await LH.api.submissions.forStudent(uid()).catch(function () { return []; });
    var graded = subs.filter(function (s) {
      return s.gradedAt || s.status === 'graded';
    });
    var titles = {};
    await Promise.all(graded.map(function (s) {
      return LH.api.assignments.get(s.assignmentId).catch(function () { return null; }).then(function (a) {
        titles[s.assignmentId] = a;
      });
    }));
    var rows = graded.map(function (s) {
      var a = titles[s.assignmentId];
      return {
        assessment: a ? a.title : 'Assignment',
        course: a ? (a.course || '') : '',
        score: s.score, max: a ? (a.maxMarks || 20) : 20, date: s.gradedAt
      };
    }).sort(function (x, y) { return new Date(y.date) - new Date(x.date); });

    if (!rows.length) {
      var summary = await API.grades.summary();
      rows = (summary.recent || []).slice(0, 4);
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

  /* Recent activity: 100% real events — submissions, grades, enrollments
     and notifications, newest first. No fabricated entries, ever. */
  async function renderActivity() {
    var el = $('#activity-list');
    if (!el) return;

    var data = await Promise.all([
      LH.api.submissions.forStudent(uid()).catch(function () { return []; }),
      LH.api.enrollments.forStudent(uid()).catch(function () { return []; }),
      LH.api.notifications.list().catch(function () { return []; }),
      LH.api.grades.summary().catch(function () { return null; })
    ]);
    var subs = data[0] || [], enrs = data[1] || [],
        notifs = data[2] || [], summary = data[3];

    var events = [];
    subs.forEach(function (s) {
      if (s.submittedAt) events.push({ time: s.submittedAt, kind: 'submitted', sub: s });
      if ((s.gradedAt || s.status === 'graded') && s.score != null) {
        events.push({ time: s.gradedAt || s.submittedAt, kind: 'graded', sub: s });
      }
    });
    enrs.forEach(function (row) {
      var enr = row.enrollment || row, course = row.course || {};
      var t = enr.enrolledAt || enr.createdAt;
      if (t) events.push({ time: t, kind: 'enrolled', course: course.name || course.code || 'a course', courseId: course.id });
    });
    ((summary && summary.recent) || []).forEach(function (g) {
      if (g.date) events.push({ time: g.date, kind: 'grade', grade: g });
    });
    notifs.forEach(function (n) {
      if (n.time) events.push({ time: n.time, kind: 'notification', notif: n });
    });

    events = events
      .filter(function (e) { return e.time && !isNaN(new Date(e.time).getTime()); })
      .sort(function (a, b) { return new Date(b.time) - new Date(a.time); })
      .slice(0, 6);

    if (!events.length) {
      el.innerHTML = UI.emptyState('courses', 'No activity yet', 'Your submissions, grades and enrollments will appear here.');
      return;
    }

    /* Resolve assignment titles for submission/grade events. */
    var needTitles = {};
    events.forEach(function (e) {
      if ((e.kind === 'submitted' || e.kind === 'graded') && e.sub.assignmentId) {
        needTitles[e.sub.assignmentId] = true;
      }
    });
    var titles = {};
    await Promise.all(Object.keys(needTitles).map(function (aid) {
      return LH.api.assignments.get(aid).catch(function () { return null; }).then(function (a) {
        if (a) titles[aid] = a;
      });
    }));

    el.innerHTML = events.map(function (e) {
      var icon, tone, text, meta, href;
      if (e.kind === 'submitted') {
        var a = titles[e.sub.assignmentId] || {};
        icon = 'assignments'; tone = 'primary';
        text = 'You submitted \u201C' + (a.title || 'an assignment') + '\u201D';
        meta = (a.course || '') + ' &middot; ' + D.relative(e.time);
        href = 'assignment-detail.html?id=' + e.sub.assignmentId;
      } else if (e.kind === 'graded') {
        var g2 = titles[e.sub.assignmentId] || {};
        icon = 'grades'; tone = 'success';
        text = 'Graded \u201C' + (g2.title || 'an assignment') + '\u201D: ' + e.sub.score + '/' + (g2.maxMarks || 20);
        meta = (g2.course || '') + ' &middot; ' + D.relative(e.time);
        href = 'grades.html';
      } else if (e.kind === 'enrolled') {
        icon = 'courses'; tone = 'info';
        text = 'You enrolled in \u201C' + e.course + '\u201D';
        meta = D.relative(e.time);
        href = e.courseId ? 'course-details.html?id=' + e.courseId : 'courses.html';
      } else if (e.kind === 'grade') {
        icon = 'grades'; tone = 'success';
        text = 'Graded \u201C' + e.grade.assessment + '\u201D: ' + e.grade.score + '/' + e.grade.max;
        meta = (e.grade.course || '') + ' &middot; ' + D.relative(e.time);
        href = 'grades.html';
      } else {
        var n = e.notif;
        icon = n.type === 'grade' ? 'grades' : n.type === 'quiz' ? 'quizzes' : n.type === 'course' ? 'courses' : 'bell';
        tone = n.type === 'grade' ? 'success' : n.type === 'quiz' ? 'warning' : n.type === 'course' ? 'info' : 'neutral';
        text = n.title;
        meta = (n.course ? F.esc(n.course) + ' &middot; ' : '') + D.relative(e.time);
        href = n.type === 'grade' ? 'grades.html' : 'notifications.html';
      }
      return '<a class="activity-item" href="' + href + '" style="text-decoration:none;color:inherit;">' +
        '<div class="activity-icon ' + tone + '">' + I.icon(icon) + '</div>' +
        '<div class="activity-content"><div class="activity-title">' + F.esc(text) + '</div>' +
        '<div class="activity-meta">' + meta + '</div></div>' +
      '</a>';
    }).join('');
  }

  async function renderMiniNotifications() {
    var el = $('#mini-notifications');
    if (!el) return;
    var list = (await LH.api.notifications.list().catch(function () { return []; }))
      .filter(function (n) { return !n.read; })
      .sort(function (a, b) { return new Date(b.time) - new Date(a.time); }).slice(0, 4);
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

  async function renderAttendanceMini() {
    var el = $('#attendance-mini');
    if (!el) return;
    var list = API.attendance ? await API.attendance.list() : [];
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

  /* allSettled fallback for older browsers. */
  function settleAll(list) {
    if (Promise.allSettled) return Promise.allSettled(list);
    return Promise.all(list.map(function (p) {
      return Promise.resolve(p).then(function () { /* ok */ }, function () { /* isolated */ });
    }));
  }

  /* Hard cap per section: even a non-network hang resolves so the page can
     never freeze with blank bodies (backend answers the whole burst in ms;
     anything beyond this is a stall, not loading). */
  function withTimeout(p, ms) {
    return Promise.race([
      Promise.resolve(p),
      new Promise(function (res) { setTimeout(function () { res(undefined); }, ms || 20000); })
    ]);
  }

  /* Shimmer placeholders so "still loading" is visibly distinct from frozen.
     Each renderer overwrites its own slot when its data arrives. */
  function skeletons() {
    var bars = '<div class="skel"></div><div class="skel" style="width:72%"></div><div class="skel" style="width:55%"></div>';
    var slots = ['continue-grid', 'upcoming-list', 'recent-grades', 'activity-list', 'mini-notifications', 'attendance-mini'];
    slots.forEach(function (id) {
      var el = $(id);
      if (el && !el.innerHTML) el.innerHTML = '<div class="skel-wrap">' + bars + '</div>';
    });
    var stats = $('stat-grid');
    if (stats && !stats.innerHTML) {
      stats.innerHTML = [0, 1, 2, 3].map(function () {
        return '<div class="card"><div class="card-body"><div class="skel" style="height:26px;width:40%"></div><div class="skel"></div><div class="skel" style="width:60%"></div></div></div>';
      }).join('');
    }
  }

  var started = false;
  async function init() {
    /* Guard against double-execution (rapid refresh / duplicate script
       evaluation): second run would double-fire the N+1 progress fan-out
       and saturate the backend. */
    if (started) return;
    started = true;
    renderWelcome();
    skeletons();
    /* Parallel + isolated + time-boxed: one slow/failing section must never
       freeze the other cards (previously sequential awaits left empty bodies). */
    await settleAll([
      withTimeout(renderStats()),
      withTimeout(renderContinue()),
      withTimeout(renderUpcoming()),
      withTimeout(renderRecentGrades()),
      withTimeout(renderActivity()),
      withTimeout(renderMiniNotifications()),
      withTimeout(renderAttendanceMini())
    ]);
  }

  LH.app.register('student-dashboard', init);
  LH.app.init('student-dashboard');
})(window.LH);