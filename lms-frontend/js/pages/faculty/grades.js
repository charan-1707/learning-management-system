(function (LH) {
  'use strict';

  var $ = LH.dom.$, F = LH.format, UI = LH.ui;
  var M = LH.mock;
  var DB = LH.db;

  function facultyId() {
    var u = LH.shell.getUser();
    return u ? u.id : 101;
  }

  async function ownedCourses() {
    var list = await LH.api.courses.byInstructorId(facultyId());
    if (!list || !list.length) list = await LH.api.courses.byInstructor('Dr. Priya Sharma');
    return list;
  }

  function pctOf(gb, asmts, studentId) {
    var num = 0, den = 0;
    asmts.forEach(function (a) {
      var cell = (gb.cells[studentId] || {})[a.id];
      if (cell && cell.status === 'graded' && cell.score != null) {
        num += cell.score / (a.maxMarks || 20);
        den++;
      }
    });
    return den ? Math.round(num / den * 100) : null;
  }

  async function render() {
    var courseId = $('#course-select').value;
    var gb = await LH.api.assignments.gradebook(courseId).catch(function () { return null; });
    var owned = await ownedCourses();
    var course = owned.filter(function (c) { return c.id === courseId; })[0] || owned[0];
    if (!gb || !course) return;

    var asmts = gb.assignments || [];
    var roster = (gb.students || []).map(function (s) { return { studentId: s.id, name: s.name }; });

    if (!asmts.length) {
      $('#grade-summary').innerHTML = '';
      $('#gradebook-title').textContent = 'Gradebook — ' + course.short;
      $('#gradebook-head').innerHTML = '<th>Student</th><th></th>';
      $('#gradebook-body').innerHTML = '<tr><td colspan="2" style="padding:32px;">' + UI.emptyState('assignments', 'No assessments yet', 'Publish an assignment before grading.') + '</td></tr>';
      return;
    }

    /* summary cards */
    var avgs = roster.map(function (r) { return pctOf(gb, asmts, r.studentId); }).filter(function (v) { return v != null; });
    var avg = avgs.length ? avgs.reduce(function (a, b) { return a + b; }, 0) / avgs.length : 0;
    var best = avgs.length ? Math.max.apply(null, avgs) : 0;
    var min = avgs.length ? Math.min.apply(null, avgs) : 0;

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
        var cell = (gb.cells[r.studentId] || {})[a.id];
        if (!cell || cell.status !== 'graded' || cell.score == null) return '<td></td>';
        var max = a.maxMarks || 20;
        var pct = cell.score / max;
        var color = pct >= 0.85 ? 'var(--color-success)' : pct >= 0.6 ? 'var(--color-text-primary)' : 'var(--color-danger)';
        return '<td style="color:' + color + ';font-weight:600;">' + cell.score + '</td>';
      }).join('');
      var overall = pctOf(gb, asmts, r.studentId);
      return '<tr><td><div class="avatar-cell">' + UI.avatar(r.name, 'sm') + F.esc(r.name) + '</div></td>' +
        cells +
        '<td>' + (overall == null ? '<span class="text-tertiary text-sm">&mdash;</span>' : '<strong>' + overall + '%</strong>') + '</td></tr>';
    }).join('');

    $('#gradebook-head').innerHTML = '<th>Student</th>' + heads + '<th>Average</th>';
    $('#gradebook-body').innerHTML = rows;
  }

  async function init() {
    var sel = $('#course-select');
    var owned = await ownedCourses();
    var id = LH.app.param('id') || (owned[0] || {}).id || 'cs201';
    sel.innerHTML = owned
      .map(function (c) { return '<option value="' + c.id + '"' + (c.id === id ? ' selected' : '') + '>' + F.esc(c.code + ' — ' + c.short) + '</option>'; }).join('');
    sel.addEventListener('change', render);
    render();
  }

  LH.app.register('faculty-grades', init);
  LH.app.init('faculty-grades');
})(window.LH);