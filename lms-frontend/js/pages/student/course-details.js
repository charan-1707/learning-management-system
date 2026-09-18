(function (LH) {
  'use strict';

  var $ = LH.dom.$, F = LH.format, D = LH.date, UI = LH.ui, I = LH.icons, DB = LH.db;
  var M = LH.mock;

  var accents = {
    blue: { bg: 'rgba(37,99,235,0.14)' },
    green: { bg: 'rgba(5,150,105,0.14)' },
    purple: { bg: 'rgba(124,58,237,0.14)' },
    orange: { bg: 'rgba(217,119,6,0.14)' },
    teal: { bg: 'rgba(13,148,136,0.14)' },
    red: { bg: 'rgba(220,38,38,0.14)' }
  };

  var course = null;

  function uid() {
    var u = LH.shell.getUser();
    return u ? u.id : 201;
  }

  function isEnrolled() {
    return DB.enrollments.isEnrolled(uid(), course.id);
  }

  function liveProgress() {
    return DB.progressFor(uid(), course.id);
  }

  function completedLessonIds() {
    var ids = {};
    DB.list('lessonProgress').forEach(function (lp) {
      if (lp.studentId === uid()) ids[lp.lessonId] = true;
    });
    return ids;
  }

  function tabContentMarkup(type) {
    var map = { pdf: 'PDF', video: 'Video', link: 'Resource', image: 'Image' };
    return UI.badge(map[type] || 'File', type === 'video' ? 'info' : type === 'pdf' ? 'danger' : type === 'link' ? 'warning' : 'neutral');
  }

  function enrollBtnMarkup() {
    return '<button class="btn btn-sm btn-primary" data-enroll-course>' + I.icon('plus', 14) + ' Enroll now</button>';
  }

  function renderBanner() {
    var el = $('#course-banner');
    var accent = accents[course.accent] || accents.blue;
    var probj = null;
    if (isEnrolled()) {
      DB.progressFor(uid(), course.id);
      var enr = DB.enrollments.forStudent(uid()).filter(function (r) { return r.course && r.course.id === course.id; })[0];
      probj = enr ? enr.enrollment : null;
    }
    var live = isEnrolled() ? liveProgress() : { percent: course.progress || 0, completed: 0, total: 0 };
    var pct = probj && probj.progressPercent != null ? probj.progressPercent : live.percent;

    el.innerHTML =
      '<section class="card" style="overflow:hidden;">' +
        '<div style="height:120px;background:' + accent.bg + ';border-bottom:1px solid var(--color-border-light);background-image:linear-gradient(135deg,' + accent.bg + ',transparent);"></div>' +
        '<div class="card-body" style="margin-top:-56px;">' +
          '<div style="display:flex;gap:20px;align-items:flex-start;flex-wrap:wrap;">' +
            '<div class="course-card-image" style="width:120px;height:120px;flex-shrink:0;border-radius:12px;border:4px solid var(--color-bg-secondary);box-shadow:var(--shadow-md);background:' + accent.bg + ';display:flex;align-items:center;justify-content:center;">' +
              '<span style="font-weight:700;color:var(--color-text-secondary);letter-spacing:.04em;text-align:center;padding:8px;">' + F.esc(course.code) + '</span>' +
            '</div>' +
            '<div style="flex:1;min-width:240px;padding-top:8px;">' +
              '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:6px;">' +
                '<span class="badge badge-primary">' + F.esc(course.code) + '</span>' +
                '<span class="badge badge-neutral">' + F.esc(course.semester || '') + '</span>' +
                '<span class="badge badge-neutral">' + course.credits + ' credits</span>' +
                (course.status === 'draft' ? '<span class="badge badge-neutral">' + F.esc(course.status) + '</span>' : '') +
              '</div>' +
              '<h1 style="font-size:24px;font-weight:700;letter-spacing:-0.02em;color:var(--color-text-primary);margin-bottom:6px;">' + F.esc(course.name) + '</h1>' +
              '<div style="display:flex;align-items:center;gap:8px;color:var(--color-text-tertiary);font-size:13px;">' +
                UI.avatar(course.instructor, 'sm') + '<span>' + F.esc(course.instructor) + '</span>' +
                '<span>&middot;</span><span>Updated ' + F.esc(course.updated || '') + '</span>' +
              '</div>' +
            '</div>' +
            '<div style="width:260px;padding-top:8px;" id="banner-progress"></div>' +
          '</div>' +
        '</div>' +
      '</section>';

    var bp = $('#banner-progress');
    if (bp) {
      bp.innerHTML =
        '<div class="flex items-center justify-between" style="margin-bottom:8px;">' +
          '<span style="font-size:13px;color:var(--color-text-tertiary);">' + (isEnrolled() ? 'Your progress' : 'Course progress') + '</span>' +
          '<span style="font-size:14px;font-weight:700;color:var(--color-primary);">' + pct + '%</span></div>' +
        UI.progress(pct) +
        '<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">' +
          (isEnrolled()
            ? '<a class="btn btn-sm btn-primary" href="#materials" data-go-materials>' + I.icon('play', 14) + ' Continue learning</a>'
            : enrollBtnMarkup()) +
          '<button class="btn btn-sm btn-secondary" data-share-course>' + I.icon('send', 14) + ' Share</button>' +
        '</div>';
      var shareEl = bp.querySelector('[data-share-course]');
      if (shareEl) shareEl.addEventListener('click', function () {
        LH.toast.success('Link copied', course.name + ' course link copied to clipboard.');
      });
      var enrollEl = bp.querySelector('[data-enroll-course]');
      if (enrollEl) enrollEl.addEventListener('click', function () { handleEnroll(); });
    }
  }

  function handleEnroll() {
    var res = DB.enrollments.enroll(uid(), course.id);
    if (!res.ok) {
      LH.toast.error('Cannot enroll', res.error || 'Enrollment failed.');
      return;
    }
    LH.toast.success('Enrolled', 'You are now enrolled in ' + course.name + '.');
    renderBanner();
    renderPanels();
  }

  function lockedPanel(name) {
    return '<div class="card-header"><h2 class="card-title">' + F.esc(name) + '</h2></div>' +
      '<div class="card-body">' + UI.emptyState('lock', name + ' locked', 'Enroll in this course to access ' + name.toLowerCase() + '.') + '</div>';
  }

  function renderOverview() {
    var el = $('#overview-panel');
    if (!el) return;

    var assigned = DB.list('assignments').filter(function (a) { return a.courseId === course.id; });
    var quiz = DB.list('quizzes').filter(function (q) { return q.courseId === course.id; });
    var live = isEnrolled() ? liveProgress() : { total: DB.lessons.countForCourse(course.id), completed: 0, percent: 0 };
    var modules = DB.modules.forCourse(course.id);

    el.innerHTML =
      '<div class="card-header"><h2 class="card-title">About this course</h2></div>' +
      '<div class="card-body">' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;margin-bottom:24px;">' +
          '<div><div class="text-xs" style="text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted);margin-bottom:4px;">Course code</div><div style="font-weight:600;font-size:14px;">' + F.esc(course.code) + '</div></div>' +
          '<div><div class="text-xs" style="text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted);margin-bottom:4px;">Instructor</div><div style="font-weight:600;font-size:14px;">' + F.esc(course.instructor) + '</div></div>' +
          '<div><div class="text-xs" style="text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted);margin-bottom:4px;">Modules</div><div style="font-weight:600;font-size:14px;">' + modules.length + ' (' + live.completed + ' of ' + live.total + ' lessons done)</div></div>' +
          '<div><div class="text-xs" style="text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted);margin-bottom:4px;">Assignments</div><div style="font-weight:600;font-size:14px;">' + assigned.length + ' active</div></div>' +
          '<div><div class="text-xs" style="text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted);margin-bottom:4px;">Quizzes</div><div style="font-weight:600;font-size:14px;">' + quiz.length + ' scheduled</div></div>' +
        '</div>' +
        '<h3 style="font-size:14px;font-weight:600;color:var(--color-text-primary);margin-bottom:8px;">Description</h3>' +
        '<p style="color:var(--color-text-secondary);font-size:14px;line-height:1.7;margin-bottom:20px;">' + F.esc(course.description) + '</p>' +
        '<h3 style="font-size:14px;font-weight:600;color:var(--color-text-primary);margin-bottom:8px;">What you&rsquo;ll learn</h3>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px 24px;">' +
          (course.outcomes && course.outcomes.length
            ? course.outcomes.map(function (item) {
                return '<div style="display:flex;gap:8px;align-items:flex-start;font-size:13px;color:var(--color-text-secondary);"><span style="color:var(--color-success);margin-top:2px;">' + I.icon('check', 15) + '</span>' + F.esc(item) + '</div>';
              }).join('')
            : ['Core concepts and practical skills', 'Hands-on implementation and examples', 'Problem-solving and real-world applications'].map(function (item) {
                return '<div style="display:flex;gap:8px;align-items:flex-start;font-size:13px;color:var(--color-text-secondary);"><span style="color:var(--color-success);margin-top:2px;">' + I.icon('check', 15) + '</span>' + item + '</div>';
              }).join('')) +
        '</div>' +
      '</div>';
  }

  function lessonRow(l, doneIds) {
    var done = !!doneIds[l.id];
    var action = done
      ? '<span style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--color-success);">' + I.icon('checkCircle', 15) + ' Completed</span>'
      : '<button class="material-action" title="Mark complete" data-complete-lesson="' + F.esc(l.id) + '" style="border-color:var(--color-primary);color:var(--color-primary);">' + I.icon('check', 15) + '</button>';
    return '<div class="material-item">' +
      UI.materialIcon(l.type) +
      '<div class="material-info"><div class="material-name">' + F.esc(l.title) + '</div>' +
      '<div class="material-meta"><span>' + tabContentMarkup(l.type) + '</span>' +
      (l.size ? '<span>' + F.fileSize(l.size) + '</span>' : '') +
      (l.meta ? '<span>' + F.esc(l.meta) + '</span>' : '') +
      '</div></div>' +
      action +
    '</div>';
  }

  function renderMaterials() {
    var el = $('#materials-panel');
    if (!el) return;

    if (!isEnrolled()) {
      el.innerHTML = lockedPanel('Materials');
      return;
    }

    var doneIds = completedLessonIds();
    var mods = DB.modules.forCourse(course.id);
    var modules = mods.map(function (m) {
      var lessons = DB.lessons.forModule(m.id);
      var doneIn = lessons.filter(function (l) { return !!doneIds[l.id]; }).length;
      var rows = lessons.map(function (l) { return lessonRow(l, doneIds); }).join('');

      return '<div class="module-item">' +
        '<div class="module-header" data-module-toggle>' +
          '<div class="module-header-left"><span class="module-toggle">' + I.icon('chevronDown', 16) + '</span>' +
          '<span class="module-number">Module ' + m.orderIndex + '</span>' +
          '<span class="module-title">' + F.esc(m.title) + '</span></div>' +
          '<div style="display:flex;align-items:center;gap:12px;"><span class="module-progress">' + doneIn + '/' + lessons.length + ' lessons</span>' +
          (doneIn && doneIn === lessons.length ? UI.badge('Completed', 'success') : '') + '</div>' +
        '</div>' +
        '<div class="module-content">' + (rows || UI.emptyState('file', 'No lessons yet', 'Lessons will appear here once the instructor adds them.').replace('text-align:center', 'text-align:left').replace('padding:24px', 'padding:12px')) + '</div>' +
      '</div>';
    }).join('');

    var live = liveProgress();
    el.innerHTML =
      '<div class="card-header"><h2 class="card-title">Materials</h2><p class="card-subtitle">' + live.completed + ' of ' + live.total + ' lessons completed</p></div>' +
      '<div class="card-body">' + modules +
      '<div style="text-align:center;margin-top:8px;"><button class="btn btn-sm btn-ghost" id="expand-all">Expand all</button></div>' +
      '</div>';
  }

  function ownStatus(a) {
    var sub = DB.submissions.forStudent(uid(), a.id)[0];
    if (sub && (sub.gradedAt || sub.status === 'graded')) return { status: 'graded', sub: sub };
    if (sub) return { status: 'submitted', sub: sub };
    if (D.isOverdue(a.due)) return { status: 'overdue', sub: null };
    return { status: 'not-started', sub: null };
  }

  function renderAssignments() {
    var el = $('#assignments-panel');
    if (!el) return;

    if (!isEnrolled()) {
      el.innerHTML = lockedPanel('Assignments');
      return;
    }

    var rows = DB.list('assignments').filter(function (a) { return a.courseId === course.id; })
      .map(function (a) {
        var st = ownStatus(a);
        var sub = st.sub;
        var pct = st.status === 'graded' ? Math.round(sub.score / a.maxMarks * 100) : null;
        return '<div class="activity-item" style="align-items:center;">' +
          '<div class="activity-icon ' + (st.status === 'graded' ? 'success' : st.status === 'overdue' ? 'danger' : st.status === 'submitted' ? 'info' : 'neutral') + '">' + I.icon('assignments') + '</div>' +
          '<div class="activity-content"><div class="activity-title">' + F.esc(a.title) + '</div>' +
          '<div class="activity-meta">Due ' + D.format(a.due) + ' &middot; ' + a.maxMarks + ' marks</div></div>' +
          '<div style="display:flex;align-items:center;gap:10px;"><span style="font-weight:600;font-size:13px;color:var(--color-text-primary);">' + (pct != null ? pct + '%' : '') + '</span>' +
          UI.statusBadge(st.status) +
          '<a class="btn btn-sm btn-ghost" href="assignment-detail.html?id=' + a.id + '">' + I.icon('arrowRight', 14) + '</a></div>' +
        '</div>';
      }).join('');

    el.innerHTML =
      '<div class="card-header"><h2 class="card-title">Assignments</h2><p class="card-subtitle">Your assignments in this course</p></div>' +
      '<div class="card-body" style="padding-top:var(--spacing-4);padding-bottom:var(--spacing-4);">' + (rows || UI.emptyState('assignments', 'No assignments', 'Assignments will appear here once published.')) + '</div>';
  }

  function renderQuizzes() {
    var el = $('#quizzes-panel');
    if (!el) return;

    if (!isEnrolled()) {
      el.innerHTML = lockedPanel('Quizzes');
      return;
    }

    var rows = DB.list('quizzes').filter(function (q) { return q.courseId === course.id; })
      .map(function (q) {
        return '<div class="activity-item" style="align-items:center;">' +
          '<div class="activity-icon ' + (q.taken ? 'success' : 'warning') + '">' + I.icon('quizzes') + '</div>' +
          '<div class="activity-content"><div class="activity-title">' + F.esc(q.title) + '</div>' +
          '<div class="activity-meta">' + q.questions + ' questions &middot; ' + q.duration + ' min &middot; due ' + D.format(q.due) + '</div></div>' +
          '<div style="display:flex;align-items:center;gap:10px;"><span style="font-size:13px;font-weight:600;color:var(--color-text-primary);">' + (q.bestScore || '—') + '</span>' +
          UI.statusBadge(q.taken ? 'completed' : 'available') +
          (q.taken ? '<span class="btn btn-sm btn-ghost" style="cursor:default;">Retake</span>' : '<a class="btn btn-sm btn-primary" href="quiz-attempt.html?id=' + q.id + '">Attempt</a>') +
        '</div>';
      }).join('');

    el.innerHTML =
      '<div class="card-header"><h2 class="card-title">Quizzes</h2><p class="card-subtitle">Scheduled quizzes in this course</p></div>' +
      '<div class="card-body" style="padding-top:var(--spacing-4);padding-bottom:var(--spacing-4);">' + (rows || UI.emptyState('quizzes', 'No quizzes', 'Quizzes will appear here once scheduled.')) + '</div>';
  }

  function renderGrades() {
    var el = $('#grades-panel');
    if (!el) return;

    if (!isEnrolled()) {
      el.innerHTML = lockedPanel('Grades');
      return;
    }

    var rows = DB.submissions.forCourse(course.id).filter(function (s) {
      return s.studentId === uid() && (s.gradedAt || s.status === 'graded');
    }).map(function (s) {
      var a = DB.get('assignments', s.assignmentId);
      return {
        assessment: a ? a.title : 'Assignment',
        type: 'assignment',
        score: s.score,
        max: s.maxMarks,
        date: s.gradedAt,
        feedback: s.feedback
      };
    });
    if (!rows.length) {
      rows = M.grades.filter(function (g) { return g.courseId === course.id; }).map(function (g) {
        return { assessment: g.assessment, type: g.type, score: g.score, max: g.max, date: g.date, feedback: null };
      });
    }
    var pct = rows.length ? Math.round(rows.reduce(function (s, g) { return s + (g.score / g.max) * 100; }, 0) / rows.length) : 0;

    el.innerHTML =
      '<div class="card-header"><h2 class="card-title">Grades</h2><p class="card-subtitle">Your assessment results for this course</p></div>' +
      '<div class="card-body">' +
        '<div class="card" style="padding:var(--spacing-5);margin-bottom:16px;background:var(--color-bg-tertiary);border:none;">' +
          '<div style="display:flex;gap:32px;flex-wrap:wrap;align-items:center;">' +
            '<div><div style="font-size:28px;font-weight:700;color:var(--color-text-primary);">' + pct + '%</div><div style="font-size:12px;color:var(--color-text-tertiary);">Course average</div></div>' +
            '<div><div style="font-size:22px;font-weight:700;color:var(--color-primary);">' + F.gradeLetter(pct) + '</div><div style="font-size:12px;color:var(--color-text-tertiary);">Grade</div></div>' +
            '<div><div style="font-size:22px;font-weight:700;color:var(--color-text-primary);">' + rows.length + '</div><div style="font-size:12px;color:var(--color-text-tertiary);">Assessments graded</div></div>' +
          '</div>' +
        '</div>' +
        '<div class="table-wrapper"><table class="table"><thead><tr><th>Assessment</th><th>Type</th><th>Score</th><th>Percentage</th><th>Grade</th><th>Feedback</th><th>Date</th></tr></thead><tbody>' +
        rows.map(function (g) {
          var p = Math.round(g.score / g.max * 100);
          return '<tr><td style="font-weight:500;">' + F.esc(g.assessment) + '</td>' +
            '<td>' + UI.badge(g.type === 'quiz' ? 'Quiz' : g.type === 'exam' ? 'Exam' : 'Assignment', g.type === 'quiz' ? 'warning' : g.type === 'exam' ? 'info' : 'primary') + '</td>' +
            '<td>' + g.score + ' / ' + g.max + '</td>' +
            '<td><div style="display:flex;align-items:center;gap:10px;max-width:140px;">' + UI.progress(p) + '<span style="font-weight:600;">' + p + '%</span></div></td>' +
            '<td>' + UI.badge(F.gradeLetter(p), F.gradeColor(p)) + '</td>' +
            '<td class="text-tertiary">' + F.esc(g.feedback || '—') + '</td>' +
            '<td class="text-tertiary">' + D.format(g.date) + '</td></tr>';
        }).join('') + '</tbody></table></div>' +
      '</div>';
  }

  function renderAnnouncements() {
    var el = $('#announcements-panel');
    if (!el) return;

    if (!isEnrolled()) {
      el.innerHTML = lockedPanel('Announcements');
      return;
    }

    var rows = DB.list('announcements').filter(function (a) { return a.courseId === course.id; })
      .sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); })
      .map(function (a) {
        return '<div class="activity-item" style="align-items:flex-start;">' +
          '<div class="activity-icon warning">' + I.icon('bell') + '</div>' +
          '<div class="activity-content"><div class="activity-title">' + F.esc(a.title) + '</div>' +
          '<div class="activity-meta">' + F.esc(a.authorId ? 'Instructor' : 'Course team') + ' &middot; ' + D.format(a.createdAt) + '</div>' +
          '<p style="font-size:13px;color:var(--color-text-secondary);line-height:1.6;margin-top:6px;">' + F.esc(a.body) + '</p></div>' +
        '</div>';
      }).join('');

    el.innerHTML =
      '<div class="card-header"><h2 class="card-title">Announcements</h2><p class="card-subtitle">Latest updates from your instructor</p></div>' +
      '<div class="card-body" style="padding-top:var(--spacing-4);padding-bottom:var(--spacing-4);">' + (rows || UI.emptyState('bell', 'No announcements', 'Instructor announcements will appear here.')) + '</div>';
  }

  function renderPanels() {
    renderOverview();
    renderMaterials();
    renderAssignments();
    renderQuizzes();
    renderGrades();
    renderAnnouncements();
  }

  function wireTabs() {
    var tabs = document.querySelectorAll('.tab');
    var panels = document.querySelectorAll('.tab-panel');

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        panels.forEach(function (p) {
          p.classList.toggle('active', p.getAttribute('data-panel') === tab.getAttribute('data-tab'));
        });
      });
    });
  }

  function wireModules() {
    document.addEventListener('click', function (e) {
      var toggle = e.target.closest('[data-module-toggle]');
      if (!toggle) return;
      var item = toggle.closest('.module-item');
      var content = item.querySelector('.module-content');
      var chevron = item.querySelector('.module-toggle');
      var open = content.classList.toggle('open');
      chevron.classList.toggle('open', open);
    });
  }

  function init() {
    var id = LH.app.param('id') || 'cs201';
    course = DB.get('courses', id) || DB.list('courses').filter(function (c) { return c.status !== 'draft'; })[0] || DB.list('courses')[0];
    if (!course) {
      var banner = $('#course-banner');
      if (banner) banner.innerHTML = UI.emptyState('courses', 'Course not found', 'This course does not exist.');
      return;
    }

    renderBanner();
    renderPanels();
    wireTabs();
    wireModules();

    document.querySelectorAll('.tab[data-tab="materials"]').forEach(function (t) {
      t.addEventListener('click', function () {
        setTimeout(function () {
          var firstModule = document.querySelector('.module-item .module-header');
          if (firstModule) firstModule.click();
        }, 50);
      });
    });

    /* Mark lessons complete */
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-complete-lesson]');
      if (!btn) return;
      var lessonId = btn.getAttribute('data-complete-lesson');
      DB.markLessonComplete(uid(), lessonId);
      LH.toast.success('Lesson completed', 'Your progress has been updated.');
      renderBanner();
      renderMaterials();
    });

    /* Material download buttons */
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-download]');
      if (btn) {
        LH.toast.info('Download started', btn.getAttribute('data-download') + ' will download once demo files are attached.');
      }
    });

    var expandAll = $('#expand-all');
    if (expandAll) {
      expandAll.addEventListener('click', function () {
        var anyClosed = document.querySelector('.module-content:not(.open)');
        document.querySelectorAll('.module-content').forEach(function (c) {
          c.classList.toggle('open', !!anyClosed);
        });
        document.querySelectorAll('.module-toggle').forEach(function (ch) {
          ch.classList.toggle('open', !!anyClosed);
        });
      });
    }
  }

  LH.app.register('student-course-details', init);
  LH.app.init('student-course-details');
})(window.LH);