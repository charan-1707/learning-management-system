package com.learnhub.lms.enrollment;

import com.learnhub.lms.common.ApiException;
import com.learnhub.lms.common.Authz;
import com.learnhub.lms.communication.NotificationService;
import com.learnhub.lms.communication.NotificationType;
import com.learnhub.lms.content.Lesson;
import com.learnhub.lms.content.LessonRepository;
import com.learnhub.lms.content.LessonType;
import com.learnhub.lms.content.ModuleRepository;
import com.learnhub.lms.content.WatchRequest;
import com.learnhub.lms.course.Course;
import com.learnhub.lms.course.CourseDto;
import com.learnhub.lms.course.CourseRepository;
import com.learnhub.lms.course.CourseStatus;
import com.learnhub.lms.user.Role;
import com.learnhub.lms.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Enrollment + progress rules (plan §9, formulas §10.6). Students enroll
 * themselves; progress recomputes from distinct lesson_progress rows and is
 * persisted back onto the enrollment.
 *
 * <p>Anti-gaming completion: a lesson can only complete after it has been
 * opened (first touch creates the progress row = the dwell-clock start) plus
 * a per-type minimum dwell, and directly-playable video files additionally
 * require 80% watched via heartbeats. Already-completed rows are grandfathered.
 * Thresholds mirror the frontend countdown map in course-details.js.</p>
 */
@Service
public class EnrollmentService {

  private final CourseRepository courses;
  private final ModuleRepository modules;
  private final LessonRepository lessons;
  private final EnrollmentRepository enrollments;
  private final LessonProgressRepository progress;
  private final NotificationService notificationService;
  private final Authz authz;

  public EnrollmentService(CourseRepository courses, ModuleRepository modules,
      LessonRepository lessons, EnrollmentRepository enrollments,
      LessonProgressRepository progress, NotificationService notificationService,
      Authz authz) {
    this.courses = courses;
    this.modules = modules;
    this.lessons = lessons;
    this.enrollments = enrollments;
    this.progress = progress;
    this.notificationService = notificationService;
    this.authz = authz;
  }

  @Transactional
  public Map<String, Object> enroll(String courseId) {
    User me = authz.currentUser();
    if (me.getRole() != Role.student) {
      throw ApiException.forbidden("Forbidden");
    }
    Course course = courses.findById(courseId)
        .orElseThrow(() -> ApiException.notFound("Course not found."));
    if (course.getStatus() != null && course.getStatus() != CourseStatus.published) {
      throw ApiException.badRequest("This course is not open for enrollment.");
    }
    if (enrollments.existsByStudent_IdAndCourse_Id(me.getId(), courseId)) {
      throw ApiException.badRequest("You are already enrolled in this course.");
    }
    Enrollment e = new Enrollment();
    e.setStudent(me);
    e.setCourse(course);
    e.setStatus(EnrollmentStatus.active);
    e.setProgressPercent(0);
    e.setEnrolledAt(LocalDateTime.now());
    enrollments.save(e);
    course.setStudentsCount((course.getStudentsCount() == null ? 0 : course.getStudentsCount()) + 1);
    course.setUpdatedAt(LocalDateTime.now());
    courses.save(course);
    User instructor = course.getInstructor();
    if (instructor != null) {
      notificationService.notifyUser(instructor, NotificationType.course,
          "New enrollment",
          me.getName() + " enrolled in \u201c"
              + notificationService.courseDisplayName(courseId) + "\u201d.",
          courseId);
    }
    return Map.of("ok", true, "enrollment", EnrollmentDto.from(e));
  }

  @Transactional(readOnly = true)
  public List<EnrollmentDto> enrollmentsForCourse(String courseId) {
    if (!courses.existsById(courseId)) {
      throw ApiException.notFound("Course not found.");
    }
    authz.requireOwnerOrAdmin(courseId);
    return enrollments.findByCourse_Id(courseId).stream().map(EnrollmentDto::from).toList();
  }

  @Transactional(readOnly = true)
  public List<EnrollmentWithCourse> myEnrollments() {
    User me = authz.currentUser();
    List<EnrollmentWithCourse> out = new ArrayList<>();
    for (Enrollment e : enrollments.findByStudent_Id(me.getId())) {
      Course c = e.getCourse();
      out.add(new EnrollmentWithCourse(EnrollmentDto.from(e),
          CourseDto.from(c, modules.countByCourse_Id(c.getId()))));
    }
    return out;
  }

