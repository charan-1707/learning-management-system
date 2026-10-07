(function (LH) {
  'use strict';

  var $ = LH.dom.$, F = LH.format, D = LH.date, UI = LH.ui, I = LH.icons;
  var M = LH.mock;

  function facultyId() {
    var u = LH.shell.getUser();
    return u ? u.id : 101;
  }

  async function taught() {
    var list = await LH.api.courses.byInstructorId(facultyId());
    if (!list || !list.length) list = await LH.api.courses.byInstructor('Dr. Priya Sharma');
    return list;
  }

  async function taughtIds() {
    return (await taught()).map(function (c) { return c.id; });
  }

  async function coursesTaught() {
    return taught();
  }

  async function renderList() {
    var el = $('#assignment-faculty-list');
    if (!el) return;

    var ids = await taughtIds();
    var lists = await Promise.all(ids.map(function (cid) {
      return LH.api.assignments.forCourse(cid).catch(function () { return []; });
    }));
    var list = lists.reduce(function (acc, l) { return acc.concat(l); }, [])
      .sort(function (a, b) { return new Date(a.due) - new Date(b.due); });

    if (!list.length) {
      el.innerHTML = UI.emptyState('assignments', 'No assignments yet', 'Create your first assignment to get started.');
      return;
    }

    el.innerHTML = list.map(function (a) {
      var status = D.isOverdue(a.due) ? UI.badge('Overdue', 'danger') : (a.graded ? UI.badge('Closed', 'neutral') : '');
      return '<section class="card">' +
        '<div class="card-body" style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">' +
          '<div class="activity-icon primary">' + I.icon('assignments') + '</div>' +
          '<div style="flex:1;min-width:180px;">' +
            '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><span style="font-size:15px;font-weight:600;color:var(--color-text-primary);">' + F.esc(a.title) + '</span>' + status + '</div>' +
            '<div style="font-size:13px;color:var(--color-text-muted);margin-top:3px;">' + F.esc(a.course) + ' &middot; ' + (a.maxMarks || a.points || 0) + ' points &middot; due ' + D.format(a.due) + '</div>' +
          '</div>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
            '<a class="btn btn-sm btn-secondary" href="submissions.html">Submissions</a>' +
            '<button class="btn btn-sm btn-secondary" data-view="' + a.id + '">View</button>' +
            '<button class="btn btn-sm btn-ghost" data-delete="' + a.id + '">' + I.icon('trash', 14) + '</button>' +
          '</div>' +
        '</div>' +
      '</section>';
    }).join('');

    el.querySelectorAll('[data-view]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openView(btn.getAttribute('data-view'));
      });
    });

    el.querySelectorAll('[data-delete]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-delete');
        LH.api.assignments.get(id).catch(function () { return null; }).then(function (item) {
          if (!item) return;
          LH.modal.confirm('Delete "' + item.title + '"? Submissions attached to it will be removed. This cannot be undone.', {
            title: 'Delete assignment',
          onConfirm: function () {
            LH.api.assignments.remove(id).then(function () {
              renderList();
              LH.toast.success('Assignment deleted', 'The assignment was removed.');
            }).catch(function (err) {
              LH.toast.error('Delete failed', (err && err.error) || 'The assignment could not be removed.');
            });
          }
          });
        });
      });
    });
  }

  function renderAttachments(attachments, container) {
    if (!attachments || !attachments.length) {
      container.innerHTML = '<p class="form-hint" style="font-size:12px;">No attachments yet.</p>';
      return;
    }
    container.innerHTML = attachments.map(function (att, idx) {
      return '<div class="attachment-item" style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:var(--color-surface);border-radius:6px;margin-bottom:6px;">' +
        I.icon('file', 16) +
        '<span style="flex:1;font-size:13px;">' + F.esc(att.name) + ' (' + F.bytes(att.size) + ')</span>' +
        '<button class="btn btn-sm btn-ghost" data-attach-download="' + idx + '" title="Download">' + I.icon('download', 14) + '</button>' +
        '<button class="btn btn-sm btn-ghost" data-attach-remove="' + idx + '" title="Remove" style="color:var(--color-danger);">' + I.icon('trash', 14) + '</button>' +
      '</div>';
    }).join('');
  }

  function openView(id) {
    LH.api.assignments.get(id).catch(function () { return null; }).then(function (a) {
      if (!a) { LH.toast.error('Not found', 'This assignment may have been removed.'); return; }
      var modal = LH.modal.open(
        '<p style="font-size:13px;color:var(--color-text-tertiary);margin-bottom:18px;">' +
          F.esc(a.course || '') + ' &middot; ' + D.format(a.due) + ' &middot; ' + (a.maxMarks || 20) + ' points</p>' +
        '<div class="form-group" style="margin-bottom:18px;"><label class="form-label" for="av-title">Title</label>' +
          '<input class="form-input" id="av-title" value="' + F.esc(a.title) + '"></div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:6px;">' +
          '<div class="form-group"><label class="form-label" for="av-due">Due date</label>' +
            '<input class="form-input" id="av-due" type="date" value="' + (a.due ? D.toInput(new Date(a.due)) : '') + '"></div>' +
          '<div class="form-group"><label class="form-label" for="av-time">Due time</label>' +
            '<input class="form-input" id="av-time" type="time" value="' + (a.due ? D.toTimeInput(new Date(a.due)) : '23:59') + '"></div>' +
        '</div>' +
        '<div class="form-group"><label class="form-label" for="av-points">Points</label>' +
          '<input class="form-input" id="av-points" type="number" min="1" max="200" value="' + (a.maxMarks || 20) + '"></div>' +
        '<div class="form-group"><label class="form-label" for="av-desc">Description</label>' +
          '<textarea class="form-input form-textarea" id="av-desc" rows="6">' + F.esc(a.description || '') + '</textarea></div>' +
        '<div class="form-group"><label class="form-label">Attachments</label>' +
          '<div id="av-attachments" style="margin-top:8px;"></div>' +
          '<input class="form-input" id="av-attach-file" type="file" multiple style="margin-top:8px;" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt,.md,.png,.jpg,.jpeg,.gif">' +
          '<p class="form-hint" style="margin-top:6px;">Add files students can download. Max 10MB each.</p></div>' +
        '<div class="form-error" data-av-error style="display:none;"></div>' +
        '<div class="modal-footer" style="display:flex;justify-content:flex-end;gap:10px;padding:20px 0 0;">' +
          '<button class="btn btn-secondary" data-av-cancel>Cancel</button>' +
          '<button class="btn btn-primary" data-av-save>Save changes</button>' +
        '</div>',
        { title: 'Assignment details', width: '700px' });
      var overlay = modal.overlay;
      var currentAttachments = (a.attachments || []).slice();
      var attachContainer = overlay.querySelector('#av-attachments');
      renderAttachments(currentAttachments, attachContainer);

      overlay.querySelector('#av-attach-file').addEventListener('change', function (e) {
        var files = Array.from(e.target.files);
        if (!files.length) return;
        files.forEach(function (f) {
          if (f.size > 10 * 1024 * 1024) {
            LH.toast.error('File too large', f.name + ' exceeds 10MB limit.');
            return;
          }
          currentAttachments.push({ name: f.name, size: f.size, mime: f.type || 'application/octet-stream', url: '' });
        });
        renderAttachments(currentAttachments, attachContainer);
        e.target.value = '';
      });

      attachContainer.addEventListener('click', function (e) {
        var dl = e.target.closest('[data-attach-download]');
        var rm = e.target.closest('[data-attach-remove]');
        if (dl) {
          var idx = parseInt(dl.getAttribute('data-attach-download'), 10);
          var att = currentAttachments[idx];
          if (att && att.url) window.open(att.url, '_blank');
        } else if (rm) {
          var idx2 = parseInt(rm.getAttribute('data-attach-remove'), 10);
          currentAttachments.splice(idx2, 1);
          renderAttachments(currentAttachments, attachContainer);
        }
      });

      overlay.querySelector('[data-av-cancel]').addEventListener('click', function () { LH.modal.close(); });
      overlay.querySelector('[data-av-save]').addEventListener('click', function () {
        var title = overlay.querySelector('#av-title').value.trim();
        if (!title) {
          var err = overlay.querySelector('[data-av-error]');
          if (err) { err.textContent = 'Give the assignment a title.'; err.style.display = 'block'; }
          return;
        }
        var dueRaw = overlay.querySelector('#av-due').value;
        var timeRaw = overlay.querySelector('#av-time').value || '23:59';
        var dueDate = dueRaw ? new Date(dueRaw + 'T' + timeRaw + ':00') : null;
        LH.api.assignments.update(id, {
          title: title,
          due: dueDate,
          maxMarks: parseInt(overlay.querySelector('#av-points').value, 10) || 20,
          description: overlay.querySelector('#av-desc').value,
          attachments: currentAttachments.map(function (att) { return { name: att.name, size: att.size, mime: att.mime, url: att.url }; })
        }).then(function () {
          LH.modal.close();
          renderList();
          LH.toast.success('Assignment updated', 'Your changes have been saved.');
        }).catch(function (e) {
          var err2 = overlay.querySelector('[data-av-error]');
          var msg = (e && e.error) || 'Your changes could not be saved.';
          if (err2) { err2.textContent = msg; err2.style.display = 'block'; }
          else LH.toast.error('Save failed', msg);
        });
      });
    });
  }

  async function showSheet() {
    var host = $('#assignment-sheet');
    var opts = '<option value="">Select course</option>' + (await coursesTaught()).map(function (c) { return '<option value="' + c.id + '">' + F.esc(c.name) + '</option>'; }).join('');

    host.hidden = false;
    host.innerHTML =
      '<section class="card" style="margin-bottom:var(--spacing-6);">' +
        '<div class="card-header"><h2 class="card-title">New assignment</h2><p class="card-subtitle">Publish an assignment to one of your courses</p></div>' +
        '<div class="card-body">' +
          '<form id="assignment-form" novalidate>' +
            '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;">' +
              '<div class="form-group" style="grid-column:1 / -1;"><label class="form-label" for="fa-title">Title</label>' +
                '<input class="form-input" id="fa-title" name="title" placeholder="e.g. Sorting Algorithms Worksheet">' +
                '<div class="form-error" data-error-for="title"></div></div>' +
              '<div class="form-group"><label class="form-label" for="fa-course">Course</label>' +
                '<select class="form-input form-select" id="fa-course" name="course">' + opts + '</select></div>' +
              '<div class="form-group"><label class="form-label" for="fa-due">Due date</label>' +
                '<input class="form-input" id="fa-due" name="due" type="date" value="' + D.toInput(D.relativeDays(7)) + '"></div>' +
              '<div class="form-group"><label class="form-label" for="fa-time">Due time</label>' +
                '<input class="form-input" id="fa-time" name="time" type="time" value="23:59"></div>' +
              '<div class="form-group"><label class="form-label" for="fa-points">Points</label>' +
                '<input class="form-input" id="fa-points" name="points" type="number" min="1" max="200" value="20"></div>' +
              '<div class="form-group" style="grid-column:1 / -1;"><label class="form-label" for="fa-desc">Description</label>' +
                '<textarea class="form-input form-textarea" id="fa-desc" name="desc" rows="4" placeholder="Describe the task, expectations and submission format..."></textarea></div>' +
              '<div class="form-group" style="grid-column:1 / -1;"><label class="form-label">Attachments</label>' +
                '<div id="fa-attachments" style="margin-top:8px;"></div>' +
                '<input class="form-input" id="fa-attach-file" type="file" multiple style="margin-top:8px;" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt,.md,.png,.jpg,.jpeg,.gif">' +
                '<p class="form-hint" style="margin-top:6px;">Add files students can download. Max 10MB each.</p></div>' +
            '</div>' +
            '<div style="display:flex;gap:10px;margin-top:6px;">' +
              '<button class="btn btn-primary" type="submit" id="fa-submit">' + I.icon('check', 15) + ' Publish</button>' +
              '<button class="btn btn-secondary" type="button" id="fa-cancel">Cancel</button>' +
            '</div>' +
          '</form>' +
        '</div>' +
      '</section>';

    host.scrollIntoView({ behavior: 'smooth', block: 'start' });

    var newAttachments = [];
    var attachContainer = host.querySelector('#fa-attachments');
    function renderNewAttachments() {
      if (!newAttachments.length) {
        attachContainer.innerHTML = '<p class="form-hint" style="font-size:12px;">No attachments yet.</p>';
        return;
      }
      attachContainer.innerHTML = newAttachments.map(function (att, idx) {
        return '<div class="attachment-item" style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:var(--color-surface);border-radius:6px;margin-bottom:6px;">' +
          I.icon('file', 16) +
          '<span style="flex:1;font-size:13px;">' + F.esc(att.name) + ' (' + F.bytes(att.size) + ')</span>' +
          '<button class="btn btn-sm btn-ghost" data-attach-remove="' + idx + '" title="Remove" style="color:var(--color-danger);">' + I.icon('trash', 14) + '</button>' +
        '</div>';
      }).join('');
    }
    renderNewAttachments();

    host.querySelector('#fa-attach-file').addEventListener('change', function (e) {
      var files = Array.from(e.target.files);
      if (!files.length) return;
      files.forEach(function (f) {
        if (f.size > 10 * 1024 * 1024) {
          LH.toast.error('File too large', f.name + ' exceeds 10MB limit.');
          return;
        }
        newAttachments.push({ name: f.name, size: f.size, mime: f.type || 'application/octet-stream', url: '' });
      });
      renderNewAttachments();
      e.target.value = '';
    });

    attachContainer.addEventListener('click', function (e) {
      var rm = e.target.closest('[data-attach-remove]');
      if (rm) {
        var idx = parseInt(rm.getAttribute('data-attach-remove'), 10);
        newAttachments.splice(idx, 1);
        renderNewAttachments();
      }
    });

    $('#fa-cancel').addEventListener('click', function () { host.hidden = true; host.innerHTML = ''; });
    $('#assignment-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var res = LH.validation.form(e.target, {
        title: { required: true, message: 'Give the assignment a title' }
      });
      if (!res.valid) return;
      var courseId = $('#fa-course').value;
      if (!courseId) { LH.toast.error('Select a course', 'Choose which course this assignment belongs to.'); return; }
      var dueRaw = $('#fa-due').value;
      var timeRaw = $('#fa-time').value || '23:59';
      var dueDate = dueRaw ? new Date(dueRaw + 'T' + timeRaw + ':00') : null;
      var payload = {
        title: res.values.title,
        courseId: courseId,
        maxScore: parseInt($('#fa-points').value, 10) || 20,
        due: dueDate,
        description: $('#fa-desc').value || '',
        attachments: newAttachments.map(function (att) { return { name: att.name, size: att.size, mime: att.mime, url: att.url }; })
      };
      LH.api.assignments.create(payload).then(function () {
        host.hidden = true;
        host.innerHTML = '';
        renderList();
        LH.toast.success('Assignment published', 'Students can now see "' + F.esc(res.values.title) + '".');
      }).catch(function (err) {
        LH.toast.error('Publish failed', (err && err.error) || 'The assignment could not be published.');
      });
    });
  }

  async function init() {
    await renderList();
    $('#new-assignment').addEventListener('click', showSheet);
  }

  LH.app.register('faculty-assignments', init);
  LH.app.init('faculty-assignments');
})(window.LH);