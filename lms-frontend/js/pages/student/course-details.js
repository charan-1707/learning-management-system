(function (LH) {
  'use strict';

  var $ = LH.dom.$, F = LH.format, D = LH.date, UI = LH.ui, I = LH.icons, DB = LH.db;
  var M = LH.mock;

  var accents = {
    blue: { bg: 'rgba(37,99,235,0.14)' },
    green: { bg: 'rgba(5,150,105,0.14)' },
    purple: { bg: 'rgba(124,58,237,0.14)' },
    orange: { bg: 'rgba(217,119,6,0.14)' },
    teal: { bg: 'rgba(13,148,136,0.14)' },
    red: { bg: 'rgba(220,38,38,0.14)' }
  };

  var course = null;

  /* Live enrollment/progress state (refreshed from the backend; sync getters
     below read this snapshot so render code stays unchanged). */
  var enrolledNow = false;
  var progressNow = { total: 0, completed: 0, percent: 0, completedLessonIds: [] };
  var doneSet = {};

  function uid() {
    var u = LH.shell.getUser();
    return u ? u.id : 201;
  }

  function refreshState() {
    return LH.api.enrollments.isEnrolled(uid(), course.id).then(function (enr) {
      enrolledNow = !!enr;
      if (!enrolledNow) {
        progressNow = { total: 0, completed: 0, percent: 0, completedLessonIds: [] };
        doneSet = {};
        return;
      }
      return LH.api.enrollments.progress(uid(), course.id).then(function (p) {
        progressNow = p || progressNow;
        doneSet = {};
        (progressNow.completedLessonIds || []).forEach(function (id) { doneSet[id] = true; });
      });
    }).catch(function () {
      enrolledNow = false;
      progressNow = { total: 0, completed: 0, percent: 0, completedLessonIds: [] };
      doneSet = {};
    });
  }

  var lessonIdCache = null;
  function lessonIdsOfCourse() {
    if (!lessonIdCache && course) {
      lessonIdCache = {};
      try {
        DB.modules.forCourse(course.id).forEach(function (m) {
          DB.lessons.forModule(m.id).forEach(function (l) { lessonIdCache[l.id] = true; });
        });
      } catch (e) { /* ignore */ }
    }
    return lessonIdCache || {};
  }

  function isEnrolled() {
    return enrolledNow;
  }

  function liveProgress() {
    return progressNow;
  }

  function completedLessonIds() {
    return doneSet;
  }

  function tabContentMarkup(type) {
    var map = { pdf: 'PDF', video: 'Video', link: 'Resource', image: 'Image' };
    return UI.badge(map[type] || 'File', type === 'video' ? 'info' : type === 'pdf' ? 'danger' : type === 'link' ? 'warning' : 'neutral');
  }

  function enrollBtnMarkup() {
    return '<button class="btn btn-sm btn-primary" data-enroll-course>' + I.icon('plus', 14) + ' Enroll now</button>';
  }

  function renderBanner() {
    var el = $('#course-banner');
    var accent = accents[course.accent] || accents.blue;
    var thumb = UI.coverUrl(course.thumbnailUrl);
    var live = isEnrolled() ? liveProgress() : { percent: course.progress || 0, completed: 0, total: 0 };
    var pct = live.percent;

    el.innerHTML =
      '<section class="card ch2">' +
        (thumb ? '<div class="ch2-cover"><img src="' + thumb + '" alt="' + F.esc(course.name) + ' cover" onerror="this.parentNode.remove()"></div>' : '') +
        '<div class="card-body ch2-body">' +
          '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">' +
            '<a class="btn btn-sm btn-secondary" href="courses.html">&larr; All courses</a>' +
            '<span class="badge badge-neutral">' + F.esc(course.semester || '') + '</span>' +
            '<span class="badge badge-neutral">' + course.credits + ' credits</span>' +
            (course.status === 'draft' ? '<span class="badge badge-neutral">' + F.esc(course.status) + '</span>' : '') +
          '</div>' +
          '<h1 style="font-size:clamp(24px,3.6vw,34px);font-weight:800;letter-spacing:-0.03em;line-height:1.05;color:var(--color-text-primary);">' + F.esc(course.name) + '</h1>' +
          '<div style="display:flex;align-items:center;gap:8px;color:var(--color-text-tertiary);font-size:13px;">' +
            UI.avatar(course.instructor, 'sm', UI.coverUrl(course.instructorAvatar)) +
            '<span>' + F.esc(course.instructor) + '</span>' +
            '<span>&middot;</span><span>Updated ' + F.esc(course.updated || '') + '</span>' +
          '</div>' +
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">' +
            '<span style="font-size:13px;color:var(--color-text-tertiary);">' + (isEnrolled() ? 'Your progress' : 'Course progress') + '</span>' +
            '<span style="font-size:15px;font-weight:700;color:var(--color-primary);">' + pct + '%</span></div>' +
          '<div id="banner-progress">' + UI.progress(pct) + '</div>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;" id="banner-actions">' +
            (isEnrolled()
              ? '<a class="btn btn-sm btn-primary" href="#materials" data-go-materials>' + I.icon('play', 14) + ' Continue learning</a>'
              : enrollBtnMarkup()) +
            '<button class="btn btn-sm btn-secondary" data-share-course>' + I.icon('send', 14) + ' Share</button>' +
          '</div>' +
        '</div>' +
      '</section>';

    var actions = $('#banner-actions');
    if (actions) {
      var shareEl = actions.querySelector('[data-share-course]');
      if (shareEl) shareEl.addEventListener('click', function () {
        var url = window.location.origin + window.location.pathname +
          '?id=' + encodeURIComponent(course.id);
        function done() {
          LH.toast.success('Link copied', 'Course link copied to clipboard.');
        }
        function fallbackCopy() {
          var ta = document.createElement('textarea');
          ta.value = url;
          ta.setAttribute('readonly', '');
          ta.style.cssText = 'position:fixed;top:0;opacity:0;';
          document.body.appendChild(ta);
          ta.select();
          try {
            if (document.execCommand('copy')) done();
            else LH.toast.error('Copy failed', 'Copy this link manually: ' + url);
          } catch (e) {
            LH.toast.error('Copy failed', 'Copy this link manually: ' + url);
          }
          ta.remove();
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(done, fallbackCopy);
        } else {
          fallbackCopy();
        }
      });
      var enrollEl = actions.querySelector('[data-enroll-course]');
      if (enrollEl) enrollEl.addEventListener('click', function () { handleEnroll(); });
    }
  }

  function handleEnroll() {
    LH.api.enrollments.enroll(uid(), course.id).then(function (res) {
      if (!res || !res.ok) {
        LH.toast.error('Cannot enroll', (res && res.error) || 'Enrollment failed.');
        return;
      }
      LH.toast.success('Enrolled', 'You are now enrolled in ' + course.name + '.');
      refreshState().then(function () {
        renderBanner();
        renderPanels();
      });
    });
  }

  function lockedPanel(name) {
    return '<div class="card-header"><h2 class="card-title">' + F.esc(name) + '</h2></div>' +
      '<div class="card-body">' + UI.emptyState('lock', name + ' locked', 'Enroll in this course to access ' + name.toLowerCase() + '.') + '</div>';
  }

  async function renderOverview() {
    var el = $('#overview-panel');
    if (!el) return;

    var totalLessons = 0;
    if (isEnrolled()) {
      totalLessons = liveProgress().total;
    } else {
      try {
        totalLessons = await LH.api.lessons.countForCourse(course.id);
      } catch (e) { totalLessons = 0; }
    }

    var data = await Promise.all([
      LH.api.assignments.forCourse(course.id).catch(function () { return []; }),
      LH.api.quizzes.list().catch(function () { return []; }),
      LH.api.modules.forCourse(course.id).catch(function () { return []; })
    ]);
    var assigned = data[0];
    var quiz = data[1].filter(function (q) { return q.courseId === course.id; });
    var live = isEnrolled() ? liveProgress() : { total: totalLessons, completed: 0, percent: 0 };
    var modules = data[2];

    el.innerHTML =
      '<div class="card-header"><h2 class="card-title">About this course</h2></div>' +
      '<div class="card-body">' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;margin-bottom:24px;">' +
          '<div><div class="text-xs" style="text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted);margin-bottom:4px;">Course code</div><div style="font-weight:600;font-size:14px;">' + F.esc(course.code) + '</div></div>' +
          '<div><div class="text-xs" style="text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted);margin-bottom:4px;">Instructor</div><div style="display:flex;align-items:center;gap:8px;font-weight:600;font-size:14px;">' + UI.avatar(course.instructor, 'sm', UI.coverUrl(course.instructorAvatar)) + '<span>' + F.esc(course.instructor) + '</span></div></div>' +
          '<div><div class="text-xs" style="text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted);margin-bottom:4px;">Modules</div><div style="font-weight:600;font-size:14px;">' + modules.length + '</div></div>' +
          '<div><div class="text-xs" style="text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted);margin-bottom:4px;">Assignments</div><div style="font-weight:600;font-size:14px;">' + assigned.length + ' active</div></div>' +
          '<div><div class="text-xs" style="text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted);margin-bottom:4px;">Quizzes</div><div style="font-weight:600;font-size:14px;">' + quiz.length + ' scheduled</div></div>' +
        '</div>' +
        '<h3 style="font-size:14px;font-weight:600;color:var(--color-text-primary);margin-bottom:8px;">Description</h3>' +
        '<p style="color:var(--color-text-secondary);font-size:14px;line-height:1.7;margin-bottom:20px;">' + F.esc(course.description) + '</p>' +
        '<h3 style="font-size:14px;font-weight:600;color:var(--color-text-primary);margin-bottom:8px;">What you&rsquo;ll learn</h3>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px 24px;">' +
          (course.outcomes && course.outcomes.length
            ? course.outcomes.map(function (item) {
                return '<div style="display:flex;gap:10px;align-items:flex-start;font-size:13px;color:var(--color-text-secondary);"><span style="color:var(--color-success);margin-top:1px;flex-shrink:0;display:inline-flex;">' + I.icon('check', 22) + '</span>' + F.esc(item) + '</div>';
              }).join('')
            : ['Core concepts and practical skills', 'Hands-on implementation and examples', 'Problem-solving and real-world applications'].map(function (item) {
                return '<div style="display:flex;gap:10px;align-items:flex-start;font-size:13px;color:var(--color-text-secondary);"><span style="color:var(--color-success);margin-top:1px;flex-shrink:0;display:inline-flex;">' + I.icon('check', 22) + '</span>' + item + '</div>';
              }).join('')) +
        '</div>' +
      '</div>';
  }

  /* ------------------------------ engagement gate ------------------------------
     Anti-gaming completion: completing requires opening the material first
     (first touch starts a server-side dwell clock) plus a per-type minimum
     dwell; directly-playable video files additionally require 80% watched via
     player heartbeats. Thresholds MUST mirror dwellSeconds()/WATCH_PCT_
     REQUIRED in EnrollmentService — the backend enforces, this is display.
     Engine state lives in the `engage` map (keyed by lesson) so countdowns
     survive materials re-renders; the DOM is repainted, never trusted. */

  var DWELL_SEC = { link: 30, pdf: 60, video: 60, def: 60 };
  var WATCH_PCT_REQUIRED = 80;
  var HEARTBEAT_SEC = 10;

  var engage = {};
  var engageMeta = {};

  function isDirectVideoFile(url) {
    return !!url && /\.(mp4|webm|ogg|ogv|mov|m4v)([?#].*)?$/i.test(url);
  }

  function dwellFor(type, fileUrl) {
    if (type === 'link') return DWELL_SEC.link;
    if (type === 'video' && !isDirectVideoFile(fileUrl)) return DWELL_SEC.pdf;
    if (type === 'video') return 30; /* watch gate carries the weight; floor only */
    if (type === 'pdf') return DWELL_SEC.pdf;
    return DWELL_SEC.def;
  }

  function needsWatch(meta) {
    return meta && meta.type === 'video' && isDirectVideoFile(meta.file);
  }

  function engageSlotHtml(id) {
    var st = engage[id];
    if (!st) {
      return '<button class="btn btn-sm btn-primary" data-engage-start="' + F.esc(id) + '" ' +
        'title="Open the material, wait out the timer, then complete">Start</button>';
    }
    if (st.ready) {
      return '<button class="btn btn-sm btn-primary" data-complete-lesson="' + F.esc(id) + '">Mark complete</button>';
    }
    if (needsWatch(st) && st.remainingMs <= 0 && !st.videoReady) {
      return '<button class="btn btn-sm btn-secondary" disabled ' +
        'title="Watch at least ' + WATCH_PCT_REQUIRED + '% of the video">Watch ' + (st.watchPct || 0) + '%</button>';
    }
    var secs = Math.max(1, Math.ceil((st.remainingMs || 0) / 1000));
    return '<button class="btn btn-sm btn-secondary" disabled ' +
      'title="Spend a little more time with the material first">Wait ' + secs + 's</button>';
  }

  function paintEngage(id) {
    var slot = null;
    try { slot = document.querySelector('[data-engage-slot="' + id + '"]'); } catch (e) { return; }
    if (slot) slot.innerHTML = engageSlotHtml(id);
  }

  function refreshReady(id) {
    var st = engage[id];
    if (!st) return;
    st.ready = st.remainingMs <= 0 && (!needsWatch(st) || st.videoReady);
    if (st.ready && st.timer) {
      try { clearInterval(st.timer); } catch (e) { /* ignore */ }
      st.timer = null;
    }
  }

  function clearEngage(id) {
    var st = engage[id];
    if (st && st.timer) { try { clearInterval(st.timer); } catch (e) { /* ignore */ } }
    delete engage[id];
  }

  function armTick(id) {
    var st = engage[id];
    if (!st) return;
    if (st.timer) { try { clearInterval(st.timer); } catch (e) { /* ignore */ } st.timer = null; }
    if (typeof document !== 'undefined' && document.hidden) return; /* visibility handler resumes */
    st.timer = setInterval(function () { onTick(id); }, 1000);
  }

  function onTick(id) {
    var st = engage[id];
    if (!st || st.deadlineMs == null) return;
    st.remainingMs = Math.max(0, st.deadlineMs - Date.now());
    if (st.remainingMs <= 0 && st.timer) {
      try { clearInterval(st.timer); } catch (e) { /* ignore */ }
      st.timer = null;
    }
    refreshReady(id);
    paintEngage(id);
  }

  function startEngage(id) {
    var meta = engageMeta[id] || { type: null, file: null };
    var cur = engage[id];
    if (cur && cur.ready) return;
    var threshold = dwellFor(meta.type, meta.file);
    var st = engage[id] = { type: meta.type, file: meta.file, thresholdSec: threshold,
      remainingMs: threshold * 1000, deadlineMs: Date.now() + threshold * 1000,
      timer: null, ready: false, watchPct: 0, videoReady: false, lastBeat: 0 };
    paintEngage(id);
    armTick(id);
    LH.api.lessons.markViewed(uid(), id).then(function (r) {
      var cur2 = engage[id];
      if (!cur2 || cur2.ready) return;
      var required = (r && r.requiredSec != null) ? r.requiredSec : dwellFor(meta.type, meta.file);
      var elapsed = (r && r.elapsedSec != null) ? r.elapsedSec : 0;
      cur2.thresholdSec = required;
      cur2.remainingMs = Math.max(0, (required - elapsed) * 1000);
      cur2.deadlineMs = Date.now() + cur2.remainingMs;
      var wpct = (r && r.watchPct != null) ? r.watchPct : 0;
      cur2.watchPct = Math.max(cur2.watchPct, wpct);
      if (cur2.watchPct >= WATCH_PCT_REQUIRED) cur2.videoReady = true;
      refreshReady(id);
      armTick(id);
      paintEngage(id);
      updateWatchLabel(id);
    }).catch(function (err) {
      delete engage[id];
      paintEngage(id);
      LH.toast.error('Could not start', (err && err.error) || 'Progress tracking failed.');
    });
  }

  function updateWatchLabel(id) {
    var label = null;
    try { label = document.querySelector('[data-watch-label="' + id + '"]'); } catch (e) { return; }
    if (!label) return;
    var st = engage[id] || {};
    var pct = st.watchPct || 0;
    label.textContent = st.videoReady
      ? 'Watched ' + pct + '% — done, you can complete this lesson'
      : 'Watched ' + pct + '% — ' + WATCH_PCT_REQUIRED + '% unlocks completion';
  }

  function sendHeartbeat(id, pos, dur, force) {
    var st = engage[id];
    if (!st) return;
    if (!force && Date.now() - (st.lastBeat || 0) < HEARTBEAT_SEC * 1000) return;
    st.lastBeat = Date.now();
    LH.api.lessons.watchProgress(uid(), id, Math.floor(pos), Math.floor(dur)).then(function (r) {
      var cur = engage[id];
      if (!cur) return;
      var serverPct = (r && r.watchPct != null) ? r.watchPct : 0;
      cur.watchPct = Math.max(cur.watchPct || 0, serverPct);
      if (cur.watchPct >= WATCH_PCT_REQUIRED) cur.videoReady = true;
      refreshReady(id);
      paintEngage(id);
      updateWatchLabel(id);
    }).catch(function () { /* next beat retries */ });
  }

  function onVideoPlay(id) {
    if (!engage[id]) startEngage(id);
    updateWatchLabel(id);
  }

  function onVideoTime(id, v) {
    var dur = v.duration, pos = v.currentTime;
    if (!isFinite(dur) || dur <= 0 || pos < 0) return;
    var pct = Math.round(Math.min(100, pos * 100 / dur));
    var st = engage[id];
    if (!st) { startEngage(id); return; }
    var crossed = !st.videoReady && pct >= WATCH_PCT_REQUIRED;
    st.watchPct = Math.max(st.watchPct || 0, pct);
    if (crossed) st.videoReady = true;
    sendHeartbeat(id, pos, dur, crossed);
    if (crossed) { refreshReady(id); paintEngage(id); updateWatchLabel(id); }
    else updateWatchLabel(id);
  }

  function onVideoEnded(id, v) {
    var dur = v.duration;
    if (!isFinite(dur) || dur <= 0) return;
    var st = engage[id];
    if (st) st.lastBeat = 0;
    sendHeartbeat(id, dur, dur, true);
  }

  function lessonRow(l, doneIds) {
    var done = !!doneIds[l.id];
    var file = null;
    try { file = LH.api.fileUrl(l.fileUrl); } catch (e) { file = null; }
    engageMeta[l.id] = { type: l.type || null, file: file || l.fileUrl || null };
    var openBtn = file
      ? '<a class="btn btn-sm btn-secondary" data-open-lesson="' + F.esc(l.id) + '" href="' + F.esc(file) + '" target="_blank" rel="noopener">Open</a>'
      : '';
    var directVideo = !done && l.type === 'video' && isDirectVideoFile(file || l.fileUrl);
    var player = '';
    if (directVideo) {
      player = '<div data-video-wrap="' + F.esc(l.id) + '" style="display:none;margin-top:10px;">' +
        '<video controls preload="metadata" data-video-player="' + F.esc(l.id) + '" src="' + F.esc(file) + '" style="width:100%;max-height:320px;border-radius:8px;background:#000;"></video>' +
        '<div style="font-size:12px;color:var(--color-text-tertiary);margin-top:4px;" data-watch-label="' + F.esc(l.id) + '">Watch at least ' + WATCH_PCT_REQUIRED + '% to unlock completion</div>' +
      '</div>';
    }
    var statusEl;
    if (done) {
      statusEl = '<span style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--color-success);">' + I.icon('checkCircle', 15) + ' Completed</span>';
    } else {
      var watchToggle = directVideo
        ? '<button class="btn btn-sm btn-ghost" data-video-toggle="' + F.esc(l.id) + '">' + I.icon('play', 14) + ' Watch</button>'
        : '';
      statusEl = '<div style="display:flex;gap:8px;align-items:center;flex-shrink:0;">' + watchToggle +
        '<span data-engage-slot="' + F.esc(l.id) + '">' + engageSlotHtml(l.id) + '</span></div>';
    }
    return '<div class="material-item">' +
      UI.materialIcon(l.type) +
      '<div class="material-info"><div class="material-name">' + F.esc(l.title) + '</div>' +
      '<div class="material-meta"><span>' + tabContentMarkup(l.type) + '</span>' +
      (l.size ? '<span>' + F.fileSize(l.size) + '</span>' : '') +
      (l.meta ? '<span>' + F.esc(l.meta) + '</span>' : '') +
      '</div>' + player + '</div>' +
      '<div style="display:flex;gap:8px;align-items:center;flex-shrink:0;">' + openBtn + statusEl + '</div>' +
    '</div>';
  }

  async function renderMaterials() {
    var el = $('#materials-panel');
    if (!el) return;

    if (!isEnrolled()) {
      el.innerHTML = lockedPanel('Materials');
      return;
    }

    var doneIds = completedLessonIds();
    var mods = await LH.api.modules.forCourse(course.id).catch(function () { return []; });
    var modules = (await Promise.all(mods.map(function (m) {
      return LH.api.lessons.forModule(m.id).catch(function () { return []; }).then(function (lessons) {
        var doneIn = lessons.filter(function (l) { return !!doneIds[l.id]; }).length;
        var rows = lessons.map(function (l) { return lessonRow(l, doneIds); }).join('');

        return '<div class="module-item">' +
          '<div class="module-header" data-module-toggle>' +
            '<div class="module-header-left"><span class="module-toggle">' + I.icon('chevronDown', 16) + '</span>' +
            '<span class="module-number">Module ' + m.orderIndex + '</span>' +
            '<span class="module-title">' + F.esc(m.title) + '</span></div>' +
            '<div style="display:flex;align-items:center;gap:12px;"><span class="module-progress">' + doneIn + '/' + lessons.length + ' lessons</span>' +
            (doneIn && doneIn === lessons.length && lessons.length ? UI.badge('Completed', 'success') : '') + '</div>' +
          '</div>' +
          '<div class="module-content">' + (rows || UI.emptyState('file', 'No lessons yet', 'Lessons will appear here once the instructor adds them.').replace('text-align:center', 'text-align:left').replace('padding:24px', 'padding:12px')) + '</div>' +
        '</div>';
      });
    }))).join('');

    var live = liveProgress();
    el.innerHTML =
      '<div class="card-header"><h2 class="card-title">Materials</h2><p class="card-subtitle">' + live.completed + ' of ' + live.total + ' lessons completed</p></div>' +
      '<div class="card-body">' + modules +
      '<div style="text-align:center;margin-top:8px;"><button class="btn btn-sm btn-ghost" id="expand-all">Expand all</button></div>' +
      '</div>';

    /* Bind inline video players (play/timeupdate/ended do not bubble, so
       delegation cannot be used — bind after every render). */
    el.querySelectorAll('video[data-video-player]').forEach(function (v) {
      var id = v.getAttribute('data-video-player');
      v.addEventListener('play', function () { onVideoPlay(id); });
      v.addEventListener('timeupdate', function () { onVideoTime(id, v); });
      v.addEventListener('ended', function () { onVideoEnded(id, v); });
    });
  }

  async function renderAssignments() {
    var el = $('#assignments-panel');
    if (!el) return;

    if (!isEnrolled()) {
      el.innerHTML = lockedPanel('Assignments');
      return;
    }

    var all = await LH.api.assignments.list().catch(function () { return []; });
    var subs = await LH.api.submissions.forStudent(uid()).catch(function () { return []; });
    var subByAsg = {};
    subs.forEach(function (s) { subByAsg[s.assignmentId] = s; });
    var rows = all.filter(function (a) { return a.courseId === course.id; })
      .map(function (a) {
        var sub = subByAsg[a.id] || null;
        var status = a.ownStatus || 'not-started';
        var pct = status === 'graded' && sub ? Math.round(sub.score / a.maxMarks * 100) : null;
        /* Not-started rows: clean, slightly larger Start button with no
           status pill behind it. */
        if (status === 'not-started') {
          return '<div class="activity-item" style="align-items:center;">' +
            '<div class="activity-icon neutral">' + I.icon('assignments') + '</div>' +
            '<div class="activity-content"><div class="activity-title">' + F.esc(a.title) + '</div>' +
            '<div class="activity-meta">Due ' + D.format(a.due) + ' &middot; ' + a.maxMarks + ' marks</div></div>' +
            '<div style="display:flex;align-items:center;gap:10px;">' +
            '<a class="btn btn-primary" href="assignment-detail.html?id=' + a.id + '">Start</a></div>' +
          '</div>';
        }
        return '<div class="activity-item" style="align-items:center;">' +
          '<div class="activity-icon ' + (status === 'graded' ? 'success' : status === 'overdue' ? 'danger' : status === 'submitted' ? 'info' : 'neutral') + '">' + I.icon('assignments') + '</div>' +
          '<div class="activity-content"><div class="activity-title">' + F.esc(a.title) + '</div>' +
          '<div class="activity-meta">Due ' + D.format(a.due) + ' &middot; ' + a.maxMarks + ' marks</div></div>' +
          '<div style="display:flex;align-items:center;gap:10px;"><span style="font-weight:600;font-size:13px;color:var(--color-text-primary);">' + (pct != null ? pct + '%' : '') + '</span>' +
          UI.statusBadge(status) +
          '<a class="btn btn-sm btn-ghost" href="assignment-detail.html?id=' + a.id + '">' + I.icon('arrowRight', 14) + '</a></div>' +
        '</div>';
      }).join('');

    el.innerHTML =
      '<div class="card-header"><h2 class="card-title">Assignments</h2><p class="card-subtitle">Your assignments in this course</p></div>' +
      '<div class="card-body" style="padding-top:var(--spacing-4);padding-bottom:var(--spacing-4);">' + (rows || UI.emptyState('assignments', 'No assignments', 'Assignments will appear here once published.')) + '</div>';
  }

  async function renderQuizzes() {
    var el = $('#quizzes-panel');
    if (!el) return;

    if (!isEnrolled()) {
      el.innerHTML = lockedPanel('Quizzes');
      return;
    }

    var rows = (await LH.api.quizzes.list().catch(function () { return []; }))
      .filter(function (q) { return q.courseId === course.id; })
      .map(function (q) {
        /* Available quizzes: clean, slightly larger Start button with no
           status pill or placeholder score behind it. */
        if (!q.taken) {
          return '<div class="activity-item" style="align-items:center;">' +
            '<div class="activity-icon warning">' + I.icon('quizzes') + '</div>' +
            '<div class="activity-content"><div class="activity-title">' + F.esc(q.title) + '</div>' +
            '<div class="activity-meta">' + q.questions + ' questions &middot; ' + q.duration + ' min &middot; due ' + D.format(q.due) + '</div></div>' +
            '<div style="display:flex;align-items:center;gap:10px;">' +
            '<a class="btn btn-primary" href="quiz-attempt.html?id=' + q.id + '" data-quiz-start>' + I.icon('play', 14) + ' Start Quiz</a></div>' +
          '</div>';
        }
        /* Completed quizzes: score and Completed pill stacked on separate
           lines so they can never sit on top of each other. */
        return '<div class="activity-item" style="align-items:center;">' +
          '<div class="activity-icon success">' + I.icon('quizzes') + '</div>' +
          '<div class="activity-content"><div class="activity-title">' + F.esc(q.title) + '</div>' +
          '<div class="activity-meta">' + q.questions + ' questions &middot; ' + q.duration + ' min &middot; due ' + D.format(q.due) + '</div></div>' +
          '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0;">' +
          '<span style="font-size:13px;font-weight:600;color:var(--color-text-primary);white-space:nowrap;">' + (q.bestScore || '') + '</span>' +
          UI.statusBadge('completed') +
        '</div>';
      }).join('');

    el.innerHTML =
      '<div class="card-header"><h2 class="card-title">Quizzes</h2><p class="card-subtitle">Scheduled quizzes in this course</p></div>' +
      '<div class="card-body" style="padding-top:var(--spacing-4);padding-bottom:var(--spacing-4);">' + (rows || UI.emptyState('quizzes', 'No quizzes', 'Quizzes will appear here once scheduled.')) + '</div>';
  }

async function renderGrades() {
    var el = $('#grades-panel');
    if (!el) return;

    if (!isEnrolled()) {
      el.innerHTML = lockedPanel('Grades');
      return;
    }

    var subs = await LH.api.submissions.forStudent(uid()).catch(function () { return []; });
    var byAsg = {};
    subs.forEach(function (s) { byAsg[s.assignmentId] = s; });
    var gradedSubs = subs.filter(function (s) {
      return s.courseId === course.id && (s.gradedAt || s.status === 'graded');
    });
    var rows = await Promise.all(gradedSubs.map(function (s) {
      return LH.api.assignments.get(s.assignmentId).catch(function () { return null; }).then(function (a) {
        return {
          assessment: a ? a.title : 'Assignment',
          type: 'assignment',
          score: s.score,
          max: a ? (a.maxMarks || 20) : 20,
          date: s.gradedAt,
          feedback: s.feedback
        };
      });
    }));
    if (!rows.length) {
      rows = (await LH.api.grades.list().catch(function () { return []; }))
        .filter(function (g) { return g.courseId === course.id; })
        .map(function (g) {
          return { assessment: g.assessment, type: g.type, score: g.score, max: g.max, date: g.date, feedback: null };
        });
    }
    if (!rows.length) {
      el.innerHTML = '<div class="card-header"><h2 class="card-title">Grades</h2><p class="card-subtitle">Your assessment results for this course</p></div>' +
        '<div class="card-body">' +
        UI.emptyState('grades', 'No grades yet', 'Grades will appear after your faculty publishes them.') +
        '</div>';
      return;
    }
    var pct = rows.length ? Math.round(rows.reduce(function (s, g) { return s + (g.score / g.max) * 100; }, 0) / rows.length) : 0;

    el.innerHTML =
      '<div class="card-header"><h2 class="card-title">Grades</h2><p class="card-subtitle">Your assessment results for this course</p></div>' +
      '<div class="card-body">' +
        '<div class="card" style="padding:var(--spacing-5);margin-bottom:16px;background:var(--color-bg-tertiary);border:none;">' +
          '<div style="display:flex;gap:32px;flex-wrap:wrap;align-items:center;">' +
            '<div><div style="font-size:28px;font-weight:700;color:var(--color-text-primary);">' + pct + '%</div><div style="font-size:12px;color:var(--color-text-tertiary);">Course average</div></div>' +
            '<div><div style="font-size:22px;font-weight:700;color:var(--color-primary);">' + F.gradeLetter(pct) + '</div><div style="font-size:12px;color:var(--color-text-tertiary);">Grade</div></div>' +
            '<div><div style="font-size:22px;font-weight:700;color:var(--color-text-primary);">' + rows.length + '</div><div style="font-size:12px;color:var(--color-text-tertiary);">Assessments graded</div></div>' +
          '</div>' +
        '</div>' +
        '<div class="table-wrapper"><table class="table"><thead><tr><th>Assessment</th><th>Type</th><th>Score</th><th>Percentage</th><th>Grade</th><th>Feedback</th><th>Date</th></tr></thead><tbody>' +
        rows.map(function (g) {
          var p = Math.round(g.score / g.max * 100);
          return '<tr><td style="font-weight:500;">' + F.esc(g.assessment) + '</td>' +
            '<td>' + UI.badge(g.type === 'quiz' ? 'Quiz' : g.type === 'exam' ? 'Exam' : 'Assignment', g.type === 'quiz' ? 'warning' : g.type === 'exam' ? 'info' : 'primary') + '</td>' +
            '<td>' + g.score + ' / ' + g.max + '</td>' +
            '<td><div style="display:flex;align-items:center;gap:10px;max-width:140px;">' + UI.progress(p) + '<span style="font-weight:600;">' + p + '%</span></div></td>' +
            '<td>' + UI.badge(F.gradeLetter(p), F.gradeColor(p)) + '</td>' +
            '<td class="text-tertiary">' + F.esc(g.feedback || '—') + '</td>' +
            '<td class="text-tertiary">' + D.format(g.date) + '</td></tr>';
        }).join('') + '</tbody></table></div>' +
      '</div>';
  }

  async function renderAnnouncements() {
    var el = $('#announcements-panel');
    if (!el) return;

    if (!isEnrolled()) {
      el.innerHTML = lockedPanel('Announcements');
      return;
    }

    var rows = (await LH.api.announcements.forCourse(course.id).catch(function () { return []; }))
      .sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); })
      .map(function (a) {
        return '<div class="activity-item" style="align-items:flex-start;">' +
          '<div class="activity-icon warning">' + I.icon('bell') + '</div>' +
          '<div class="activity-content"><div class="activity-title">' + F.esc(a.title) + '</div>' +
          '<div class="activity-meta">' + F.esc(a.authorId ? 'Instructor' : 'Course team') + ' &middot; ' + D.format(a.createdAt) + '</div>' +
          '<p style="font-size:13px;color:var(--color-text-secondary);line-height:1.6;margin-top:6px;">' + F.esc(a.body) + '</p></div>' +
        '</div>';
      }).join('');

    el.innerHTML =
      '<div class="card-header"><h2 class="card-title">Announcements</h2><p class="card-subtitle">Latest updates from your instructor</p></div>' +
      '<div class="card-body" style="padding-top:var(--spacing-4);padding-bottom:var(--spacing-4);">' + (rows || UI.emptyState('bell', 'No announcements', 'Instructor announcements will appear here.')) + '</div>';
  }

  function renderPanels() {
    renderOverview();
    renderMaterials();
    renderAssignments();
    renderQuizzes();
    renderGrades();
    renderAnnouncements();
  }

  function wireTabs() {
    var tabs = document.querySelectorAll('.tab');
    var panels = document.querySelectorAll('.tab-panel');

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        panels.forEach(function (p) {
          p.classList.toggle('active', p.getAttribute('data-panel') === tab.getAttribute('data-tab'));
        });
      });
    });
  }

  function wireModules() {
    document.addEventListener('click', function (e) {
      var toggle = e.target.closest('[data-module-toggle]');
      if (!toggle) return;
      var item = toggle.closest('.module-item');
      var content = item.querySelector('.module-content');
      var chevron = item.querySelector('.module-toggle');
      var open = content.classList.toggle('open');
      chevron.classList.toggle('open', open);
    });
  }

  async function init() {
    var id = LH.app.param('id') || 'cs201';
    course = await LH.api.courses.get(id).catch(function () { return null; });
    if (!course) {
      try {
        var fallback = await LH.api.courses.list();
        course = (fallback || []).filter(function (c) { return c.status !== 'draft'; })[0]
          || fallback[0] || null;
      } catch (e) { course = null; }
    }
    if (!course) {
      var banner = $('#course-banner');
      if (banner) banner.innerHTML = UI.emptyState('courses', 'Course not found', 'This course does not exist.');
      return;
    }
    lessonIdCache = null;
    await refreshState();

    renderBanner();
    renderPanels();
    wireTabs();
    wireModules();

    // Auto-select Materials tab if #materials hash is present on page load
    if (window.location.hash === '#materials') {
      setTimeout(function () {
        var materialsTab = document.querySelector('.tab[data-tab="materials"]');
        if (materialsTab) {
          materialsTab.click();
          // Also expand first module automatically
          var firstModule = document.querySelector('.module-item .module-header');
          if (firstModule) firstModule.click();
        }
      }, 100);
    }

    document.querySelectorAll('.tab[data-tab="materials"]').forEach(function (t) {
      t.addEventListener('click', function () {
        setTimeout(function () {
          var firstModule = document.querySelector('.module-item .module-header');
          if (firstModule) firstModule.click();
        }, 50);
      });
    });

    /* Banner "Continue learning" button: the anchor href="#materials" alone
       does nothing (no element has id="materials"), so without this handler
       the button appears completely dead. Switch to the Materials tab and
       scroll it into view instead. */
    document.addEventListener('click', function (e) {
      var go = e.target.closest('[data-go-materials]');
      if (!go) return;
      e.preventDefault();
      var materialsTab = document.querySelector('.tab[data-tab="materials"]');
      if (materialsTab) {
        materialsTab.click();
        try { materialsTab.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (err) { /* ignore */ }
      }
    });

    /* Engagement gate: Start records the view + starts the dwell clock. */
    document.addEventListener('click', function (e) {
      var start = e.target.closest('[data-engage-start]');
      if (start) {
        startEngage(start.getAttribute('data-engage-start'));
        return;
      }
      /* Opening the file counts as opening the material: start the clock
         too, without blocking navigation. */
      var open = e.target.closest('[data-open-lesson]');
      if (open) {
        startEngage(open.getAttribute('data-open-lesson'));
        return;
      }
      /* Inline video reveal; first reveal also starts the clock. */
      var toggle = e.target.closest('[data-video-toggle]');
      if (toggle) {
        var vid = toggle.getAttribute('data-video-toggle');
        var wrap = null;
        try { wrap = document.querySelector('[data-video-wrap="' + vid + '"]'); } catch (err) { wrap = null; }
        if (wrap) {
          var showing = wrap.style.display !== 'none';
          wrap.style.display = showing ? 'none' : '';
          if (!showing) startEngage(vid);
        }
      }
    });

    /* Background tabs must not count toward dwell: pause every countdown
       while hidden, resume on return. */
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        Object.keys(engage).forEach(function (id) {
          var st = engage[id];
          if (st && st.timer) {
            st.remainingMs = st.deadlineMs ? Math.max(0, st.deadlineMs - Date.now()) : st.remainingMs;
            try { clearInterval(st.timer); } catch (e) { /* ignore */ }
            st.timer = null;
            paintEngage(id);
          }
        });
      } else {
        Object.keys(engage).forEach(function (id) {
          var st = engage[id];
          if (st && !st.ready && !st.timer) {
            st.deadlineMs = Date.now() + st.remainingMs;
            armTick(id);
          }
        });
      }
    });

    /* Mark lessons complete */
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-complete-lesson]');
      if (!btn) return;
      var lessonId = btn.getAttribute('data-complete-lesson');
      LH.api.lessons.markComplete(uid(), lessonId).then(function () {
        clearEngage(lessonId);
        LH.toast.success('Lesson completed', 'Your progress has been updated.');
        return refreshState();
      }).then(function () {
        renderBanner();
        renderMaterials();
      }).catch(function (err) {
        LH.toast.error('Update failed', (err && err.error) || 'Progress could not be saved.');
      });
    });

    /* Material download buttons */
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-download]');
      if (btn) {
        LH.toast.info('Download started', btn.getAttribute('data-download') + ' will download once demo files are attached.');
      }
    });

    var expandAll = $('#expand-all');
    if (expandAll) {
      expandAll.addEventListener('click', function () {
        var anyClosed = document.querySelector('.module-content:not(.open)');
        document.querySelectorAll('.module-content').forEach(function (c) {
          c.classList.toggle('open', !!anyClosed);
        });
        document.querySelectorAll('.module-toggle').forEach(function (ch) {
          ch.classList.toggle('open', !!anyClosed);
        });
      });
    }
  }

  LH.app.register('student-course-details', init);
  LH.app.init('student-course-details');
})(window.LH);