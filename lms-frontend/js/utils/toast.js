window.LH = window.LH || {};

(function (LH) {
  'use strict';

  var NS = LH.toast = {};
  var container = null;
  var counter = 0;

  var icons = {
    success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
  };

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function getContainer() {
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      container.setAttribute('aria-live', 'polite');
      container.style.cssText = 'position:fixed;bottom:20px;right:20px;display:flex;flex-direction:column;gap:10px;z-index:3000;pointer-events:none;max-width:100vw;';
      document.body.appendChild(container);
    }
    return container;
  }

  function remove(id) {
    var toast = container ? container.querySelector('[data-toast="' + id + '"]') : null;
    if (toast) {
      toast.style.transition = 'opacity .2s, transform .2s';
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(30px)';
      setTimeout(function () { toast.remove(); }, 200);
    }
  }

  NS.show = function (options) {
    options = options || {};
    var type = options.type || 'info';
    var title = options.title || '';
    var message = options.message || '';
    var duration = options.duration != null ? options.duration : 5000;
    var id = ++counter;

    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.dataset.toast = id;
    toast.setAttribute('role', 'alert');
    toast.style.cssText = 'display:flex;align-items:flex-start;gap:12px;padding:14px 16px;background:var(--color-bg-elevated);border:1px solid var(--color-border-light);border-radius:10px;box-shadow:var(--shadow-lg);min-width:300px;max-width:420px;pointer-events:auto;animation:toastIn .25s ease-out;';

    var actionHtml = '';
    if (options.action) {
      actionHtml = '<button class="btn btn-sm btn-ghost" data-toast-action="' + id + '" style="flex-shrink:0;">' + esc(options.action.label) + '</button>';
    }

    toast.innerHTML =
      '<div style="color:var(--color-text-muted);flex-shrink:0;margin-top:1px;display:flex;">' + icons[type] + '</div>' +
      '<div style="flex:1;min-width:0;">' +
        (title ? '<div style="font-size:13px;font-weight:600;color:var(--color-text-primary);margin-bottom:2px;">' + esc(title) + '</div>' : '') +
        (message ? '<div style="font-size:13px;color:var(--color-text-tertiary);line-height:1.5;">' + esc(message) + '</div>' : '') +
      '</div>' +
      '<button class="btn-icon" data-toast-close="' + id + '" aria-label="Dismiss" style="flex-shrink:0;color:var(--color-text-muted);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' +
      actionHtml;

    container = getContainer();
    container.appendChild(toast);

    if (options.action) {
      toast.querySelector('[data-toast-action]').addEventListener('click', function () {
        options.action.handler && options.action.handler();
        remove(id);
      });
    }
    toast.querySelector('[data-toast-close]').addEventListener('click', function () {
      remove(id);
    });

    if (duration > 0) {
      setTimeout(function () { remove(id); }, duration);
    }
    return id;
  };

  NS.success = function (title, message, opts) { return NS.show(Object.assign({ type: 'success', title: title, message: message }, opts)); };
  NS.error = function (title, message, opts) { return NS.show(Object.assign({ type: 'error', title: title, message: message }, opts)); };
  NS.warning = function (title, message, opts) { return NS.show(Object.assign({ type: 'warning', title: title, message: message }, opts)); };
  NS.info = function (title, message, opts) { return NS.show(Object.assign({ type: 'info', title: title, message: message }, opts)); };

})(window.LH);

if (typeof document !== 'undefined' && !document.querySelector('style[data-toast-anim]')) {
  var st = document.createElement('style');
  st.dataset.toastAnim = '1';
  st.textContent = '@keyframes toastIn{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}';
  document.head.appendChild(st);
}