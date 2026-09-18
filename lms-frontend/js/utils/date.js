window.LH = window.LH || {};

(function (LH) {
  'use strict';

  var NS = LH.date = {};

  function toDate(date) {
    return date instanceof Date ? date : new Date(date);
  }

  function isValid(d) {
    return d && !isNaN(d.getTime());
  }

  NS.format = function (date, options) {
    var d = toDate(date);
    if (!isValid(d)) return '';
    var opts = Object.assign({ year: 'numeric', month: 'short', day: 'numeric' }, options || {});
    return d.toLocaleDateString('en-US', opts);
  };

  NS.formatTime = function (date) {
    var d = toDate(date);
    if (!isValid(d)) return '';
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  NS.formatDateTime = function (date, options) {
    var d = toDate(date);
    if (!isValid(d)) return '';
    var opts = Object.assign({ year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }, options || {});
    return d.toLocaleDateString('en-US', opts);
  };

  NS.relative = function (date) {
    var d = toDate(date);
    if (!isValid(d)) return '';
    var secs = Math.floor((new Date() - d) / 1000);
    if (secs < 60) return 'just now';
    var mins = Math.floor(secs / 60);
    if (mins < 60) return mins + 'm ago';
    var hours = Math.floor(mins / 60);
    if (hours < 24) return hours + 'h ago';
    var days = Math.floor(hours / 24);
    if (days < 7) return days + 'd ago';
    var weeks = Math.floor(days / 7);
    if (weeks < 4) return weeks + 'w ago';
    var months = Math.floor(days / 30);
    if (months < 12) return months + 'mo ago';
    return Math.floor(days / 365) + 'y ago';
  };

  NS.daysUntil = function (date) {
    var d = toDate(date);
    if (!isValid(d)) return 0;
    var now = new Date();
    now.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    return Math.round((d - now) / (1000 * 60 * 60 * 24));
  };

  NS.isOverdue = function (date) {
    return toDate(date).getTime() < new Date().getTime();
  };

  NS.dueLabel = function (date) {
    var d = toDate(date);
    var days = NS.daysUntil(d);
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return 'Due in ' + days + ' days';
  };

  NS.toISO = function (date) {
    return toDate(date).toISOString().split('T')[0];
  };

  NS.toInput = function (date) {
    var d = toDate(date);
    if (!isValid(d)) return '';
    var y = d.getFullYear();
    var m = ('0' + (d.getMonth() + 1)).slice(-2);
    var day = ('0' + d.getDate()).slice(-2);
    return y + '-' + m + '-' + day;
  };

  NS.addDays = function (date, days) {
    var d = date instanceof Date ? new Date(date) : new Date();
    d.setDate(d.getDate() + days);
    return d;
  };

  NS.relativeDays = function (daysFromToday) {
    return NS.addDays(new Date(), daysFromToday);
  };

})(window.LH);