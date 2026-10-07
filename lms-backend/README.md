# LearnHub LMS Backend — Phase 0 bootstrap

> **Seed-data policy (locked, enforced by build):** demo content lives in
> `src/main/resources/db/seed/` and migrates ONLY in the default (dev/test)
> profile, so the UI matches the frozen frontend on switch-over. The `prod`
> profile (`--spring.profiles.active=prod`) uses `db/migration/` schema only —
> production starts with **zero demo rows**. Verified 25 Sep 2026 against a
> fresh `learnhub_clean` DB (all counts 0). Never treat seed rows as real data;
> never build features that depend on them.

Spring Boot 3.2.5 REST API for the frozen vanilla-JS frontend (`../lms-frontend/`).
Plan: `../BACKEND_IMPLEMENTATION_PLAN.md` §3–§5. Spec: `../lms-frontend/report2.md` §9.

Phase 0 delivers: `GET /api/health → {ok:true}` + Swagger UI + MySQL + Flyway baseline + JWT/security skeleton.

## Prereqs (this machine)

- Java 25 LTS (`java -version`), Maven 3.9.14 (`mvn -version`), MySQL 8.0
- Build targets bytecode 17 (Spring Boot 3.2.x safe; runs on JDK 25)

## DB setup (once)

```powershell
# PowerShell — create the database (password prompt for root)
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS learnhub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Connection string auto-creates the DB too (`createDatabaseIfNotExist=true`), so the step above is optional but recommended.
Default user is `root` with empty password. To use a password:

```powershell
$env:DB_PASSWORD="your-root-password"
```

JWT secret (dev default in `application.yml` is fine for Phase 0; set a 64-char secret in prod):

```powershell
$env:JWT_SECRET="change-me-64-char-min-..."
```

## Run (MySQL — primary, per plan §3/§5)

```powershell
cd E:\LearningManagementSystem\lms-backend
$env:DB_PASSWORD="your-root-password"
mvn spring-boot:run
```

## Run (H2 fallback — no MySQL password needed, verified 24 Sep 2026)

Used when MySQL credentials are unavailable. Same code, same health contract:

```powershell
cd E:\LearningManagementSystem\lms-backend
java -jar target\lms-backend-0.0.1-SNAPSHOT.jar `
  "--spring.datasource.url=jdbc:h2:mem:learnhub-smoke;DB_CLOSE_DELAY=-1;MODE=MySQL" `
  "--spring.datasource.username=sa" "--spring.datasource.password=" `
  "--spring.datasource.driver-class-name=org.h2.Driver" `
  "--spring.jpa.hibernate.ddl-auto=none" `
  "--spring.jpa.database-platform=org.hibernate.dialect.H2Dialect" `
  "--spring.flyway.enabled=false"
```

## Smoke tests (verified live 24 Sep 2026 — MySQL mode, DB `learnhub` on MySQL 8.0.45)

```powershell
$env:DB_PASSWORD="your-root-password"
java -jar target\lms-backend-0.0.1-SNAPSHOT.jar
curl.exe http://localhost:8080/api/health
# → {"ok":true}
curl.exe http://localhost:8080/actuator/health
# → {"status":"UP"}
curl.exe http://localhost:8080/api/users/me
# → {"ok":false,"error":"Unauthorized"}  (security gate works; endpoint lands in Phase 2)
```

Also verified: Swagger UI 200, `/v3/api-docs` lists `/api/health`, CORS preflight 200,
Flyway baseline applied (`flyway_schema_history` shows `<< Flyway Baseline >>` v1).

> ⚠️ The `learnhub` DB already contains tables from another project
> (`users, courses, assignments, quizzes, ...`). Flyway therefore baselined instead of
> running `V1__baseline.sql`. **Before Phase 1, drop those foreign tables** (or start a
> fresh schema) so the Phase 1 `V1__schema.sql` migration applies cleanly.

- Swagger UI: http://localhost:8080/swagger-ui.html (redirects to `/swagger-ui/index.html`, 200 verified)
- OpenAPI JSON: http://localhost:8080/v3/api-docs (lists `LearnHub LMS API` + `/api/health`)
- Actuator: http://localhost:8080/actuator/health
- CORS preflight verified (`Access-Control-Allow-Origin` echo + exposes `Authorization, X-Total-Count`)

## Notes

- Lombok is deliberately absent: no Lombok release supports javac 25 yet, and Phase 0
  code is Lombok-free (records + explicit constructors). Re-add it in Phase 1+ once a
  JDK-25-compatible release exists (or stay Lombok-free — MapStruct/manual mappers allowed per plan §3).
- `mvn test` uses an H2 profile (`src/test/resources/application.yml`) so it is green without
  MySQL; runtime defaults remain MySQL (`src/main/resources/application.yml` + `V1__baseline.sql`).

## Tests

```powershell
mvn test
```

Phase 0 test: `HealthControllerTest` — health is public and returns `{ok:true}`.

## Layout (Phase 0 slice of plan §4)

```
src/main/java/com/learnhub/lms/
  LmsApplication.java
  config/{SecurityConfig,CorsConfig,JwtProps,OpenApiConfig,PasswordConfig}.java
  security/{JwtAuthFilter,JwtService,AppUserDetailsService}.java
  common/{ApiException,GlobalExceptionHandler,PageResponse}.java
  health/HealthController.java
