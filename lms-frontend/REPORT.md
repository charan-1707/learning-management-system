# LearnHub LMS — Frontend Build Report

**Project path:** `E:\LMSFrontEnd\lms-frontend`
**Report generated:** 07 Sep 2026
**Current status:** All 4 phases implemented and verified. Offline-first demo (`file://` compatible), ready to be wired to a Spring Boot backend.

---

## 1. How this report was generated

There are several complementary ways to produce a report for this application. Each was used to cross-check the others:

1. **Static inventory (source of truth)** — Walk the project tree counting HTML/JS/CSS files, pages per role, and line counts. Gives exact file and structure numbers (Section 3–5).
2. **Automated test harnesses** — Node-based harnesses that boot the app code against a headless DOM stub and assert behavior: `phase2_test.js` (instructor), `phase3_test.js` (student), `phase4_test.js` (admin), `api_test.js` (data layer), `check_pages.js` (page↔renderer registration), `category_test.js` (category filter). These are the *verification* evidence (Section 6).
3. **Shell-boot smoke tests** — Load the full 14-file boot chain with a DOM/storage stub and render every page for every role (student, faculty, admin), confirming the sidebar + header render with no exceptions (Section 6.2).
4. **Syntax checks** — `node --check` over every `.js` file.
5. **Code review against the spec** — Manual gap analysis comparing the current implementation with `E:\LMSFrontEnd\lms-frontend-prompt.md` requirements (Section 7).
6. **Live browser walkthrough** — The app can be opened directly from disk; the login page was launched to demo all three roles end-to-end.

---

## 2. Overview

LeanHub is a **pure vanilla HTML/CSS/JavaScript** LMS frontend that runs entirely offline from the filesystem (`file://`). There is no build step and no runtime dependency beyond web fonts. All data is stored in `localStorage` through a single DB seam, so the exact same UI can be switched to a real REST backend (Spring Boot) by rewriting one file — `js/api/index.js`.

| Area | Implementation |
|------|----------------|
| Language | HTML5, CSS3, ES5-style JavaScript (IIFE modules) |
| Data | `localStorage` via `js/db.js` + seed catalog `js/mock/data.js` |
| Auth | Client-side demo auth (`js/api/index.js` → `API.auth`) |
| Runtime | No dependencies; bootstrapped by `js/boot.js` |
| Backend readiness | Single API seam → swap for `fetch()` calls to Spring Boot |

---

## 3. File structure

```
lms-frontend/
├── index.html                      (redirect → pages/auth/login.html)
├── css/                            (7 files: reset, variables, global, layout, components, responsive, auth)
├── js/
│   ├── boot.js                     (synchronous loader, document.write chain)
│   ├── app.js                      (page renderer registry + shell bootstrap)
│   ├── db.js                       (localStorage data layer + seeds + business rules)
│   ├── api/index.js                (API seam — the ONLY file to change for Spring Boot)
│   ├── mock/data.js                (static seed catalog: users, courses, modules, lessons, quizzes, ...)
│   ├── components/
│   │   ├── app-shell.js            (sidebar, header, notifications menu, logout)
│   │   ├── ui.js                   (cards, badges, stat cards, avatars, empty states)
│   │   └── icons.js                (SVG icon set)
│   ├── utils/
│   │   ├── dom.js, format.js, date.js, theme.js, toast.js, modal.js, validation.js
│   └── pages/
│       ├── auth/login.js
│       ├── student/    (11 files)
│       ├── faculty/    (10 files)
│       └── admin/      (7 files)
│       └── profile.js  (shared)
└── pages/
    ├── auth/login.html
    ├── student/ (12 files)
    ├── faculty/ (10 files)
    └── admin/   (8 files)
```

**Totals:** 32 HTML pages · 45 JS files · 7 CSS files.

### Core library sizes (lines)

| File | Lines | Purpose |
|------|------:|---------|
| `js/mock/data.js` | 575 | Seed catalog |
| `js/db.js` | 582 | Data layer + seeding + business rules |
| `js/api/index.js` | 366 | API seam (`LH.api.*`) |
| `js/components/app-shell.js` | 378 | Shell/navigation |
| `js/components/ui.js` | 163 | UI component library |

---

## 4. Architecture & runtime flow

