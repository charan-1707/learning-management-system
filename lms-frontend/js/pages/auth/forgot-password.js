(function (LH) {
  'use strict';

  var $ = LH.dom.$;

  function init() {
    try {
      if (LH.theme) LH.theme.init();
      var themeBtn = $('#auth-theme-toggle');
      if (themeBtn) themeBtn.addEventListener('click', function () { if (LH.theme) LH.theme.toggle(); });
    } catch (e) { /* ignore */ }
    var form = $('#forgot-form');
    if (!form) return;
    var email = $('#forgot-email');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var value = email ? email.value.trim() : '';
      var errors = LH.validation.validate({ email: value }, {
        email: { required: true, email: true, message: 'Enter your email address', emailMessage: 'Enter a valid email address' }
      });
      var err = document.querySelector('[data-error-for="email"]');
      if (err) { err.textContent = errors.email || ''; err.classList.toggle('show', !!errors.email); }
      if (errors.email) return;

      var btn = $('#forgot-btn'), errEl = $('#forgot-error'), okEl = $('#forgot-success');
      if (errEl) errEl.style.display = 'none';
      if (okEl) okEl.style.display = 'none';
      if (btn) btn.disabled = true;
      LH.api.auth.forgotPassword(value).then(function () {
        if (btn) btn.disabled = false;
        if (okEl) {
          okEl.textContent = 'If an account uses this email, a reset link is on its way (valid 15 minutes).';
          okEl.style.display = 'block';
        }
        form.reset();
      }).catch(function () {
        if (btn) btn.disabled = false;
        if (errEl) { errEl.textContent = 'Cannot reach the server. Check your connection and try again.'; errEl.style.display = 'block'; }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})(window.LH);
