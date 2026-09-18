(function (LH) {
  'use strict';

  var $ = LH.dom.$, F = LH.format, D = LH.date, UI = LH.ui, I = LH.icons;
  var M = LH.mock;
  var allStudents = M.studentList.slice();

  function render() {
    var tbody = $('#student-body');
    if (!tbody) return;

    var q = ($('#student-search').value || '').toLowerCase();
    var statusF = $('#student-filter').value;
    var programF = $('#student-program').value;

    var list = allStudents.filter(function (s) {
      if (q && s.name.toLowerCase().indexOf(q) === -1 && s.email.toLowerCase().indexOf(q) === -1) return false;
      if (statusF && s.status !== statusF) return false;
      if (programF && s.program !== programF) return false;
      return true;
    });

    $('#student-count').textContent = 'Showing ' + list.length + ' of ' + allStudents.length + ' students';

    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="8" style="padding:32px;">' + UI.emptyState('users', 'No students found', 'Try adjusting your filters.') + '</td></tr>';
      return;
    }

    tbody.innerHTML = list.map(function (s) {
      return '<tr>' +
        '<td><div class="avatar-cell">' + UI.avatar(s.name, 'sm') + '<div><div style="font-weight:600;color:var(--color-text-primary);font-size:13.5px;">' + F.esc(s.name) + '</div>' +
          '<div style="font-size:12px;color:var(--color-text-muted);">' + F.esc(s.email) + '</div></div></div></td>' +
        '<td><span class="text-sm">' + F.esc(s.program) + '</span></td>' +
        '<td><span class="text-sm">' + F.esc(s.year) + '</span></td>' +
        '<td><span class="text-sm">' + s.courses + '</span></td>' +
        '<td><span class="text-sm">' + F.esc(s.attendance) + '</span></td>' +
        '<td><span class="text-sm" style="font-weight:600;color:var(--color-text-primary);">' + F.esc(s.gpa) + '</span></td>' +
        '<td>' + UI.statusBadge(s.status) + '</td>' +
        '<td><button class="btn btn-sm btn-ghost" data-action="' + s.id + '">' + I.icon('settings', 14) + '</button></td>' +
      '</tr>';
    }).join('');

    tbody.querySelectorAll('[data-action]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var sid = parseInt(btn.getAttribute('data-action'), 10);
        var s = allStudents.filter(function (x) { return x.id === sid; })[0];
        if (!s) return;
        LH.modal.alert(
          'Student: ' + s.name + '\nEmail: ' + s.email + '\nProgram: ' + s.program + '\nYear: ' + s.year + '\nCourses: ' + s.courses + '\nAttendance: ' + s.attendance + '\nGPA: ' + s.gpa + '\nStatus: ' + s.status,
          { title: 'Student details' }
        );
      });
    });
  }

  function init() {
    render();
    $('#student-search').addEventListener('input', render);
    $('#student-filter').addEventListener('change', render);
    $('#student-program').addEventListener('change', render);

    $('#invite-students').addEventListener('click', function () {
      LH.toast.info('Invite sent', 'Mock invitation emails dispatched to the provided addresses.');
    });
  }

  LH.app.register('admin-students', init);
  LH.app.init('admin-students');
})(window.LH);