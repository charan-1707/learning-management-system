package com.learnhub.lms.admin;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnhub.lms.assignment.Grade;
import com.learnhub.lms.assignment.GradeRepository;
import com.learnhub.lms.assignment.Submission;
import com.learnhub.lms.assignment.SubmissionRepository;
import com.learnhub.lms.attendance.AttendanceService;
import com.learnhub.lms.common.ApiException;
import com.learnhub.lms.common.Authz;
import com.learnhub.lms.course.Course;
import com.learnhub.lms.course.CourseRepository;
import com.learnhub.lms.course.CourseStatus;
import com.learnhub.lms.enrollment.Enrollment;
import com.learnhub.lms.enrollment.EnrollmentRepository;
import com.learnhub.lms.user.Role;
import com.learnhub.lms.user.User;
import com.learnhub.lms.user.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;

/**
 * Admin aggregates + settings + instance wipe (plan §12). Everything is
 * computed live from domain tables — no stored stat snapshots.
 */
@Service
public class AdminService {

  private final UserRepository users;
  private final CourseRepository courses;
  private final EnrollmentRepository enrollments;
  private final SubmissionRepository submissions;
  private final GradeRepository grades;
  private final ActivityEventRepository events;
  private final PlatformSettingRepository settings;
  private final AttendanceService attendance;
  private final ObjectMapper json;
  private final JdbcTemplate jdbc;
  private final Authz authz;
  private final String primaryAdminEmail;
  private final String uploadsDir;

  public AdminService(UserRepository users, CourseRepository courses,
      EnrollmentRepository enrollments, SubmissionRepository submissions,
      GradeRepository grades, ActivityEventRepository events,
      PlatformSettingRepository settings, AttendanceService attendance,
      ObjectMapper json, JdbcTemplate jdbc, Authz authz,
      @Value("${app.primary-admin-email:learnhub.edu.in@gmail.com}") String primaryAdminEmail,
      @Value("${app.uploads-dir:./uploads}") String uploadsDir) {
    this.users = users;
    this.courses = courses;
    this.enrollments = enrollments;
    this.submissions = submissions;
    this.grades = grades;
    this.events = events;
    this.settings = settings;
    this.attendance = attendance;
    this.json = json;
    this.jdbc = jdbc;
    this.authz = authz;
    this.primaryAdminEmail = primaryAdminEmail;
    this.uploadsDir = uploadsDir;
  }

  @Transactional(readOnly = true)
  public StatisticsDto statistics() {
    authz.requireAdmin();
    List<Course> allCourses = courses.findAll();
    long published = allCourses.stream()
        .filter(c -> c.getStatus() == null || c.getStatus() == CourseStatus.published).count();
    LocalDateTime today = LocalDate.now().atStartOfDay();
    LocalDateTime activeSince = LocalDateTime.now().minusDays(30);
    long active = users.findAll().stream()
        .filter(u -> u.getLastActiveAt() != null && u.getLastActiveAt().isAfter(activeSince))
        .count();
    return new StatisticsDto(allCourses.size(), published,
        users.countByRole(Role.student), users.countByRole(Role.faculty), users.count(),
        enrollments.count(), submissions.count(),
        submissions.findBySubmittedAtAfter(today).size(), active);
  }

  @Transactional(readOnly = true)
  public List<ActivityDto> activity() {
    authz.requireAdmin();
    return events.findAllByOrderByCreatedAtDesc(PageRequest.of(0, 50)).stream()
        .map(ActivityDto::from).toList();
  }

  @Transactional(readOnly = true)
  public ReportsDto reports() {
    authz.requireAdmin();
    List<ReportsDto.EnrollmentByCourse> byCourse = new ArrayList<>();
    for (Course c : courses.findAll()) {
      byCourse.add(new ReportsDto.EnrollmentByCourse(c.getName(), c.getCode(),
          enrollments.countByCourse_Id(c.getId())));
    }
    byCourse.sort((a, b) -> Long.compare(b.students(), a.students()));

    List<ReportsDto.MonthlyActive> monthly = new ArrayList<>();
    YearMonth now = YearMonth.now();
    DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM", Locale.ENGLISH);
    for (int i = 5; i >= 0; i--) {
      YearMonth m = now.minusMonths(i);
      long active = enrollments.findAll().stream()
          .filter(e -> e.getEnrolledAt() != null && YearMonth.from(e.getEnrolledAt()).equals(m))
          .map(e -> e.getStudent().getId()).distinct().count();
      monthly.add(new ReportsDto.MonthlyActive(m.format(fmt), active));
    }

    List<Double> pcts = new ArrayList<>();
    for (Grade g : grades.findAll()) {
      if (g.getScore() != null && g.getMaxScore() != null && g.getMaxScore() > 0) {
        pcts.add(g.getScore() * 100.0 / g.getMaxScore());
      }
    }
    long passed = pcts.stream().filter(p -> p >= 40).count();
    double average = pcts.isEmpty() ? 0.0
        : pcts.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);

