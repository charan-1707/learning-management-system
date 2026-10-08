window.LH = window.LH || {};

/* Single-mode build (25 Sep 2026): the frontend always talks to the live Spring
   Boot backend. Backend resolution: ?api=<base-url> override (remembered),
   else window.LH_API_BASE from js/config.js (the deploy pin — edit that one
   line when deploying), else a remembered value, else localhost default for
   local dev, else same host on :8080 (same-WiFi phones/laptops and any
   remote host serving the frontend). */
LH.API_BASE = (function () {
  var base = 'http://localhost:8080/api';
  try {
    var q = window.location.search || '';
    var m = q.match(/[?&]api=([^&]+)/);
    if (m) {
      var v = decodeURIComponent(m[1]).replace(/\/$/, '');
      if (v === 'reset') {
        /* Terminal fix for a stale saved server (old Wi-Fi IP / dead tunnel):
           login.html?api=reset (or any page) clears the override and uses
           this device's default. */
        try { localStorage.removeItem('learnhub-api'); } catch (e) { /* ignore */ }
      } else if (v) {
        base = v;
        try { localStorage.setItem('learnhub-api', base); } catch (e) { /* ignore */ }
        return base;
      }
    }
    try {
      if (window.LH_API_BASE) return String(window.LH_API_BASE).replace(/\/$/, '');
    } catch (e2) { /* ignore */ }
    var saved = null;
    try { saved = localStorage.getItem('learnhub-api'); } catch (e) { /* ignore */ }
    if (saved) return saved;
    var host = window.location.hostname || '';
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return window.location.protocol + '//' + host + ':8080/api';
    }
  } catch (e) { /* non-browser harness */ }
  return base;
})();
LH.USE_MOCK = 0;

/* One-click escape hatch for a stale saved API server (see above). */
LH.resetApiBase = function () {
  try { localStorage.removeItem('learnhub-api'); } catch (e) { /* ignore */ }
};

(function (LH) {
  'use strict';

  var M = LH.mock;      /* live cache: replaced by LH.db at boot */
  var DB = LH.db;
  var D = LH.date;
  var API = LH.api = {};

  function resolve(next) {
    return next;
  }

  /* ------------------------------ Auth ------------------------------ */

  API.auth = {
    login: function (email, password) {
      var user = DB.users.findByEmail(email);
      var ok = !!user && user.password === password;
      if (ok && user.status === 'suspended') {
        return resolve({ ok: false, suspended: true });
      }
      return resolve({ ok: ok, user: user || null });
    },
    current: function () {
      try {
        var raw = localStorage.getItem('learnhub-user');
        return raw ? JSON.parse(raw) : null;
      } catch (e) { return null; }
    },
    save: function (user) {
      try { localStorage.setItem('learnhub-user', JSON.stringify(user)); } catch (e) { /* ignore */ }
    },
    logout: function () {
      try { localStorage.removeItem('learnhub-user'); } catch (e) { /* ignore */ }
    },
    register: function (name, email, password) {
      var clean = String(email || '').trim().toLowerCase();
      if (!clean || DB.users.findByEmail(clean)) {
        return resolve({ ok: false, error: 'An account with this email already exists.' });
      }
      var rec = DB.create('users', {
        name: String(name || '').trim() || 'New Student', email: clean,
        password: password, role: 'student', status: 'active'
      });
      return resolve({ ok: true, user: rec });
    },
    forgotPassword: function () { return resolve({ ok: true }); },
    resetPassword: function () { return resolve({ ok: true }); },
    logoutAll: function () {
      API.auth.logout();
      return resolve({ ok: true });
    }
  };

  API.homeFor = function (role) {
    var paths = { student: 'pages/student/dashboard.html', faculty: 'pages/faculty/dashboard.html', admin: 'pages/admin/dashboard.html' };
    return paths[role] || 'pages/auth/login.html';
  };

  /* Absolute, tokenized URL for a stored file path (avatar/thumbnail <img> tags). */
  API.fileUrl = function (path) {
    if (!path) return null;
    if (/^https?:\/\//.test(path) || path.charAt(0) === '#') return path;
    var t = '';
    try { t = localStorage.getItem('learnhub-token') || ''; } catch (e) { /* ignore */ }
    var base = LH.API_BASE.replace(/\/api$/, '');
    return base + path + (t ? '?token=' + encodeURIComponent(t) : '');
  };

  /* ------------------------------ Courses ------------------------------ */

  API.courses = {
    list: function () { return resolve(DB.list('courses')); },
    get: function (id) { return resolve(DB.get('courses', id)); },
    byInstructor: function (name) {
      return resolve(DB.list('courses').filter(function (c) { return c.instructor === name; }));
    },
    byInstructorId: function (instructorId) { return resolve(DB.courses.byInstructor(instructorId)); },
    published: function () { return resolve(DB.courses.published().filter(function (c) { return c.status === 'published'; })); },
    search: function (term) {
      term = (term || '').toLowerCase();
      return resolve(DB.list('courses').filter(function (c) {
        return (c.name || '').toLowerCase().indexOf(term) !== -1 ||
               (c.code || '').toLowerCase().indexOf(term) !== -1 ||
               (c.instructor || '').toLowerCase().indexOf(term) !== -1 ||
               (c.category || '').toLowerCase().indexOf(term) !== -1;
      }));
    },
    enrolled: function (studentId) {
      if (!studentId) return resolve(DB.list('courses'));
      return resolve(DB.enrollments.forStudent(studentId).map(function (e) { return e.course; }).filter(Boolean));
    },
    ratings: function () {
      return resolve(DB.list('courses').map(function (c, i) {
        return { id: c.id, rating: (4.2 + ((i * 13) % 7) / 10).toFixed(1) * 1, reviews: 120 + i * 14 };
      }));
    },
    create: function (data) { return resolve(DB.createCourse(data)); },
    update: function (id, patch) { return resolve(DB.updateCourse(id, patch)); },
    setStatus: function (id, status) { return resolve(DB.updateCourse(id, { status: status })); },
    remove: function (id) { return resolve(DB.deleteCourse(id)); },
    ownedBy: function (courseId, user) { return DB.courses.ownedBy(courseId, user); },
    roster: function (courseId) {
      var directory = (LH.mock && LH.mock.studentList) || [];
      return resolve(DB.enrollments.forCourse(courseId).map(function (e) {
        var u = DB.get('users', e.studentId) || {};
        var sl = directory.filter(function (s) { return s.id === e.studentId; })[0] || {};
        return { studentId: e.studentId, name: u.name || sl.name || 'Student',
          email: u.email || sl.email || '', program: u.program || sl.program || '',
          attendance: sl.attendance || null,
          progressPercent: e.progressPercent, status: e.status };
      }));
    },
    studentProgress: function (courseId) {
      return resolve(DB.enrollments.forCourse(courseId).map(function (e) {
        var u = DB.get('users', e.studentId) || {};
        var pct = e.progressPercent || 0;
        return { studentId: e.studentId, name: u.name || 'Student', progressPct: pct,
          avgScore: null, attendancePct: null, atRisk: pct < 40 };
      }));
    }
  };

  function courseName(id) {
    var c = DB.get('courses', id);
    return c ? (c.short || c.name) : id;
  }

  /* ------------------------------ Modules & lessons ------------------------------ */

  API.modules = {
    forCourse: function (courseId) { return resolve(DB.modules.forCourse(courseId)); },
    create: function (courseId, title) { return resolve(DB.modules.create(courseId, title)); },
    update: function (id, patch) { return resolve(DB.modules.update(id, patch)); },
    remove: function (id) { return resolve(DB.modules.remove(id)); },
    reorder: function (courseId, orderedIds) { return resolve(DB.modules.reorder(courseId, orderedIds)); }
  };

  API.lessons = {
    forModule: function (moduleId) { return resolve(DB.lessons.forModule(moduleId)); },
    byCourse: function (courseId) { return resolve(DB.lessons.byCourse(courseId)); },
    countForCourse: function (courseId) { return DB.lessons.countForCourse(courseId); },
    create: function (moduleId, data) {
      var rec = DB.lessons.create(moduleId, data);
      if (rec && data.fileUrl != null) { rec.fileUrl = data.fileUrl; DB.persist('lessons'); }
      return resolve(rec);
    },
    update: function (id, patch) { return resolve(DB.lessons.update(id, patch)); },
    remove: function (id) { return resolve(DB.lessons.remove(id)); },
    reorder: function (moduleId, orderedIds) { return resolve(DB.lessons.reorder(moduleId, orderedIds)); },
    markComplete: function (studentId, lessonId) { return resolve(DB.markLessonComplete(studentId, lessonId)); }
  };

  /* ------------------------------ Enrollments ------------------------------ */

  API.enrollments = {
    isEnrolled: function (studentId, courseId) { return DB.enrollments.isEnrolled(studentId, courseId); },
    enroll: function (studentId, courseId) { return resolve(DB.enrollments.enroll(studentId, courseId)); },
    forStudent: function (studentId) { return resolve(DB.enrollments.forStudent(studentId)); },
    forCourse: function (courseId) { return resolve(DB.enrollments.forCourse(courseId)); },
    progress: function (studentId, courseId) { return resolve(DB.progressFor(studentId, courseId)); }
  };

  /* ------------------------------ Assignments ------------------------------ */

  API.assignments = {
    list: function () { return resolve(DB.list('assignments')); },
    get: function (id) { return resolve(DB.get('assignments', id)); },
    forCourse: function (courseId) {
      return resolve(DB.list('assignments').filter(function (a) { return a.courseId === courseId; })
        .sort(function (a, b) { return new Date(b.due) - new Date(a.due); }));
    },
    courseName: courseName,
    create: function (data) {
      var a = DB.get('courses', data.courseId);
      var rec = DB.create('assignments', {
        id: 'ax' + (DB.list('assignments').length + 1),
        title: data.title, courseId: data.courseId, course: a ? (a.short || a.name) : '',
        maxMarks: parseInt(data.maxScore || data.maxMarks || 20, 10),
        due: data.due ? new Date(data.due) : new Date(),
        status: 'not-started', submitted: false, graded: false, score: null, grade: null,
        gradedDate: null, submittedDate: null, description: data.description || '', attachments: data.attachments || []
      });
      return resolve(rec);
    },
    update: function (id, patch) { return resolve(DB.update('assignments', id, patch)); },
    remove: function (id) {
      DB.list('submissions').filter(function (s) { return s.assignmentId === id; })
        .forEach(function (s) { DB.remove('submissions', s.id); });
      return resolve(DB.remove('assignments', id));
    },
    nextDeadline: function () {
      var upcoming = DB.list('assignments').filter(function (a) { return !a.graded && a.status !== 'overdue'; })
        .sort(function (a, b) { return new Date(a.due) - new Date(b.due); });
      return resolve(upcoming[0] || null);
    },
    gradebook: function (courseId) {
      var roster = [];
      var seen = {};
      DB.enrollments.forCourse(courseId).forEach(function (e) {
        if (seen[e.studentId]) return;
        seen[e.studentId] = true;
        var u = DB.get('users', e.studentId) || {};
        roster.push({ id: e.studentId, name: u.name || 'Student', email: u.email || '' });
      });
      var asmts = DB.list('assignments').filter(function (a) { return a.courseId === courseId; })
        .sort(function (a, b) { return new Date(a.due) - new Date(b.due); });
      var cells = {};
      roster.forEach(function (r) { cells[r.id] = {}; });
      DB.list('submissions').forEach(function (s) {
        if (s.courseId === courseId && cells[s.studentId]) {
          cells[s.studentId][s.assignmentId] = { score: s.score, status: s.status };
        }
      });
      return resolve({
        students: roster,
        assignments: asmts.map(function (a) {
          return { id: a.id, title: a.title, maxMarks: a.maxMarks, due: a.due, dueAt: a.due };
        }),
        cells: cells
      });
    }
  };

  /* ------------------------------ Submissions ------------------------------ */

  API.submissions = {
    forAssignment: function (assignmentId) { return resolve(DB.submissions.forAssignment(assignmentId)); },
    forStudent: function (studentId, assignmentId) { return resolve(DB.submissions.forStudent(studentId, assignmentId)); },
    byCourse: function (courseId) { return resolve(DB.submissions.forCourse(courseId)); },
    ungradedByCourse: function (courseId) {
      return resolve(DB.submissions.forCourse(courseId).filter(function (s) { return !s.gradedAt && s.status !== 'graded'; }));
    },
    submit: function (studentId, assignmentId, content, fileUrl) {
      return resolve(DB.submit(studentId, assignmentId, content, fileUrl));
    },
    grade: function (assignmentId, submissionId, score, feedback) {
      return resolve(DB.submissions.grade(assignmentId, submissionId, score, feedback));
    }
  };

  /* ------------------------------ Announcements ------------------------------ */

  API.announcements = {
    forCourse: function (courseId) {
      return resolve(DB.list('announcements').filter(function (a) { return a.courseId === courseId; })
        .sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); }));
    },
    create: function (data) {
      var rec = DB.create('announcements', {
        id: 'an' + (DB.list('announcements').length + 1),
        courseId: data.courseId, authorId: data.authorId, title: data.title, body: data.body,
        createdAt: new Date()
      });
      return resolve(rec);
    },
    remove: function (id) { return resolve(DB.remove('announcements', id)); }
  };

