(function (LH) {
  'use strict';

  var $ = LH.dom.$, F = LH.format, D = LH.date, UI = LH.ui, I = LH.icons;
  var M = LH.mock;
  var currentFilter = 'all';

  function facultyId() {
    var u = LH.shell.getUser();
    return u ? u.id : 101;
  }

  function ownedIds() {
    var list = LH.api.courses.byInstructorId(facultyId());
    if (!list || !list.length) list = LH.api.courses.byInstructor('Dr. Priya Sharma');
    return list.map(function (c) { return c.id; });
  }

  function decorate(s) {
    var a = LH.api.assignments.get(s.assignmentId);
    var c = LH.db.get('courses', s.courseId);
    var st = LH.api.users.get(s.studentId);
    var courseName = c ? (c.short || c.name) : '';
    var max = a && a.maxMarks ? a.maxMarks : 20;
    return {
      id: s.id,
      studentId: s.studentId,
      student: s.student || (st && st.name) || 'Student',
      assignmentId: s.assignmentId,
      assignment: (a && a.title) || 'Assignment',
      course: courseName,
      max: max,
      content: s.content || '',
      submittedAt: s.submittedAt || s.submitted,
      score: s.score == null ? null : Number(s.score) + ' / ' + max,
      gradedAt: s.gradedAt,
      status: s.status
    };
  }

  function render() {
    var tbody = $('#submission-body');
    if (!tbody) return;

    var ids = ownedIds();
    var list = M.submissions.filter(function (s) { return ids.indexOf(s.courseId) !== -1; })
      .map(decorate)
      .sort(function (a, b) { return (b.submittedAt || 0) - (a.submittedAt || 0); });

    if (currentFilter === 'pending') list = list.filter(function (s) { return s.status === 'pending' || !s.status; });
    else if (currentFilter === 'graded') list = list.filter(function (s) { return s.status === 'graded'; });

    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="padding:32px;">' + UI.emptyState('check', 'No submissions', currentFilter === 'pending' ? 'Nothing left to grade. Nice work!' : 'No graded submissions yet.') + '</td></tr>';
      return;
    }

    tbody.innerHTML = list.map(function (s) {
      var status = s.status === 'graded' ? UI.statusBadge('Graded', 'success') : s.status === 'reviewing' ? UI.statusBadge('Reviewing', 'info') : UI.statusBadge('Pending', 'warning');
      return '<tr>' +
        '<td><div class="avatar-cell">' + UI.avatar(s.student, 'sm') + F.esc(s.student) + '</div></td>' +
        '<td><div style="font-size:13.5px;"><div style="font-weight:600;color:var(--color-text-primary);">' + F.esc(s.assignment) + '</div>' +
          '<div style="font-size:12px;color:var(--color-text-muted);">' + F.esc(s.course) + '</div></div></td>' +
        '<td>' + (s.score || '<span class="text-tertiary text-sm">&mdash;</span>') + '</td>' +
        '<td><span class="text-sm">' + D.relative(s.submittedAt) + '</span></td>' +
        '<td>' + status + '</td>' +
        '<td>' + (s.status === 'graded'
          ? '<a class="btn btn-sm btn-ghost" data-grade="' + s.assignmentId + ':' + s.id + '">Re-grade</a>'
          : '<button class="btn btn-sm btn-primary" data-grade="' + s.assignmentId + ':' + s.id + '">' + I.icon('upload', 14) + ' Grade</button>') +
        '</td>' +
      '</tr>';
    }).join('');

    tbody.querySelectorAll('[data-grade]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var parts = btn.getAttribute('data-grade').split(':');
        openGrading(parts[1], parts[0]);
      });
    });
  }

  function findSub(submissionId) {
    var s = null;
    M.submissions.forEach(function (x) { if (x.id === submissionId) s = x; });
    return s;
  }

  function openGrading(submissionId, assignmentId) {
    var s = findSub(submissionId);
    if (!s) return;
    var view = decorate(s);
    var existing = $('#grade-modal');
    if (existing) existing.remove();

    var max = view.max;
    var root = document.createElement('div');
    root.id = 'grade-modal';
    root.className = 'modal-overlay';
    root.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.55);display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px;';
    root.innerHTML =
      '<div class="modal modal-sm" style="background:var(--color-bg-primary);border:1px solid var(--color-border-light);border-radius:var(--radius-lg);width:100%;max-width:480px;overflow:hidden;">' +
        '<div class="modal-header" style="display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid var(--color-border-light);">' +
          '<h3 style="font-size:16px;font-weight:700;color:var(--color-text-primary);">Grade submission</h3>' +
          '<button data-close style="background:none;border:none;color:var(--color-text-muted);cursor:pointer;display:flex;" aria-label="Close">' + I.icon('close', 18) + '</button>' +
        '</div>' +
        '<div class="modal-body" style="padding:20px;">' +
          '<div class="avatar-cell" style="margin-bottom:16px;">' + UI.avatar(view.student, 'sm') +
            '<div><div style="font-weight:600;color:var(--color-text-primary);font-size:14px;">' + F.esc(view.student) + '</div>' +
            '<div style="font-size:12px;color:var(--color-text-muted);">' + F.esc(view.assignment) + ' &middot; ' + F.esc(view.course) + '</div></div></div>' +
          '<div style="font-size:13px;color:var(--color-text-muted);margin-bottom:18px;padding:12px;background:var(--color-bg-tertiary);border-radius:8px;max-height:120px;overflow:auto;">' + F.esc(view.content || 'No content provided.') + '</div>' +
          '<div class="form-group">' +
            '<label class="form-label" for="grade-input">Score <span class="text-tertiary" style="font-weight:400;">/ ' + max + '</span></label>' +
            '<input class="form-input" id="grade-input" type="number" min="0" max="' + max + '" value="' + (view.status === 'graded' ? String(view.score).split(' ')[0] : Math.round(max * 0.8)) + '">' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label" for="feedback-input">Feedback</label>' +
            '<textarea class="form-input form-textarea" id="feedback-input" rows="3" placeholder="Add comments for the student...">' + F.esc(view.feedback || (s.feedback || '')) + '</textarea>' +
          '</div>' +
        '</div>' +
        '<div class="modal-footer" style="display:flex;justify-content:flex-end;gap:10px;padding:16px 20px;border-top:1px solid var(--color-border-light);">' +
          '<button class="btn btn-secondary" data-close>Cancel</button>' +
          '<button class="btn btn-primary" data-save>Submit grade</button>' +
        '</div>' +
      '</div>';

    root.addEventListener('click', function (e) {
      if (e.target === root || e.target.closest('[data-close]')) { root.remove(); }
    });
    root.querySelector('[data-save]').addEventListener('click', function () {
      var val = parseInt(root.querySelector('#grade-input').value, 10);
      var fb = root.querySelector('#feedback-input').value;
      if (isNaN(val) || val < 0) { LH.toast.error('Invalid score', 'Enter a value between 0 and ' + max + '.'); return; }
      if (val > max) val = max;
      LH.api.submissions.grade(assignmentId, submissionId, val, fb);
      root.remove();
      render();
      LH.toast.success('Graded', F.esc(view.student) + ' scored ' + val + '/' + max + '.');
    });

    document.body.appendChild(root);
  }

  function init() {
    render();
    document.querySelectorAll('.tab[data-sfilter]').forEach(function (tab) {
      tab.addEventListener('click', function () {
        document.querySelectorAll('.tab[data-sfilter]').forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        currentFilter = tab.getAttribute('data-sfilter');
        render();
      });
    });
  }

  LH.app.register('faculty-submissions', init);
  LH.app.init('faculty-submissions');
})(window.LH);