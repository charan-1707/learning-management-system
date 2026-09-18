window.LH = window.LH || {};

(function (LH) {
  'use strict';

  if (LH.live) return;

  var TOKEN_KEY = 'learnhub-token';
  var USER_KEY = 'learnhub-user';

  var live = LH.live = {};

  live.enabled = false;
  live.mode = 'mock';

  var readyResolve = null;
  var readyPromise = new Promise(function (res) { readyResolve = res; });
  live.ready = function () { return readyPromise; };

  var PALETTE = ['blue', 'green', 'purple', 'orange', 'teal', 'red'];

  function lower(s) { return s == null ? '' : String(s).toLowerCase(); }

  function num(v) { var n = Number(v); return isNaN(n) ? null : n; }

  function toDate(v) { return v ? new Date(v) : null; }

  function store(name) {
    return name === 'quizQuestions' ? (live.cache[name] || {}) : (live.cache[name] || []);
  }

  live.cache = {};
  live.publish = function (name, value) {
    live.cache[name] = value;
    if (LH.db && typeof LH.db.replace === 'function') LH.db.replace(name, value);
    if (window.LH && LH.mock) LH.mock[name] = value;
    return value;
  };

  live.collection = function (name) {
    return live.cache[name] || [];
  };

  live.setCollection = function (name, list) { return live.publish(name, list); };

  live.collectionObject = function (name) { return live.cache[name] || null; };

  function accentFor(category, i) {
    if (!category) return 'blue';
    return PALETTE[(category.length + (i || 0)) % PALETTE.length];
  }

  function ago(value) {
    var d = toDate(value);
    if (!d) return 'recently';
    var days = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (days <= 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 30) return days + ' days ago';
    return d.toLocaleDateString();
  }

  function mapUser(u) {
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: lower(u.role),
      status: lower(u.status),
      dept: '',
      title: '',
      program: '',
      year: '',
      joined: '',
      lastActive: null,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt
    };
  }

  function mapCourse(c, i) {
    return {
      id: c.id,
      code: c.code,
      name: c.title,
      short: c.title,
      description: c.description || '',
      category: c.category || 'General',
      instructor: c.facultyName || '',
      instructorId: c.facultyId,
      accent: accentFor(c.category, i),
      status: lower(c.status),
      progress: 0,
      modulesDone: 0,
      modulesTotal: 0,
      students: 0,
      credits: 3,
      semester: 'Fall 2026',
      updated: ago(c.updatedAt),
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      modules: []
    };
  }

  function mapModule(m, i) {
    return {
      id: m.id,
      courseId: m.courseId,
      title: m.title,
      description: m.description || '',
      orderIndex: m.displayOrder != null ? m.displayOrder : i + 1,
      lessonCount: m.lessonCount || 0
    };
  }

  function mapLesson(l, i) {
    return {
      id: l.id,
      moduleId: l.moduleId,
      title: l.title,
      content: l.description || '',
      orderIndex: l.displayOrder != null ? l.displayOrder : i + 1,
      type: lower(l.contentType),
      meta: l.contentUrl || '',
      size: null,
      duration: l.duration,
      completed: l.completed === true
    };
  }

  function mapAssignment(a) {
    return {
      id: a.id,
      title: a.title,
      courseId: a.courseId,
      course: a.courseTitle,
      maxMarks: num(a.maxMarks),
      due: toDate(a.dueDate),
      status: 'in-progress',
      submitted: false,
      graded: false,
      score: null,
      grade: null,
      gradedDate: null,
      submittedDate: null,
      description: a.description || '',
      attachments: []
    };
  }

  function mapSubmission(s, courseId) {
    return {
      id: s.id,
      assignmentId: s.assignmentId,
      courseId: courseId || 0,
      studentId: s.studentId,
      student: s.studentName || '',
      submittedAt: toDate(s.submittedAt),
      content: '',
      file: s.fileName || '',
      score: s.score != null ? num(s.score) : null,
      feedback: s.feedback || '',
      gradedAt: toDate(s.gradedAt),
      status: lower(s.status)
    };
  }

  function mapPending(s, courseId, courseTitle, assignmentTitle) {
    return {
      id: s.id,
      student: s.studentName || '',
      studentId: s.studentId,
      assignment: assignmentTitle || '',
      courseId: courseId || 0,
      course: courseTitle || '',
      submitted: toDate(s.submittedAt),
      status: 'pending',
      file: s.fileName || '',
      size: 0
    };
  }

  function mapQuiz(q) {
    return {
      id: q.id,
      title: q.title,
      courseId: q.courseId,
      course: q.courseTitle,
      questions: q.questionCount || 0,
      duration: q.durationMinutes || 0,
      attemptsMax: q.maxAttempts || 1,
      attempts: 0,
      bestScore: null,
      status: q.status === 'PUBLISHED' ? 'available' : 'draft',
      due: null,
      taken: false
    };
  }

  function optionIndex(letter) {
    var idx = lower(letter).charCodeAt(0) - 97;
    return idx >= 0 && idx < 4 ? idx : null;
  }

  function mapQuizQuestion(q) {
    return {
      q: q.questionText,
      options: [q.optionA || '', q.optionB || '', q.optionC || '', q.optionD || ''],
      answer: optionIndex(q.correctOption),
      id: q.id
    };
  }

  function mapAttemptQuestion(q) {
    return {
      q: q.questionText,
      options: [q.optionA || '', q.optionB || '', q.optionC || '', q.optionD || ''],
      answer: null,
      id: q.id
    };
  }

  function mapAnnouncement(a) {
    return {
      id: a.id,
      courseId: a.courseId,
      authorId: a.facultyId,
      authorName: a.facultyName || '',
      title: a.title,
      body: a.content,
      createdAt: toDate(a.createdAt)
    };
  }

  function mapGrade(g) {
    return {
      id: 'g' + g.assessmentId + '-' + g.courseId,
      courseId: g.courseId,
      course: g.course,
      assessment: g.assessment,
      type: g.type,
      score: num(g.score),
      max: num(g.max),
      date: toDate(g.date)
    };
  }

  function mapNotification(n) {
    return {
      id: n.id,
      type: lower(n.type),
      title: n.title,
      message: n.message,
      time: toDate(n.createdAt),
      course: '',
      read: !!n.isRead
    };
  }

  function mapEnrollment(e) {
    return {
      id: e.id,
      studentId: e.studentId,
      studentName: e.studentName,
      courseId: e.courseId,
      courseTitle: e.courseTitle,
      enrolledAt: toDate(e.enrolledAt),
      status: lower(e.status),
      progress: num(e.progress),
      progressPercent: Math.round(num(e.progress) || 0)
    };
  }

  function mapProgressRow(p) {
    return {
      id: p.id,
      studentId: p.studentId,
      lessonId: p.lessonId,
      completed: !!p.completed,
      completedAt: toDate(p.completedAt)
    };
  }

  /* ------------------------------ Transport ------------------------------ */

  live.getToken = function () {
    try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; }
  };

  live.getUser = function () {
    try {
      var raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  };

  live.saveUser = function (user) {
    try { localStorage.setItem(USER_KEY, JSON.stringify(user)); } catch (e) { /* ignore */ }
  };

  live.saveAuth = function (token, user) {
    try {
      localStorage.setItem(TOKEN_KEY, token || '');
      if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (e) { /* ignore */ }
  };

  live.clearAuth = function () {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (e) { /* ignore */ }
  };

  function authHeaders(body) {
    var h = { 'Accept': 'application/json' };
    if (body !== undefined) h['Content-Type'] = 'application/json';
    var t = live.getToken();
    if (t) h['Authorization'] = 'Bearer ' + t;
    return h;
  }

  function gotoLogin() {
    try {
      var target = '/pages/auth/login.html';
      if (window.location.pathname.indexOf('auth') !== -1) return;
      window.location.href = target;
    } catch (e) { /* ignore */ }
  }

  live.request = function (method, path, body, opts) {
    opts = opts || {};
    var init = { method: method, headers: authHeaders(body !== undefined), cache: 'no-store' };
    if (body !== undefined) init.body = JSON.stringify(body);
    return fetch(path, init).then(function (res) {
      if (res.status === 401 && live.enabled && !opts.skipAuth && live.getToken()) {
        live.clearAuth();
        gotoLogin();
      }
      return res;
    });
  };

  live.get = function (path) { return live.request('GET', path); };
  live.post = function (path, body) { return live.request('POST', path, body); };
  live.put = function (path, body) { return live.request('PUT', path, body); };
  live.patch = function (path, body) { return live.request('PATCH', path, body); };
  live.del = function (path) { return live.request('DELETE', path); };

  live.json = function (res, fallback) {
    if (!res) return Promise.resolve(fallback);
    if (res.status === 204) return Promise.resolve(fallback);
    return res.json().catch(function () { return fallback; });
  };

  live.errorMessage = function (res, fallbackMsg) {
    return res.json().then(function (body) {
      return (body && body.message) ? body.message : fallbackMsg;
    }).catch(function () { return fallbackMsg; });
  };

  /* ------------------------------ Mode probe ------------------------------ */

  live.probe = function () {
    return Promise.resolve()
      .then(function () { return fetch('/api/courses/published', { method: 'GET', cache: 'no-store' }); })
      .then(function (r) { return r.status !== 404 && r.status < 500; })
      .catch(function () { return false; })
      .then(function (reachable) {
        live.enabled = reachable;
        live.mode = reachable ? 'live' : 'mock';
        readyResolve(live.enabled);
        return live.enabled;
      });
  };

  live.probe();

  /* ------------------------------ Auth helpers ------------------------------ */

  function normalizeUser(u) {
    return mapUser(u);
  }

  live.login = function (email, password) {
    return live.request('POST', '/api/auth/login', { email: email, password: password }, { skipAuth: true })
      .then(function (res) {
        if (res.status === 401) { return { ok: false, message: 'Invalid email or password' }; }
        if (res.status === 403) { return { ok: false, message: 'Your account has been disabled.' }; }
        if (!res.ok) { return { ok: false, message: 'Sign in failed. Please try again.' }; }
        return res.json().then(function (data) {
          live.saveAuth(data.token, normalizeUser(data.user));
          return { ok: true, user: normalizeUser(data.user), token: data.token };
        });
      });
  };

  live.register = function (name, email, password) {
    return live.request('POST', '/api/auth/register', { name: name, email: email, password: password }, { skipAuth: true })
      .then(function (res) {
        if (res.status === 409) { return { ok: false, message: 'An account with that email already exists.' }; }
        if (!res.ok) { return { ok: false, message: 'Registration failed. Please try again.' }; }
        return res.json().then(function (data) {
          live.saveAuth(data.token, normalizeUser(data.user));
          return { ok: true, user: normalizeUser(data.user), token: data.token };
        });
      });
  };

  live.logout = function () { live.clearAuth(); };

  /* ------------------------------ Reads / hydrate ------------------------------ */

  var currentUser = null;
  live.currentUser = function () {
    if (!currentUser) currentUser = live.getUser();
    return currentUser;
  };

  function fetchJSON(path, fallback) {
    return live.get(path).then(function (r) { return live.json(r, fallback); });
  }

  function collect(name, list) {
    var merged = store(name).concat(list || []);
    live.publish(name, merged);
    return merged;
  }

  function storeById(name, list) {
    var byId = {};
    list.forEach(function (item) { byId[item.id] = item; });
    live.publish(name, byId);
    return byId;
  }

  function findCourse(id) {
    var list = store('courses');
    for (var i = 0; i < list.length; i++) { if (list[i].id === id) return list[i]; }
    return null;
  }

  function overlayEnrollment(e) {
    var c = findCourse(e.courseId);
    if (c) {
      c.progress = Math.round(num(e.progress) || 0);
      c.modulesTotal = c.modulesTotal || 0;
    }
    return c;
  }

  function fetchCoursesForRole(role, uid) {
    var path = '/api/courses/published';
    if (role === 'faculty') path = '/api/instructors/me/courses';
    if (role === 'admin') path = '/api/courses';
    return fetchJSON(path, []).then(function (list) {
      var mapped = list.map(mapCourse);
      live.publish('courses', mapped);
      return mapped;
    });
  }

  function loadCourseAssetsStudent(cid, uid) {
    var p = [];
    p.push(fetchJSON('/api/courses/' + cid + '/assignments', []).then(function (list) { collect('assignments', list.map(mapAssignment)); }));
    p.push(fetchJSON('/api/courses/' + cid + '/announcements', []).then(function (list) { collect('announcements', list.map(mapAnnouncement)); }));
    p.push(fetchJSON('/api/courses/' + cid + '/modules', []).then(function (list) { collect('modules', list.map(mapModule)); }));
    p.push(fetchJSON('/api/courses/' + cid + '/lessons?studentId=' + uid, []).then(function (list) { collect('lessons', list.map(mapLesson)); }));
    p.push(fetchJSON('/api/courses/' + cid + '/quizzes', []).then(function (list) {
      var mapped = list.map(mapQuiz);
      mapped.forEach(function (q) { q.course = q.course || ''; });
      collect('quizzes', mapped);
      mapped.forEach(function (q) {
        p.push(fetchJSON('/api/quizzes/' + q.id + '/questions/attempt', []).then(function (ql) {
          var stored = live.collectionObject('quizQuestions') || {};
          stored[q.id] = ql.map(mapAttemptQuestion);
          live.publish('quizQuestions', Object.assign({}, stored));
        }));
        p.push(fetchJSON('/api/quizzes/' + q.id + '/attempts', []).then(function (attempts) {
          if (!attempts || !attempts.length) return;
          var best = 0, bestMax = 0, taken = false;
          attempts.forEach(function (a) {
            taken = true;
            if (a.score != null) {
              var qref = findCourse(q.courseId);
              var mx = qref ? (qref.progress || 0) : 0;
              if (Number(a.score) > best) { best = Number(a.score); bestMax = mx; }
            }
          });
          q.attempts = attempts.length;
          q.taken = taken;
          if (best) q.bestScore = best + '/' + (bestMax || '?');
        }));
      });
    }));
    return Promise.all(p);
  }

  function hydrateStudent(uid) {
    var jobs = [];
    jobs.push(fetchCoursesForRole('student', uid));
    jobs.push(fetchJSON('/api/enrollments/student/' + uid, []).then(function (list) {
      var mapped = list.map(mapEnrollment);
      live.publish('enrollments', mapped);
      mapped.forEach(function (e) { collect('courses', []); overlayEnrollment(e); });
    }));
    jobs.push(fetchJSON('/api/students/me/grades', []).then(function (list) { live.publish('grades', list.map(mapGrade)); }));
    jobs.push(fetchJSON('/api/students/me/attendance', null).then(function (data) {
      if (!data) return;
      live.publish('attendance', (data.byCourse || []).map(function (c) {
        return { courseId: c.courseId, course: c.course, present: c.present, total: c.total };
      }));
      live.publish('attendanceHistory', (data.history || []).map(function (h, i) {
        return { week: 'Week ' + Math.max(1, Math.round(i + 1)), course: h.course, status: lower(h.status), date: toDate(h.date), dateOnly: h.date };
      }));
    }));
    jobs.push(fetchJSON('/api/submissions/student/' + uid, []).then(function (list) {
      live.publish('submissions', list.map(function (s) { return mapSubmission(s); }));
    }));
    jobs.push(fetchJSON('/api/enrollments/student/' + uid, []).then(function (list) {
      return Promise.all((list || []).map(function (e) { return loadCourseAssetsStudent(e.courseId, uid); }));
    }));
    return Promise.all(jobs);
  }

  function hydrateFaculty(uid) {
    var jobs = [];
    jobs.push(fetchCoursesForRole('faculty', uid).then(function (courses) {
      live.publish('facultyCourses', courses.map(function (c) {
        return { id: c.id, code: c.code, name: c.short, students: c.students, progress: c.progress, modules: 0, updated: c.updated, accent: c.accent, instructor: c.instructor };
      }));
      live.publish('facultyActivity', []);
      return Promise.all(courses.map(function (c) { return loadCourseAssetsFaculty(c); }));
    }));
    return Promise.all(jobs).then(function () {
      var subs = store('submissions');
      var pending = [];
      subs.forEach(function (s) {
        var a = null;
        store('assignments').some(function (x) { if (x.id === s.assignmentId) a = x; return !!a; });
        var c = a ? findCourse(a.courseId) : null;
        if (s.status === 'submitted' && !s.gradedAt) {
          pending.push(mapPending(s, c ? c.id : s.courseId, c ? c.short : '', a ? a.title : ''));
        }
      });
      live.publish('pendingSubmissions', pending);
      var studentIds = {};
      subs.forEach(function (s) { studentIds[s.studentId] = true; });
      return Promise.all(Object.keys(studentIds).map(function (sid) {
        return fetchJSON('/api/users/' + sid, null).then(function (u) {
          if (u) { var mu = mapUser(u); var list = store('users'); var exists = false; list.forEach(function (x) { if (x.id === mu.id) exists = true; }); if (!exists) collect('users', [mu]); }
        });
      }));
    });
  }

  function loadCourseAssetsFaculty(c) {
    var cid = c.id;
    var p = [];
    p.push(fetchJSON('/api/courses/' + cid + '/modules', []).then(function (list) {
      var mapped = list.map(mapModule);
      collect('modules', mapped);
      c.modulesTotal = mapped.length;
      c.modules = mapped;
    }));
    p.push(fetchJSON('/api/courses/' + cid + '/lessons', []).then(function (list) { collect('lessons', list.map(mapLesson)); }));
    p.push(fetchJSON('/api/courses/' + cid + '/assignments', []).then(function (list) { collect('assignments', list.map(mapAssignment)); }));
    p.push(fetchJSON('/api/courses/' + cid + '/announcements', []).then(function (list) { collect('announcements', list.map(mapAnnouncement)); }));
    p.push(fetchJSON('/api/courses/' + cid + '/quizzes', []).then(function (list) {
      var mapped = list.map(mapQuiz);
      collect('quizzes', mapped);
      mapped.forEach(function (q) {
        p.push(fetchJSON('/api/quizzes/' + q.id + '/questions', []).then(function (ql) {
          var stored = live.collectionObject('quizQuestions') || {};
          stored[q.id] = ql.map(mapQuizQuestion);
          live.publish('quizQuestions', Object.assign({}, stored));
        }));
      });
    }));
    p.push(fetchJSON('/api/courses/' + cid + '/assignments', []).then(function (alist) {
      return Promise.all(alist.map(function (a) {
        return fetchJSON('/api/assignments/' + a.id + '/submissions', []).then(function (list) {
          collect('submissions', list.map(function (s) { return mapSubmission(s, cid); }));
        });
      }));
    }));
    return Promise.all(p);
  }

  function hydrateAdmin(uid) {
    var jobs = [];
    jobs.push(fetchJSON('/api/admin/stats', null).then(function (s) {
      var stats = {
        totalStudents: s ? s.totalStudents : 0,
        totalFaculty: s ? s.totalFaculty : 0,
        totalCourses: s ? s.totalCourses : 0,
        activeUsers: s ? s.activeUsers : 0,
        totalUsers: s ? s.totalUsers : 0,
        publishedCourses: s ? s.publishedCourses : 0,
        enrollments: s ? s.enrollments : 0,
        submissions: s ? s.submissions : 0,
        submissionsToday: s ? s.submissionsToday : 0,
        newStudentsThisMonth: 0,
        newFacultyThisMonth: 0,
        avgAttendance: '—'
      };
      live.publish('adminStats', stats);
      live.publish('adminSystemActivity', []);
      live.publish('adminReports', {
        enrollmentByCourse: [],
        monthlyActive: [],
        passRate: { passed: 0, failed: 0, average: '—' },
        distributionByProgram: []
      });
    }));
    jobs.push(fetchJSON('/api/users', []).then(function (list) {
      var mapped = list.map(mapUser);
      live.publish('users', mapped);
      live.publish('adminUsers', mapped.map(function (u) { return { id: u.id, name: u.name, email: u.email, role: u.role, status: u.status, lastActive: u.lastActive }; }));
      live.publish('studentList', mapped.filter(function (u) { return u.role === 'student'; }).map(function (u) {
        return { id: u.id, name: u.name, email: u.email, program: '', year: '', attendance: '', gpa: '', status: u.status, joined: '' };
      }));
      live.publish('facultyList', mapped.filter(function (u) { return u.role === 'faculty'; }).map(function (u) {
        return { id: u.id, name: u.name, email: u.email, dept: '', title: '', coursesTaught: 0, students: 0, status: u.status, joined: '' };
      }));
    }));
    jobs.push(fetchCoursesForRole('admin', uid));
    return Promise.all(jobs);
  }

  live.hydrate = function () {
    return live.ready().then(function (enabled) {
      currentUser = live.getUser();
      if (!enabled || !currentUser) return false;
      var role = currentUser.role;
      var uid = currentUser.id;
      live.publish('notifications', []);

      var jobs = [];
      jobs.push(fetchJSON('/api/users/' + uid + '/notifications', []).then(function (list) { live.publish('notifications', list.map(mapNotification)); }));
      jobs.push(fetchJSON('/api/auth/me', null).then(function (me) {
        if (me) { live.publish('me', mapUser(me)); currentUser = mapUser(me); }
      }));

      if (role === 'student') jobs.push(hydrateStudent(uid));
      else if (role === 'faculty') jobs.push(hydrateFaculty(uid));
      else jobs.push(hydrateAdmin(uid));

      return Promise.all(jobs).then(function () { return true; });
    });
  };

  live.reloadRoleData = function () {
    if (!live.enabled) return Promise.resolve();
    return live.hydrate();
  };

  /* ------------------------------ Mutation layer (live only) ------------------------------ */

  function logout() {
    live.clearAuth();
    gotoLogin();
  }

  live.logout = logout;

  function fire(p, errTitle, okTitle) {
    return p.then(function (r) {
      if (r.ok) {
        if (okTitle && LH.toast) LH.toast.success(okTitle);
        return r;
      }
      if (r.status === 401 || r.status === 404) return r;
      live.errorMessage(r, 'The server rejected the request.').then(function (msg) {
        if (LH.toast) LH.toast.error(errTitle, msg);
      });
      return r;
    }).catch(function () {
      if (LH.toast) LH.toast.error(errTitle, 'Could not reach the server.');
      return null;
    });
  }

  function courseRefresh() {
    var user = live.currentUser();
    if (!user) return Promise.resolve();
    return fetchCoursesForRole(user.role, user.id);
  }

  live.buildCourseRecord = function (data) {
    return {
      id: 'new-' + Date.now(),
      code: data.code || '',
      name: data.name || data.title || '',
      short: data.name || data.title || '',
      title: data.name || data.title || '',
      description: data.description || '',
      category: data.category || 'General',
      instructor: data.instructor || '',
      instructorId: data.instructorId || null,
      accent: accentFor(data.category, 0),
      status: data.status || 'draft',
      progress: 0, modulesDone: 0, modulesTotal: 0,
      students: 0, credits: data.credits || 3, semester: 'Fall 2026',
      updated: 'just now', createdAt: null, updatedAt: null, modules: []
    };
  };

  live.courseRequest = function (patch) {
    var body = {};
    if (patch.title != null || patch.name != null) body.title = patch.title || patch.name;
    if (patch.code != null) body.code = patch.code;
    if (patch.description != null) body.description = patch.description;
    if (patch.category != null) body.category = patch.category;
    if (patch.status != null) body.status = String(patch.status).toUpperCase();
    return body;
  };

  function lessonContentType(t) {
    var map = { pdf: 'PDF', video: 'VIDEO', image: 'IMAGE', link: 'TEXT', text: 'TEXT' };
    return map[String(t).toLowerCase()] || 'TEXT';
  }

  function lessonRequest(data) {
    return {
      title: data.title || '',
      description: data.content || data.meta || '',
      contentType: lessonContentType(data.type),
      contentUrl: data.meta || data.content || '',
      duration: data.duration || 0,
      displayOrder: data.orderIndex || 0
    };
  }

  function assignmentRequest(rec) {
    return {
      title: rec.title || '',
      description: rec.description || '',
      dueDate: rec.due ? new Date(rec.due).toISOString() : null,
      maxMarks: rec.maxMarks || 20,
      status: 'PUBLISHED'
    };
  }

  function hook(name, fn) {
    var obj = LH.db;
    if (!obj) return;
    var parts = name.split('.');
    for (var i = 0; i < parts.length - 1; i++) {
      obj = obj[parts[i]];
      if (!obj) return;
    }
    var method = parts[parts.length - 1];
    var orig = obj[method];
    if (typeof orig !== 'function') return;
    obj[method] = function () {
      var out = orig.apply(this, arguments);
      fn.apply(this, arguments);
      return out;
    };
  }

  live.quizInclude = function (rec) {
    var questions = (live.collectionObject('quizQuestions') || {})[rec.id] || [];
    var payload = {
      title: rec.title || '',
      courseId: rec.courseId,
      description: rec.description || '',
      durationMinutes: Math.max(1, Number(rec.duration) || 0),
      maxAttempts: rec.attemptsMax || 1,
      status: 'PUBLISHED',
      questions: questions.map(function (q, qi) {
        var opts = q.options || [];
        var correct = q.answer;
        if (correct == null) correct = 0;
        if (correct < 0 || correct > 3) correct = 0;
        return {
          questionText: q.q || ('Question ' + (qi + 1)),
          optionA: opts[0] || '', optionB: opts[1] || '',
          optionC: opts[2] || '', optionD: opts[3] || '',
          correctOption: 'ABCD'.charAt(correct),
          maxMarks: 1
        };
      })
    };
    return fire(live.post('/api/courses/' + rec.courseId + '/quizzes', payload), 'Failed to publish quiz')
      .then(function (r) { if (r && r.ok) return courseRefresh(); return null; });
  };

  live.submissionGrade = function (submissionId, score, feedback) {
    return fire(live.patch('/api/submissions/' + submissionId + '/grade', {
      score: score,
      feedback: feedback || ''
    }), 'Failed to save grade');
  };

  live.notifRead = function (id) {
    return fire(live.patch('/api/notifications/' + id + '/read', {}), 'Could not update notification');
  };

  live.notifReadAll = function () {
    var user = live.getUser();
    if (!user) return Promise.resolve(null);
    return fire(live.patch('/api/notifications/users/' + user.id + '/read-all', {}), 'Could not update notifications');
  };

  live.startQuiz = function (quizId) {
    var user = live.getUser();
    return live.post('/api/quizzes/' + quizId + '/attempts', { studentId: user ? user.id : null }).then(function (r) {
      return live.json(r, null).then(function (data) {
        if (r.ok && data) return { ok: true, attemptId: data.id };
        return { ok: false, message: (data && data.message) || 'Could not begin the quiz.' };
      });
    }).catch(function () { return { ok: false, message: 'Could not reach the server.' }; });
  };

  live.submitQuizAttempt = function (attemptId, answers) {
    var payload = {
      answers: (answers || []).map(function (a) {
        return {
          questionId: a.questionId,
          selectedOption: a.selectedOption
        };
      })
    };
    return live.post('/api/attempts/' + attemptId + '/submit', payload).then(function (r) {
      return live.json(r, null).then(function (data) {
        if (r.ok && data) {
          var score = data.score != null ? data.score : null;
          return { ok: true, score: score, maxMarks: data.maxMarks != null ? data.maxMarks : null, data: data };
        }
        return { ok: false, message: (data && data.message) || 'Could not submit the quiz.' };
      });
    }).catch(function () { return { ok: false, message: 'Could not reach the server.' }; });
  };

  function applyHooks() {
    var DB = LH.db;
    if (!DB) return;

    hook('create', function (name, record) {
      if (!record) return;
      if (name === 'assignments') {
        fire(live.post('/api/courses/' + record.courseId + '/assignments', assignmentRequest(record)), 'Failed to create assignment');
      } else if (name === 'announcements') {
        fire(live.post('/api/announcements', {
          courseId: record.courseId,
          facultyId: record.authorId,
          title: record.title,
          content: record.body
        }), 'Failed to post announcement');
      } else if (name === 'modules') {
        fire(live.post('/api/courses/' + record.courseId + '/modules', { title: record.title || '' }), 'Failed to add module');
      } else if (name === 'lessons') {
        fire(live.post('/api/modules/' + record.moduleId + '/lessons', lessonRequest(record)), 'Failed to add lesson');
      }
    });

    hook('update', function (name, id, patch) {
      if (!patch) return;
      if (name === 'users') {
        if (patch.role != null) {
          fire(live.patch('/api/users/' + id + '/role/' + String(patch.role).toUpperCase(), {}), 'Could not change role');
        } else if (patch.status != null) {
          fire(live.patch('/api/users/' + id + '/status/' + String(patch.status).toUpperCase(), {}), 'Could not update status');
        } else {
          fire(live.put('/api/auth/me', { email: patch.email, name: patch.name }).then(function (r) {
            if (r.ok) {
              var user = live.getUser();
              if (user && patch.email && user.email !== patch.email) {
                live.clearAuth();
                if (LH.toast) LH.toast.info('Profile updated', 'You changed your email, so please sign in again.');
                else alert('Your email was updated. Please sign in again with the new address.');
              }
            }
            return r;
          }), 'Could not update profile');
        }
      } else if (name === 'courses') {
        var keys = Object.keys(patch);
        var onlyStatus = keys.length === 1 && keys[0] === 'status';
        if (onlyStatus) {
          fire(live.patch('/api/courses/' + id + '/status', { status: String(patch.status).toUpperCase() }), 'Could not update course')
            .then(function (r) { if (r && r.ok) return courseRefresh(); });
        } else {
          fire(live.put('/api/courses/' + id, live.courseRequest(patch)), 'Could not update course')
            .then(function (r) { if (r && r.ok) return courseRefresh(); });
        }
      } else if (name === 'assignments') {
        var pr = assignmentRequest(Object.assign({}, patch, { due: patch.due || (DB.get && DB.get('assignments', id) || {}).due }));
        fire(live.put('/api/assignments/' + id, pr), 'Could not update assignment');
      } else if (name === 'modules') {
        var mc = DB.get ? (DB.get('modules', id) || {}) : {};
        fire(live.put('/api/modules/' + id, {
          title: patch.title || mc.title || '',
          description: patch.description || mc.description || '',
          displayOrder: patch.orderIndex != null ? patch.orderIndex : (mc.displayOrder || 0)
        }), 'Could not update module');
      } else if (name === 'lessons') {
        var lc = DB.get ? (DB.get('lessons', id) || {}) : {};
        fire(live.put('/api/lessons/' + id, {
          title: patch.title || lc.title || '',
          description: patch.content || patch.meta || lc.description || '',
          contentType: lessonContentType(patch.type || lc.type || lc.contentType || 'TEXT'),
          contentUrl: patch.meta || patch.content || lc.contentUrl || '',
          duration: patch.duration != null ? patch.duration : (lc.duration || 0),
          displayOrder: patch.orderIndex != null ? patch.orderIndex : (lc.displayOrder || 0)
        }), 'Could not update lesson');
      }
    });

    hook('remove', function (name, id) {
      if (name === 'assignments') fire(live.del('/api/assignments/' + id), 'Could not delete assignment');
      else if (name === 'announcements') fire(live.del('/api/announcements/' + id), 'Could not delete announcement');
      else if (name === 'modules') fire(live.del('/api/modules/' + id), 'Could not delete module');
      else if (name === 'lessons') fire(live.del('/api/lessons/' + id), 'Could not delete lesson');
      else if (name === 'quizzes') fire(live.del('/api/quizzes/' + id), 'Could not delete quiz');
      else if (name === 'courses') {
        fire(live.del('/api/courses/' + id), 'Could not delete course')
          .then(function (r) { if (r && r.ok) return courseRefresh(); });
      }
    });

    hook('createCourse', function (data) {
      fire(live.post('/api/courses', live.courseRequest(data)), 'Could not create course', 'Course created')
        .then(function (r) { if (r && r.ok) return courseRefresh(); });
    });

    hook('modules.reorder', function (courseId, orderedIds) {
      fire(live.put('/api/courses/' + courseId + '/modules/reorder', orderedIds || []), 'Could not reorder modules');
    });

    hook('lessons.reorder', function (moduleId, orderedIds) {
      fire(live.put('/api/modules/' + moduleId + '/lessons/reorder', orderedIds || []), 'Could not reorder lessons');
    });

    hook('submit', function (studentId, assignmentId, content) {
      fire(live.post('/api/submissions', {
        assignmentId: assignmentId,
        studentId: studentId,
        fileName: content || 'submission.txt'
      }), 'Could not submit assignment', 'Assignment submitted');
    });

    hook('enrollments.enroll', function (studentId, courseId) {
      fire(live.post('/api/courses/' + courseId + '/enroll', {}), 'Could not enroll',
        null).then(function (r) { if (r && r.ok) return courseRefresh(); });
    });

    hook('markLessonComplete', function (studentId, lessonId) {
      fire(live.post('/api/lessons/' + lessonId + '/complete', { studentId: studentId, completed: true }),
        'Could not save progress');
    });
  }

  live.arm = function () {
    if (live.armed) return;
    live.armed = true;
    applyHooks();
  };

})(window.LH);