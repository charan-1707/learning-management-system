package com.learnhub.lms.course;

import com.learnhub.lms.common.ApiException;
import com.learnhub.lms.common.Authz;
import com.learnhub.lms.common.PageResponse;
import com.learnhub.lms.content.ModuleRepository;
import com.learnhub.lms.enrollment.Enrollment;
import com.learnhub.lms.enrollment.EnrollmentDto;
import com.learnhub.lms.enrollment.EnrollmentRepository;
import com.learnhub.lms.enrollment.EnrollmentStatus;
import com.learnhub.lms.enrollment.EnrollmentWithCourse;
import com.learnhub.lms.user.Role;
import com.learnhub.lms.user.User;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Course CRUD with ownership + legacy-NULL-status handling (plan §8).
 * Students only ever see published (or legacy-NULL) courses; drafts are
 * owner/admin/enrolled-only. New ids stay URL-safe ({@code c7, c8…}).
 */
@Service
public class CourseService {

  private final CourseRepository courses;
  private final ModuleRepository modules;
  private final EnrollmentRepository enrollments;
  private final ObjectMapper json;
  private final Authz authz;

  public CourseService(CourseRepository courses, ModuleRepository modules,
      EnrollmentRepository enrollments, ObjectMapper json, Authz authz) {
    this.courses = courses;
    this.modules = modules;
    this.enrollments = enrollments;
    this.json = json;
    this.authz = authz;
  }

  @Transactional(readOnly = true)
  public PageResponse<CourseDto> list(String query, String status, String category,
      Long instructorId, int page, int size) {
    User me = authz.currentUser();
    List<Course> all = courses.findAll(Sort.by("name").ascending());
    List<CourseDto> rows = new ArrayList<>();
    for (Course c : all) {
      if (me.getRole() == Role.student && c.getStatus() == CourseStatus.draft) {
        continue;
      }
      if (status != null && !status.isBlank()
          && (c.getStatus() == null || !c.getStatus().name().equals(status.trim()))) {
        continue;
      }
      if (category != null && !category.isBlank()
          && (c.getCategory() == null || !c.getCategory().equalsIgnoreCase(category.trim()))) {
        continue;
      }
      if (instructorId != null && (c.getInstructor() == null
          || !c.getInstructor().getId().equals(instructorId))) {
        continue;
      }
      if (!matches(query, c.getName(), c.getCode(), c.getInstructorName(), c.getCategory())) {
        continue;
      }
      rows.add(CourseDto.from(c, modules.countByCourse_Id(c.getId())));
    }
    return paginate(rows, page, size);
  }

  @Transactional(readOnly = true)
  public CourseDto detail(String id) {
    Course c = findOr404(id);
    if (c.getStatus() == CourseStatus.draft) {
      User me = authz.currentUser();
      boolean owner = c.getInstructor() != null && c.getInstructor().getId().equals(me.getId());
      boolean enrolled = enrollments.existsByStudent_IdAndCourse_Id(me.getId(), id);
      if (me.getRole() != Role.admin && !owner && !enrolled) {
        throw ApiException.forbidden("Forbidden");
      }
    }
    return CourseDto.from(c, modules.countByCourse_Id(id));
  }

  @Transactional
  public CourseDto create(CourseCreateRequest req) {
    User me = authz.currentUser();
    if (me.getRole() != Role.faculty && me.getRole() != Role.admin) {
      throw ApiException.forbidden("Forbidden");
    }
    Course c = new Course();
    c.setId(nextCourseId());
    c.setCode(req.code());
    c.setName(req.name().trim());
    c.setShortName(req.shortName());
    c.setDescription(req.description());
    c.setCategory(req.category());
    c.setCredits(req.credits() == null ? 3 : req.credits());
    c.setSemester(req.semester());
    c.setInstructor(me);
    c.setInstructorName(me.getName());
    c.setAccent("blue");
    c.setStatus(req.status() == null ? CourseStatus.draft : CourseStatus.valueOf(req.status()));
    c.setOutcomesJson(writeOutcomes(req.outcomes()));
    c.setThumbnailUrl(req.thumbnailUrl());
    c.setStudentsCount(0);
    c.setCreatedAt(LocalDateTime.now());
    c.setUpdatedAt(LocalDateTime.now());
    return CourseDto.from(courses.save(c), 0);
  }

