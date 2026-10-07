package com.learnhub.lms.common;

import com.learnhub.lms.course.CourseRepository;
import com.learnhub.lms.enrollment.EnrollmentRepository;
import com.learnhub.lms.user.Role;
import com.learnhub.lms.user.User;
import com.learnhub.lms.user.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Central authorization helper (plan §7, §13). All ownership / role checks live
 * here; services call it, controllers stay thin. Ownership mirrors the
 * frontend: {@code course.instructor_id == jwt.id}, admin bypasses everything.
 */
@Component
public class Authz {

  private final UserRepository users;
  private final CourseRepository courses;
  private final EnrollmentRepository enrollments;

  public Authz(UserRepository users, CourseRepository courses, EnrollmentRepository enrollments) {
    this.users = users;
    this.courses = courses;
    this.enrollments = enrollments;
  }

  /** JWT subject = user id (set by {@code JwtAuthFilter}). Null when anonymous. */
  public Long currentUserId() {
    var auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
      return null;
    }
    try {
      return Long.valueOf(auth.getName());
    } catch (NumberFormatException ex) {
      return null;
    }
  }

  public User currentUser() {
    Long id = currentUserId();
    if (id == null) {
      throw ApiException.unauthorized("Unauthorized");
    }
    return users.findById(id).orElseThrow(() -> ApiException.unauthorized("Unauthorized"));
  }

  public void requireAdmin() {
    User me = currentUser();
    if (me.getRole() != Role.admin) {
      throw ApiException.forbidden("Forbidden");
    }
  }

  public void requireOwnerOrAdmin(String courseId) {
    User me = currentUser();
    if (me.getRole() == Role.admin) {
      return;
    }
    var course = courses.findById(courseId)
        .orElseThrow(() -> ApiException.notFound("Course not found."));
    if (course.getInstructor() == null || !course.getInstructor().getId().equals(me.getId())) {
      throw ApiException.forbidden("Forbidden");
    }
  }

  public void requireEnrolledOrOwnerOrAdmin(String courseId) {
    User me = currentUser();
    if (me.getRole() == Role.admin) {
      return;
    }
    var course = courses.findById(courseId)
        .orElseThrow(() -> ApiException.notFound("Course not found."));
    boolean owner = course.getInstructor() != null && course.getInstructor().getId().equals(me.getId());
    if (owner || enrollments.existsByStudent_IdAndCourse_Id(me.getId(), courseId)) {
      return;
    }
    throw ApiException.forbidden("Forbidden");
  }
}
