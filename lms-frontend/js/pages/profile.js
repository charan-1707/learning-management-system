(function (LH) {
  'use strict';

  var $ = LH.dom.$, F = LH.format, UI = LH.ui, I = LH.icons;
  var M = LH.mock;

  var profileRole = document.body.getAttribute('data-role');

  var extraFields = {
    student: [
      { name: 'program', label: 'Program', value: 'B.Tech Computer Science' },
      { name: 'year', label: 'Year of study', value: '3rd Year' },
      { name: 'rollNo', label: 'Roll number', value: '21BCS2017' }
    ],
    faculty: [
      { name: 'department', label: 'Department', value: 'Computer Science' },
      { name: 'designation', label: 'Designation', value: 'Professor' },
      { name: 'officeHours', label: 'Office hours', value: 'Mon & Wed, 14:00 - 15:30' }
    ],
    admin: [
      { name: 'department', label: 'Department', value: 'Administration' },
      { name: 'role', label: 'Access level', value: 'Full access' }
    ]
  };

  function render() {
    var el = $('#profile-content');
    var user = LH.shell.getUser();
    if (!el || !user) return;

    var extra = (extraFields[profileRole] || []).map(function (f) {
      return '<div class="form-group"><label class="form-label" for="pf-' + f.name + '">' + f.label + '</label>' +
        '<input class="form-input" id="pf-' + f.name + '" name="' + f.name + '" value="' + F.esc(f.value) + '"></div>';
    }).join('');

    el.innerHTML =
      '<div class="page-header"><div class="page-title-section"><h1>Profile</h1><p>Manage your personal information and account.</p></div></div>' +

      '<section class="card" style="margin-bottom:var(--spacing-6);">' +
        '<div class="card-body" style="display:flex;align-items:center;gap:24px;flex-wrap:wrap;">' +
          '<div class="avatar avatar-lg" style="width:84px;height:84px;font-size:28px;border:3px solid var(--color-bg-secondary);box-shadow:var(--shadow-md);border-radius:50%;display:flex;align-items:center;justify-content:center;background:var(--color-primary-light);color:var(--color-primary);font-weight:700;">' + F.initials(user.name) + '</div>' +
          '<div style="flex:1;min-width:200px;">' +
            '<h2 style="font-size:20px;font-weight:700;color:var(--color-text-primary);margin-bottom:4px;">' + F.esc(user.name) + '</h2>' +
            '<div class="flex items-center" style="gap:10px;color:var(--color-text-tertiary);font-size:13px;flex-wrap:wrap;">' +
              '<span>' + F.esc(user.email) + '</span><span>&middot;</span>' +
              UI.badge(profileRole === 'admin' ? 'Administrator' : (profileRole === 'faculty' ? 'Faculty' : 'Student'), profileRole === 'student' ? 'info' : profileRole === 'faculty' ? 'success' : 'warning') +
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
                  '<input class="form-input" id="pf-phone" name="phone" value="+91 98765 43210"></div>' +
                extra +
                '<div class="form-group"><label class="form-label" for="pf-location">Location</label>' +
                  '<input class="form-input" id="pf-location" name="location" value="New Delhi, IN"></div>' +
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
              '<div class="flex justify-between" style="padding:8px 0;border-bottom:1px solid var(--color-border-light);"><span class="text-tertiary">Role</span><span style="font-weight:500;text-transform:capitalize;">' + profileRole + '</span></div>' +
              '<div class="flex justify-between" style="padding:8px 0;border-bottom:1px solid var(--color-border-light);"><span class="text-tertiary">Member since</span><span style="font-weight:500;">' + F.esc(user.joined || '12 Aug 2024') + '</span></div>' +
              '<div class="flex justify-between" style="padding:8px 0;border-bottom:1px solid var(--color-border-light);"><span class="text-tertiary">Status</span>' + UI.badge('Active', 'success') + '</div>' +
              '<div class="flex justify-between" style="padding:8px 0;"><span class="text-tertiary">Two-factor auth</span><span style="font-weight:500;color:var(--color-text-tertiary);">Off</span></div>' +
            '</div>' +
          '</section>' +
          '<section class="card" style="border-color:var(--color-danger);">' +
            '<div class="card-header"><h2 class="card-title" style="color:var(--color-danger);">Danger zone</h2></div>' +
            '<div class="card-body">' +
              '<p style="font-size:13px;color:var(--color-text-tertiary);margin-bottom:14px;">Change your password or sign out of all sessions. Destructive actions require confirmation.</p>' +
              '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
                '<button class="btn btn-secondary" id="change-password">' + I.icon('lock', 15) + ' Change password</button>' +
                '<button class="btn btn-danger" id="deactivate">' + I.icon('trash', 15) + ' Deactivate account</button>' +
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
        try {
          LH.api.profile.update(patch);
        } catch (err) { /* mock: session-only */ }
        LH.toast.success('Profile updated', 'Your changes have been saved.');
      }
    });

    $('#change-avatar').addEventListener('click', function () {
      LH.toast.info('Photo upload', 'Avatar upload is disabled in this demo build.');
    });
    $('#change-password').addEventListener('click', function () {
      LH.modal.alert('Password change is not enabled in this demo build. Password reset links are sent by the administrator.', { title: 'Change password' });
    });
    $('#deactivate').addEventListener('click', function () {
      LH.modal.confirm('This will deactivate your account and you will lose access until reactivated by an administrator.', { title: 'Deactivate account', onConfirm: function () { LH.toast.info('Request received', 'An administrator will review your request.'); } });
    });
  }

  function init() {
    render();
  }

  LH.app.register((profileRole || 'student') + '-profile', init);
  LH.app.init(profileRole + '-profile');
})(window.LH);