  @Transactional
  public CourseDto update(String id, CourseUpdateRequest req) {
    Course c = findOr404(id);
    authz.requireOwnerOrAdmin(id);
    if (req.code() != null) {
      c.setCode(req.code());
    }
    if (req.name() != null) {
      c.setName(req.name().trim());
    }
    if (req.shortName() != null) {
      c.setShortName(req.shortName());
    }
    if (req.description() != null) {
      c.setDescription(req.description());
    }
    if (req.category() != null) {
      c.setCategory(req.category());
    }
    if (req.credits() != null) {
      c.setCredits(req.credits());
    }
    if (req.semester() != null) {
      c.setSemester(req.semester());
    }
    // Display name shown on cards/details — stored exactly as typed
    // (capitals preserved); blank never wipes the existing value.
    if (req.instructorName() != null && !req.instructorName().isBlank()) {
      c.setInstructorName(req.instructorName().trim());
    }
    if (req.accent() != null) {
      c.setAccent(req.accent());
    }
    if (req.status() != null) {
      c.setStatus(CourseStatus.valueOf(req.status()));
    }
    if (req.outcomes() != null) {
      c.setOutcomesJson(writeOutcomes(req.outcomes()));
    }
    if (req.thumbnailUrl() != null) {
      c.setThumbnailUrl(req.thumbnailUrl().isBlank() ? null : req.thumbnailUrl().trim());
    }
    c.setUpdatedAt(LocalDateTime.now());
    return CourseDto.from(courses.save(c), modules.countByCourse_Id(id));
  }

  @Transactional
  public CourseDto setStatus(String id, CourseStatusRequest req) {
    Course c = findOr404(id);
    authz.requireOwnerOrAdmin(id);
    c.setStatus(CourseStatus.valueOf(req.status()));
    c.setUpdatedAt(LocalDateTime.now());
    return CourseDto.from(courses.save(c), modules.countByCourse_Id(id));
  }

  @Transactional
  public void delete(String id) {
    findOr404(id);
    authz.requireOwnerOrAdmin(id);
    courses.deleteById(id);
  }

  @Transactional(readOnly = true)
  public List<?> mine() {
    User me = authz.currentUser();
    if (me.getRole() == Role.student) {
      List<EnrollmentWithCourse> out = new ArrayList<>();
      for (Enrollment e : enrollments.findByStudent_Id(me.getId())) {
        Course c = e.getCourse();
        out.add(new EnrollmentWithCourse(EnrollmentDto.from(e),
            CourseDto.from(c, modules.countByCourse_Id(c.getId()))));
      }
      return out;
    }
    if (me.getRole() == Role.faculty) {
      return courses.findByInstructor_Id(me.getId()).stream()
          .map(c -> CourseDto.from(c, modules.countByCourse_Id(c.getId()))).toList();
    }
    return courses.findAll(Sort.by("name").ascending()).stream()
        .map(c -> CourseDto.from(c, modules.countByCourse_Id(c.getId()))).toList();
  }

  @Transactional(readOnly = true)
  public List<RosterRow> roster(String id) {
    findOr404(id);
    authz.requireOwnerOrAdmin(id);
    List<RosterRow> rows = new ArrayList<>();
    for (Enrollment e : enrollments.findByCourse_Id(id)) {
      User s = e.getStudent();
      rows.add(new RosterRow(s.getId(), s.getName(), s.getEmail(),
          e.getProgressPercent(), e.getStatus() == null ? null : e.getStatus().name()));
    }
    return rows;
  }

  // ---- helpers ----

  private String writeOutcomes(List<String> outcomes) {
    if (outcomes == null) {
      return null;
    }
    List<String> clean = outcomes.stream()
        .filter(s -> s != null && !s.isBlank())
        .map(String::trim)
        .toList();
    if (clean.isEmpty()) {
      return null;
    }
    try {
      return json.writeValueAsString(clean);
    } catch (JsonProcessingException ex) {
      throw ApiException.badRequest("Invalid outcomes.");
    }
  }

  private Course findOr404(String id) {
    return courses.findById(id).orElseThrow(() -> ApiException.notFound("Course not found."));
  }

  /** Next URL-safe id: c7, c8… (never collides, even after deletes). */
  private String nextCourseId() {
    int i = 7;
    while (courses.existsById("c" + i)) {
      i++;
    }
    return "c" + i;
  }

  private static boolean matches(String query, String... fields) {
    if (query == null || query.isBlank()) {
      return true;
    }
    String q = query.toLowerCase();
    for (String f : fields) {
      if (f != null && f.toLowerCase().contains(q)) {
        return true;
      }
    }
    return false;
  }

  private static PageResponse<CourseDto> paginate(List<CourseDto> rows, int page, int size) {
    int capped = Math.min(Math.max(size, 1), 100);
    int from = Math.min(Math.max(page, 0) * capped, rows.size());
    int to = Math.min(from + capped, rows.size());
    return new PageResponse<>(rows.subList(from, to), rows.size(), page, size);
  }
}
