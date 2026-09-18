(function (LH) {
  'use strict';

  var $ = LH.dom.$, F = LH.format, UI = LH.ui, I = LH.icons;
  var M = LH.mock;
  var DB = LH.db;

  var user = LH.shell.getUser() || {};
  var courseId = LH.app.param('id');
  var course = courseId ? DB.get('courses', courseId) : null;

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

  function renderModules() {
    var el = $('#modules-editor');
    if (!el) return;

    if (!course) {
      el.innerHTML = UI.emptyState('courses', 'Create the course first', 'Save the course details once, then come back to add modules and materials.');
      return;
    }

    var mods = DB.modules.forCourse(course.id);
    var total = mods.length;
    if (!mods.length) {
      el.innerHTML = UI.emptyState('courses', 'No modules yet', 'Add your first module to get started.');
      return;
    }

    el.innerHTML = mods.map(function (mod, mi) {
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
          (DB.lessons.forModule(mod.id).map(function (l) { return lessonRow(l); }).join('') || '<p style="font-size:13px;color:var(--color-text-muted);">No materials yet.</p>') +
        '</div>' +
      '</section>';
    }).join('');

    wireModuleEvents();
  }

  function wireModuleEvents() {
    document.querySelectorAll('[data-module-title]').forEach(function (input) {
      input.addEventListener('change', function () {
        var id = input.getAttribute('data-module-title');
        if (input.value.trim()) DB.modules.update(id, { title: input.value.trim() });
      });
    });

    document.querySelectorAll('[data-remove-module]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-remove-module');
        var mod = DB.get('modules', id);
        if (!mod) return;
        LH.modal.confirm('Delete the module "' + mod.title + '" and all its materials? This cannot be undone.', {
          title: 'Delete module',
          onConfirm: function () {
            DB.modules.remove(id);
            renderModules();
            LH.toast.success('Module deleted', 'The module was removed from the course.');
          }
        });
      });
    });

    document.querySelectorAll('[data-add-lesson]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var modId = btn.getAttribute('data-add-lesson');
        var mod = DB.get('modules', modId);
        var count = DB.lessons.forModule(modId).length;
        DB.lessons.create(modId, { title: 'Lecture slides (Week ' + (count + 1) + ')', type: 'pdf', meta: 'Lecture notes', size: '128 KB' });
        renderModules();
        LH.toast.success('Material added', 'New material added to ' + mod.title + '.');
      });
    });

    document.querySelectorAll('[data-remove-lesson]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-remove-lesson');
        DB.lessons.remove(id);
        renderModules();
        LH.toast.info('Material removed', 'The file was removed from the module.');
      });
    });

    document.querySelectorAll('[data-move]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var parts = btn.getAttribute('data-move').split(':');
        var modId = parts[0];
        var dir = parts[1];
        var mods = DB.modules.forCourse(course.id);
        var idx = mods.map(function (m) { return m.id; }).indexOf(modId);
        var swap = dir === 'up' ? idx - 1 : idx + 1;
        if (idx === -1 || swap < 0 || swap >= mods.length) return;
        var ordered = mods.map(function (m) { return m.id; });
        ordered[idx] = mods[swap].id;
        ordered[swap] = modId;
        DB.modules.reorder(course.id, ordered);
        renderModules();
      });
    });
  }

  function collectDetails() {
    var status = 'published';
    document.querySelectorAll('input[name="vis"]').forEach(function (r) {
      if (r.checked && r.value === 'draft') status = 'draft';
    });
    return {
      name: $('#ce-name').value.trim(),
      code: $('#ce-code').value.trim(),
      credits: $('#ce-credits').value,
      instructor: $('#ce-instructor').value.trim(),
      description: $('#ce-desc').value.trim(),
      status: status
    };
  }

  function fillDetails(c) {
    if (!$('#ce-name')) return;
    $('#ce-name').value = c.name || '';
    $('#ce-code').value = c.code || '';
    $('#ce-credits').value = String(c.credits || '3');
    $('#ce-instructor').value = c.instructor || (user.name || '');
    $('#ce-desc').value = c.description || '';
    var status = c.status && c.status !== 'published' ? 'draft' : 'published';
    document.querySelectorAll('input[name="vis"]').forEach(function (r) {
      r.checked = (r.value === status);
    });
  }

  function initUpload() {
    var up = $('#thumb-upload');
    if (!up) return;
    up.innerHTML = up.innerHTML.replace('UPLOAD_ICON', I.icon('image', 26));
    up.addEventListener('click', function () { LH.toast.info('Upload', 'Image upload is simulated in this demo — the thumbnail will stay as-is.'); });
  }

  function init() {
    if (courseId && !course) {
      var main = $('#main');
      if (main) main.innerHTML = UI.emptyState('courses', 'Course not found', 'This course may have been removed or you do not have access.');
      return;
    }

    if (course && !DB.courses.ownedBy(course.id, user)) {
      var main2 = $('#main');
      if (main2) main2.innerHTML = UI.emptyState('lock', 'Access denied', 'You can only edit courses you teach.');
      return;
    }

    initTabs();
    initUpload();
    fillDetails(course || {});
    renderModules();

    var saveBtn = $('#save-course');
    if (saveBtn) saveBtn.textContent = course ? 'Publish changes' : 'Create course';

    $('#add-module').addEventListener('click', function () {
      if (!course) { LH.toast.info('Save first', 'Save the course details first, then add modules.'); return; }
      DB.modules.create(course.id, 'New module');
      renderModules();
      LH.toast.success('Module created', 'A new module was added to the course.');
    });

    saveBtn.addEventListener('click', function () {
      var d = collectDetails();
      if (!d.name) { LH.toast.error('Missing name', 'Give the course a name before saving.'); return; }
      if (!d.code) { LH.toast.error('Missing code', 'Give the course a code (e.g. CS 201).'); return; }

      if (course) {
        DB.updateCourse(course.id, {
          name: d.name, short: d.name, title: d.name, code: d.code, credits: parseInt(d.credits, 10) || 3,
          instructor: d.instructor, description: d.description, status: d.status, updated: 'just now'
        });
        LH.toast.success('Course updated', 'Your changes have been published to students.');
      } else {
        var created = DB.createCourse({
          name: d.name, code: d.code, credits: parseInt(d.credits, 10) || 3,
          instructor: d.instructor, instructorId: user.id, description: d.description, status: d.status, accent: 'blue'
        });
        LH.toast.success('Course created', 'The course is ready for modules.');
        window.location.href = 'course-editor.html?id=' + created.id;
      }
    });
  }

  LH.app.register('faculty-course-editor', init);
  LH.app.init('faculty-course-editor');
})(window.LH);