  @Transactional
  public ProgressDto progress(String courseId, Long studentIdParam) {
    User me = authz.currentUser();
    Long target = studentIdParam == null ? me.getId() : studentIdParam;
    if (!target.equals(me.getId())) {
      authz.requireOwnerOrAdmin(courseId);
    }
    if (!courses.existsById(courseId)) {
      throw ApiException.notFound("Course not found.");
    }
    ProgressDto dto = computeProgress(courseId, target);
    enrollments.findByStudent_IdAndCourse_Id(target, courseId).ifPresent(e -> {
      e.setProgressPercent(dto.percent());
      enrollments.save(e);
    });
    return dto;
  }

  /** Minimum open seconds per lesson type before completion (mirror: DWELL in course-details.js). */
  static final int DWELL_LINK_SEC = 30;
  static final int DWELL_PDF_SEC = 60;
  static final int DWELL_VIDEO_FLOOR_SEC = 30;
  /** Directly-playable video files additionally require this watch percentage. */
  static final int WATCH_PCT_REQUIRED = 80;

  static int dwellSeconds(LessonType type, boolean directVideoFile) {
    if (type == LessonType.link) {
      return DWELL_LINK_SEC;
    }
    if (type == LessonType.video && !directVideoFile) {
      return DWELL_PDF_SEC;
    }
    if (type == LessonType.video) {
      return DWELL_VIDEO_FLOOR_SEC;
    }
    return DWELL_PDF_SEC;
  }

  /** A video file the backend can confirm was actually played inline
   * (extension check mirrors isDirectVideoFile() in course-details.js). */
  static boolean isDirectVideoFile(String fileUrl) {
    return fileUrl != null && fileUrl.matches("(?i).*\\.(mp4|webm|ogg|ogv|mov|m4v)([?#].*)?$");
  }

  /**
   * Record first view: creates the progress row whose createdAt starts the
   * dwell clock. Idempotent. Also reports elapsed/required/watch state so the
   * UI can resume (or skip) the countdown, e.g. when re-entering a course.
   */
  @Transactional
  public Map<String, Object> markViewed(String lessonId) {
    User me = authz.currentUser();
    Lesson lesson = lessons.findById(lessonId)
        .orElseThrow(() -> ApiException.notFound("Lesson not found."));
    String courseId = lesson.getModule().getCourse().getId();
    if (!enrollments.existsByStudent_IdAndCourse_Id(me.getId(), courseId)) {
      throw ApiException.forbidden("Forbidden");
    }
    LessonProgress row = ensureProgressRow(me, lesson);
    boolean directVideo =
        lesson.getType() == LessonType.video && isDirectVideoFile(lesson.getFileUrl());
    LocalDateTime firstTouch = row.getCreatedAt() != null ? row.getCreatedAt() : LocalDateTime.now();
    long elapsed = Duration.between(firstTouch, LocalDateTime.now()).getSeconds();
    return Map.of("ok", true,
        "elapsedSec", Math.max(0, elapsed),
        "requiredSec", dwellSeconds(lesson.getType(), directVideo),
        "watchPct", row.getWatchPct() == null ? 0 : row.getWatchPct());
  }

  /**
   * Video watch heartbeat: keeps the best percentage seen. Monotonic —
   * rewinds never lower it.
   */
  @Transactional
  public Map<String, Object> recordWatch(String lessonId, WatchRequest req) {
    User me = authz.currentUser();
    Lesson lesson = lessons.findById(lessonId)
        .orElseThrow(() -> ApiException.notFound("Lesson not found."));
    String courseId = lesson.getModule().getCourse().getId();
    if (!enrollments.existsByStudent_IdAndCourse_Id(me.getId(), courseId)) {
      throw ApiException.forbidden("Forbidden");
    }
    int pct = req.durationSec() <= 0 ? 0
        : (int) Math.min(100, Math.round(req.positionSec() * 100.0 / req.durationSec()));
    LessonProgress row = ensureProgressRow(me, lesson);
    if (row.getWatchPct() == null || pct > row.getWatchPct()) {
      row.setWatchPct(pct);
      progress.save(row);
      row = progress.findByStudent_IdAndLesson_Id(me.getId(), lessonId).orElse(row);
    }
    return Map.of("ok", true, "watchPct", row.getWatchPct() == null ? 0 : row.getWatchPct());
  }

