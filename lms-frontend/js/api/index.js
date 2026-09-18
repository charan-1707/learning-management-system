window.LH = window.LH || {};

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
    }
  };

  API.homeFor = function (role) {
    var paths = { student: 'pages/student/dashboard.html', faculty: 'pages/faculty/dashboard.html', admin: 'pages/admin/dashboard.html' };
    return paths[role] || 'pages/auth/login.html';
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
    ownedBy: function (courseId, user) { return DB.courses.ownedBy(courseId, user); }
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
    create: function (moduleId, data) { return resolve(DB.lessons.create(moduleId, data)); },
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
        gradedDate: null, submittedDate: null, description: data.description || '', attachments: []
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
    submit: function (studentId, assignmentId, content) { return resolve(DB.submit(studentId, assignmentId, content)); },
    grade: function (assignmentId, submissionId, score, feedback) {
      var result = DB.submissions.grade(assignmentId, submissionId, score, feedback);
      if (LH.live && LH.live.enabled) LH.live.submissionGrade(submissionId, score, feedback);
      return resolve(result);
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
    include: function (rec) {
      var created = DB.create('quizzes', rec);
      if (LH.live && LH.live.enabled) LH.live.quizInclude(rec);
      return resolve(created);
    },
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
    overall: function () {
      var total = 0, present = 0, count = 0;
      DB.list('attendance').forEach(function (a) {
        total += a.total; present += a.present; count++;
      });
      return resolve({ present: present, total: total, percent: total ? Math.round(present / total * 100) : 0, courses: count });
    },
    history: function () { return resolve(DB.list('attendanceHistory')); }
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
      if (LH.live && LH.live.enabled) LH.live.notifRead(id);
      return resolve(true);
    },
    markAllRead: function () {
      DB.list('notifications').forEach(function (n) { n.read = true; });
      DB.persist('notifications');
      if (LH.live && LH.live.enabled) LH.live.notifReadAll();
      return resolve(true);
    }
  };

  /* ------------------------------ Users ------------------------------ */

  API.users = {
    list: function () { return resolve(DB.list('users')); },
    get: function (id) { return resolve(DB.get('users', id)); },
    findByEmail: function (email) { return DB.users.findByEmail(email); },
    setRole: function (id, role) { return resolve(DB.users.setRole(id, role)); },
    flipStatus: function (id) { return resolve(DB.users.flipStatus(id)); }
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
    changeUserRole: function (id, role) { return resolve(DB.users.setRole(id, role)); },
    flipUserStatus: function (id) { return resolve(DB.users.flipStatus(id)); }
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
    }
  };

})(window.LH);