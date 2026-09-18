# LearnHub LMS — Learning Management System

LearnHub is a RESTful Learning Management System built with **Spring Boot 3**, **Spring Security + JWT**, and **MySQL**. It provides role-based course management, student enrollment, and the foundation for lessons, quizzes, assignments, attendance, and grading.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 21, Spring Boot 3.x |
| Security | Spring Security, JWT (stateless) |
| Persistence | Spring Data JPA / Hibernate, MySQL |
| Validation | Jakarta Bean Validation |
| Build | Maven |
| Tests | JUnit 5, Spring Boot Test (H2 in MySQL mode) |

## Project Structure

```
backend/
├── pom.xml
└── src/
    ├── main/java/com/learnhub/lms/
    │   ├── config/           # Bean configuration
    │   ├── controller/       # REST controllers (thin, delegate to services)
    │   ├── dto/              # Request/response records
    │   ├── enums/            # UserRole, UserStatus, CourseStatus, etc.
    │   ├── entity/           # JPA entities
    │   ├── exception/        # Custom exceptions + global handler
    │   ├── mapper/           # Entity → DTO mapping (EntityMapper)
    │   ├── repository/       # Spring Data repositories
    │   ├── security/         # JWT filter, SecurityUtils, SecurityConfig
    │   └── service/          # Business logic (interface + impl)
    └── test/java/com/learnhub/lms/   # Integration + repository tests
```

The architecture is **Controller → Service → Repository**. Controllers stay thin, services hold business rules and authorization checks, and repositories are Spring Data interfaces with derived queries. Users/owners are identified from the JWT (`@AuthenticationPrincipal` / `SecurityUtils`) — client-supplied IDs are never trusted for authorization.

## Roles

- **STUDENT** — browse courses, enroll/unenroll, track learning.
- **FACULTY** — create and manage their own courses (the role is named FACULTY; an *instructor*).
- **ADMIN** — manage users and any course.

## Authentication (Phase 1)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register (creates STUDENT), returns JWT |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Authenticated user profile |
| PUT | `/api/auth/me` | Update own profile (`name`, `email`, `password` — all optional) |

Protected endpoints require the header `Authorization: Bearer <jwt>`.

## Phase 2 — Course Management & Enrollment

### Entities & Relationships

- **User** (users) — `STUDENT`, `FACULTY`, `ADMIN` roles.
- **Course** (courses) — `title`, `code` (unique), `description`, `category`, `status` (`DRAFT`/`PUBLISHED`), `faculty` → `User` (the instructor). Only `PUBLISHED` courses can be enrolled.
- **Enrollment** (enrollments) — `student` → `User`, `course` → `Course`, `enrolledAt`, `progress`, `status`, `completedAt`. DB-level unique constraint `uk_enrollments_student_course (student_id, course_id)` prevents duplicate enrollment.

```
courses.faculty_id  ──→ users.id
enrollments.student_id ─→ users.id
enrollments.course_id ─→ courses.id
```

### Course APIs

| Method | Endpoint | Allowed | Notes |
|---|---|---|---|
| GET | `/api/courses` | STUDENT, FACULTY, ADMIN | All courses (catalog reads are public) |
| GET | `/api/courses/{id}` | Authenticated | 404 if not found |
| GET | `/api/courses/published` | Public | Published courses only |
| GET | `/api/courses/faculty/{facultyId}` | FACULTY, ADMIN | Filter by instructor |
| GET | `/api/courses/status/{status}` | FACULTY, ADMIN | Filter by status |
| POST | `/api/courses` | FACULTY, ADMIN | Instructor (faculty) taken from JWT, not the request body |
| PUT | `/api/courses/{id}` | Owner FACULTY or ADMIN | 403 for another instructor |
| PATCH | `/api/courses/{id}/status` | Owner FACULTY or ADMIN | Publish/unpublish |
| DELETE | `/api/courses/{id}` | Owner FACULTY or ADMIN | 403 for another instructor |

Course create/update request body:

```json
{
  "title": "Java Programming",
  "code": "JAVA101",
  "description": "Java from fundamentals",
  "category": "CS",
  "status": "DRAFT"
}
```

### Instructor & Student course lists

| Method | Endpoint | Allowed | Notes |
|---|---|---|---|
| GET | `/api/instructors/me/courses` | FACULTY, ADMIN | Courses taught by the caller (from JWT) |
| GET | `/api/students/me/courses` | STUDENT | Courses the caller is enrolled in (from JWT) |

### Enrollment APIs

