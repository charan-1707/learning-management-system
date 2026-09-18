(function (LH) {
  'use strict';

  var $ = LH.dom.$, F = LH.format, D = LH.date, UI = LH.ui, I = LH.icons;
  var M = LH.mock;
  var MAX_QUESTIONS = 10;

  function facultyId() {
    var u = LH.shell.getUser();
    return u ? u.id : 101;
  }

  function taughtIds() {
    var list = LH.api.courses.byInstructorId(facultyId());
    if (!list || !list.length) list = LH.api.courses.byInstructor('Dr. Priya Sharma');
    return list.map(function (c) { return c.id; });
  }

  function coursesTaught() {
    var ids = taughtIds();
    return M.courses.filter(function (c) { return ids.indexOf(c.id) !== -1; });
  }

  function renderList() {
    var el = $('#quiz-faculty-list');
    if (!el) return;

    var ids = taughtIds();
    var list = M.quizzes.filter(function (q) { return ids.indexOf(q.courseId) !== -1; })
      .sort(function (a, b) { return new Date(a.due) - new Date(b.due); });

    if (!list.length) {
      el.innerHTML = UI.emptyState('quizzes', 'No quizzes yet', 'Create a quiz to assess your students.');
      return;
    }

    el.innerHTML = list.map(function (q) {
      var status = D.isOverdue(q.due) ? UI.badge('Closed', 'neutral') : UI.badge('Open', 'success');
      var attempted = q.attempts != null ? ' &middot; attempts ' + q.attempts : '';
      return '<section class="card">' +
        '<div class="card-body" style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">' +
          '<div class="activity-icon warning">' + I.icon('quizzes') + '</div>' +
          '<div style="flex:1;min-width:180px;">' +
            '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><span style="font-size:15px;font-weight:600;color:var(--color-text-primary);">' + F.esc(q.title) + '</span>' + status + '</div>' +
            '<div style="font-size:13px;color:var(--color-text-muted);margin-top:3px;">' + F.esc(q.course) + ' &middot; ' + q.questions + ' questions &middot; ' + q.duration + ' min' + attempted + '</div>' +
          '</div>' +
          '<button class="btn btn-sm btn-ghost" data-delete="' + q.id + '">' + I.icon('trash', 14) + '</button>' +
        '</div>' +
      '</section>';
    }).join('');

    el.querySelectorAll('[data-delete]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-delete');
        var item = M.quizzes.filter(function (q) { return q.id === id; })[0];
        if (!item) return;
        LH.modal.confirm('Delete quiz "' + item.title + '"? Student attempts will be lost. This cannot be undone.', {
          title: 'Delete quiz',
          onConfirm: function () {
            LH.api.quizzes.remove(id);
            renderList();
            LH.toast.success('Quiz deleted', 'The quiz was removed.');
          }
        });
      });
    });
  }

  function buildSheet() {
    var host = $('#quiz-sheet');
    var opts = '<option value="">Select course</option>' + coursesTaught().map(function (c) { return '<option value="' + c.id + '">' + F.esc(c.name) + '</option>'; }).join('');

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
          '<label class="form-label" style="display:flex;align-items:center;gap:8px;">' +
            '<input type="radio" class="checkbox-input" name="qq-' + qi + '-correct" value="' + oi + '" ' + (q.answer === oi ? 'checked' : '') + '>' +
            '<span>' + answerLabel(oi) + '.</span>' +
          '</label>' +
          '<input class="form-input" value="' + F.esc(o) + '" placeholder="Option ' + answerLabel(oi) + '"></div>';
      }).join('');

    return '<section class="card" data-qcard="' + qi + '">' +
      '<div class="card-header flex items-center justify-between">' +
        '<h4 style="font-size:14px;font-weight:600;color:var(--color-text-primary);">Question ' + (qi + 1) + '</h4>' +
        (qi > 0 ? '<button class="btn btn-sm btn-danger-ghost" data-remove-q="' + qi + '">' + I.icon('trash', 14) + '</button>' : '') +
      '</div>' +
      '<div class="card-body" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;">' + optsHtml + '</div>' +
    '</section>';
  }

  function freshQuestions() {
    return [
      { text: 'Which of the following is a linear data structure?', options: ['Tree', 'Graph', 'Stack', 'Heap'], answer: 2 },
      { text: 'The complexity of binary search in the worst case is', options: ['O(log n)', 'O(n)', 'O(n log n)', 'O(n\u00b2)'], answer: 0 },
      { text: 'A queue follows which principle?', options: ['LIFO', 'FIFO', 'LIFO+Priority', 'Random access'], answer: 1 }
    ];
  }

  function showSheet() {
    var s = buildSheet();
    var host = s.host;
    var questions = freshQuestions();

    var qList = $('#question-list');
    function renderQuestions() {
      qList.innerHTML = questions.map(function (q, qi) { return questionCard(q, qi); }).join('');
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
      questions.push({ text: 'Untitled question', options: ['Option A', 'Option B', 'Option C', 'Option D'], answer: 0 });
      renderQuestions();
    });

    host.scrollIntoView({ behavior: 'smooth', block: 'start' });

    $('#fq-cancel').addEventListener('click', function () { host.hidden = true; host.innerHTML = ''; });

    $('#fq-publish').addEventListener('click', function () {
      var title = $('#fq-title').value.trim();
      var courseId = $('#fq-course').value;
      if (!title) { LH.toast.error('Missing title', 'Give the quiz a title.'); return; }
      if (!courseId) { LH.toast.error('Select a course', 'Choose which course this quiz belongs to.'); return; }

      var course = M.courses.filter(function (c) { return c.id === courseId; })[0];
      var qid = 'q' + (M.quizzes.length + 1);
      var pushQ = questions.map(function (q, i) {
        return {
          id: i + 1,
          type: 'multiple',
          text: q.text,
          options: q.options,
          answer: q.answer,
          explanation: ''
        };
      });

      LH.api.quizzes.replaceQuestions(qid, pushQ);
      LH.api.quizzes.include({
        id: qid,
        title: title,
        courseId: courseId,
        course: course ? (course.short || course.name) : '',
        questions: pushQ.length,
        duration: parseInt($('#fq-time').value, 10) || 15,
        attemptsMax: parseInt($('#fq-attempts').value, 10) || 2,
        attempts: 0,
        bestScore: null,
        status: 'available',
        due: new Date($('#fq-due').value + 'T23:59:00').toISOString(),
        taken: false
      });

      host.hidden = true;
      host.innerHTML = '';
      renderList();
      LH.toast.success('Quiz published', 'The quiz is now open for students.');
    });
  }

  function init() {
    renderList();
    $('#new-quiz').addEventListener('click', showSheet);
  }

  LH.app.register('faculty-quizzes', init);
  LH.app.init('faculty-quizzes');
})(window.LH);