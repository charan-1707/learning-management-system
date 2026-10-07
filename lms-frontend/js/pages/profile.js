(function (LH) {
  'use strict';

  var $ = LH.dom.$, F = LH.format, D = LH.date, UI = LH.ui, I = LH.icons;
  var M = LH.mock;

  var profileRole = document.body.getAttribute('data-role');

  /* Role-specific editable fields, bound to live user properties. */
  function extraFieldsFor(role, user) {
    if (role === 'student') {
      return [
        { name: 'program', label: 'Program', value: user.program },
        { name: 'yearLabel', label: 'Year of study', value: user.yearLabel }
      ];
    }
    if (role === 'faculty') {
      return [
        { name: 'dept', label: 'Department', value: user.dept },
        { name: 'title', label: 'Designation', value: user.title }
      ];
    }
    return [
      { name: 'dept', label: 'Department', value: user.dept }
    ];
  }

  var EDITABLE = ['name', 'email', 'phone', 'location', 'program', 'yearLabel', 'dept', 'title'];

  async function render(overrideUser) {
    var el = $('#profile-content');
    if (!el) return;
    var user = overrideUser || null;
    if (!user) {
      try { user = await LH.api.users.me(); } catch (e) { /* fall back to cache */ }
    }
    if (!user) user = LH.shell.getUser();
    if (!user) return;
    if (user.role) profileRole = user.role;

    var extra = extraFieldsFor(profileRole, user).map(function (f) {
      return '<div class="form-group"><label class="form-label" for="pf-' + f.name + '">' + f.label + '</label>' +
        '<input class="form-input" id="pf-' + f.name + '" name="' + f.name + '" value="' + F.esc(f.value || '') + '" placeholder="—"></div>';
    }).join('');

    var roleLabel = profileRole === 'admin' ? 'Administrator' : (profileRole === 'faculty' ? 'Faculty' : 'Student');
    var statusBadge = UI.statusBadge(user.status || 'active');
    var joined = user.joinedLabel || (user.createdAt ? D.format(user.createdAt) : '—');
    var lastActive = user.lastActive || user.lastActiveAt ? D.relative(user.lastActive || user.lastActiveAt) : '—';

    el.innerHTML =
      '<div class="page-header"><div class="page-title-section"><h1>Profile</h1><p>Manage your personal information and account.</p></div></div>' +

      '<section class="card" style="margin-bottom:var(--spacing-6);">' +
        '<div class="card-body" style="display:flex;align-items:center;gap:24px;flex-wrap:wrap;">' +
          '<span class="pf-photo">' + UI.avatar(user.name, 'lg', LH.api.fileUrl(user.avatarUrl)) + '</span>' +
          '<div style="flex:1;min-width:200px;">' +
            '<h2 style="font-size:20px;font-weight:700;color:var(--color-text-primary);margin-bottom:4px;">' + F.esc(user.name) + '</h2>' +
            '<div class="flex items-center" style="gap:10px;color:var(--color-text-tertiary);font-size:13px;flex-wrap:wrap;">' +
              '<span>' + F.esc(user.email) + '</span><span>&middot;</span>' +
              UI.badge(roleLabel, profileRole === 'student' ? 'info' : profileRole === 'faculty' ? 'success' : 'warning') +
            '</div>' +
          '</div>' +
          '<div style="text-align:right;">' +
            '<button class="btn btn-secondary" id="change-avatar">' + I.icon('image', 15) + ' Change photo</button>' +
          '</div>' +
        '</div>' +
      '</section>' +

      '<div class="dash-col">' +
        '<section class="card">' +
          '<div class="card-header"><h2 class="card-title">Personal information</h2><p class="card-subtitle">Editable profile fields</p></div>' +
          '<div class="card-body">' +
            '<form id="profile-form" novalidate>' +
              '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;">' +
                '<div class="form-group"><label class="form-label" for="pf-name">Full name</label>' +
                  '<input class="form-input" id="pf-name" name="name" value="' + F.esc(user.name) + '">' +
                  '<div class="form-error" data-error-for="name"></div></div>' +
                '<div class="form-group"><label class="form-label" for="pf-email">Email address</label>' +
                  '<input class="form-input" id="pf-email" name="email" value="' + F.esc(user.email) + '">' +
                  '<div class="form-error" data-error-for="email"></div></div>' +
                '<div class="form-group"><label class="form-label" for="pf-phone">Phone</label>' +
                  '<input class="form-input" id="pf-phone" name="phone" value="' + F.esc(user.phone || '') + '" placeholder="—"></div>' +
                extra +
                '<div class="form-group"><label class="form-label" for="pf-location">Location</label>' +
                  '<input class="form-input" id="pf-location" name="location" value="' + F.esc(user.location || '') + '" placeholder="—"></div>' +
              '</div>' +
              '<div style="display:flex;gap:12px;padding-top:8px;">' +
                '<button class="btn btn-primary" type="submit">' + I.icon('check', 15) + ' Save changes</button>' +
                '<button class="btn btn-secondary" type="reset">Cancel</button>' +
              '</div>' +
            '</form>' +
          '</div>' +
        '</section>' +

        '<div class="stack">' +
          '<section class="card">' +
            '<div class="card-header"><h2 class="card-title">Account information</h2></div>' +
            '<div class="card-body" style="font-size:13.5px;">' +
            '<div class="flex justify-between" style="padding:8px 0;border-bottom:1px solid var(--color-border-light);"><span class="text-tertiary">Role</span><span style="font-weight:500;text-transform:capitalize;">' + F.esc(user.role || profileRole) + '</span></div>' +
            '<div class="flex justify-between" style="padding:8px 0;border-bottom:1px solid var(--color-border-light);"><span class="text-tertiary">Member since</span><span style="font-weight:500;">' + F.esc(joined) + '</span></div>' +
            '<div class="flex justify-between" style="padding:8px 0;border-bottom:1px solid var(--color-border-light);"><span class="text-tertiary">Status</span>' + statusBadge + '</div>' +
            '<div class="flex justify-between" style="padding:8px 0;"><span class="text-tertiary">Last active</span><span style="font-weight:500;">' + F.esc(lastActive) + '</span></div>' +
            '</div>' +
          '</section>' +
          '<section class="card">' +
            '<div class="card-header"><h2 class="card-title">Security</h2></div>' +
            '<div class="card-body">' +
              '<p style="font-size:13px;color:var(--color-text-tertiary);margin-bottom:14px;">Change your password or sign out everywhere. To deactivate your account, contact your administrator.</p>' +
              '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
                '<button class="btn btn-secondary" id="change-password">' + I.icon('lock', 15) + ' Change password</button>' +
                '<button class="btn btn-secondary" id="logout-all">' + I.icon('logout', 15) + ' Log out all devices</button>' +
              '</div>' +
            '</div>' +
          '</section>' +
        '</div>' +
      '</div>';

    var form = $('#profile-form');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var res = LH.validation.form(form, {
        name: { required: true, message: 'Full name is required' },
        email: { required: true, email: true, message: 'Email is required', emailMessage: 'Enter a valid email address' }
      });
      if (res.valid) {
        var patch = { name: res.values.name, email: res.values.email };
        EDITABLE.forEach(function (k) {
          if (k === 'name' || k === 'email') return;
          var input = form.querySelector('[name="' + k + '"]');
          if (input) patch[k] = input.value;
        });
        LH.api.profile.update(patch).then(function (saved) {
          LH.toast.success('Profile updated', 'Your changes have been saved.');
          try { if (LH.shell.syncSession) LH.shell.syncSession(); } catch (e) { /* ignore */ }
          render(saved || undefined);
        }).catch(function (err) {
          LH.toast.error('Update failed', (err && err.error) || 'Your changes could not be saved.');
        });
      }
    });

    $('#change-avatar').addEventListener('click', function () {
      var input = document.createElement('input');
      input.type = 'file';
      input.accept = '.png,.jpg,.jpeg,.gif,.webp';
      input.addEventListener('change', function () {
        if (!input.files || !input.files.length) return;
        var file = input.files[0];
        if (file.size > 5 * 1024 * 1024) {
          LH.toast.error('File too large', file.name + ' exceeds the 5 MB limit.');
          return;
        }
        LH.toast.info('Uploading', 'Uploading your photo...');
        LH.api.profile.avatar(file).then(function (res) {
          if (!res || !res.ok) throw (res && res.error) || 'upload failed';
          LH.toast.success('Photo updated', 'Your profile picture has been updated.');
          try { if (LH.shell.syncSession) LH.shell.syncSession(); } catch (e) { /* ignore */ }
          render(res.user || undefined);
        }).catch(function (err) {
          LH.toast.error('Upload failed', (err && err.error) || 'Your photo could not be uploaded.');
        });
      });
      input.click();
    });
    $('#change-password').addEventListener('click', function () {
      var modal = LH.modal.open(
        '<div class="form-group"><label class="form-label" for="pw-current">Current password</label>' +
          '<input class="form-input" id="pw-current" type="password" autocomplete="current-password"></div>' +
        '<div class="form-group"><label class="form-label" for="pw-next">New password (min 4 characters)</label>' +
          '<input class="form-input" id="pw-next" type="password" autocomplete="new-password"></div>' +
        '<div class="form-error" data-pw-error style="display:none;"></div>' +
        '<div class="modal-footer" style="display:flex;justify-content:flex-end;gap:10px;padding:16px 0 0;">' +
          '<button class="btn btn-secondary" data-pw-cancel>Cancel</button>' +
          '<button class="btn btn-primary" data-pw-save>Change password</button>' +
        '</div>',
        { title: 'Change password', width: '440px' });
      var overlay = modal.overlay;
      function fail(msg) {
        var err = overlay.querySelector('[data-pw-error]');
        if (err) { err.textContent = msg; err.style.display = 'block'; }
      }
      overlay.querySelector('[data-pw-cancel]').addEventListener('click', function () { LH.modal.close(); });
      overlay.querySelector('[data-pw-save]').addEventListener('click', function () {
        var current = overlay.querySelector('#pw-current').value;
        var next = overlay.querySelector('#pw-next').value;
        if (!current) { fail('Enter your current password.'); return; }
        if (!next || next.length < 4) { fail('New password must be at least 4 characters.'); return; }
        LH.api.users.changePassword(current, next).then(function (d) {
          if (!d || !d.ok) throw (d && d.error) || 'change failed';
          LH.modal.close();
          LH.toast.success('Password changed', 'Use your new password next time you log in.');
        }).catch(function (err) {
          fail((err && err.error) || err || 'Password could not be changed.');
        });
      });
    });
    var logoutAll = $('#logout-all');
    if (logoutAll) logoutAll.addEventListener('click', function () {
      LH.modal.confirm('Sign out on all devices, including this one? You will need to log in again.', {
        title: 'Log out everywhere',
        variant: 'primary',
        confirmText: 'Log out everywhere',
        onConfirm: function () {
          LH.api.auth.logoutAll().then(function () {
            window.location.href = '../auth/login.html?expired=1';
          }).catch(function () {
            window.location.href = '../auth/login.html?expired=1';
          });
        }
      });
    });
  }

  function init() {
    render();
  }

  LH.app.register((profileRole || 'student') + '-profile', init);
  LH.app.init(profileRole + '-profile');
})(window.LH);