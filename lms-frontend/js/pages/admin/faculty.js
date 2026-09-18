(function (LH) {
  'use strict';

  var $ = LH.dom.$, F = LH.format, UI = LH.ui, I = LH.icons;
  var M = LH.mock;
  var all = M.facultyList.slice();

  function render() {
    var tbody = $('#fac-body');
    if (!tbody) return;

    var q = ($('#fac-search').value || '').toLowerCase();
    var dept = $('#fac-dept').value;

    var list = all.filter(function (f) {
      if (q && f.name.toLowerCase().indexOf(q) === -1 && f.email.toLowerCase().indexOf(q) === -1) return false;
      if (dept && f.dept !== dept) return false;
      return true;
    });

    $('#fac-count').textContent = 'Showing ' + list.length + ' of ' + all.length + ' faculty members';

    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="8" style="padding:32px;">' + UI.emptyState('users', 'No faculty found', 'Try adjusting your filters.') + '</td></tr>';
      return;
    }

    tbody.innerHTML = list.map(function (f) {
      return '<tr>' +
        '<td><div class="avatar-cell">' + UI.avatar(f.name, 'sm') + '<div><div style="font-weight:600;color:var(--color-text-primary);font-size:13.5px;">' + F.esc(f.name) + '</div>' +
          '<div style="font-size:12px;color:var(--color-text-muted);">' + F.esc(f.email) + '</div></div></div></td>' +
        '<td><span class="text-sm">' + F.esc(f.dept) + '</span></td>' +
        '<td><span class="text-sm">' + F.esc(f.title) + '</span></td>' +
        '<td><span class="text-sm">' + f.coursesTaught + '</span></td>' +
        '<td><span class="text-sm">' + f.students + '</span></td>' +
        '<td><span class="text-sm">' + F.esc(f.joined) + '</span></td>' +
        '<td>' + UI.statusBadge(f.status) + '</td>' +
        '<td><button class="btn btn-sm btn-ghost" data-action="' + f.id + '">' + I.icon('settings', 14) + '</button></td>' +
      '</tr>';
    }).join('');

    tbody.querySelectorAll('[data-action]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = parseInt(btn.getAttribute('data-action'), 10);
        var f = all.filter(function (x) { return x.id === id; })[0];
        if (!f) return;
        LH.modal.alert(
          'Name: ' + f.name + '\nEmail: ' + f.email + '\nDepartment: ' + f.dept + '\nTitle: ' + f.title + '\nCourses: ' + f.coursesTaught + '\nStudents: ' + f.students + '\nJoined: ' + f.joined,
          { title: 'Faculty profile' }
        );
      });
    });
  }

  function init() {
    render();
    $('#fac-search').addEventListener('input', render);
    $('#fac-dept').addEventListener('change', render);
  }

  LH.app.register('admin-faculty', init);
  LH.app.init('admin-faculty');
})(window.LH);