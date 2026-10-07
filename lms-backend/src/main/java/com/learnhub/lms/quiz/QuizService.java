package com.learnhub.lms.quiz;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnhub.lms.assignment.Grade;
import com.learnhub.lms.assignment.GradeRepository;
import com.learnhub.lms.assignment.GradeType;
import com.learnhub.lms.common.ApiException;
import com.learnhub.lms.common.Authz;
import com.learnhub.lms.common.PageResponse;
import com.learnhub.lms.communication.NotificationService;
import com.learnhub.lms.communication.NotificationType;
import com.learnhub.lms.course.Course;
import com.learnhub.lms.course.CourseRepository;
import com.learnhub.lms.enrollment.EnrollmentRepository;
import com.learnhub.lms.user.Role;
import com.learnhub.lms.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Quizzes + server-scored attempts (plan §11). Answers never leave the server
 * for students; attempts/due guards and scoring are authoritative here.
 */
@Service
public class QuizService {

  private final QuizRepository quizzes;
  private final QuizQuestionRepository questions;
  private final QuizAttemptRepository attempts;
  private final CourseRepository courses;
  private final EnrollmentRepository enrollments;
  private final GradeRepository grades;
  private final NotificationService notificationService;
  private final ObjectMapper json;
  private final Authz authz;

  public QuizService(QuizRepository quizzes, QuizQuestionRepository questions,
      QuizAttemptRepository attempts, CourseRepository courses,
      EnrollmentRepository enrollments, GradeRepository grades,
      NotificationService notificationService, ObjectMapper json, Authz authz) {
    this.quizzes = quizzes;
    this.questions = questions;
    this.attempts = attempts;
    this.courses = courses;
    this.enrollments = enrollments;
    this.grades = grades;
    this.notificationService = notificationService;
    this.json = json;
    this.authz = authz;
  }

  @Transactional(readOnly = true)
  public PageResponse<QuizDto> list(String courseId, Boolean taken, int page, int size) {
    User me = authz.currentUser();
    List<Quiz> all = courseId == null || courseId.isBlank()
        ? quizzes.findAll() : quizzes.findByCourse_Id(courseId);
    List<QuizDto> rows = new ArrayList<>();
    for (Quiz q : all) {
      Course c = q.getCourse();
      if (c == null) {
        continue;
      }
      if (!canSee(me, c)) {
        continue;
      }
      QuizDto dto = toDto(q, me.getId());
      if (taken != null && dto.taken() != taken) {
        continue;
      }
      rows.add(dto);
    }
    rows.sort((x, y) -> compareDue(x.dueAt(), y.dueAt()));
    return paginate(rows, page, size);
  }

  @Transactional
  public QuizDto create(QuizCreateRequest req) {
    User me = authz.currentUser();
    if (me.getRole() != Role.faculty && me.getRole() != Role.admin) {
      throw ApiException.forbidden("Forbidden");
    }
    Course course = courses.findById(req.courseId())
        .orElseThrow(() -> ApiException.notFound("Course not found."));
    authz.requireOwnerOrAdmin(course.getId());
    Quiz q = new Quiz();
    q.setId(nextQuizId());
    q.setCourse(course);
    q.setTitle(req.title().trim());
    q.setDurationMin(req.durationMin());
    q.setAttemptsMax(req.attemptsMax() == null ? 2 : req.attemptsMax());
    q.setDueAt(req.dueAt());
    q.setStatus(req.status());
    q.setCreatedAt(LocalDateTime.now());
    Quiz saved = quizzes.save(q);
    notificationService.fanOut(course.getId(), NotificationType.quiz, "New quiz available",
        "\u201c" + saved.getTitle() + "\u201d is now open in "
            + notificationService.courseDisplayName(course.getId()) + ".");
    return toDto(saved, me.getId());
  }

  @Transactional(readOnly = true)
  public QuizDto get(String id) {
    Quiz q = findOr404(id);
    authz.requireEnrolledOrOwnerOrAdmin(q.getCourse().getId());
    return toDto(q, authz.currentUserId());
  }

  @Transactional
  public void delete(String id) {
    Quiz q = findOr404(id);
    authz.requireOwnerOrAdmin(q.getCourse().getId());
    quizzes.delete(q);
  }

  @Transactional
  public QuizDto update(String id, QuizUpdateRequest req) {
    Quiz q = findOr404(id);
    authz.requireOwnerOrAdmin(q.getCourse().getId());
    if (req.title() != null) {
      q.setTitle(req.title().trim());
    }
    if (req.durationMin() != null) {
      q.setDurationMin(req.durationMin());
    }
    if (req.attemptsMax() != null) {
      q.setAttemptsMax(req.attemptsMax());
    }
    if (req.dueAt() != null) {
      q.setDueAt(req.dueAt());
    }
    if (req.status() != null) {
      q.setStatus(req.status());
    }
    return toDto(quizzes.save(q), authz.currentUserId());
  }

