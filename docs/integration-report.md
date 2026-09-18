# LearnHub — Frontend ↔ Backend Integration Report

Date: 2026-09-18
Scope: Single-deployable app — Spring Boot serves the vanilla JS frontend and the REST API from one origin (`http://localhost:8080`). The frontend runs in **live mode** against real MySQL data through the new `js/api/backend.js` adapter, with the in-browser mock store as an automatic fallback and as the in-memory view model.

---

## 1. Architecture

```
Browser
  └─ lms-frontend (vanilla JS, ES5)              ── served from / (target/classes/static)
      ├─ js/boot.js        synchronous boot chain; index.html → pages/auth/login.html
      ├─ js/mock/data.js   mock store (LH.mock)  ── READ view-model, hydrated in place
      ├─ js/db.js          in-browser DB cache (LH.db = LH.mock identity)
      ├─ js/api/backend.js NEW — live transport, hydrate, mutation hooks
      └─ js/api/index.js   API wrappers (+ live overrides for quizzes/submissions/notifications)
        │
        ▼ REST + JWT  (same origin)
Spring Boot (backend/, :8080)
  └─ Controller → Service → Repository → MySQL (learnhub)
```

### Flow

1. `app.init` → if a token exists: `LH.live.hydrate()` (async) **before** the page renderer runs.
2. `hydrate()` maps `GET /api/...` responses into the exact `LH.mock.*` shapes via named mappers, then `DB.replace('courses', …)` mutates the cache in place — so every existing page read (`LH.mock.courses`, `LH.db.lessons.getMod …`) transparently sees server data.
3. Page **mutations** keep calling the familiar store methods (`DB.create`, `DB.update`, `enroll`, `submit`, `markLessonComplete`, reorders). `arm()` replaces those methods so the original runs (updating the local cache) **and** a matching REST call fires.
4. Register/login go through live endpoints first (`LH.live.register/login`) and store `learnhub-token` (raw JWT) + `learnhub-user` in `localStorage`.

---

## 2. Live-mode detection & boot

| Concern | Behaviour |
|---|---|
| Probe | `GET /api/courses/published`; status `< 500` ⇒ `LH.live.enabled = true`. Network error ⇒ mock. |
| `LH.live.ready()` | awaits the probe (login pages use it to decide live vs mock). |
| Auth expiry | any 401 while holding a token ⇒ clear auth + redirect to login. |
| `app.init` | in live mode awaits `hydrate()`; calls `LH.shell.refreshUnread()`; then renderer. |
| Boot chain | `js/boot.js`: `mock/data.js → db.js → api/backend.js → api/index.js → …` |
| Mapper output | field names match the backend DTOs exactly (verified line-by-line); no mapper edits needed. |

---

## 3. Frontend action → endpoint map

### Auth & profile

| UI action | Frontend path | REST call |
|---|---|---|
| Register | `register.js` → `LH.live.register` | `POST /api/auth/register` (always creates STUDENT/ACTIVE) |
| Login | `login.js` `submitLive` → `LH.live.login` | `POST /api/auth/login` → redirect by role |
| Logout | `LH.live.logout` | clears local auth |
| Profile edit | `DB.update('users', …)` hook | `PUT /api/auth/me` `{email, name}` (email change ⇒ clear auth + re-login toast) |

### Hydration reads (by role)

| Data | Endpoint |
|---|---|
| Students (user list) | `GET /api/users` (ADMIN), `GET /api/users/{id}` (any authenticated) |
| Admin stats | `GET /api/admin/stats` |
| Courses (all / student / faculty) | `GET /api/courses`, `/api/students/me/courses`, `/api/instructors/me/courses` |
| Published catalog | `GET /api/courses/published` |
| Modules / lessons | `GET /api/courses/{id}/modules`, `GET /api/courses/{id}/lessons?studentId=` (principal forced for students) |
| Assignments / announcements / quizzes | `GET /api/courses/{id}/assignments`, `/api/courses/{id}/announcements`, `GET /api/quizzes/course/{courseId}` |
| Enrollments | `GET /api/enrollments/student/{id}` |
| Grades / attendance | `GET /api/students/me/grades`, `/api/students/me/attendance` |
| Notifications | `GET /api/users/{id}/notifications` |
| Submissions (faculty) | `GET /api/assignments/{id}/submissions` |

