(function (LH) {
  'use strict';

  var $ = LH.dom.$, F = LH.format, UI = LH.ui;
  var M = LH.mock;
  var DB = LH.db;

  function facultyId() {
    var u = LH.shell.getUser();
    return u ? u.id : 101;
  }

  function ownedCourses() {
    var list = LH.api.courses.byInstructorId(facultyId());
    if (!list || !list.length) list = LH.api.courses.byInstructor('Dr. Priya Sharma');
    return list;
  }

  function submissionsFor(courseId) {
    return M.submissions.filter(function (s) { return s.courseId === courseId; });
  }

  function rosterFor(courseId) {
    var roster = [];
    var seen = {};
    function add(sid) {
      if (sid == null || seen[sid]) return;
      seen[sid] = true;
      var u = DB.get('users', sid);
      var name = u ? u.name : null;
      if (!name) {
        var sl = M.studentList.filter(function (x) { return x.id === sid; })[0];
        if (sl) name = sl.name;
      }
      if (name) roster.push({ studentId: sid, name: name });
    }
    DB.enrollments.forCourse(courseId).forEach(function (e) { add(e.studentId); });
    submissionsFor(courseId).forEach(function (s) { add(s.studentId); });
    roster.sort(function (a, b) { return a.name.localeCompare(b.name); });
    return roster;
  }

  function assessmentsFor(courseId) {
    return M.assignments.filter(function (a) { return a.courseId === courseId; })
      .sort(function (a, b) { return new Date(a.due) - new Date(b.due); });
  }

  function gradedScore(studentId, assignmentId) {
    var found = null;
    M.submissions.forEach(function (s) {
      if (s.studentId === studentId && s.assignmentId === assignmentId && s.status === 'graded') found = s;
    });
    return found;
  }

  function studentPct(studentId, asmts) {
    var num = 0, den = 0;
    asmts.forEach(function (a) {
      var s = gradedScore(studentId, a.id);
      if (s) { num += s.score / (a.maxMarks || 20); den++; }
    });
    return den ? Math.round(num / den * 100) : null;
  }

  function render() {
    var courseId = $('#course-select').value;
    var course = M.courses.filter(function (c) { return c.id === courseId; })[0];
    if (!course) return;

    var asmts = assessmentsFor(courseId);
    var roster = rosterFor(courseId);

    if (!asmts.length) {
      $('#grade-summary').innerHTML = '';
      $('#gradebook-title').textContent = 'Gradebook — ' + course.short;
      $('#gradebook-head').innerHTML = '<th>Student</th><th></th>';
      $('#gradebook-body').innerHTML = '<tr><td colspan="2" style="padding:32px;">' + UI.emptyState('assignments', 'No assessments yet', 'Publish an assignment before grading.') + '</td></tr>';
      return;
    }

    /* summary cards */
    var totals = asmts.map(function (a) {
      var graded = roster.map(function (r) { return gradedScore(r.studentId, a.id); }).filter(Boolean);
      var sum = graded.reduce(function (acc, s) { return acc + s.score / (a.maxMarks || 20); }, 0);
      return graded.length ? sum / graded.length * 100 : null;
    }).filter(function (v) { return v != null; });
    var avg = totals.length ? totals.reduce(function (a, b) { return a + b; }, 0) / totals.length : 0;

    var pcts = roster.map(function (r) { return studentPct(r.studentId, asmts); }).filter(function (v) { return v != null; });
    var best = pcts.length ? Math.max.apply(null, pcts) : 0;
    var min = pcts.length ? Math.min.apply(null, pcts) : 0;

    var cards = [
      { icon: 'grades', tone: 'primary', value: Math.round(avg) + '%', label: 'Class average', sub: course.code + ' graded work' },
      { icon: 'award', tone: 'success', value: Math.round(best) + '%', label: 'Highest average', sub: 'Top student this term' },
      { icon: 'target', tone: 'warning', value: Math.round(min) + '%', label: 'Lowest average', sub: 'May need support' },
      { icon: 'box', tone: 'info', value: roster.length, label: 'Students', sub: 'Enrolled & graded' }
    ];
    $('#grade-summary').innerHTML = cards.map(function (c) { return UI.statCard(c); }).join('');

    /* gradebook */
    $('#gradebook-title').textContent = 'Gradebook — ' + course.short;
    var heads = asmts.map(function (a) {
      return '<th><div>' + F.esc(a.title) + '</div><div style="font-weight:400;font-size:11px;color:var(--color-text-muted);">/' + (a.maxMarks || 20) + '</div></th>';
    }).join('');

    var rows = roster.map(function (r) {
      var cells = asmts.map(function (a) {
        var s = gradedScore(r.studentId, a.id);
        if (!s) return '<td></td>';
        var max = a.maxMarks || 20;
        var pct = s.score / max;
        var color = pct >= 0.85 ? 'var(--color-success)' : pct >= 0.6 ? 'var(--color-text-primary)' : 'var(--color-danger)';
        return '<td style="color:' + color + ';font-weight:600;">' + s.score + '</td>';
      }).join('');
      var overall = studentPct(r.studentId, asmts);
      return '<tr><td><div class="avatar-cell">' + UI.avatar(r.name, 'sm') + F.esc(r.name) + '</div></td>' +
        cells +
        '<td>' + (overall == null ? '<span class="text-tertiary text-sm">&mdash;</span>' : '<strong>' + overall + '%</strong>') + '</td></tr>';
    }).join('');

    $('#gradebook-head').innerHTML = '<th>Student</th>' + heads + '<th>Average</th>';
    $('#gradebook-body').innerHTML = rows;
  }

  function init() {
    var sel = $('#course-select');
    var id = LH.app.param('id') || (ownedCourses()[0] || {}).id || 'cs201';
    sel.innerHTML = ownedCourses()
      .map(function (c) { return '<option value="' + c.id + '"' + (c.id === id ? ' selected' : '') + '>' + F.esc(c.code + ' — ' + c.short) + '</option>'; }).join('');
    sel.addEventListener('change', render);
    render();
  }

  LH.app.register('faculty-grades', init);
  LH.app.init('faculty-grades');
})(window.LH);