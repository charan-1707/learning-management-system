(function (LH) {
  'use strict';

  var $ = LH.dom.$;

  function showError(message) {
    var errEl = $('#register-error');
    if (errEl) {
      errEl.textContent = message;
      errEl.style.display = 'block';
    }
  }

  function init() {
    var form = $('#register-form');
    var eye = $('#eye-icon');
    var eyeOff = $('#eye-off-icon');
    var toggle = $('#toggle-password');
    var password = $('#reg-password');

    if (toggle && password) {
      toggle.addEventListener('click', function () {
        var show = password.type === 'password';
        password.type = show ? 'text' : 'password';
        if (eye) eye.style.display = show ? 'none' : 'block';
        if (eyeOff) eyeOff.style.display = show ? 'block' : 'none';
        toggle.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      });
    }

    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var values = {
          name: $('#reg-name') ? $('#reg-name').value : '',
          email: $('#reg-email') ? $('#reg-email').value : '',
          password: password ? password.value : ''
        };

        var errors = LH.validation.validate(values, {
          name: { required: true, message: 'Enter your full name' },
          email: { required: true, email: true, message: 'Enter your email address', emailMessage: 'Enter a valid email address' },
          password: { required: true, minLength: 8, message: 'Enter your password', minLengthMessage: 'Password must be at least 8 characters' }
        });

        if (Object.keys(errors).length > 0) {
          ['name', 'email', 'password'].forEach(function (key) {
            var field = $('#reg-' + key);
            var errEl = document.querySelector('[data-error-for="' + key + '"]');
            if (errEl) { errEl.textContent = errors[key] || ''; errEl.classList.toggle('show', !!errors[key]); }
            if (field) field.classList.toggle('error', !!errors[key]);
          });
          return;
        }

        if (!LH.live) {
          showError('Account creation is only available when connected to the server.');
          return;
        }

        LH.live.ready().then(function (enabled) {
          if (!enabled) {
            showError('Account creation is only available when connected to the server.');
            return;
          }
          var btn = $('#register-btn');
          if (btn) { btn.disabled = true; btn.textContent = 'Creating account…'; }
          LH.live.register(values.name, values.email, values.password).then(function (res) {
            if (btn) { btn.disabled = false; btn.textContent = 'Create account'; }
            if (!res.ok) {
              showError(res.message || 'Registration failed. Please try again.');
              return;
            }
            window.location.href = '../student/dashboard.html';
          });
        });
      });

      ['name', 'email', 'password'].forEach(function (name) {
        var field = $('#reg-' + name);
        if (!field) return;
        field.addEventListener('input', function () {
          field.classList.remove('error');
          var err = document.querySelector('[data-error-for="' + name + '"]');
          if (err) err.classList.remove('show');
          var regErr = $('#register-error');
          if (regErr) regErr.style.display = 'none';
        });
      });
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})(window.LH);