src/main/resources/{application.yml,db/migration/V1__baseline.sql}
```

Phase 1 adds entities + V2 seeds; Phase 2 fills in real auth on top of the `JwtService`/filter skeleton above.

## Phase 1 — Database & entities (done, 24 Sep 2026)

- `db/migration/V2__schema.sql`: 19 tables per plan §6.1 (users … stored_files),
  FKs `ON DELETE CASCADE` / `SET NULL` per §10.8, plus `UNIQUE(assignment_id,
  student_id)` on submissions (§10 one-row-per-student rule).
- `db/migration/V3__seed_demo.sql`: frontend parity seeds with **relative dates**
  (`DATE_ADD(NOW(), …)`) so due/overdue rules never go stale — verified live:
  users 8, courses 6, assignments 6, quizzes 5, quiz_questions 42, grades 10,
  modules 42, lessons 57, enrollments 24, lesson_progress 38, submissions 5,
  announcements 2, notifications 7, attendance 12+12, activity_events 11.
- 19 JPA entities + 19 repositories, Lombok-free; native MySQL ENUMs mapped with
  `columnDefinition` so `ddl-auto: validate` passes (enums also generate on H2).
- Documented deviations (FK-forced): cs320/cs330 `instructor_id` NULL (104/105 are
  directory-only names; `instructor_name` kept); s3 reassigned to student 202
  (Sneha/204 is not a user); pre-existing foreign tables in `learnhub` dropped
  with approval before migrating.
- Tests: `Phase1DataTest` (course cascade delete, enroll-once + progress
  uniqueness, legacy NULL status round-trip) + `HealthControllerTest` — all green.

## Phase 2 — Auth, users, security (done, 24 Sep 2026)

- `POST /api/auth/login` (BCrypt; wrong password → `200 {ok:false}`, suspended →
  `403 {ok:false,suspended:true}`), `GET /api/auth/me`, `POST /api/auth/logout`.
- `GET/PATCH /api/users/me`, `POST /api/users/me/password` (current required),
  `GET /api/users` (ADMIN, filters + `X-Total-Count`), `GET /api/users/:id`
  (ADMIN | self | faculty-of-student), `PATCH /api/users/:id/role|status`
  (ADMIN + `activity_events` audit), `GET /api/students|faculty` (ADMIN, live
  attendance/GPA/learner counts).
- `JwtAuthFilter` is DB-backed: unknown users stay anonymous, suspended users get
  `403 {suspended:true}` on every call; `Authz` helper centralizes role/ownership
  checks (`Authz.requireOwnerOrAdmin` etc. ready for Phase 3+).
- Verified live on MySQL: student login → token, wrong-password `200 {ok:false}`,
  `/users/me` profile, admin `?role=student` (4 rows + header), rename + restore,
  suspend → `403 {suspended:true}` → reactivate (seeds restored byte-clean).
- Tests: `Phase2AuthTest` (12 tests) + Phase 0/1 suites — `mvn test` 17/17 green.

## Phase 3–4 — Courses, content, enrollments, progress (done, 25 Sep 2026)

- Courses: catalog search (`query` = name/code/instructor/category), create
  (faculty/admin, defaults `draft`, URL-safe `c7…` ids), detail (+live
  `modulesTotal`), PATCH, publish/draft toggle, delete with full cascade,
  `GET /mine` (faculty owned / student enrolled+progress / admin all), roster.
  Students never see drafts; draft detail is owner/admin/enrolled-only;
  legacy-NULL status reads as published.
- Modules/lessons: ordered CRUD, transactional reorder (`order_index=idx+1`,
  two-phase rewrite so the unique constraint never collides), unenrolled
  students get `locked:true` modules with hidden materials.
- Enrollments: student-only enroll (`400 already enrolled / not open`),
  `students_count` bump, roster/progress persistence with the exact
  `round(completed/total*100)` formula; `POST /lessons/:id/complete` is
  idempotent (second call returns identical progress).
- Verified live on MySQL: create → modules/lessons → reorder → publish →
  enroll → complete ×2 (`{total:2,completed:1,percent:50}` twice) → delete,
  residue check back to seed counts (6/24/38/42/57).
- Cross-cutting fix: every entity now defaults `created_at/updatedAt` in
  `@PrePersist` (Hibernate sends explicit NULLs, defeating MySQL column
  defaults — this 500'd module creation until fixed).
- Tests: `Phase34CoursesTest` (8 tests) — `mvn test` 25/25 green.

## Phase 5 — Assignments, submissions, grades (done, 25 Sep 2026)

- Assignments: course list (due DESC, nulls last), create (`a7…` ids,
  `maxMarks|maxScore` alias), detail, PATCH, cascade delete, student
  `GET /students/me/assignments[?status=]` with `ownStatus`
  (graded&gt;submitted&gt;overdue&gt;not-started).
- Submissions: upsert submit with exact guards (`not enrolled`, `past due`),
  resubmit-before-due resets grading fields **and** clears the grade row;
  inbox (submittedAt DESC), course submissions (`?ungraded=1`), own-only list.
- Grading validates the pair (`Submission does not belong…`) and score range,
  then writes **both** the submission and a `grades` row (unify fix from day one).
- Gradebook aggregation (`students × assignments → cells`) + own grades +
  `{average,count,best,recent[5]}` summary.
- Verified live on MySQL: submit → grade 8/10 → grades/summary/gradebook all
  show it (summary count 11 during smoke) → delete assignment + grade row →
  residue check back to seeds (6/5/10).
- Tests: `Phase5AssignmentsTest` (6 tests) — `mvn test` 31/31 green.

## Phase 6 — Quizzes & attempts (done, 25 Sep 2026)

- Quiz CRUD (owner/ADMIN, `q…` ids), full question replace-all (validated
  4-options/answer 0-3), per-student `taken/attempts/bestScore` derivations
  (never a global flag).
- `GET /:id/questions`: full payload (with answer) for owner/ADMIN,
  answer-stripped for enrolled students (leak-tested).
- `POST /:id/attempts` (NEW): enrollment + due + attemptsMax guards, server-side
  positional scoring, persisted attempt, best-kept `grades` row (`type=quiz`),
  `{score,total,pct,grade(bestScore "x/y"),attempts}` response.
- Verified live on MySQL: owner reads answers → student stripped view → attempt
  q1 10/10/A → history → grade row `Trees & BST 10/10 quiz` in DB → cleanup to
  0 attempts / 10 grades.
- Cross-DB fix: H2 binds String→JSON as a quoted literal while MySQL stores the
  document — option parsing now unwraps one level so both round-trip.
- Tests: `Phase6QuizzesTest` (4 tests) — `mvn test` 35/35 green.

## Phase 7 — Attendance, announcements, notifications, admin, files (done, 25 Sep 2026)

- Attendance: student per-course/overall/history aggregates from records;
  faculty take-session upsert per (course, date); class roster sheet + averages.
- Announcements (createdAt DESC, author=JWT) with fan-out notifications to all
  enrolled students; notifications: list/unread-count/mark-read/mark-all (all
  strictly per-JWT-user).
- Admin: live statistics/activity (latest 50)/reports (enrollment, monthly
  actives, pass-rate ≥40%, program split), CSV export (users/grades/enrollments),
  settings store, guarded `POST /admin/reset-demo` (wipes demo tables + drops
  the V3 history row so restart reseeds; needs `APP_DEMO_RESET_ENABLED`, prod
  must set false), per-student progress/risk rows. Faculty: pending inbox +
  live activity feed.
- Files: `POST /api/uploads` (pdf/mp4/images/zip, 10 MB, `./uploads/<uuid>-…`
  + `stored_files` row, returns `{fileId,url}`), `GET /api/files/:id`
  (owner/admin/enrolled-or-faculty gate).
- `openapi.json` (67 paths) committed from the live server.
- Verified live on MySQL: session → overall 9/12→10/13, announcement → unread
  4→5, statistics/CSV, upload 201 + download 200; residue check back to seeds
  (12/12/2/7/0 files, uploads/ empty).
- Tests: `Phase7MiscTest` (5 tests) — `mvn test` 40/40 green.

## Next: frontend wiring (plan §14)

Done — see Wiring section below.

## Access from other devices on the same WiFi

This PC's LAN IP is `192.168.10.4` (if it ever changes, run
`Get-NetIPAddress -AddressFamily IPv4` and use the Wi-Fi address).

- App: `http://192.168.10.4:8000/pages/auth/login.html` (any device on the WiFi)
- API: `http://192.168.10.4:8080/api` (auto-selected by the frontend)
- Servers needed: backend jar + `E:\LearningManagementSystem\serve.py` (binds 0.0.0.0).
- ONE-TIME Windows step (admin PowerShell): allow ports through the firewall —
  `netsh advfirewall firewall add rule name="LearnHub Backend" dir=in
  action=allow protocol=TCP localport=8080 profile=private` (same for 8000).
  Without this, other devices cannot connect.

