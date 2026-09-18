(function (LH) {
  'use strict';

  var $ = LH.dom.$, F = LH.format, D = LH.date, UI = LH.ui, I = LH.icons;
  var M = LH.mock;
  var currentFilter = 'all';

  function iconFor(n) {
    if (n.type === 'quiz') return I.icon('quizzes');
    if (n.type === 'grade') return I.icon('grades');
    if (n.type === 'course') return I.icon('courses');
    if (n.type === 'system') return I.icon('info');
    return I.icon('assignments');
  }

  function render() {
    var el = $('#notif-list');
    if (!el) return;

    var list = M.notifications.slice().sort(function (a, b) { return new Date(b.time) - new Date(a.time); });
    if (currentFilter === 'unread') list = list.filter(function (n) { return !n.read; });
    else if (currentFilter !== 'all') list = list.filter(function (n) { return n.type === currentFilter; });

    if (!list.length) {
      el.innerHTML = UI.emptyState('bell', 'No notifications', currentFilter === 'unread' ? 'You have no unread notifications.' : 'No notifications match this filter.');
      return;
    }

    el.innerHTML = list.map(function (n) {
      var isUnread = !n.read;
      return '<div class="notification-item' + (isUnread ? ' unread' : '') + '" data-notif="' + n.id + '" style="transition:all .2s ease;">' +
        '<div class="notification-icon ' + n.type + '">' + iconFor(n) + '</div>' +
        '<div class="notification-content">' +
          '<div class="notification-header">' +
            '<span class="notification-title">' + F.esc(n.title) + '</span>' +
            '<span class="notification-time">' + D.relative(n.time) + '</span>' +
          '</div>' +
          '<div class="notification-message">' + F.esc(n.message) + '</div>' +
          '<div class="notification-footer">' +
            (n.course ? '<span class="notification-course">' + F.esc(n.course) + '</span>' : '') +
            '<span class="badge badge-neutral">' + F.esc(n.type.charAt(0).toUpperCase() + n.type.slice(1)) + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="notification-actions">' +
          (isUnread ? '<button class="btn btn-sm btn-ghost" data-mark-read="' + n.id + '">' + I.icon('check', 14) + ' Mark read</button>' : '<span style="font-size:11px;color:var(--color-text-muted);">Read</span>') +
        '</div>' +
      '</div>';
    }).join('');

    el.querySelectorAll('[data-mark-read]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        LH.api.notifications.markRead(btn.getAttribute('data-mark-read'));
        var item = btn.closest('.notification-item');
        item.classList.remove('unread');
        item.querySelector('.notification-actions').innerHTML = '<span style="font-size:11px;color:var(--color-text-muted);">Read</span>';
        LH.toast.info('Marked as read', 'Notification moved to read.');
        if (currentFilter === 'unread') render();
      });
    });
  }

  function init() {
    render();

    document.querySelectorAll('.tab[data-nfilter]').forEach(function (tab) {
      tab.addEventListener('click', function () {
        document.querySelectorAll('.tab[data-nfilter]').forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        currentFilter = tab.getAttribute('data-nfilter');
        render();
      });
    });

    $('#mark-all-read-btn').addEventListener('click', function () {
      LH.api.notifications.markAllRead();
      LH.toast.success('All caught up', 'All notifications marked as read.');
      render();
    });
  }

  LH.app.register('student-notifications', init);
  LH.app.init('student-notifications');
})(window.LH);