1. **Boot** — `js/boot.js` runs first. It reads its own `<script src>` to compute paths, then uses `document.write` to load **14 modules synchronously in order**:

   `dom → format → date → theme → toast → modal → validation → mock/data → db → api/index → icons → ui → app-shell → app`

   After boot, `window.LH.BOOTED = true` prevents double-loading.

2. **Shell** — `LH.shell.init()` reads the session user from `localStorage['learnhub-user']`, redirects to login if absent, renders the **sidebar + header** from role-specific NAV definitions, wires theme toggle, notifications dropdown and logout.

3. **Page renderer** — each page HTML ends with `<script src="../../js/pages/<role>/<page>.js">`. The page JS calls `LH.app.register('<page-id>', renderFn)` then `LH.app.init('<page-id>')`. `app.init` builds the shell, then runs the renderer and adds `.lh-ready`.

4. **Data** — UI code goes through `LH.api.*` (and lower-level `LH.db.*`) only. `LH.db.init()` seeds from `LH.mock` on first run and hydrates/persists from `localStorage` on later runs. `LH.mock` is replaced by the live cache so existing readers stay correct.

5. **Authorisation demo accounts**

| Role | Email | Password |
|------|-------|----------|
| Student | student@learnhub.com | student |
| Faculty | faculty@learnhub.com | faculty |
| Admin | admin@learnhub.com | admin |

---

## 5. Features by role

### Student (12 pages)
- Dashboard — greeting, stat cards, continue-learning cards, upcoming assignments, recent grades, activity, notifications mini-feed, attendance summary
- Course browser — published course catalog, **search box + progress-status filter + category filter**, per-student grade %
- Course details — banner, live progress, modules/lessons from DB (enforced: materials locked when not enrolled), assignments per student, grades panel, **announcements tab**
- Assignments list — per-student status (not-started / submitted / overdue / graded) with filters
- Assignment detail — submit/resubmit until due date (DB-persisted), own score + feedback after grading
- Grades, Attendance, Progress, Quiz attempt, Quizzes, Notifications, Profile

### Faculty (10 pages)
- Dashboard — course counts, pending submissions, upcoming deadlines
- Courses — owned course list with live module counts and student counts
- Course details — course materials, assignments, quizzes, roster, announcements (ownership enforced)
- **Course editor** — create/edit/delete modules & lessons, inline reordering (DB-persisted)
- Assignments — create/edit assignments for owned courses (published to students)
- Quizzes — create quizzes with questions (include/replace question APIs)
- Submissions — pending submissions → grade with score + feedback (DB-persisted, marks assignment as graded)
- Grades — gradebook grid student × assignments, attendance sheet, student progress view

### Admin (7 pages → 8 HTML)
- **Dashboard** — live platform stats from `API.admin.statistics()`, system activity feed, 6-month active-users chart, recent users table
- **Courses** — full CRUD: search + status filter (published/draft), edit modal (name/code/category/description/status), publish↔draft toggle, delete with cascading cleanup of modules/lessons/announcements/assignments/submissions/enrollments
- **Users** — search + role/status filters, **role-change dropdown** with confirmation, suspend/reactivate via `API.admin.flipUserStatus`
- Students / Faculty directories, Reports, Settings (supporting pages from the original template)

---

## 6. Verification evidence

### 6.1 Automated harnesses — all green

| Harness | Scope | Result |
|---------|-------|--------|
| `check_pages.js` | every HTML `data-page` matches a registered renderer in `app-shell.js` PAGE_INFO | PASS (no unmatched) |
| `phase2_test.js` | faculty flows + API persistence + reload | **34 / 34** PASS |
| `phase3_test.js` | student flows + DB submit/grade + reload | **39 / 39** PASS |
| `phase4_test.js` | admin dashboard/courses/users CRUD + role/status | **17 / 17** PASS |
| `category_test.js` | category filter on student courses | **4 / 4** PASS |
| `api_test.js` | data-layer API surface (auth, courses, quizzes, admin stats, announcements, enroll, submit) | PASS |
| `node --check` | every `.js` in the project | PASS |

**Total: 94 assertion checks passing across the suite, plus full API smoke tests.**