## Wiring — frontend ↔ backend integrated (done, 25 Sep 2026)

- `lms-frontend/js/api/index.js`: `USE_MOCK` flag (default 1 = offline demo,
  `?live=1` flips per page-load) + live `fetch()`+JWT layer overriding every
  `LH.api.*` method with mock-shape aliasing (instructor/students/modules/short,
  course, lastActive, notification time/course, grade max/date) and local-ISO
  date normalization. Mock methods return Promises too (local-only session
  helpers stay sync), so call sites are identical in both modes.
- Converted all 16 call-site files to async/await (shell, login, profile,
  4 student + 6 faculty + 3 admin pages, app bootstrap handles sync/async
  renderers). `node --check`: 45/45 files clean. `DB.*`/`M.*` direct reads stay
  on the mock cache (phased migration per plan §13; live mode documented).
- Integration proof: temp Node harness loading the REAL frontend files —
  38/38 mock-mode + 38/38 live-mode (login, catalog, enroll, submit→grade,
  quiz attempt with server scoring, attendance, notifications, admin,
  profile), seeds restored byte-clean afterwards.
- Post-wiring fixes (25 Sep 2026, from live user testing):
  - Editor false "Access denied": user/session was snapshotted before login
    loaded + editor used the mock cache; now resolved post-auth via API.
  - Dynamic completion: `GET /courses/:id/progress` now also returns
    `completedLessonIds`; student course-details enrolls/progresses/completes
    through the API with a cached state snapshot (verified 13/19→14/19 live).

