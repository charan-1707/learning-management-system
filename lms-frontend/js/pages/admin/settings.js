(function (LH) {
  'use strict';

  var $ = LH.dom.$;

  function init() {
    /* Load persisted settings into matching inputs (keys align with input names/ids). */
    LH.api.admin.getSettings().then(function (s) {
      Object.keys(s || {}).forEach(function (k) {
        var v = s[k];
        var str = (v != null && typeof v === 'object') ? JSON.stringify(v) : String(v == null ? '' : v);
        document.querySelectorAll('[name="' + k + '"], #setting-' + k).forEach(function (el) {
          if ('checked' in el && (el.type === 'checkbox' || el.type === 'radio')) el.checked = !!v;
          else if ('value' in el) el.value = str;
        });
      });
    }).catch(function () { /* ignore */ });

    document.querySelectorAll('[data-save-settings]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var patch = {};
        var scope = btn.closest('form, section, .card') || document;
        scope.querySelectorAll('input[name], select[name], textarea[name]').forEach(function (el) {
          if (!el.name) return;
          if (el.type === 'checkbox') patch[el.name] = !!el.checked;
          else if (el.type === 'radio') { if (el.checked) patch[el.name] = el.value; }
          else patch[el.name] = el.value;
        });
        if (!Object.keys(patch).length) {
          LH.toast.success(btn.getAttribute('data-save-settings') || 'Settings saved', 'Your changes have been applied.');
          return;
        }
        LH.api.admin.patchSettings(patch).then(function () {
          LH.toast.success(btn.getAttribute('data-save-settings') || 'Settings saved', 'Your changes have been applied.');
        }).catch(function () {
          LH.toast.error('Save failed', 'Settings could not be saved.');
        });
      });
    });

    document.querySelectorAll('[data-toggle-access]').forEach(function (cb) {
      cb.addEventListener('change', function () {
        var label = cb.closest('.toggle-row').querySelector('.checkbox-label');
        if (label) label.textContent = cb.checked ? 'Enabled' : 'Disabled';
      });
    });

    $('#wipe-all').addEventListener('click', function () {
      var modal = LH.modal.open(
        '<p style="font-size:13px;color:var(--color-text-secondary);margin-bottom:14px;line-height:1.7;">' +
          'This permanently deletes <strong>everything</strong>: courses, users (except your primary admin), ' +
          'submissions, grades, files and settings. Type <strong>WIPE</strong> below to confirm.</p>' +
          '<div class="form-group"><label class="form-label" for="wipe-confirm">Type WIPE to confirm</label>' +
            '<input class="form-input" id="wipe-confirm" autocomplete="off" placeholder="WIPE"></div>' +
          '<div class="form-error" data-wipe-error style="display:none;"></div>' +
          '<div class="modal-footer" style="display:flex;justify-content:flex-end;gap:10px;padding:16px 0 0;">' +
            '<button class="btn btn-secondary" data-wipe-cancel>Cancel</button>' +
            '<button class="btn btn-danger" data-wipe-go>Wipe everything</button>' +
          '</div>',
        { title: 'Wipe instance', width: '480px' });
      var overlay = modal.overlay;
      overlay.querySelector('[data-wipe-cancel]').addEventListener('click', function () { LH.modal.close(); });
      overlay.querySelector('[data-wipe-go]').addEventListener('click', function () {
        var typed = (overlay.querySelector('#wipe-confirm').value || '').trim();
        var err = overlay.querySelector('[data-wipe-error]');
        if (typed !== 'WIPE') {
          if (err) { err.textContent = 'Type WIPE exactly to confirm.'; err.style.display = 'block'; }
          return;
        }
        var goBtn = overlay.querySelector('[data-wipe-go]');
        if (goBtn) goBtn.disabled = true;
        LH.api.admin.wipeInstance().then(function (res) {
          if (res && res.ok === false) throw (res.error || 'wipe failed');
          LH.modal.close();
          LH.toast.success('Instance wiped', 'All data deleted. Your admin account survived.');
          setTimeout(function () { window.location.reload(); }, 1200);
        }).catch(function (e) {
          if (goBtn) goBtn.disabled = false;
          if (err) { err.textContent = (e && e.error) || 'Wipe failed.'; err.style.display = 'block'; }
        });
      });
    });
  }

  LH.app.register('admin-settings', init);
  LH.app.init('admin-settings');
})(window.LH);