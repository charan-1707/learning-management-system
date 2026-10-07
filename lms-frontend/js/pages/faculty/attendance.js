(function (LH) {
  'use strict';

  var $ = LH.dom.$, F = LH.format, UI = LH.ui, I = LH.icons;

  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  var allCourses = [];
  var dayMap = {};
  var studentAvg = {};
  var students = [];
  var statuses = {};
  var cursor = { y: 0, m: 0 };
  var selected = null;

  function uid() {
    var u = LH.shell.getUser();
    return u ? u.id : 101;
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function isoOf(y, m, d) { return y + '-' + pad(m) + '-' + pad(d); }

  function todayISO() {
    var d = new Date();
    return isoOf(d.getFullYear(), d.getMonth() + 1, d.getDate());
  }

  function className(cid) {
    var c = allCourses.filter(function (x) { return x.id === cid; })[0];
    return c ? c.code + ' — ' + (c.short || c.name) : cid;
  }

  function selCourse() {
    var sel = $('#att-course');
    return sel ? sel.value : null;
  }

  function setDayLabel() {
    var el = $('#att-day-label');
    if (el) el.textContent = selected || '—';
    var t = $('#roster-title');
    if (t) t.textContent = 'Roster — ' + (selected || '—');
  }

  /* ------------------------------ calendar ------------------------------ */

  function renderCalendar() {
    var host = $('#att-calendar');
    var card = $('#att-calendar-card');
    if (!host || !card) return;
    card.style.display = '';
    $('#att-cal-title').textContent = MONTHS[cursor.m - 1] + ' ' + cursor.y;

    var monthSess = Object.keys(dayMap).filter(function (d) {
      return d.slice(0, 7) === cursor.y + '-' + pad(cursor.m);
    });
    var avg = null;
    if (monthSess.length) {
      var sum = 0;
      monthSess.forEach(function (d) { sum += dayMap[d].pct; });
      avg = Math.round(sum / monthSess.length);
    }
    $('#att-cal-sub').textContent = monthSess.length
      ? monthSess.length + ' session(s) this month' + (avg != null ? ' · ' + avg + '% avg' : '')
      : 'No sessions this month yet';

    var first = new Date(cursor.y, cursor.m - 1, 1);
    var startOffset = (first.getDay() + 6) % 7;
    var daysInMonth = new Date(cursor.y, cursor.m, 0).getDate();
    var today = todayISO();
    var html = '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;">' +
      ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(function (d) {
        return '<div style="font-size:11px;font-weight:600;color:var(--color-text-muted);text-align:center;padding:4px 0;">' + d + '</div>';
      }).join('');
    var i, cell;
    for (i = 0; i < startOffset; i++) html += '<div></div>';
    for (i = 1; i <= daysInMonth; i++) {
      var iso = isoOf(cursor.y, cursor.m, i);
      var sess = dayMap[iso];
      var isFuture = iso > today;
      var isToday = iso === today;
      var isSel = iso === selected;
      var bg = sess
        ? (sess.pct >= 75 ? 'var(--color-success-light)' : sess.pct >= 50 ? 'var(--color-warning-light)' : 'var(--color-danger-light)')
        : 'transparent';
      var fg = isFuture ? 'var(--color-text-muted)' : 'var(--color-text-primary)';
      var border = isSel
        ? '2px solid var(--color-primary)'
        : (isToday ? '2px solid var(--color-warning)' : '1px solid var(--color-border-light)');
      cell = '<button data-cal-day="' + iso + '"' + (isFuture ? ' disabled' : '') +
        ' title="' + (sess ? sess.present + '/' + sess.total + ' present' : (isFuture ? 'Future date' : 'No session')) + '"' +
        ' style="min-height:52px;border-radius:10px;border:' + border + ';background:' + bg + ';color:' + fg +
        ';cursor:' + (isFuture ? 'not-allowed' : 'pointer') + ';opacity:' + (isFuture ? '.45' : '1') + ';padding:4px 2px;">' +
        '<div style="font-size:13px;font-weight:' + (isToday || isSel ? '700' : '500') + ';">' + i + '</div>' +
        (sess
          ? '<div style="font-size:10px;font-weight:700;">' + sess.pct + '%</div>'
          : (isToday ? '<div style="font-size:10px;">today</div>' : '')) +
      '</button>';
      html += cell;
    }
    html += '</div>';
    host.innerHTML = html;

    host.querySelectorAll('[data-cal-day]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        selectDay(btn.getAttribute('data-cal-day'));
      });
    });
  }

  async function selectDay(iso) {
    if (iso > todayISO()) {
      LH.toast.error('Future date', 'Attendance cannot be marked for future days.');
      return;
    }
    selected = iso;
    setDayLabel();
    renderCalendar();
    await loadDay();
  }

  /* ------------------------------ day detail + roster ------------------------------ */

  async function loadDay() {
    var cid = selCourse();
    if (!cid || !selected) return;
    var sess = await LH.api.attendance.daySession(cid, selected).catch(function () { return null; });
    var roster = await LH.api.courses.roster(cid).catch(function () { return []; });
    students = roster.map(function (r) { return { id: r.studentId, name: r.name || 'Student' }; });
    statuses = {};
    if (sess && sess.records) {
      sess.records.forEach(function (r) { statuses[r.studentId] = r.status; });
    }
    students.forEach(function (s) { if (statuses[s.id] == null) statuses[s.id] = 'present'; });
    renderRoster(sess);
    var sub = $('#roster-sub');
    if (sub) {
      sub.textContent = sess
        ? sess.present + ' present, ' + (sess.total - sess.present) + ' absent of ' + sess.total + ' on record — adjust and re-save to update'
        : 'No session recorded this day — toggle and Mark attendance to create it';
    }
  }

  function renderRoster(sess) {
    var tbody = $('#roster-body');
    if (!tbody) return;

    tbody.innerHTML = students.map(function (s) {
      var key = s.id;
      var pct = studentAvg[s.id];
      return '<tr data-student="' + key + '">' +
        '<td><div class="avatar-cell">' + UI.avatar(s.name, 'sm') + F.esc(s.name) + '</div></td>' +
        '<td><span class="text-sm" style="font-weight:600;">' + (pct != null ? pct + '%' : '—') + '</span></td>' +
        '<td><div class="btn-group" role="group" aria-label="Attendance for ' + F.esc(s.name) + '">' +
          ['present', 'absent'].map(function (st) {
            return '<button class="btn btn-sm ' + (statuses[key] === st ? 'btn-primary' : 'btn-ghost') + '" data-set="' + st + '">' + F.esc(st.charAt(0).toUpperCase() + st.slice(1)) + '</button>';
          }).join('') +
        '</div></td>' +
      '</tr>';
    }).join('');

    tbody.querySelectorAll('[data-set]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var row = btn.closest('[data-student]');
        var sid = row.getAttribute('data-student');
        var st = btn.getAttribute('data-set');
        statuses[sid] = st;
        row.querySelectorAll('[data-set]').forEach(function (b) {
          b.classList.toggle('btn-primary', b === btn);
          b.classList.toggle('btn-ghost', b !== btn);
        });
      });
    });
  }

  /* ------------------------------ averages ------------------------------ */

  async function renderAverages() {
    var el = $('#avg-list');
    if (!el) return;

    var views = await Promise.all((allCourses || []).map(function (c) {
      return LH.api.attendance.classView(c.id).catch(function () { return null; });
    }));

    el.innerHTML = allCourses.map(function (c, i) {
      var pct = (views[i] && views[i].overall) ? views[i].overall.percent : 0;
      return '<div style="margin-bottom:16px;">' +
        '<div class="flex items-center justify-between" style="margin-bottom:6px;gap:12px;">' +
          '<span style="font-size:13px;font-weight:500;color:var(--color-text-primary);">' + F.esc(className(c.id)) + '</span>' +
          '<span style="font-size:13px;font-weight:700;color:var(--color-text-tertiary);">' + pct + '%</span>' +
        '</div>' + UI.progress(pct) +
      '</div>';
    }).join('');
  }

  async function refreshSessions() {
    var cid = selCourse();
    if (!cid) return;
    var view = await LH.api.attendance.classView(cid).catch(function () { return null; });
    dayMap = {};
    (view && view.sessions ? view.sessions : []).forEach(function (s) { dayMap[s.date] = s; });
  }

  /* ------------------------------ init ------------------------------ */

  async function init() {
    var owned = await LH.api.courses.byInstructorId(uid()).catch(function () { return []; });
    if (!owned.length) owned = await LH.api.courses.byInstructor('Dr. Priya Sharma').catch(function () { return []; });
    allCourses = owned;

    var sel = $('#att-course');
    sel.innerHTML = owned
      .map(function (c) { return '<option value="' + c.id + '">' + F.esc(c.code + ' — ' + (c.short || c.name)) + '</option>'; }).join('');
    sel.addEventListener('change', onCourseChange);

    $('#att-prev').addEventListener('click', function () {
      if (cursor.m === 1) { cursor.y--; cursor.m = 12; } else cursor.m--;
      renderCalendar();
    });
    $('#att-next').addEventListener('click', function () {
      if (cursor.m === 12) { cursor.y++; cursor.m = 1; } else cursor.m++;
      renderCalendar();
    });
    $('#att-today').addEventListener('click', function () { selectDay(todayISO()); });

    $('#mark-attendance').addEventListener('click', function () {
      var cid = selCourse();
      if (!cid || !selected) return;
      if (selected > todayISO()) {
        LH.toast.error('Future date', 'Attendance cannot be marked for future days.');
        return;
      }
      var records = students.map(function (s) {
        return { studentId: (typeof s.id === 'number' ? s.id : Number(s.id)) || s.id, status: statuses[s.id] || 'present' };
      });
      LH.api.attendance.takeSession(cid, { date: selected, records: records }).then(function () {
        var present = records.filter(function (x) { return x.status === 'present'; }).length;
        LH.toast.success('Attendance saved', present + ' present, ' + (records.length - present) + ' absent for ' + selected + '.');
        refreshSessions().then(function () {
          renderCalendar();
          loadDay();
          renderAverages();
        });
      }).catch(function (err) {
        LH.toast.error('Save failed', (err && err.error) || 'Attendance could not be saved.');
      });
    });

    await onCourseChange();
  }

  async function onCourseChange() {
    var cid = selCourse();
    if (!cid) return;
    var t = todayISO().split('-');
    cursor = { y: parseInt(t[0], 10), m: parseInt(t[1], 10) };
    selected = todayISO();
    setDayLabel();
    studentAvg = {};
    try {
      (await LH.api.courses.studentProgress(cid)).forEach(function (r) {
        if (r.attendancePct != null) studentAvg[r.studentId] = r.attendancePct;
      });
    } catch (e) { /* ignore */ }
    await refreshSessions();
    renderCalendar();
    await loadDay();
    await renderAverages();
  }

  LH.app.register('faculty-attendance', init);
  LH.app.init('faculty-attendance');
})(window.LH);
