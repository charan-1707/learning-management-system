package com.learnhub.lms;

import com.learnhub.lms.assignment.Assignment;
import com.learnhub.lms.assignment.AssignmentRepository;
import com.learnhub.lms.assignment.Submission;
import com.learnhub.lms.assignment.SubmissionRepository;
import com.learnhub.lms.assignment.SubmissionStatus;
import com.learnhub.lms.attendance.AttendanceRecord;
import com.learnhub.lms.attendance.AttendanceRecordRepository;
import com.learnhub.lms.attendance.AttendanceSession;
import com.learnhub.lms.attendance.AttendanceSessionRepository;
import com.learnhub.lms.attendance.AttendanceStatus;
import com.learnhub.lms.communication.Announcement;
import com.learnhub.lms.communication.AnnouncementRepository;
import com.learnhub.lms.content.Lesson;
import com.learnhub.lms.content.LessonRepository;
import com.learnhub.lms.content.Module;
import com.learnhub.lms.content.ModuleRepository;
import com.learnhub.lms.course.Course;
import com.learnhub.lms.course.CourseRepository;
import com.learnhub.lms.enrollment.Enrollment;
import com.learnhub.lms.enrollment.EnrollmentRepository;
import com.learnhub.lms.enrollment.EnrollmentStatus;
import com.learnhub.lms.enrollment.LessonProgress;
import com.learnhub.lms.enrollment.LessonProgressRepository;
import com.learnhub.lms.quiz.Quiz;
import com.learnhub.lms.quiz.QuizAttempt;
import com.learnhub.lms.quiz.QuizAttemptRepository;
import com.learnhub.lms.quiz.QuizQuestion;
import com.learnhub.lms.quiz.QuizQuestionRepository;
import com.learnhub.lms.quiz.QuizRepository;
import com.learnhub.lms.user.Role;
import com.learnhub.lms.user.User;
import com.learnhub.lms.user.UserRepository;
import com.learnhub.lms.user.UserStatus;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * Phase 1 acceptance tests (plan §6.2): course cascade delete, unique
 * enrollment / lesson_progress constraints, legacy NULL course status.
 *
 * <p>Runs on H2 (MODE=MySQL, ddl-auto=create-drop via properties below) so it
 * is green without MySQL. Live seed counts are verified separately against
 * MySQL with SELECT COUNT(*) queries.</p>
 */
