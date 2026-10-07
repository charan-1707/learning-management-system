(function (LH) {
  'use strict';

  var $ = LH.dom.$, UI = LH.ui, F = LH.format, D = LH.date, DB = LH.db, I = LH.icons;
  var M = LH.mock;

  function studentId() {
    var u = LH.shell.getUser();
    return u ? u.id : 201;
  }

  async function catalogData() {
    var rows = await Promise.all([
      LH.api.courses.search(''),
      LH.api.enrollments.forStudent(studentId()),
      LH.api.grades.list().catch(function () { return []; })
    ]);
    var enrMap = {};
    rows[1].forEach(function (row) {
      if (row.course) enrMap[row.course.id] = row.enrollment;
    });
    var gradesByCourse = {};
    rows[2].forEach(function (g) {
      (gradesByCourse[g.courseId] = gradesByCourse[g.courseId] || []).push(g);
    });
    return { courses: rows[0], enrMap: enrMap, gradesByCourse: gradesByCourse };
  }

  function gradePctFor(courseGrades) {
    if (!courseGrades || !courseGrades.length) return null;
    var sum = 0, n = 0;
    courseGrades.forEach(function (g) {
      if (g.score != null && g.max) { sum += (g.score / g.max) * 100; n++; }
    });
    return n ? Math.round(sum / n) : null;
  }

  async function cardFor(c, enr, courseGrades) {
    var prog = null;
    if (enr) {
      prog = await LH.api.enrollments.progress(studentId(), c.id).catch(function () { return null; });
      if (!prog && enr.progressPercent != null) {
        prog = { percent: enr.progressPercent, completed: 0, total: 0 };
      }
    }
    var percent = prog ? prog.percent : (c.progress || 0);
    return UI.courseCard(Object.assign({}, c, {
      progress: percent,
      modulesDone: prog ? prog.completed : 0,
      modulesTotal: prog ? prog.total : 0,
      gradePct: gradePctFor(courseGrades),
      updated: D.relative(c.updated || c.createdAt || new Date()),
      enrolled: !!enr
    }), enr ? 'student' : 'catalog');
  }

  async function renderSection(gridId, countId, list, enrMap, gradesByCourse, emptyTitle, emptySub) {
    var grid = $(gridId);
    var count = $(countId);
    if (!grid) return;
    if (!list.length) {
      grid.innerHTML = UI.emptyState('courses', emptyTitle, emptySub);
      if (count) count.textContent = '';
      return;
    }
    var cards = await Promise.all(list.map(function (c) {
      return cardFor(c, enrMap[c.id], gradesByCourse[c.id]);
    }));
    grid.innerHTML = cards.join('');
    if (count) count.textContent = '· ' + list.length + (list.length === 1 ? ' course' : ' courses');
    grid.querySelectorAll('[data-enroll-course]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cid = btn.getAttribute('data-enroll-course');
        btn.disabled = true;
        LH.api.enrollments.enroll(studentId(), cid).then(function (res) {
          if (!res || !res.ok) {
            btn.disabled = false;
            LH.toast.error('Cannot enroll', (res && res.error) || 'Enrollment failed.');
            return;
          }
          LH.toast.success('Enrolled', 'You are now enrolled. Happy learning!');
          applyFilters();
        });
      });
    });
  }

  async function applyFilters() {
    var q = ($('#course-search').value || '').toLowerCase();
    var filter = $('#course-filter').value;
    var cat = $('#course-category').value;
    var data = await catalogData();

    var matched = data.courses.filter(function (c) {
      var matchQ = !q || (c.name || '').toLowerCase().indexOf(q) !== -1 || (c.code || '').toLowerCase().indexOf(q) !== -1 || (c.instructor || '').toLowerCase().indexOf(q) !== -1;
      if (!matchQ) return false;
      return !cat || cat === 'all' || (c.category || '') === cat;
    });
    var enrolled = matched.filter(function (c) { return !!data.enrMap[c.id]; });
    var available = matched.filter(function (c) { return !data.enrMap[c.id]; });
    if (filter === 'in-progress' || filter === 'completed' || filter === 'critical') {
      enrolled = enrolled.filter(function (c) {
        var enr = data.enrMap[c.id];
        var prog = enr && enr.progressPercent != null ? enr.progressPercent : 0;
        if (filter === 'in-progress') return prog > 0 && prog < 100;
        if (filter === 'completed') return prog >= 100;
        return prog < 25;
      });
    }
    var total = $('#course-count');
    if (total) total.textContent = enrolled.length + ' enrolled · ' + available.length + ' available';
    await renderSection('#enrolled-grid', '#enrolled-count', enrolled,
      data.enrMap, data.gradesByCourse, 'Nothing here', 'No enrolled courses match these filters.');
    await renderSection('#available-grid', '#available-count', available,
      data.enrMap, data.gradesByCourse, 'No matches', 'Try a different search or category.');
  }

  function init() {
    var q = LH.app.param('q');
    var search = $('#course-search');
    if (q && search) search.value = q;

    applyFilters();

    search.addEventListener('input', applyFilters);
    $('#course-filter').addEventListener('change', applyFilters);
    $('#course-category').addEventListener('change', applyFilters);
    var sg = $('#suggest-course');
    if (sg) sg.addEventListener('click', openSuggest);
  }

  function openSuggest() {
    var modal = LH.modal.open(
      '<div class="form-group"><label class="form-label" for="sg-q">What do you want to learn?</label>' +
        '<input class="form-input" id="sg-q" placeholder="e.g. machine learning, databases, networks"></div>' +
      '<div id="sg-results"><p style="font-size:13px;color:var(--color-text-tertiary);">Type a topic above and hit Find courses.</p></div>' +
      '<div class="modal-footer" style="display:flex;justify-content:flex-end;gap:10px;padding:16px 0 0;">' +
        '<button class="btn btn-secondary" data-sg-close>Close</button>' +
        '<button class="btn btn-primary" data-sg-go>Find courses</button>' +
      '</div>',
      { title: 'Suggest a course', width: '560px' });
    var overlay = modal.overlay;
    overlay.querySelector('[data-sg-close]').addEventListener('click', function () { LH.modal.close(); });
    function run() {
      var q = overlay.querySelector('#sg-q').value.trim().toLowerCase();
      if (q.length < 2) {
        overlay.querySelector('#sg-results').innerHTML =
          '<p style="font-size:13px;color:var(--color-text-tertiary);">Type at least 2 characters.</p>';
        return;
      }
      Promise.all([
        LH.api.courses.search(q).catch(function () { return []; }),
        LH.api.enrollments.forStudent(studentId()).catch(function () { return []; })
      ]).then(function (parts) {
        var enrolled = {};
        parts[1].forEach(function (r) { if (r.course) enrolled[r.course.id] = true; });
        var scored = parts[0].filter(function (c) { return !enrolled[c.id]; }).map(function (c) {
          var score = 0;
          if ((c.name || '').toLowerCase().indexOf(q) !== -1) score += 3;
          if ((c.code || '').toLowerCase().indexOf(q) !== -1) score += 2;
          if ((c.category || '').toLowerCase().indexOf(q) !== -1) score += 2;
          if ((c.description || '').toLowerCase().indexOf(q) !== -1) score += 1;
          return { c: c, score: score };
        }).filter(function (x) { return x.score > 0; })
          .sort(function (a, b) { return b.score - a.score; }).slice(0, 3);
        var box = overlay.querySelector('#sg-results');
        if (!scored.length) {
          box.innerHTML = '<p style="font-size:13px;color:var(--color-text-tertiary);">No unenrolled courses match — try different keywords or browse below.</p>';
          return;
        }
        box.innerHTML = scored.map(function (x) {
          return '<div class="activity-item" style="align-items:center;">' +
            '<div class="activity-icon primary">' + I.icon('courses') + '</div>' +
            '<div class="activity-content"><div class="activity-title" style="font-size:13px;">' + F.esc(x.c.name) + '</div>' +
            '<div class="activity-meta">' + F.esc(x.c.code || '') + ' &middot; ' + F.esc(x.c.category || '') + '</div></div>' +
            '<button class="btn btn-sm btn-primary" data-sg-enroll="' + x.c.id + '">Enroll</button>' +
          '</div>';
        }).join('');
        box.querySelectorAll('[data-sg-enroll]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var cid = btn.getAttribute('data-sg-enroll');
            LH.api.enrollments.enroll(studentId(), cid).then(function (res) {
              if (!res || !res.ok) {
                LH.toast.error('Cannot enroll', (res && res.error) || 'Enrollment failed.');
                return;
              }
              btn.textContent = 'Enrolled';
              btn.disabled = true;
              LH.toast.success('Enrolled', 'You are now enrolled.');
              applyFilters();
            });
          });
        });
      });
    }
    overlay.querySelector('[data-sg-go]').addEventListener('click', run);
    overlay.querySelector('#sg-q').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); run(); }
    });
  }

  LH.app.register('student-courses', init);
  LH.app.init('student-courses');
})(window.LH);