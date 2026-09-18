(function (LH) {
  'use strict';

  var $ = LH.dom.$, F = LH.format, D = LH.date, UI = LH.ui;
  var M = LH.mock;

  function renderSummary() {
    var el = $('#grades-summary');
    var grades = M.grades;
    var totalPct = 0;
    grades.forEach(function (g) { totalPct += (g.score / g.max) * 100; });
    var avg = totalPct / grades.length;

    var best = null;
    grades.forEach(function (g) {
      var p = (g.score / g.max) * 100;
      if (!best || p > best.pct) best = { course: g.course, pct: p };
    });

    var recent = grades.slice().sort(function (a, b) { return new Date(b.date) - new Date(a.date); })[0];

    var stats = [
      { icon: 'grades', tone: 'primary', value: avg.toFixed(1) + '%', label: 'Overall score', sub: 'Across ' + grades.length + ' assessments' },
      { icon: 'award', tone: 'success', value: F.gpa(avg), label: 'GPA (semester)', sub: 'Estimated on 4.0 scale' },
      { icon: 'star', tone: 'info', value: F.gradeLetter(avg), label: 'Overall grade', sub: 'Average performance' },
      { icon: 'target', tone: 'warning', value: Math.round(best.pct) + '%', label: 'Strongest course', sub: best.course }
    ];

    el.innerHTML = stats.map(function (s) { return UI.statCard(s); }).join('');
  }

  function renderTable() {
    var el = $('#grades-table');
    var rows = M.grades.slice().sort(function (a, b) { return new Date(b.date) - new Date(a.date); });

    el.innerHTML = rows.map(function (g) {
      var p = Math.round(g.score / g.max * 100);
      var typeBadge = UI.badge(g.type === 'quiz' ? 'Quiz' : g.type === 'exam' ? 'Exam' : 'Assignment', g.type === 'quiz' ? 'warning' : g.type === 'exam' ? 'info' : 'primary');
      return '<tr>' +
        '<td style="font-weight:500;color:var(--color-text-primary);">' + F.esc(g.assessment) + '</td>' +
        '<td class="text-tertiary">' + F.esc(g.course) + '</td>' +
        '<td style="font-weight:600;">' + g.score + '</td>' +
        '<td class="text-tertiary">' + g.max + '</td>' +
        '<td><div style="display:flex;align-items:center;gap:10px;min-width:130px;">' + UI.progress(p) + '<span style="font-size:12px;font-weight:600;white-space:nowrap;">' + p + '%</span></div></td>' +
        '<td>' + UI.badge(F.gradeLetter(p), F.gradeColor(p)) + '</td>' +
        '<td class="text-tertiary">' + D.format(g.date) + '</td>' +
        '<td>' + typeBadge + '</td>' +
      '</tr>';
    }).join('');
  }

  function init() {
    renderSummary();
    renderTable();
  }

  LH.app.register('student-grades', init);
  LH.app.init('student-grades');
})(window.LH);