## Full-live frontend (done, 26 Sep 2026 — no more mock/live mixing)

- `lms-frontend/js/api/index.js` is single-mode: every `LH.api.*` method talks
  to the backend (mock branch retired on disk; `USE_MOCK` flag removed). The
  backend must be running — every page is 100% backend-driven, nothing mixes.
- Converted all remaining pages: student catalog/dashboard/progress/grades/
  assignments/quiz list/server-scored quiz attempts/course tabs; faculty
  dashboard/inbox/gradebook (gradebook endpoint)/course details/attendance
  take-sheet/risk view; admin directories/reports/settings (persisted).
- New API helpers added both sides where pages needed them: quiz `attempt`,
  `gradebook`, course `roster`/`studentProgress`, attendance
  `takeSession`/`classView`, admin `getSettings`/`patchSettings`/`resetDemo`.
- Proof: Node harness against the real frontend files **44/44 live**
  (incl. answer-leak check, gradebook/roster shapes, settings round-trip);
  `node --check` 45/45; `mvn test` 40/40; seeds byte-clean.
- Faculty fixes, round 1 (26 Sep 2026, materials + silent failures):
  - Add-material silent death: editor sent human sizes (`'128 KB'`) into a
    numeric `sizeBytes` field (HTTP 400, no error shown) — live layer now
    parses `128 KB → 131072` (proven), plus error toasts on failure.
  - Quiz form never opened: `showSheet` read `.host` off an un-awaited
    `buildSheet()` promise (TypeError, silent) — now awaited.
  - Assignment publish/delete chains now surface errors via toast instead of
    failing silently; endpoint itself verified 201 live.
- Faculty fixes, round 2 (26 Sep 2026, publish flows):
  - Assignment publish always said "Select a course": the validator collects
    values by input `name`, but the form only validated `title` — other fields
    were never collected. Submit now reads course/due/points/desc by id.
  - Quiz form dead on open: `showSheet` used an un-awaited `buildSheet()`
    result (verified fixed); full include→questions chain proven live.
  - Global `unhandledrejection` safety net in `app.js`: silent promise
    failures now surface as error toasts instead of dead clicks.