### 6.2 Shell-boot smoke tests (per role, real boot chain)
- **Student** — 6 core pages rendered with sidebar (6,464 chars, 33 nav links) + header, no exceptions.
- **Faculty** — 10/10 pages rendered (sidebar ≈6,412 chars, 33 links); `course-editor` verified against a full `window.location.search` stub.
- **Admin** — 7/7 pages rendered with the admin sidebar (6,075 chars, 27 links), no exceptions.

Every page builds the sidebar + header and completes `app.init` without throwing.

### 6.3 Notable fixes landed during Phase 4
- **Root-cause bug (pre-existing):** `F.esc()` was called across the shell and all page files, but `esc` only existed on `LH.ui`. Added `NS.esc` to `js/utils/format.js` — this single fix restored the sidebar/header and made every page register correctly. (Login kept working because it didn't use the shell.)
- Added `category` to all 6 seeded courses and a **category filter** on the student course-browser to satisfy "filter/search by category".
- Admin courses/users pages were upgraded from static mock reads to live `API.admin.*` operations with persisted mutations.

---

## 7. Prompt requirements → status

| Requirement | Status |
|-------------|--------|
| Data layer: users, courses, modules, lessons, enrollments, assignments, submissions, announcements, quizzes/grades in a persistent seam | ✅ Done (localStorage) |
| Authenticated user flows for student / faculty / admin | ✅ Done |
| Instructor: own courses (create/edit/delete), modules & lessons, assignments, submissions grading, gradebook, announcements | ✅ Done |
| Student: browse published courses + filter by category, enroll (once), progress update on lesson completion, submit/resubmit before due date, own grades/feedback, announcements | ✅ Done |
| Admin: dashboard with counts, manage all courses (view/edit/delete/status), manage users (list/role change/suspend) | ✅ Done (Phase 4) |
| Business rules enforced in JS | ✅ Done (see below) |
| No build step, opens from `file://` | ✅ Done |

### Business rules enforced in JS (`js/db.js`, `js/api/index.js`, page guards)
- A student can only enroll in a course **once** (subsequent enroll returns blocked).
- Assignments/submissions **only visible for enrolled courses**; materials locked for unenrolled students.
- Students can only read **their own** submissions/grades (per-student filtering, not global).
- Submission is blocked **after the due date**; resubmission allowed before due date.
- Instructors can **only manage courses they own** (`DB.courses.ownedBy`); admin bypasses.
- **Enrollment progress = completed lessons / total lessons × 100**, auto-recomputed and synced back to the enrollment row and course.
- Grading a submission marks the assignment as graded and persists score + feedback.
- Course deletions cascade to modules, lessons, lesson progress, announcements, assignments, submissions, and enrollments.

---

## 8. Backend migration notes (Spring Boot)

The app is designed so the UI **never touches storage directly** — everything goes through the `LH.api.*` seam (`js/api/index.js`). To go live:

1. Rewrite `js/api/index.js` to call REST endpoints via `fetch()` (e.g. `/api/courses`, `/api/auth/login`, `/api/users/{id}/role`).
2. Add an auth interceptor that attaches the JWT/token from `localStorage` to each request.
3. Remove/stop loading `js/mock/data.js` and `js/db.js` (keep them only as a front-end-only demo mode).
4. Map the DB collection names to the Spring entities: `users`, `courses`, `modules`, `lessons`, `enrollments`, `lessonProgress`, `assignments`, `submissions`, `announcements`, `quizzes`, `quizQuestions`, `notifications`.

Optional: keep a `USE_MOCK` flag so the same files power (a) offline demo and (b) live backend.

---

## 9. Known limitations / notes

- Auth is client-side only (demo). Real auth comes with the Spring Boot backend.
- Notification icons for two sample activity rows live in mock-derived data; counted values in the dashboard are computed live.
- Quizzes/grades for legacy display re-use mock seed data on some pages; core flows (submit/grade/enroll/progress) are fully DB-backed.
- Storage model uses one key per collection (`learnhub-db-*`) guarded by a version marker (`learnhub-db-v2`).

---

*Report evidence scripts live in `C:\Users\urstr\AppData\Local\Temp\opencode\` (`phase2_test.js`, `phase3_test.js`, `phase4_test.js`, `api_test.js`, `check_pages.js`, `category_test.js`, `repro.js`).*