window.LH = window.LH || {};

/* Data layer: single seam between app code and localStorage. UI code must
   never touch localStorage directly - it calls into LH.db (or LH.api).
   On first run the collections are seeded from LH.mock, then stored under
   learnhub-db-* keys. Subsequent loads hydrate from localStorage.
   LH.mock is replaced by the live cache so existing readers stay correct. */
(function (LH) {
  'use strict';

  if (LH.db) return;

  var D = LH.date;
  var DB = LH.db = {};
  var VERSION_KEY = 'learnhub-db-v2';

  var MEMORY_KEYS = [
    'users', 'studentList', 'facultyList', 'courses', 'modules', 'lessons',
    'enrollments', 'lessonProgress', 'assignments', 'submissions',
    'announcements', 'quizzes', 'quizQuestions', 'grades', 'attendance',
    'attendanceHistory', 'notifications', 'pendingSubmissions',
    'facultyActivity', 'facultyCourses', 'adminUsers', 'adminSystemActivity',
    'adminReports', 'adminStats'
  ];

  var cache = {};

  /* ------------------------------ Storage ------------------------------ */

  function storage() {
    try {
      return window.localStorage;
    } catch (e) {
      return null;
    }
  }

  function persist(name) {
    var s = storage();
    if (!s) return;
    try {
      s.setItem('learnhub-db-' + name, JSON.stringify(cache[name]));
    } catch (e) { /* quota / private mode - keep in memory only */ }
  }

  function isoDate(text) {
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(text);
  }

  function hydrate(value) {
    if (value == null) return value;
    if (typeof value === 'string') return isoDate(value) ? new Date(value) : value;
    if (Array.isArray(value)) return value.map(hydrate);
    if (typeof value === 'object') {
      var out = {};
      Object.keys(value).forEach(function (k) { out[k] = hydrate(value[k]); });
      return out;
    }
    return value;
  }

  function load(name) {
    var s = storage();
    if (!s) return null;
    try {
      var raw = s.getItem('learnhub-db-' + name);
      return raw ? hydrate(JSON.parse(raw)) : null;
    } catch (e) {
      return null;
    }
  }

  /* ------------------------------ Seeding ------------------------------ */

  function id(prefix, list) {
    var max = 0;
    list.forEach(function (r) {
      if (typeof r.id === 'number' && r.id > max) max = r.id;
      if (typeof r.id === 'string' && r.id.indexOf(prefix) === 0) {
        var n = parseInt(r.id.slice(prefix.length), 10);
        if (!isNaN(n) && n > max) max = n;
      }
    });
    return prefix + (max + 1);
  }

  function buildSeeds() {
    var M = LH.mock;
    var modules = [], lessons = [], enrollments = [], lessonProgress = [], submissions = [], announcements = [];

    M.courses.forEach(function (c) {
      var seen = 0;
      (c.modules || []).forEach(function (m) {
        var mid = c.id + '-m' + m.num;
        modules.push({ id: mid, courseId: c.id, title: m.title, orderIndex: m.num });
        (m.materials || []).forEach(function (mat) {
          lessons.push({
            id: c.id + '-l' + (++seen),
            moduleId: mid,
            title: mat.name,
            content: mat.meta || '',
            orderIndex: seen,
            type: mat.type,
            meta: mat.meta || '',
            size: mat.size || null
          });
        });
      });
      if (!c.modules || !c.modules.length) {
        modules.push({ id: c.id + '-m1', courseId: c.id, title: 'Course overview', orderIndex: 1 });
        lessons.push({ id: c.id + '-l1', moduleId: c.id + '-m1', title: 'Getting started', content: c.description, orderIndex: 1 });
      }
    });

    M.courses.forEach(function (c) {
      var done = c.modulesDone || 0;
      var total = 0, completed = 0;
      (c.modules || []).forEach(function (m, mi) {
        (m.materials || []).forEach(function (mat) {
          total++;
          if (mi < done) {
            completed++;
            lessonProgress.push({
              id: 'lp' + (lessonProgress.length + 1), studentId: 201, lessonId: c.id + '-l' + total, completedAt: new Date()
            });
          }
        });
      });
      enrollments.push({
        id: id('e', enrollments), studentId: 201, courseId: c.id,
        enrolledAt: new Date(), status: 'active', progressPercent: c.progress
      });
    });

    (M.studentList || []).forEach(function (s) {
      if (s.id === 201) return; /* demo student already enrolled above */
      M.courses.forEach(function (c) {
        var lower = s.attendance ? parseInt(s.attendance, 10) : 80;
        var pct = Math.max(10, Math.min(96, lower + (M.courses.indexOf(c) * 5) % 21 - 8));
        enrollments.push({
          id: id('e', enrollments), studentId: s.id, courseId: c.id,
          enrolledAt: new Date(), status: s.status === 'suspended' ? 'dropped' : 'active', progressPercent: Math.round(pct)
        });
      });
    });

    var assignIdByTitle = {};
    M.assignments.forEach(function (a) { assignIdByTitle[a.title] = a.id; });

    M.pendingSubmissions.forEach(function (s) {
      submissions.push({
        id: s.id,
        assignmentId: assignIdByTitle[s.assignment],
        courseId: s.courseId,
        studentId: s.studentId,
        student: s.student,
        submittedAt: s.submitted,
        content: 'Submitted file: ' + s.file,
        score: null,
        feedback: null,
        gradedAt: null,
        status: s.status
      });
    });

    M.courses.forEach(function (c) {
      if (c.id !== 'cs201') return;
      announcements.push({
        id: 'an1', courseId: 'cs201', authorId: 101, title: 'Welcome to Data Structures & Algorithms',
        body: 'Please review the syllabus and complete the prerequisite reading before the first lecture.',
        createdAt: D.relativeDays(-12)
      });
      announcements.push({
        id: 'an2', courseId: 'cs201', authorId: 101, title: 'Assignment 2 released',
        body: 'Linked List Implementation is now live. Submit before the deadline for full credit.',
        createdAt: D.relativeDays(-3)
      });
    });

    cache.modules = modules;
    cache.lessons = lessons;
    cache.enrollments = enrollments;
    cache.lessonProgress = lessonProgress;
    cache.submissions = submissions;
    cache.announcements = announcements;
  }

  function initSeeds() {
    var M = LH.mock;
    buildSeeds();
    MEMORY_KEYS.forEach(function (name) {
      if (name === 'modules' || name === 'lessons' || name === 'enrollments' ||
          name === 'lessonProgress' || name === 'submissions' || name === 'announcements') return;
      cache[name] = M[name] || [];
    });
  }

  /* ------------------------------ Init ------------------------------ */

  DB.init = function () {
    initSeeds();
    var fresh = false;
    var s = storage();
    var marker = s ? s.getItem(VERSION_KEY) : null;
    if (!marker) fresh = true;

    if (!fresh) {
      MEMORY_KEYS.forEach(function (name) {
        var loaded = load(name);
        if (loaded != null) cache[name] = loaded;
      });
    }

    MEMORY_KEYS.forEach(function (name) {
      if (storage()) persist(name);
    });
    if (storage()) {
      try { storage().setItem(VERSION_KEY, '1'); } catch (e) { /* ignore */ }
    }

    LH.mock = cache;
    return cache;
  };

  DB.reset = function () {
    var s = storage();
    if (!s) return;
    try {
      s.removeItem(VERSION_KEY);
      MEMORY_KEYS.forEach(function (name) { s.removeItem('learnhub-db-' + name); });
    } catch (e) { /* ignore */ }
  };

  /* ------------------------------ Generic access ------------------------------ */

  DB.list = function (name) { return cache[name]; };
  DB.collection = function (name) { return cache[name]; };
  DB.count = function (name) { return (cache[name] || []).length; };
  DB.get = function (name, itemId) {
    var found = null;
    (cache[name] || []).forEach(function (r) { if (r.id === itemId) found = r; });
    return found;
  };
  DB.find = function (name, fn) {
    var found = null;
    (cache[name] || []).forEach(function (r) { if (!found && fn(r)) found = r; });
    return found;
  };
  DB.create = function (name, record) {
    var list = cache[name] = cache[name] || [];
    if (record.id == null) record.id = id('r' + Math.floor(Math.random() * 1e6) + '-', list);
    list.push(record);
    persist(name);
    return record;
  };
  DB.update = function (name, itemId, patch) {
    var list = cache[name] || [];
    var target = null;
    list.forEach(function (r) { if (r.id === itemId) target = r; });
    if (!target) return null;
    Object.keys(patch).forEach(function (k) {
      if (patch[k] !== undefined) target[k] = patch[k];
    });
    persist(name);
    return target;
  };
  DB.remove = function (name, itemId) {
    var list = cache[name] || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === itemId) {
        list.splice(i, 1);
        persist(name);
        return true;
      }
    }
    return false;
  };
  DB.replace = function (name, list) {
    cache[name] = list;
    persist(name);
    return list;
  };
  DB.persist = persist;

  /* ------------------------------ Courses ------------------------------ */

  var courses = DB.courses = {};

  courses.byInstructor = function (instructorId) {
    return cache.courses.filter(function (c) { return c.instructorId === instructorId; });
  };

  courses.published = function () {
    return cache.courses.filter(function (c) { return c.status === 'published' || c.status == null; });
  };

  courses.ownedBy = function (courseId, user) {
    var c = DB.get('courses', courseId);
    if (!c) return false;
    if (user && user.role === 'admin') return true;
    return !!c && !!user && c.instructorId === user.id;
  };

  DB.createCourse = function (data) {
    var rec = {
      id: id('c', cache.courses),
      code: data.code,
      name: data.name,
      short: data.name,
      title: data.name || data.title,
      description: data.description || '',
      category: data.category || 'General',
      instructor: data.instructor || '',
      instructorId: data.instructorId || null,
      accent: data.accent || 'blue',
      progress: 0, modulesDone: 0, modulesTotal: 0,
      students: 0, credits: data.credits || 3, semester: 'Fall 2026',
      status: data.status || 'draft', createdAt: new Date(),
      updated: 'just now', modules: []
    };
    cache.courses.push(rec);
    persist('courses');
    return rec;
  };

  DB.updateCourse = function (courseId, patch) {
    var c = DB.update('courses', courseId, patch);
    if (c) persist('courses');
    return c;
  };

  DB.deleteCourse = function (courseId) {
    var modules = cache.modules.filter(function (m) { return m.courseId === courseId; });
    var courseLessons = cache.lessons.filter(function (l) { return modules.some(function (m) { return m.id === l.moduleId; }); });
    var lessonIds = courseLessons.map(function (l) { return l.id; });
    cache.lessonProgress = cache.lessonProgress.filter(function (lp) { return lessonIds.indexOf(lp.lessonId) === -1; });
    cache.modules = cache.modules.filter(function (m) { return m.courseId !== courseId; });
    cache.lessons = cache.lessons.filter(function (l) { return lessonIds.indexOf(l.id) === -1; });
    cache.announcements = cache.announcements.filter(function (a) { return a.courseId !== courseId; });
    cache.assignments = cache.assignments.filter(function (a) { return a.courseId !== courseId; });
    cache.submissions = cache.submissions.filter(function (s) { return s.courseId !== courseId; });
    cache.enrollments = cache.enrollments.filter(function (e) { return e.courseId !== courseId; });
    ['lessons', 'lessonProgress', 'modules', 'announcements', 'assignments', 'submissions', 'enrollments'].forEach(persist);
    return DB.remove('courses', courseId);
  };

  /* ------------------------------ Modules & lessons ------------------------------ */

  var modules = DB.modules = {};
  var lessons = DB.lessons = {};

  modules.forCourse = function (courseId) {
    return cache.modules.filter(function (m) { return m.courseId === courseId; })
      .sort(function (a, b) { return a.orderIndex - b.orderIndex; });
  };

  modules.create = function (courseId, title) {
    var existing = modules.forCourse(courseId);
    var order = existing.length ? existing[existing.length - 1].orderIndex + 1 : 1;
    return DB.create('modules', { id: id(courseId + '-m', cache.modules), courseId: courseId, title: title, orderIndex: order });
  };

  modules.update = function (moduleId, patch) { return DB.update('modules', moduleId, patch); };
  modules.remove = function (moduleId) {
    var lessonsOf = cache.lessons.filter(function (l) { return l.moduleId === moduleId; });
    lessonsOf.forEach(function (l) { DB.remove('lessons', l.id); });
    return DB.remove('modules', moduleId);
  };

  modules.reorder = function (courseId, orderedIds) {
    var current = modules.forCourse(courseId);
    current.forEach(function (m) {
      var idx = orderedIds.indexOf(m.id);
      if (idx !== -1) m.orderIndex = idx + 1;
    });
    persist('modules');
    return current;
  };

  lessons.forModule = function (moduleId) {
    return cache.lessons.filter(function (l) { return l.moduleId === moduleId; })
      .sort(function (a, b) { return a.orderIndex - b.orderIndex; });
  };

  lessons.byCourse = function (courseId) {
    return cache.lessons.filter(function (l) {
      return cache.modules.some(function (m) { return m.id === l.moduleId && m.courseId === courseId; });
    }).sort(function (a, b) { return a.orderIndex - b.orderIndex; });
  };

  lessons.countForCourse = function (courseId) { return lessons.byCourse(courseId).length; };

  lessons.create = function (moduleId, data) {
    var existing = lessons.forModule(moduleId);
    var order = existing.length ? existing[existing.length - 1].orderIndex + 1 : 1;
    var m = DB.get('modules', moduleId);
    var courseId = m ? m.courseId : '';
    var rec = { id: id(courseId + '-lnew-', cache.lessons), moduleId: moduleId, title: data.title, content: data.content || '', orderIndex: order };
    if (data.type) rec.type = data.type;
    if (data.meta) rec.meta = data.meta;
    if (data.size) rec.size = data.size;
    return DB.create('lessons', rec);
  };

  lessons.update = function (lessonId, patch) { return DB.update('lessons', lessonId, patch); };
  lessons.remove = function (lessonId) {
    var removed = DB.remove('lessons', lessonId);
    if (removed) {
      cache.lessonProgress = cache.lessonProgress.filter(function (lp) { return lp.lessonId !== lessonId; });
      persist('lessonProgress');
    }
    return removed;
  };

  lessons.reorder = function (moduleId, orderedIds) {
    var current = lessons.forModule(moduleId);
    current.forEach(function (l) {
      var idx = orderedIds.indexOf(l.id);
      if (idx !== -1) l.orderIndex = idx + 1;
    });
    persist('lessons');
    return current;
  };

  /* ------------------------------ Enrollments & progress ------------------------------ */

  var enroll = DB.enrollments = {};

  enroll.isEnrolled = function (studentId, courseId) {
    return cache.enrollments.some(function (e) { return e.studentId === studentId && e.courseId === courseId; });
  };

  enroll.enroll = function (studentId, courseId) {
    var course = DB.get('courses', courseId);
    if (!course) return { ok: false, error: 'Course not found.' };
    if (course.status && course.status !== 'published') return { ok: false, error: 'This course is not open for enrollment.' };
    if (enroll.isEnrolled(studentId, courseId)) return { ok: false, error: 'You are already enrolled in this course.' };
    var rec = DB.create('enrollments', {
      id: id('e', cache.enrollments), studentId: studentId, courseId: courseId,
      enrolledAt: new Date(), status: 'active', progressPercent: 0
    });
    course.students = (course.students || 0) + 1;
    persist('courses');
    DB.persist('enrollments');
    return { ok: true, enrollment: rec };
  };

  enroll.forStudent = function (studentId) {
    return cache.enrollments.filter(function (e) { return e.studentId === studentId; })
      .map(function (e) {
        var c = DB.get('courses', e.courseId);
        return { enrollment: e, course: c };
      });
  };

  enroll.forCourse = function (courseId) {
    return cache.enrollments.filter(function (e) { return e.courseId === courseId; });
  };

  DB.progressFor = function (studentId, courseId) {
    var total = lessons.countForCourse(courseId);
    var done = cache.lessonProgress.filter(function (lp) {
      return lp.studentId === studentId && cache.lessons.some(function (l) {
        return l.id === lp.lessonId && cache.modules.some(function (m) {
          return m.id === l.moduleId && m.courseId === courseId;
        });
      });
    }).length;
    var pct = total ? Math.round(done / total * 100) : 0;
    var e = cache.enrollments.filter(function (en) { return en.studentId === studentId && en.courseId === courseId; })[0];
    if (e) {
      e.progressPercent = pct;
      persist('enrollments');
    }
    return { total: total, completed: done, percent: pct };
  };

  DB.markLessonComplete = function (studentId, lessonId) {
    var already = cache.lessonProgress.some(function (lp) { return lp.studentId === studentId && lp.lessonId === lessonId; });
    if (!already) {
      DB.create('lessonProgress', { id: id('lp', cache.lessonProgress), studentId: studentId, lessonId: lessonId, completedAt: new Date() });
    }
    var l = DB.get('lessons', lessonId);
    var m = l ? DB.get('modules', l.moduleId) : null;
    var courseId = m ? m.courseId : null;
    if (courseId) {
      DB.progressFor(studentId, courseId);
      var course = DB.get('courses', courseId);
      if (course) {
        var prog = DB.progressFor(studentId, courseId);
        course.progress = prog.percent;
        course.modulesDone = prog.completed;
        course.modulesTotal = prog.total;
        persist('courses');
      }
    }
    return true;
  };

  /* ------------------------------ Submissions ------------------------------ */

  var submissions = DB.submissions = {};

  submissions.forAssignment = function (assignmentId) {
    return cache.submissions.filter(function (s) { return s.assignmentId === assignmentId; })
      .sort(function (a, b) { return new Date(b.submittedAt) - new Date(a.submittedAt); });
  };

  submissions.forStudent = function (studentId, assignmentId) {
    return cache.submissions.filter(function (s) {
      if (s.studentId !== studentId) return false;
      if (assignmentId && s.assignmentId !== assignmentId) return false;
      return true;
    });
  };

  submissions.forCourse = function (courseId, user) {
    return cache.submissions.filter(function (s) { return s.courseId === courseId; });
  };

  DB.submit = function (studentId, assignmentId, content) {
    var a = DB.get('assignments', assignmentId);
    if (!a) return { ok: false, error: 'Assignment not found.' };
    var c = DB.get('courses', a.courseId);
    if (!c) return { ok: false, error: 'Course not found.' };
    if (!enroll.isEnrolled(studentId, a.courseId)) return { ok: false, error: 'You must be enrolled in this course to submit.' };
    if (a.due && new Date(a.due) < new Date()) return { ok: false, error: 'This assignment is past its due date.' };
    var existing = null;
    cache.submissions.forEach(function (s) {
      if (s.studentId === studentId && s.assignmentId === assignmentId) existing = s;
    });
    var record;
    if (existing) {
      record = DB.update('submissions', existing.id, {
        content: content, submittedAt: new Date(), score: null, feedback: null, gradedAt: null, status: 'pending'
      });
    } else {
      record = DB.create('submissions', {
        id: id('s', cache.submissions), assignmentId: assignmentId, courseId: a.courseId,
        studentId: studentId, submittedAt: new Date(), content: content,
        score: null, feedback: null, gradedAt: null, status: 'pending'
      });
      var st = DB.get('users', studentId);
      if (st) record.student = st.name;
    }
    return { ok: true, submission: record };
  };

  submissions.grade = function (assignmentId, submissionId, score, feedback) {
    var s = DB.get('submissions', submissionId);
    if (!s) return { ok: false, error: 'Submission not found.' };
    if (s.assignmentId !== assignmentId) return { ok: false, error: 'Submission does not belong to this assignment.' };
    var patched = DB.update('submissions', submissionId, {
      score: score, feedback: feedback || '', gradedAt: new Date(), status: 'graded'
    });
    var a = DB.get('assignments', assignmentId);
    if (a) {
      DB.update('assignments', assignmentId, { graded: true, score: score, grade: Math.round(score / a.maxMarks * 100) + '%' });
    }
    return { ok: true, submission: patched };
  };

  /* ------------------------------ Users ------------------------------ */

  var users = DB.users = {};

  users.findByEmail = function (email) {
    var target = String(email || '').trim().toLowerCase();
    return cache.users.filter(function (u) { return u.email.toLowerCase() === target; })[0] || null;
  };

  users.byId = function (uid) { return DB.get('users', uid); };
  users.setRole = function (uid, role) { return DB.update('users', uid, { role: role }); };
  users.flipStatus = function (uid) {
    var u = DB.get('users', uid);
    if (!u) return null;
    return DB.update('users', uid, { status: u.status === 'active' ? 'suspended' : 'active' });
  };

  DB.init();

})(window.LH);