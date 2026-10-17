(function (LH) {
  'use strict';

  var $ = LH.dom.$, F = LH.format, UI = LH.ui;
  var M = LH.mock;

  function horizonBar(label, value, max, color) {
    var pct = Math.max(2, Math.round(value / max * 100));
    return '<div style="margin-bottom:12px;">' +
      '<div class="flex items-center justify-between" style="margin-bottom:5px;gap:12px;">' +
        '<span style="font-size:13px;font-weight:500;color:var(--color-text-primary);flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + F.esc(label) + '</span>' +
        '<span style="font-size:13px;font-weight:600;color:var(--color-text-secondary);">' + F.n(value) + '</span>' +
      '</div>' +
      '<div style="background:var(--color-bg-tertiary);border-radius:6px;height:8px;overflow:hidden;">' +
        '<div style="height:100%;width:' + pct + '%;border-radius:6px;background:' + color + ';"></div>' +
      '</div>' +
    '</div>';
  }

  function passBadge(ok) {
    return UI.badge(ok ? 'Passed' : 'Failed', ok ? 'success' : 'danger');
  }

  /* Drill-down: who attempted this final (best per student) + who never did. */
  async function openFinalAttempts(f) {
    var parts = await Promise.all([
      LH.api.quizzes.attempts(f.quizId).catch(function () { return null; }),
      LH.api.courses.roster(f.courseId).catch(function () { return null; })
    ]);
    var atts = parts[0], roster = parts[1];
    if (!atts || !roster) {
      LH.toast.error('Not available', 'Could not load attempts for this final test.');
      return;
    }
    var best = {};
    atts.forEach(function (a) {
      var p = a.pct != null ? a.pct : (a.total ? Math.round(a.score / a.total * 100) : 0);
      var cur = best[a.studentId];
      if (!cur || p > cur.pct || (p === cur.pct && String(a.submittedAt) > String(cur.date))) {
        best[a.studentId] = {
          name: a.studentName || ('#' + a.studentId),
          score: a.score, total: a.total, pct: p, date: a.submittedAt
        };
      }
    });
    var rows = roster.slice().sort(function (a, b) {
      return String(a.name || '').localeCompare(String(b.name || ''));
    }).map(function (s) {
      var b = best[s.studentId];
      if (!b) {
        return '<tr><td style="font-weight:500;">' + F.esc(s.name || 'Student') + '</td>' +
          '<td class="text-tertiary">—</td>' +
          '<td>' + UI.badge('Not attempted', 'neutral') + '</td>' +
          '<td class="text-tertiary">—</td></tr>';
      }
      return '<tr><td style="font-weight:500;">' + F.esc(b.name) + '</td>' +
        '<td>' + b.score + ' / ' + b.total + '</td>' +
        '<td>' + passBadge(b.pct >= 40) + '</td>' +
        '<td class="text-tertiary">' + F.esc(b.date ? String(b.date).slice(0, 10) : '—') + '</td></tr>';
    }).join('');
    LH.modal.open(
      '<div class="table-wrapper" style="max-height:380px;overflow:auto;border:1px solid var(--color-border-light);border-radius:10px;"><table class="table">' +
      '<thead><tr><th>Student</th><th>Best score</th><th>Result</th><th>Date</th></tr></thead><tbody>' +
      (rows || '<tr><td colspan="4" class="text-tertiary">No enrolled students.</td></tr>') +
      '</tbody></table></div>',
      { title: 'Final attempts — ' + (f.title || ''), width: '640px' });
  }

  async function render() {
    var el = $('#report-cards');
    if (!el) return;

    var r = await LH.api.admin.reports();
    var avgNum = Math.round(parseFloat(r.passRate.average) * 10) / 10;
    var avgLabel = r.passRate.average + (typeof r.passRate.average === 'number' ? '%' : '');
    var maxEnroll = Math.max.apply(null, r.enrollmentByCourse.map(function (c) { return c.students; }));
    var maxActive = Math.max.apply(null, r.monthlyActive.map(function (d) { return d.active; }));
    var totalProg = r.distributionByProgram.reduce(function (s, p) { return s + p.students; }, 0);

    var passTotal = r.passRate.passed + r.passRate.failed;

    el.innerHTML =
      '<section class="card">' +
        '<div class="card-header"><h2 class="card-title">Enrollment by course</h2><p class="card-subtitle">Registered students per course (6 max shown)</p></div>' +
        '<div class="card-body" style="padding-top:var(--spacing-4);">' +
          r.enrollmentByCourse.map(function (c) { return horizonBar(c.code + ' — ' + c.course, c.students, maxEnroll, 'var(--color-primary)'); }).join('') +
        '</div>' +
      '</section>' +

      '<section class="card">' +
        '<div class="card-header"><h2 class="card-title">Active users</h2><p class="card-subtitle">Monthly active accounts</p></div>' +
        '<div class="card-body" style="padding-top:var(--spacing-4);">' +
          r.monthlyActive.map(function (m) { return horizonBar(m.month, m.active, maxActive, 'var(--color-info)'); }).join('') +
        '</div>' +
      '</section>' +

      '<section class="card">' +
        '<div class="card-header"><h2 class="card-title">Students by program</h2><p class="card-subtitle">Current distribution</p></div>' +
        '<div class="card-body" style="padding-top:var(--spacing-4);">' +
          r.distributionByProgram.map(function (p) {
            var pct = Math.round(p.students / totalProg * 100);
            return '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">' +
              '<span style="width:110px;font-size:13px;color:var(--color-text-primary);font-weight:500;">' + F.esc(p.program) + '</span>' +
              '<div style="flex:1;"><div style="background:var(--color-bg-tertiary);border-radius:6px;height:8px;overflow:hidden;">' +
                '<div style="height:100%;width:' + pct + '%;border-radius:6px;background:var(--color-warning);"></div></div></div>' +
              '<span style="width:64px;text-align:right;font-size:12px;color:var(--color-text-tertiary);">' + pct + '%</span>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</section>' +

      '<section class="card">' +
        '<div class="card-header"><h2 class="card-title">Final exams</h2><p class="card-subtitle">Per-course final tests — attempts, average best score, 40% pass split</p></div>' +
        '<div class="card-body" style="padding-top:var(--spacing-4);">' +
          (((r.finalExams && r.finalExams.length) ? r.finalExams.map(function (f) {
            return '<div class="final-row" data-final-row="' + F.esc(f.quizId || '') + '" data-final-course="' + F.esc(f.courseId || '') + '" role="button" tabindex="0" style="margin-bottom:14px;cursor:pointer;padding:10px 12px;margin-left:-12px;margin-right:-12px;" title="View student attempts">' + '<div class="flex items-center justify-between" style="margin-bottom:4px;gap:12px;">' +
              '<span style="font-size:13px;font-weight:500;color:var(--color-text-primary);flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + F.esc(f.code + ' — ' + f.title) + '</span>' +
              '<span style="font-size:12px;color:var(--color-text-tertiary);white-space:nowrap;">' + F.n(f.attempts) + ' attempts &middot; ' + f.averagePct + '% avg</span></div>' +
              '<div style="display:flex;align-items:center;gap:10px;">' + UI.progress(Math.round(f.averagePct)) +
              '<span style="font-size:12px;font-weight:600;white-space:nowrap;color:var(--color-success);">' + F.n(f.passed) + ' passed</span>' +
              '<span style="font-size:12px;font-weight:600;white-space:nowrap;color:var(--color-danger);">' + F.n(f.failed) + ' failed</span></div>' +
              '<div class="final-hint" style="font-size:11px;color:var(--color-primary);margin-top:4px;">Click to view student attempts</div>' +
            '</div>';
          }).join('') : '<p style="font-size:13px;color:var(--color-text-tertiary);">No final tests created yet.</p>')) +
        '</div>' +
      '</section>' +

      '<section class="card">' +
        '<div class="card-header"><h2 class="card-title">Assessment pass rate</h2><p class="card-subtitle">Across all recorded assessments</p></div>' +
        '<div class="card-body" style="padding-top:var(--spacing-4);">' +
          UI.progress(Math.round(avgNum), 'success') +
          '<div style="display:flex;justify-content:space-between;margin-top:10px;font-size:13px;">' +
            '<span class="text-tertiary">' + F.n(r.passRate.passed) + ' passed</span>' +
            '<span style="color:var(--color-text-primary);font-weight:700;">' + F.esc(avgLabel) + '</span>' +
            '<span class="text-tertiary">' + F.n(r.passRate.failed) + ' failed</span>' +
          '</div>' +
          '<div style="margin-top:16px;border-top:1px solid var(--color-border-light);padding-top:14px;">' +
            '<div style="font-size:13px;color:var(--color-text-tertiary);margin-bottom:4px;">Total assessments</div>' +
            '<div style="font-size:18px;font-weight:700;color:var(--color-text-primary);">' + F.n(passTotal) + '</div>' +
          '</div>' +
        '</div>' +
      '</section>';
    return r.finalExams || [];
  }

  function init() {
    var el = $('#report-cards');
    render().then(function (finals) {
      if (!finals || !finals.length || !el) return;
      el.addEventListener('click', function (e) {
        var row = e.target.closest('[data-final-row]');
        if (!row) return;
        var f = finals.filter(function (x) { return x.quizId === row.getAttribute('data-final-row'); })[0];
        if (f) openFinalAttempts(f);
      });
      el.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        var row = e.target.closest('[data-final-row]');
        if (!row) return;
        e.preventDefault();
        var f = finals.filter(function (x) { return x.quizId === row.getAttribute('data-final-row'); })[0];
        if (f) openFinalAttempts(f);
      });
    });
  }

  LH.app.register('admin-reports', init);
  LH.app.init('admin-reports');
})(window.LH);