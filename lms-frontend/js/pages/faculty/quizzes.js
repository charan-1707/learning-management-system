(function (LH) {
  'use strict';

  var $ = LH.dom.$, F = LH.format, D = LH.date, UI = LH.ui, I = LH.icons;
  var M = LH.mock;
  var MAX_QUESTIONS = 10;

  function facultyId() {
    var u = LH.shell.getUser();
    return u ? u.id : 101;
  }

  async function taught() {
    var list = await LH.api.courses.byInstructorId(facultyId());
    if (!list || !list.length) list = await LH.api.courses.byInstructor('Dr. Priya Sharma');
    return list;
  }

  async function taughtIds() {
    return (await taught()).map(function (c) { return c.id; });
  }

  async function coursesTaught() {
    return taught();
  }

  async function renderList() {
    var el = $('#quiz-faculty-list');
    if (!el) return;

    var ids = await taughtIds();
    var all = await LH.api.quizzes.list().catch(function () { return []; });
    var list = all.filter(function (q) { return ids.indexOf(q.courseId) !== -1; })
      .sort(function (a, b) { return new Date(a.due) - new Date(b.due); });

    if (!list.length) {
      el.innerHTML = UI.emptyState('quizzes', 'No quizzes yet', 'Create a quiz to assess your students.');
      return;
    }

    el.innerHTML = list.map(function (q) {
      var status = D.isOverdue(q.due) ? UI.badge('Closed', 'neutral') : '';
      var attempted = q.attempts != null ? ' &middot; attempts ' + q.attempts : '';
      return '<section class="card">' +
        '<div class="card-body" style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">' +
          '<div class="activity-icon warning">' + I.icon('quizzes') + '</div>' +
          '<div style="flex:1;min-width:180px;">' +
            '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><span style="font-size:15px;font-weight:600;color:var(--color-text-primary);">' + F.esc(q.title) + '</span>' + status + '</div>' +
            '<div style="font-size:13px;color:var(--color-text-muted);margin-top:3px;">' + F.esc(q.course) + ' &middot; ' + q.questions + ' questions &middot; ' + q.duration + ' min' + attempted + '</div>' +
          '</div>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
          '<button class="btn btn-sm btn-secondary" data-view="' + q.id + '">View</button>' +
          '<button class="btn btn-sm btn-ghost" data-delete="' + q.id + '">' + I.icon('trash', 14) + '</button>' +
          '</div>' +
        '</div>' +
      '</section>';
    }).join('');

    el.querySelectorAll('[data-view]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openView(btn.getAttribute('data-view'));
      });
    });

    el.querySelectorAll('[data-delete]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-delete');
        LH.api.quizzes.get(id).catch(function () { return null; }).then(function (item) {
          if (!item) return;
          LH.modal.confirm('Delete quiz "' + item.title + '"? Student attempts will be lost. This cannot be undone.', {
            title: 'Delete quiz',
            onConfirm: function () {
              LH.api.quizzes.remove(id).then(function () {
                renderList();
                LH.toast.success('Quiz deleted', 'The quiz was removed.');
              });
            }
          });
        });
      });
    });
  }

  function openView(id) {
    Promise.all([
      LH.api.quizzes.get(id).catch(function () { return null; }),
      LH.api.quizzes.questions(id).catch(function () { return []; }),
      LH.api.quizzes.attempts(id).catch(function () { return []; })
    ]).then(function (parts) {
      var q = parts[0], qs = parts[1] || [], att = parts[2] || [];
      if (!q) { LH.toast.error('Not found', 'This quiz may have been removed.'); return; }

      var avg = att.length
        ? Math.round(att.reduce(function (s, a) { return s + (a.pct || 0); }, 0) / att.length)
        : null;
      var best = att.length
        ? Math.max.apply(null, att.map(function (a) { return a.pct || 0; }))
        : null;
      var statsHtml = att.length
        ? '<div style="display:flex;gap:36px;flex-wrap:wrap;margin:14px 0 18px;padding:14px 18px;background:var(--color-bg-tertiary);border-radius:12px;">' +
          '<div><div style="font-size:24px;font-weight:700;">' + att.length + '</div><div class="text-xs text-tertiary">Attempts</div></div>' +
          '<div><div style="font-size:24px;font-weight:700;">' + avg + '%</div><div class="text-xs text-tertiary">Average score</div></div>' +
          '<div><div style="font-size:24px;font-weight:700;color:var(--color-primary);">' + best + '%</div><div class="text-xs text-tertiary">Best score</div></div>' +
          '</div>'
        : '<p style="font-size:13px;color:var(--color-text-tertiary);margin:12px 0;">No attempts yet — statistics will appear here.</p>';

      var qHtml = qs.length ? qs.map(function (item, i) {
        var opts = (item.options || []).map(function (o, oi) {
          var right = item.answer === oi;
          return '<li style="font-size:13px;padding:3px 0;color:' + (right ? 'var(--color-success)' : 'var(--color-text-secondary)') + ';font-weight:' + (right ? '600' : '400') + ';">' +
            answerLabel(oi) + '. ' + F.esc(o) + (right ? ' ✓' : '') + '</li>';
        }).join('');
        return '<div style="margin-bottom:12px;"><div style="font-size:13px;font-weight:600;margin-bottom:4px;">Q' + (i + 1) + '. ' + F.esc(item.q || item.question) + '</div>' +
          '<ul style="list-style:none;margin:0;padding:0;">' + opts + '</ul></div>';
      }).join('') : '<p style="font-size:13px;color:var(--color-text-tertiary);">No questions yet.</p>';

      var modal = LH.modal.open(
        '<p style="font-size:13px;color:var(--color-text-tertiary);margin-bottom:14px;">' +
          F.esc(q.course || '') + ' &middot; ' + q.questions + ' questions &middot; ' + q.duration + ' min</p>' +
        '<div id="qv-stats">' + statsHtml + '</div>' +
        (att.length
          ? '<h4 style="font-size:14px;font-weight:600;margin:14px 0 8px;">Attempts by student</h4>' +
            '<div class="table-wrapper" style="max-height:300px;overflow:auto;margin:14px 0 8px;border:1px solid var(--color-border-light);border-radius:10px;"><table class="table">' +
            '<thead><tr><th>Student</th><th>Score</th><th>Percentage</th><th>Date</th></tr></thead><tbody>' +
            att.map(function (a) {
              var p = a.pct != null ? a.pct : (a.total ? Math.round(a.score / a.total * 100) : 0);
              return '<tr><td style="font-weight:500;">' + F.esc(a.studentName || ('#' + a.studentId)) + '</td>' +
                '<td>' + a.score + ' / ' + a.total + '</td>' +
                '<td style="font-weight:600;">' + p + '%</td>' +
                '<td class="text-tertiary">' + D.format(a.submittedAt) + '</td></tr>';
            }).join('') + '</tbody></table></div>'
          : '') +
        '<div class="form-group"><label class="form-label" for="qv-title">Title</label>' +
          '<input class="form-input" id="qv-title" value="' + F.esc(q.title) + '"></div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:6px;">' +
          '<div class="form-group"><label class="form-label" for="qv-time">Minutes</label>' +
            '<input class="form-input" id="qv-time" type="number" min="1" value="' + (q.durationMin != null ? q.durationMin : (q.duration || 15)) + '"></div>' +
          '<div class="form-group"><label class="form-label" for="qv-attempts">Attempts</label>' +
            '<input class="form-input" id="qv-attempts" type="number" min="1" value="' + (q.attemptsMax || 2) + '"></div>' +
          '<div class="form-group"><label class="form-label" for="qv-due">Open until</label>' +
            '<input class="form-input" id="qv-due" type="date" value="' + (q.dueAt || q.due ? String(q.dueAt || q.due).slice(0, 10) : '') + '"></div>' +
        '</div>' +
        '<h4 style="font-size:14px;font-weight:600;margin:18px 0 10px;">Questions &amp; answer key</h4>' +
        '<div style="max-height:320px;overflow:auto;border:1px solid var(--color-border-light);border-radius:10px;padding:14px 16px;margin-bottom:8px;">' + qHtml + '</div>' +
        (att.length
          ? '<p style="font-size:12px;color:var(--color-warning);">Attempts recorded — questions are locked. Delete and recreate to change them.</p>'
          : '<p style="font-size:12px;color:var(--color-text-tertiary);">No attempts yet. To change questions, delete and recreate this quiz.</p>') +
        '<div class="form-error" data-qv-error style="display:none;"></div>' +
        '<div class="modal-footer" style="display:flex;justify-content:flex-end;gap:10px;padding:20px 0 0;">' +
          '<button class="btn btn-secondary" data-qv-cancel>Cancel</button>' +
          '<button class="btn btn-primary" data-qv-save>Save changes</button>' +
        '</div>',
        { title: 'Quiz details', width: '760px' });
      var overlay = modal.overlay;
      overlay.querySelector('[data-qv-cancel]').addEventListener('click', function () { LH.modal.close(); });
      overlay.querySelector('[data-qv-save]').addEventListener('click', function () {
        var title = overlay.querySelector('#qv-title').value.trim();
        if (!title) {
          var err0 = overlay.querySelector('[data-qv-error]');
          if (err0) { err0.textContent = 'Give the quiz a title.'; err0.style.display = 'block'; }
          return;
        }
        var dueRaw = overlay.querySelector('#qv-due').value;
        LH.api.quizzes.update(id, {
          title: title,
          durationMin: parseInt(overlay.querySelector('#qv-time').value, 10) || 15,
          attemptsMax: parseInt(overlay.querySelector('#qv-attempts').value, 10) || 2,
          dueAt: dueRaw ? new Date(dueRaw + 'T23:59:00') : null
        }).then(function () {
          LH.modal.close();
          renderList();
          LH.toast.success('Quiz updated', 'Your changes have been saved.');
        }).catch(function (err) {
          var err2 = overlay.querySelector('[data-qv-error]');
          var msg = (err && err.error) || 'Your changes could not be saved.';
          if (err2) { err2.textContent = msg; err2.style.display = 'block'; }
          else LH.toast.error('Save failed', msg);
        });
      });
    });
  }

  async function buildSheet() {
    var host = $('#quiz-sheet');
    var opts = '<option value="">Select course</option>' + (await coursesTaught()).map(function (c) { return '<option value="' + c.id + '">' + F.esc(c.name) + '</option>'; }).join('');

    host.hidden = false;
    host.innerHTML =
      '<section class="card" style="margin-bottom:var(--spacing-6);">' +
        '<div class="card-header"><h2 class="card-title">New quiz</h2><p class="card-subtitle">Configure the quiz and add questions</p></div>' +
        '<div class="card-body">' +
          '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;">' +
            '<div class="form-group" style="grid-column:1 / -1;"><label class="form-label" for="fq-title">Title</label>' +
              '<input class="form-input" id="fq-title" placeholder="e.g. Sorting &amp; Complexity">' +
              '<div class="form-error" data-error-for="title"></div></div>' +
            '<div class="form-group"><label class="form-label" for="fq-course">Course</label>' +
              '<select class="form-input form-select" id="fq-course">' + opts + '</select></div>' +
            '<div class="form-group"><label class="form-label" for="fq-due">Open until</label>' +
              '<input class="form-input" id="fq-due" type="date" value="' + D.toInput(D.relativeDays(7)) + '"></div>' +
            '<div class="form-group"><label class="form-label" for="fq-time">Time limit (min)</label>' +
              '<input class="form-input" id="fq-time" type="number" min="5" max="60" value="15"></div>' +
            '<div class="form-group"><label class="form-label" for="fq-attempts">Attempts allowed</label>' +
              '<select class="form-input form-select" id="fq-attempts"><option value="1">1</option><option value="2" selected>2</option><option value="3">3</option></select></div>' +
          '</div>' +

          '<div style="display:flex;align-items:center;justify-content:space-between;margin:20px 0 12px;border-top:1px solid var(--color-border-light);padding-top:16px;">' +
            '<h3 style="font-size:15px;font-weight:600;color:var(--color-text-primary);">Questions</h3>' +
            '<button class="btn btn-sm btn-secondary" id="add-question">' + I.icon('plus', 14) + ' Add question</button>' +
          '</div>' +
          '<div class="stack" id="question-list"></div>' +

          '<div style="display:flex;gap:10px;margin-top:20px;">' +
            '<button class="btn btn-primary" id="fq-publish">' + I.icon('check', 15) + ' Publish quiz</button>' +
            '<button class="btn btn-secondary" id="fq-cancel">Cancel</button>' +
          '</div>' +
        '</div>' +
      '</section>';

    return { host: host, opts: opts };
  }

  function answerLabel(i) {
    return String.fromCharCode(65 + i);
  }

  function questionCard(q, qi) {
    var optsHtml = '<div class="form-group" style="grid-column:1 / -1;"><label class="form-label" for="qq-' + qi + '-text">Question</label>' +
      '<input class="form-input" id="qq-' + qi + '-text" value="' + F.esc(q.text) + '"></div>' +
      q.options.slice(0, 4).map(function (o, oi) {
        return '<div class="form-group">' +
          '<label class="form-label" style="display:flex;align-items:center;gap:8px;cursor:pointer;">' +
            '<input type="radio" name="qq-' + qi + '-correct" value="' + oi + '" title="Mark as the correct answer" style="width:17px;height:17px;accent-color:var(--color-primary);cursor:pointer;flex-shrink:0;" ' + (q.answer === oi ? 'checked' : '') + '>' +
            '<span>' + answerLabel(oi) + '.</span>' +
          '</label>' +
          '<input class="form-input" data-qopt="' + oi + '" value="' + F.esc(o) + '" placeholder="Option ' + answerLabel(oi) + '"></div>';
      }).join('');

    return '<section class="card" data-qcard="' + qi + '">' +
      '<div class="card-header flex items-center justify-between">' +
        '<h4 style="font-size:14px;font-weight:600;color:var(--color-text-primary);">Question ' + (qi + 1) + '</h4>' +
        (qi > 0 ? '<button class="btn btn-sm btn-danger-ghost" data-remove-q="' + qi + '">' + I.icon('trash', 14) + '</button>' : '') +
      '</div>' +
      '<div class="card-body" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;">' + optsHtml + '</div>' +
    '</section>';
  }

  function blankQuestion() {
    return { text: '', options: ['', '', '', ''], answer: null };
  }

  function freshQuestions() {
    return [blankQuestion()];
  }

  async function showSheet() {
    var s = await buildSheet();
    var host = s.host;
    var questions = freshQuestions();

    var qList = $('#question-list');
    function renderQuestions() {
      qList.innerHTML = questions.map(function (q, qi) { return questionCard(q, qi); }).join('');
      qList.querySelectorAll('[data-qcard]').forEach(function (card) {
        var qi = parseInt(card.getAttribute('data-qcard'), 10);
        var textEl = card.querySelector('#qq-' + qi + '-text');
        if (textEl) textEl.addEventListener('input', function () { questions[qi].text = textEl.value; });
        card.querySelectorAll('[data-qopt]').forEach(function (inp) {
          inp.addEventListener('input', function () {
            questions[qi].options[parseInt(inp.getAttribute('data-qopt'), 10)] = inp.value;
          });
        });
        card.querySelectorAll('input[name="qq-' + qi + '-correct"]').forEach(function (r) {
          r.addEventListener('change', function () {
            if (r.checked) questions[qi].answer = parseInt(r.value, 10);
          });
        });
      });
      qList.querySelectorAll('[data-remove-q]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          questions.splice(parseInt(btn.getAttribute('data-remove-q'), 10), 1);
          if (!questions.length) questions = freshQuestions();
          renderQuestions();
        });
      });
    }
    renderQuestions();

    $('#add-question').addEventListener('click', function () {
      if (questions.length >= MAX_QUESTIONS) { LH.toast.info('Limit reached', 'A quiz can have at most ' + MAX_QUESTIONS + ' questions.'); return; }
      questions.push(blankQuestion());
      renderQuestions();
    });

    host.scrollIntoView({ behavior: 'smooth', block: 'start' });

    $('#fq-cancel').addEventListener('click', function () { host.hidden = true; host.innerHTML = ''; });

    function collectQuestions() {
      /* Source of truth is the rendered form (edits are not synced to state). */
      var out = [];
      qList.querySelectorAll('[data-qcard]').forEach(function (card) {
        var qi = parseInt(card.getAttribute('data-qcard'), 10);
        var textEl = card.querySelector('#qq-' + qi + '-text');
        var opts = [];
        card.querySelectorAll('[data-qopt]').forEach(function (inp) { opts.push(inp.value.trim()); });
        var checked = card.querySelector('input[name="qq-' + qi + '-correct"]:checked');
        out.push({
          text: textEl ? textEl.value.trim() : '',
          options: opts,
          answer: checked ? parseInt(checked.value, 10) : null
        });
      });
      return out;
    }

    $('#fq-publish').addEventListener('click', function () {
      var title = $('#fq-title').value.trim();
      var courseId = $('#fq-course').value;
      if (!title) { LH.toast.error('Missing title', 'Give the quiz a title.'); return; }
      if (!courseId) { LH.toast.error('Select a course', 'Choose which course this quiz belongs to.'); return; }

      var collected = collectQuestions();
      if (!collected.length) { LH.toast.error('No questions', 'Add at least one question.'); return; }
      for (var i = 0; i < collected.length; i++) {
        var cq = collected[i];
        if (!cq.text) { LH.toast.error('Question ' + (i + 1) + ' is empty', 'Write the question text.'); return; }
        if (cq.options.length !== 4 || cq.options.some(function (o) { return !o; })) {
          LH.toast.error('Question ' + (i + 1) + ' incomplete', 'Fill in all 4 options.');
          return;
        }
        if (cq.answer == null || cq.answer < 0 || cq.answer > 3) {
          LH.toast.error('Question ' + (i + 1) + ' has no answer', 'Tick the radio of the correct option.');
          return;
        }
      }
      var pushQ = collected.map(function (q) {
        return { q: q.text, options: q.options, answer: q.answer };
      });
      var dueRaw = $('#fq-due').value;

      LH.api.courses.get(courseId).catch(function () { return null; }).then(function (course) {
        return LH.api.quizzes.include({
          courseId: courseId,
          title: title,
          course: course ? (course.short || course.name) : '',
          questions: pushQ.length,
          duration: parseInt($('#fq-time').value, 10) || 15,
          attemptsMax: parseInt($('#fq-attempts').value, 10) || 2,
          attempts: 0,
          bestScore: null,
          status: 'available',
          due: dueRaw ? new Date(dueRaw + 'T23:59:00').toISOString() : null
        });
      }).then(function (created) {
        return LH.api.quizzes.replaceQuestions(created.id, pushQ);
      }).then(function () {
        host.hidden = true;
        host.innerHTML = '';
        renderList();
        LH.toast.success('Quiz published', 'The quiz is now open for students.');
      }).catch(function (err) {
        LH.toast.error('Publish failed', (err && err.error) || 'The quiz could not be published.');
      });
    });
  }

  async function init() {
    await renderList();
    $('#new-quiz').addEventListener('click', showSheet);
  }

  LH.app.register('faculty-quizzes', init);
  LH.app.init('faculty-quizzes');
})(window.LH);