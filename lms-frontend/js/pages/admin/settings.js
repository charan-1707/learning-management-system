(function (LH) {
  'use strict';

  var $ = LH.dom.$;

  function init() {
    document.querySelectorAll('[data-save-settings]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        LH.toast.success(btn.getAttribute('data-save-settings') || 'Settings saved', 'Your changes have been applied.');
      });
    });

    document.querySelectorAll('[data-toggle-access]').forEach(function (cb) {
      cb.addEventListener('change', function () {
        var label = cb.closest('.toggle-row').querySelector('.checkbox-label');
        if (label) label.textContent = cb.checked ? 'Enabled' : 'Disabled';
      });
    });

    $('#reset-demo').addEventListener('click', function () {
      LH.toast.info('Reset complete', 'Demo data has been restored to its original state.');
    });

    $('#wipe-all').addEventListener('click', function () {
      LH.modal.confirm('This will permanently delete all courses, users, submissions and grades from the instance. Are you absolutely sure?', {
        title: 'Wipe instance',
        onConfirm: function () { LH.toast.info('Wipe scheduled', 'The wipe has been queued for review and will not run automatically in this demo.'); }
      });
    });
  }

  LH.app.register('admin-settings', init);
  LH.app.init('admin-settings');
})(window.LH);