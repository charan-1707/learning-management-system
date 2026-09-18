(function (LH) {
  'use strict';

  var $ = LH.dom.$, F = LH.format, UI = LH.ui, I = LH.icons;
  var M = LH.mock;
  var taughtIds = ['cs201', 'cs340'];

  var students = ['Alex Johnson', 'Meera Patel', 'Rohan Gupta', 'Sneha Reddy', 'Aditya Kumar', 'Karan Singh', 'Tanvi Desai'];
  var statuses = {};

  function className(cid) {
    var c = M.courses.filter(function (x) { return x.id === cid; })[0];
    return c ? c.code + ' — ' + c.short : cid;
  }

  function renderAverages() {
    var el = $('#avg-list');
    if (!el) return;

    var avgList = taughtIds.map(function (cid) {
      var base = M.attendance.filter(function (a) { return a.courseId === cid; }) || [];
      var pct = base.length % 2 === 0 ? 74 + (base.length * 5) % 20 : 71;
      if (cid === 'cs201') pct = 85;
      return { cid: cid, label: className(cid), pct: pct };
    });

    el.innerHTML = avgList.map(function (a) {
      return '<div style="margin-bottom:16px;">' +
        '<div class="flex items-center justify-between" style="margin-bottom:6px;gap:12px;">' +
          '<span style="font-size:13px;font-weight:500;color:var(--color-text-primary);">' + F.esc(a.label) + '</span>' +
          '<span style="font-size:13px;font-weight:700;color:var(--color-text-tertiary);">' + a.pct + '%</span>' +
        '</div>' + UI.progress(a.pct) +
      '</div>';
    }).join('');
  }

  function renderRoster() {
    var tbody = $('#roster-body');
    if (!tbody) return;

    var cid = $('#att-course').value;
    var baseByStudent = {};
    M.attendance.filter(function (a) { return a.courseId === cid; }).forEach(function (a) {
      baseByStudent[a.student] = baseByStudent[a.student] || { present: 0, total: 0 };
      baseByStudent[a.student].total++;
      if (a.status === 'present') baseByStudent[a.student].present++;
    });

    tbody.innerHTML = students.map(function (name) {
      var b = baseByStudent[name] || { present: 6, total: 8 };
      var pct = Math.round(b.present / b.total * 100);
      var key = name;
      if (statuses[key] == null) statuses[key] = 'present';

      return '<tr data-student="' + key + '">' +
        '<td><div class="avatar-cell">' + UI.avatar(name, 'sm') + F.esc(name) + '</div></td>' +
        '<td>' + pct + '%</td>' +
        '<td><div class="btn-group" role="group" aria-label="Attendance for ' + F.esc(name) + '">' +
          ['present', 'absent', 'late'].map(function (st) {
            return '<button class="btn btn-sm ' + (statuses[key] === st ? 'btn-primary' : 'btn-ghost') + '" data-set="' + st + '">' + F.esc(st.charAt(0).toUpperCase() + st.slice(1)) + '</button>';
          }).join('') +
        '</div></td>' +
      '</tr>';
    }).join('');

    tbody.querySelectorAll('[data-set]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var row = btn.closest('[data-student]');
        var name = row.getAttribute('data-student');
        var st = btn.getAttribute('data-set');
        statuses[name] = st;
        row.querySelectorAll('[data-set]').forEach(function (b) {
          b.classList.toggle('btn-primary', b === btn);
          b.classList.toggle('btn-ghost', b !== btn);
        });
      });
    });
  }

  function init() {
    var sel = $('#att-course');
    sel.innerHTML = M.courses.filter(function (c) { return taughtIds.indexOf(c.id) !== -1; })
      .map(function (c) { return '<option value="' + c.id + '">' + F.esc(c.code + ' — ' + c.short) + '</option>'; }).join('');
    sel.addEventListener('change', renderRoster);

    $('#mark-attendance').addEventListener('click', function () {
      var topic = $('#att-topic').value.trim() || 'This session';
      var present = students.filter(function (s) { return statuses[s] === 'present'; }).length;
      var late = students.filter(function (s) { return statuses[s] === 'late'; }).length;
      LH.toast.success('Attendance saved', present + ' present, ' + late + ' late, ' + (students.length - present - late) + ' absent for "' + F.esc(topic) + '".');
    });

    renderRoster();
    renderAverages();
  }

  LH.app.register('faculty-attendance', init);
  LH.app.init('faculty-attendance');
})(window.LH);