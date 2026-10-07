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
      { id: 'notifications', label: 'Notifications', icon: 'bell', href: 'notifications.html', page: 'faculty-notifications' },
      { id: 'profile', label: 'Profile', icon: 'profile', href: 'profile.html', page: 'faculty-profile' }
    ],
    admin: [
      { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', href: 'dashboard.html', page: 'admin-dashboard' },
      { id: 'students', label: 'Students', icon: 'students', href: 'students.html', page: 'admin-students' },
      { id: 'faculty', label: 'Faculty', icon: 'faculty', href: 'faculty.html', page: 'admin-faculty' },
      { id: 'courses', label: 'Courses', icon: 'courses', href: 'courses.html', page: 'admin-courses' },
      { id: 'users', label: 'Users', icon: 'users', href: 'users.html', page: 'admin-users' },
      { id: 'reports', label: 'Reports', icon: 'reports', href: 'reports.html', page: 'admin-reports' },
      { id: 'settings', label: 'Settings', icon: 'settings', href: 'settings.html', page: 'admin-settings' },
      { id: 'notifications', label: 'Notifications', icon: 'bell', href: 'notifications.html', page: 'admin-notifications' }
    ]
  };

  var PAGE_INFO = {
    'student-dashboard': ['Dashboard', 'Student'],
    'student-courses': ['My Courses', 'Student'],
    'student-course-details': ['Course Details', 'Student'],
    'student-assignments': ['Assignments', 'Student'],
    'student-quizzes': ['Quizzes', 'Student'],
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
    'faculty-quizzes': ['Quizzes', 'Faculty'],
    'faculty-submissions': ['Submissions', 'Faculty'],
    'faculty-grades': ['Grades', 'Faculty'],
    'faculty-attendance': ['Attendance', 'Faculty'],
    'faculty-progress': ['Student Progress', 'Faculty'],
    'faculty-notifications': ['Notifications', 'Faculty'],
    'faculty-profile': ['Profile', 'Faculty'],
    'admin-dashboard': ['Dashboard', 'Admin'],
    'admin-students': ['Students', 'Admin'],
    'admin-faculty': ['Faculty', 'Admin'],
    'admin-courses': ['Courses', 'Admin'],
    'admin-users': ['Users', 'Admin'],
    'admin-reports': ['Reports', 'Admin'],
    'admin-settings': ['Settings', 'Admin'],
    'admin-notifications': ['Notifications', 'Admin'],
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

  function userAvatarInner(u) {
    var img = null;
    try { img = API.fileUrl(u ? u.avatarUrl : null); } catch (e) { img = null; }
    if (!img) return F.initials(u ? u.name : '');
    return F.initials(u ? u.name : '') +
      '<img src="' + img + '" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:inherit;" onerror="this.remove()">';
  }

  function urlFor(role, file) {
    return '../' + role + '/' + file;
  }

  function renderSidebar() {
    var el = document.getElementById('sidebar');
    if (!el) return;
    var page = shell.currentPageId();
    var navItems = NAV[user.role] || NAV.student;

    /* Stagger index drives the entrance animation delay (set inline so every
       item animates regardless of role/count — CSS nth-child lists miss the
       trailing items like Attendance/Progress/Notifications/Profile). */
    var links = navItems.map(function (n, i) {
      var active = n.page === page ? ' active' : '';
      var delay = (0.02 + i * 0.045).toFixed(2);
      return '<a class="nav-item' + active + '" href="' + n.href + '" data-page="' + n.page + '"' + (n.id === 'notifications' ? ' data-notif-link' : '') + ' style="animation-delay:' + delay + 's">' +
        '<span class="nav-item-icon">' + I.icon(n.icon, 20) + '</span>' +
        '<span class="nav-item-text">' + n.label + '</span>' +
        (n.id === 'notifications' ? '<span class="nav-text-badge" data-sidebar-unread style="margin-left:auto;"></span>' : '') +
      '</a>';
    }).join('');

    var generalBase = 0.02 + navItems.length * 0.045;
    var settingsDelay = generalBase.toFixed(2);
    var logoutDelay = (generalBase + 0.045).toFixed(2);

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
          '<a class="nav-item" style="animation-delay:' + settingsDelay + 's" href="' + urlFor(user.role, 'profile.html') + '" data-page="' + user.role + '-profile">' +
            '<span class="nav-item-icon">' + I.icon('settings', 20) + '</span><span class="nav-item-text">Settings</span></a>' +
          '<button class="nav-item" id="sidebar-logout" style="width:100%;animation-delay:' + logoutDelay + 's;">' +
            '<span class="nav-item-icon">' + I.icon('logout', 20) + '</span><span class="nav-item-text">Log out</span></button>' +
        '</div>' +
      '</nav>' +
      '<div class="sidebar-footer">' +
        '<div class="sidebar-user" style="width:100%;">' +
          '<span class="user-avatar" style="position:relative;overflow:hidden;">' + userAvatarInner(user) + '</span>' +
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
    if (!el) return Promise.resolve();
    var page = shell.currentPageId();
    var info = PAGE_INFO[page] || [page, ''];
    /* Header must never block the page: on failure render with 0 unread. */
    try {
      return API.notifications.unreadCount().then(function (unread) {
        renderHeaderHtml(el, page, info, unread || 0);
      }, function () {
        renderHeaderHtml(el, page, info, 0);
      });
    } catch (e) {
      try { renderHeaderHtml(el, page, info, 0); } catch (e2) { /* ignore */ }
      return Promise.resolve();
    }
  }

  function renderHeaderHtml(el, page, info, unread) {

    el.innerHTML =
      '<div class="header-left">' +
        '<button class="desktop-sidebar-btn" id="sidebar-toggle-btn" aria-label="Toggle sidebar">' + I.icon('menu') + '</button>' +
        '<button class="mobile-menu-btn" id="mobile-menu-btn" aria-label="Open menu">' + I.icon('menu') + '</button>' +
        '<div>' +
          '<div class="breadcrumb"><a href="dashboard.html" style="color:var(--color-text-tertiary);">LearnHub</a>' +
            '<span class="breadcrumb-separator">' + I.icon('chevronRight', 14) + '</span>' +
            '<span class="breadcrumb-current">' + info[1] + '</span></div>' +
          '<div class="page-title">' + info[0] + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="header-right">' +
        '<button class="header-btn mobile-search-btn" id="mobile-search-btn" aria-label="Search">' +
          '<span class="header-btn-icon">' + I.icon('search') + '</span></button>' +
        '<div class="mobile-search" id="mobile-search">' +
          '<span class="header-search-icon">' + I.icon('search') + '</span>' +
          '<input class="header-search-input" id="header-search-mobile" type="search" placeholder="Search courses, people, assignments..." aria-label="Search" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="search-results-mobile">' +
          '<div class="dropdown-menu search-results" id="search-results-mobile" role="listbox" aria-label="Search results"></div>' +
        '</div>' +
        '<div class="header-search">' +
          '<span class="header-search-icon">' + I.icon('search') + '</span>' +
          '<input class="header-search-input" id="header-search" type="search" placeholder="Search courses, people, assignments..." aria-label="Search" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="search-results">' +
          '<div class="dropdown-menu search-results" id="search-results" role="listbox" aria-label="Search results"></div>' +
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
          '<span class="user-menu-avatar" style="position:relative;overflow:hidden;">' + userAvatarInner(user) + '</span>' +
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

    var sideBtn = document.getElementById('sidebar-toggle-btn');
    if (sideBtn) sideBtn.addEventListener('click', shell.toggleSidebar);

    var themeBtn = document.getElementById('header-theme');
    if (themeBtn) themeBtn.addEventListener('click', function () {
      LH.theme.toggle();
    });
    LH.theme.apply(LH.theme.getCurrent());
    if (document.getElementById('sidebar-theme')) {
      document.getElementById('sidebar-theme').addEventListener('click', function () { LH.theme.toggle(); });
    }

    var search = document.getElementById('header-search');
    var searchMenu = document.getElementById('search-results');
    if (search) wireUniversalSearch(search, searchMenu);

    /* Mobile search: toggle button reveals the same palette as a
       drop-down bar under the header. Independent input, shared logic. */
    var mBtn = document.getElementById('mobile-search-btn');
    var mWrap = document.getElementById('mobile-search');
    var mInput = document.getElementById('header-search-mobile');
    var mMenu = document.getElementById('search-results-mobile');
    if (mInput) wireUniversalSearch(mInput, mMenu);
    if (mBtn && mWrap) {
      mBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = mWrap.classList.toggle('open');
        mBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open && mInput) mInput.focus();
      });
      document.addEventListener('click', function (e) {
        if (mWrap.classList.contains('open') && !mWrap.contains(e.target) && e.target !== mBtn && !mBtn.contains(e.target)) {
          mWrap.classList.remove('open');
          mBtn.setAttribute('aria-expanded', 'false');
        }
      });
    }

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

  /* Universal search palette: courses, assignments, quizzes and people —
     role-aware sources, grouped dropdown, full keyboard support. Every
     source is isolated: one failing endpoint never kills the palette. */
  function wireUniversalSearch(input, menu) {
    if (!input || !menu) return;
    var seq = 0, items = [], active = -1, timer = null;

    function match(hay, term) {
      return (hay || '').toLowerCase().indexOf(term) !== -1;
    }
    function personHref(p) {
      if (user.role !== 'admin') return 'student-progress.html';
      if (p.role === 'student') return 'students.html';
      if (p.role === 'faculty') return 'faculty.html';
      return 'users.html';
    }

    function fetchResults(term, runId) {
      var role = user.role;
      var courseP = API.courses.search(term).catch(function () { return []; });
      var asgP, quizP, peopleP;

      if (role === 'faculty') {
        asgP = API.faculty.courses().catch(function () { return []; }).then(function (mine) {
          var ids = (mine || []).map(function (c) { return c.id; }).slice(0, 8);
          return Promise.all(ids.map(function (cid) {
            return API.assignments.forCourse(cid).catch(function () { return []; });
          })).then(function (lists) {
            return lists.reduce(function (a, l) { return a.concat(l); }, [])
              .filter(function (x) { return match(x.title, term) || match(x.course, term); });
          });
        });
        quizP = API.quizzes.list().catch(function () { return []; }).then(function (all) {
          return API.faculty.courses().catch(function () { return []; }).then(function (mine) {
            var ids = {};
            (mine || []).forEach(function (c) { ids[c.id] = true; });
            return (all || []).filter(function (q) {
              return ids[q.courseId] && (match(q.title, term) || match(q.course, term));
            });
          });
        });
        peopleP = API.faculty.courses().catch(function () { return []; }).then(function (mine) {
          var ids = (mine || []).map(function (c) { return c.id; }).slice(0, 6);
          return Promise.all(ids.map(function (cid) {
            return API.courses.roster(cid).catch(function () { return []; });
          })).then(function (rosters) {
            var seen = {}, out = [];
            rosters.forEach(function (r) {
              (r || []).forEach(function (s) {
                var key = s.studentId || s.name;
                if (!key || seen[key]) return;
                seen[key] = true;
                if (match(s.name, term) || match(s.program, term)) {
                  out.push({ name: s.name || 'Student', sub: s.program || 'Student', role: 'student' });
                }
              });
            });
            return out;
          });
        });
      } else if (role === 'admin') {
        asgP = Promise.resolve([]);
        quizP = Promise.resolve([]);
        peopleP = API.admin.users({}).catch(function () { return []; }).then(function (all) {
          return (all || []).filter(function (p) {
            return match(p.name, term) || match(p.email, term);
          }).map(function (p) {
            return { name: p.name, sub: (p.role || '') + (p.email ? ' · ' + p.email : ''), role: p.role };
          });
        });
      } else {
        asgP = API.assignments.list().catch(function () { return []; }).then(function (all) {
          return (all || []).filter(function (a) { return match(a.title, term) || match(a.course, term); });
        });
        quizP = API.quizzes.list().catch(function () { return []; }).then(function (all) {
          return (all || []).filter(function (q) { return match(q.title, term) || match(q.course, term); });
        });
        peopleP = Promise.resolve([]);
      }

      return Promise.all([courseP, asgP, quizP, peopleP]).then(function (parts) {
        if (runId !== seq) return null;
        var groups = [];
        var courseItems = (parts[0] || []).slice(0, 4).map(function (c) {
          return { icon: 'courses', title: c.name, sub: (c.code || '') + (c.instructor ? ' · ' + c.instructor : ''), href: 'course-details.html?id=' + c.id };
        });
        if (courseItems.length) groups.push({ label: 'Courses', items: courseItems });
        var asgItems = (parts[1] || []).slice(0, 4).map(function (a) {
          return { icon: 'assignments', title: a.title, sub: (a.course || '') + (a.due ? ' · due ' + LH.date.format(a.due) : ''), href: role === 'student' ? 'assignment-detail.html?id=' + a.id : 'assignments.html' };
        });
        if (asgItems.length) groups.push({ label: 'Assignments', items: asgItems });
        var quizItems = (parts[2] || []).slice(0, 4).map(function (q) {
          return { icon: 'quizzes', title: q.title, sub: q.course || '', href: role === 'student' ? 'quiz-attempt.html?id=' + q.id : 'quizzes.html' };
        });
        if (quizItems.length) groups.push({ label: 'Quizzes', items: quizItems });
        var peopleItems = (parts[3] || []).slice(0, 4).map(function (p) {
          return { icon: 'profile', title: p.name, sub: p.sub, href: personHref(p) };
        });
        if (peopleItems.length) groups.push({ label: 'People', items: peopleItems });
        return groups;
      });
    }

    function close() {
      menu.classList.remove('open');
      input.setAttribute('aria-expanded', 'false');
      active = -1;
    }
    function paintActive() {
      var rows = menu.querySelectorAll('[data-search-go]');
      rows.forEach(function (r, i) { r.classList.toggle('active', i === active); });
      if (rows[active] && rows[active].scrollIntoView) {
        rows[active].scrollIntoView({ block: 'nearest' });
      }
    }
    function render(groups) {
      items = [];
      groups.forEach(function (g) { g.items.forEach(function (it) { items.push(it); }); });
      active = items.length ? 0 : -1;
      if (!groups.length) {
        menu.innerHTML = '<div class="search-empty">No matches for &ldquo;' +
          F.esc(input.value.trim()) + '&rdquo;</div>' +
          '<div class="search-hint">Press Enter for course results</div>';
      } else {
        menu.innerHTML = groups.map(function (g) {
          return '<div class="search-group">' + F.esc(g.label) + '</div>' + g.items.map(function (it) {
            var idx = items.indexOf(it);
            return '<button class="search-row' + (idx === active ? ' active' : '') + '" data-search-go="' + idx + '" role="option">' +
              '<span class="search-row-icon">' + I.icon(it.icon, 16) + '</span>' +
              '<span class="search-row-text"><span class="search-row-title">' + F.esc(it.title) + '</span>' +
              (it.sub ? '<span class="search-row-sub">' + F.esc(it.sub) + '</span>' : '') + '</span>' +
            '</button>';
          }).join('');
        }).join('') + '<div class="search-hint">Enter to open &middot; Esc to close</div>';
      }
      menu.querySelectorAll('[data-search-go]').forEach(function (row) {
        row.addEventListener('mousedown', function (e) {
          e.preventDefault();
          var it = items[parseInt(row.getAttribute('data-search-go'), 10)];
          if (it) window.location.href = it.href;
        });
      });
      menu.classList.add('open');
      input.setAttribute('aria-expanded', 'true');
    }

    input.addEventListener('input', function () {
      var term = input.value.trim();
      if (timer) clearTimeout(timer);
      if (term.length < 2) { close(); return; }
      menu.innerHTML = '<div class="search-empty">Searching&hellip;</div>';
      menu.classList.add('open');
      timer = setTimeout(function () {
        var runId = ++seq;
        fetchResults(term.toLowerCase(), runId).then(function (groups) {
          if (groups) render(groups);
        });
      }, 250);
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { close(); input.blur(); return; }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (!items.length) return;
        e.preventDefault();
        active = e.key === 'ArrowDown'
          ? (active + 1) % items.length
          : (active - 1 + items.length) % items.length;
        paintActive();
        return;
      }
      if (e.key === 'Enter') {
        var term = input.value.trim();
        if (active >= 0 && items[active]) window.location.href = items[active].href;
        else if (term) window.location.href = 'courses.html?q=' + encodeURIComponent(term);
      }
    });
    input.addEventListener('blur', function () {
      setTimeout(close, 150);
    });
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        input.focus();
      }
    });
  }

  function closeAllDropdowns() {
    document.querySelectorAll('.dropdown-menu.open, .user-menu-dropdown.open').forEach(function (m) { m.classList.remove('open'); });
    var t = document.querySelector('.user-menu-trigger');
    if (t) t.setAttribute('aria-expanded', 'false');
  }

  function renderNotifMenu(menu) {
    return API.notifications.list().then(function (all) {
      renderNotifMenuList(menu, (all || []).slice().sort(function (a, b) {
        return new Date(b.time) - new Date(a.time);
      }).slice(0, 4));
    });
  }

  function renderNotifMenuList(menu, list) {
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
        API.notifications.markRead(btn.getAttribute('data-notif-read')).then(function () {
          menu.classList.remove('open');
          return syncUnread();
        });
      });
    });

    if (list.some(function (n) { return !n.read; })) {
      var markAll = document.createElement('div');
      markAll.style.cssText = 'border-top:1px solid var(--color-border-light);';
      markAll.innerHTML = '<button class="dropdown-item" style="justify-content:center;color:var(--color-primary);" id="mark-all-read">Mark all as read</button>';
      menu.appendChild(markAll);
      markAll.querySelector('#mark-all-read').addEventListener('click', function () {
        API.notifications.markAllRead().then(function () {
          menu.classList.remove('open');
          return syncUnread();
        }).then(function () {
          LH.toast.info('Notifications', 'All notifications marked as read.');
        });
      });
    }
  }

  function syncUnread() {
    return API.notifications.unreadCount().then(function (count) {
      paintUnread(count || 0);
    });
  }

  function paintUnread(count) {
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

  /* Header toggle cycles: full -> icon rail -> hidden -> full (persisted). */
  shell.toggleSidebar = function () {
    if (window.innerWidth <= 1024) {
      var sb = document.getElementById('sidebar');
      if (sb && sb.classList.contains('open')) shell.closeDrawer();
      else shell.openDrawer();
      return;
    }
    var bar = document.getElementById('sidebar');
    var state = 'full';
    if (bar && bar.classList.contains('collapsed')) {
      bar.classList.remove('collapsed');
      document.body.classList.add('sidebar-hidden');
      state = 'hidden';
    } else if (document.body.classList.contains('sidebar-hidden')) {
      document.body.classList.remove('sidebar-hidden');
      state = 'full';
    } else {
      if (bar) bar.classList.add('collapsed');
      state = 'rail';
    }
    try { localStorage.setItem('learnhub-sidebar', state); } catch (e) { /* ignore */ }
    hideRailTip();
  };

  shell.applyStoredSidebar = function () {
    var stored = null;
    try { stored = localStorage.getItem('learnhub-sidebar'); } catch (e) { /* ignore */ }
    /* Migrate the old two-state value. */
    if (stored === 'shown') stored = 'full';
    var bar = document.getElementById('sidebar');
    if (bar) bar.classList.toggle('collapsed', stored === 'rail');
    document.body.classList.toggle('sidebar-hidden', stored === 'hidden');
  };

  /* macOS-style hover popup for the collapsed rail (fixed-position: never clipped). */
  var railTip = null;
  var railTipTimer = null;

  function railTipEl() {
    if (!railTip) {
      railTip = document.createElement('div');
      railTip.id = 'sidebar-tooltip';
      railTip.setAttribute('role', 'tooltip');
      document.body.appendChild(railTip);
    }
    return railTip;
  }

  function hideRailTip() {
    if (railTipTimer) { clearTimeout(railTipTimer); railTipTimer = null; }
    if (railTip) railTip.classList.remove('show');
  }

  function wireRailTip() {
    var bar = document.getElementById('sidebar');
    if (!bar || bar.getAttribute('data-rail-tip')) return;
    bar.setAttribute('data-rail-tip', '1');

    bar.addEventListener('mouseover', function (e) {
      var item = e.target && e.target.closest ? e.target.closest('.nav-item') : null;
      var collapsed = bar.classList.contains('collapsed');
      if (!item || !collapsed || !bar.contains(item)) { hideRailTip(); return; }
      var labelEl = item.querySelector('.nav-item-text');
      var label = labelEl ? labelEl.textContent.trim() : (item.getAttribute('aria-label') || '');
      if (!label) return;
      var tip = railTipEl();
      var badge = item.querySelector('[data-sidebar-unread] .badge, [data-sidebar-unread].badge');
      var count = badge ? badge.textContent.trim() : '';
      tip.innerHTML = '<span></span>' + (count ? '<span class="tooltip-count">' + count + '</span>' : '');
      tip.querySelector('span').textContent = label;
      var r = item.getBoundingClientRect();
      tip.style.top = Math.max(8, r.top + r.height / 2 - 17) + 'px';
      tip.style.left = (r.right + 12) + 'px';
      if (railTipTimer) clearTimeout(railTipTimer);
      railTipTimer = setTimeout(function () { tip.classList.add('show'); }, 120);
    });

    bar.addEventListener('mouseout', function (e) {
      var to = e.relatedTarget;
      if (to && bar.contains(to) && to.closest && to.closest('.nav-item')) return;
      hideRailTip();
    });
    bar.addEventListener('scroll', hideRailTip, true);
    document.addEventListener('click', hideRailTip, true);
  }

  shell.logout = function () {
    API.auth.logout();
    window.location.href = '../auth/login.html';
  };

  /* Instant session sync: after any mutation that changes the signed-in
     user (rename, photo, role), refresh the cached user and repaint the
     sidebar + header in place — no page reload. Safe on every page:
     no-ops where there is no shell or no session. */
  shell.syncSession = function () {
    try {
      if (!document.getElementById('sidebar')) return false;
      var fresh = API.auth.current();
      if (!fresh) return false;
      user = fresh;
      renderSidebar();
      renderHeader().then(function () {
        try { return syncUnread(); } catch (e) { /* ignore */ }
      }, function () { /* header keeps its fallback */ });
      return true;
    } catch (e) { return false; }
  };

  shell.init = function () {
    var u = shell.requireAuth();
    if (!u) return false;
    user = u;

    try { LH.theme.init(); } catch (e) { /* ignore */ }

    try { shell.applyStoredSidebar(); } catch (e) { /* ignore */ }
    try { renderSidebar(); } catch (e) {
      if (window.console) console.error('[LearnHub] Sidebar render error:', e);
    }
    try { wireRailTip(); } catch (e) { /* ignore */ }

    /* Header fills in async and must NEVER block page content: a slow
       notifications call previously froze the whole page (blank sidebar,
       header and card bodies) especially on rapid refreshes. */
    function wireStatic() {
      try {
        var overlay = document.getElementById('sidebar-overlay');
        if (overlay) overlay.addEventListener('click', shell.closeDrawer);
      } catch (e) { /* ignore */ }
      try {
        document.addEventListener('keydown', function (e) {
          if (e.key === 'Escape') {
            shell.closeDrawer();
            closeAllDropdowns();
          }
        });
      } catch (e) { /* ignore */ }
    }
    try {
      renderHeader().then(function () {
        try { return syncUnread(); } catch (e) { /* ignore */ }
      }).catch(function () { /* header already rendered with fallback */ });
    } catch (e) { /* ignore */ }
    wireStatic();
    return true;
  };

  function logoMark() {
    return '<svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden="true"><rect x="1" y="1" width="30" height="30" rx="8" fill="var(--color-primary)"/><path d="M9 23V9l14 6-14 8z" fill="#fff"/></svg>';
  }

  shell.logoMark = logoMark;

})(window.LH);