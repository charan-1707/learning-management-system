window.LH = window.LH || {};

(function (LH) {
  'use strict';

  var NS = LH.dom = {};

  NS.$ = function (selector, context) {
    return (context || document).querySelector(selector);
  };

  NS.$$ = function (selector, context) {
    return Array.prototype.slice.call((context || document).querySelectorAll(selector));
  };

  NS.create = function (tag, attrs, children) {
    attrs = attrs || {};
    children = children || [];
    var el = document.createElement(tag);
    Object.keys(attrs).forEach(function (key) {
      if (key === 'class') {
        el.className = attrs[key];
      } else if (key === 'style') {
        Object.assign(el.style, attrs[key]);
      } else if (key.indexOf('on') === 0 && typeof attrs[key] === 'function') {
        el.addEventListener(key.slice(2).toLowerCase(), attrs[key]);
      } else if (attrs[key] === true) {
        el.setAttribute(key, key);
      } else if (attrs[key] !== false && attrs[key] != null) {
        el.setAttribute(key, attrs[key]);
      }
    });
    children.forEach(function (child) {
      if (typeof child === 'string' || typeof child === 'number') {
        el.appendChild(document.createTextNode(child));
      } else if (child instanceof Node) {
        el.appendChild(child);
      } else if (child) {
        el.appendChild(child);
      }
    });
    return el;
  };

  NS.html = function (markup) {
    var template = document.createElement('template');
    template.innerHTML = markup.trim();
    var frag = template.content;
    return frag.childNodes.length > 1 ? frag : frag.firstChild;
  };

  NS.on = function (el, event, selector, handler) {
    if (typeof selector === 'function') {
      handler = selector;
      el.addEventListener(event, handler);
      return;
    }
    el.addEventListener(event, function (e) {
      var target = e.target.closest ? e.target.closest(selector) : null;
      if (target && el.contains(target)) handler.call(target, e);
    });
  };

  NS.empty = function (el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  };

  NS.remove = function (el) {
    if (el && el.parentNode) el.parentNode.removeChild(el);
  };

  NS.show = function (el, display) {
    if (el) el.style.display = display || (el.dataset.origDisplay || 'block');
  };

  NS.hide = function (el) {
    if (el) {
      el.dataset.origDisplay = el.style.display || 'block';
      el.style.display = 'none';
    }
  };

})(window.LH);