/* ------------------------------ Quizzes ------------------------------ */

  API.quizzes = {
    list: function () { return resolve(DB.list('quizzes')); },
    get: function (id) { return resolve(DB.get('quizzes', id)); },
    questions: function (id) {
      return resolve(((DB.collection('quizQuestions') || {}))[id] || []);
    },
    courseName: courseName,
    include: function (rec) { return resolve(DB.create('quizzes', rec)); },
    replaceQuestions: function (quizId, questions) {
      var all = Object.assign({}, DB.collection('quizQuestions') || {});
      all[quizId] = questions;
      DB.replace('quizQuestions', all);
      return resolve(true);
    },
    remove: function (id) {
      var all = Object.assign({}, DB.collection('quizQuestions') || {});
      delete all[id];
      DB.replace('quizQuestions', all);
      return resolve(DB.remove('quizzes', id));
    },
    update: function (id, patch) {
      var q = DB.get('quizzes', id);
      if (q && patch) {
        ['title', 'duration', 'durationMin', 'attemptsMax', 'due', 'dueAt', 'status'].forEach(function (k) {
          if (patch[k] !== undefined) q[k] = patch[k];
        });
        DB.persist('quizzes');
      }
      return resolve(q);
    },
    attempts: function () { return resolve([]); },
    attempt: function (quizId, answers) {
      var qs = ((DB.collection('quizQuestions') || {}))[quizId] || [];
      var score = 0;
      qs.forEach(function (q, i) {
        if (answers && answers[i] === q.answer) score++;
      });
      var total = qs.length;
      var pct = total ? Math.round(score / total * 100) : 0;
      var quiz = DB.get('quizzes', quizId);
      if (quiz) {
        if (quiz.bestScore) {
          var prev = String(quiz.bestScore).split('/');
          if (score > Number(prev[0])) quiz.bestScore = score + '/' + total;
        } else {
          quiz.bestScore = score + '/' + total;
        }
        quiz.taken = true;
        quiz.attempts = (quiz.attempts || 0) + 1;
        DB.persist('quizzes');
      }
      return resolve({ score: score, total: total, pct: pct });
    },
    nextQuiz: function () {
      var upcoming = DB.list('quizzes').filter(function (q) { return !q.taken; })
        .sort(function (a, b) { return new Date(a.due) - new Date(b.due); });
      return resolve(upcoming[0] || null);
    }
  };

  /* ------------------------------ Grades ------------------------------ */

  API.grades = {
    list: function () { return resolve(DB.list('grades')); },
    summary: function () {
      var totalPct = 0, count = 0, best = null, recent = [];
      DB.list('grades').forEach(function (g) {
        var pct = (g.score / g.max) * 100;
        totalPct += pct; count++;
        if (!best || pct > best.pct) best = { course: g.course, pct: pct };
      });
      recent = DB.list('grades').slice().sort(function (a, b) { return new Date(b.date) - new Date(a.date); }).slice(0, 5);
      return resolve({ average: count ? totalPct / count : 0, count: count, best: best, recent: recent });
    }
  };

  /* ------------------------------ Attendance ------------------------------ */

  API.attendance = {
    list: function () { return resolve(DB.list('attendance')); },
    overall: function () {      var total = 0, present = 0, count = 0;
      DB.list('attendance').forEach(function (a) {
        total += a.total; present += a.present; count++;
      });
      return resolve({ present: present, total: total, percent: total ? Math.round(present / total * 100) : 0, courses: count });
    },
    history: function () { return resolve(DB.list('attendanceHistory')); },
    takeSession: function (courseId, payload) {
      /* Mock demo: acknowledge without persistence (live mode upserts server-side). */
      return resolve({ id: 'mock-' + Date.now(), courseId: courseId, date: payload.date,
        records: (payload.records || []).map(function (r) {
          return { studentId: r.studentId, studentName: '', status: r.status };
        }) });
    },
    classView: function (courseId) {
      var row = (DB.list('attendance') || []).filter(function (a) { return a.courseId === courseId; })[0]
        || { present: 0, total: 0 };
      var pct = row.total ? Math.round(row.present / row.total * 100) : 0;
      return resolve({ sessions: [],
        overall: { sessions: 0, present: row.present, absent: row.total - row.present,
          total: row.total, percent: pct } });
    },
    daySession: function () { return resolve(null); }
  };

  /* ------------------------------ Notifications ------------------------------ */

  API.notifications = {
    list: function () { return resolve(DB.list('notifications')); },
    unreadCount: function () {
      return DB.list('notifications').filter(function (n) { return !n.read; }).length;
    },
    markRead: function (id) {
      DB.list('notifications').forEach(function (n) {
        if (n.id === id) { n.read = true; DB.update('notifications', id, { read: true }); }
      });
      return resolve(true);
    },
    markAllRead: function () {
      DB.list('notifications').forEach(function (n) { n.read = true; });
      DB.persist('notifications');
      return resolve(true);
    },
    broadcast: function (title, message) {
      /* Mock mode shows every row to whoever is logged in (list() is
         unfiltered), so a single shared system row stands in for the
         server-side fan-out to all users. */
      DB.create('notifications', {
        id: 'n' + Date.now(), type: 'system', title: title, message: message,
        time: new Date(), course: null, read: false
      });
      return resolve({ ok: true, recipients: DB.list('users').length });
    }
  };

  /* ------------------------------ Users ------------------------------ */

  API.users = {
    list: function () { return resolve(DB.list('users')); },
    get: function (id) { return resolve(DB.get('users', id)); },
    me: function () {
      var u = API.auth.current();
      return resolve(u ? DB.get('users', u.id) : null);
    },
    findByEmail: function (email) { return DB.users.findByEmail(email); },
    create: function (data) {
      var clean = String((data && data.email) || '').trim().toLowerCase();
      if (!clean || DB.users.findByEmail(clean)) {
        return resolve({ ok: false, error: 'An account with this email already exists.' });
      }
      return resolve(DB.create('users', {
        name: (data && data.name) || 'New User', email: clean,
        password: (data && data.password) || 'changeme', role: (data && data.role) || 'student', status: 'active'
      }));
    },
    setRole: function (id, role) { return resolve(DB.users.setRole(id, role)); },
    flipStatus: function (id) { return resolve(DB.users.flipStatus(id)); },
    changePassword: function (current, next) {
      var user = API.auth.current();
      if (!user) return resolve({ ok: false, error: 'Not logged in.' });
      var row = DB.get('users', user.id);
      if (!row || row.password !== current) {
        return resolve({ ok: false, error: 'Current password is incorrect.' });
      }
      DB.update('users', user.id, { password: next });
      return resolve({ ok: true });
    }
  };

  /* ------------------------------ Faculty ------------------------------ */

  API.faculty = {
    pendingSubmissions: function () { return resolve(DB.list('pendingSubmissions')); },
    activity: function () { return resolve(DB.list('facultyActivity')); },
    courses: function () { return resolve(DB.list('facultyCourses')); }
  };

  /* ------------------------------ Admin ------------------------------ */

  function filterStudents(list, opts) {
    var q = ((opts || {}).query || '').toLowerCase();
    var status = (opts || {}).status || 'all';
    return list.filter(function (s) {
      var matchQ = !q || (s.name || '').toLowerCase().indexOf(q) !== -1 || (s.email || '').toLowerCase().indexOf(q) !== -1 || (s.program || '').toLowerCase().indexOf(q) !== -1;
      var matchS = status === 'all' || s.status === status;
      return matchQ && matchS;
    });
  }

  function filterFaculty(list, opts) {
    var q = ((opts || {}).query || '').toLowerCase();
    var dept = (opts || {}).dept || 'all';
    return list.filter(function (f) {
      var matchQ = !q || (f.name || '').toLowerCase().indexOf(q) !== -1 || (f.email || '').toLowerCase().indexOf(q) !== -1;
      var matchD = dept === 'all' || f.dept === dept;
      return matchQ && matchD;
    });
  }

  function filterCourses(list, opts) {
    var q = ((opts || {}).query || '').toLowerCase();
    var status = (opts || {}).status || 'all';
    return list.filter(function (c) {
      var matchQ = !q || (c.name || '').toLowerCase().indexOf(q) !== -1 || (c.code || '').toLowerCase().indexOf(q) !== -1 || (c.instructor || '').toLowerCase().indexOf(q) !== -1;
      var matchS = status === 'all' || (c.status || 'published') === status || (status === 'published' && c.status == null);
      return matchQ && matchS;
    });
  }

  function filterUsers(list, opts) {
    var q = ((opts || {}).query || '').toLowerCase();
    var role = (opts || {}).role || 'all';
    return list.filter(function (u) {
      var matchQ = !q || (u.name || '').toLowerCase().indexOf(q) !== -1 || (u.email || '').toLowerCase().indexOf(q) !== -1;
      var matchR = role === 'all' || u.role === role;
      return matchQ && matchR;
    });
  }

  API.admin = {
    stats: function () { return resolve(DB.collection('adminStats')); },
    statistics: function () {
      var s = DB.collection('adminStats') || {};
      var enrolled = DB.count('enrollments');
      var subs = DB.count('submissions');
      var pubCourses = DB.list('courses').filter(function (c) { return c.status === 'published' || c.status == null; }).length;
      return resolve({
        totalCourses: DB.count('courses'),
        publishedCourses: pubCourses,
        totalStudents: s.totalStudents,
        totalFaculty: s.totalFaculty,
        totalUsers: DB.count('users'),
        enrollments: enrolled,
        submissions: subs,
        submissionsToday: subs,
        activeUsers: s.activeUsers
      });
    },
    students: function (opts) { return resolve(filterStudents(DB.list('studentList'), opts)); },
    faculty: function (opts) { return resolve(filterFaculty(DB.list('facultyList'), opts)); },
    courses: function (opts) { return resolve(filterCourses(DB.list('courses'), opts)); },
    users: function (opts) { return resolve(filterUsers(DB.list('users'), opts)); },
    systemActivity: function () { return resolve(DB.list('adminSystemActivity')); },
    reports: function () { return resolve(DB.collection('adminReports')); },
    getSettings: function () { return resolve({}); },
    patchSettings: function (patch) { return resolve(patch || {}); },
    wipeInstance: function () {
      return resolve({ ok: false, error: 'Wipe is unavailable in demo mode.' });
    },
    changeUserRole: function (id, role) { return resolve(DB.users.setRole(id, role)); },
    flipUserStatus: function (id) { return resolve(DB.users.flipStatus(id)); },
    verifyEmail: function (id) { return resolve(DB.update('users', id, { emailVerified: true })); },
    createUser: function (data) { return API.users.create(data || {}); }
  };

  /* ------------------------------ Files (mock demo) ------------------------------ */

  API.storage = {
    upload: function (file) {
      return resolve({ fileId: 'mock-' + Date.now(), url: '#',
        name: file ? file.name : 'file', size: file ? file.size : 0,
        mime: file ? file.type : '' });
    }
  };

  /* ------------------------------ Profile ------------------------------ */

  API.profile = {
    update: function (patch) {
      var user = API.auth.current();
      if (user) {
        Object.keys(patch).forEach(function (k) { if (patch[k] != null) user[k] = patch[k]; });
        API.auth.save(user);
        if (user.id != null) DB.update('users', user.id, patch);
      }
      return resolve(user);
    },
    avatar: function (file) {
      var url = null;
      try { url = (window.URL || window.webkitURL).createObjectURL(file); } catch (e) { url = '#avatar'; }
      var user = API.auth.current();
      if (user) {
        user.avatarUrl = url;
        API.auth.save(user);
        if (user.id != null) DB.update('users', user.id, { avatarUrl: url });
      }
      return resolve({ ok: true, user: user, avatarUrl: url });
    }
  };

})(window.LH);