  @Transactional(readOnly = true)
  public List<AttemptDto> attemptsForQuiz(String id) {
    Quiz q = findOr404(id);
    authz.requireOwnerOrAdmin(q.getCourse().getId());
    return attempts.findByQuiz_IdOrderBySubmittedAtDesc(id).stream()
        .map(AttemptDto::from).toList();
  }

  @Transactional(readOnly = true)
  public List<?> questions(String id) {
    Quiz q = findOr404(id);
    String courseId = q.getCourse().getId();
    authz.requireEnrolledOrOwnerOrAdmin(courseId);
    List<QuizQuestion> all = questions.findByQuiz_IdOrderByPositionAsc(id);
    if (isOwnerOrAdmin(courseId)) {
      List<QuestionDto> out = new ArrayList<>();
      for (QuizQuestion qq : all) {
        out.add(QuestionDto.from(qq, parseOptions(qq)));
      }
      return out;
    }
    List<StudentQuestionDto> out = new ArrayList<>();
    for (QuizQuestion qq : all) {
      out.add(StudentQuestionDto.from(qq, parseOptions(qq)));
    }
    return out;
  }

  @Transactional
  public List<QuestionDto> replaceQuestions(String id, QuestionsReplaceRequest req) {
    Quiz q = findOr404(id);
    authz.requireOwnerOrAdmin(q.getCourse().getId());
    if (attempts.countByQuiz_Id(id) > 0) {
      throw ApiException.badRequest(
          "This quiz already has attempts; delete and recreate it to change questions.");
    }
    questions.deleteAll(questions.findByQuiz_IdOrderByPositionAsc(id));
    List<QuestionDto> out = new ArrayList<>();
    int pos = 0;
    for (QuestionInput in : req.questions()) {
      QuizQuestion qq = new QuizQuestion();
      qq.setQuiz(q);
      qq.setPosition(pos++);
      qq.setQuestion(in.q());
      qq.setOptionsJson(writeOptions(in.options()));
      qq.setAnswerIndex(in.answer());
      questions.save(qq);
      out.add(QuestionDto.from(qq, in.options()));
    }
    return out;
  }

  @Transactional
  public AttemptResult attempt(String id, AttemptRequest req) {
    User me = authz.currentUser();
    Quiz q = findOr404(id);
    String courseId = q.getCourse().getId();
    if (!enrollments.existsByStudent_IdAndCourse_Id(me.getId(), courseId)) {
      throw ApiException.forbidden("Forbidden");
    }
    if (q.getDueAt() != null && q.getDueAt().isBefore(LocalDateTime.now())) {
      throw ApiException.badRequest("This quiz is past its due date.");
    }
    int max = q.getAttemptsMax() == null ? 2 : q.getAttemptsMax();
    long used = attempts.countByQuiz_IdAndStudent_Id(id, me.getId());
    if (used >= max) {
      throw ApiException.badRequest("Maximum attempts reached for this quiz.");
    }
    List<QuizQuestion> all = questions.findByQuiz_IdOrderByPositionAsc(id);
    int total = all.size();
    int score = 0;
    List<Integer> given = req.answers() == null ? List.of() : req.answers();
    for (int i = 0; i < all.size() && i < given.size(); i++) {
      if (given.get(i) != null && given.get(i) == all.get(i).getAnswerIndex()) {
        score++;
      }
    }
    int pct = total == 0 ? 0 : (int) Math.round(score * 100.0 / total);

    QuizAttempt attempt = new QuizAttempt();
    attempt.setQuiz(q);
    attempt.setStudent(me);
    attempt.setAnswersJson(writeOptions(given));
    attempt.setScore(score);
    attempt.setTotal(total);
    attempt.setPct(pct);
    attempt.setStartedAt(req.startedAt() == null ? LocalDateTime.now() : req.startedAt());
    attempt.setSubmittedAt(LocalDateTime.now());
    attempts.save(attempt);

    long nowUsed = used + 1;
    int best = score;
    for (QuizAttempt past : attempts.findByQuiz_IdAndStudent_IdOrderBySubmittedAtDesc(id, me.getId())) {
      if (past.getScore() != null && past.getScore() > best) {
        best = past.getScore();
      }
    }
    writeGradeRow(q, me, best, total);
    return new AttemptResult(score, total, pct, letterGrade(pct), best + "/" + total, nowUsed);
  }