### CRUD & state changes

| UI action (unchanged page code) | Store method hooked | REST call |
|---|---|---|
| Create course | `DB.createCourse` | `POST /api/courses` |
| Create module | `DB.create('modules')` | `POST /api/courses/{cid}/modules` `{title}` |
| Create lesson | `DB.create('lessons')` | `POST /api/modules/{mid}/lessons` (`lessonRequest` maps `type`→`contentType`, content→`contentUrl`) |
| Rename/update module | `DB.update('modules')` | `PUT /api/modules/{id}` (full `ModuleRequest` composed from cached record) |
| Update lesson | `DB.update('lessons')` | `PUT /api/lessons/{id}` (full `LessonRequest` — backend requires non-null `contentType`) |
| Upload assignment | `DB.create('assignments')` | `POST /api/courses/{cid}/assignments` |
| Post announcement | `DB.create('announcements')` | `POST /api/announcements` `{courseId, facultyId, title, content}` |
| Publish quiz | `API.quizzes.include` override | `POST /api/courses/{cid}/quizzes` (`quizInclude`, questions with `correctOption`, `durationMinutes ≥ 1`) |
| Reorder modules | `DB.modules.reorder` | `PUT /api/courses/{cid}/modules/reorder` `[ids]` |
| Reorder lessons | `DB.lessons.reorder` | `PUT /api/modules/{mid}/lessons/reorder` `[ids]` |
| Edit course | `DB.update('courses')` (patch) | PATCH `/api/courses/{id}/status` (status-only) else `PUT /api/courses/{id}` |
| Delete course | `DB.remove('courses')` | `DELETE /api/courses/{id}` |
| Delete module/lesson/assignment/quiz/announcement | respective `DB.remove` | `DELETE /api/{…}` |
| Enroll | `DB.enrollments.enroll` | `POST /api/courses/{cid}/enroll` |
| Submit assignment | `DB.submit` | `POST /api/submissions` `{assignmentId, studentId, fileName}` |
| Complete lesson | `DB.markLessonComplete` | `POST /api/lessons/{id}/complete` `{studentId, completed:true}` |
| Start quiz | `LH.live.startQuiz` (`quiz-attempt.js` `beginLiveAttempt`) | `POST /api/quizzes/{qid}/attempts` `{studentId}` |
| Submit quiz | `LH.live.submitQuizAttempt` | `POST /api/attempts/{attId}/submit` `{answers:[{questionId, selectedOption}]}` → server score shown |
| Grade submission | `API.submissions.grade` override | `PATCH /api/submissions/{id}/grade` `{score, feedback}` |
| Mark notification read / all | `API.notifications.markRead/markAllRead` overrides | `PATCH /api/notifications/{id}/read`, `…/users/{uid}/read-all` |
| User role / status (admin) | `DB.update('users')` hook | `PATCH /api/users/{id}/role/{ROLE}`, `…/status/{STATUS}` |

All hooks fire only after the local (mock) operation succeeds; failures surface a toast on 4xx except 401/404, and data mutations already applied locally are overwritten/refreshed via `courseRefresh()`.

---

## 4. Backend changes made during integration

