(function (LH) {
  'use strict';

  var $ = LH.dom.$, UI = LH.ui, F = LH.format;
  var M = LH.mock;

  function liveCount(c) {
    var total = LH.api.lessons.countForCourse(c.id);
    return { total: total };
  }

  function withCards(list) {
    return list.map(function (c) {
      var total = liveCount(c).total;
      var copy = Object.assign({}, c);
      copy.modules = total || (M.facultyCourses.filter(function (fc) { return fc.id === c.id; })[0] || { modules: 0 }).modules || 0;
      return copy;
    });
  }

  function render(list) {
    var grid = $('#course-grid');
    var count = $('#course-count');

    if (!list.length) {
      grid.innerHTML = UI.emptyState('courses', 'No courses found', 'Try a different search term.');
      count.textContent = '0 courses';
      return;
    }

    grid.innerHTML = withCards(list).map(function (c) { return UI.courseCard(c, 'faculty'); }).join('');
    count.textContent = list.length + (list.length === 1 ? ' course' : ' courses');
  }

  function owned() {
    var user = LH.shell.getUser();
    var id = user ? user.id : 101;
    var list = LH.api.courses.byInstructorId(id);
    if (!list || !list.length) list = LH.api.courses.byInstructor('Dr. Priya Sharma');
    return list;
  }

  function init() {
    var q = LH.app.param('q');
    var all = owned();
    var search = $('#course-search');
    if (q && search) search.value = q;

    var filtered = all.filter(function (c) {
      return !q || (c.name || '').toLowerCase().indexOf(q.toLowerCase()) !== -1 || (c.code || '').toLowerCase().indexOf(q.toLowerCase()) !== -1;
    });
    render(filtered);

    (search || {}).addEventListener && search.addEventListener('input', function () {
      var term = search.value.toLowerCase();
      render(all.filter(function (c) {
        return !term || (c.name || '').toLowerCase().indexOf(term) !== -1 || (c.code || '').toLowerCase().indexOf(term) !== -1;
      }));
    });
  }

  LH.app.register('faculty-courses', init);
  LH.app.init('faculty-courses');
})(window.LH);