- Dynamic materials (26 Sep 2026): lessons gained nullable `file_url`
  (V4 migration) for uploads/URLs; editor Add-material is now a dialog —
  PDF/video upload (via `/api/uploads`, 10 MB) or YouTube/web-link URL —
  proven live (upload → lesson with fileUrl → download 200 → cleaned).
- Faculty-authored outcomes (26 Sep 2026): `outcomes_json` on courses
  (V5 migration); editor "What you'll learn" block with add/remove rows,
  saved on create/update; student details render them (fallback text when
  empty). Proven live (create → PATCH → delete, cleaned). `mvn test` 43/43.
- Course thumbnails (26 Sep 2026): `thumbnail_url` on courses (V6); editor
  cover picker uploads images (10 MB) + live preview; cards show the cover
  (graceful fallback); `GET /files/:id` also accepts `?token=` so `<img>`
  tags can load (prod: prefer short-lived URLs). Proven live
  (upload → PATCH → token download 200 → cleared). `mvn test` 44/44.
- Student catalog honesty (26 Sep 2026, spotted via screenshot): cards showed
  `0/0 modules` (stored percent used without totals) and `Updated just now`
  (DTO lacked timestamps) — cards now always read live progress and the DTO
  carries `updatedAt/createdAt`. Verified visually in headless Chrome.
- Profile avatars, all roles (26 Sep 2026): `POST /users/me/avatar`
  (images only, 5 MB) + `avatarUrl` on users; profile Change-photo wired;
  course cards/details/shell show instructor & own photos with initials
  fallback; `LH.api.fileUrl()` builds tokenized URLs. Proven live
  (upload → me → token download 200 → reverted). `mvn test` 45/45.
- Live notification triggers (26 Sep 2026): assignment published, grade
  published (graded student only) and quiz opened now fan out alongside
  announcements via a shared helper. `mvn test` 47/47; proven live
  (unread 4→5→6→7, then cleaned).
- Student banner covers (26 Sep 2026): details banner + code box show the
  faculty-set cover for every course (shared `UI.coverUrl` helper, graceful
  fallback); unenrolled overview shows the true lesson total again.
- Dead-UI audit fixes (26 Sep 2026): admin settings inputs had no `name`s so
  saving persisted nothing (named now; toggles save real booleans); editor
  students tab was 4 hardcoded rows (now live roster + detail modal); profile
  password button opened a "not enabled" dead-end (now a real change-password
  dialog on the existing endpoint). Proven live incl. password revert.
- Assignment due-time + attachments (26 Sep 2026): view/edit dialog and the
  new-assignment form now take a due time (`D.toTimeInput` helper) and
  attach files (10 MB each, add/remove in-dialog); backend stores
  `attachments_json` via V7 (`@Lob` + LONGTEXT so H2 and MySQL both
  round-trip) surfaced on `AssignmentDto.attachments`; student detail page
  lists them with real download links. 48/48 tests green incl. new
  `attachmentsRoundTrip`; proven live (create -> GET -> PATCH -> GET).
- Real accounts (26 Sep 2026): public `POST /api/auth/register` creates a
  student + auto-login (409 on duplicate); email password-reset via V8
  `password_reset_tokens` (SHA-256 hash stored, 15-min single-use,
  always-`ok:true` against enumeration; SMTP via `spring.mail.*`, dev logs
  the link); admin `POST /api/users` creates any role with a temp password
  (audited). Frontend: register / forgot / reset pages, login links, admin
  Users "Add user" form. 51/51 tests green; proven live incl. replay
  rejection. Demo logins still work. Configure `spring.mail.host` (+ user,
  pass) and   `app.frontend-url` for real emails in production.
  Gmail SMTP live (26 Sep 2026): `SPRING_MAIL_HOST/PORT/USERNAME/PASSWORD`
  (+ `APP_MAIL_FROM`, `APP_FRONTEND_URL`) serve real reset emails; backend
  must start with these env vars in scope (per-user env set on this machine;
  the starter passes them explicitly on launch).
- Fresh zero-data app (26 Sep 2026): all demo rows wiped (users, courses,
  assignments, quizzes, enrollments, notifications, uploads); Flyway history
  kept so seeds never re-run; `demo-reset-enabled` now defaults to false;
  first start with an empty users table bootstraps one admin
  (`APP_BOOTSTRAP_ADMIN_EMAIL/PASSWORD`, default admin@learnhub.local /
  admin123 — change it). Old demo logins are dead.