| Method | Endpoint | Allowed | Notes |
|---|---|---|---|
| POST | `/api/courses/{courseId}/enroll` | STUDENT only | 201 on success; 409 if already enrolled; 404 if course missing; course must be PUBLISHED |
| DELETE | `/api/courses/{courseId}/enroll` | STUDENT only | 204; 404 if not enrolled |
| GET | `/api/courses/{courseId}/enrollment` | Authenticated | Returns `{"enrolled": true/false}` |

### Authorization Matrix

| Operation | STUDENT | Course owner (FACULTY) | Other FACULTY | ADMIN |
|---|:--:|:--:|:--:|:--:|
| Create course | — | ✔ | ✔ | ✔ (becomes instructor) |
| Update/delete/publish own course | — | ✔ | — | ✔ (any course) |
| View courses lists | ✔ | ✔ | ✔ | ✔ |
| Enroll / unenroll | ✔ | — | — | — |
| Teacher/student course lists | — | ✔ (own) | ✔ (own) | ✔ |

Rules are enforced in the service layer via `SecurityUtils.currentUser()` plus `@PreAuthorize`-style role checks in `SecurityConfig`:

```
AUTHENTICATED: GET /api/courses/*/enrollment
STUDENT:       POST /api/courses/*/enroll, DELETE /api/courses/*/enroll, GET /api/students/me/courses
FACULTY/ADMIN: GET /api/instructors/me/courses
FACULTY/ADMIN: POST/PUT/PATCH/DELETE /api/courses/**
```

### Error Handling

All errors return a consistent JSON shape from `GlobalExceptionHandler`:

```json
{ "error": "Conflict", "message": "Already enrolled in this course.", "status": 409 }
```

| Exception | HTTP |
|---|---|
| `ResourceNotFoundException` | 404 |
| `DuplicateResourceException` | 409 |
| `UnauthorizedActionException` | 403 |
| `BusinessRuleException` | 400 |
| `MethodArgumentNotValidException` | 400 |

## Phase 3 — Dashboards & Student Self-Service

### Entities & Relationships

Students interact with the platform through three aggregated views built on top of the Phase 1/2 entities:

- **Gradebook** — merged from `submissions` (graded, `status = GRADED`) and `quiz_attempts` (submitted). Each entry carries `score`, `max`, `type` (`assignment`/`quiz`), `assessment`, `course` and `date`, so the frontend can render rows and compute percentages without extra calls.
- **Attendance summary** — aggregated from `attendance` records belonging to the student: overall `present`/`total`/`percent`, a per-course breakdown, and a date-descending history feed.
- **Admin stats** — live platform counts (users by role, courses by status, enrollments, submissions, active users).

### New APIs

| Method | Endpoint | Allowed | Notes |
|---|---|---|---|
| PUT | `/api/auth/me` | Authenticated | Update own profile; partial request (`{"name": ...}`, `{"email": ...}`, `{"password": ...}`). Duplicate email → 409. |
| GET | `/api/admin/stats` | ADMIN | Platform-wide dashboard counts |
| GET | `/api/students/me/grades` | STUDENT | Gradebook aggregation (graded submissions + submitted quiz attempts), newest first |
| GET | `/api/students/me/attendance` | STUDENT | Attendance overview (`percent`, `present`, `total`, `courses`, `byCourse[]`, `history[]`) |

`GET /api/admin/stats` response:

```json
{
  "totalUsers": 12, "totalStudents": 8, "totalFaculty": 3,
  "totalCourses": 5, "publishedCourses": 4,
  "enrollments": 20, "submissions": 15, "submissionsToday": 2, "activeUsers": 11
}
```

`GET /api/students/me/grades` response (empty array for a student with no scored assessments):

```json
[
  {
    "assessmentId": 4, "assessment": "Essay", "courseId": 1, "course": "Java Programming",
    "score": 8.00, "max": 10.00, "type": "assignment", "date": "2026-09-18T16:26:00"
  },
  {
    "assessmentId": 2, "assessment": "Quiz 1", "courseId": 1, "course": "Java Programming",
    "score": 5.00, "max": 5.00, "type": "quiz", "date": "2026-09-18T16:27:00"
  }
]
```

`GET /api/students/me/attendance` response:

```json
{
  "percent": 67, "present": 2, "total": 3, "courses": 1,
  "byCourse": [ { "courseId": 1, "course": "Java Programming", "present": 2, "total": 3, "percent": 67 } ],
  "history": [ { "courseId": 1, "course": "Java Programming", "date": "2026-09-18", "status": "ABSENT" } ]
}
```

### Security additions

```
STUDENT:       GET /api/students/me/grades, GET /api/students/me/attendance (added before the
               broader /api/students/*/attendance matcher so `me` resolves to the caller)
ADMIN:         GET /api/admin/stats
AUTHENTICATED: PUT /api/auth/me
```

## Running the Application

