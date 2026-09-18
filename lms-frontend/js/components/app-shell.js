window.LH = window.LH || {};

(function (LH) {
  'use strict';

  var I = LH.icons, F = LH.format, UI = LH.ui, API = LH.api;

  var NAV = {
    student: [
      { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', href: 'dashboard.html', page: 'student-dashboard' },
      { id: 'courses', label: 'My Courses', icon: 'courses', href: 'courses.html', page: 'student-courses' },
      { id: 'assignments', label: 'Assignments', icon: 'assignments', href: 'assignments.html', page: 'student-assignments' },
      { id: 'quizzes', label: 'Quizzes', icon: 'quizzes', href: 'quizzes.html', page: 'student-quizzes' },
      { id: 'grades', label: 'Grades', icon: 'grades', href: 'grades.html', page: 'student-grades' },
      { id: 'attendance', label: 'Attendance', icon: 'attendance', href: 'attendance.html', page: 'student-attendance' },
      { id: 'progress', label: 'Progress', icon: 'progress', href: 'progress.html', page: 'student-progress' },
      { id: 'notifications', label: 'Notifications', icon: 'bell', href: 'notifications.html', page: 'student-notifications' },
      { id: 'profile', label: 'Profile', icon: 'profile', href: 'profile.html', page: 'student-profile' }
    ],
    faculty: [
      { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', href: 'dashboard.html', page: 'faculty-dashboard' },
      { id: 'courses', label: 'My Courses', icon: 'courses', href: 'courses.html', page: 'faculty-courses' },
      { id: 'assignments', label: 'Assignments', icon: 'assignments', href: 'assignments.html', page: 'faculty-assignments' },
      { id: 'quizzes', label: 'Quizzes', icon: 'quizzes', href: 'quizzes.html', page: 'faculty-quizzes' },
      { id: 'submissions', label: 'Submissions', icon: 'upload', href: 'submissions.html', page: 'faculty-submissions' },
      { id: 'grades', label: 'Grades', icon: 'grades', href: 'grades.html', page: 'faculty-grades' },
      { id: 'attendance', label: 'Attendance', icon: 'attendance', href: 'attendance.html', page: 'faculty-attendance' },
      { id: 'progress', label: 'Student Progress', icon: 'progress', href: 'student-progress.html', page: 'faculty-progress' },
      { id: 'profile', label: 'Profile', icon: 'profile', href: 'profile.html', page: 'faculty-profile' }
    ],
    admin: [
      { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', href: 'dashboard.html', page: 'admin-dashboard' },
      { id: 'students', label: 'Students', icon: 'students', href: 'students.html', page: 'admin-students' },
      { id: 'faculty', label: 'Faculty', icon: 'faculty', href: 'faculty.html', page: 'admin-faculty' },
      { id: 'courses', label: 'Courses', icon: 'courses', href: 'courses.html', page: 'admin-courses' },
      { id: 'users', label: 'Users', icon: 'users', href: 'users.html', page: 'admin-users' },
      { id: 'reports', label: 'Reports', icon: 'reports', href: 'reports.html', page: 'admin-reports' },
      { id: 'settings', label: 'Settings', icon: 'settings', href: 'settings.html', page: 'admin-settings' }
    ]
  };

  var PAGE_INFO = {
    'student-dashboard': ['Dashboard', 'Student'],
    'student-courses': ['My Courses', 'Student'],
    'student-course-details': ['Course Details', 'Student'],
    'student-assignments': ['Assignments', 'Student'],
    'student-quiz-attempt': ['Quiz', 'Student'],
    'student-grades': ['Grades', 'Student'],
    'student-attendance': ['Attendance', 'Student'],
    'student-progress': ['Progress', 'Student'],
    'student-notifications': ['Notifications', 'Student'],
    'student-profile': ['Profile', 'Student'],
    'faculty-dashboard': ['Dashboard', 'Faculty'],
    'faculty-courses': ['My Courses', 'Faculty'],
    'faculty-course-details': ['Course Details', 'Faculty'],
    'faculty-course-editor': ['Course Editor', 'Faculty'],
    'faculty-assignments': ['Assignments', 'Faculty'],
    'faculty-quizzes': ['Quizzes', 'Faculty'],
    'faculty-submissions': ['Submissions', 'Faculty'],
    'faculty-grades': ['Grades', 'Faculty'],
    'faculty-attendance': ['Attendance', 'Faculty'],
    'faculty-progress': ['Student Progress', 'Faculty'],
    'faculty-profile': ['Profile', 'Faculty'],
    'admin-dashboard': ['Dashboard', 'Admin'],
    'admin-students': ['Students', 'Admin'],
    'admin-faculty': ['Faculty', 'Admin'],
    'admin-courses': ['Courses', 'Admin'],
    'admin-users': ['Users', 'Admin'],
    'admin-reports': ['Reports', 'Admin'],
    'admin-settings': ['Settings', 'Admin'],
    'login': ['Sign in', 'Auth']
  };

  var shell = LH.shell = {};
  var user = null;

  shell.currentPageId = function () {
    return document.body.getAttribute('data-page') || '';
  };

  shell.getUser = function () { return user; };

  shell.requireAuth = function () {
    user = API.auth.current();
    var page = shell.currentPageId();
    if (!user && page.indexOf('login') === -1 && page) {
      window.location.href = '../auth/login.html';
      return null;
    }
    if (!user) return null;
    return user;
  };

  function roleLabel(role) {
    if (role === 'student') return 'Student';
    if (role === 'faculty') return 'Faculty';
    return 'Administrator';
  }

  function urlFor(role, file) {
    return '../' + role + '/' + file;
  }

  function renderSidebar() {
    var el = document.getElementById('sidebar');
    if (!el) return;
    var page = shell.currentPageId();
    var navItems = NAV[user.role] || NAV.student;

    var links = navItems.map(function (n) {
      var active = n.page === page ? ' active' : '';
      return '<a class="nav-item' + active + '" href="' + n.href + '" data-page="' + n.page + '"' + (n.id === 'notifications' ? ' data-notif-link' : '') + '>' +
        '<span class="nav-item-icon">' + I.icon(n.icon, 20) + '</span>' +
        '<span class="nav-item-text">' + n.label + '</span>' +
        (n.id === 'notifications' ? '<span class="nav-text-badge" data-sidebar-unread style="margin-left:auto;"></span>' : '') +
      '</a>';
    }).join('');

    el.innerHTML =
      '<div class="sidebar-header">' +
        '<a class="sidebar-logo" href="' + (NAV[user.role][0].href) + '">' +
          '<span class="sidebar-logo-icon">' + logoMark() + '</span>' +
          '<span class="sidebar-logo-text">LearnHub</span>' +
        '</a>' +
        '<button class="sidebar-toggle" id="sidebar-close" aria-label="Close menu">' + I.icon('close') + '</button>' +
      '</div>' +
      '<nav class="sidebar-nav" aria-label="Primary">' +
        '<div class="nav-section"><div class="nav-section-title">Main</div>' + links + '</div>' +
        '<div class="nav-section"><div class="nav-section-title">General</div>' +
          '<a class="nav-item" href="' + urlFor(user.role, 'profile.html') + '" data-page="' + user.role + '-profile">' +
            '<span class="nav-item-icon">' + I.icon('settings', 20) + '</span><span class="nav-item-text">Settings</span></a>' +
          '<button class="nav-item" id="sidebar-logout" style="width:100%;">' +
            '<span class="nav-item-icon">' + I.icon('logout', 20) + '</span><span class="nav-item-text">Log out</span></button>' +
        '</div>' +
      '</nav>' +
      '<div class="sidebar-footer">' +
        '<div class="sidebar-user" style="width:100%;">' +
          '<span class="user-avatar">' + F.initials(user.name) + '</span>' +
          '<div class="user-info"><span class="user-name">' + F.esc(user.name) + '</span><span class="user-role">' + roleLabel(user.role) + '</span></div>' +
        '</div>' +
      '</div>';

    var closeBtn = el.querySelector('#sidebar-close');
    if (closeBtn) closeBtn.addEventListener('click', shell.closeDrawer);

    var logout = el.querySelector('#sidebar-logout');
    if (logout) logout.addEventListener('click', shell.logout);
  }

  function renderHeader() {
    var el = document.getElementById('header');
    if (!el) return;
    var page = shell.currentPageId();
    var info = PAGE_INFO[page] || [page, ''];
    var unread = API.notifications.unreadCount();

    el.innerHTML =
      '<div class="header-left">' +
        '<button class="mobile-menu-btn" id="mobile-menu-btn" aria-label="Open menu">' + I.icon('menu') + '</button>' +
        '<div>' +
          '<div class="breadcrumb"><a href="dashboard.html" style="color:var(--color-text-tertiary);">LearnHub</a>' +
            '<span class="breadcrumb-separator">' + I.icon('chevronRight', 14) + '</span>' +
            '<span class="breadcrumb-current">' + info[1] + '</span></div>' +
          '<div class="page-title">' + info[0] + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="header-right">' +
        '<div class="header-search">' +
          '<span class="header-search-icon">' + I.icon('search') + '</span>' +
          '<input class="header-search-input" id="header-search" type="search" placeholder="Search courses, people, assignments..." aria-label="Search">' +
        '</div>' +
        '<button class="header-btn" id="header-theme" aria-label="Toggle theme">' +
          '<span class="header-btn-icon" id="theme-toggle-icon"></span></button>' +
        '<div class="dropdown">' +
          '<button class="header-btn" id="notif-btn" aria-label="Notifications">' +
            '<span class="header-btn-icon">' + I.icon('bell') + '</span>' +
            (unread ? '<span class="badge" data-notif-badge>' + unread + '</span>' : '') +
          '</button>' +
          '<div class="dropdown-menu notif-menu" id="notif-menu" style="width:360px;padding:0;"></div>' +
        '</div>' +
        '<div class="header-divider"></div>' +
        '<div class="user-menu">' +
          '<button class="user-menu-trigger" id="user-menu-trigger" aria-haspopup="true" aria-expanded="false">' +
            '<span class="user-menu-avatar">' + F.initials(user.name) + '</span>' +
            '<span class="user-menu-name">' + F.esc(user.name) + '</span>' +
            '<span style="color:var(--color-text-muted);display:inline-flex;">' + I.icon('chevronDown', 14) + '</span>' +
          '</button>' +
          '<div class="user-menu-dropdown" id="user-menu-dropdown">' +
            '<div class="dropdown-header"><div class="dropdown-user-name">' + F.esc(user.name) + '</div>' +
              '<div class="dropdown-user-email">' + F.esc(user.email) + '</div></div>' +
            '<button class="dropdown-item" data-goto="profile">' + '<span class="dropdown-item-icon">' + I.icon('profile') + '</span>My Profile</button>' +
            '<button class="dropdown-item" data-goto="settings">' + '<span class="dropdown-item-icon">' + I.icon('settings') + '</span>Account Settings</button>' +
            '<div class="dropdown-divider"></div>' +
            '<button class="dropdown-item danger" data-logout>' + '<span class="dropdown-item-icon">' + I.icon('logout') + '</span>Log Out</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    wireHeader();
  }

  function wireHeader() {
    var menuBtn = document.getElementById('mobile-menu-btn');
    if (menuBtn) menuBtn.addEventListener('click', shell.openDrawer);

    var themeBtn = document.getElementById('header-theme');
    if (themeBtn) themeBtn.addEventListener('click', function () {
      LH.theme.toggle();
    });
    LH.theme.apply(LH.theme.getCurrent());
    if (document.getElementById('sidebar-theme')) {
      document.getElementById('sidebar-theme').addEventListener('click', function () { LH.theme.toggle(); });
    }

    var search = document.getElementById('header-search');
    if (search) search.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var term = search.value.trim();
        if (!term) return;
        var target = user.role === 'admin' ? 'courses.html' : 'courses.html';
        window.location.href = target + '?q=' + encodeURIComponent(term);
      }
    });

    var nBtn = document.getElementById('notif-btn');
    var nMenu = document.getElementById('notif-menu');
    if (nBtn && nMenu) {
      nBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = nMenu.classList.contains('open');
        closeAllDropdowns();
        if (!open) {
          renderNotifMenu(nMenu);
          nMenu.classList.add('open');
        }
      });
      document.addEventListener('click', function () { nMenu.classList.remove('open'); });
    }

    var umBtn = document.getElementById('user-menu-trigger');
    var umMenu = document.getElementById('user-menu-dropdown');
    if (umBtn && umMenu) {
      umBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = umMenu.classList.contains('open');
        closeAllDropdowns();
        if (!open) {
          umMenu.classList.add('open');
          umBtn.setAttribute('aria-expanded', 'true');
        }
      });
      document.addEventListener('click', function () {
        umMenu.classList.remove('open');
        umBtn.setAttribute('aria-expanded', 'false');
      });
      umMenu.querySelectorAll('[data-logout]').forEach(function (btn) {
        btn.addEventListener('click', shell.logout);
      });
      umMenu.querySelectorAll('[data-goto="profile"]').forEach(function (btn) {
        btn.addEventListener('click', function () { window.location.href = 'profile.html'; });
      });
      umMenu.querySelectorAll('[data-goto="settings"]').forEach(function (btn) {
        btn.addEventListener('click', function () { window.location.href = 'profile.html'; });
      });
    }
  }

  function closeAllDropdowns() {
    document.querySelectorAll('.dropdown-menu.open, .user-menu-dropdown.open').forEach(function (m) { m.classList.remove('open'); });
    var t = document.querySelector('.user-menu-trigger');
    if (t) t.setAttribute('aria-expanded', 'false');
  }

  function renderNotifMenu(menu) {
    var list = LH.mock.notifications.slice().sort(function (a, b) { return new Date(b.time) - new Date(a.time); }).slice(0, 4);
    var items = list.map(function (n) {
      var tone = n.type === 'quiz' ? 'quiz' : n.type;
      return '<button class="notification-item notification-slot" data-notif-read="' + n.id + '" style="display:flex;width:100%;text-align:left;border-radius:0;border:none;border-bottom:1px solid var(--color-border-light);">' +
        '<div class="notification-icon ' + tone + '">' + I.icon(n.type === 'grade' ? 'grades' : n.type === 'course' ? 'courses' : n.type === 'system' ? 'info' : n.type === 'quiz' ? 'quizzes' : 'assignments') + '</div>' +
        '<div class="notification-content"><div class="notification-title" style="font-size:13px;">' + F.esc(n.title) + '</div>' +
        '<div style="font-size:12px;color:var(--color-text-tertiary);margin-top:2px;">' + LH.date.relative(n.time) + '</div></div>' +
        (n.read ? '' : '<span class="unread-dot" style="width:8px;height:8px;border-radius:50%;background:var(--color-primary);flex-shrink:0;margin-top:6px;"></span>') +
      '</button>';
    }).join('');
    var viewAll = (user.role === 'student')
      ? '<a class="dropdown-item" href="notifications.html" style="justify-content:center;">View all notifications</a>'
      : '';

    if (!list.length) {
      items = '<div style="padding:24px;text-align:center;color:var(--color-text-muted);font-size:13px;">You\u2019re all caught up</div>';
      viewAll = '';
    }

    menu.innerHTML = '<div style="padding:14px 16px;font-weight:600;font-size:14px;border-bottom:1px solid var(--color-border-light);color:var(--color-text-primary);">Notifications</div>' + items + viewAll;

    menu.querySelectorAll('[data-notif-read]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        API.notifications.markRead(btn.getAttribute('data-notif-read'));
        menu.classList.remove('open');
        syncUnread();
      });
    });

    if (LH.mock.notifications.some(function (n) { return !n.read; })) {
      var markAll = document.createElement('div');
      markAll.style.cssText = 'border-top:1px solid var(--color-border-light);';
      markAll.innerHTML = '<button class="dropdown-item" style="justify-content:center;color:var(--color-primary);" id="mark-all-read">Mark all as read</button>';
      menu.appendChild(markAll);
      markAll.querySelector('#mark-all-read').addEventListener('click', function () {
        API.notifications.markAllRead();
        menu.classList.remove('open');
        syncUnread();
        LH.toast.info('Notifications', 'All notifications marked as read.');
      });
    }
  }

  function syncUnread() {
    var count = API.notifications.unreadCount();
    var badge = document.querySelector('[data-notif-badge]');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count ? 'flex' : 'none';
    }
    var side = document.querySelector('[data-sidebar-unread]');
    if (side) {
      side.innerHTML = count ? '<span class="badge badge-primary">' + count + '</span>' : '';
    }
  }

  shell.refreshUnread = syncUnread;

  shell.openDrawer = function () {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('sidebar-overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  shell.closeDrawer = function () {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('open');
    document.body.style.overflow = '';
  };

  shell.logout = function () {
    API.auth.logout();
    window.location.href = '../auth/login.html';
  };

  shell.init = function () {
    var u = shell.requireAuth();
    if (!u) return false;
    user = u;

    LH.theme.init();

    renderSidebar();
    renderHeader();
    syncUnread();

    var overlay = document.getElementById('sidebar-overlay');
    if (overlay) overlay.addEventListener('click', shell.closeDrawer);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        shell.closeDrawer();
        closeAllDropdowns();
      }
    });

    return true;
  };

  function logoMark() {
    return '<svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden="true"><rect x="1" y="1" width="30" height="30" rx="8" fill="var(--color-primary)"/><path d="M9 23V9l14 6-14 8z" fill="#fff"/></svg>';
  }

  shell.logoMark = logoMark;

})(window.LH);