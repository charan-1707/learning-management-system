(function (LH) {
  'use strict';

  var $ = LH.dom.$, F = LH.format, D = LH.date, UI = LH.ui, I = LH.icons;
  var API = LH.api, DB = LH.db;

  function roleColor(role) {
    return role === 'admin' ? 'warning' : role === 'faculty' ? 'info' : 'primary';
  }

  function render() {
    var tbody = $('#course-body');
    if (!tbody) return;

    var q = ($('#course-search').value || '').toLowerCase();
    var statusF = $('#course-status').value;
    var list = API.admin.courses({ query: q, status: statusF || 'all' });

    $('#course-count').textContent = list.length + ' course' + (list.length === 1 ? '' : 's');

    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="padding:32px;">' + UI.emptyState('courses', 'No courses found', 'Try a different search or filter.') + '</td></tr>';
      return;
    }

    tbody.innerHTML = list.map(function (c) {
      var status = c.status || 'published';
      var statusBadge = UI.statusBadge(status === 'published' ? 'active' : status);
      return '<tr>' +
        '<td><div style="font-weight:600;color:var(--color-text-primary);font-size:13.5px;">' + F.esc(c.name) + '</div></td>' +
        '<td><span class="text-sm">' + F.esc(c.code) + '</span></td>' +
        '<td><div class="avatar-cell">' + UI.avatar(c.instructor, 'sm') + '<span class="text-sm">' + F.esc(c.instructor) + '</span></div></td>' +
        '<td><span class="text-sm">' + (c.students || 0) + '</span></td>' +
        '<td>' + statusBadge + '</td>' +
        '<td><span class="text-sm">' + F.esc(c.category || '') + '</span></td>' +
        '<td>' +
          '<div class="btn-group" role="group">' +
            '<button class="btn btn-sm btn-ghost" data-edit="' + c.id + '" title="Edit">' + I.icon('settings', 14) + '</button>' +
            '<button class="btn btn-sm btn-ghost" data-toggle-status="' + c.id + '" title="Toggle publish/draft">' + I.icon(status === 'published' ? 'lock' : 'check', 14) + '</button>' +
            '<button class="btn btn-sm btn-ghost" data-delete="' + c.id + '" title="Delete" style="color:var(--color-danger);">' + I.icon('trash', 14) + '</button>' +
          '</div>' +
        '</td>' +
      '</tr>';
    }).join('');

    tbody.querySelectorAll('[data-edit]').forEach(function (btn) {
      btn.addEventListener('click', function () { openEditModal(btn.getAttribute('data-edit')); });
    });

    tbody.querySelectorAll('[data-toggle-status]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cid = btn.getAttribute('data-toggle-status');
        var c = DB.get('courses', cid);
        if (!c) return;
        var newStatus = (c.status || 'published') === 'published' ? 'draft' : 'published';
        DB.update('courses', cid, { status: newStatus });
        render();
        LH.toast.success('Course updated', F.esc(c.name) + ' is now ' + newStatus + '.');
      });
    });

    tbody.querySelectorAll('[data-delete]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cid = btn.getAttribute('data-delete');
        var c = DB.get('courses', cid);
        if (!c) return;
        LH.modal.confirm(
          'Delete "' + c.name + '"? This will remove all modules, lessons, assignments, enrollments and submissions for this course. This cannot be undone.',
          {
            title: 'Delete course',
            variant: 'danger',
            confirmText: 'Delete',
            onConfirm: function () {
              DB.deleteCourse(cid);
              render();
              LH.toast.success('Course deleted', F.esc(c.name) + ' has been permanently removed.');
            }
          }
        );
      });
    });
  }

  function openEditModal(courseId) {
    var c = DB.get('courses', courseId);
    if (!c) return;
    var status = c.status || 'published';

    var html =
      '<div style="display:flex;flex-direction:column;gap:16px;">' +
        '<div class="form-group"><label class="form-label">Course name</label>' +
          '<input class="form-input" id="ec-name" value="' + F.esc(c.name) + '"></div>' +
        '<div class="form-group"><label class="form-label">Course code</label>' +
          '<input class="form-input" id="ec-code" value="' + F.esc(c.code) + '"></div>' +
        '<div class="form-group"><label class="form-label">Category</label>' +
          '<input class="form-input" id="ec-category" value="' + F.esc(c.category || '') + '"></div>' +
        '<div class="form-group"><label class="form-label">Description</label>' +
          '<textarea class="form-input form-textarea" id="ec-desc" rows="3">' + F.esc(c.description || '') + '</textarea></div>' +
        '<div class="form-group"><label class="form-label">Status</label>' +
          '<select class="form-input form-select" id="ec-status">' +
            '<option value="published"' + (status === 'published' ? ' selected' : '') + '>Published</option>' +
            '<option value="draft"' + (status === 'draft' ? ' selected' : '') + '>Draft</option>' +
          '</select></div>' +
        '<div class="modal-footer" style="padding:16px 0 0;border-top:1px solid var(--color-border-light);margin:0;">' +
          '<button class="btn btn-secondary" data-ec-cancel>Cancel</button>' +
          '<button class="btn btn-primary" data-ec-save>Save changes</button>' +
        '</div>' +
      '</div>';

    var m = LH.modal.open(html, { title: 'Edit course — ' + F.esc(c.name), width: '520px' });
    var overlay = m.overlay;

    overlay.querySelector('[data-ec-cancel]').addEventListener('click', function () { LH.modal.close(); });

    overlay.querySelector('[data-ec-save]').addEventListener('click', function () {
      var name = overlay.querySelector('#ec-name').value.trim();
      var code = overlay.querySelector('#ec-code').value.trim();
      var category = overlay.querySelector('#ec-category').value.trim();
      var desc = overlay.querySelector('#ec-desc').value.trim();
      var newStatus = overlay.querySelector('#ec-status').value;

      if (!name || !code) {
        LH.toast.warning('Missing fields', 'Course name and code are required.');
        return;
      }

      DB.update('courses', courseId, {
        name: name, code: code, category: category || 'General',
        description: desc, status: newStatus,
        short: name, title: name, updated: 'just now'
      });
      LH.modal.close();
      render();
      LH.toast.success('Course saved', F.esc(name) + ' has been updated.');
    });
  }

  function init() {
    render();
    $('#course-search').addEventListener('input', render);
    $('#course-status').addEventListener('change', render);
  }

  LH.app.register('admin-courses', init);
  LH.app.init('admin-courses');
})(window.LH);