    Map<String, Long> byProgram = new TreeMap<>();
    for (User u : users.findAll()) {
      if (u.getRole() == Role.student) {
        String program = u.getProgram() == null || u.getProgram().isBlank()
            ? "Undeclared" : u.getProgram();
        byProgram.merge(program, 1L, Long::sum);
      }
    }
    List<ReportsDto.ProgramDistribution> dist = byProgram.entrySet().stream()
        .map(e -> new ReportsDto.ProgramDistribution(e.getKey(), e.getValue())).toList();
    return new ReportsDto(byCourse, monthly,
        new ReportsDto.PassRate(passed, pcts.size() - passed, average), dist);
  }

  @Transactional(readOnly = true)
  public String exportCsv(String type) {
    authz.requireAdmin();
    if ("users".equalsIgnoreCase(type)) {
      StringBuilder sb = new StringBuilder("id,name,email,role,status,dept,program\n");
      for (User u : users.findAll()) {
        sb.append(u.getId()).append(',').append(csv(u.getName())).append(',')
            .append(csv(u.getEmail())).append(',').append(u.getRole()).append(',')
            .append(u.getStatus() == null ? "" : u.getStatus().dbValue).append(',')
            .append(csv(u.getDept())).append(',').append(csv(u.getProgram())).append('\n');
      }
      return sb.toString();
    }
    if ("grades".equalsIgnoreCase(type)) {
      StringBuilder sb = new StringBuilder("id,courseId,studentId,assessment,type,score,maxScore,gradedAt\n");
      for (Grade g : grades.findAll()) {
        sb.append(g.getId()).append(',')
            .append(g.getCourse() == null ? "" : g.getCourse().getId()).append(',')
            .append(g.getStudent() == null ? "" : g.getStudent().getId()).append(',')
            .append(csv(g.getAssessment())).append(',')
            .append(g.getType() == null ? "" : g.getType().name()).append(',')
            .append(nul(g.getScore())).append(',').append(nul(g.getMaxScore())).append(',')
            .append(nul(g.getGradedAt())).append('\n');
      }
      return sb.toString();
    }
    if ("enrollments".equalsIgnoreCase(type)) {
      StringBuilder sb = new StringBuilder("id,studentId,courseId,status,progressPercent,enrolledAt\n");
      for (Enrollment e : enrollments.findAll()) {
        sb.append(e.getId()).append(',')
            .append(e.getStudent() == null ? "" : e.getStudent().getId()).append(',')
            .append(e.getCourse() == null ? "" : e.getCourse().getId()).append(',')
            .append(e.getStatus() == null ? "" : e.getStatus().name()).append(',')
            .append(nul(e.getProgressPercent())).append(',').append(nul(e.getEnrolledAt()))
            .append('\n');
      }
      return sb.toString();
    }
    throw ApiException.badRequest("Unknown export type. Use users, grades or enrollments.");
  }

  @Transactional(readOnly = true)
  public Map<String, Object> getSettings() {
    authz.requireAdmin();
    Map<String, Object> out = new LinkedHashMap<>();
    for (PlatformSetting s : settings.findAll()) {
      out.put(s.getSettingKey(), parse(s.getValueJson()));
    }
    return out;
  }

  @Transactional
  public Map<String, Object> patchSettings(Map<String, Object> patch) {
    authz.requireAdmin();
    if (patch == null) {
      throw ApiException.badRequest("Settings body is required.");
    }
    for (var entry : patch.entrySet()) {
      PlatformSetting s = settings.findById(entry.getKey()).orElseGet(() -> {
        PlatformSetting created = new PlatformSetting();
        created.setSettingKey(entry.getKey());
        return created;
      });
      try {
        s.setValueJson(json.writeValueAsString(entry.getValue()));
      } catch (JsonProcessingException ex) {
        throw ApiException.badRequest("Invalid value for setting: " + entry.getKey());
      }
      settings.save(s);
    }
    return getSettings();
  }

  /**
   * Wipe instance: truncates every data table and deletes uploaded files.
   * The primary admin (app.primary-admin-email) always survives so access is
   * never lost. Settings reset to defaults. Active JWTs expire naturally.
   */
  @Transactional
  public Map<String, Object> wipeInstance() {
    authz.requireAdmin();
    String keeper = primaryAdminEmail.trim().toLowerCase();
    foreignKeys(false);
    try {
      for (String t : List.of("stored_files", "password_reset_tokens", "platform_settings",
          "activity_events", "notifications", "attendance_records", "attendance_sessions",
          "quiz_attempts", "quiz_questions", "quizzes", "announcements", "grades",
          "submissions", "assignments", "lesson_progress", "enrollments", "lessons",
          "modules", "courses")) {
        jdbc.execute("TRUNCATE TABLE " + t);
      }
      jdbc.update("DELETE FROM users WHERE LOWER(email) <> ?", keeper);
    } finally {
      foreignKeys(true);
    }
    clearUploads();
    long remaining = users.count();
    return Map.of("ok", true, "usersRemaining", remaining);
  }

  /** MySQL and H2 spell the FK toggle differently; try both. */
  private void foreignKeys(boolean on) {
    try {
      jdbc.execute(on ? "SET FOREIGN_KEY_CHECKS=1" : "SET FOREIGN_KEY_CHECKS=0");
      return;
    } catch (Exception ignored) {
      // not MySQL — fall through to H2 syntax
    }
    try {
      jdbc.execute(on ? "SET REFERENTIAL_INTEGRITY TRUE" : "SET REFERENTIAL_INTEGRITY FALSE");
    } catch (Exception ignored) {
      // last resort: ordering + FK checks stay as-is
    }
  }

  private void clearUploads() {
    try {
      Path dir = Path.of(uploadsDir);
      if (!Files.isDirectory(dir)) {
        return;
      }
      try (var stream = Files.list(dir)) {
        for (Path p : stream.toList()) {
          if (Files.isDirectory(p)) {
            try (var walk = Files.walk(p)) {
              walk.sorted(java.util.Comparator.reverseOrder())
                  .forEach(q -> q.toFile().delete());
            }
          } else {
            p.toFile().delete();
          }
        }
      }
    } catch (Exception ex) {
      throw ApiException.badRequest("Wipe incomplete: uploaded files could not be cleared.");
    }
  }

  @Transactional(readOnly = true)
  public List<StudentProgressRow> studentProgress(String courseId) {
    if (!courses.existsById(courseId)) {
      throw ApiException.notFound("Course not found.");
    }
    authz.requireOwnerOrAdmin(courseId);
    List<StudentProgressRow> out = new ArrayList<>();
    for (Enrollment e : enrollments.findByCourse_Id(courseId)) {
      User s = e.getStudent();
      int progressPct = e.getProgressPercent() == null ? 0 : e.getProgressPercent();
      Double avg = null;
      List<Double> pcts = new ArrayList<>();
      for (Grade g : grades.findByStudent_Id(s.getId())) {
        if (g.getCourse() != null && courseId.equals(g.getCourse().getId())
            && g.getScore() != null && g.getMaxScore() != null && g.getMaxScore() > 0) {
          pcts.add(g.getScore() * 100.0 / g.getMaxScore());
        }
      }
      if (!pcts.isEmpty()) {
        avg = pcts.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
      }
      int att = attendance.attendancePct(s.getId(), courseId);
      Integer attendancePct = att < 0 ? null : att;
      boolean atRisk = progressPct < 40 || (attendancePct != null && attendancePct < 60);
      out.add(new StudentProgressRow(s.getId(), s.getName(), progressPct, avg,
          attendancePct, atRisk));
    }
    return out;
  }

  // ---- helpers ----

  private Object parse(String valueJson) {
    if (valueJson == null) {
      return null;
    }
    try {
      return json.readValue(valueJson, Object.class);
    } catch (JsonProcessingException ex) {
      return valueJson;
    }
  }

  private static String csv(String s) {
    if (s == null) {
      return "";
    }
    if (s.contains(",") || s.contains("\"") || s.contains("\n")) {
      return "\"" + s.replace("\"", "\"\"") + "\"";
    }
    return s;
  }

  private static String nul(Object o) {
    return o == null ? "" : String.valueOf(o);
  }
}
