(function (LH) {
  'use strict';

  var $ = LH.dom.$;

  function showError(message) {
    var errEl = $('#login-error');
    if (errEl) {
      errEl.textContent = message;
      errEl.style.display = 'block';
    }
    var e = $('#login-email');
    var p = $('#login-password');
    if (e) e.classList.add('error');
    if (p) p.classList.add('error');
  }

  function redirectByRole(role) {
    var target;
    if (role === 'student') target = '../student/dashboard.html';
    else if (role === 'faculty') target = '../faculty/dashboard.html';
    else target = '../admin/dashboard.html';
    window.location.href = target;
  }

  function submitMock(email, password) {
    var res = LH.api.auth.login(email, password);
    if (!res.ok) {
      showError(res.suspended ? 'Your account has been disabled.' : 'Invalid email or password. Please try the demo accounts below.');
      return;
    }
    var user = JSON.parse(JSON.stringify(res.user));
    delete user.password;
    try {
      localStorage.setItem('learnhub-user', JSON.stringify(user));
    } catch (e) { /* private browsing - session only */ }
    redirectByRole(user.role);
  }

  function submitLive(email, password) {
    var btn = $('#login-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Signing in…'; }
    LH.live.login(email, password).then(function (res) {
      if (btn) { btn.disabled = false; btn.textContent = 'Sign in'; }
      if (!res.ok) {
        showError(res.message || 'Sign in failed. Please try again.');
        return;
      }
      redirectByRole(res.user.role);
    });
  }

  function submit(email, password, remember) {
    if (LH.live) {
      LH.live.ready().then(function (enabled) {
        if (enabled) submitLive(email, password);
        else submitMock(email, password);
      });
      return;
    }
    submitMock(email, password);
  }

  function init() {
    var form = $('#login-form');
    var eye = $('#eye-icon');
    var eyeOff = $('#eye-off-icon');
    var toggle = $('#toggle-password');
    var password = $('#login-password');
    var email = $('#login-email');

    try {
      var prev = localStorage.getItem('learnhub-user');
      if (prev) {
        var u = JSON.parse(prev);
        if (u && u.email && email) email.value = u.email;
      }
    } catch (e) { /* ignore */ }

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
        var values = { email: email ? email.value : '', password: password ? password.value : '' };
        var errors = LH.validation.validate(values, {
          email: { required: true, email: true, message: 'Enter your email address', emailMessage: 'Enter a valid email address' },
          password: { required: true, message: 'Enter your password' }
        });
        if (Object.keys(errors).length > 0) {
          var errEmail = $('[data-error-for="email"]');
          var errPass = $('[data-error-for="password"]');
          if (errEmail) { errEmail.textContent = errors.email || ''; errEmail.classList.toggle('show', !!errors.email); }
          if (errPass) { errPass.textContent = errors.password || ''; errPass.classList.toggle('show', !!errors.password); }
          if (email) email.classList.toggle('error', !!errors.email);
          if (password) password.classList.toggle('error', !!errors.password);
          return;
        }
        submit(values.email, values.password);
      });

      [email, password].forEach(function (el) {
        if (!el) return;
        el.addEventListener('input', function () {
          el.classList.remove('error');
          var err = document.querySelector('[data-error-for="' + el.name + '"]');
          if (err) err.classList.remove('show');
          var loginErr = $('#login-error');
          if (loginErr) loginErr.style.display = 'none';
        });
      });
    }

    document.querySelectorAll('[data-demo-email]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (email) email.value = btn.getAttribute('data-demo-email');
        if (password) password.value = btn.getAttribute('data-demo-password');
        if (email) email.classList.remove('error');
        if (password) password.classList.remove('error');
        var err = $('#login-error');
        if (err) err.style.display = 'none';
        if (email) email.focus();
      });
    });

    if (LH.live) {
      LH.live.ready().then(function (enabled) {
        if (!enabled) return;
        var demo = document.querySelector('.auth-demo');
        if (demo) demo.style.display = 'none';
        var regRow = $('#register-row');
        if (regRow) regRow.style.display = '';
      });
    }

    var forgot = $('#forgot-link');
    if (forgot) forgot.addEventListener('click', function (e) {
      e.preventDefault();
      LH.modal.alert('Password reset is not enabled in this demo build. Ask your administrator to reset your password.', { title: 'Forgot password' });
    });

    var help = $('#help-link');
    if (help) help.addEventListener('click', function (e) {
      e.preventDefault();
      LH.modal.alert('IT support: helpdesk@learnhub.edu\nMon - Fri, 9:00 - 18:00.', { title: 'IT support' });
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})(window.LH);