1. **Static serving** — `pom.xml` copies `../lms-frontend` to `target/classes/static`; `SecurityConfig` allows `/`, `/pages/**`, `/js/**`, `/css/**`, `/images/**` (and `/api/courses/published`) unauthenticated. `index.html` (new) redirects to the login page.
2. **Cascaded deletes rewritten (bug found by live smoke)** — `CourseServiceImpl.deleteCourse`, `QuizServiceImpl.deleteQuiz`, `ModuleServiceImpl.deleteModule`, `LessonServiceImpl.deleteLesson`, `AssignmentServiceImpl.deleteAssignment` previously used JPA entity removes for children. Under real (quiz-attempt) data, Hibernate's orphan-removal action queue issued an FK-nulling `UPDATE` on `quiz_answers` (`question_id NOT NULL`) → 409; after children were bulk-deleted, removing the parent via `entityManager.remove` caused `TransientObjectException`. All child and parent deletes are now bulk JPQL `@Modifying` queries (12 new repository methods), which bypass the entity action queue entirely.
3. **User roles come from the DB per request** (JWT filter reloads `User` by subject) — self-demotion to a non-privileged role immediately revokes access; the JWT role claim is advisory only.
4. Other verified contracts: `QuizAttemptStartRequest` requires `studentId` (frontend now sends it); `PUT /api/lessons/{id}` requires full `LessonRequest` (frontend composes it); `PUT /api/modules/{id}` likewise.

---

## 5. Verification results

| Check | Result |
|---|---|
| `mvn clean verify` | 37/37 tests, BUILD SUCCESS |
| Live API smoke (56 checks) | **56/56 passed** — register/login/409/401, `PUT /auth/me`, published catalog (anonymous), ADMIN promote via SQL + re-login, admin stats/users/courses, course CRUD + publish PATCH, module/lesson CRUD with exact request bodies, assignments, announcements, quiz publish (with questions) + attempt-view hides `correctOption`, enrollment + duplicate 409, lesson completion (progress flips), submission + grade, quiz attempt start/submit with **server-side scoring (2/2)**, notifications read / read-all, user role+status PATCH, faculty submissions list, gradebook contains assignment+quiz, enrollment check, course deletion (with all children, incl. a real quiz attempt). |
| Static serving | `/` (redirect index), `/pages/auth/login.html`, `/js/boot.js`, `/js/api/backend.js` all 200 from the jar. |

### Known limitations

- `mvn verify` integration tests use fixed emails against the dev MySQL DB and are **not idempotent** — wipe `learnhub` tables before a re-run (their first run creates the data; subsequent runs hit duplicate-key 409s). Repository tests use H2 and are unaffected.
- No seed data on a fresh DB: register a student, promote it (`UPDATE users SET role='ADMIN'`), then build content from that account.
- Module/lesson reorder, grading, and quiz publishing only reach the server when the corresponding store method is used by the UI; direct (non-Ui) local mutations are not pushed.
- A planned `?mock=1` override to force mock mode was not implemented; mode is chosen by the probe result.

---

## 6. Files

| File | Purpose |
|---|---|
| `lms-frontend/js/api/backend.js` | live transport/hydrate/hooks core |
| `lms-frontend/js/api/index.js` | live overrides: quizzes.include, submissions.grade, notifications.read |
| `lms-frontend/js/boot.js` | boot chain includes `api/backend.js` |
| `lms-frontend/js/app.js` | async hydrate-before-render |
| `lms-frontend/js/components/app-shell.js` | `shell.refreshUnread` |
| `lms-frontend/js/pages/auth/login.js` | live-first submit + mock fallback |
| `lms-frontend/js/pages/student/quiz-attempt.js` | live quiz attempt flow |
| `lms-frontend/pages/auth/register.html`, `js/pages/auth/register.js` | self-registration (STUDENT) |
| `backend/pom.xml` | frontend → static copy |
| `backend/.../security/SecurityConfig.java` | static + public catalog rules |
| `backend/.../repository/*.java` (8) | new bulk `@Modifying` delete methods |
| `backend/.../service/impl/{Course,Quiz,Module,Lesson,Assignment}ServiceImpl.java` | bulk-delete cleanup |