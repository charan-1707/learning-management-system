package com.learnhub.lms.content;

import com.learnhub.lms.common.ApiException;
import com.learnhub.lms.common.Authz;
import com.learnhub.lms.course.Course;
import com.learnhub.lms.course.CourseRepository;
import com.learnhub.lms.enrollment.EnrollmentRepository;
import com.learnhub.lms.user.Role;
import com.learnhub.lms.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;

/**
 * Module/lesson CRUD with ownership + locked-materials rule (plan §8).
 * Reorders validate the full id set and rewrite {@code order_index=idx+1}
 * transactionally. New ids extend the frontend scheme
 * ({@code <course>-m<n>} / {@code <course>-l<n>}).
 */
@Service
public class ContentService {

  private final CourseRepository courses;
  private final ModuleRepository modules;
  private final LessonRepository lessons;
  private final EnrollmentRepository enrollments;
  private final Authz authz;

  public ContentService(CourseRepository courses, ModuleRepository modules,
      LessonRepository lessons, EnrollmentRepository enrollments, Authz authz) {
    this.courses = courses;
    this.modules = modules;
    this.lessons = lessons;
    this.enrollments = enrollments;
    this.authz = authz;
  }

  @Transactional(readOnly = true)
  public List<ModuleDto> modulesForCourse(String courseId) {
    findCourseOr404(courseId);
    boolean locked = lockedFor(courseId);
    List<ModuleDto> out = new ArrayList<>();
    for (Module m : modules.findByCourse_IdOrderByOrderIndexAsc(courseId)) {
      out.add(ModuleDto.from(m, lessons.countByModule_Id(m.getId()), locked));
    }
    return out;
  }

  @Transactional
  public ModuleDto createModule(String courseId, ModuleCreateRequest req) {
    Course course = findCourseOr404(courseId);
    authz.requireOwnerOrAdmin(courseId);
    List<Module> existing = modules.findByCourse_IdOrderByOrderIndexAsc(courseId);
    int next = existing.stream().mapToInt(m -> m.getOrderIndex() == null ? 0 : m.getOrderIndex())
        .max().orElse(0) + 1;
    Module m = new Module();
    m.setId(courseId + "-m" + next);
    m.setCourse(course);
    m.setTitle(req.title().trim());
    m.setOrderIndex(next);
    return ModuleDto.from(modules.save(m), 0, false);
  }

  @Transactional
  public ModuleDto updateModule(String moduleId, ModuleCreateRequest req) {
    Module m = findModuleOr404(moduleId);
    authz.requireOwnerOrAdmin(m.getCourse().getId());
    m.setTitle(req.title().trim());
    return ModuleDto.from(modules.save(m),
        lessons.countByModule_Id(moduleId), false);
  }

  @Transactional
  public void deleteModule(String moduleId) {
    Module m = findModuleOr404(moduleId);
    authz.requireOwnerOrAdmin(m.getCourse().getId());
    modules.delete(m);
  }

  @Transactional
  public List<ModuleDto> reorderModules(String courseId, List<String> orderedIds) {
    findCourseOr404(courseId);
    authz.requireOwnerOrAdmin(courseId);
    List<Module> existing = modules.findByCourse_IdOrderByOrderIndexAsc(courseId);
    requireSameIdSet(orderedIds, existing.stream().map(Module::getId).toList(), "module");
    List<Module> managed = orderedIds.stream()
        .map(oid -> modules.findById(oid).orElseThrow()).toList();
    // Two-phase: negatives first so UNIQUE(course_id, order_index) never collides mid-flight.
    for (int i = 0; i < managed.size(); i++) {
      managed.get(i).setOrderIndex(-(i + 1));
    }
    modules.saveAll(managed);
    modules.flush();
    for (int i = 0; i < managed.size(); i++) {
      managed.get(i).setOrderIndex(i + 1);
    }
    modules.saveAll(managed);
    return modulesForCourse(courseId);
  }

  @Transactional(readOnly = true)
  public List<LessonDto> lessonsForModule(String moduleId) {
    Module m = findModuleOr404(moduleId);
    boolean locked = lockedFor(m.getCourse().getId());
    return lessons.findByModule_IdOrderByOrderIndexAsc(moduleId).stream()
        .map(l -> LessonDto.from(l, locked)).toList();
  }

