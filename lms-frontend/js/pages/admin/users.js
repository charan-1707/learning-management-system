(function (LH) {
  'use strict';

  var $ = LH.dom.$, F = LH.format, D = LH.date, UI = LH.ui, I = LH.icons;
  var API = LH.api;

  function roleColor(role) {
    return role === 'admin' ? 'warning' : role === 'faculty' ? 'info' : 'primary';
  }

  function render() {
    var tbody = $('#user-body');
    if (!tbody) return;

    var q = ($('#user-search').value || '').toLowerCase();
    var roleF = $('#user-role').value;
    var statusF = $('#user-status').value;

    var list = API.admin.users({ query: q, role: roleF || 'all' });
    if (statusF) list = list.filter(function (u) { return u.status === statusF; });

    $('#user-count').textContent = 'Showing ' + list.length + ' of ' + API.admin.users({}).length + ' accounts';

    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="padding:32px;">' + UI.emptyState('users', 'No users found', 'Try adjusting your filters.') + '</td></tr>';
      return;
    }

    tbody.innerHTML = list.map(function (u) {
      return '<tr>' +
        '<td><div class="avatar-cell">' + UI.avatar(u.name, 'sm') + '<div><div style="font-weight:600;color:var(--color-text-primary);font-size:13.5px;">' + F.esc(u.name) + '</div>' +
          '<div style="font-size:12px;color:var(--color-text-muted);">' + F.esc(u.email) + '</div></div></div></td>' +
        '<td>' +
          '<select class="form-input form-select" data-role-select="' + u.id + '" style="width:auto;height:32px;padding:2px 24px 2px 8px;font-size:12px;">' +
            '<option value="student"' + (u.role === 'student' ? ' selected' : '') + '>Student</option>' +
            '<option value="faculty"' + (u.role === 'faculty' ? ' selected' : '') + '>Faculty</option>' +
            '<option value="admin"' + (u.role === 'admin' ? ' selected' : '') + '>Admin</option>' +
          '</select>' +
        '</td>' +
        '<td>' + UI.statusBadge(u.status) + '</td>' +
        '<td><span class="text-sm">' + D.relative(u.lastActive) + '</span></td>' +
        '<td>' +
          (u.status === 'suspended'
            ? '<button class="btn btn-sm btn-secondary" data-toggle-status="' + u.id + '">Reactivate</button>'
            : '<button class="btn btn-sm btn-ghost" data-toggle-status="' + u.id + '">' + I.icon('lock', 14) + ' Suspend</button>') +
        '</td>' +
      '</tr>';
    }).join('');

    tbody.querySelectorAll('[data-role-select]').forEach(function (sel) {
      sel.addEventListener('change', function () {
        var uid = parseInt(sel.getAttribute('data-role-select'), 10);
        var newRole = sel.value;
        var u = API.admin.users({}).filter(function (x) { return x.id === uid; })[0];
        LH.modal.confirm(
          'Change ' + F.esc(u.name) + '\'s role to "' + newRole + '"?',
          {
            title: 'Change user role',
            variant: 'primary',
            confirmText: 'Change role',
            onConfirm: function () {
              API.admin.changeUserRole(uid, newRole);
              render();
              LH.toast.success('Role updated', F.esc(u.name) + ' is now a ' + newRole + '.');
            },
            onCancel: function () { render(); }
          }
        );
      });
    });

    tbody.querySelectorAll('[data-toggle-status]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var uid = parseInt(btn.getAttribute('data-toggle-status'), 10);
        var users = API.admin.users({});
        var u = users.filter(function (x) { return x.id === uid; })[0];
        if (!u) return;
        var willSuspend = u.status !== 'suspended';
        LH.modal.confirm(
          willSuspend ? 'Suspend "' + u.name + '"? They will lose access to LearnHub until you reactivate them.' : 'Reactivate "' + u.name + '"?',
          {
            title: willSuspend ? 'Suspend user' : 'Reactivate user',
            onConfirm: function () {
              API.admin.flipUserStatus(uid);
              render();
              LH.toast.success(willSuspend ? 'User suspended' : 'User reactivated', F.esc(u.name) + ' is now ' + (willSuspend ? 'suspended' : 'active') + '.');
            }
          }
        );
      });
    });
  }

  function init() {
    render();
    $('#user-search').addEventListener('input', render);
    $('#user-role').addEventListener('change', render);
    $('#user-status').addEventListener('change', render);
  }

  LH.app.register('admin-users', init);
  LH.app.init('admin-users');
})(window.LH);