/* Promise-unify the mock seam (runs in both modes, before the live layer
   below replaces methods). Every LH.api.* function except local-only
   utilities returns a Promise, so converted call sites can await/.then
   identically in mock and live mode. */
(function (LH) {
  'use strict';
  var SYNC_METHODS = { 'auth.current': 1, 'auth.save': 1, 'auth.logout': 1, 'homeFor': 1, 'fileUrl': 1 };
  function wrap(ns, prefix) {
    Object.keys(ns).forEach(function (k) {
      var v = ns[k];
      var path = prefix ? prefix + '.' + k : k;
      if (typeof v === 'function') {
        if (SYNC_METHODS[path]) return;
        ns[k] = (function (fn) {
          return function () {
            var args = arguments;
            try {
              var r = fn.apply(null, args);
              return (r && typeof r.then === 'function') ? r : Promise.resolve(r);
            } catch (e) {
              return Promise.reject(e);
            }
          };
        })(v);
      } else if (v && typeof v === 'object') {
        wrap(v, path);
      }
    });
  }
  wrap(LH.api, '');
})(window.LH);

/* ================= Live backend layer (USE_MOCK=0) =================
   Overrides every LH.api.* method above with fetch()+JWT equivalents.
   Shapes returned match the mock shapes (aliased where the REST contract
   differs: instructor/students/modules/short, course, lastActive, time,
   recent-grade fields) so pages render identically in both modes. */
