(function (LH) {
  'use strict';

  var $ = LH.dom.$;

  function init() {
    try {
      if (LH.theme) LH.theme.init();
      var themeBtn = $('#auth-theme-toggle');
      if (themeBtn) themeBtn.addEventListener('click', function () { if (LH.theme) LH.theme.toggle(); });
    } catch (e) { /* ignore */ }
    var form = $('#reset-form');
    if (!form) return;
    var token = null;
    try {
      token = LH.app.param('token');
    } catch (e) { /* ignore */ }
    if (!token) {
      var errEl = $('#reset-error');
      if (errEl) { errEl.textContent = 'This reset link is missing its token. Request a new one from the forgot-password page.'; errEl.style.display = 'block'; }
      var btn = $('#reset-btn');
      if (btn) btn.disabled = true;
      return;
    }

    var password = $('#reset-password'), confirm = $('#reset-confirm');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var values = {
        password: password ? password.value : '',
        confirm: confirm ? confirm.value : ''
      };
      var errors = LH.validation.validate(values, {
        password: { required: true, minLength: 4, message: 'Password must be at least 4 characters' },
        confirm: { required: true, message: 'Confirm your new password' }
      });
      if (values.password && values.confirm && values.password !== values.confirm) {
        errors.confirm = 'Passwords do not match.';
      }
      ['password', 'confirm'].forEach(function (k) {
        var err = document.querySelector('[data-error-for="' + k + '"]');
        if (err) { err.textContent = errors[k] || ''; err.classList.toggle('show', !!errors[k]); }
      });
      if (Object.keys(errors).length > 0) return;

      var btn = $('#reset-btn'), errEl = $('#reset-error'), okEl = $('#reset-success');
      if (errEl) errEl.style.display = 'none';
      if (btn) btn.disabled = true;
      LH.api.auth.resetPassword(token, values.password).then(function (d) {
        if (btn) btn.disabled = false;
        if (!d || !d.ok) throw (d && d.error) || 'reset failed';
        if (okEl) {
          okEl.innerHTML = 'Password updated. <a href="login.html">Sign in with your new password</a>.';
          okEl.style.display = 'block';
        }
        form.reset();
      }).catch(function (err) {
        if (btn) btn.disabled = false;
        if (errEl) { errEl.textContent = (err && err.error) || err || 'This link is invalid or expired. Request a new one.'; errEl.style.display = 'block'; }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})(window.LH);
