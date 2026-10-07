package com.learnhub.lms.enrollment;

import com.learnhub.lms.common.ApiException;
import com.learnhub.lms.common.Authz;
import com.learnhub.lms.communication.NotificationService;
import com.learnhub.lms.communication.NotificationType;
import com.learnhub.lms.content.Lesson;
import com.learnhub.lms.content.LessonRepository;
import com.learnhub.lms.content.ModuleRepository;
import com.learnhub.lms.course.Course;
import com.learnhub.lms.course.CourseDto;
import com.learnhub.lms.course.CourseRepository;
import com.learnhub.lms.course.CourseStatus;
import com.learnhub.lms.user.Role;
import com.learnhub.lms.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

  @Transactional
  public Map<String, Object> completeLesson(String lessonId) {
    User me = authz.currentUser();
    Lesson lesson = lessons.findById(lessonId)
        .orElseThrow(() -> ApiException.notFound("Lesson not found."));
    String courseId = lesson.getModule().getCourse().getId();
    if (!enrollments.existsByStudent_IdAndCourse_Id(me.getId(), courseId)) {
      throw ApiException.forbidden("Forbidden");
    }
    if (progress.countByStudent_IdAndLesson_Id(me.getId(), lessonId) == 0) {
      LessonProgress row = new LessonProgress();
      row.setStudent(me);
      row.setLesson(lesson);
      row.setCompletedAt(LocalDateTime.now());
      try {
        progress.saveAndFlush(row);
      } catch (org.springframework.dao.DataIntegrityViolationException race) {
        // concurrent double-complete collapses to idempotent no-op
      }
    }
    ProgressDto dto = computeProgress(courseId, me.getId());
    enrollments.findByStudent_IdAndCourse_Id(me.getId(), courseId).ifPresent(e -> {
      e.setProgressPercent(dto.percent());
      enrollments.save(e);
    });
    return Map.of("ok", true, "progress", dto);
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
      if (lid != null && ids.contains(lid) && seen.add(lid)) {
        completed++;
        doneIds.add(lid);
      }
    }
    int total = courseLessons.size();
    int percent = total == 0 ? 0 : (int) Math.round(completed * 100.0 / total);
    return new ProgressDto(total, completed, percent, doneIds);
  }
}