  @Transactional
  public LessonDto createLesson(String moduleId, LessonCreateRequest req) {
    Module m = findModuleOr404(moduleId);
    String courseId = m.getCourse().getId();
    authz.requireOwnerOrAdmin(courseId);
    Lesson l = new Lesson();
    l.setId(nextLessonId(courseId));
    l.setModule(m);
    l.setTitle(req.title().trim());
    l.setContent(req.content());
    l.setType(req.type() == null ? null : LessonType.valueOf(req.type()));
    l.setMeta(req.meta());
    l.setSizeBytes(req.sizeBytes());
    l.setFileUrl(req.fileUrl());
    List<Lesson> existing = lessons.findByModule_IdOrderByOrderIndexAsc(moduleId);
    int next = existing.stream().mapToInt(x -> x.getOrderIndex() == null ? 0 : x.getOrderIndex())
        .max().orElse(0) + 1;
    l.setOrderIndex(next);
    return LessonDto.from(lessons.save(l), false);
  }

  @Transactional
  public LessonDto updateLesson(String lessonId, LessonUpdateRequest req) {
    Lesson l = findLessonOr404(lessonId);
    authz.requireOwnerOrAdmin(l.getModule().getCourse().getId());
    if (req.title() != null) {
      l.setTitle(req.title().trim());
    }
    if (req.content() != null) {
      l.setContent(req.content());
    }
    if (req.type() != null) {
      l.setType(LessonType.valueOf(req.type()));
    }
    if (req.meta() != null) {
      l.setMeta(req.meta());
    }
    if (req.sizeBytes() != null) {
      l.setSizeBytes(req.sizeBytes());
    }
    if (req.fileUrl() != null) {
      l.setFileUrl(req.fileUrl());
    }
    return LessonDto.from(lessons.save(l), false);
  }

  @Transactional
  public void deleteLesson(String lessonId) {
    Lesson l = findLessonOr404(lessonId);
    authz.requireOwnerOrAdmin(l.getModule().getCourse().getId());
    lessons.delete(l);
  }

  @Transactional
  public List<LessonDto> reorderLessons(String moduleId, List<String> orderedIds) {
    Module m = findModuleOr404(moduleId);
    authz.requireOwnerOrAdmin(m.getCourse().getId());
    List<Lesson> existing = lessons.findByModule_IdOrderByOrderIndexAsc(moduleId);
    requireSameIdSet(orderedIds, existing.stream().map(Lesson::getId).toList(), "lesson");
    List<Lesson> managed = orderedIds.stream()
        .map(oid -> lessons.findById(oid).orElseThrow()).toList();
    for (int i = 0; i < managed.size(); i++) {
      managed.get(i).setOrderIndex(-(i + 1));
    }
    lessons.saveAll(managed);
    lessons.flush();
    for (int i = 0; i < managed.size(); i++) {
      managed.get(i).setOrderIndex(i + 1);
    }
    lessons.saveAll(managed);
    return lessonsForModule(moduleId);
  }

  @Transactional(readOnly = true)
  public List<LessonDto> lessonsByCourse(String courseId) {
    findCourseOr404(courseId);
    boolean locked = lockedFor(courseId);
    List<LessonDto> out = new ArrayList<>();
    for (Module m : modules.findByCourse_IdOrderByOrderIndexAsc(courseId)) {
      for (Lesson l : lessons.findByModule_IdOrderByOrderIndexAsc(m.getId())) {
        out.add(LessonDto.from(l, locked));
      }
    }
    return out;
  }

  // ---- helpers ----

  private Course findCourseOr404(String courseId) {
    return courses.findById(courseId)
        .orElseThrow(() -> ApiException.notFound("Course not found."));
  }

  private Module findModuleOr404(String moduleId) {
    return modules.findById(moduleId)
        .orElseThrow(() -> ApiException.notFound("Module not found."));
  }

  private Lesson findLessonOr404(String lessonId) {
    return lessons.findById(lessonId)
        .orElseThrow(() -> ApiException.notFound("Lesson not found."));
  }

  /** Students see locked materials until enrolled; owners/admins never lock. */
  private boolean lockedFor(String courseId) {
    User me = authz.currentUser();
    if (me.getRole() != Role.student) {
      return false;
    }
    return !enrollments.existsByStudent_IdAndCourse_Id(me.getId(), courseId);
  }

  private String nextLessonId(String courseId) {
    int max = 0;
    for (Lesson l : lessons.findByModule_Course_Id(courseId)) {
      String id = l.getId();
      int dash = id.lastIndexOf("-l");
      if (dash >= 0) {
        try {
          max = Math.max(max, Integer.parseInt(id.substring(dash + 2)));
        } catch (NumberFormatException ignored) {
          // custom ids never block generation
        }
      }
    }
    return courseId + "-l" + (max + 1);
  }

  private static void requireSameIdSet(List<String> orderedIds, List<String> actual, String kind) {
    if (orderedIds == null || new HashSet<>(orderedIds).size() != orderedIds.size()
        || !new HashSet<>(orderedIds).equals(new HashSet<>(actual))) {
      throw ApiException.badRequest("Invalid " + kind + " order.");
    }
  }
}
