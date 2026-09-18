(function (LH) {
  'use strict';

  var $ = LH.dom.$, F = LH.format, D = LH.date, UI = LH.ui, I = LH.icons, DB = LH.db;
  var M = LH.mock;

  function uid() {
    var u = LH.shell.getUser();
    return u ? u.id : 201;
  }

  function myEnrollments() {
    return DB.enrollments.forStudent(uid()).filter(function (r) { return r.course && r.enrollment.status !== 'dropped'; });
  }

  function renderSummary() {
    var el = $('#progress-summary');
    if (!el) return;
    var attend = LH.api.attendance ? LH.api.attendance.overall() : { percent: 0 };

    var rows = myEnrollments();
    var liveProgs = rows.map(function (r) { return DB.progressFor(uid(), r.course.id).percent; });
    var done = liveProgs.filter(function (p) { return p >= 100; }).length;
    var avgProgress = liveProgs.length ? Math.round(liveProgs.reduce(function (s, p) { return s + p; }, 0) / liveProgs.length) : 0;

    var stats = [
      { icon: 'box', tone: 'primary', value: rows.length, label: 'Enrolled courses', sub: 'This semester' },
      { icon: 'award', tone: 'success', value: done, label: 'Courses completed', sub: avgProgress + '% average progress' },
      { icon: 'target', tone: 'info', value: avgProgress + '%', label: 'Overall course progress', sub: 'Weighted across courses' },
      { icon: 'attendance', tone: 'warning', value: attend.percent + '%', label: 'Attendance', sub: 'Average this term' }
    ];

    el.innerHTML = stats.map(function (s) { return UI.statCard(s); }).join('');
  }

  function renderCourses() {
    var el = $('#progress-courses');
    if (!el) return;

    var rows = myEnrollments().map(function (r) {
      var live = DB.progressFor(uid(), r.course.id);
      return { course: r.course, p: live.percent, completed: live.completed, total: live.total };
    });

    el.innerHTML = rows.length
      ? rows.map(function (item) {
          var c = item.course, p = item.p;
          return '<div style="margin-bottom:18px;">' +
            '<div class="flex items-center justify-between" style="margin-bottom:6px;gap:12px;">' +
              '<div class="avatar-cell"><span class="avatar avatar-sm" style="background:var(--color-bg-tertiary);color:var(--color-text-tertiary);">' + F.esc(c.code.split(' ')[1]) + '</span>' +
                '<div><div style="font-size:13px;font-weight:600;color:var(--color-text-primary);">' + F.esc(c.short || c.name) + '</div>' +
                '<div style="font-size:12px;color:var(--color-text-tertiary);">' + item.completed + '/' + item.total + ' lessons completed</div></div></div>' +
              '<span style="font-size:13px;font-weight:700;color:' + (p >= 80 ? 'var(--color-success)' : p >= 40 ? 'var(--color-primary)' : 'var(--color-warning)') + ';">' + p + '%</span>' +
            '</div>' +
            UI.progress(p) +
          '</div>';
        }).join('')
      : UI.emptyState('courses', 'Not enrolled yet', 'Enroll in a course to start tracking progress.');

    el.innerHTML += '<a class="btn btn-sm btn-ghost" href="courses.html">View all courses</a>';
  }

  function renderGrades() {
    var el = $('#progress-grades');
    if (!el) return;

    var byCourse = {};
    DB.list('submissions').forEach(function (s) {
      if (s.studentId !== uid() || !(s.gradedAt || s.status === 'graded')) return;
      var a = DB.get('assignments', s.assignmentId);
      var course = a ? (a.course || 'Course') : 'Course';
      if (!byCourse[course]) byCourse[course] = [];
      byCourse[course].push({ score: s.score, max: s.maxMarks });
    });
    if (!Object.keys(byCourse).length) {
      M.grades.forEach(function (g) {
        if (!byCourse[g.course]) byCourse[g.course] = [];
        byCourse[g.course].push({ score: g.score, max: g.max });
      });
    }

    var rows = Object.keys(byCourse).map(function (name) {
      var list = byCourse[name];
      var sum = 0;
      list.forEach(function (g) { sum += g.score / g.max * 100; });
      return { name: name, pct: sum / list.length };
    }).sort(function (a, b) { return b.pct - a.pct; });

    el.innerHTML = rows.map(function (r, i) {
      var icons = ['star', 'award', 'grades'];
      return '<div class="activity-item">' +
        '<div class="activity-icon ' + (i === 0 ? 'warning' : 'info') + '">' + I.icon(icons[Math.min(i, 2)]) + '</div>' +
        '<div class="activity-content"><div class="activity-title" style="font-size:13px;">' + F.esc(r.name) + '</div>' +
        '<div class="activity-meta">' + Math.round(r.pct) + '% average</div></div>' +
        '<span style="font-size:13px;font-weight:700;color:var(--color-text-primary);">' + F.gradeLetter(r.pct) + '</span>' +
      '</div>';
    }).join('') || UI.emptyState('grades', 'No grades yet', 'Grades will appear after your first assessment.');
  }

  function renderWeek() {
    var el = $('#progress-week');
    if (!el) return;

    var days = [
      { day: 'Mon', min: 50 }, { day: 'Tue', min: 75 }, { day: 'Wed', min: 40 },
      { day: 'Thu', min: 90 }, { day: 'Fri', min: 30 }, { day: 'Sat', min: 15 }, { day: 'Sun', min: 0 }
    ];

    el.innerHTML =
      '<div style="display:flex;align-items:flex-end;justify-content:space-between;height:120px;gap:14px;">' +
      days.map(function (d, i) {
        var height = Math.max(6, d.min * 1.2);
        var today = i === 3;
        return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:8px;">' +
          '<div style="width:100%;height:' + height + 'px;border-radius:6px 6px 2px 2px;background:' + (today ? 'var(--color-primary)' : 'var(--color-bg-tertiary)') + ';border:1px solid ' + (today ? 'var(--color-primary)' : 'var(--color-border-light)') + ';"></div>' +
          '<span style="font-size:11px;color:' + (today ? 'var(--color-primary)' : 'var(--color-text-muted)') + ';font-weight:' + (today ? '600' : '400') + ';">' + d.day + '</span>' +
        '</div>';
      }).join('') +
      '</div>' +
      '<p style="font-size:12px;color:var(--color-text-muted);margin-top:12px;">Study minutes logged this week (approx.)</p>';
  }

  function init() {
    renderSummary();
    renderCourses();
    renderGrades();
    renderWeek();
  }

  LH.app.register('student-progress', init);
  LH.app.init('student-progress');
})(window.LH);