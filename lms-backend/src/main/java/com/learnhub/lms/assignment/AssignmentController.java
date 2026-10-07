package com.learnhub.lms.assignment;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/** Assignments (plan §9.6). Writes are owner/ADMIN; reads add per-student status. */
@RestController
@Tag(name = "assignments", description = "Assignments and own-status lists")
public class AssignmentController {

  private final AssignmentService service;

  public AssignmentController(AssignmentService service) {
    this.service = service;
  }

  @GetMapping("/api/courses/{id}/assignments")
  @Operation(summary = "Course assignments, due DESC (enrolled/owner/admin)")
  public List<AssignmentDto> forCourse(@PathVariable String id) {
    return service.forCourse(id);
  }

  @PostMapping("/api/courses/{id}/assignments")
  @Operation(summary = "Create assignment (owner/ADMIN)")
  public ResponseEntity<AssignmentDto> create(@PathVariable String id,
      @Valid @RequestBody AssignmentCreateRequest req) {
    return ResponseEntity.status(HttpStatus.CREATED).body(service.create(id, req));
  }

  @GetMapping("/api/assignments/{id}")
  @Operation(summary = "Assignment detail")
  public AssignmentDto get(@PathVariable String id) {
    return service.get(id);
  }

  @PatchMapping("/api/assignments/{id}")
  @Operation(summary = "Update assignment (owner/ADMIN)")
  public AssignmentDto update(@PathVariable String id,
      @Valid @RequestBody AssignmentUpdateRequest req) {
    return service.update(id, req);
  }

  @DeleteMapping("/api/assignments/{id}")
  @Operation(summary = "Delete assignment, submissions cascade (owner/ADMIN)")
  public Map<String, Object> delete(@PathVariable String id) {
    service.delete(id);
    return Map.of("ok", true);
  }

  @GetMapping("/api/students/me/assignments")
  @Operation(summary = "Own assignments with ownStatus (optional ?status= filter)")
  public List<AssignmentDto> mine(@RequestParam(required = false) String status) {
    return service.myAssignments(status);
  }
}
