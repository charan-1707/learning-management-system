(function (LH) {
  'use strict';

  var $ = LH.dom.$, F = LH.format, D = LH.date, UI = LH.ui, I = LH.icons;
  var M = LH.mock;
  var DB = LH.db;

  function findCourse() {
    var id = LH.app.param('id');
    return DB.get('courses', id);
  }

  function renderHeader(c) {
    var accentColors = { blue: '#3b82f6', indigo: '#6366f1', emerald: '#10b981', amber: '#f59e0b', rose: '#f43f5e', violet: '#8b5cf6' };
    var accent = accentColors[c.accent] || '#3b82f6';
    var moduleCount = DB.modules.forCourse(c.id).length;

    return '<div class="card" style="overflow:hidden;margin-bottom:var(--spacing-6);">' +
      '<div style="height:110px;background:linear-gradient(120deg,' + accent + 'cc,' + accent + ');display:flex;align-items:center;justify-content:center;">' +
        '<span style="font-size:16px;font-weight:800;letter-spacing:.08em;color:var(--color-text-secondary);">' + F.esc(c.code) + ' &middot; ' + F.esc(c.semester || '') + '</span>' +
      '</div>' +
      '<div class="card-body">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">' +
          '<div style="min-width:220px;">' +
            '<h1 style="font-size:24px;font-weight:700;letter-spacing:-0.02em;color:var(--color-text-primary);margin-bottom:6px;">' + F.esc(c.name) + '</h1>' +
            '<p style="color:var(--color-text-tertiary);font-size:13.5px;max-width:640px;">' + F.esc(c.description) + '</p>' +
          '</div>' +
          '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
            '<a class="btn btn-primary" href="course-editor.html?id=' + c.id + '">' + I.icon('settings', 15) + ' Edit course</a>' +
            '<a class="btn btn-secondary" href="grades.html?id=' + c.id + '">' + I.icon('grades', 15) + ' Grades</a>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;gap:28px;flex-wrap:wrap;margin-top:20px;padding-top:18px;border-top:1px solid var(--color-border-light);">' +
          '<div><span style="display:block;font-size:12px;color:var(--color-text-tertiary);">Students</span><span style="font-size:16px;font-weight:700;color:var(--color-text-primary);">' + c.students + '</span></div>' +
          '<div><span style="display:block;font-size:12px;color:var(--color-text-tertiary);">Modules</span><span style="font-size:16px;font-weight:700;color:var(--color-text-primary);">' + moduleCount + '</span></div>' +
          '<div><span style="display:block;font-size:12px;color:var(--color-text-tertiary);">Instructor</span><span style="font-size:16px;font-weight:700;color:var(--color-text-primary);">' + F.esc(c.instructor) + '</span></div>' +
          '<div><span style="display:block;font-size:12px;color:var(--color-text-tertiary);">Status</span><span style="font-size:16px;font-weight:700;color:var(--color-text-primary);">' + F.esc((c.status || 'published') === 'published' ? 'Published' : 'Draft') + '</span></div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function renderTabs(c) {
    var a = DB.list('assignments').filter(function (x) { return x.courseId === c.id && !x.graded; }).length;
    var q = DB.list('quizzes').filter(function (x) { return x.courseId === c.id && !x.taken; }).length;
    var r = DB.list('announcements').filter(function (x) { return x.courseId === c.id; }).length;
    return '<div class="flex items-center justify-between" style="margin-bottom:var(--spacing-4);gap:12px;flex-wrap:wrap;">' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
        '<button class="btn btn-primary btn-sm" data-tab="modules">Modules</button>' +
        '<button class="btn btn-ghost btn-sm" data-tab="assignments">Assignments (' + a.length + ')</button>' +
        '<button class="btn btn-ghost btn-sm" data-tab="quizzes">Quizzes (' + q.length + ')</button>' +
        '<button class="btn btn-ghost btn-sm" data-tab="students">Students</button>' +
        '<button class="btn btn-ghost btn-sm" data-tab="announcements">Announcements (' + r.length + ')</button>' +
      '</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
        '<a class="btn btn-secondary btn-sm" href="assignments.html">' + I.icon('plus', 14) + ' Assignment</a>' +
        '<a class="btn btn-secondary btn-sm" href="quizzes.html">' + I.icon('plus', 14) + ' Quiz</a>' +
      '</div>' +
    '</div>';
  }

  function renderModules(c) {
    var mods = DB.modules.forCourse(c.id);
    return '<div class="stack">' + mods.map(function (mod, i) {
      var lessons = DB.lessons.forModule(mod.id);
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
    var list = DB.list('assignments').filter(function (x) { return x.courseId === c.id; }).sort(function (a, b) { return new Date(a.due) - new Date(b.due); });
    return '<div class="stack">' + list.map(function (a) {
      return '<div class="card">' +
        '<div class="card-body" style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;">' +
          '<div class="activity-icon ' + (D.isOverdue(a.due) ? 'danger' : 'primary') + '">' + I.icon('assignments') + '</div>' +
          '<div style="flex:1;min-width:160px;"><div style="font-size:14px;font-weight:600;color:var(--color-text-primary);">' + F.esc(a.title) + '</div>' +
          '<div style="font-size:12px;color:var(--color-text-muted);">Due ' + D.format(a.due) + ' &middot; ' + (a.maxMarks || a.points || 0) + ' pts</div></div>' +
          UI.badge(D.isOverdue(a.due) ? 'Overdue' : 'Open', D.isOverdue(a.due) ? 'danger' : 'success') +
        '</div>' +
      '</div>';
    }).join('') || UI.emptyState('assignments', 'No assignments yet', 'Create one from Assignments.');
  }

  function renderQuizzes(c) {
    var list = DB.list('quizzes').filter(function (x) { return x.courseId === c.id; }).sort(function (a, b) { return new Date(a.due) - new Date(b.due); });
    return '<div class="stack">' + list.map(function (q) {
      return '<div class="card">' +
        '<div class="card-body" style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;">' +
          '<div class="activity-icon ' + (D.isOverdue(q.due) ? 'danger' : 'warning') + '">' + I.icon('quizzes') + '</div>' +
          '<div style="flex:1;min-width:160px;"><div style="font-size:14px;font-weight:600;color:var(--color-text-primary);">' + F.esc(q.title) + '</div>' +
          '<div style="font-size:12px;color:var(--color-text-muted);">Due ' + D.format(q.due) + ' &middot; ' + q.questions + ' questions &middot; ' + q.duration + ' min</div></div>' +
          UI.badge(D.isOverdue(q.due) ? 'Closed' : 'Open', D.isOverdue(q.due) ? 'neutral' : 'success') +
        '</div>' +
      '</div>';
    }).join('') || UI.emptyState('quizzes', 'No quizzes yet', 'Create one from Quizzes.');
  }

  function studentName(sid) {
    var u = DB.get('users', sid);
    if (u) return u.name;
    var sl = M.studentList.filter(function (s) { return s.id === sid; })[0];
    return sl ? sl.name : 'Student';
  }

  function renderStudents(c) {
    var rows = DB.enrollments.forCourse(c.id).map(function (e) {
      var row = [];
      if (e.status !== 'active') return row;
      var sl = M.studentList.filter(function (s) { return s.id === e.studentId; })[0];
      var program = (sl && sl.program) || '';
      var at = (sl && sl.attendance) || '—';
      var name = studentName(e.studentId);
      row.push('<tr><td><div class="avatar-cell">' + UI.avatar(name, 'sm') + F.esc(name) + '</div></td>' +
        '<td>' + F.esc(program) + '</td>' +
        '<td>' + at + '</td>' +
        '<td>' + e.progressPercent + '%</td></tr>');
      return row;
    }).reduce(function (acc, r) { return acc.concat(r); }, []).join('');

    if (!rows) {
      return '<section class="card"><div class="card-body">' + UI.emptyState('users', 'No students yet', 'Students will appear here once they enroll.') + '</div></section>';
    }

    return '<section class="card"><div class="card-header"><h2 class="card-title">Enrolled students (' + DB.enrollments.forCourse(c.id).filter(function (e) { return e.status === 'active'; }).length + ')</h2></div>' +
      '<div class="card-body" style="padding-top:0;padding-bottom:0;">' +
        '<div class="table-wrapper" style="border:none;border-radius:0;">' +
          '<table class="table"><thead><tr><th>Student</th><th>Program</th><th>Attendance</th><th>Progress</th></tr></thead><tbody>' + rows + '</tbody></table>' +
        '</div>' +
        '<p style="font-size:12px;color:var(--color-text-muted);padding:12px 4px;">' + c.students + ' total seats occupied across catalog data; progress recomputed from completed materials.</p>' +
      '</div></section>';
  }

  function renderAnnouncements(c) {
    var list = DB.list('announcements').filter(function (a) { return a.courseId === c.id; })
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
      var user = LH.shell.getUser();
      DB.create('announcements', {
        id: 'an' + (DB.list('announcements').length + 1),
        courseId: c.id, authorId: user ? user.id : null, title: title, body: text, createdAt: new Date()
      });
      panel(renderAnnouncements(c));
      wireAnnouncements(c, body);
      LH.toast.success('Announcement posted', 'Students will see it on the course page.');
    });
    body.querySelectorAll('[data-del-ann]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        DB.remove('announcements', btn.getAttribute('data-del-ann'));
        panel(renderAnnouncements(c));
        wireAnnouncements(c, body);
        LH.toast.info('Announcement removed', 'The announcement was deleted.');
      });
    });
  }

  var el, body;

  function panel(html) { body.innerHTML = html; return body; }

  function init() {
    el = $('#faculty-course-content');
    if (!el) return;
    var c = findCourse();
    if (!c) {
      el.innerHTML = UI.emptyState('courses', 'Course not found', 'This course may have been removed.');
      return;
    }
    var user = LH.shell.getUser();
    if (!DB.courses.ownedBy(c.id, user)) {
      el.innerHTML = UI.emptyState('lock', 'Access denied', 'You can only view courses you teach.');
      return;
    }

    el.innerHTML = renderHeader(c) + renderTabs(c) + '<div id="tab-body"></div>';
    body = $('#tab-body');

    panel(renderModules(c));

    el.querySelectorAll('[data-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        el.querySelectorAll('[data-tab]').forEach(function (b) { b.classList.remove('btn-primary'); b.classList.add('btn-ghost'); });
        btn.classList.remove('btn-ghost'); btn.classList.add('btn-primary');
        var t = btn.getAttribute('data-tab');
        if (t === 'modules') panel(renderModules(c));
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