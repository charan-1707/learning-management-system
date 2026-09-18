(function (LH) {
  'use strict';

  var $ = LH.dom.$, F = LH.format, UI = LH.ui, I = LH.icons;
  var M = LH.mock;

  var quiz = null;
  var questions = [];
  var answers = {};
  var current = 0;
  var secondsLeft = 0;
  var timerHandle = null;
  var startedAt = null;

  function pad2(n) { return n < 10 ? '0' + n : '' + n; }

  function fmtTime(secs) {
    var m = Math.floor(secs / 60);
    var s = secs % 60;
    return pad2(m) + ':' + pad2(s);
  }

  function tick() {
    secondsLeft--;
    var el = $('#timer-text');
    if (el) el.textContent = fmtTime(Math.max(0, secondsLeft));

    var box = $('#quiz-timer');
    if (box) {
      if (secondsLeft <= 60 && secondsLeft > 30) box.classList.add('warning');
      else if (secondsLeft <= 30) box.classList.add('danger');
    }

    if (secondsLeft <= 0) {
      clearInterval(timerHandle);
      submitQuiz(true);
    }
  }

  function renderQuestion() {
    var area = $('#question-area');
    if (!area) return;
    var q = questions[current];
    if (!q) return;

    area.innerHTML =
      '<div class="quiz-question active">' +
        '<div class="quiz-question-header">' +
          '<span class="quiz-question-number">Question ' + (current + 1) + ' of ' + questions.length + '</span>' +
          '<span class="badge badge-neutral">1 mark</span>' +
        '</div>' +
        '<div class="quiz-question-text">' + F.esc(q.q) + '</div>' +
        '<div class="quiz-options" role="radiogroup" aria-label="Answer options">' +
        q.options.map(function (opt, i) {
          var selected = answers[current] === i;
          return '<div class="quiz-option' + (selected ? ' selected' : '') + '" data-option="' + i + '" role="radio" aria-checked="' + selected + '" tabindex="0">' +
            '<span class="quiz-option-input"></span>' +
            '<span class="quiz-option-text">' + F.esc(opt) + '</span>' +
          '</div>';
        }).join('') +
        '</div>' +
      '</div>';

    area.querySelectorAll('.quiz-option').forEach(function (opt) {
      function select() {
        answers[current] = Number(opt.getAttribute('data-option'));
        area.querySelectorAll('.quiz-option').forEach(function (o) {
          o.classList.remove('selected');
          o.setAttribute('aria-checked', 'false');
        });
        opt.classList.add('selected');
        opt.setAttribute('aria-checked', 'true');
        renderNav();
      }
      opt.addEventListener('click', select);
      opt.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          select();
        }
      });
    });

    $('#prev-question').disabled = current === 0;
    $('#next-question').textContent = '';
    $('#next-question').innerHTML = '';
    $('#next-question').appendChild(document.createTextNode(current === questions.length - 1 ? 'Review ' : 'Next '));
    appendSvg($('#next-question'));
  }

  function appendSvg(btn) {
    var svg = document.createElement('span');
    svg.style.cssText = 'display:flex;';
    svg.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
    btn.appendChild(svg);
  }

  function renderNav() {
    var nav = $('#question-nav');
    if (!nav) return;

    nav.innerHTML = questions.map(function (q, i) {
      var cls = 'quiz-nav-dot';
      if (i === current) cls += ' active';
      else if (answers[i] != null) cls += ' answered';
      return '<button class="' + cls + '" data-goto="' + i + '" aria-label="Go to question ' + (i + 1) + '">' + (i + 1) + '</button>';
    }).join('');

    nav.querySelectorAll('[data-goto]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        current = Number(btn.getAttribute('data-goto'));
        renderQuestion();
        renderNav();
      });
    });

    var answered = Object.keys(answers).length;
    $('#answered-count').textContent = answered;
  }

  function renderHeader() {
    $('#quiz-title').textContent = quiz.title;
    var courseBadge = $('#quiz-course');
    if (courseBadge) {
      courseBadge.innerHTML = '';
      var css = 'background:var(--color-primary-light);color:var(--color-primary);border-radius:4px;padding:2px 8px;font-size:12px;font-weight:600;';
      courseBadge.innerHTML = '<span style="' + css + '">' + F.esc(quiz.course) + '</span>';
    }
    $('#quiz-meta').textContent = questions.length + ' questions \u00B7 ' + quiz.duration + ' minutes';
    $('#total-count').textContent = questions.length;
  }

  function startTimer() {
    secondsLeft = quiz.duration * 60;
    startedAt = Date.now();
    $('#timer-text').textContent = fmtTime(secondsLeft);
    timerHandle = setInterval(tick, 1000);
  }

  function stopTimer() {
    if (timerHandle) clearInterval(timerHandle);
  }

  function goNext() {
    if (current < questions.length - 1) {
      current++;
      renderQuestion();
      renderNav();
    } else {
      openSubmitConfirm();
    }
  }

  function openSubmitConfirm() {
    var answered = Object.keys(answers).length;
    LH.modal.confirm(
      'You have answered ' + answered + ' of ' + questions.length + ' questions. ' + ((questions.length - answered) ? (questions.length - answered) + ' question(s) unanswered. ' : '') + 'Submit now?',
      {
        title: 'Submit quiz',
        confirmText: 'Submit now',
        variant: 'primary',
        onConfirm: function () { submitQuiz(false); }
      }
    );
  }

  function calcScore() {
    var score = 0;
    questions.forEach(function (q, i) {
      if (answers[i] === q.answer) score++;
    });
    return score;
  }

  function submitQuiz(auto) {
    stopTimer();
    var score = calcScore();
    var total = questions.length;
    var pct = Math.round(score / total * 100);

    if (quiz.bestScore) {
      var prev = quiz.bestScore.split('/');
      var prevNum = Number(prev[0]);
      if (score > prevNum) quiz.bestScore = score + '/' + total;
    } else {
      quiz.bestScore = score + '/' + total;
    }
    quiz.taken = true;
    quiz.attempts++;

    var details = '';
    if (auto) details = 'Your time ran out. The quiz was submitted automatically.';

    var body =
      '<div style="text-align:center;padding:16px 0;">' +
        '<div style="width:96px;height:96px;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;background:' + (pct >= 60 ? 'var(--color-success-light)' : pct >= 40 ? 'var(--color-warning-light)' : 'var(--color-danger-light)') + ';color:' + (pct >= 60 ? 'var(--color-success)' : pct >= 40 ? 'var(--color-warning)' : 'var(--color-danger)') + ';font-size:26px;font-weight:700;">' + pct + '%</div>' +
        '<h3 style="font-size:18px;font-weight:700;color:var(--color-text-primary);margin-bottom:6px;">' + (pct >= 60 ? 'Great job!' : pct >= 40 ? 'Keep practicing' : 'Review the material') + '</h3>' +
        '<p style="font-size:14px;color:var(--color-text-tertiary);margin-bottom:16px;">You scored <strong style="color:var(--color-text-primary);">' + score + '/' + total + '</strong> correct answers.</p>' +
        (details ? '<p style="font-size:13px;color:var(--color-warning);margin-bottom:12px;">' + details + '</p>' : '') +
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;text-align:center;background:var(--color-bg-tertiary);border-radius:12px;padding:14px;">' +
          '<div><div style="font-weight:700;color:var(--color-success);">' + score + '</div><div style="font-size:12px;color:var(--color-text-tertiary);">Correct</div></div>' +
          '<div><div style="font-weight:700;color:var(--color-danger);">' + (total - score) + '</div><div style="font-size:12px;color:var(--color-text-tertiary);">Incorrect</div></div>' +
          '<div><div style="font-weight:700;color:var(--color-primary);">' + UI.badge(F.gradeLetter(pct), F.gradeColor(pct)) + '</div><div style="font-size:12px;color:var(--color-text-tertiary);">Grade</div></div>' +
        '</div>' +
      '</div>';

    var modal = LH.modal.open(body, {
      title: 'Quiz submitted' + (auto ? ' — time up' : ''),
      width: '460px',
      focus: false,
      onOpen: function () {}
    });

    /* Close button returns to list; allow one follow-up */
    setTimeout(function () {
      var actions = modal.overlay.querySelector('.modal-body');
      if (actions) {
        var wrapper = document.createElement('div');
        wrapper.style.cssText = 'margin-top:18px;text-align:center;';
        wrapper.innerHTML = '<a class="btn btn-secondary" href="quizzes.html" style="margin-right:8px;">Back to quizzes</a>' +
          '<a class="btn btn-primary" href="quiz-attempt.html?id=' + quiz.id + '">Review answers</a>';
        actions.appendChild(wrapper);
      }
      addReviewLink(modal);
    }, 100);

    LH.toast.success('Quiz submitted', 'Your result for ' + quiz.title + ' is ' + score + '/' + total + '.');
  }

  function addReviewLink(modal) {
    var closeBtn = modal.overlay.querySelector('[data-modal-close]');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        setTimeout(function () {
          window.location.href = 'quizzes.html';
        }, 250);
      });
    }
  }

  function init() {
    var id = LH.app.param('id');
    quiz = M.quizzes.filter(function (q) { return q.id === id; })[0] || M.quizzes[0];
    questions = M.quizQuestions[quiz.id] || [];
    if (!questions.length) questions = M.quizQuestions.q1;

    renderHeader();
    renderQuestion();
    renderNav();
    startTimer();

    $('#prev-question').addEventListener('click', function () {
      if (current > 0) {
        current--;
        renderQuestion();
        renderNav();
      }
    });
    $('#next-question').addEventListener('click', goNext);
    $('#submit-quiz').addEventListener('click', openSubmitConfirm);

    window.addEventListener('beforeunload', function (e) {
      if (timerHandle) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
  }

  LH.app.register('student-quiz-attempt', init);
  LH.app.init('student-quiz-attempt');
})(window.LH);