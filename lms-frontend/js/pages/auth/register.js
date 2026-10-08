(function (LH) {
  'use strict';

  var $ = LH.dom.$;
  var pendingEmail = '';
  var cooldownUntil = 0;
  var cooldownTimer = null;

  function showError(id, msg) {
    var el = $(id);
    if (el) { el.textContent = msg; el.style.display = 'block'; }
  }

  function showOtpStep(email, notice) {
    pendingEmail = email || pendingEmail;
    var form = $('#register-form'), otp = $('#otp-form');
    if (form) form.style.display = 'none';
    if (otp) otp.style.display = 'block';
    var head = document.querySelector('.auth-heading');
    if (head) head.textContent = 'Check your inbox';
    var sub = document.querySelector('.auth-subheading');
    if (sub) sub.textContent = 'Enter the 6-digit code sent to ' + pendingEmail + '.';
    var hint = $('#otp-hint');
    if (hint) {
      hint.textContent = notice || '';
      hint.classList.toggle('show', !!notice);
    }
    var code = $('#otp-code');
    if (code) { code.value = ''; code.focus(); }
    startCooldown(60);
  }

  function startCooldown(secs) {
    cooldownUntil = Date.now() + secs * 1000;
    var label = $('#otp-cooldown'), btn = $('#otp-resend');
    if (cooldownTimer) clearInterval(cooldownTimer);
    function tick() {
      var left = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
      if (label) {
        label.style.display = left ? 'inline' : 'none';
        label.textContent = left ? ' (' + left + 's)' : '';
      }
      if (btn) btn.disabled = left > 0;
      if (!left && cooldownTimer) { clearInterval(cooldownTimer); cooldownTimer = null; }
    }
    tick();
    cooldownTimer = setInterval(tick, 1000);
  }

  function signInWith(res) {
    var user = res.user || {};
    try { user = JSON.parse(JSON.stringify(user)); } catch (e) { /* ignore */ }
    try { delete user.password; } catch (e) { /* ignore */ }
    try { localStorage.setItem('learnhub-user', JSON.stringify(user)); } catch (e) { /* ignore */ }
    window.location.href = '../student/dashboard.html';
  }

  function initRegister() {
    var form = $('#register-form');
    if (!form) return;
    var name = $('#reg-name'), email = $('#reg-email'),
        password = $('#reg-password'), confirm = $('#reg-confirm');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var values = {
        name: name ? name.value.trim() : '',
        email: email ? email.value.trim() : '',
        password: password ? password.value : '',
        confirm: confirm ? confirm.value : ''
      };
      var errors = LH.validation.validate(values, {
        name: { required: true, message: 'Enter your full name' },
        email: { required: true, email: true, message: 'Enter your email address', emailMessage: 'Enter a valid email address' },
        password: { required: true, minLength: 4, message: 'Password must be at least 4 characters' },
        confirm: { required: true, message: 'Confirm your password' }
      });
      if (values.password && values.confirm && values.password !== values.confirm) {
        errors.confirm = 'Passwords do not match.';
      }
      ['name', 'email', 'password', 'confirm'].forEach(function (k) {
        var err = document.querySelector('[data-error-for="' + k + '"]');
        if (err) { err.textContent = errors[k] || ''; err.classList.toggle('show', !!errors[k]); }
      });
      if (Object.keys(errors).length > 0) return;

      var btn = $('#register-btn');
      if (btn) btn.disabled = true;
      LH.api.auth.register(values.name, values.email, values.password).then(function (res) {
        if (btn) btn.disabled = false;
        if (!res || !res.ok) {
          showError('#register-error', (res && res.error) || 'Registration failed. Please try again.');
          return;
        }
        if (res.token && res.user) {
          /* Verification disabled server-side: session is already stored by
             the API layer — go straight to the dashboard by role. */
          var role = res.user.role;
          window.location.href = role === 'faculty' ? '../faculty/dashboard.html'
            : role === 'admin' ? '../admin/dashboard.html'
            : '../student/dashboard.html';
          return;
        }
        /* No tokens yet: the inbox owns this address until the code proves it. */
        showOtpStep(res.email || values.email, 'A verification code is on its way.');
      }).catch(function (err) {
        if (btn) btn.disabled = false;
        showError('#register-error', (err && err.error) || 'Cannot reach the server. Check your connection and try again.');
      });
    });
  }

  function initOtp() {
    var form = $('#otp-form');
    if (!form) return;
    var code = $('#otp-code');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var raw = code ? code.value.replace(/[\s-]/g, '') : '';
      var err = document.querySelector('[data-error-for="code"]');
      if (!/^\d{6}$/.test(raw)) {
        if (err) { err.textContent = 'Enter the 6-digit code from your email.'; err.classList.add('show'); }
        return;
      }
      if (err) { err.textContent = ''; err.classList.remove('show'); }
      var btn = $('#otp-btn');
      if (btn) btn.disabled = true;
      LH.api.auth.verifyOtp(pendingEmail, raw).then(function (res) {
        if (btn) btn.disabled = false;
        if (!res || !res.ok) {
          showError('#otp-error', (res && res.error) || 'Verification failed. Please try again.');
          return;
        }
        signInWith(res);
      }).catch(function (er) {
        if (btn) btn.disabled = false;
        showError('#otp-error', (er && er.error) || 'Cannot reach the server. Check your connection and try again.');
      });
    });

    var resend = $('#otp-resend');
    if (resend) resend.addEventListener('click', function () {
      if (resend.disabled || !pendingEmail) return;
      resend.disabled = true;
      LH.api.auth.resendOtp(pendingEmail).then(function (res) {
        if (!res || !res.ok) {
          resend.disabled = false;
          showError('#otp-error', (res && res.error) || 'Could not resend the code. Try again shortly.');
          return;
        }
        showOtpStep(pendingEmail, 'A fresh code is on its way.');
      }).catch(function (er) {
        resend.disabled = false;
        showError('#otp-error', (er && er.error) || 'Could not resend the code. Try again shortly.');
      });
    });
  }

  function init() {
    try {
      if (LH.theme) LH.theme.init();
      var themeBtn = $('#auth-theme-toggle');
      if (themeBtn) themeBtn.addEventListener('click', function () { if (LH.theme) LH.theme.toggle(); });
    } catch (e) { /* ignore */ }
    initRegister();
    initOtp();
    /* Deep link from login when an unverified account signs in. */
    try {
      var q = window.location.search || '';
      var m = q.match(/[?&]email=([^&]+)/);
      if (/[?&]verify=1(?:&|$)/.test(q) && m) {
        showOtpStep(decodeURIComponent(m[1].replace(/\+/g, ' ')), 'This address is not verified yet — enter the code to continue.');
      }
    } catch (e) { /* ignore */ }
  }

  document.addEventListener('DOMContentLoaded', init);
})(window.LH);
