(function (LH) {
  'use strict';

  var $ = LH.dom.$, F = LH.format, D = LH.date, UI = LH.ui, I = LH.icons;
  var API = LH.api;

  function roleColor(role) {
    return role === 'admin' ? 'warning' : role === 'faculty' ? 'info' : 'primary';
  }

  async function render() {
    var tbody = $('#user-body');
    if (!tbody) return;

    var q = ($('#user-search').value || '').toLowerCase();
    var roleF = $('#user-role').value;
    var statusF = $('#user-status').value;

    var list = await API.admin.users({ query: q, role: roleF || 'all' });
    if (statusF) list = list.filter(function (u) { return u.status === statusF; });

    $('#user-count').textContent = 'Showing ' + list.length + ' of ' + (await API.admin.users({})).length + ' accounts';

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
        API.admin.users({}).then(function (all) {
          var u = all.filter(function (x) { return x.id === uid; })[0];
          LH.modal.confirm(
            'Change ' + F.esc(u.name) + '\'s role to "' + newRole + '"?',
            {
              title: 'Change user role',
              variant: 'primary',
              confirmText: 'Change role',
              onConfirm: function () {
                API.admin.changeUserRole(uid, newRole).then(function () {
                  render();
                  LH.toast.success('Role updated', F.esc(u.name) + ' is now a ' + newRole + '.');
                });
              },
              onCancel: function () { render(); }
            }
          );
        });
      });
    });

    tbody.querySelectorAll('[data-toggle-status]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var uid = parseInt(btn.getAttribute('data-toggle-status'), 10);
        API.admin.users({}).then(function (users) {
          var u = users.filter(function (x) { return x.id === uid; })[0];
          if (!u) return;
          var willSuspend = u.status !== 'suspended';
          LH.modal.confirm(
            willSuspend ? 'Suspend "' + u.name + '"? They will lose access to LearnHub until you reactivate them.' : 'Reactivate "' + u.name + '"?',
            {
              title: willSuspend ? 'Suspend user' : 'Reactivate user',
              onConfirm: function () {
                API.admin.flipUserStatus(uid).then(function () {
                  render();
                  LH.toast.success(willSuspend ? 'User suspended' : 'User reactivated', F.esc(u.name) + ' is now ' + (willSuspend ? 'suspended' : 'active') + '.');
                });
              }
            }
          );
        });
      });
    });
  }

  function showSheet() {
    var host = $('#user-sheet');
    if (!host) return;
    host.hidden = false;
    host.innerHTML =
      '<section class="card" style="margin-bottom:var(--spacing-6);">' +
        '<div class="card-header"><h2 class="card-title">New user</h2><p class="card-subtitle">Create an account with a temporary password — share it with the person, they can change it later</p></div>' +
        '<div class="card-body">' +
          '<form id="user-form" novalidate>' +
            '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;">' +
              '<div class="form-group" style="margin:0;"><label class="form-label" for="nu-name">Full name</label>' +
                '<input class="form-input" id="nu-name" name="name" placeholder="e.g. Dr. Rao"></div>' +
              '<div class="form-group" style="margin:0;"><label class="form-label" for="nu-email">Email</label>' +
                '<input class="form-input" id="nu-email" name="email" type="email" placeholder="name@learnhub.com"></div>' +
              '<div class="form-group" style="margin:0;"><label class="form-label" for="nu-role">Role</label>' +
                '<select class="form-input form-select" id="nu-role" name="role">' +
                  '<option value="student">Student</option>' +
                  '<option value="faculty" selected>Faculty</option>' +
                  '<option value="admin">Admin</option>' +
                '</select></div>' +
              '<div class="form-group" style="margin:0;"><label class="form-label" for="nu-password">Temporary password</label>' +
                '<input class="form-input" id="nu-password" name="password" type="text" value="welcome123"></div>' +
            '</div>' +
            '<div class="form-error" data-nu-error style="display:none;margin-top:12px;"></div>' +
            '<div style="display:flex;gap:10px;margin-top:14px;">' +
              '<button class="btn btn-primary" type="submit">Create account</button>' +
              '<button class="btn btn-secondary" type="button" id="nu-cancel">Cancel</button>' +
            '</div>' +
          '</form>' +
        '</div>' +
      '</section>';

    host.scrollIntoView({ behavior: 'smooth', block: 'start' });

    $('#nu-cancel').addEventListener('click', function () { host.hidden = true; host.innerHTML = ''; });
    $('#user-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var errBox = host.querySelector('[data-nu-error]');
      function fail(msg) { if (errBox) { errBox.textContent = msg; errBox.style.display = 'block'; } }
      var data = {
        name: ($('#nu-name').value || '').trim(),
        email: ($('#nu-email').value || '').trim(),
        role: $('#nu-role').value,
        password: $('#nu-password').value || ''
      };
      if (!data.name) { fail('Enter the full name.'); return; }
      if (!/.+@.+\..+/.test(data.email)) { fail('Enter a valid email address.'); return; }
      if (!data.password || data.password.length < 4) { fail('Temporary password must be at least 4 characters.'); return; }
      API.admin.createUser(data).then(function (res) {
        if (res && res.ok === false) { fail(res.error || 'Could not create the account.'); return; }
        host.hidden = true;
        host.innerHTML = '';
        render();
        LH.toast.success('Account created', F.esc(data.name) + ' can now sign in as ' + data.role + '.');
      }).catch(function (err) {
        fail((err && err.error) || 'Could not create the account.');
      });
    });
  }

  function init() {
    render();
    $('#user-search').addEventListener('input', render);
    $('#user-role').addEventListener('change', render);
    $('#user-status').addEventListener('change', render);
    var add = $('#new-user');
    if (add) add.addEventListener('click', showSheet);
  }

  LH.app.register('admin-users', init);
  LH.app.init('admin-users');
})(window.LH);
