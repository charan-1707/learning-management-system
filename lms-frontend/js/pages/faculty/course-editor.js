(function (LH) {
  'use strict';

  var $ = LH.dom.$, F = LH.format, UI = LH.ui, I = LH.icons;
  var M = LH.mock;
  var DB = LH.db;

  /* Resolved in init() (after shell auth) — never snapshot at load time. */
  var user = null;
  var courseId = null;
  var course = null;

  function initTabs() {
    document.querySelectorAll('.tab[data-tab]').forEach(function (tab) {
      tab.addEventListener('click', function () {
        document.querySelectorAll('.tab[data-tab]').forEach(function (t) { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
        document.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.remove('active'); });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        document.querySelector('.tab-panel[data-panel="' + tab.getAttribute('data-tab') + '"]').classList.add('active');
      });
    });
  }

  function lessonRow(lesson) {
    return '<div class="material-row" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;background:var(--color-bg-tertiary);margin-top:8px;">' +
      '<span style="color:var(--color-text-muted);display:flex;">' + I.fileIcon(lesson.type || 'pdf') + '</span>' +
      '<div style="flex:1;min-width:0;"><div style="font-size:13px;font-weight:500;color:var(--color-text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + F.esc(lesson.title) + '</div>' +
      '<div style="font-size:11px;color:var(--color-text-muted);">' + F.esc(lesson.type || 'lesson') + ' &middot; ' + F.esc(lesson.meta || lesson.size || '') + '</div></div>' +
      '<button class="btn btn-sm btn-ghost btn-icon-only" data-remove-lesson="' + lesson.id + '" title="Remove material">' + I.icon('trash', 15) + '</button>' +
    '</div>';
  }

  async function renderModules() {
    var el = $('#modules-editor');
    if (!el) return;

    if (!course) {
      el.innerHTML = UI.emptyState('courses', 'Create the course first', 'Save the course details once, then come back to add modules and materials.');
      return;
    }

    var mods = await LH.api.modules.forCourse(course.id);
    var total = mods.length;
    if (!mods.length) {
      el.innerHTML = UI.emptyState('courses', 'No modules yet', 'Add your first module to get started.');
      return;
    }

    el.innerHTML = await Promise.all(mods.map(function (mod, mi) {
      return LH.api.lessons.forModule(mod.id).then(function (materials) {
        var prevBtn = mi > 0 ? '<button class="btn btn-sm btn-ghost btn-icon-only" data-move="' + mod.id + ':up" title="Move module up">' + I.icon('arrow-up', 14) + '</button>' : '';
        var nextBtn = mi < total - 1 ? '<button class="btn btn-sm btn-ghost btn-icon-only" data-move="' + mod.id + ':down" title="Move module down">' + I.icon('arrow-down', 14) + '</button>' : '';
        return '<section class="card" style="margin-bottom:var(--spacing-6);" data-mod="' + mod.id + '">' +
          '<div class="card-header flex items-center justify-between" style="flex-wrap:wrap;gap:12px;">' +
            '<div class="flex items-center" style="gap:12px;">' +
              '<span class="avatar avatar-sm" style="border-radius:8px;">' + (mi + 1) + '</span>' +
              '<div><input class="form-input" data-module-title="' + mod.id + '" value="' + F.esc(mod.title) + '" style="height:32px;padding:0 10px;font-size:14px;font-weight:600;min-width:220px;"></div>' +
            '</div>' +
            '<div style="display:flex;gap:8px;align-items:center;">' +
              prevBtn + nextBtn +
              '<button class="btn btn-sm btn-ghost" data-add-lesson="' + mod.id + '">' + I.icon('plus', 14) + ' Add material</button>' +
              '<button class="btn btn-sm btn-danger-ghost" data-remove-module="' + mod.id + '">' + I.icon('trash', 14) + '</button>' +
            '</div>' +
          '</div>' +
          '<div class="card-body" style="padding-top:6px;padding-bottom:var(--spacing-4);">' +
            ((materials || []).map(function (l) { return lessonRow(l); }).join('') || '<p style="font-size:13px;color:var(--color-text-muted);">No materials yet.</p>') +
          '</div>' +
        '</section>';
      });
    })).then(function (cards) { return cards.join(''); });

    wireModuleEvents();
  }

  function openMaterialDialog(modId) {
    function fmtSize(bytes) {
      if (!bytes && bytes !== 0) return '';
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1048576) return (Math.round(bytes / 102.4) / 10) + ' KB';
      return (Math.round(bytes / 104857.6) / 10) + ' MB';
    }
    function isYouTube(url) {
      return /(youtube\.com|youtu\.be)/i.test(url || '');
    }

    var modal = LH.modal.open(
      '<div class="form-group"><label class="form-label" for="mat-title">Title</label>' +
        '<input class="form-input" id="mat-title" placeholder="e.g. Lecture 1 — Big-O Notation"></div>' +
      '<div class="form-group"><label class="form-label" for="mat-kind">Material type</label>' +
        '<select class="form-input form-select" id="mat-kind">' +
          '<option value="pdf">PDF document (upload)</option>' +
          '<option value="video">Video file (upload, mp4)</option>' +
          '<option value="link">Video link — YouTube (URL)</option>' +
          '<option value="weblink">Web link (URL)</option>' +
        '</select></div>' +
      '<div class="form-group" data-mat-file-row><label class="form-label" for="mat-file">File (pdf/mp4/images/zip, max 10 MB)</label>' +
        '<input class="form-input" id="mat-file" type="file" accept=".pdf,.mp4,.png,.jpg,.jpeg,.gif,.webp,.zip"></div>' +
      '<div class="form-group" data-mat-url-row style="display:none;"><label class="form-label" for="mat-url">URL</label>' +
        '<input class="form-input" id="mat-url" placeholder="https://…"></div>' +
      '<div class="form-error" data-mat-error style="display:none;"></div>' +
      '<div class="modal-footer" style="display:flex;justify-content:flex-end;gap:10px;padding:16px 0 0;">' +
        '<button class="btn btn-secondary" data-mat-cancel>Cancel</button>' +
        '<button class="btn btn-primary" data-mat-save>Add material</button>' +
      '</div>',
      { title: 'Add material', width: '520px' });

    var overlay = modal.overlay;
    function showError(msg) {
      var err = overlay.querySelector('[data-mat-error]');
      if (err) { err.textContent = msg; err.style.display = 'block'; }
    }
    function syncRows() {
      var kind = overlay.querySelector('#mat-kind').value;
      var isUrl = (kind === 'link' || kind === 'weblink');
      overlay.querySelector('[data-mat-file-row]').style.display = isUrl ? 'none' : '';
      overlay.querySelector('[data-mat-url-row]').style.display = isUrl ? '' : 'none';
    }
    overlay.querySelector('#mat-kind').addEventListener('change', syncRows);
    syncRows();
    overlay.querySelector('[data-mat-cancel]').addEventListener('click', function () { LH.modal.close(); });

    overlay.querySelector('[data-mat-save]').addEventListener('click', function () {
      var title = overlay.querySelector('#mat-title').value.trim();
      var kind = overlay.querySelector('#mat-kind').value;
      var isUrl = (kind === 'link' || kind === 'weblink');
      if (!title) { showError('Give the material a title.'); return; }

      function createLesson(payload) {
        LH.api.lessons.create(modId, payload).then(function () {
          LH.modal.close();
          renderModules();
          LH.toast.success('Material added', 'New material added to the module.');
        }).catch(function (err) {
          showError((err && err.error) || 'The material could not be added.');
        });
      }

      if (isUrl) {
        var url = overlay.querySelector('#mat-url').value.trim();
        if (!/^https?:\/\/.+\..+/.test(url)) { showError('Enter a valid http(s) URL.'); return; }
        var label = kind === 'link' && isYouTube(url) ? 'YouTube video' : 'External link';
        createLesson({ title: title, type: 'link', meta: label, fileUrl: url });
        return;
      }

      var files = overlay.querySelector('#mat-file').files;
      if (!files || !files.length) { showError('Choose a file to upload.'); return; }
      var file = files[0];
      if (file.size > 10 * 1024 * 1024) { showError(file.name + ' exceeds the 10 MB limit.'); return; }
      var wantVideo = (kind === 'video');
      var isVideoFile = /^video\//.test(file.type || '') || /\.mp4$/i.test(file.name || '');
      LH.api.storage.upload(file).then(function (up) {
        createLesson({
          title: title,
          type: (wantVideo || isVideoFile) ? 'video' : 'pdf',
          meta: file.name + (file.size ? ' · ' + fmtSize(file.size) : ''),
          sizeBytes: file.size,
          fileUrl: up.url
        });
      }).catch(function (err) {
        showError((err && err.error) || 'The file could not be uploaded.');
      });
    });
  }

  function wireModuleEvents() {
    document.querySelectorAll('[data-module-title]').forEach(function (input) {
      input.addEventListener('change', function () {
        var id = input.getAttribute('data-module-title');
        if (input.value.trim()) LH.api.modules.update(id, { title: input.value.trim() });
      });
    });

    document.querySelectorAll('[data-remove-module]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-remove-module');
        LH.api.modules.forCourse(course.id).then(function (mods) {
          var mod = (mods || []).filter(function (m) { return m.id === id; })[0];
          if (!mod) return;
          LH.modal.confirm('Delete the module "' + mod.title + '" and all its materials? This cannot be undone.', {
            title: 'Delete module',
            onConfirm: function () {
              LH.api.modules.remove(id).then(function () {
                renderModules();
                LH.toast.success('Module deleted', 'The module was removed from the course.');
              });
            }
          });
        });
      });
    });

    document.querySelectorAll('[data-add-lesson]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openMaterialDialog(btn.getAttribute('data-add-lesson'));
      });
    });

    document.querySelectorAll('[data-remove-lesson]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-remove-lesson');
        LH.api.lessons.remove(id).then(function () {
          renderModules();
          LH.toast.info('Material removed', 'The file was removed from the module.');
        });
      });
    });

    document.querySelectorAll('[data-move]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var parts = btn.getAttribute('data-move').split(':');
        var modId = parts[0];
        var dir = parts[1];
        LH.api.modules.forCourse(course.id).then(function (mods) {
          var idx = mods.map(function (m) { return m.id; }).indexOf(modId);
          var swap = dir === 'up' ? idx - 1 : idx + 1;
          if (idx === -1 || swap < 0 || swap >= mods.length) return null;
          var ordered = mods.map(function (m) { return m.id; });
          ordered[idx] = mods[swap].id;
          ordered[swap] = modId;
          return LH.api.modules.reorder(course.id, ordered);
        }).then(function (res) {
          if (res) renderModules();
        });
      });
    });
  }

  function collectDetails() {
    var status = 'published';
    document.querySelectorAll('input[name="vis"]').forEach(function (r) {
      if (r.checked && r.value === 'draft') status = 'draft';
    });
    var outcomes = [];
    document.querySelectorAll('#ce-outcomes [data-outcome]').forEach(function (input) {
      var v = input.value.trim();
      if (v) outcomes.push(v);
    });
    return {
      name: $('#ce-name').value.trim(),
      code: $('#ce-code').value.trim(),
      credits: $('#ce-credits').value,
      instructor: $('#ce-instructor').value.trim(),
      description: $('#ce-desc').value.trim(),
      outcomes: outcomes,
      status: status
    };
  }

  function renderOutcomes(list) {
    var host = $('#ce-outcomes');
    if (!host) return;
    var rows = (list && list.length ? list : ['']).map(function (text, i) {
      return '<div style="display:flex;gap:8px;margin-bottom:8px;">' +
        '<input class="form-input" data-outcome="' + i + '" value="' + F.esc(text) + '" placeholder="e.g. Implement and analyse core data structures">' +
        '<button class="btn btn-sm btn-ghost" type="button" data-remove-outcome="' + i + '" aria-label="Remove outcome">' + I.icon('trash', 14) + '</button>' +
      '</div>';
    }).join('');
    host.innerHTML = rows;
    host.querySelectorAll('[data-remove-outcome]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(btn.getAttribute('data-remove-outcome'), 10);
        var current = [];
        host.querySelectorAll('[data-outcome]').forEach(function (input) { current.push(input.value); });
        current.splice(idx, 1);
        renderOutcomes(current.length ? current : ['']);
      });
    });
  }

  function fillDetails(c) {
    if (!$('#ce-name')) return;
    $('#ce-name').value = c.name || '';
    $('#ce-code').value = c.code || '';
    $('#ce-credits').value = String(c.credits || '3');
    $('#ce-instructor').value = c.instructor || (user.name || '');
    $('#ce-desc').value = c.description || '';
    renderOutcomes(c.outcomes && c.outcomes.length ? c.outcomes : ['']);
    var status = c.status && c.status !== 'published' ? 'draft' : 'published';
    document.querySelectorAll('input[name="vis"]').forEach(function (r) {
      r.checked = (r.value === status);
    });
  }

  function initUpload() {
    var up = $('#thumb-upload');
    if (!up) return;
    up.innerHTML = up.innerHTML.replace('UPLOAD_ICON', I.icon('image', 26));
    refreshThumbPreview();
    up.addEventListener('click', function () {
      if (!course) { LH.toast.info('Save first', 'Save the course details first, then add a thumbnail.'); return; }
      var input = document.createElement('input');
      input.type = 'file';
      input.accept = '.png,.jpg,.jpeg,.gif,.webp';
      input.addEventListener('change', function () {
        if (!input.files || !input.files.length) return;
        var file = input.files[0];
        if (file.size > 10 * 1024 * 1024) { LH.toast.error('File too large', file.name + ' exceeds the 10 MB limit.'); return; }
        LH.toast.info('Uploading', 'Uploading thumbnail...');
        LH.api.storage.upload(file).then(function (upRes) {
          if (!upRes || !upRes.url || upRes.url === '#') {
            LH.toast.info('Upload noted', 'File uploads need the live backend.');
            return null;
          }
          return LH.api.courses.update(course.id, { thumbnailUrl: upRes.url }).then(function (updated) {
            course = updated;
            refreshThumbPreview();
            LH.toast.success('Thumbnail updated', 'The course cover has been updated.');
          });
        }).catch(function (err) {
          LH.toast.error('Upload failed', (err && err.error) || 'The image could not be uploaded.');
        });
      });
      input.click();
    });
  }

  function refreshThumbPreview() {
    var up = $('#thumb-upload');
    if (!up) return;
    var url = course && course.thumbnailUrl ? fileUrl(course.thumbnailUrl) : null;
    var prev = up.querySelector('[data-thumb-preview]');
    if (url) {
      if (!prev) {
        prev = document.createElement('img');
        prev.setAttribute('data-thumb-preview', '1');
        prev.style.cssText = 'max-width:100%;border-radius:8px;margin-bottom:8px;display:block;';
        up.insertBefore(prev, up.firstChild);
      }
      prev.src = url;
    } else if (prev) {
      prev.remove();
    }
  }

  function fileUrl(path) {
    if (!path) return null;
    if (/^https?:\/\//.test(path)) return path;
    var base = LH.API_BASE.replace(/\/api$/, '');
    var t = '';
    try { t = localStorage.getItem('learnhub-token') || ''; } catch (e) { /* ignore */ }
    return base + path + (t ? '?token=' + encodeURIComponent(t) : '');
  }

  async function renderEditorRoster() {
    var tbody = $('#editor-roster-body');
    if (!tbody || !course) return;
    var roster = await LH.api.courses.roster(course.id).catch(function () { return []; });
    var prog = {};
    try {
      (await LH.api.courses.studentProgress(course.id)).forEach(function (r) { prog[r.studentId] = r; });
    } catch (e) { /* ignore */ }
    await Promise.all(roster.map(function (r) {
      return LH.api.users.get(r.studentId).catch(function () { return null; }).then(function (u) {
        if (u && u.program) r.program = u.program;
      });
    }));
    if (!roster.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="padding:24px;text-align:center;color:var(--color-text-muted);font-size:13px;">No students enrolled yet.</td></tr>';
      return;
    }
    tbody.innerHTML = roster.map(function (r) {
      var p = prog[r.studentId] || {};
      var att = p.attendancePct != null ? p.attendancePct + '%' : '—';
      var avg = p.avgScore != null ? Math.round(p.avgScore) + '%' : '—';
      return '<tr><td><div class="avatar-cell">' + UI.avatar(r.name, 'sm') + F.esc(r.name) + '</div></td>' +
        '<td>' + F.esc(r.program || '') + '</td><td>' + att + '</td><td>' + avg + '</td>' +
        '<td><button class="btn btn-sm btn-ghost" data-view-student="' + r.studentId + '">View</button></td></tr>';
    }).join('');
    tbody.querySelectorAll('[data-view-student]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var sid = btn.getAttribute('data-view-student');
        LH.api.users.get(sid).then(function (u) {
          if (!u) return;
          LH.modal.alert(
            'Name: ' + u.name + '\nEmail: ' + u.email + '\nProgram: ' + (u.program || '—') + '\nStatus: ' + (u.status || '—'),
            { title: 'Student details' });
        });
      });
    });
  }

  async function init() {
    /* Resolve AFTER shell auth (never snapshot at load) and from the same
       source the form edits (API in both modes, not the raw mock cache). */
    user = LH.shell.getUser() || {};
    courseId = LH.app.param('id');
    course = courseId
      ? await LH.api.courses.get(courseId).catch(function () { return null; })
      : null;

    if (courseId && !course) {
      var main = $('#main');
      if (main) main.innerHTML = UI.emptyState('courses', 'Course not found', 'This course may have been removed or you do not have access.');
      return;
    }

    if (course && !(await LH.api.courses.ownedBy(course.id, user))) {
      var main2 = $('#main');
      if (main2) main2.innerHTML = UI.emptyState('lock', 'Access denied', 'You can only edit courses you teach.');
      return;
    }

    initTabs();
    initUpload();
    fillDetails(course || {});
    await renderModules();
    renderEditorRoster();

    var saveBtn = $('#save-course');
    if (saveBtn) saveBtn.textContent = course ? 'Publish changes' : 'Create course';

    var addOutcome = $('#add-outcome');
    if (addOutcome) addOutcome.addEventListener('click', function () {
      var current = [];
      document.querySelectorAll('#ce-outcomes [data-outcome]').forEach(function (input) {
        current.push(input.value);
      });
      current.push('');
      renderOutcomes(current);
    });

    $('#add-module').addEventListener('click', function () {
      if (!course) { LH.toast.info('Save first', 'Save the course details first, then add modules.'); return; }
      LH.api.modules.create(course.id, 'New module').then(function () {
        renderModules();
        LH.toast.success('Module created', 'A new module was added to the course.');
      }).catch(function (err) {
        LH.toast.error('Add failed', (err && err.error) || 'The module could not be added.');
      });
    });

    saveBtn.addEventListener('click', function () {
      var d = collectDetails();
      if (!d.name) { LH.toast.error('Missing name', 'Give the course a name before saving.'); return; }
      if (!d.code) { LH.toast.error('Missing code', 'Give the course a code (e.g. CS 201).'); return; }

      if (course) {
        LH.api.courses.update(course.id, {
          name: d.name, code: d.code, credits: parseInt(d.credits, 10) || 3,
          instructorName: d.instructor,
          description: d.description, status: d.status, outcomes: d.outcomes
        }).then(function () {
          LH.toast.success('Course updated', 'Your changes have been published to students.');
        }).catch(function (err) {
          LH.toast.error('Save failed', (err && err.error) || 'Your changes could not be saved.');
        });
      } else {
        LH.api.courses.create({
          name: d.name, code: d.code, credits: parseInt(d.credits, 10) || 3,
          instructor: d.instructor, instructorId: user.id,
          description: d.description, status: d.status, outcomes: d.outcomes
        }).then(function (created) {
          LH.toast.success('Course created', 'The course is ready for modules.');
          window.location.href = 'course-editor.html?id=' + created.id;
        }).catch(function (err) {
          LH.toast.error('Create failed', (err && err.error) || 'The course could not be created.');
        });
      }
    });
  }

  LH.app.register('faculty-course-editor', init);
  LH.app.init('faculty-course-editor');
})(window.LH);