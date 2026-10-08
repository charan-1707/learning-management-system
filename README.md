# LearnHub LMS 🎓

A complete college Learning Management System with three roles — **students** learn,
**faculty** teach, and **admins** run the platform. Plain HTML/CSS/JavaScript on the
front, Spring Boot + MySQL on the back, talking to each other over a REST API.

## What it does

**Students** — browse the course catalog and enroll, study materials lesson by lesson
with progress tracking, submit assignments (with file attachments), attempt timed
quizzes that are scored on the server, check grades and the gradebook, track
attendance, and get notifications for announcements, grades, and quizzes.

**Faculty** — create courses with modules, lessons (PDF/video/link uploads), learning
outcomes and cover images; publish assignments and quizzes (question builder with
answer key); review and grade submissions; take attendance on a calendar; watch
per-student progress and risk signals; get notified of new submissions and enrollments.

**Admins** — live platform statistics and reports, manage students/faculty/users
(roles, status, temp passwords), platform settings toggles (self-registration,
maintenance mode), platform-wide notification broadcasts, full data wipe, CSV exports.

Security is enforced on the **server**, not just by hiding buttons: JWT access tokens
(15 min) with rotating 7-day refresh tokens, BCrypt password hashing, and role +
ownership checks on every endpoint.

## Tech stack

| Part | Tech |
|---|---|
| Frontend | Vanilla HTML/CSS/JS — **no build step**, open and serve |
| Backend | Java 17, Spring Boot 3.2, Spring Security, JPA/Hibernate, Flyway, jjwt |
| Database | MySQL 8 (tests use in-memory H2, so they run anywhere) |
| Auth | Email + password (BCrypt) → JWT; password reset via email OTP/link |

## Project layout

```
LearnHub/
├── lms-frontend/        # the website: pages/, js/, css/, images/
│   └── js/config.js     # ← the ONE file you edit when deploying (API address)
├── lms-backend/         # the API: src/, pom.xml, mvnw wrapper
│   └── src/main/resources/db/migration/   # schema (Flyway, always runs)
│   └── src/main/resources/db/seed/        # demo data (dev only, never prod)
├── serve.py             # tiny dev server for the frontend (port 8000)
└── index.html           # convenience redirect to the login page
```

## Run it locally

You need Java 17+, Maven, MySQL 8, and Python.

**1. Backend** (port 8080) — from `lms-backend/`:
```powershell
$env:DB_PASSWORD="your-mysql-root-password"
mvn spring-boot:run
```
First start with an empty database creates the admin account automatically.

**2. Frontend** (port 8000) — from the project root:
```powershell
python serve.py
```
Then open http://localhost:8000/pages/auth/login.html

**3. Tests** (no database needed):
```powershell
cd lms-backend
mvn test        # 60/60 green
```

**Default login** (change the password after first sign-in):
- Email: `learnhub.edu.in@gmail.com`
- Password: `admin123`

## Deploy it (Vercel + Render + MySQL)

Same code, three homes: static frontend on Vercel, API jar on Render, data in a
managed MySQL service. The app was prepared for exactly this — every host-specific
value is an environment variable, nothing is hardcoded.

**Frontend** — new Vercel project, root directory `lms-frontend/`, then edit one line
in `lms-frontend/js/config.js`:
```js
window.LH_API_BASE = 'https://<your-backend>.onrender.com/api';
```

**Backend** — new Render web service, root directory `lms-backend/`:
- Build: `./mvnw clean package -DskipTests`
- Start: `java -jar target/lms-backend-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod`
- (`prod` migrates the schema only, so production starts clean with zero demo rows.)

**Backend env vars on Render:**

| Variable | Example | Why |
|---|---|---|
| `APP_DB_URL` | `jdbc:mysql://host:3306/learnhub?...` | managed MySQL (Aiven needs SSL params + CA truststore, see below) |
| `DB_USERNAME` / `DB_PASSWORD` | `admin` / `••••` | database login |
| `JWT_SECRET` | 64+ random chars | signing tokens — **required**, never use the dev default |
| `APP_CORS_ALLOWED_ORIGINS` | `https://learnhub.vercel.app` | lets your site call the API |
| `APP_FRONTEND_URL` | `https://learnhub.vercel.app` | links inside reset emails |
| `APP_MAIL_HOST/USER/PASS` | `smtp.gmail.com …` | SMTP path — only where egress allows it (NOT Render free); prefer Brevo below |
| `APP_BREVO_API_KEY` | `xkeysib-…` | production email (OTP + resets) over HTTPS — the only path that works on Render |
| `APP_REQUIRE_EMAIL_VERIFICATION` | `false` | closed-pilot escape hatch: skips OTP, registration signs students straight in |
| `APP_ADMIN_RECOVERY_PASSWORD` | temporary only | lockout recovery: resets primary admin's password on next boot — **delete right after signing in** |
| `PORT` | *(set by Render)* | already wired — leave it |

Aiven MySQL enforces TLS: its CA certificate is committed at
`lms-backend/aiven-ca.pem` (public key material, safe in git) and the Docker
build bakes it into a truststore automatically — just keep `sslMode=VERIFY_CA`
in `APP_DB_URL`. If you ever move the database to a new service, replace that
file with the new CA and redeploy.

**After deploy, check:** site loads over HTTPS · login works · student/faculty/admin
pages all load · admin broadcast reaches inboxes · a backend restart keeps all data.

> Heads-up: free tiers sleep when idle, so the first request can take ~a minute
> (the app retries automatically). Uploaded files live on the backend's disk,
> which free hosts wipe on restart — fine to start, object storage later.

## Notes

- Dev default ports: API `8080`, site `8000`. Same-WiFi phones/laptops auto-connect.
- `lms-backend/README.md` holds the full build-by-build engineering log.
- API docs (when backend runs): http://localhost:8080/swagger-ui.html
