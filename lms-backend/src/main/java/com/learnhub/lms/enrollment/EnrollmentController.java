package com.learnhub.lms.enrollment;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/** Enrollments & progress (plan §9.5). */
@RestController
@Tag(name = "enrollments", description = "Enrollment and progress")
public class EnrollmentController {

  private final EnrollmentService service;

  public EnrollmentController(EnrollmentService service) {
    this.service = service;
  }

  @PostMapping("/api/courses/{id}/enroll")
  @Operation(summary = "Enroll (student; 400 when already enrolled or not open)")
  public ResponseEntity<Map<String, Object>> enroll(@PathVariable String id) {
    return ResponseEntity.status(HttpStatus.CREATED).body(service.enroll(id));
  }

  @GetMapping("/api/courses/{id}/enrollments")
  @Operation(summary = "Course enrollments (owner/ADMIN)")
  public List<EnrollmentDto> forCourse(@PathVariable String id) {
    return service.enrollmentsForCourse(id);
  }

  @GetMapping("/api/students/me/enrollments")
  @Operation(summary = "Own enrollments with courses (self)")
  public List<EnrollmentWithCourse> mine() {
    return service.myEnrollments();
  }

  @GetMapping("/api/courses/{id}/progress")
  @Operation(summary = "Progress {total,completed,percent}, persisted (self/owner/ADMIN)")
  public ProgressDto progress(@PathVariable String id,
      @RequestParam(required = false) Long studentId) {
    return service.progress(id, studentId);
  }
}