1. `cd backend`
2. Configure MySQL connection via environment variables:

   ```
   LMS_DB_URL=jdbc:mysql://localhost:3306/learnhub
   LMS_DB_USERNAME=learnhub
   LMS_DB_PASSWORD=learnhub
   ```

3. Build & run:

   ```
   mvn clean verify
   mvn spring-boot:run
   ```

4. The API is served at `http://localhost:8080/api`.

## Phase 4 — Frontend Integration (single deployable)

The vanilla JS frontend (`lms-frontend/`) is now embedded in the Spring Boot jar and served from the same origin as the API. The app detects a reachable backend at boot and switches into **live mode** (real MySQL via REST); if the backend is unreachable it falls back to the in-browser mock data store.

### How it works

- `backend/pom.xml` copies `../lms-frontend` into `target/classes/static`; `index.html` redirects to `pages/auth/login.html`.
- `js/boot.js` loads the API adapter: `api/backend.js` then `api/index.js`.
- At boot, `app.js` runs an async `LH.live.hydrate()` **before** any page renderer runs, so every page's direct reads of `LH.mock.*` / `LH.db.*` return real server data (the mock cache is replaced in place).
- Mutations call the real DB store methods (`DB.create/update/remove`, `DB.submit`, `DB.enrollments.enroll`, `DB.markLessonComplete`, reorders, `API.quizzes.include`, `submissions.grade`, notifications) — `api/backend.js` hooks into those exact methods and fires the matching REST call, so **every existing action in the UI becomes live with no page rewrites**.
- Auth uses `localStorage` (`learnhub-token`, `learnhub-user`); 401 clears auth and redirects to login. The JWT is keyed on email — changing email logs you out.

### What changed

- `js/api/backend.js` (new) — transport, JWT, probe/`ready()`, role-scoped `hydrate()` + DTO mappers, mutation hooks, quiz publish/submit, grading, notifications.
- `js/boot.js`, `js/app.js`, `js/components/app-shell.js`, `js/api/index.js`, `js/pages/auth/login.js`, `js/pages/student/quiz-attempt.js`, `pages/auth/login.html`.
- `pages/auth/register.html` + `js/pages/auth/register.js` (new) — self-registration (creates STUDENT accounts only).
- Backend: replace JPA entity deletes with bulk JPQL deletes in `CourseService`/`QuizService`/`ModuleService`/`LessonService`/`AssignmentService` so cascaded delete no longer triggers Hibernate FK-nulling updates (fixed `delete course` failing under real quiz-attempt data).

### Bootstrap (fresh database)

There is no seed. Because `/api/auth/register` always creates a **STUDENT**, promote one account to admin once, then use the UI/admin APIs to create courses from it:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = '<your-email>';
```

### Running

```
cd backend
mvn clean verify
java -jar target/lms-backend-0.0.1-SNAPSHOT.jar
```

Open `http://localhost:8080` — the UI and API share this origin.

### Verification

- `mvn verify` — 37 tests (integration + repository).
- `scripts/smoke` (PowerShell, ad hoc) — 56 end-to-end API checks covering register/auth, admin courses/users/stats, modules/lessons/assignments/announcements/quizzes with questions, enrollment, lesson completion, submissions + grading, quiz attempts with server scoring, notifications, and course deletion with children.
- Note: `mvn verify`'s integration tests use fixed emails against MySQL and are **not idempotent** — re-running against a DB that already contains a previous run's rows produces duplicate-key failures. Wipe the `learnhub` tables before re-running.

See `docs/integration-report.md` for the full mapping of every frontend action to its REST endpoint.

## Testing with Postman

1. **Register/login** to obtain a JWT — `POST /api/auth/register` or `POST /api/auth/login` with `{"email": "...", "password": "secret123"}`.
2. Add the JWT as a header on all protected calls: `Authorization: Bearer <token>`.
3. Recommended Phase 2 flow:
   - As a **FACULTY** user: `POST /api/courses` to create a course, then `PATCH /api/courses/{id}/status` with `{"status":"PUBLISHED"}`.
   - As a **STUDENT**: `POST /api/courses/{id}/enroll` → `GET /api/courses/{id}/enrollment` (expect `{"enrolled":true}`) → `GET /api/students/me/courses`.
   - Negative cases: enroll twice (`409`), another faculty editing your course (`403`), student creating a course (`403`), enrolling in a non-existent course (`404`).

## Tests

```
mvn test
```

- `AuthFlowIntegrationTest` — register/login/auth-me flow.
- `CourseEnrollmentFlowTest` — Phase 2 course authorization + enrollment lifecycle.
- `DashboardAndProfileFlowTest` — Phase 3: profile update, admin stats, gradebook + attendance aggregation.
- Repository tests — Course, Enrollment, User, Attendance, LessonProgress, Submission.