(function (LH) {
  'use strict';

  if (LH.USE_MOCK) return;
  var API = LH.api;

  function token() {
    try { return localStorage.getItem('learnhub-token') || ''; } catch (e) { return ''; }
  }
  function saveToken(t) {
    try { if (t) localStorage.setItem('learnhub-token', t); } catch (e) { /* ignore */ }
  }
  function dropToken() {
    try { localStorage.removeItem('learnhub-token'); } catch (e) { /* ignore */ }
  }
  function saveRefresh(t, persistent) {
    try {
      if (!t) return;
      localStorage.removeItem('learnhub-refresh');
      sessionStorage.removeItem('learnhub-refresh');
      (persistent ? localStorage : sessionStorage).setItem('learnhub-refresh', t);
    } catch (e) { /* ignore */ }
  }
  function readRefresh() {
    try {
      return sessionStorage.getItem('learnhub-refresh')
        || localStorage.getItem('learnhub-refresh') || '';
    } catch (e) { return ''; }
  }
  function refreshIsPersistent() {
    try { return !!localStorage.getItem('learnhub-refresh'); } catch (e) { return true; }
  }
  function dropRefresh() {
    try { localStorage.removeItem('learnhub-refresh'); } catch (e) { /* ignore */ }
    try { sessionStorage.removeItem('learnhub-refresh'); } catch (e) { /* ignore */ }
  }
  function dropSession() {
    dropToken();
    dropRefresh();
    try { clearGetCache(); } catch (e) { /* ignore */ }
    try { localStorage.removeItem('learnhub-user'); } catch (e) { /* ignore */ }
  }
  var refreshInflight = null;
  /* Hung connections must never freeze the UI: abort any request that
     takes longer than this (rapid refreshes can briefly saturate the
     backend, and without a timeout one stall blocks the whole page). */
  var FETCH_TIMEOUT_MS = 15000;
  function fetchWithTimeout(url, opts) {
    opts = opts || {};
    try {
      if (typeof AbortController !== 'undefined') {
        var ctrl = new AbortController();
        var timer = setTimeout(function () { try { ctrl.abort(); } catch (e) { /* ignore */ } }, FETCH_TIMEOUT_MS);
        opts.signal = ctrl.signal;
        return fetch(url, opts).then(function (r) { clearTimeout(timer); return r; }, function (e) { clearTimeout(timer); throw e; });
      }
    } catch (e) { /* fall through to plain fetch */ }
    return fetch(url, opts);
  }
  /* Unreachable-server detection: fetch only rejects on network-level
     failure (refused/timeout/DNS — e.g. a stale saved API host from an old
     Wi-Fi). HTTP statuses, even 500s, mean the server IS reachable. After 3
     consecutive network failures, show one sticky notice naming the exact
     base URL with a one-click reset — otherwise this surfaces as cryptic
     console errors plus misleading empty states. */
  var netFailCount = 0;
  var netToastShown = false;
  function isNetworkFailure(e) {
    if (!e) return false;
    try {
      if (e instanceof TypeError) return true;
      if (e.name === 'AbortError' || e.name === 'TypeError') return true;
      return /failed to fetch|networkerror|load failed|connection|refused/i.test(String(e.message || e));
    } catch (err) { return false; }
  }
  function noteApiSuccess() { netFailCount = 0; }
  function noteApiFailure(e) {
    if (!isNetworkFailure(e)) { netFailCount = 0; return; }
    netFailCount++;
    if (netFailCount >= 3 && !netToastShown) {
      netToastShown = true;
      showServerUnreachable();
    }
  }
  function showServerUnreachable() {
    try {
      var msg = 'Tried ' + (LH.API_BASE || '(unknown)') + ' and got no response. ' +
        'If you changed Wi-Fi or opened an old link, reset to this device\u2019s server.';
      if (LH.toast && LH.toast.error) {
        LH.toast.error('Can\u2019t reach the server', msg, { duration: 0, action: {
          label: 'Use this device',
          handler: function () {
            try { LH.resetApiBase(); } catch (e) { /* ignore */ }
            window.location.reload();
          }
        } });
      }
    } catch (e) { /* never break the app on a notice */ }
  }
  function tryRefresh() {
    if (refreshInflight) return refreshInflight;
    var rt = readRefresh();
    if (!rt) return Promise.resolve(false);
    refreshInflight = fetchWithTimeout(LH.API_BASE + '/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt })
    }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      refreshInflight = null;
      noteApiSuccess();
      if (d && d.ok && d.token) {
        saveToken(d.token);
        saveRefresh(d.refreshToken, refreshIsPersistent());
        try { if (d.user) localStorage.setItem('learnhub-user', JSON.stringify(d.user)); } catch (e) { /* ignore */ }
        return true;
      }
      return false;
    }).catch(function (e) {
      refreshInflight = null;
      noteApiFailure(e);
      return 'error';
    });
    return refreshInflight;
  }
  function headers(json) {
    var h = {};
    if (json) h['Content-Type'] = 'application/json';
    var t = token();
    if (t) h['Authorization'] = 'Bearer ' + t;
    return h;
  }
  function req(path, opts) {
    opts = opts || {};
    return fetchWithTimeout(LH.API_BASE + path, opts).then(function (r) {
      noteApiSuccess();
      if (r.status === 204) return null;
      if (r.status === 401) return on401(path, opts);
      return handleResponse(r);
    }, function (e) { noteApiFailure(e); throw e; });
  }
  function handleResponse(r) {
    return r.text().then(function (text) {
      var d = null;
      try { d = text ? JSON.parse(text) : null; } catch (e) { d = null; }
      if (!r.ok) {
        var err = (d && d.error) || ('Request failed (HTTP ' + r.status + ')');
        var ex = { ok: false, error: err, status: r.status, data: d };
        throw ex;
      }
      return d;
    });
  }
  function on401(path, opts) {
    /* Try one silent refresh (fresh access token, same session) before
       giving up — except on auth paths themselves to avoid loops. */
    if (!opts._refreshed && path.indexOf('/auth/') !== 0) {
      return tryRefresh().then(function (ok) {
        /* Refresh-request network failure means the SERVER is unreachable,
           not that the session died: surface it instead of wrongfully
           logging the user out to login?expired=1. */
        if (ok === 'error') throw { ok: false, error: 'Cannot reach the server. Check your connection and try again.', status: 0 };
        if (!ok) return expireSession();
        opts._refreshed = true;
        var h = typeof opts.body === 'string'
          ? headers(true)
          : (function () {
              var t = '';
              try { t = localStorage.getItem('learnhub-token') || ''; } catch (e) { /* ignore */ }
              var hh = opts.headers || {};
              if (t) hh['Authorization'] = 'Bearer ' + t;
              return hh;
            })();
        opts.headers = h;
        return fetchWithTimeout(LH.API_BASE + path, opts).then(function (r2) {
          noteApiSuccess();
          if (r2.status === 204) return null;
          if (r2.status === 401) return expireSession();
          return handleResponse(r2);
        }, function (e2) { noteApiFailure(e2); throw e2; });
      });
    }
    return expireSession();
  }
  function expireSession() {
    /* Session expired/invalid: drop it and send back to login once.
       Without this, expired tokens surface as misleading empty states
       ("Course not found", blank lists) instead of a re-login. */
    dropSession();
    try {
      var p = window.location.pathname || '';
      if (p.indexOf('/auth/login.html') === -1 && !window.__lh401) {
        window.__lh401 = true;
        var base = p.indexOf('/pages/') !== -1 ? p.slice(0, p.indexOf('/pages/') + 7) : '';
        window.location.href = base + 'auth/login.html?expired=1';
      }
    } catch (e) { /* ignore */ }
    throw { ok: false, error: 'Session expired. Please log in again.', status: 401 };
  }
  function get(path) { return cachedGet(path); }
  function post(path, body) {
    clearGetCache();
    return req(path, { method: 'POST', headers: headers(true), body: JSON.stringify(body || {}) });
  }
  function patch(path, body) {
    clearGetCache();
    return req(path, { method: 'PATCH', headers: headers(true), body: JSON.stringify(body || {}) });
  }
  function put(path, body) {
    clearGetCache();
    return req(path, { method: 'PUT', headers: headers(true), body: JSON.stringify(body || {}) });
  }
  function del(path) {
    clearGetCache();
    return req(path, { method: 'DELETE', headers: headers(false) });
  }
  /* GET coalescing: one dashboard load fires the same GETs repeatedly
     (enrollments ×3, progress ×2 per course, notifications ×3). Identical
     in-flight GETs share one promise, and results are reused briefly so
     rapid refreshes / parallel sections reuse them instead of storming the
     backend. Any mutation clears the cache so later reads stay fresh. */
  var GET_TTL_MS = 8000;
  var getCache = {};
  function clearGetCache() { getCache = {}; }
  function cachedGet(path) {
    var hit = getCache[path];
    if (hit) {
      if (hit.promise) return hit.promise;
      if (hit.data !== undefined) {
        try {
          if (Date.now() - hit.at < GET_TTL_MS) return Promise.resolve(hit.data);
        } catch (e) { /* fall through and refetch */ }
      }
    }
    var entry = { promise: null, data: undefined, at: 0 };
    getCache[path] = entry;
    entry.promise = req(path, { method: 'GET', headers: headers(false) }).then(function (d) {
      entry.promise = null;
      entry.data = d;
      try { entry.at = Date.now(); } catch (e) { entry.at = 0; }
      return d;
    }, function (e) {
      if (getCache[path] === entry) delete getCache[path];
      throw e;
    });
    return entry.promise;
  }
  function dataOf(promise) {
    return promise.then(function (d) { return (d && d.data) || []; });
  }
  /* Backend takes bytes; the UI works with human sizes ("128 KB"). */
  function sizeBytesOf(v) {
    if (v == null || v === '') return null;
    if (typeof v === 'number' && isFinite(v)) return Math.round(v);
    var m = String(v).trim().match(/^([\d.]+)\s*(b|kb|mb|gb)?$/i);
    if (!m) return null;
    var mult = { b: 1, kb: 1024, mb: 1048576, gb: 1073741824 }[(m[2] || 'b').toLowerCase()];
    return Math.round(parseFloat(m[1]) * mult);
  }
  function isoLocal(d) {
    if (!d) return d;
    if (Object.prototype.toString.call(d) === '[object Date]') {
      if (isNaN(d.getTime())) return null;
      var p = function (n) { return (n < 10 ? '0' : '') + n; };
      return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
        'T' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
    }
    var s = String(d);
    var m = s.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?)/);
    return m ? m[1] + (m[2] ? '' : ':00') : s;
  }

  /* Mock-shape adapters (see header comment). */
  function aliasCourse(c) {
    if (!c) return c;
    if (c.studentsCount != null) c.students = c.studentsCount;
    if (c.instructorName != null) c.instructor = c.instructorName;
    if (c.modulesTotal != null) c.modules = c.modulesTotal;
    if (c.shortName != null) c.short = c.shortName;
    return c;
  }
  function aliasCourses(list) {
    return (list || []).map(aliasCourse);
  }
  function aliasAssignment(a) {
    if (!a) return a;
    if (a.courseName != null) a.course = a.courseName;
    if (a.dueAt != null) a.due = a.dueAt;
    return a;
  }
  function aliasUser(u) {
    if (!u) return u;
    if (u.lastActiveAt != null && u.lastActive == null) u.lastActive = u.lastActiveAt;
    return u;
  }
  function aliasNotification(n) {
    if (!n) return n;
    return {
      id: n.id, type: n.type, title: n.title, message: n.message,
      time: n.createdAt || n.time, course: n.courseId != null ? n.courseId : n.course,
      read: !!n.read
    };
  }
  function aliasGrade(g) {
    if (!g) return g;
    return {
      id: g.id, courseId: g.courseId, course: g.courseName != null ? g.courseName : g.course,
      assessment: g.assessment, type: g.type, score: g.score,
      max: g.maxScore != null ? g.maxScore : g.max, date: g.gradedAt || g.date, pct: g.pct
    };
  }
  function aliasQuiz(q) {
    if (!q) return q;
    if (q.courseName != null) q.course = q.courseName;
    if (q.questionCount != null) q.questions = q.questionCount;
    if (q.durationMin != null) q.duration = q.durationMin;
    if (q.dueAt != null) q.due = q.dueAt;
    return q;
  }

  /* ------------------------------ Auth ------------------------------ */

  API.auth.login = function (email, password, remember) {
    return post('/auth/login', { email: email, password: password }).then(function (d) {
      if (d && d.ok && d.token) {
        saveToken(d.token);
        saveRefresh(d.refreshToken, remember !== false);
        try { localStorage.setItem('learnhub-user', JSON.stringify(d.user)); } catch (e) { /* ignore */ }
      }
      return d;
    }).catch(function (e) {
      if (e && e.data && typeof e.data.suspended !== 'undefined' && e.data.suspended) {
        return { ok: false, suspended: true };
      }
      var msg = e && (e.error || (e.data && e.data.error));
      return { ok: false, error: msg || undefined };
    });
  };
  API.auth.logout = function () {
    var rt = readRefresh();
    dropSession();
    post('/auth/logout', { refreshToken: rt || null }).catch(function () { /* fire-and-forget */ });
    return true;
  };
  API.auth.logoutAll = function () {
    return post('/auth/logout-all', {}).then(function (d) {
      dropSession();
      return d;
    }).catch(function (e) {
      dropSession();
      throw e;
    });
  };
  API.auth.register = function (name, email, password) {
    return post('/auth/register', { name: name, email: email, password: password }).then(function (d) {
      if (d && d.ok && d.token) {
        saveToken(d.token);
        saveRefresh(d.refreshToken, true);
        try { localStorage.setItem('learnhub-user', JSON.stringify(d.user)); } catch (e) { /* ignore */ }
      }
      return d;
    }).catch(function (e) {
      return { ok: false, error: (e && (e.error || (e.data && e.data.error))) || 'Registration failed.' };
    });
  };
  API.auth.forgotPassword = function (email) {
    return post('/auth/forgot-password', { email: email });
  };
  API.auth.resetPassword = function (token, newPassword) {
    return post('/auth/reset-password', { token: token, newPassword: newPassword });
  };
  /* Email OTP verification (new endpoints; same POST shape as the rest). */
  API.auth.verifyOtp = function (email, code) {
    return post('/auth/verify-otp', { email: email, code: code }).then(function (d) {
      if (d && d.ok && d.token) {
        saveToken(d.token);
        saveRefresh(d.refreshToken, true);
        try { localStorage.setItem('learnhub-user', JSON.stringify(d.user)); } catch (e) { /* ignore */ }
      }
      return d;
    }).catch(function (e) {
      return { ok: false, error: (e && (e.error || (e.data && e.data.error))) || 'Verification failed.' };
    });
  };
  API.auth.resendOtp = function (email) {
    return post('/auth/resend-otp', { email: email }).catch(function (e) {
      return { ok: false, error: (e && (e.error || (e.data && e.data.error))) || 'Could not resend the code.' };
    });
  };

  /* ------------------------------ Courses ------------------------------ */

  function fetchCourses(params) {
    var qs = '?size=200';
    if (params) {
      Object.keys(params).forEach(function (k) {
        if (params[k] != null && params[k] !== '') qs += '&' + k + '=' + encodeURIComponent(params[k]);
      });
    }
    return dataOf(get('/courses' + qs)).then(aliasCourses);
  }
  API.courses.list = function () { return fetchCourses(); };
  API.courses.get = function (id) { return get('/courses/' + id).then(aliasCourse); };
  API.courses.byInstructor = function (name) {
    return fetchCourses().then(function (list) {
      return list.filter(function (c) { return c.instructor === name; });
    });
  };
  API.courses.byInstructorId = function (instructorId) {
    return fetchCourses({ instructorId: instructorId });
  };
  API.courses.published = function () { return fetchCourses({ status: 'published' }); };
  API.courses.search = function (term) { return fetchCourses({ query: term || '' }); };
  API.courses.enrolled = function () {
    return get('/students/me/enrollments').then(function (rows) {
      return (rows || []).map(function (e) { return aliasCourse(e.course); }).filter(Boolean);
    });
  };
  API.courses.ratings = function () {
    return fetchCourses().then(function (list) {
      return list.map(function (c, i) {
        return { id: c.id, rating: (4.2 + ((i * 13) % 7) / 10).toFixed(1) * 1, reviews: 120 + i * 14 };
      });
    });
  };
  API.courses.create = function (data) {
    return post('/courses', {
      code: data.code, name: data.name, description: data.description,
      category: data.category, credits: data.credits, status: data.status,
      outcomes: data.outcomes || null
    }).then(aliasCourse);
  };
  API.courses.update = function (id, p) { return patch('/courses/' + id, p).then(aliasCourse); };
  API.courses.setStatus = function (id, status) {
    return patch('/courses/' + id + '/status', { status: status }).then(aliasCourse);
  };
  API.courses.remove = function (id) { return del('/courses/' + id); };
  API.courses.roster = function (courseId) {
    return get('/courses/' + courseId + '/roster');
  };
  API.courses.studentProgress = function (courseId) {
    return get('/courses/' + courseId + '/student-progress');
  };
  API.courses.ownedBy = function (courseId, user) {
    if (user && user.role === 'admin') return Promise.resolve(true);
    return API.courses.get(courseId).then(function (c) {
      if (!c) return false;
      var ownerId = c.instructorId != null ? c.instructorId : null;
      return !!user && ownerId != null && String(ownerId) === String(user.id);
    }).catch(function () { return false; });
  };

  /* ------------------------------ Modules & lessons ------------------------------ */

  API.modules.forCourse = function (courseId) { return get('/courses/' + courseId + '/modules'); };
  API.modules.create = function (courseId, title) {
    return post('/courses/' + courseId + '/modules', { title: title });
  };
  API.modules.update = function (id, p) {
    return patch('/modules/' + id, { title: (p && (p.title || p.name)) || '' });
  };
  API.modules.remove = function (id) { return del('/modules/' + id); };
  API.modules.reorder = function (courseId, orderedIds) {
    return put('/courses/' + courseId + '/modules/reorder', { orderedIds: orderedIds });
  };
  API.lessons.forModule = function (moduleId) { return get('/modules/' + moduleId + '/lessons'); };
  API.lessons.byCourse = function (courseId) { return get('/courses/' + courseId + '/lessons'); };
  API.lessons.countForCourse = function (courseId) {
    return get('/courses/' + courseId + '/lessons').then(function (list) {
      return (list || []).length;
    });
  };
  API.lessons.create = function (moduleId, data) {
    return post('/modules/' + moduleId + '/lessons', {
      title: data.title, content: data.content, type: data.type,
      meta: data.meta, sizeBytes: sizeBytesOf(data.size != null ? data.size : data.sizeBytes),
      fileUrl: data.fileUrl || null
    });
  };
  API.lessons.update = function (id, p) {
    var body = Object.assign({}, p || {});
    if (body.size != null && body.sizeBytes == null) body.sizeBytes = sizeBytesOf(body.size);
    delete body.size;
    return patch('/lessons/' + id, body);
  };
  API.lessons.remove = function (id) { return del('/lessons/' + id); };
  API.lessons.reorder = function (moduleId, orderedIds) {
    return put('/modules/' + moduleId + '/lessons/reorder', { orderedIds: orderedIds });
  };
  API.lessons.markComplete = function (studentId, lessonId) {
    return post('/lessons/' + lessonId + '/complete', {});
  };

  /* ------------------------------ Enrollments ------------------------------ */

  API.enrollments.isEnrolled = function (studentId, courseId) {
    return get('/students/me/enrollments').then(function (rows) {
      return (rows || []).some(function (e) { return e.course && e.course.id === courseId; });
    });
  };
  API.enrollments.enroll = function (studentId, courseId) {
    return post('/courses/' + courseId + '/enroll', {}).catch(function (e) {
      return { ok: false, error: (e && e.error) || 'Enrollment failed.' };
    });
  };
  API.enrollments.forStudent = function () { return get('/students/me/enrollments'); };
  API.enrollments.forCourse = function (courseId) {
    return get('/courses/' + courseId + '/enrollments');
  };
  API.enrollments.progress = function (studentId, courseId) {
    var qs = studentId ? '?studentId=' + encodeURIComponent(studentId) : '';
    return get('/courses/' + courseId + '/progress' + qs);
  };

  /* ------------------------------ Assignments ------------------------------ */

  API.assignments.list = function () {
    return get('/students/me/assignments').then(function (list) {
      return (list || []).map(aliasAssignment);
    });
  };
  API.assignments.get = function (id) {
    return get('/assignments/' + id).then(aliasAssignment);
  };
  API.assignments.forCourse = function (courseId) {
    return get('/courses/' + courseId + '/assignments').then(function (list) {
      return (list || []).map(aliasAssignment);
    });
  };
  API.assignments.courseName = function (id) {
    return API.courses.get(id).then(function (c) { return c ? (c.short || c.name) : id; });
  };
  API.assignments.create = function (data) {
    return post('/courses/' + data.courseId + '/assignments', {
      title: data.title, maxMarks: data.maxScore || data.maxMarks || 20,
      due: isoLocal(data.due), description: data.description || '',
      attachments: data.attachments || null
    }).then(aliasAssignment);
  };
  API.assignments.update = function (id, p) {
    var body = Object.assign({}, p);
    if (body.due) body.due = isoLocal(body.due);
    return patch('/assignments/' + id, body).then(aliasAssignment);
  };
  API.assignments.remove = function (id) { return del('/assignments/' + id); };
  API.assignments.nextDeadline = function () {
    return API.assignments.list().then(function (list) {
      var upcoming = list.filter(function (a) { return !a.graded && a.status !== 'overdue'; })
        .sort(function (a, b) { return new Date(a.dueAt || a.due) - new Date(b.dueAt || b.due); });
      return upcoming[0] || null;
    });
  };
  API.assignments.gradebook = function (courseId) {
    return get('/courses/' + courseId + '/gradebook');
  };

  /* ------------------------------ Submissions ------------------------------ */

  API.submissions.forAssignment = function (assignmentId) {
    return get('/assignments/' + assignmentId + '/submissions');
  };
  API.submissions.forStudent = function (studentId, assignmentId) {
    var path = '/students/me/submissions' + (assignmentId ? '?assignmentId=' + assignmentId : '');
    return get(path);
  };
  API.submissions.byCourse = function (courseId) {
    return get('/courses/' + courseId + '/submissions');
  };
  API.submissions.ungradedByCourse = function (courseId) {
    return get('/courses/' + courseId + '/submissions?ungraded=1');
  };
  API.submissions.submit = function (studentId, assignmentId, content, fileUrl) {
    var body = { content: content };
    if (fileUrl != null) body.fileUrl = fileUrl;
    return post('/assignments/' + assignmentId + '/submit', body)
      .then(function (d) { return { ok: true, submission: d.submission || d }; })
      .catch(function (e) { return { ok: false, error: (e && e.error) || 'Submit failed.' }; });
  };
  API.submissions.grade = function (assignmentId, submissionId, score, feedback) {
    return post('/submissions/' + submissionId + '/grade',
      { assignmentId: assignmentId, score: score, feedback: feedback })
      .then(function (d) { return { ok: true, submission: d.submission || d }; })
      .catch(function (e) { return { ok: false, error: (e && e.error) || 'Grading failed.' }; });
  };

  /* ------------------------------ Announcements ------------------------------ */

  API.announcements.forCourse = function (courseId) {
    return get('/courses/' + courseId + '/announcements');
  };
  API.announcements.create = function (data) {
    return post('/courses/' + data.courseId + '/announcements',
      { title: data.title, body: data.body });
  };
  API.announcements.remove = function (id) { return del('/announcements/' + id); };

  /* ------------------------------ Quizzes ------------------------------ */

  API.quizzes.list = function () {
    return dataOf(get('/quizzes?size=200')).then(function (list) {
      return (list || []).map(aliasQuiz);
    });
  };
  API.quizzes.get = function (id) {
    return get('/quizzes/' + id).then(aliasQuiz);
  };
  API.quizzes.questions = function (id) { return get('/quizzes/' + id + '/questions'); };
  API.quizzes.courseName = function (id) {
    return API.quizzes.get(id).then(function (q) {
      if (!q || !q.courseId) return id;
      return API.assignments.courseName(q.courseId);
    });
  };
  API.quizzes.include = function (rec) {
    return post('/quizzes', {
      courseId: rec.courseId, title: rec.title,
      durationMin: rec.duration != null ? rec.duration : rec.durationMin,
      attemptsMax: rec.attemptsMax != null ? rec.attemptsMax : 2,
      dueAt: isoLocal(rec.due || rec.dueAt), status: rec.status
    });
  };
  API.quizzes.replaceQuestions = function (quizId, questions) {
    var mapped = (questions || []).map(function (x) {
      return { q: x.q || x.text, options: x.options, answer: x.answer };
    });
    return put('/quizzes/' + quizId + '/questions', { questions: mapped });
  };
  API.quizzes.remove = function (id) { return del('/quizzes/' + id); };
  API.quizzes.update = function (id, p) {
    p = p || {};
    var body = {};
    if (p.title != null) body.title = p.title;
    if (p.durationMin != null) body.durationMin = p.durationMin;
    if (p.duration != null && body.durationMin == null) body.durationMin = p.duration;
    if (p.attemptsMax != null) body.attemptsMax = p.attemptsMax;
    if (p.due !== undefined) body.dueAt = p.due ? isoLocal(p.due) : null;
    else if (p.dueAt !== undefined) body.dueAt = p.dueAt ? isoLocal(p.dueAt) : null;
    if (p.status != null) body.status = p.status;
    return patch('/quizzes/' + id, body);
  };
  API.quizzes.attempts = function (quizId) {
    return get('/quizzes/' + quizId + '/attempts');
  };
  API.quizzes.attempt = function (quizId, answers) {
    return post('/quizzes/' + quizId + '/attempts', { answers: answers || [] });
  };
  API.quizzes.nextQuiz = function () {
    return API.quizzes.list().then(function (list) {
      var upcoming = list.filter(function (q) { return !q.taken; })
        .sort(function (a, b) { return new Date(a.dueAt || a.due) - new Date(b.dueAt || b.due); });
      return upcoming[0] || null;
    });
  };

  /* ------------------------------ Grades ------------------------------ */

  API.grades.list = function () {
    return get('/students/me/grades').then(function (list) {
      return (list || []).map(aliasGrade);
    });
  };
  API.grades.summary = function () {
    return get('/students/me/grades/summary').then(function (s) {
      if (s && s.recent) s.recent = s.recent.map(aliasGrade);
      return s;
    });
  };

  /* ------------------------------ Attendance ------------------------------ */

  API.attendance.list = function () { return get('/students/me/attendance'); };
  API.attendance.overall = function () { return get('/students/me/attendance/overall'); };
  API.attendance.history = function () { return get('/students/me/attendance/history'); };
  API.attendance.takeSession = function (courseId, payload) {
    return post('/courses/' + courseId + '/attendance/sessions', payload);
  };
  API.attendance.classView = function (courseId) {
    return get('/courses/' + courseId + '/attendance');
  };
  API.attendance.daySession = function (courseId, date) {
    return get('/courses/' + courseId + '/attendance/sessions?date=' + encodeURIComponent(date));
  };

  /* ------------------------------ Notifications ------------------------------ */

  API.notifications.list = function () {
    return get('/notifications/me').then(function (list) {
      return (list || []).map(aliasNotification);
    });
  };
  API.notifications.unreadCount = function () {
    return get('/notifications/unread-count').then(function (d) {
      return d ? d.count : 0;
    });
  };
  API.notifications.markRead = function (id) {
    return patch('/notifications/' + id + '/read', {}).then(function () { return true; });
  };
  API.notifications.markAllRead = function () {
    return post('/notifications/read-all', {}).then(function () { return true; });
  };
  API.notifications.broadcast = function (title, message) {
    return post('/notifications/broadcast', { title: title, message: message });
  };

  /* ------------------------------ Users ------------------------------ */

  API.users.list = function () { return dataOf(get('/users?size=200'));
  };
  API.users.me = function () { return get('/users/me').then(aliasUser); };
  API.users.get = function (id) { return get('/users/' + id).then(aliasUser); };
  API.users.findByEmail = function (email) {
    return dataOf(get('/users?query=' + encodeURIComponent(email) + '&size=200'))
      .then(function (list) { return list[0] || null; });
  };
  API.users.setRole = function (id, role) {
    return patch('/users/' + id + '/role', { role: role }).then(aliasUser);
  };
  API.users.flipStatus = function (id) {
    return patch('/users/' + id + '/status', {}).then(aliasUser);
  };
  API.users.changePassword = function (current, next) {
    return post('/users/me/password', { current: current, next: next });
  };

  /* ------------------------------ Faculty ------------------------------ */

  API.faculty.pendingSubmissions = function () {
    return get('/faculty/me/pending-submissions');
  };
  API.faculty.activity = function () { return get('/faculty/me/activity'); };
  API.faculty.courses = function () { return get('/courses/mine'); };

  /* ------------------------------ Admin ------------------------------ */

  function filterAll(list, opts, keys, statusKey) {
    var q = (((opts || {}).query) || '').toLowerCase();
    var status = (opts || {}).status || 'all';
    var role = (opts || {}).role || 'all';
    var dept = (opts || {}).dept || 'all';
    return (list || []).filter(function (x) {
      var matchQ = !q || keys.some(function (k) {
        return ((x[k] == null ? '' : String(x[k])).toLowerCase().indexOf(q) !== -1);
      });
      var sv = statusKey ? x[statusKey] : x.status;
      var matchS = status === 'all' || sv === status ||
        (statusKey === 'status' && status === 'published' && sv == null);
      var matchR = role === 'all' || x.role === role;
      var matchD = dept === 'all' || x.dept === dept;
      return matchQ && matchS && matchR && matchD;
    });
  }
  API.admin.stats = function () { return get('/admin/statistics'); };
  API.admin.statistics = function () { return get('/admin/statistics'); };
  API.admin.students = function (opts) {
    return dataOf(get('/students?size=200')).then(function (list) {
      return filterAll(list.map(function (s) {
        return {
          id: s.id, name: s.name, email: s.email, program: s.program, year: s.year,
          courses: s.courses,
          attendance: s.attendance == null ? '—' : s.attendance + '%',
          gpa: s.gpa == null ? '—' : (Math.round(s.gpa * 10) / 10),
          status: s.status, joined: s.joined
        };
      }), opts, ['name', 'email', 'program']);
    });
  };
  API.admin.faculty = function (opts) {
    return dataOf(get('/faculty?size=200')).then(function (list) {
      return filterAll(list, opts, ['name', 'email']);
    });
  };
  API.admin.courses = function (opts) {
    var qs = '?size=200';
    if (opts && opts.query) qs += '&query=' + encodeURIComponent(opts.query);
    if (opts && opts.status && opts.status !== 'all') qs += '&status=' + encodeURIComponent(opts.status);
    return dataOf(get('/courses' + qs)).then(function (list) {
      return filterAll(aliasCourses(list), opts, ['name', 'code', 'instructor'], 'status');
    });
  };
  API.admin.users = function (opts) {
    return dataOf(get('/users?size=200')).then(function (list) {
      return filterAll(list.map(aliasUser), opts, ['name', 'email']);
    });
  };
  API.admin.systemActivity = function () { return get('/admin/activity'); };
  API.admin.reports = function () { return get('/admin/reports'); };
  API.admin.getSettings = function () { return get('/admin/settings'); };
  API.admin.patchSettings = function (body) { return patch('/admin/settings', body || {}); };
  API.admin.wipeInstance = function () { return post('/admin/wipe', {}); };
  API.admin.changeUserRole = function (id, role) { return API.users.setRole(id, role); };
  API.admin.flipUserStatus = function (id) { return API.users.flipStatus(id); };
  API.admin.verifyEmail = function (id) { return patch('/users/' + id + '/verify-email', {}).then(aliasUser); };
  API.admin.createUser = function (data) { return post('/users', data || {}).then(aliasUser); };
  API.admin.downloadExport = function (type) {
    var t = type || 'users';
    return fetch(LH.API_BASE + '/admin/export?type=' + encodeURIComponent(t),
      { method: 'GET', headers: headers(false) }).then(function (r) {
      if (!r.ok) throw { ok: false, error: 'Export failed (HTTP ' + r.status + ')' };
      return r.blob();
    }).then(function (blob) {
      var url = (window.URL || window.webkitURL).createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = t + '-export.csv';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        document.body.removeChild(a);
        (window.URL || window.webkitURL).revokeObjectURL(url);
      }, 500);
      try { LH.toast.success('Report ready', 'The CSV export has been downloaded.'); } catch (e) { /* ignore */ }
      return true;
    });
  };

  /* ------------------------------ Files ------------------------------ */

  API.storage = {
    upload: function (file) {
      var fd = new FormData();
      fd.append('file', file);
      var t = '';
      try { t = localStorage.getItem('learnhub-token') || ''; } catch (e) { /* ignore */ }
      var h = {};
      if (t) h['Authorization'] = 'Bearer ' + t;
      return req('/uploads', { method: 'POST', headers: h, body: fd });
    }
  };

  /* ------------------------------ Profile ------------------------------ */

  API.profile.update = function (p) {
    return patch('/users/me', p || {}).then(function (user) {
      try { localStorage.setItem('learnhub-user', JSON.stringify(user)); } catch (e) { /* ignore */ }
      return user;
    });
  };

  API.profile.avatar = function (file) {
    var fd = new FormData();
    fd.append('file', file);
    var t = '';
    try { t = localStorage.getItem('learnhub-token') || ''; } catch (e) { /* ignore */ }
    var h = {};
    if (t) h['Authorization'] = 'Bearer ' + t;
    return req('/users/me/avatar', { method: 'POST', headers: h, body: fd }).then(function (user) {
      try { localStorage.setItem('learnhub-user', JSON.stringify(user)); } catch (e) { /* ignore */ }
      return { ok: true, user: user, avatarUrl: user ? user.avatarUrl : null };
    });
  };

})(window.LH);

/* Mock-mode default for the export button (overridden by the live layer above). */
(function (LH) {
  'use strict';
  if (!LH.api.admin.downloadExport) {
    LH.api.admin.downloadExport = function () {
      try { LH.toast.success('Report ready', 'The CSV export has been generated to your downloads.'); } catch (e) { /* ignore */ }
      return true;
    };
  }
})(window.LH);