package com.learnhub.lms.assignment;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/** Submit + grade loop (plan §9.6, rules §10.4/§10.7). */
@RestController
@Tag(name = "submissions", description = "Submit, inboxes and grading")
public class SubmissionController {

  private final SubmissionService service;

  public SubmissionController(SubmissionService service) {
    this.service = service;
  }

  @PostMapping("/api/assignments/{id}/submit")
  @Operation(summary = "Submit/upsert (enrolled, before due)")
  public ResponseEntity<Map<String, Object>> submit(@PathVariable String id,
      @Valid @RequestBody SubmitRequest req) {
    SubmissionDto dto = service.submit(id, req);
    return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("ok", true, "submission", dto));
  }

  @GetMapping("/api/assignments/{id}/submissions")
  @Operation(summary = "Assignment inbox, submittedAt DESC (owner/ADMIN)")
  public List<SubmissionDto> forAssignment(@PathVariable String id) {
    return service.forAssignment(id);
  }

  @GetMapping("/api/courses/{id}/submissions")
  @Operation(summary = "Course submissions; ?ungraded=1 filters pending (owner/ADMIN)")
  public List<SubmissionDto> forCourse(@PathVariable String id,
      @RequestParam(name = "ungraded", defaultValue = "0") String ungraded) {
    return service.forCourse(id, "1".equals(ungraded));
  }

  @GetMapping("/api/students/me/submissions")
  @Operation(summary = "Own submissions, optional ?assignmentId= (self)")
  public List<SubmissionDto> mine(@RequestParam(required = false) String assignmentId) {
    return service.mine(assignmentId);
  }

  @PostMapping("/api/submissions/{id}/grade")
  @Operation(summary = "Grade + write grade row (owner/ADMIN, pair validated)")
  public Map<String, Object> grade(@PathVariable String id,
      @Valid @RequestBody GradeRequest req) {
    SubmissionDto dto = service.grade(id, req);
    return Map.of("ok", true, "submission", dto);
  }
}
