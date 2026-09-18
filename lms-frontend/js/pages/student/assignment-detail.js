(function (LH) {
  'use strict';

  var $ = LH.dom.$, F = LH.format, D = LH.date, UI = LH.ui, I = LH.icons, DB = LH.db;

  var assignment = null;
  var uploaded = [];

  function uid() {
    var u = LH.shell.getUser();
    return u ? u.id : 201;
  }

  function ownStatus() {
    var sub = DB.submissions.forStudent(uid(), assignment.id)[0];
    if (sub && (sub.gradedAt || sub.status === 'graded')) return { status: 'graded', sub: sub };
    if (sub) return { status: 'submitted', sub: sub };
    if (D.isOverdue(assignment.due)) return { status: 'overdue', sub: null };
    return { status: 'not-started', sub: null };
  }

  function fileLabel(file) {
    var type = file.type || (file.name ? file.name.split('.').pop() : 'pdf');
    var cls = type === 'pdf' ? 'pdf' : type === 'mp4' || type === 'webm' ? 'video' : type === 'png' || type === 'jpg' ? 'image' : 'document';
    return '<div class="uploaded-file-icon ' + cls + '">' + I.fileIcon(type === 'pdf' ? 'pdf' : file.type || 'pdf') + '</div>';
  }

  function renderStatus(st) {
    return UI.statusBadge(st.status);
  }

  function renderSubmission(st) {
    if (!DB.enrollments.isEnrolled(uid(), assignment.courseId)) {
      return '<div class="card" style="margin-bottom:24px;">' +
        '<div class="card-body" style="display:flex;gap:16px;align-items:flex-start;">' +
          '<div class="activity-icon warning">' + I.icon('lock') + '</div>' +
          '<div><div style="font-weight:600;color:var(--color-text-primary);">Enrollment required</div>' +
          '<div style="font-size:13px;color:var(--color-text-tertiary);margin-top:4px;">You must be enrolled in this course to submit work.</div></div>' +
        '</div></div>';
    }

    if (st.status === 'graded') {
      var sub = st.sub;
      var p = Math.round(sub.score / assignment.maxMarks * 100);
      return '<div class="card" style="margin-bottom:24px;">' +
        '<div class="card-header"><h2 class="card-title">Submission result</h2></div>' +
        '<div class="card-body" style="display:flex;align-items:center;gap:24px;flex-wrap:wrap;">' +
          '<div><div style="font-size:34px;font-weight:700;color:var(--color-success);">' + p + '%</div><div class="text-xs text-tertiary">Percentage</div></div>' +
          '<div><div style="font-size:22px;font-weight:700;color:var(--color-text-primary);">' + sub.score + ' / ' + assignment.maxMarks + '</div><div class="text-xs text-tertiary">Marks awarded</div></div>' +
          '<div><div style="font-size:22px;font-weight:700;color:var(--color-primary);">' + F.gradeLetter(p) + '</div><div class="text-xs text-tertiary">Grade</div></div>' +
          '<div style="margin-left:auto;">' + UI.badge('Graded on ' + D.format(sub.gradedAt), 'success') + '</div>' +
        '</div>' +
        (sub.feedback ? '<div class="card-body" style="padding-top:0;">' +
          '<div style="font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted);margin-bottom:6px;">Feedback</div>' +
          '<p style="font-size:14px;color:var(--color-text-secondary);line-height:1.6;">' + F.esc(sub.feedback) + '</p>' +
        '</div>' : '') +
      '</div>';
    }

    if (st.status === 'overdue') {
      return '<div class="card" style="margin-bottom:24px;border-color:var(--color-danger);">' +
        '<div class="card-body" style="display:flex;gap:16px;align-items:flex-start;">' +
          '<div class="activity-icon danger">' + I.icon('alert') + '</div>' +
          '<div><div style="font-weight:600;color:var(--color-text-primary);">Submission closed</div>' +
          '<div style="font-size:13px;color:var(--color-text-tertiary);margin-top:4px;">This assignment closed on ' + D.format(assignment.due) + '. Contact your instructor to request a late extension.</div></div>' +
        '</div></div>';
    }

    var hasPrev = !!st.sub;
    var done = uploaded.length > 0;

    return '<div class="card" style="margin-bottom:24px;">' +
      '<div class="card-header"><h2 class="card-title">Your submission</h2>' +
      '<p class="card-subtitle">' + (hasPrev ? 'Previously submitted — you can resubmit before the deadline' : 'Upload your work below') + '</p></div>' +
      '<div class="card-body">' +
        (hasPrev ? '<div class="activity-item" style="margin-bottom:16px;align-items:center;">' +
          '<div class="activity-icon info">' + I.icon('file') + '</div>' +
          '<div class="activity-content"><div class="activity-title">' + F.esc(st.sub.content || 'Previous submission') + '</div>' +
          '<div class="activity-meta">Submitted ' + D.format(st.sub.submittedAt) + '</div></div></div>' : '') +
        '<div class="file-upload" id="file-upload" role="button" tabindex="0" aria-label="Upload PDF">' +
          '<div class="file-upload-icon">' + I.icon('upload', 44) + '</div>' +
          '<div class="file-upload-text">Drag &amp; drop your file here, or click to browse</div>' +
          '<div class="file-upload-hint">PDF, DOCX or images up to 10 MB</div>' +
          '<input type="file" class="file-upload-input" id="file-input" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" aria-hidden="true">' +
        '</div>' +
        '<div class="uploaded-files" id="uploaded-files"></div>' +
        '<div style="display:flex;gap:12px;margin-top:20px;flex-wrap:wrap;">' +
          '<button class="btn btn-primary" id="submit-assignment" disabled>' + I.icon('send', 15) + ' ' + (hasPrev ? 'Resubmit' : 'Submit assignment') + '</button>' +
          '<button class="btn btn-secondary" id="clear-upload" disabled>Clear</button>' +
          '<span style="display:flex;align-items:center;font-size:12px;color:var(--color-text-muted);margin-left:auto;">Max file size 10 MB</span>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function renderUploaded() {
    var el = $('#uploaded-files');
    var submitBtn = $('#submit-assignment');
    var clearBtn = $('#clear-upload');
    if (!el) return;
    if (!uploaded.length) {
      el.innerHTML = '';
      if (submitBtn) submitBtn.disabled = true;
      if (clearBtn) clearBtn.disabled = true;
      return;
    }
    el.innerHTML = uploaded.map(function (f, i) {
      return '<div class="uploaded-file">' + fileLabel(f) +
        '<div class="uploaded-file-info"><div class="uploaded-file-name">' + F.esc(f.name) + '</div>' +
        '<div class="uploaded-file-size">' + F.fileSize(f.size || 0) + '</div></div>' +
        '<button class="uploaded-file-remove" data-remove-file="' + i + '" aria-label="Remove ' + F.esc(f.name) + '">' + I.icon('trash', 16) + '</button></div>';
    }).join('');

    el.querySelectorAll('[data-remove-file]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        uploaded.splice(Number(btn.getAttribute('data-remove-file')), 1);
        renderUploaded();
      });
    });
    submitBtn.disabled = false;
    clearBtn.disabled = false;
  }

  function submitAssignment() {
    if (!uploaded.length) return;
    var names = uploaded.map(function (f) { return f.name; }).join(', ');
    var res = DB.submit(uid(), assignment.id, 'Submitted file: ' + names);
    if (!res.ok) {
      LH.toast.error('Submission failed', res.error || 'Could not submit. Please try again.');
      return;
    }
    LH.toast.success('Submission received', names + ' submitted successfully.');
    requestAnimationFrame(function () { render(); });
  }

  function render() {
    var el = $('#assignment-detail');
    if (!el) return;

    if (!assignment) {
      el.innerHTML = UI.emptyState('assignments', 'Assignment not found', 'This assignment may have been removed.');
      return;
    }

    var st = ownStatus();

    el.innerHTML =
      '<a class="btn btn-sm btn-ghost" href="assignments.html" style="margin-bottom:16px;">' + I.icon('arrowLeft', 15) + ' Back to assignments</a>' +
      '<div class="page-header" style="margin-bottom:var(--spacing-6);">' +
        '<div class="page-title-section"><h1 style="font-size:22px;">' + F.esc(assignment.title) + '</h1>' +
        '<p>' + F.esc(assignment.course) + ' &middot; ' + D.format(assignment.due) + '</p></div>' +
        '<div class="page-actions">' + renderStatus(st) + '</div>' +
      '</div>' +
      '<div class="dash-col">' +
        '<div class="stack">' +
          '<section class="card"><div class="card-header"><h2 class="card-title">Description</h2></div>' +
          '<div class="card-body" style="font-size:14px;color:var(--color-text-secondary);line-height:1.7;">' + F.esc(assignment.description) + '</div></section>' +
          '<section class="card"><div class="card-header"><h2 class="card-title">Instructions</h2></div>' +
          '<div class="card-body">' +
            '<ol style="list-style:decimal;padding-left:20px;display:grid;gap:10px;font-size:14px;color:var(--color-text-secondary);">' +
              '<li>Write your solution as a single file with clear comments.</li>' +
              '<li>Name the file with your roll number: <code style="background:var(--color-bg-tertiary);padding:2px 6px;border-radius:4px;font-size:12px;">roll_no_assign' + String(assignment.id).replace('a', '') + '.pdf</code></li>' +
              '<li>Upload your PDF before the deadline. Late submissions are penalised.</li>' +
            '</ol>' +
          '</div></section>' +
          renderSubmission(st) +
        '</div>' +
        '<div class="stack">' +
          '<section class="card"><div class="card-header"><h2 class="card-title">Details</h2></div>' +
          '<div class="card-body" style="font-size:14px;">' +
            '<div class="flex justify-between" style="padding:8px 0;border-bottom:1px solid var(--color-border-light);"><span class="text-tertiary">Course</span><span style="font-weight:500;">' + F.esc(assignment.course) + '</span></div>' +
            '<div class="flex justify-between" style="padding:8px 0;border-bottom:1px solid var(--color-border-light);"><span class="text-tertiary">Due date</span><span style="font-weight:500;">' + D.format(assignment.due) + '</span></div>' +
            '<div class="flex justify-between" style="padding:8px 0;border-bottom:1px solid var(--color-border-light);"><span class="text-tertiary">Maximum marks</span><span style="font-weight:500;">' + assignment.maxMarks + '</span></div>' +
            '<div class="flex justify-between" style="padding:8px 0;border-bottom:1px solid var(--color-border-light);"><span class="text-tertiary">Status</span>' + renderStatus(st) + '</div>' +
            '<div class="flex justify-between" style="padding:8px 0;"><span class="text-tertiary">Time remaining</span>' +
              '<span style="font-weight:500;' + (st.status === 'overdue' ? 'color:var(--color-danger);' : 'color:var(--color-success);') + '">' + (st.status === 'graded' ? 'Completed' : st.status === 'overdue' ? 'Overdue' : D.dueLabel(assignment.due)) + '</span></div>' +
          '</div></section>' +
          '<section class="card"><div class="card-header"><h2 class="card-title">Attachments</h2></div>' +
          '<div class="card-body" style="padding-top:var(--spacing-4);padding-bottom:var(--spacing-4);">' +
            (assignment.attachments && assignment.attachments.length
              ? assignment.attachments.map(function (f) {
                  return '<div class="uploaded-file" style="margin-bottom:8px;">' + fileLabel(f) +
                    '<div class="uploaded-file-info"><div class="uploaded-file-name">' + F.esc(f.name) + '</div>' +
                    '<div class="uploaded-file-size">' + F.fileSize(f.size) + '</div></div>' +
                    '<button class="btn btn-sm btn-ghost" data-download-attr>' + I.icon('download', 15) + '</button></div>';
                }).join('')
              : UI.emptyState('file', 'No attachments', 'This assignment has no attached files.')) +
          '</div></section>' +
        '</div>' +
      '</div>';

    /* Wire the upload interaction */
    var drop = $('#file-upload');
    var input = $('#file-input');
    if (drop && input) {
      drop.addEventListener('click', function () { input.click(); });
      drop.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); }
      });
      input.addEventListener('change', function () {
        pushFiles(input.files);
        input.value = '';
      });
      ['dragover', 'dragenter'].forEach(function (ev) {
        drop.addEventListener(ev, function (e) {
          e.preventDefault();
          drop.classList.add('drag-active');
        });
      });
      ['dragleave', 'drop'].forEach(function (ev) {
        drop.addEventListener(ev, function (e) {
          e.preventDefault();
          drop.classList.remove('drag-active');
        });
      });
      drop.addEventListener('drop', function (e) {
        pushFiles(e.dataTransfer.files);
      });
    }

    var submitBtn = $('#submit-assignment');
    if (submitBtn) submitBtn.addEventListener('click', submitAssignment);

    var clearBtn = $('#clear-upload');
    if (clearBtn) clearBtn.addEventListener('click', function () {
      uploaded = [];
      renderUploaded();
    });

    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-download-attr]')) {
        LH.toast.info('Download started', 'Attachment will download once demo files are attached.');
      }
    });

    renderUploaded();
  }

  function pushFiles(files) {
    Array.prototype.forEach.call(files, function (f) {
      if (uploaded.length >= 3) {
        LH.toast.warning('Limit reached', 'You can attach up to 3 files.');
        return;
      }
      if (f.size > 10 * 1024 * 1024) {
        LH.toast.error('File too large', f.name + ' exceeds the 10 MB limit.');
        return;
      }
      uploaded.push(f);
    });
    renderUploaded();
  }

  function init() {
    var id = LH.app.param('id');
    var list = DB.list('assignments');
    assignment = DB.get('assignments', id) || list[0] || null;
    render();
  }

  LH.app.register('student-assignments', init);
  LH.app.init('student-assignments');
})(window.LH);