  @Transactional
  public Map<String, Object> completeLesson(String lessonId) {
    User me = authz.currentUser();
    Lesson lesson = lessons.findById(lessonId)
        .orElseThrow(() -> ApiException.notFound("Lesson not found."));
    String courseId = lesson.getModule().getCourse().getId();
    if (!enrollments.existsByStudent_IdAndCourse_Id(me.getId(), courseId)) {
      throw ApiException.forbidden("Forbidden");
    }
    LessonProgress row = progress.findByStudent_IdAndLesson_Id(me.getId(), lessonId).orElse(null);
    if (row == null) {
      // First touch starts the clock; the dwell gate below answers 400 with
      // the remaining wait, so callers converge without a dead end.
      row = ensureProgressRow(me, lesson);
    }
    if (row.getCompletedAt() == null) {
      LocalDateTime firstTouch = row.getCreatedAt() != null ? row.getCreatedAt() : LocalDateTime.now();
      long elapsed = Duration.between(firstTouch, LocalDateTime.now()).getSeconds();
      boolean directVideo = lesson.getType() == LessonType.video && isDirectVideoFile(lesson.getFileUrl());
      long required = dwellSeconds(lesson.getType(), directVideo);
      if (elapsed < required) {
        throw ApiException.badRequest("Give it a little more time — "
            + (required - elapsed) + "s left before this lesson can be completed.");
      }
      if (directVideo) {
        int watched = row.getWatchPct() == null ? 0 : row.getWatchPct();
        if (watched < WATCH_PCT_REQUIRED) {
          throw ApiException.badRequest("Watch at least " + WATCH_PCT_REQUIRED
              + "% of the video first (currently " + watched + "%).");
        }
      }
      row.setCompletedAt(LocalDateTime.now());
      progress.save(row);
    }
    ProgressDto dto = computeProgress(courseId, me.getId());
    enrollments.findByStudent_IdAndCourse_Id(me.getId(), courseId).ifPresent(e -> {
      e.setProgressPercent(dto.percent());
      enrollments.save(e);
    });
    return Map.of("ok", true, "progress", dto);
  }

  /** Fetch-or-create the progress row (first view); concurrent creators collapse. */
  private LessonProgress ensureProgressRow(User me, Lesson lesson) {
    LessonProgress existing =
        progress.findByStudent_IdAndLesson_Id(me.getId(), lesson.getId()).orElse(null);
    if (existing != null) {
      return existing;
    }
    LessonProgress row = new LessonProgress();
    row.setStudent(me);
    row.setLesson(lesson);
    try {
      progress.saveAndFlush(row);
      return row;
    } catch (org.springframework.dao.DataIntegrityViolationException race) {
      // concurrent double-create collapses to idempotent no-op
      return progress.findByStudent_IdAndLesson_Id(me.getId(), lesson.getId()).orElse(row);
    }
  }

  // ---- helpers ----

  private ProgressDto computeProgress(String courseId, Long studentId) {
    List<Lesson> courseLessons = lessons.findByModule_Course_Id(courseId);
    Set<String> ids = new HashSet<>();
    for (Lesson l : courseLessons) {
      ids.add(l.getId());
    }
    int completed = 0;
    Set<String> seen = new HashSet<>();
    List<String> doneIds = new ArrayList<>();
    for (LessonProgress row : progress.findByStudent_Id(studentId)) {
      String lid = row.getLesson() == null ? null : row.getLesson().getId();
      // Only finished lessons count: merely-viewed rows (completedAt null,
      // created by the engagement gate) must never inflate progress or badges.
      if (lid != null && row.getCompletedAt() != null && ids.contains(lid) && seen.add(lid)) {
        completed++;
        doneIds.add(lid);
      }
    }
    int total = courseLessons.size();
    int percent = total == 0 ? 0 : (int) Math.round(completed * 100.0 / total);
    return new ProgressDto(total, completed, percent, doneIds);
  }
}
