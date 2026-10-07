-- V2__schema.sql — Phase 1 normative schema (BACKEND_IMPLEMENTATION_PLAN.md §6.1).
-- snake_case tables, InnoDB/utf8mb4. Every table has created_at; FKs carry
-- ON DELETE CASCADE/SET NULL exactly where §10.8 requires cascade.
-- NOTE: submissions has UNIQUE(assignment_id, student_id) per §10 (one row per
-- student+assignment; resubmit-before-due is an upsert, never a second row).

CREATE TABLE users (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('student','faculty','admin') NOT NULL,
  status        ENUM('active','suspended','warning','on-leave') DEFAULT 'active',
  dept          VARCHAR(120),
  program       VARCHAR(120),
  year_label    VARCHAR(20),
  title         VARCHAR(120),
  phone         VARCHAR(40),
  location      VARCHAR(120),
  avatar_url    VARCHAR(500),
  last_active_at DATETIME,
  joined_label  VARCHAR(40),
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role_status (role, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE courses (
  id              VARCHAR(16) PRIMARY KEY,
  code            VARCHAR(20),
  name            VARCHAR(200) NOT NULL,
  short_name      VARCHAR(200),
  description     TEXT,
  category        VARCHAR(80),
  instructor_id   BIGINT NULL,
  instructor_name VARCHAR(120),
  accent          VARCHAR(20) DEFAULT 'blue',
  credits         INT DEFAULT 3,
  semester        VARCHAR(40),
  -- NULL = legacy published (frontend courses predate status; see plan §2.2).
  status          ENUM('published','draft') NULL,
  students_count  INT DEFAULT 0,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_courses_instructor FOREIGN KEY (instructor_id)
    REFERENCES users (id) ON DELETE SET NULL,
  INDEX idx_courses_status_cat_instr (status, category, instructor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE modules (
  id          VARCHAR(32) PRIMARY KEY,
  course_id   VARCHAR(16) NOT NULL,
  title       VARCHAR(200),
  order_index INT,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_modules_course FOREIGN KEY (course_id)
    REFERENCES courses (id) ON DELETE CASCADE,
  UNIQUE KEY uq_modules_course_order (course_id, order_index),
  INDEX idx_modules_course (course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE lessons (
  id          VARCHAR(40) PRIMARY KEY,
  module_id   VARCHAR(32) NOT NULL,
  title       VARCHAR(250),
  content     TEXT,
  type        ENUM('pdf','video','link') NULL,
  meta        VARCHAR(250),
  size_bytes  BIGINT NULL,
  order_index INT,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_lessons_module FOREIGN KEY (module_id)
    REFERENCES modules (id) ON DELETE CASCADE,
  INDEX idx_lessons_module (module_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE enrollments (
  id               BIGINT AUTO_INCREMENT PRIMARY KEY,
  student_id       BIGINT NOT NULL,
  course_id        VARCHAR(16) NOT NULL,
  status           ENUM('active','dropped') DEFAULT 'active',
  progress_percent INT DEFAULT 0,
  enrolled_at      DATETIME,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_enroll_student FOREIGN KEY (student_id)
    REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_enroll_course FOREIGN KEY (course_id)
    REFERENCES courses (id) ON DELETE CASCADE,
  UNIQUE KEY uq_enroll_student_course (student_id, course_id),
  INDEX idx_enroll_course_status (course_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE lesson_progress (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  student_id   BIGINT NOT NULL,
  lesson_id    VARCHAR(40) NOT NULL,
  completed_at DATETIME,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_lp_student FOREIGN KEY (student_id)
    REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_lp_lesson FOREIGN KEY (lesson_id)
    REFERENCES lessons (id) ON DELETE CASCADE,
  UNIQUE KEY uq_lp_student_lesson (student_id, lesson_id),
  INDEX idx_lp_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE assignments (
  id          VARCHAR(16) PRIMARY KEY,
  course_id   VARCHAR(16) NOT NULL,
  title       VARCHAR(250),
  max_marks   INT DEFAULT 20,
  due_at      DATETIME,
  status      VARCHAR(30),
  description TEXT,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_assign_course FOREIGN KEY (course_id)
    REFERENCES courses (id) ON DELETE CASCADE,
  INDEX idx_assign_course_due (course_id, due_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE submissions (
  id            VARCHAR(24) PRIMARY KEY,
  assignment_id VARCHAR(16) NOT NULL,
  course_id     VARCHAR(16) NOT NULL,
  student_id    BIGINT NOT NULL,
  content       MEDIUMTEXT,
  file_url      VARCHAR(500),
  score         INT NULL,
  feedback      TEXT,
  graded_at     DATETIME NULL,
  status        ENUM('pending','reviewing','graded') DEFAULT 'pending',
  submitted_at  DATETIME,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sub_assign FOREIGN KEY (assignment_id)
    REFERENCES assignments (id) ON DELETE CASCADE,
  CONSTRAINT fk_sub_course FOREIGN KEY (course_id)
    REFERENCES courses (id) ON DELETE CASCADE,
  CONSTRAINT fk_sub_student FOREIGN KEY (student_id)
    REFERENCES users (id) ON DELETE CASCADE,
  UNIQUE KEY uq_sub_assign_student (assignment_id, student_id),
  INDEX idx_sub_assign_submitted (assignment_id, submitted_at),
  INDEX idx_sub_course_status (course_id, status),
  INDEX idx_sub_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE grades (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  course_id  VARCHAR(16) NOT NULL,
  student_id BIGINT NOT NULL,
  assessment VARCHAR(250),
  type       ENUM('assignment','quiz','exam'),
  score      INT,
  max_score  INT,
  graded_at  DATETIME,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_grades_course FOREIGN KEY (course_id)
    REFERENCES courses (id) ON DELETE CASCADE,
  CONSTRAINT fk_grades_student FOREIGN KEY (student_id)
    REFERENCES users (id) ON DELETE CASCADE,
  INDEX idx_grades_student_date (student_id, graded_at),
  INDEX idx_grades_course (course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE announcements (
  id         VARCHAR(16) PRIMARY KEY,
  course_id  VARCHAR(16) NOT NULL,
  author_id  BIGINT NULL,
  title      VARCHAR(250),
  body       TEXT,
  created_at DATETIME,
  CONSTRAINT fk_ann_course FOREIGN KEY (course_id)
    REFERENCES courses (id) ON DELETE CASCADE,
  CONSTRAINT fk_ann_author FOREIGN KEY (author_id)
    REFERENCES users (id) ON DELETE SET NULL,
  INDEX idx_ann_course_created (course_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE quizzes (
  id           VARCHAR(16) PRIMARY KEY,
  course_id    VARCHAR(16) NOT NULL,
  title        VARCHAR(250),
  duration_min INT,
  attempts_max INT DEFAULT 2,
  due_at       DATETIME,
  status       VARCHAR(30),
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_quiz_course FOREIGN KEY (course_id)
    REFERENCES courses (id) ON DELETE CASCADE,
  INDEX idx_quiz_course_due (course_id, due_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE quiz_questions (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  quiz_id      VARCHAR(16) NOT NULL,
  position     INT,
  question     TEXT,
  options_json JSON NOT NULL,
  answer_index INT NOT NULL,
  CONSTRAINT fk_qq_quiz FOREIGN KEY (quiz_id)
    REFERENCES quizzes (id) ON DELETE CASCADE,
  UNIQUE KEY uq_qq_quiz_position (quiz_id, position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE quiz_attempts (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  quiz_id      VARCHAR(16) NOT NULL,
  student_id   BIGINT NOT NULL,
  answers_json JSON,
  score        INT,
  total        INT,
  pct          INT,
  started_at   DATETIME,
  submitted_at DATETIME,
  CONSTRAINT fk_qa_quiz FOREIGN KEY (quiz_id)
    REFERENCES quizzes (id) ON DELETE CASCADE,
  CONSTRAINT fk_qa_student FOREIGN KEY (student_id)
    REFERENCES users (id) ON DELETE CASCADE,
  INDEX idx_qa_quiz_student (quiz_id, student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE attendance_sessions (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  course_id    VARCHAR(16) NOT NULL,
  session_date DATE,
  CONSTRAINT fk_asess_course FOREIGN KEY (course_id)
    REFERENCES courses (id) ON DELETE CASCADE,
  UNIQUE KEY uq_asess_course_date (course_id, session_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE attendance_records (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  session_id BIGINT NOT NULL,
  student_id BIGINT NOT NULL,
  status     ENUM('present','absent'),
  CONSTRAINT fk_arec_session FOREIGN KEY (session_id)
    REFERENCES attendance_sessions (id) ON DELETE CASCADE,
  CONSTRAINT fk_arec_student FOREIGN KEY (student_id)
    REFERENCES users (id) ON DELETE CASCADE,
  UNIQUE KEY uq_arec_session_student (session_id, student_id),
  INDEX idx_arec_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notifications (
  id         VARCHAR(16) PRIMARY KEY,
  user_id    BIGINT NOT NULL,
  type       ENUM('assignment','quiz','grade','course','system'),
  title      VARCHAR(250),
  message    TEXT,
  course_id  VARCHAR(16) NULL,
  is_read    BOOLEAN DEFAULT FALSE,
  created_at DATETIME,
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE,
  INDEX idx_notif_user_read_created (user_id, is_read, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE activity_events (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  actor_id   BIGINT NULL,
  type       VARCHAR(40),
  text       VARCHAR(300),
  detail     VARCHAR(500),
  created_at DATETIME,
  INDEX idx_activity_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE platform_settings (
  setting_key VARCHAR(80) PRIMARY KEY,
  value_json  JSON
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE stored_files (
  id         VARCHAR(36) PRIMARY KEY,
  owner_id   BIGINT,
  name       VARCHAR(255),
  mime       VARCHAR(120),
  size_bytes BIGINT,
  path       VARCHAR(500),
  created_at DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
