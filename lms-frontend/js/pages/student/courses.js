(function (LH) {
  'use strict';

  var $ = LH.dom.$, UI = LH.ui, F = LH.format, D = LH.date, DB = LH.db;
  var M = LH.mock;

  function studentId() {
    var u = LH.shell.getUser();
    return u ? u.id : 201;
  }

  function enrollmentMap() {
    var map = {};
    DB.enrollments.forStudent(studentId()).forEach(function (row) {
      if (row.course) map[row.course.id] = row.enrollment;
    });
    return map;
  }

  function gradePctFor(uid, courseId) {
    var graded = DB.submissions.forCourse(courseId).filter(function (s) {
      return s.studentId === uid && (s.gradedAt || s.status === 'graded');
    });
    if (graded.length) {
      var sum = 0;
      graded.forEach(function (s) { sum += (s.score / s.maxMarks) * 100; });
      return Math.round(sum / graded.length);
    }
    var grades = M.grades.filter(function (g) { return g.courseId === courseId; });
    if (!grades.length) return null;
    var gsum = 0;
    grades.forEach(function (g) { gsum += (g.score / g.max) * 100; });
    return Math.round(gsum / grades.length);
  }

  function cardFor(c, enr) {
    var live = DB.progressFor(studentId(), c.id);
    var prog = enr && enr.progressPercent != null ? enr.progressPercent : live.percent;
    return UI.courseCard(Object.assign({}, c, {
      progress: prog,
      modulesDone: live.completed,
      modulesTotal: live.total,
      gradePct: gradePctFor(studentId(), c.id),
      updated: D.relative(c.updated || c.createdAt || new Date()),
      enrolled: !!enr
    }), 'student');
  }

  function renderCourses(list, enrMap) {
    var grid = $('#course-grid');
    var count = $('#course-count');

    if (!list.length) {
      grid.innerHTML = UI.emptyState('courses', 'No courses found', 'Try adjusting your search or filter.');
      count.textContent = '0 courses';
      return;
    }

    grid.innerHTML = list.map(function (c) {
      return cardFor(c, enrMap[c.id]);
    }).join('');
    count.textContent = list.length + (list.length === 1 ? ' course' : ' courses');
  }

  function applyFilters() {
    var q = ($('#course-search').value || '').toLowerCase();
    var filter = $('#course-filter').value;
    var cat = $('#course-category').value;
    var enrMap = enrollmentMap();

    var list = M.courses.filter(function (c) {
      var matchQ = !q || c.name.toLowerCase().indexOf(q) !== -1 || c.code.toLowerCase().indexOf(q) !== -1 || c.instructor.toLowerCase().indexOf(q) !== -1;
      if (!matchQ) return false;
      var matchCat = !cat || cat === 'all' || (c.category || '') === cat;
      if (!matchCat) return false;
      var enr = enrMap[c.id];
      var prog = enr ? (enr.progressPercent != null ? enr.progressPercent : DB.progressFor(studentId(), c.id).percent) : (c.progress || 0);
      if (filter === 'in-progress') return !!enr && prog > 0 && prog < 100;
      if (filter === 'completed') return !!enr && prog >= 100;
      if (filter === 'critical') return !!enr && prog < 25;
      return true;
    });
    renderCourses(list, enrMap);
  }

  function init() {
    var q = LH.app.param('q');
    var search = $('#course-search');
    if (q && search) search.value = q;

    applyFilters();

    search.addEventListener('input', applyFilters);
    $('#course-filter').addEventListener('change', applyFilters);
    $('#course-category').addEventListener('change', applyFilters);
  }

  LH.app.register('student-courses', init);
  LH.app.init('student-courses');
})(window.LH);