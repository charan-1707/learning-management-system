(function (LH) {
  'use strict';

  var $ = LH.dom.$, F = LH.format, D = LH.date, UI = LH.ui, I = LH.icons, DB = LH.db;

  function uid() {
    var u = LH.shell.getUser();
    return u ? u.id : 201;
  }

  async function myAssignments() {
    var list = await LH.api.assignments.list();
    var subs = await LH.api.submissions.forStudent(uid());
    var byAsg = {};
    subs.forEach(function (s) { byAsg[s.assignmentId] = s; });
    return list.map(function (a) {
      var sub = byAsg[a.id] || null;
      var st;
      if (a.ownStatus === 'graded') st = { status: 'graded', sub: sub };
      else if (a.ownStatus === 'submitted') st = { status: 'submitted', sub: sub };
      else st = { status: a.ownStatus || 'not-started', sub: null };
      return { a: a, st: st };
    }).sort(function (x, y) { return new Date(x.a.due) - new Date(y.a.due); });
  }

  async function renderList(filter) {
    var el = $('#assignment-list');
    if (!el) return;

    var rows = (await myAssignments()).filter(function (item) {
      var st = item.st.status;
      if (filter === 'all') return true;
      if (filter === 'not-started') return st === 'not-started';
      if (filter === 'in-progress') return st === 'submitted';
      if (filter === 'submitted') return st === 'submitted';
      if (filter === 'graded') return st === 'graded';
      if (filter === 'overdue') return st === 'overdue';
      return false;
    });

    if (!rows.length) {
      el.innerHTML = UI.emptyState('assignments', 'No assignments match', 'Try a different status filter.');
      return;
    }

    el.innerHTML =
      '<div class="table-wrapper" style="border:none;border-radius:0;">' +
      '<table class="table" role="table" aria-label="Assignments">' +
      '<thead><tr><th>Assignment</th><th>Course</th><th>Due date</th><th>Status</th><th>Marks</th><th></th></tr></thead><tbody>' +
      rows.map(function (item) {
        var a = item.a, st = item.st, sub = st.sub;
        var pct = st.status === 'graded' ? Math.round(sub.score / a.maxMarks * 100) : null;
        var subtext = st.status === 'graded'
          ? 'Graded ' + D.format(sub.gradedAt)
          : st.status === 'submitted'
            ? 'Submitted ' + D.format(sub.submittedAt)
            : 'Not submitted yet';
        return '<tr>' +
          '<td><div class="avatar-cell"><span class="avatar">' + I.icon('assignments', 16) + '</span>' +
            '<div><div style="font-weight:600;color:var(--color-text-primary);">' + F.esc(a.title) + '</div>' +
            '<div style="font-size:12px;color:var(--color-text-tertiary);">' + subtext + '</div></div></td>' +
          '<td class="text-tertiary">' + F.esc(a.course) + '</td>' +
          '<td><div style="font-weight:500;">' + D.format(a.due) + '</div><div style="font-size:12px;' + (st.status === 'overdue' ? 'color:var(--color-danger);' : 'color:var(--color-text-muted);') + '">' + (st.status === 'graded' || st.status === 'submitted' ? '—' : D.dueLabel(a.due)) + '</div></td>' +
          '<td>' + UI.statusBadge(st.status) + '</td>' +
          '<td>' + (st.status === 'graded' ? '<span style="font-weight:600;">' + sub.score + ' / ' + a.maxMarks + '</span><div class="text-xs" style="color:var(--color-text-muted);">' + pct + '%</div>' : '<span class="text-tertiary">' + (a.maxMarks == null ? '—' : a.maxMarks) + '</span>') + '</td>' +
          '<td><a class="btn btn-sm btn-ghost" href="assignment-detail.html?id=' + a.id + '">' + I.icon('arrowRight', 15) + ' View</a></td>' +
        '</tr>';
      }).join('') +
      '</tbody></table></div>';
  }

  function init() {
    renderList('all');
    $('#status-filter').addEventListener('change', function () {
      renderList(this.value);
    });
  }

  LH.app.register('student-assignments', init);
  LH.app.init('student-assignments');
})(window.LH);