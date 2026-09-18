(function (LH) {
  'use strict';

  var $ = LH.dom.$, F = LH.format, D = LH.date, UI = LH.ui, I = LH.icons;
  var M = LH.mock;

  function facultyId() {
    var u = LH.shell.getUser();
    return u ? u.id : 101;
  }

  function taughtIds() {
    var list = LH.api.courses.byInstructorId(facultyId());
    if (!list || !list.length) list = LH.api.courses.byInstructor('Dr. Priya Sharma');
    return list.map(function (c) { return c.id; });
  }

  function coursesTaught() {
    var ids = taughtIds();
    return M.courses.filter(function (c) { return ids.indexOf(c.id) !== -1; });
  }

  function renderList() {
    var el = $('#assignment-faculty-list');
    if (!el) return;

    var ids = taughtIds();
    var list = M.assignments.filter(function (a) { return ids.indexOf(a.courseId) !== -1; })
      .sort(function (a, b) { return new Date(a.due) - new Date(b.due); });

    if (!list.length) {
      el.innerHTML = UI.emptyState('assignments', 'No assignments yet', 'Create your first assignment to get started.');
      return;
    }

    el.innerHTML = list.map(function (a) {
      var status = a.graded ? UI.badge('Closed', 'neutral') : D.isOverdue(a.due) ? UI.badge('Overdue', 'danger') : UI.badge('Open', 'success');
      return '<section class="card">' +
        '<div class="card-body" style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">' +
          '<div class="activity-icon primary">' + I.icon('assignments') + '</div>' +
          '<div style="flex:1;min-width:180px;">' +
            '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><span style="font-size:15px;font-weight:600;color:var(--color-text-primary);">' + F.esc(a.title) + '</span>' + status + '</div>' +
            '<div style="font-size:13px;color:var(--color-text-muted);margin-top:3px;">' + F.esc(a.course) + ' &middot; ' + (a.maxMarks || a.points || 0) + ' points &middot; due ' + D.format(a.due) + '</div>' +
          '</div>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
            '<a class="btn btn-sm btn-secondary" href="submissions.html">Submissions</a>' +
            '<button class="btn btn-sm btn-ghost" data-delete="' + a.id + '">' + I.icon('trash', 14) + '</button>' +
          '</div>' +
        '</div>' +
      '</section>';
    }).join('');

    el.querySelectorAll('[data-delete]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-delete');
        var item = M.assignments.filter(function (a) { return a.id === id; })[0];
        if (!item) return;
        LH.modal.confirm('Delete "' + item.title + '"? Submissions attached to it will be removed. This cannot be undone.', {
          title: 'Delete assignment',
          onConfirm: function () {
            LH.api.assignments.remove(id);
            renderList();
            LH.toast.success('Assignment deleted', 'The assignment was removed.');
          }
        });
      });
    });
  }

  function showSheet() {
    var host = $('#assignment-sheet');
    var opts = '<option value="">Select course</option>' + coursesTaught().map(function (c) { return '<option value="' + c.id + '">' + F.esc(c.name) + '</option>'; }).join('');

    host.hidden = false;
    host.innerHTML =
      '<section class="card" style="margin-bottom:var(--spacing-6);">' +
        '<div class="card-header"><h2 class="card-title">New assignment</h2><p class="card-subtitle">Publish an assignment to one of your courses</p></div>' +
        '<div class="card-body">' +
          '<form id="assignment-form" novalidate>' +
            '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;">' +
              '<div class="form-group" style="grid-column:1 / -1;"><label class="form-label" for="fa-title">Title</label>' +
                '<input class="form-input" id="fa-title" placeholder="e.g. Sorting Algorithms Worksheet">' +
                '<div class="form-error" data-error-for="title"></div></div>' +
              '<div class="form-group"><label class="form-label" for="fa-course">Course</label>' +
                '<select class="form-input form-select" id="fa-course">' + opts + '</select></div>' +
              '<div class="form-group"><label class="form-label" for="fa-due">Due date</label>' +
                '<input class="form-input" id="fa-due" type="date" value="' + D.toInput(D.relativeDays(7)) + '"></div>' +
              '<div class="form-group"><label class="form-label" for="fa-points">Points</label>' +
                '<input class="form-input" id="fa-points" type="number" min="1" max="200" value="20"></div>' +
              '<div class="form-group" style="grid-column:1 / -1;"><label class="form-label" for="fa-desc">Description</label>' +
                '<textarea class="form-input form-textarea" id="fa-desc" rows="4" placeholder="Describe the task, expectations and submission format..."></textarea></div>' +
            '</div>' +
            '<div style="display:flex;gap:10px;margin-top:6px;">' +
              '<button class="btn btn-primary" type="submit" id="fa-submit">' + I.icon('check', 15) + ' Publish</button>' +
              '<button class="btn btn-secondary" type="button" id="fa-cancel">Cancel</button>' +
            '</div>' +
          '</form>' +
        '</div>' +
      '</section>';

    host.scrollIntoView({ behavior: 'smooth', block: 'start' });

    $('#fa-cancel').addEventListener('click', function () { host.hidden = true; host.innerHTML = ''; });
    $('#assignment-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var res = LH.validation.form(e.target, {
        title: { required: true, message: 'Give the assignment a title' }
      });
      if (!res.valid) return;
      if (!res.values.course) { LH.toast.error('Select a course', 'Choose which course this assignment belongs to.'); return; }

      var course = M.courses.filter(function (c) { return c.id === res.values.course; })[0];
      if (course) {
        LH.api.assignments.create({
          title: res.values.title,
          courseId: course.id,
          maxScore: parseInt(res.values.points, 10) || 20,
          due: new Date(res.values.due + 'T23:59:00'),
          description: res.values.desc || ''
        });
      }
      host.hidden = true;
      host.innerHTML = '';
      renderList();
      LH.toast.success('Assignment published', 'Students can now see "' + F.esc(res.values.title) + '".');
    });
  }

  function init() {
    renderList();
    $('#new-assignment').addEventListener('click', showSheet);
  }

  LH.app.register('faculty-assignments', init);
  LH.app.init('faculty-assignments');
})(window.LH);