- Modern login (26 Sep 2026): demo-account block removed; animated gradient
  blobs, staggered entrance, gradient heading, time-based greeting, rotating
  tips, Caps-Lock warning, loading spinner; night-mode toggle on all auth
  pages (existing `LH.theme`, system-aware + persisted). 51/51 green.
- Dynamic profile (26 Sep 2026): profile page dropped all hardcoded values
  (fake program/phone/location/member-since) — loads fresh `GET /users/me`,
  binds program/year/dept/title/phone/location per role, saves every field
  (previously phone/location edits were silently dropped), live status badge,
  last-active row;   `UserDto` derives `joinedLabel` ("Sept 2026") from
  `createdAt` when unset. 51/51 green.
- Enforced toggles (26 Sep 2026): `selfRegistration=false` → register 403;
  `maintenanceMode=true` → register + non-admin login 503, admins never
  locked out (new `PlatformSettings` reader, `ApiException.maintenance`);
  login page surfaces the server message. Proven live + new test.
- Real wipe, no demo-reset (26 Sep 2026): `POST /api/admin/reset-demo`
  deleted everywhere (endpoint, service, config, UI, docs); new
  `POST /api/admin/wipe` truncates all data tables + clears uploads, always
  keeping `app.primary-admin-email` (admin-only, student 403); settings UI
  requires typing WIPE. Primary admin learnhub.edu.in@gmail.com (also the
  fresh-DB bootstrap). 53/53 green incl. new wipe test.
- Refresh rotation (26 Sep 2026): 15-min JWT access + opaque 7-day refresh
  tokens (V9 `refresh_tokens`, hash-only storage); every refresh mints a
  new pair and revokes the old; reused-token burns the family
  (`noRollbackFor` — the burn commits before its own 401); `POST
  /api/auth/{refresh,logout,logout-all}`; frontend silently refreshes once
  on 401 then falls back to login; Remember-me picks local vs session
  storage; profile "Log out all devices". 54/54 green.
- Quiz builder (26 Sep 2026): sample questions removed (blank slate);
  option text + correct-answer radios now sync to state AND are collected
  from the DOM at publish with per-question validation (text, 4 options,
  ticked answer required) — previously the radio was decorative and stale
  samples published instead. Server guards proven live (blank → 400).
- Quiz View/Edit (26 Sep 2026): faculty View dialog per quiz — editable
  title/duration/attempts/due (new `PATCH /api/quizzes/:id`), live stats
  (attempts, average, best via new `GET /:id/attempts`), read-only answer
  key; question replacement blocked once attempts exist (score protection).
  `mvn test` 42/42.
- Grade modal invisible (26 Sep 2026): the hand-rolled overlay never received
  the `open` class, so CSS kept it at `opacity:0;visibility:hidden` — clicks
  opened a modal nobody could see (same invisible-CSS family as the quiz
  radios). Fixed + proven in headless Chrome: modal visible, save closes it,
  grade persists (s1 test row restored afterwards).
- Attendance calendar (26 Sep 2026): faculty page rebuilt around a month
  calendar (per-day % badges, today ring, future days disabled); any past/today
  session opens for view + re-save (upsert); new `GET sessions?date=` endpoint;
  future dates rejected server-side too (400). Roster shows live overall % via
  student-progress. `mvn test` 43/43.
- Course short-name fallback (26 Sep 2026): faculty-created courses have no
  `short_name`, so dropdowns/headers rendered "undefined" — `CourseDto` now
  falls back to the course name. `mvn test` 42/42.
- Submission attachments (26 Sep 2026): student submit now uploads real files
  (`LH.api.storage.upload` → `fileUrl` on the submission, resubmit-safe);
  grade dialog shows View-attached-file (token-authed fetch → PDF opens in a
  new tab, other types download). Proven in headless Chrome end-to-end
  (attach → submit → faculty dialog shows button); probe rows cleaned.
- Clean-production cutover: seeds moved to `db/seed/` (dev/test only);
  `--spring.profiles.active=prod` migrates schema only — proven on a fresh DB
  (history v1+v2, all counts 0), then dropped. Lesson learned: always
  `mvn clean package` after moving/deleting resources (stale copies otherwise
  survive in `target/classes` and defeat location filtering).

> PowerShell note: `curl.exe -d '{...}'` mangles JSON bodies in PS 5.1 (server
> sees malformed JSON). Use `Invoke-WebRequest -Method POST -ContentType
> "application/json" -Body '{...}'` for all POST/PATCH smoke tests instead.
