(function (LH) {
  'use strict';

  var F = LH.format, D = LH.date, UI = LH.ui, I = LH.icons;
  var M = LH.mock;

  function quizCard(q, mode) {
    var isAvailable = mode === 'available';
    var action = isAvailable
      ? '<a class="btn btn-sm btn-primary" href="quiz-attempt.html?id=' + q.id + '">' + I.icon('play', 14) + ' Start quiz</a>'
      : '<span class="btn btn-sm btn-secondary" style="cursor:default;">' + I.icon('check', 14) + ' Completed</span>';

    return '<div class="activity-item" style="align-items:center;flex-wrap:wrap;">' +
      '<div class="activity-icon ' + (isAvailable ? 'warning' : 'success') + '">' + I.icon('quizzes') + '</div>' +
      '<div class="activity-content">' +
        '<div class="activity-title">' + F.esc(q.title) + '</div>' +
        '<div class="activity-meta">' + F.esc(q.course) + ' &middot; ' + q.questions + ' questions &middot; ' + q.duration + ' min &middot; ' + q.attemptsMax + ' attempts</div>' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">' +
        (isAvailable ? '<div style="text-align:right;"><div style="font-size:12px;color:var(--color-text-tertiary);">Best score</div><div style="font-weight:600;color:var(--color-text-primary);">' + (q.bestScore || '—') + '</div></div>' : '<div style="text-align:right;"><div style="font-size:12px;color:var(--color-text-tertiary);">Best score</div><div style="font-weight:600;color:var(--color-primary);">' + (q.bestScore || '—') + '</div></div>') +
        UI.statusBadge(q.taken ? 'completed' : q.due < new Date() ? 'overdue' : 'available') +
        action +
      '</div>' +
    '</div>';
  }

  function init() {
    var available = M.quizzes.filter(function (q) { return !q.taken; })
      .sort(function (a, b) { return new Date(a.due) - new Date(b.due); });
    var attempted = M.quizzes.filter(function (q) { return q.taken; });

    var elAvail = document.getElementById('available-quizzes');
    var elAtt = document.getElementById('attempted-quizzes');

    elAvail.innerHTML = available.length
      ? available.map(function (q) { return quizCard(q, 'available'); }).join('')
      : UI.emptyState('quizzes', 'No quizzes available', 'You have completed all available quizzes.');

    elAtt.innerHTML = attempted.length
      ? attempted.map(function (q) { return quizCard(q, 'attempted'); }).join('')
      : UI.emptyState('clock', 'No attempts yet', 'Your quiz attempts will appear here.');
  }

  LH.app.register('student-quizzes', init);
  LH.app.init('student-quizzes');
})(window.LH);