  @Transactional(readOnly = true)
  public List<AttemptDto> myAttempts(String id) {
    User me = authz.currentUser();
    findOr404(id);
    return attempts.findByQuiz_IdAndStudent_IdOrderBySubmittedAtDesc(id, me.getId()).stream()
        .map(AttemptDto::from).toList();
  }

  // ---- helpers ----

  private Quiz findOr404(String id) {
    return quizzes.findById(id).orElseThrow(() -> ApiException.notFound("Quiz not found."));
  }

  private boolean canSee(User me, Course c) {
    if (me.getRole() == Role.admin) {
      return true;
    }
    if (c.getInstructor() != null && c.getInstructor().getId().equals(me.getId())) {
      return true;
    }
    return enrollments.existsByStudent_IdAndCourse_Id(me.getId(), c.getId());
  }

  private boolean isOwnerOrAdmin(String courseId) {
    User me = authz.currentUser();
    if (me.getRole() == Role.admin) {
      return true;
    }
    Course c = courses.findById(courseId).orElse(null);
    return c != null && c.getInstructor() != null && c.getInstructor().getId().equals(me.getId());
  }

  private QuizDto toDto(Quiz q, Long viewerId) {
    Course c = q.getCourse();
    String courseName = c.getShortName() == null ? c.getName() : c.getShortName();
    List<QuizAttempt> mine = attempts.findByQuiz_IdAndStudent_IdOrderBySubmittedAtDesc(
        q.getId(), viewerId);
    int count = questions.findByQuiz_IdOrderByPositionAsc(q.getId()).size();
    boolean taken = !mine.isEmpty();
    int best = mine.stream().mapToInt(a -> a.getScore() == null ? 0 : a.getScore())
        .max().orElse(0);
    String bestScore = taken ? best + "/" + count : null;
    return new QuizDto(q.getId(), c.getId(), courseName, q.getTitle(), q.getDurationMin(),
        q.getAttemptsMax(), q.getDueAt(), q.getStatus(), count, taken, mine.size(), bestScore);
  }

  private void writeGradeRow(Quiz q, User student, int best, int total) {
    Course course = q.getCourse();
    List<Grade> existing = grades.findByCourse_IdAndStudent_IdAndAssessmentAndType(
        course.getId(), student.getId(), q.getTitle(), GradeType.quiz);
    Grade g = existing.isEmpty() ? new Grade() : existing.get(0);
    if (!existing.isEmpty() && g.getScore() != null && g.getScore() >= best) {
      return;
    }
    g.setCourse(course);
    g.setStudent(student);
    g.setAssessment(q.getTitle());
    g.setType(GradeType.quiz);
    g.setScore(best);
    g.setMaxScore(total);
    g.setGradedAt(LocalDateTime.now());
    grades.save(g);
  }

  static String letterGrade(int pct) {
    if (pct >= 90) {
      return "A";
    }
    if (pct >= 80) {
      return "B";
    }
    if (pct >= 70) {
      return "C";
    }
    if (pct >= 60) {
      return "D";
    }
    return "F";
  }

  private List<String> parseOptions(QuizQuestion q) {
    String raw = q.getOptionsJson();
    try {
      return json.readValue(raw, new TypeReference<List<String>>() {
      });
    } catch (JsonProcessingException first) {
      // H2 binds String->JSON as a quoted string literal while MySQL stores the
      // document as-is; unwrap one level so both round-trip identically.
      try {
        String inner = json.readValue(raw, String.class);
        return json.readValue(inner, new TypeReference<List<String>>() {
        });
      } catch (JsonProcessingException ex) {
        throw ApiException.badRequest("Quiz data is corrupt.");
      }
    }
  }

  private String writeOptions(List<?> options) {
    try {
      return json.writeValueAsString(options == null ? List.of() : options);
    } catch (JsonProcessingException ex) {
      throw ApiException.badRequest("Quiz data is corrupt.");
    }
  }

  private String nextQuizId() {
    int max = 0;
    for (Quiz q : quizzes.findAll()) {
      if (q.getId() != null && q.getId().matches("q\\d+")) {
        max = Math.max(max, Integer.parseInt(q.getId().substring(1)));
      }
    }
    return "q" + (max + 1);
  }

  private static int compareDue(java.time.LocalDateTime a, java.time.LocalDateTime b) {
    if (a == null && b == null) {
      return 0;
    }
    if (a == null) {
      return 1;
    }
    if (b == null) {
      return -1;
    }
    return a.compareTo(b);
  }

  private static PageResponse<QuizDto> paginate(List<QuizDto> rows, int page, int size) {
    int capped = Math.min(Math.max(size, 1), 100);
    int from = Math.min(Math.max(page, 0) * capped, rows.size());
    int to = Math.min(from + capped, rows.size());
    return new PageResponse<>(rows.subList(from, to), rows.size(), page, size);
  }
}
