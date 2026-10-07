(function (LH) {
  'use strict';

  var $ = LH.dom.$;

  var TIPS = [
    'Track your attendance streak from the dashboard calendar.',
    'Submit assignments before the deadline to avoid the overdue flag.',
    'Your best quiz attempt counts toward your grade.',
    'Faculty feedback appears on your submission once it is graded.',
    'Use Forgot password anytime — the reset link lasts 15 minutes.'
  ];

  function greeting() {
    var h = new Date().getHours();
    if (h < 5) return 'Up late?';
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  function initTheme() {
    try {
      if (LH.theme) LH.theme.init();
      var btn = $('#auth-theme-toggle');
      if (btn) btn.addEventListener('click', function () {
        if (LH.theme) LH.theme.toggle();
      });
    } catch (e) { /* ignore */ }
  }

  function initTips() {
    var text = $('#auth-tip'), dots = $('#auth-tip-dots');
    if (!text) return;
    var year = $('#auth-year');
    if (year) year.textContent = new Date().getFullYear();
    var i = 0;
    if (dots) {
      dots.innerHTML = TIPS.map(function (_, k) {
        return '<span class="' + (k === 0 ? 'active' : '') + '"></span>';
      }).join('');
    }
    setInterval(function () {
      text.classList.add('fading');
      setTimeout(function () {
        i = (i + 1) % TIPS.length;
        text.textContent = TIPS[i];
        text.classList.remove('fading');
        if (dots) {
          var all = dots.querySelectorAll('span');
          all.forEach(function (d, k) { d.classList.toggle('active', k === i); });
        }
      }, 300);
    }, 5000);
  }

  function submit(email, password, btn) {
    var remember = true;
    try {
      var rm = $('#remember-me');
      remember = !rm || rm.checked;
    } catch (e) { /* ignore */ }
    return LH.api.auth.login(email, password, remember).then(function (res) {
      if (btn) btn.classList.remove('loading');
      var errEl = $('#login-error');
      if (errEl) errEl.textContent = '';

      if (!res || !res.ok) {
        if (res && res.unverified) {
          window.location.href = 'register.html?verify=1&email=' + encodeURIComponent(email.value || '');
          return;
        }
        if (errEl) {
          errEl.textContent = (res && res.suspended)
            ? 'This account has been suspended. Please contact your administrator.'
            : ((res && res.error) || 'Invalid email or password. Please try again.');
          errEl.style.display = 'block';
        }
        var e = $('#login-email');
        var p = $('#login-password');
        if (e) e.classList.add('error');
        if (p) p.classList.add('error');
        return;
      }

      var user = res.user;
      user = JSON.parse(JSON.stringify(user));
      delete user.password;

      try {
        localStorage.setItem('learnhub-user', JSON.stringify(user));
      } catch (e) { /* private browsing - session only */ }

      var target;
      if (user.role === 'student') target = '../student/dashboard.html';
      else if (user.role === 'faculty') target = '../faculty/dashboard.html';
      else target = '../admin/dashboard.html';
      window.location.href = target;
    });
  }

  function init() {
    initTheme();
    initTips();

    var greet = $('#auth-greeting');
    if (greet) greet.textContent = greeting();

    try {
      if (/[?&]registered=1(?:&|$)/.test(window.location.search)) {
        var okEl = $('#login-error');
        if (okEl) {
          okEl.textContent = 'Account created — sign in to get started.';
          okEl.style.display = 'block';
          okEl.style.color = 'var(--color-success)';
        }
      } else if (/[?&]expired=1(?:&|$)/.test(window.location.search)) {
        var expiredEl = $('#login-error');
        if (expiredEl) {
          expiredEl.textContent = 'Your session expired. Please log in again.';
          expiredEl.style.display = 'block';
        }
      }
    } catch (e) { /* ignore */ }
    var form = $('#login-form');
    var eye = $('#eye-icon');
    var eyeOff = $('#eye-off-icon');
    var toggle = $('#toggle-password');
    var password = $('#login-password');
    var email = $('#login-email');
    var caps = $('#caps-hint');

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

    if (password && caps) {
      password.addEventListener('keyup', function (e) {
        var on = false;
        try { on = e.getModifierState && e.getModifierState('CapsLock'); } catch (err) { /* ignore */ }
        caps.classList.toggle('show', !!on);
      });
      password.addEventListener('blur', function () { caps.classList.remove('show'); });
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
        var btn = $('#login-btn');
        if (btn) btn.classList.add('loading');
        submit(values.email, values.password, btn).catch(function () {
          if (btn) btn.classList.remove('loading');
          var errEl = $('#login-error');
          if (errEl) {
            errEl.textContent = 'Cannot reach the server. Check your connection and try again.';
            errEl.style.display = 'block';
          }
        });
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

    var help = $('#help-link');
    if (help) help.addEventListener('click', function (e) {
      e.preventDefault();
      LH.modal.alert('IT support: learnhub.edu.in@gmail.com\nMon - Fri, 9:00 - 18:00.', { title: 'IT support' });
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})(window.LH);
