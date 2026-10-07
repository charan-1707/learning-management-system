package com.learnhub.lms.content;

import com.learnhub.lms.enrollment.EnrollmentService;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/** Lessons + completion (plan §9.4–§9.5). */
@RestController
@Tag(name = "lessons", description = "Lessons, ordering and completion")
public class LessonController {

  private final ContentService content;
  private final EnrollmentService enrollments;

  public LessonController(ContentService content, EnrollmentService enrollments) {
    this.content = content;
    this.enrollments = enrollments;
  }

  @GetMapping("/api/modules/{id}/lessons")
  @Operation(summary = "Lessons in ASC order (content hidden when locked)")
  public List<LessonDto> forModule(@PathVariable String id) {
    return content.lessonsForModule(id);
  }

  @PostMapping("/api/modules/{id}/lessons")
  @Operation(summary = "Append lesson (owner/ADMIN)")
  public ResponseEntity<LessonDto> create(@PathVariable String id,
      @Valid @RequestBody LessonCreateRequest req) {
    return ResponseEntity.status(HttpStatus.CREATED).body(content.createLesson(id, req));
  }

  @PutMapping("/api/modules/{id}/lessons/reorder")
  @Operation(summary = "Rewrite order_index=idx+1 (owner/ADMIN)")
  public List<LessonDto> reorder(@PathVariable String id,
      @Valid @RequestBody ReorderRequest req) {
    return content.reorderLessons(id, req.orderedIds());
  }

  @PatchMapping("/api/lessons/{id}")
  @Operation(summary = "Update lesson (owner/ADMIN)")
  public LessonDto update(@PathVariable String id,
      @Valid @RequestBody LessonUpdateRequest req) {
    return content.updateLesson(id, req);
  }

  @DeleteMapping("/api/lessons/{id}")
  @Operation(summary = "Delete lesson, progress rows cascade (owner/ADMIN)")
  public Map<String, Object> delete(@PathVariable String id) {
    content.deleteLesson(id);
    return Map.of("ok", true);
  }

  @GetMapping("/api/courses/{id}/lessons")
  @Operation(summary = "All course lessons (X-Total-Count header)")
  public ResponseEntity<List<LessonDto>> byCourse(@PathVariable String id) {
    List<LessonDto> body = content.lessonsByCourse(id);
    return ResponseEntity.ok().header("X-Total-Count", String.valueOf(body.size())).body(body);
  }

  @PostMapping("/api/lessons/{id}/complete")
  @Operation(summary = "Mark complete, idempotent (self, must be enrolled)")
  public Map<String, Object> complete(@PathVariable String id) {
    return enrollments.completeLesson(id);
  }
}
