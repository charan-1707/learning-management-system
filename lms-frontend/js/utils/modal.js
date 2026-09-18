window.LH = window.LH || {};

(function (LH) {
  'use strict';

  var NS = LH.modal = {};
  var active = null;
  var restoreFocus = null;

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function trapFocus(modal) {
    var focusable = modal.querySelectorAll('a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])');
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    function onKey(e) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first || !modal.contains(document.activeElement)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    modal.addEventListener('keydown', onKey);
    return function () { modal.removeEventListener('keydown', onKey); };
  }

  NS.close = function () {
    if (!active) return;
    var overlay = active.overlay;
    overlay.classList.remove('open');
    active.destroy();
    var prev = active.prevFocus;
    active = null;
    if (prev) prev.focus();
  };

  NS.open = function (content, options) {
    options = options || {};
    NS.close();

    var prevFocus = document.activeElement;
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    var width = options.width || '560px';
    var bodyHtml = typeof content === 'string'
      ? content
      : (content && content.outerHTML ? content.outerHTML : '');

    overlay.innerHTML =
      '<div class="modal" role="document" style="max-width:' + width + ';width:100%;">' +
        '<div class="modal-header">' +
          '<h3 class="modal-title" id="lh-modal-title">' + esc(options.title || '') + '</h3>' +
          '<button class="modal-close" data-modal-close aria-label="Close"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' +
        '</div>' +
        '<div class="modal-body" style="overflow-y:auto;">' + bodyHtml + '</div>' +
      '</div>';

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    overlay.querySelector('[data-modal-close]').addEventListener('click', NS.close);
    overlay.addEventListener('mousedown', function (e) {
      if (e.target === overlay) NS.close();
    });
    document.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Escape') NS.close();
    });

    active = {
      overlay: overlay,
      prevFocus: prevFocus,
      destroy: function () {
        overlay.remove();
        document.body.style.overflow = '';
      }
    };

    requestAnimationFrame(function () {
      overlay.classList.add('open');
      restoreFocus = trapFocus(overlay.querySelector('.modal'));
      var auto = overlay.querySelector('[autofocus], input, textarea, select');
      if (options.focus !== false && auto) auto.focus();
      if (options.onOpen) options.onOpen(active);
    });

    return active;
  };

  NS.confirm = function (message, options) {
    options = options || {};
    return new Promise(function (resolve) {
      var content =
        '<p style="color:var(--color-text-secondary);margin-bottom:24px;">' + esc(message) + '</p>' +
        '<div class="modal-footer" style="padding:16px 0 0;border-top:1px solid var(--color-border-light);margin:0;">' +
          '<button class="btn btn-secondary" data-m-confirm="cancel">' + esc(options.cancelText || 'Cancel') + '</button>' +
          '<button class="btn btn-' + (options.variant || 'danger') + '" data-m-confirm="ok">' + esc(options.confirmText || 'Confirm') + '</button>' +
        '</div>';
      var m = NS.open(content, { title: options.title || 'Confirm action', width: '440px' });
      m.overlay.querySelector('[data-m-confirm="ok"]').addEventListener('click', function () {
        NS.close();
        resolve(true);
        if (options.onConfirm) options.onConfirm();
      });
      m.overlay.querySelector('[data-m-confirm="cancel"]').addEventListener('click', function () {
        NS.close();
        resolve(false);
        if (options.onCancel) options.onCancel();
      });
    });
  };

  NS.alert = function (message, options) {
    options = options || {};
    return new Promise(function (resolve) {
      var content =
        '<p style="color:var(--color-text-secondary);margin-bottom:24px;">' + esc(message) + '</p>' +
        '<div class="modal-footer" style="padding:16px 0 0;border-top:1px solid var(--color-border-light);margin:0;">' +
          '<button class="btn btn-primary" data-m-ok>' + esc(options.okText || 'OK') + '</button>' +
        '</div>';
      var m = NS.open(content, { title: options.title || 'Notice', width: '440px' });
      m.overlay.querySelector('[data-m-ok]').addEventListener('click', function () {
        NS.close();
        resolve(true);
        if (options.onConfirm) options.onConfirm();
      });
    });
  };

})(window.LH);