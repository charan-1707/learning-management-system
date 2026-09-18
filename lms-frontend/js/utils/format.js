window.LH = window.LH || {};

(function (LH) {
  'use strict';

  var NS = LH.format = {};

  NS.percent = function (value, decimals) {
    decimals = decimals == null ? 0 : decimals;
    return parseFloat(value).toFixed(decimals) + '%';
  };

  NS.fileSize = function (bytes) {
    if (bytes == null) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  NS.n = function (value) {
    if (value == null) return '';
    return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  NS.esc = function (str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  };

  NS.initials = function (name) {
    if (!name) return '';
    return name.split(' ').filter(Boolean).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase();
  };

  NS.gradeLetter = function (percentage) {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  NS.gradeColor = function (percentage) {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'info';
    if (percentage >= 40) return 'warning';
    return 'danger';
  };

  NS.gpa = function (percentage) {
    if (percentage >= 90) return '4.0';
    if (percentage >= 85) return '3.7';
    if (percentage >= 80) return '3.3';
    if (percentage >= 75) return '3.0';
    if (percentage >= 70) return '2.7';
    if (percentage >= 65) return '2.3';
    if (percentage >= 60) return '2.0';
    if (percentage >= 50) return '1.7';
    return '0.0';
  };

})(window.LH);