@DataJpaTest(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
class Phase1DataTest {

  @Autowired TestEntityManager em;
  @Autowired UserRepository users;
  @Autowired CourseRepository courses;
  @Autowired ModuleRepository modules;
  @Autowired LessonRepository lessons;
  @Autowired EnrollmentRepository enrollments;
  @Autowired LessonProgressRepository progress;
  @Autowired AssignmentRepository assignments;
  @Autowired SubmissionRepository submissions;
  @Autowired AnnouncementRepository announcements;
  @Autowired QuizRepository quizzes;
  @Autowired QuizQuestionRepository questions;
  @Autowired QuizAttemptRepository attempts;
  @Autowired AttendanceSessionRepository sessions;
  @Autowired AttendanceRecordRepository records;

  private User student() {
    User u = new User();
    u.setName("Test Student");
    u.setEmail("test.student+" + System.nanoTime() + "@learnhub.test");
    u.setPasswordHash("{bcrypt}test");
    u.setRole(Role.student);
    u.setStatus(UserStatus.active);
    return users.saveAndFlush(u);
  }

  private Course course(User instructor, String id) {
    Course c = new Course();
    c.setId(id);
    c.setName("Test Course " + id);
    c.setInstructor(instructor);
    c.setInstructorName(instructor.getName());
    return courses.saveAndFlush(c);
  }

  @Test
  void deleteCourseCascadesToChildren() {
    User instructor = student();
    User learner = student();
    Course c = course(instructor, "t-cascade");

    Module m = new Module();
    m.setId("t-cascade-m1");
    m.setCourse(c);
    m.setTitle("M1");
    m.setOrderIndex(1);
    modules.saveAndFlush(m);

    Lesson l = new Lesson();
    l.setId("t-cascade-l1");
    l.setModule(m);
    l.setTitle("L1");
    lessons.saveAndFlush(l);

    Enrollment e = new Enrollment();
    e.setStudent(learner);
    e.setCourse(c);
    e.setStatus(EnrollmentStatus.active);
    e.setProgressPercent(0);
    e.setEnrolledAt(LocalDateTime.now());
    enrollments.saveAndFlush(e);

    LessonProgress lp = new LessonProgress();
    lp.setStudent(learner);
    lp.setLesson(l);
    lp.setCompletedAt(LocalDateTime.now());
    progress.saveAndFlush(lp);

    Announcement an = new Announcement();
    an.setId("t-an1");
    an.setCourse(c);
    an.setAuthorId(instructor.getId());
    an.setTitle("Hi");
    an.setBody("Body");
    an.setCreatedAt(LocalDateTime.now());
    announcements.saveAndFlush(an);

    Assignment a = new Assignment();
    a.setId("t-a1");
    a.setCourse(c);
    a.setTitle("A1");
    assignments.saveAndFlush(a);

    Submission s = new Submission();
    s.setId("t-s1");
    s.setAssignment(a);
    s.setCourse(c);
    s.setStudent(learner);
    s.setStatus(SubmissionStatus.pending);
    s.setSubmittedAt(LocalDateTime.now());
    submissions.saveAndFlush(s);

    Quiz q = new Quiz();
    q.setId("t-q1");
    q.setCourse(c);
    q.setTitle("Q1");
    quizzes.saveAndFlush(q);

    QuizQuestion qq = new QuizQuestion();
    qq.setQuiz(q);
    qq.setPosition(0);
    qq.setQuestion("Q?");
    qq.setOptionsJson("[\"A\",\"B\",\"C\",\"D\"]");
    qq.setAnswerIndex(0);
    questions.saveAndFlush(qq);

    QuizAttempt qa = new QuizAttempt();
    qa.setQuiz(q);
    qa.setStudent(learner);
    qa.setScore(1);
    qa.setTotal(1);
    attempts.saveAndFlush(qa);

    AttendanceSession sess = new AttendanceSession();
    sess.setCourse(c);
    sess.setSessionDate(LocalDate.now());
    sessions.saveAndFlush(sess);

    AttendanceRecord rec = new AttendanceRecord();
    rec.setSession(sess);
    rec.setStudent(learner);
    rec.setStatus(AttendanceStatus.present);
    records.saveAndFlush(rec);

    courses.delete(c);
    em.flush();
    em.clear(); // detach stale refs to the deleted course; rows are gone via ON DELETE CASCADE

    assertEquals(0, modules.count(), "modules cascaded");
    assertEquals(0, lessons.count(), "lessons cascaded");
    assertEquals(0, enrollments.count(), "enrollments cascaded");
    assertEquals(0, progress.count(), "lesson_progress cascaded");
    assertEquals(0, announcements.count(), "announcements cascaded");
    assertEquals(0, assignments.count(), "assignments cascaded");
    assertEquals(0, submissions.count(), "submissions cascaded");
    assertEquals(0, quizzes.count(), "quizzes cascaded");
    assertEquals(0, questions.count(), "quiz_questions cascaded");
    assertEquals(0, attempts.count(), "quiz_attempts cascaded");
    assertEquals(0, sessions.count(), "attendance_sessions cascaded");
    assertEquals(0, records.count(), "attendance_records cascaded");
    assertEquals(2, users.count(), "users untouched by course delete");
  }

  @Test
  void duplicateEnrollmentRejected() {
    User learner = student();
    Course c = course(learner, "t-unq-enr");

    Enrollment first = new Enrollment();
    first.setStudent(learner);
    first.setCourse(c);
    first.setStatus(EnrollmentStatus.active);
    enrollments.saveAndFlush(first);

    Enrollment dup = new Enrollment();
    dup.setStudent(learner);
    dup.setCourse(c);
    dup.setStatus(EnrollmentStatus.active);
    assertThrows(DataIntegrityViolationException.class, () -> enrollments.saveAndFlush(dup),
        "enroll-once: UNIQUE(student_id, course_id)");
  }

  @Test
  void duplicateLessonProgressRejected() {
    User learner = student();
    Course c = course(learner, "t-unq-lp");
    Module m = new Module();
    m.setId("t-unq-lp-m1");
    m.setCourse(c);
    m.setOrderIndex(1);
    modules.saveAndFlush(m);
    Lesson l = new Lesson();
    l.setId("t-unq-lp-l1");
    l.setModule(m);
    l.setTitle("L1");
    lessons.saveAndFlush(l);

    LessonProgress first = new LessonProgress();
    first.setStudent(learner);
    first.setLesson(l);
    first.setCompletedAt(LocalDateTime.now());
    progress.saveAndFlush(first);

    LessonProgress dup = new LessonProgress();
    dup.setStudent(learner);
    dup.setLesson(l);
    dup.setCompletedAt(LocalDateTime.now());
    assertThrows(DataIntegrityViolationException.class, () -> progress.saveAndFlush(dup),
        "idempotent complete: UNIQUE(student_id, lesson_id)");
  }

  @Test
  void legacyNullCourseStatusRoundTrips() {
    User instructor = student();
    Course c = course(instructor, "t-null-status");
    c.setStatus(null);
    courses.saveAndFlush(c);
    em.flush();
    em.clear();
    assertNull(courses.findById("t-null-status").orElseThrow().getStatus(),
        "status NULL = legacy published must survive the round trip");
  }
}
