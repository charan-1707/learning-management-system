window.LH = window.LH || {};

(function (LH) {
  'use strict';

  var NS = LH.validation = {};

  NS.email = function (value) {
    var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test((value || '').trim());
  };

  NS.required = function (value) {
    return value != null && String(value).trim().length > 0;
  };

  NS.minLength = function (value, min) {
    return String(value || '').length >= min;
  };

  NS.fullName = function (value) {
    return NS.required(value) && String(value).trim().split(/\s+/).length >= 2;
  };

  NS.validate = function (values, rules) {
    var errors = {};
    Object.keys(rules).forEach(function (field) {
      var rule = rules[field];
      var value = values[field];
      if (rule.required && !NS.required(value)) {
        errors[field] = rule.message || field + ' is required';
        return;
      }
      if (value && rule.email && !NS.email(value)) {
        errors[field] = rule.emailMessage || 'Enter a valid email address';
        return;
      }
      if (rule.minLength && value && !NS.minLength(value, rule.minLength)) {
        errors[field] = rule.message || field + ' is too short';
      }
    });
    return errors;
  };

  NS.form = function (formEl, rules) {
    var values = {};
    Object.keys(rules).forEach(function (field) {
      var el = formEl.querySelector('[name="' + field + '"]');
      if (el) values[field] = el.value;
    });
    var errors = NS.validate(values, rules);

    Object.keys(rules).forEach(function (field) {
      var el = formEl.querySelector('[name="' + field + '"]');
      var msg = formEl.querySelector('[data-error-for="' + field + '"]');
      if (!el) return;
      if (errors[field]) {
        el.classList.add('error');
        if (msg) { msg.textContent = errors[field]; msg.style.display = 'block'; }
      } else {
        el.classList.remove('error');
        if (msg) { msg.textContent = ''; msg.style.display = 'none'; }
      }
    });

    return { valid: Object.keys(errors).length === 0, errors: errors, values: values };
  };

})(window.LH);