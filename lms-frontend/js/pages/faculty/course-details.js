(function (LH) {
  'use strict';

  var $ = LH.dom.$, F = LH.format, D = LH.date, UI = LH.ui, I = LH.icons;
  var M = LH.mock;
  var DB = LH.db;

  /* Live data bundle loaded once in init(); renderers below read DATA. */
  var DATA = { modules: [], lessonsByModule: {}, assignments: [], quizzes: [],
    announcements: [], roster: [] };

  async function findCourse() {
    var id = LH.app.param('id');
    return LH.api.courses.get(id).catch(function () { return null; });
  }

  async function loadData(c) {
    var mods = await LH.api.modules.forCourse(c.id).catch(function () { return []; });
    DATA.modules = mods;
    DATA.lessonsByModule = {};
    await Promise.all(mods.map(function (m) {
      return LH.api.lessons.forModule(m.id).catch(function () { return []; }).then(function (ls) {
        DATA.lessonsByModule[m.id] = ls;
      });
    }));
    DATA.assignments = await LH.api.assignments.forCourse(c.id).catch(function () { return []; });
    var quizzes = await LH.api.quizzes.list().catch(function () { return []; });
    DATA.quizzes = quizzes.filter(function (q) { return q.courseId === c.id; });
    DATA.announcements = await LH.api.announcements.forCourse(c.id).catch(function () { return []; });
    DATA.roster = await buildRoster(c);
  }

  async function buildRoster(c) {
    var roster = await LH.api.courses.roster(c.id).catch(function () { return []; });
    var prog = {};
    try {
      (await LH.api.courses.studentProgress(c.id)).forEach(function (r) { prog[r.studentId] = r; });
    } catch (e) { /* mock has no analytics feed */ }
    await Promise.all(roster.map(function (r) {
      return LH.api.users.get(r.studentId).catch(function () { return null; }).then(function (u) {
        r.program = (u && u.program) || r.program || '';
        if (!r.name || r.name === 'Student') r.name = u ? u.name : r.name;
        var p = prog[r.studentId] || {};
        r.attendance = (p.attendancePct != null) ? p.attendancePct + '%'
          : (r.attendance || '—');
      });
    }));
    return roster;
  }

  function renderHeader(c) {
    var accentColors = { blue: '#3b82f6', indigo: '#6366f1', emerald: '#10b981', amber: '#f59e0b', rose: '#f43f5e', violet: '#8b5cf6' };
    var accent = accentColors[c.accent] || '#3b82f6';
    var moduleCount = DATA.modules.length;
    var thumb = UI.coverUrl(c.thumbnailUrl);

    return '<div class="card ch2" style="margin-bottom:var(--spacing-6);">' +
      (thumb ? '<div class="ch2-cover"><img src="' + thumb + '" alt="' + F.esc(c.name) + ' cover" onerror="this.parentNode.remove()"></div>' : '') +
      '<div class="card-body ch2-body">' +
        '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">' +
          '<a class="btn btn-sm btn-secondary" href="courses.html">&larr; All courses</a>' +
          '<span style="font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--color-text-tertiary);">' + F.esc(c.semester || '') + '</span>' +
        '</div>' +
        '<h1 style="font-size:clamp(24px,3.6vw,34px);font-weight:800;letter-spacing:-0.03em;line-height:1.05;color:var(--color-text-primary);">' + F.esc(c.name) + '</h1>' +
        '<div style="display:flex;align-items:center;gap:8px;color:var(--color-text-tertiary);font-size:13px;">' +
          UI.avatar(c.instructor, 'sm', UI.coverUrl(c.instructorAvatar)) +
          '<span>' + F.esc(c.instructor) + '</span>' +
        '</div>' +
        '<div style="display:flex;gap:28px;flex-wrap:wrap;padding-top:16px;border-top:1px solid var(--color-border-light);">' +
          '<div><span style="display:block;font-size:12px;color:var(--color-text-tertiary);">Students</span><span style="font-size:18px;font-weight:800;color:var(--color-text-primary);">' + c.students + '</span></div>' +
          '<div><span style="display:block;font-size:12px;color:var(--color-text-tertiary);">Modules</span><span style="font-size:18px;font-weight:800;color:var(--color-text-primary);">' + moduleCount + '</span></div>' +
          '<div><span style="display:block;font-size:12px;color:var(--color-text-tertiary);">Status</span><span style="font-size:18px;font-weight:800;color:var(--color-text-primary);">' + F.esc((c.status || 'published') === 'published' ? 'Published' : 'Draft') + '</span></div>' +
        '</div>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
          '<a class="btn btn-primary" href="course-editor.html?id=' + c.id + '">' + I.icon('settings', 15) + ' Edit course</a>' +
          '<a class="btn btn-secondary" href="grades.html?id=' + c.id + '">' + I.icon('grades', 15) + ' Grades</a>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function renderOverview(c) {
    var mods = DATA.modules;
    var lessons = mods.reduce(function (n, m) { return n + ((DATA.lessonsByModule[m.id] || []).length); }, 0);

    return '<section class="card"><div class="card-header"><h2 class="card-title">About this course</h2>' +
      '<p class="card-subtitle">Everything about ' + F.esc(c.name) + ' in one place</p></div>' +
      '<div class="card-body">' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;margin-bottom:24px;">' +
          '<div><div class="text-xs" style="text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted);margin-bottom:4px;">Course code</div><div style="font-weight:600;font-size:14px;">' + F.esc(c.code) + '</div></div>' +
          '<div><div class="text-xs" style="text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted);margin-bottom:4px;">Instructor</div><div style="display:flex;align-items:center;gap:8px;font-weight:600;font-size:14px;">' + UI.avatar(c.instructor, 'sm', UI.coverUrl(c.instructorAvatar)) + '<span>' + F.esc(c.instructor) + '</span></div></div>' +
          '<div><div class="text-xs" style="text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted);margin-bottom:4px;">Modules</div><div style="font-weight:600;font-size:14px;">' + mods.length + '</div></div>' +
          '<div><div class="text-xs" style="text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted);margin-bottom:4px;">Lessons</div><div style="font-weight:600;font-size:14px;">' + lessons + ' total</div></div>' +
          '<div><div class="text-xs" style="text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted);margin-bottom:4px;">Assignments</div><div style="font-weight:600;font-size:14px;">' + DATA.assignments.length + ' active</div></div>' +
          '<div><div class="text-xs" style="text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted);margin-bottom:4px;">Quizzes</div><div style="font-weight:600;font-size:14px;">' + DATA.quizzes.length + ' scheduled</div></div>' +
        '</div>' +
        '<h3 style="font-size:14px;font-weight:600;color:var(--color-text-primary);margin-bottom:8px;">Description</h3>' +
        '<p style="color:var(--color-text-secondary);font-size:14px;line-height:1.7;margin-bottom:20px;">' + F.esc(c.description || 'No description yet. Add one from the course editor.') + '</p>' +
        '<h3 style="font-size:14px;font-weight:600;color:var(--color-text-primary);margin-bottom:8px;">What you&rsquo;ll learn</h3>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px 24px;">' +
          ((c.outcomes && c.outcomes.length ? c.outcomes : ['Core concepts and practical skills', 'Hands-on implementation and examples', 'Problem-solving and real-world applications']).map(function (item) {
            return '<div style="display:flex;gap:10px;align-items:flex-start;font-size:13px;color:var(--color-text-secondary);"><span style="color:var(--color-success);margin-top:1px;flex-shrink:0;display:inline-flex;">' + I.icon('check', 22) + '</span>' + F.esc(item) + '</div>';
          }).join('')) +
        '</div>' +
      '</div></section>';
  }

  function renderTabs(c) {
    var a = DATA.assignments.filter(function (x) { return !x.graded; }).length;
    var q = DATA.quizzes.filter(function (x) { return !x.taken; }).length;
    var r = DATA.announcements.length;
    return '<div class="flex items-center justify-between" style="margin-bottom:var(--spacing-4);gap:12px;flex-wrap:wrap;">' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
        '<button class="btn btn-primary btn-sm" data-tab="overview">Overview</button>' +
        '<button class="btn btn-ghost btn-sm" data-tab="modules">Modules</button>' +
        '<button class="btn btn-ghost btn-sm" data-tab="assignments">Assignments (' + a + ')</button>' +
        '<button class="btn btn-ghost btn-sm" data-tab="quizzes">Quizzes (' + q + ')</button>' +
        '<button class="btn btn-ghost btn-sm" data-tab="students">Students</button>' +
        '<button class="btn btn-ghost btn-sm" data-tab="announcements">Announcements (' + r + ')</button>' +
      '</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
        '<a class="btn btn-secondary btn-sm" href="assignments.html">' + I.icon('plus', 14) + ' Assignment</a>' +
        '<a class="btn btn-secondary btn-sm" href="quizzes.html">' + I.icon('plus', 14) + ' Quiz</a>' +
      '</div>' +
    '</div>';
  }

  function renderModules(c) {
    var mods = DATA.modules;
    return '<div class="stack">' + mods.map(function (mod, i) {
      var lessons = DATA.lessonsByModule[mod.id] || [];
      var mats = lessons.map(function (l) {
        return '<li class="material-list-item" style="display:flex;align-items:center;gap:10px;padding:8px 0;">' +
          '<span style="color:var(--color-text-muted);display:flex;">' + I.fileIcon(l.type) + '</span>' +
          '<span style="font-size:13.5px;color:var(--color-text-primary);flex:1;">' + F.esc(l.title) + '</span>' +
          '<span style="font-size:12px;color:var(--color-text-muted);">' + F.esc(l.meta || l.size || '') + '</span>' +
        '</li>';
      }).join('');

      return '<section class="card">' +
        '<div class="card-body">' +
          '<div class="flex items-center justify-between" style="gap:12px;flex-wrap:wrap;">' +
            '<div class="flex items-center" style="gap:12px;">' +
              '<span class="avatar avatar-sm" style="border-radius:8px;">' + (i + 1) + '</span>' +
              '<div><h3 style="font-size:15px;font-weight:600;color:var(--color-text-primary);">' + F.esc(mod.title) + '</h3>' +
              '<p style="font-size:12px;color:var(--color-text-muted);">' + lessons.length + ' material' + (lessons.length === 1 ? '' : 's') + '</p></div>' +
            '</div>' +
            '<span style="font-size:12px;color:var(--color-text-muted);font-weight:500;">Module ' + (i + 1) + ' of ' + mods.length + '</span>' +
          '</div>' +
          (lessons.length ? '<ul class="material-list" style="margin-top:12px;border-top:1px solid var(--color-border-light);">' + mats + '</ul>' : '') +
        '</div>' +
      '</section>';
    }).join('') || UI.emptyState('courses', 'No modules yet', 'Add modules from the course editor.');
  }

  function renderAssignments(c) {
    var list = DATA.assignments.slice().sort(function (a, b) { return new Date(a.due) - new Date(b.due); });
    return '<div class="stack">' + list.map(function (a) {
      return '<div class="card">' +
        '<div class="card-body" style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;">' +
          '<div class="activity-icon ' + (D.isOverdue(a.due) ? 'danger' : 'primary') + '">' + I.icon('assignments') + '</div>' +
          '<div style="flex:1;min-width:160px;"><div style="font-size:14px;font-weight:600;color:var(--color-text-primary);">' + F.esc(a.title) + '</div>' +
          '<div style="font-size:12px;color:var(--color-text-muted);">Due ' + D.format(a.due) + ' &middot; ' + (a.maxMarks || a.points || 0) + ' pts</div></div>' +
          (D.isOverdue(a.due) ? UI.badge('Overdue', 'danger') : '') +
          '<div style="display:flex;gap:8px;margin-left:auto;align-items:center;">' +
            '<a class="btn btn-secondary" href="submissions.html">Submissions</a>' +
            '<button class="btn btn-secondary" data-open-asg="' + a.id + '">Open</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('') || UI.emptyState('assignments', 'No assignments yet', 'Create one from Assignments.');
  }

  function openAssignmentModal(id) {
    var matches = (DATA.assignments || []).filter(function (x) { return x.id === id; });
    var a = matches[0];
    if (!a) { LH.toast.error('Not found', 'This assignment may have been removed.'); return; }
    var statusBadge = D.isOverdue(a.due) ? UI.badge('Overdue', 'danger') : '';
    LH.modal.open(
      '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;">' +
        statusBadge +
        '<span class="badge badge-neutral">' + (a.maxMarks || a.points || 0) + ' pts</span>' +
      '</div>' +
      '<div class="form-group"><div class="form-label">Course</div><div style="font-size:14px;">' + F.esc(a.course || '') + '</div></div>' +
      '<div class="form-group"><div class="form-label">Due</div><div style="font-size:14px;">' + D.format(a.due) + '</div></div>' +
      (a.description ? '<div class="form-group"><div class="form-label">Description</div><p style="font-size:13px;color:var(--color-text-secondary);line-height:1.6;">' + F.esc(a.description) + '</p></div>' : '') +
      '<div class="modal-footer" style="display:flex;justify-content:flex-end;gap:10px;padding:16px 0 0;">' +
        '<a class="btn btn-secondary" href="assignments.html">Edit in Assignments</a>' +
        '<a class="btn btn-primary" href="submissions.html">View submissions</a>' +
      '</div>',
      { title: a.title || 'Assignment', width: '520px' });
  }

  function openQuizModal(id) {
    var found = (DATA.quizzes || []).filter(function (x) { return x.id === id; });
    var q = found[0];
    if (!q) { LH.toast.error('Not found', 'This quiz may have been removed.'); return; }
    var qStatus = D.isOverdue(q.due) ? UI.badge('Closed', 'neutral') : '';
    LH.modal.open(
      '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;">' +
        qStatus +
        '<span class="badge badge-neutral">' + q.questions + ' questions</span>' +
        '<span class="badge badge-neutral">' + q.duration + ' min</span>' +
      '</div>' +
      '<div class="form-group"><div class="form-label">Course</div><div style="font-size:14px;">' + F.esc(q.course || '') + '</div></div>' +
      '<div class="form-group"><div class="form-label">Open until</div><div style="font-size:14px;">' + D.format(q.due) + '</div></div>' +
      '<div class="modal-footer" style="display:flex;justify-content:flex-end;gap:10px;padding:16px 0 0;">' +
        '<a class="btn btn-primary" href="quizzes.html">Manage in Quizzes</a>' +
      '</div>',
      { title: q.title || 'Quiz', width: '520px' });
  }

  function renderQuizzes(c) {
    var list = DATA.quizzes.slice().sort(function (a, b) { return new Date(a.due) - new Date(b.due); });
    return '<div class="stack">' + list.map(function (q) {
      return '<div class="card">' +
        '<div class="card-body" style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;">' +
          '<div class="activity-icon ' + (D.isOverdue(q.due) ? 'danger' : 'warning') + '">' + I.icon('quizzes') + '</div>' +
          '<div style="flex:1;min-width:160px;"><div style="font-size:14px;font-weight:600;color:var(--color-text-primary);">' + F.esc(q.title) + '</div>' +
          '<div style="font-size:12px;color:var(--color-text-muted);">Due ' + D.format(q.due) + ' &middot; ' + q.questions + ' questions &middot; ' + q.duration + ' min</div></div>' +
          (D.isOverdue(q.due) ? UI.badge('Closed', 'neutral') : '') +
          '<div style="display:flex;gap:8px;margin-left:auto;align-items:center;">' +
            '<button class="btn btn-secondary" data-open-quiz="' + q.id + '">Open</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('') || UI.emptyState('quizzes', 'No quizzes yet', 'Create one from Quizzes.');
  }

  function renderStudents(c) {
    var active = DATA.roster.filter(function (r) { return r.status === 'active'; });
    var rows = active.map(function (r) {
      var progress = (r.progressPercent != null ? r.progressPercent : 0) + '%';
      return '<tr><td><div class="avatar-cell">' + UI.avatar(r.name, 'sm') + F.esc(r.name) + '</div></td>' +
        '<td>' + F.esc(r.program || '') + '</td>' +
        '<td>' + F.esc(r.attendance || '—') + '</td>' +
        '<td>' + progress + '</td></tr>';
    }).join('');

    if (!rows) {
      return '<section class="card"><div class="card-body">' + UI.emptyState('users', 'No students yet', 'Students will appear here once they enroll.') + '</div></section>';
    }

    return '<section class="card"><div class="card-header"><h2 class="card-title">Enrolled students (' + active.length + ')</h2></div>' +
      '<div class="card-body" style="padding-top:0;padding-bottom:0;">' +
        '<div class="table-wrapper" style="border:none;border-radius:0;">' +
          '<table class="table"><thead><tr><th>Student</th><th>Program</th><th>Attendance</th><th>Progress</th></tr></thead><tbody>' + rows + '</tbody></table>' +
        '</div>' +
        '<p style="font-size:12px;color:var(--color-text-muted);padding:12px 4px;">' + c.students + ' total seats occupied across catalog data; progress recomputed from completed materials.</p>' +
      '</div></section>';
  }

  function renderAnnouncements(c) {
    var list = DATA.announcements.slice()
      .sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });

    var form =
      '<section class="card" style="margin-bottom:var(--spacing-6);">' +
        '<div class="card-header"><h2 class="card-title">Post an announcement</h2></div>' +
        '<div class="card-body">' +
          '<form id="ann-form">' +
            '<div class="form-group"><label class="form-label" for="ann-title">Title</label>' +
              '<input class="form-input" id="ann-title" placeholder="e.g. Midterm review session"></div>' +
            '<div class="form-group"><label class="form-label" for="ann-body">Message</label>' +
              '<textarea class="form-input form-textarea" id="ann-body" rows="3" placeholder="Write the announcement for your students..."></textarea></div>' +
            '<button class="btn btn-primary" type="submit">' + I.icon('send', 15) + ' Post</button>' +
          '</form>' +
        '</div>' +
      '</section>';

    var cards = list.map(function (a) {
      return '<div class="card">' +
        '<div class="card-body" style="display:flex;align-items:flex-start;gap:12px;">' +
          '<div class="activity-icon info">' + I.icon('bell') + '</div>' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="font-size:14px;font-weight:600;color:var(--color-text-primary);">' + F.esc(a.title) + '</div>' +
            '<p style="font-size:13px;color:var(--color-text-muted);margin:6px 0 8px;">' + F.esc(a.body) + '</p>' +
            '<div style="font-size:12px;color:var(--color-text-tertiary);">' + D.format(a.createdAt) + '</div>' +
          '</div>' +
          '<button class="btn btn-sm btn-ghost" data-del-ann="' + a.id + '">' + I.icon('trash', 14) + '</button>' +
        '</div>' +
      '</div>';
    }).join('');

    return form + (cards || UI.emptyState('bell', 'No announcements yet', 'Post a message to keep your students in the loop.'));
  }

  function wireAnnouncements(c, body) {
    body.querySelector('#ann-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var title = body.querySelector('#ann-title').value.trim();
      var text = body.querySelector('#ann-body').value.trim();
      if (!title || !text) { LH.toast.error('Incomplete', 'Give the announcement a title and message.'); return; }
      LH.api.announcements.create({ courseId: c.id, title: title, body: text }).then(function () {
        return LH.api.announcements.forCourse(c.id).catch(function () { return []; });
      }).then(function (list) {
        DATA.announcements = list;
        panel(renderAnnouncements(c));
        wireAnnouncements(c, body);
        LH.toast.success('Announcement posted', 'Students will see it on the course page.');
      });
    });
    body.querySelectorAll('[data-del-ann]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        LH.api.announcements.remove(btn.getAttribute('data-del-ann')).then(function () {
          return LH.api.announcements.forCourse(c.id).catch(function () { return []; });
        }).then(function (list) {
          DATA.announcements = list;
          panel(renderAnnouncements(c));
          wireAnnouncements(c, body);
          LH.toast.info('Announcement removed', 'The announcement was deleted.');
        });
      });
    });
  }

  var el, body;

  function panel(html) { body.innerHTML = html; return body; }

  async function init() {
    el = $('#faculty-course-content');
    if (!el) return;
    var c = await findCourse();
    if (!c) {
      el.innerHTML = UI.emptyState('courses', 'Course not found', 'This course may have been removed.');
      return;
    }
    var user = LH.shell.getUser();
    if (!(await LH.api.courses.ownedBy(c.id, user))) {
      el.innerHTML = UI.emptyState('lock', 'Access denied', 'You can only view courses you teach.');
      return;
    }

    await loadData(c);
    el.innerHTML = renderHeader(c) + renderTabs(c) + '<div id="tab-body"></div>';
    body = $('#tab-body');

    el.addEventListener('click', function (e) {
      var asg = e.target && e.target.closest ? e.target.closest('[data-open-asg]') : null;
      if (asg) { openAssignmentModal(asg.getAttribute('data-open-asg')); return; }
      var qz = e.target && e.target.closest ? e.target.closest('[data-open-quiz]') : null;
      if (qz) openQuizModal(qz.getAttribute('data-open-quiz'));
    });

    panel(renderOverview(c));

    el.querySelectorAll('[data-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        el.querySelectorAll('[data-tab]').forEach(function (b) { b.classList.remove('btn-primary'); b.classList.add('btn-ghost'); });
        btn.classList.remove('btn-ghost'); btn.classList.add('btn-primary');
        var t = btn.getAttribute('data-tab');
        if (t === 'overview') panel(renderOverview(c));
        else if (t === 'modules') panel(renderModules(c));
        else if (t === 'assignments') panel(renderAssignments(c));
        else if (t === 'quizzes') panel(renderQuizzes(c));
        else if (t === 'students') panel(renderStudents(c));
        else { panel(renderAnnouncements(c)); wireAnnouncements(c, body); }
      });
    });
  }

  LH.app.register('faculty-course-details', init);
  LH.app.init('faculty-course-details');
})(window.LH);